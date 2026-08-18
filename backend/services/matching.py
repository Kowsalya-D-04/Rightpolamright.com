"""Smart Load Matching engine.

Two stages:
  1. HARD FILTERS  -- eliminate anything that cannot legally/physically do the job.
  2. WEIGHTED SCORE -- rank whatever survives.

Every input comes from the database. Nothing is hardcoded or mocked.
"""
import json
from datetime import date, datetime, timedelta

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from models import (
    Document, Driver, DriverAvailability, DriverAvailabilitySlot, LoadMatch, LoadRequest,
    Trip, Truck,
)
from services.geo import resolve_point, road_distance_km
from services.pricing import calculate_fare

# --- Tunable weights (must total 100) -------------------------------------
WEIGHTS = {
    "pickup_proximity": 25,
    "route_compatibility": 25,
    "truck_type": 15,
    "capacity_utilization": 10,
    "schedule_fit": 10,
    "driver_rating": 10,
    "price_competitiveness": 5,
}

# Trip states that still occupy a driver
ACTIVE_TRIP_STATES = (
    "Assigned", "Pickup Reached", "Loading", "In Transit", "Reached",
)

# A trailer can carry what an open truck carries, but not vice versa.
TYPE_SUBSTITUTES = {
    "Open Truck": ["Tipper", "Trailer"],
    "Container": ["Trailer"],
    "Trailer": [],
    "Tipper": ["Open Truck"],
    "Tanker": [],
}

# Beyond this a repositioning trip stops being commercially sensible.
MAX_PICKUP_DISTANCE_KM = 250


def _distance_score(distance_km: float) -> float:
    """1.0 at the pickup gate, decaying to 0 at the search radius."""
    if distance_km is None:
        return 0.3
    if distance_km <= 10:
        return 1.0
    if distance_km >= MAX_PICKUP_DISTANCE_KM:
        return 0.0
    return round(1 - ((distance_km - 10) / (MAX_PICKUP_DISTANCE_KM - 10)), 4)


def _capacity_score(capacity: float, weight: float) -> float:
    """Reward a snug fit. A 25T truck on a 5T load is legal but wasteful."""
    if not capacity or not weight or capacity < weight:
        return 0.0
    utilisation = weight / capacity
    if utilisation >= 0.95:
        return 0.85          # very tight, little margin for error
    if utilisation >= 0.7:
        return 1.0           # the sweet spot
    if utilisation >= 0.5:
        return 0.75
    return max(0.35, utilisation)


def _rating_score(rating: float) -> float:
    if not rating:
        return 0.5
    return max(0.0, min(1.0, (rating - 3.0) / 2.0))   # 3.0 -> 0, 5.0 -> 1


def _availability_score(driver: Driver, truck: Truck) -> float:
    score = 0.0
    score += {"Online": 0.6, "Offline": 0.25}.get(driver.status, 0.0)
    score += 0.4 if truck.status == "Available" else 0.0
    return round(min(score, 1.0), 4)


def published_slot(db: Session, driver: Driver, required_date: date, truck_id: int = None):
    """Return an active slot covering the date for this driver/truck.

    A slot can be published for one specific truck. Legacy slots with no
    truck_id remain valid for any truck belonging to the same driver.
    """
    q = (db.query(DriverAvailabilitySlot)
         .filter(DriverAvailabilitySlot.driver_id == driver.id,
                 DriverAvailabilitySlot.is_active.is_(True),
                 DriverAvailabilitySlot.status == "DRIVER_AVAILABLE"))
    if required_date:
        q = q.filter(DriverAvailabilitySlot.available_from <= required_date,
                     DriverAvailabilitySlot.available_to >= required_date)
    if truck_id:
        q = q.filter(or_(DriverAvailabilitySlot.truck_id == truck_id,
                         DriverAvailabilitySlot.truck_id.is_(None)))
        # Prefer a slot explicitly published for this truck over a legacy
        # generic slot.
        q = q.order_by(DriverAvailabilitySlot.truck_id.desc())
    return q.first()


def _date_score(db: Session, driver: Driver, required_date: date, required_time: str = None,
                truck_id: int = None) -> float:
    """Require an explicit DRIVER_AVAILABLE slot covering the requested date/time."""
    if not required_date:
        return 0.0

    slot = published_slot(db, driver, required_date, truck_id)
    if not slot:
        return 0.0
    if required_time:
        start = slot.available_from_time or "00:00"
        end = slot.available_to_time or "23:59"
        if required_date == slot.available_from and required_time < start:
            return 0.0
        if required_date == slot.available_to and required_time > end:
            return 0.0

    blocked = (
        db.query(DriverAvailability)
        .filter(
            DriverAvailability.driver_id == driver.id,
            DriverAvailability.unavailable_date == required_date,
        )
        .first()
    )
    if blocked:
        return 0.0

    active = (
        db.query(Trip)
        .filter(Trip.driver_id == driver.id, Trip.status.in_(ACTIVE_TRIP_STATES))
        .first()
    )
    if not active:
        return 1.0

    # Occupied now, but the request may be far enough out to still work.
    if active.end_date and active.end_date.date() <= required_date:
        return 0.8
    days_out = (required_date - date.today()).days
    return 0.5 if days_out >= 3 else 0.0


def _route_score(load: LoadRequest, driver: Driver) -> float:
    """Bonus when the driver already sits between pickup and drop."""
    p = resolve_point(load.pickup_location, load.pickup_lat, load.pickup_lng)
    d = resolve_point(load.drop_location, load.drop_lat, load.drop_lng)
    dr = resolve_point(driver.current_location, driver.current_lat, driver.current_lng)
    if None in (p[0], d[0], dr[0]):
        return 0.5

    direct = road_distance_km(p[0], p[1], d[0], d[1]) or 0
    via = (road_distance_km(dr[0], dr[1], p[0], p[1]) or 0) + direct
    if not direct:
        return 0.5
    detour_ratio = (via - direct) / direct
    if detour_ratio <= 0.05:
        return 1.0
    if detour_ratio >= 1.0:
        return 0.1
    return round(1 - detour_ratio, 4)


def _preferred_drop_score(load: LoadRequest, slot: DriverAvailabilitySlot) -> float:
    """How closely the load destination follows the driver's declared route.

    No preferred destination means the driver accepts any route. When a
    destination is supplied, it becomes a genuine compatibility signal rather
    than display-only metadata.
    """
    if not slot or not slot.preferred_drop:
        return 0.85
    load_drop = resolve_point(load.drop_location, load.drop_lat, load.drop_lng)
    preferred = resolve_point(slot.preferred_drop, slot.preferred_drop_lat, slot.preferred_drop_lng)
    if None in (load_drop[0], load_drop[1], preferred[0], preferred[1]):
        return 1.0 if slot.preferred_drop.strip().lower() in load.drop_location.strip().lower() else 0.5
    delta = road_distance_km(load_drop[0], load_drop[1], preferred[0], preferred[1])
    if delta is None or delta <= 25:
        return 1.0
    if delta <= 75:
        return 0.85
    if delta <= 150:
        return 0.6
    return 0.0


def _grade(score: float) -> str:
    if score >= 93:
        return "Best Match"
    if score >= 88:
        return "Excellent"
    if score >= 80:
        return "Very Good"
    if score >= 70:
        return "Good"
    return "Fair"


def _documents_valid(db: Session, driver: Driver, truck: Truck) -> bool:
    """Reject expired/rejected compliance documents without inventing documents.

    Registration fields (licence/insurance) are authoritative when document rows
    have not yet been uploaded. Any explicit rejected/expired document blocks matching.
    """
    today = date.today()
    if driver.license_expiry and driver.license_expiry < today:
        return False
    for expiry in (truck.insurance_expiry, truck.fitness_expiry, truck.permit_expiry, truck.pollution_expiry):
        if expiry and expiry < today:
            return False
    docs = db.query(Document).filter(
        or_(
            (Document.owner_type == "driver") & (Document.owner_id == driver.id),
            (Document.owner_type == "truck") & (Document.owner_id == truck.id),
        )
    ).all()
    return not any(d.status == "Rejected" or (d.expiry_date and d.expiry_date < today) for d in docs)


def _price_score(candidate_fare: float, customer_estimate: float) -> float:
    if not candidate_fare or not customer_estimate:
        return 0.8
    ratio = candidate_fare / customer_estimate
    if ratio <= 1.0: return 1.0
    if ratio <= 1.05: return 0.9
    if ratio <= 1.10: return 0.75
    if ratio <= 1.20: return 0.5
    return 0.2


def find_matches(db: Session, load: LoadRequest, limit: int = 10, persist: bool = True):
    """Rank every eligible driver+truck pair for a load request."""
    pickup = resolve_point(load.pickup_location, load.pickup_lat, load.pickup_lng)
    rejected_driver_ids = {
        row[0] for row in db.query(LoadMatch.driver_id).filter(
            LoadMatch.load_request_id == load.id, LoadMatch.response_status == "REJECTED").all()
    }

    # Drivers occupied by a live trip -- excluded up front (rule 4).
    busy_driver_ids = {
        row[0]
        for row in db.query(Trip.driver_id).filter(Trip.status.in_(ACTIVE_TRIP_STATES)).all()
    }
    busy_truck_ids = {
        row[0]
        for row in db.query(Trip.truck_id).filter(Trip.status.in_(ACTIVE_TRIP_STATES)).all()
    }

    acceptable_types = [load.truck_type] + TYPE_SUBSTITUTES.get(load.truck_type, [])

    # --- Stage 1: hard filters, pushed into SQL where possible ------------
    candidates = (
        db.query(Truck)
        .options(joinedload(Truck.driver))
        .join(Driver, Truck.driver_id == Driver.id)
        .filter(
            Truck.capacity_ton >= load.weight_ton,          # rule 1
            Truck.truck_type.in_(acceptable_types),          # rule 2
            Truck.status.in_(["Available", "Busy"]),
            Truck.is_verified.is_(True),                     # rule 5
            Driver.is_active.is_(True),                      # rule 5
            Driver.is_verified.is_(True),                    # rule 5
            Driver.status == "Online",                       # explicit availability ON
            Driver.kyc_status == "Verified",
        )
        .all()
    )

    results = []
    for truck in candidates:
        driver = truck.driver
        if not driver or driver.id in rejected_driver_ids:
            continue
        if not _documents_valid(db, driver, truck):
            continue
        if driver.id in busy_driver_ids or truck.id in busy_truck_ids:
            continue                                         # rule 4

        slot = published_slot(db, driver, load.required_date, truck.id)
        if not slot:
            continue
        effective_capacity = slot.available_capacity_ton if slot.available_capacity_ton is not None else truck.capacity_ton
        if effective_capacity < load.weight_ton:
            continue
        dr = resolve_point(slot.from_location or driver.current_location,
                           slot.from_lat if slot.from_lat is not None else driver.current_lat,
                           slot.from_lng if slot.from_lng is not None else driver.current_lng)
        distance = road_distance_km(pickup[0], pickup[1], dr[0], dr[1]) if pickup[0] and dr[0] else None
        max_pickup = min(float(slot.max_distance_km or MAX_PICKUP_DISTANCE_KM), MAX_PICKUP_DISTANCE_KM)
        if distance is not None and distance > max_pickup:
            continue                                         # rule 6

        date_component = _date_score(db, driver, load.required_date, load.required_time, truck.id)
        if date_component == 0.0:
            continue                                         # rule 7

        preferred_route = _preferred_drop_score(load, slot)
        if slot.preferred_drop and preferred_route == 0.0:
            continue                                         # declared destination is incompatible

        # --- Stage 2: blueprint weighted score --------------------------
        fare = calculate_fare(
            db,
            pickup=load.pickup_location,
            drop=load.drop_location,
            weight_ton=load.weight_ton,
            truck_type=truck.truck_type,
            distance_km=load.distance_km,
        )
        components = {
            "pickup_proximity": _distance_score(distance),
            "route_compatibility": round((_route_score(load, driver) + preferred_route) / 2, 4),
            "truck_type": 1.0 if truck.truck_type == load.truck_type else 0.7,
            "capacity_utilization": _capacity_score(effective_capacity, load.weight_ton),
            "schedule_fit": date_component,
            "driver_rating": _rating_score(driver.rating),
            "price_competitiveness": _price_score(fare["total_amount"], load.estimated_fare),
        }
        score = round(min(sum(components[k] * WEIGHTS[k] for k in WEIGHTS), 100.0), 1)
        if score < 60:
            continue

        breakdown = {
            k: {"score": round(components[k], 3), "weight": WEIGHTS[k],
                "points": round(components[k] * WEIGHTS[k], 2)}
            for k in WEIGHTS
        }

        results.append({
            "has_published_availability": True,
            "availability_window": {
                "from": slot.available_from, "to": slot.available_to,
                "from_time": slot.available_from_time, "to_time": slot.available_to_time,
                "from_location": slot.from_location, "preferred_drop": slot.preferred_drop,
            },
            "driver_id": driver.id,
            "driver_code": driver.code,
            "driver_name": driver.name,
            "driver_phone": driver.phone,
            "driver_rating": driver.rating,
            "driver_status": driver.status,
            "driver_total_trips": driver.total_trips,
            "truck_id": truck.id,
            "truck_number": truck.truck_number,
            "truck_type": truck.truck_type,
            "truck_model": truck.model,
            "truck_capacity": truck.capacity_ton,
            "truck_status": truck.status,
            "current_location": driver.current_location,
            "current_lat": dr[0],
            "current_lng": dr[1],
            "distance_from_pickup_km": distance,
            "estimated_fare": fare["total_amount"],
            "fare_breakdown": fare,
            "match_score": score,
            "grade": _grade(score),
            "availability_label": "Available now" if driver.status == "Online" and truck.status == "Available" else driver.status,
            "score_breakdown": breakdown,
        })

    results.sort(key=lambda r: (-r["match_score"], r["distance_from_pickup_km"] or 9999))
    results = results[:limit]

    if persist:
        db.query(LoadMatch).filter(
            LoadMatch.load_request_id == load.id,
            LoadMatch.response_status != "REJECTED"
        ).delete(synchronize_session=False)
        for r in results:
            db.add(LoadMatch(
                load_request_id=load.id,
                driver_id=r["driver_id"],
                truck_id=r["truck_id"],
                match_score=r["match_score"],
                distance_km=r["distance_from_pickup_km"],
                estimated_fare=r["estimated_fare"],
                score_breakdown=json.dumps(r["score_breakdown"]),
            ))
        db.commit()

    return results
