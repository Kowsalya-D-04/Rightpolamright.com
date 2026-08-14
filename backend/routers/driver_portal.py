"""Endpoints for the signed-in driver."""
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import (
    Document, Driver, DriverAvailabilitySlot, Invoice, LoadMatch, LoadRequest,
    Notification, Payment, Trip, TripLocation, Truck,
)
from schemas import AvailabilitySlotCreate, AvailabilitySlotOut, LocationUpdate, TripStatusUpdate
from services.geo import geocode, resolve_point, road_distance_km
from services.matching import (
    ACTIVE_TRIP_STATES, MAX_PICKUP_DISTANCE_KM, TYPE_SUBSTITUTES, find_matches, published_slot,
)
from services.notifications import notify
from services.workflow import set_workflow, sync_from_trip
from services.pricing import calculate_fare
from utils.security import require_driver

router = APIRouter(prefix="/api/driver", tags=["Driver Portal"])

FLOW = ["Assigned", "Pickup Reached", "Loading", "In Transit", "Reached", "Delivered"]

# The driver app sends uppercase tokens; the database stores display names.
# Both are accepted so neither client has to know the other's vocabulary.
STATUS_ALIASES = {
    "ASSIGNED": "Assigned",
    "PICKED_UP": "Pickup Reached",
    "PICKUP_REACHED": "Pickup Reached",
    "LOADING": "Loading",
    "IN_TRANSIT": "In Transit",
    "REACHED": "Reached",
    "NEAR_DESTINATION": "Reached",
    "DELIVERED": "Delivered",
    "COMPLETED": "Delivered",
    "CANCELLED": "Cancelled",
    "CANCELED": "Cancelled",
}


def _me(db: Session, user) -> Driver:
    d = db.query(Driver).filter(Driver.user_id == user.id).first()
    if not d:
        raise HTTPException(404, "No driver profile is linked to this account.")
    return d


def _truck_of(db: Session, driver: Driver) -> Truck | None:
    return db.query(Truck).filter(Truck.driver_id == driver.id).order_by(Truck.id).first()


def _matched_truck(db: Session, driver: Driver, match: LoadMatch | None) -> Truck | None:
    """Return the exact truck persisted on the match, never an arbitrary first truck."""
    if match and match.truck_id:
        return db.query(Truck).filter(Truck.id == match.truck_id,
                                      Truck.driver_id == driver.id).first()
    return _truck_of(db, driver)


def _trip_out(t: Trip) -> dict:
    l = t.load_request
    return {
        "id": t.id, "code": t.code, "status": t.status,
        "load_id": l.id, "load_code": l.code,
        "pickup_location": l.pickup_location, "drop_location": l.drop_location,
        "pickup_lat": l.pickup_lat, "pickup_lng": l.pickup_lng,
        "drop_lat": l.drop_lat, "drop_lng": l.drop_lng,
        "weight_ton": l.weight_ton, "distance_km": l.distance_km,
        "load_type": l.load_type,
        "customer_name": l.customer.name if l.customer else None,
        "customer_phone": l.customer.phone if l.customer else None,
        "truck_number": t.truck.truck_number if t.truck else None,
        "offered_fare": t.offered_fare, "advance_amount": t.advance_amount,
        "eta_minutes": t.eta_minutes, "start_date": t.start_date, "end_date": t.end_date,
        "current_lat": t.current_lat, "current_lng": t.current_lng,
        "message_to_driver": t.message_to_driver,
        "required_date": l.required_date, "required_time": l.required_time,
    }


def _publish_best_offer(db: Session, load: LoadRequest):
    """Recalculate a waiting load and offer it to the current best real driver."""
    matches = find_matches(db, load, limit=5, persist=True)
    if not matches:
        set_workflow(load, "LOAD_REQUESTED")
        db.commit()
        return None

    top = matches[0]
    set_workflow(load, "DRIVER_MATCHED")
    db.commit()

    n = notify(
        db, "Load Matched", f"New load matched to you -- {load.code}",
        f"{load.pickup_location} to {load.drop_location}, {load.weight_ton}T, "
        f"pickup {load.required_date} {load.required_time}. Match score {top['match_score']}/100.",
        "load_request", load.id, recipient_role="driver", commit=False,
    )
    n.driver_id = top["driver_id"]
    c = notify(
        db, "Driver Matched", f"We found a driver for {load.code}",
        "A compatible available driver has been offered your load. Waiting for driver acceptance.",
        "load_request", load.id, recipient_role="customer", commit=False,
    )
    c.customer_id = load.customer_id
    notify(
        db, "Automatic Match", f"{load.code} matched automatically",
        f"{top['driver_name']} / {top['truck_number']} scored {top['match_score']}/100.",
        "load_request", load.id, commit=False,
    )
    db.commit()
    return top


def _match_waiting_loads(db: Session, driver_id: int) -> int:
    """Run real matching when a driver becomes available.

    Only genuine pending customer requests are examined. The matching engine
    still ranks all currently available drivers, so publishing availability
    never guarantees or fakes a match for the driver who triggered the run.
    """
    waiting = (db.query(LoadRequest)
               .filter(LoadRequest.status == "Pending",
                       LoadRequest.workflow_status == "LOAD_REQUESTED")
               .order_by(LoadRequest.required_date, LoadRequest.id).all())
    offered_to_driver = 0
    for load in waiting:
        top = _publish_best_offer(db, load)
        if top and top["driver_id"] == driver_id:
            offered_to_driver += 1
    return offered_to_driver


def _release_pending_offers(db: Session, driver: Driver):
    """If availability is switched OFF, release unaccepted offers and rematch."""
    rows = (db.query(LoadMatch)
            .join(LoadRequest, LoadRequest.id == LoadMatch.load_request_id)
            .filter(LoadMatch.driver_id == driver.id,
                    LoadMatch.response_status == "PENDING",
                    LoadRequest.status == "Pending",
                    LoadRequest.workflow_status == "DRIVER_MATCHED").all())
    load_ids = {r.load_request_id for r in rows}
    for load_id in load_ids:
        load = db.query(LoadRequest).get(load_id)
        if load:
            set_workflow(load, "LOAD_REQUESTED")
            db.commit()
            _publish_best_offer(db, load)


@router.get("/profile")
def profile(db: Session = Depends(get_db), user=Depends(require_driver)):
    d = _me(db, user)
    truck = _truck_of(db, d)
    return {
        "driver": {c.name: getattr(d, c.name) for c in Driver.__table__.columns},
        "truck": ({c.name: getattr(truck, c.name) for c in Truck.__table__.columns}
                  if truck else None),
    }


@router.get("/trucks")
def my_trucks(db: Session = Depends(get_db), user=Depends(require_driver)):
    """Real trucks registered to the signed-in driver, for availability selection."""
    d = _me(db, user)
    rows = (db.query(Truck).filter(Truck.driver_id == d.id).order_by(Truck.id).all())
    return [{
        "id": t.id, "truck_number": t.truck_number, "truck_type": t.truck_type,
        "capacity_ton": t.capacity_ton, "status": t.status, "is_verified": t.is_verified,
    } for t in rows]


@router.put("/status")
def set_online(payload: dict, db: Session = Depends(get_db), user=Depends(require_driver)):
    """Driver toggles their own Online/Offline availability."""
    d = _me(db, user)
    wanted = payload.get("status")
    if wanted not in ("Online", "Offline"):
        raise HTTPException(400, "Status must be Online or Offline.")
    if d.status == "Busy":
        raise HTTPException(400, "You are on an active trip. Finish it before going offline.")
    if wanted == "Online" and (d.kyc_status != "Verified" or not d.is_verified):
        raise HTTPException(403, "Admin must verify your driver account before Availability can be turned ON.")
    d.status = wanted
    db.commit()
    if wanted == "Online":
        matched = _match_waiting_loads(db, d.id)
        return {"status": d.status, "matched_loads": matched}
    _release_pending_offers(db, d)
    return {"status": d.status, "matched_loads": 0}


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user=Depends(require_driver)):
    d = _me(db, user)
    today = date.today()
    trips = db.query(Trip).filter(Trip.driver_id == d.id).all()
    todays = [t for t in trips if t.start_date and t.start_date.date() == today]
    completed = [t for t in trips if t.status == "Delivered"]

    todays_earnings = float(
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .join(Trip, Payment.trip_id == Trip.id)
        .filter(Trip.driver_id == d.id, Payment.status == "Paid",
                func.date(Payment.paid_at) == str(today)).scalar() or 0)

    active = [t for t in trips if t.status in ACTIVE_TRIP_STATES]
    return {
        "driver": {"name": d.name, "code": d.code, "status": d.status,
                   "rating": d.rating, "kyc_status": d.kyc_status,
                   "is_verified": d.is_verified},
        "stats": {
            "todays_trips": len(todays), "completed_trips": len(completed),
            "todays_earnings": todays_earnings, "total_trips": d.total_trips or 0,
            "status": d.status,
        },
        "schedule": [_trip_out(t) for t in sorted(active, key=lambda x: x.id)],
    }


@router.get("/available-loads")
def available_loads(db: Session = Depends(get_db), user=Depends(require_driver)):
    """Return real load offers currently matched to this signed-in driver.

    The persisted LoadMatch is the source of truth, including the exact truck
    selected by the matching engine. This avoids the old first-truck bug.
    """
    d = _me(db, user)
    if d.kyc_status != "Verified" or not d.is_verified:
        return {"eligible": False,
                "reason": "Your driver account is awaiting Admin verification.",
                "matched_count": 0, "loads": []}
    if d.status != "Online":
        return {"eligible": False,
                "reason": "Set Availability to ON and publish an availability slot to receive matching loads.",
                "matched_count": 0, "loads": []}
    if db.query(Trip).filter(Trip.driver_id == d.id,
                             Trip.status.in_(ACTIVE_TRIP_STATES)).first():
        return {"eligible": False,
                "reason": "You are on an active trip. Finish it to see new loads.",
                "matched_count": 0, "loads": []}

    # Only offers actually persisted for this driver are returned.
    offer_rows = (db.query(LoadMatch)
                  .join(LoadRequest, LoadRequest.id == LoadMatch.load_request_id)
                  .filter(LoadMatch.driver_id == d.id,
                          LoadMatch.response_status == "PENDING",
                          LoadRequest.status == "Pending",
                          LoadRequest.workflow_status == "DRIVER_MATCHED")
                  .order_by(LoadMatch.match_score.desc(), LoadMatch.id.asc()).all())

    # For each load only the highest-ranked pending offer is actionable.
    top_rows = []
    for offer in offer_rows:
        top = (db.query(LoadMatch)
               .filter(LoadMatch.load_request_id == offer.load_request_id,
                       LoadMatch.response_status == "PENDING")
               .order_by(LoadMatch.match_score.desc(), LoadMatch.id.asc()).first())
        if top and top.id == offer.id:
            top_rows.append(offer)

    out = []
    for match in top_rows:
        l = db.query(LoadRequest).get(match.load_request_id)
        truck = _matched_truck(db, d, match)
        if not l or not truck:
            continue
        if not truck.is_verified or truck.status != "Available":
            continue

        slot = published_slot(db, d, l.required_date, truck.id)
        if not slot:
            continue
        here = resolve_point(
            slot.from_location or d.current_location,
            slot.from_lat if slot.from_lat is not None else d.current_lat,
            slot.from_lng if slot.from_lng is not None else d.current_lng,
        )
        pickup = resolve_point(l.pickup_location, l.pickup_lat, l.pickup_lng)
        away = road_distance_km(here[0], here[1], pickup[0], pickup[1]) if here[0] is not None and pickup[0] is not None else None
        max_pickup = min(float(slot.max_distance_km or MAX_PICKUP_DISTANCE_KM), MAX_PICKUP_DISTANCE_KM)
        if away is not None and away > max_pickup:
            continue

        out.append({
            "id": l.id, "code": l.code,
            "pickup_location": l.pickup_location, "drop_location": l.drop_location,
            "weight_ton": l.weight_ton, "distance_km": l.distance_km,
            "load_type": l.load_type, "truck_type": l.truck_type,
            "required_date": l.required_date, "required_time": l.required_time,
            "estimated_fare": l.estimated_fare,
            "unit_price_per_km": l.unit_price_per_km,
            "distance_from_you_km": away,
            "customer_name": l.customer.name if l.customer else None,
            "customer_phone": None,
            "load_image_url": l.load_image_url,
            "special_instructions": l.special_instructions,
            "matched_to_you": True,
            "match_score": match.match_score,
            "matched_truck": {
                "id": truck.id, "number": truck.truck_number,
                "type": truck.truck_type, "capacity_ton": truck.capacity_ton,
            },
            "availability": {
                "id": slot.id, "from": slot.from_location,
                "preferred_drop": slot.preferred_drop,
                "available_from": slot.available_from, "available_to": slot.available_to,
                "available_from_time": slot.available_from_time,
                "available_to_time": slot.available_to_time,
            },
        })

    return {
        "eligible": True,
        "reason": None if out else "No compatible real customer load is currently matched to your active availability.",
        "matched_count": len(out),
        "loads": out,
    }


@router.post("/loads/{load_id}/accept")
def accept_load(load_id: int, db: Session = Depends(get_db), user=Depends(require_driver)):
    """Driver accepts a load.

    This reserves the load against the driver and sends it to the admin for
    confirmation -- it does not create the trip. The trip is created when the
    admin confirms, which keeps operations in control of final assignment.
    """
    d = _me(db, user)
    if d.kyc_status != "Verified" or not d.is_verified:
        raise HTTPException(403, "Your account is still awaiting document verification.")

    load = db.query(LoadRequest).get(load_id)
    if not load:
        raise HTTPException(404, "Load not found.")
    if load.accepted_driver_id and load.accepted_driver_id != d.id:
        raise HTTPException(400, "Another driver has already accepted this load.")
    if load.status != "Pending":
        raise HTTPException(400, f"This load has already been {load.status.lower()}.")
    if load.workflow_status == "DRIVER_ACCEPTED":
        raise HTTPException(400, "You have already accepted this load. It is awaiting admin confirmation.")
    offer = (db.query(LoadMatch)
             .filter(LoadMatch.load_request_id == load.id,
                     LoadMatch.driver_id == d.id,
                     LoadMatch.response_status == "PENDING")
             .order_by(LoadMatch.match_score.desc()).first())
    top_offer = (db.query(LoadMatch)
                 .filter(LoadMatch.load_request_id == load.id,
                         LoadMatch.response_status == "PENDING")
                 .order_by(LoadMatch.match_score.desc(), LoadMatch.id.asc()).first())
    if load.workflow_status != "DRIVER_MATCHED" or not offer or not top_offer or top_offer.driver_id != d.id:
        raise HTTPException(403, "This load is not currently matched to you.")
    truck = _matched_truck(db, d, offer)
    if not truck:
        raise HTTPException(400, "The truck matched to this load is no longer registered to you.")
    if not truck.is_verified or truck.status != "Available":
        raise HTTPException(400, "The truck matched to this load is no longer available/verified.")
    if truck.capacity_ton < load.weight_ton:
        raise HTTPException(400, "Your truck cannot carry this weight.")
    if db.query(Trip).filter(Trip.driver_id == d.id,
                             Trip.status.in_(ACTIVE_TRIP_STATES)).first():
        raise HTTPException(400, "You are already on an active trip.")

    pending = (db.query(LoadRequest)
               .filter(LoadRequest.accepted_driver_id == d.id,
                       LoadRequest.workflow_status == "DRIVER_ACCEPTED",
                       LoadRequest.id != load.id).first())
    if pending:
        raise HTTPException(
            400, f"You are already waiting on confirmation for {pending.code}.")

    offer.response_status = "ACCEPTED"
    offer.responded_at = datetime.now()
    load.accepted_driver_id = d.id
    load.accepted_truck_id = truck.id
    load.driver_accepted_at = datetime.now()
    set_workflow(load, "DRIVER_ACCEPTED")
    db.commit()
    db.refresh(load)

    notify(db, "Driver Accepted", f"{d.name} accepted {load.code}",
           f"{truck.truck_number} for {load.pickup_location} to {load.drop_location}. "
           f"Confirm the assignment to create the trip.", "load_request", load.id,
           commit=False)
    n = notify(db, "Driver Assigned", f"A driver accepted {load.code}",
               f"{d.name} ({truck.truck_number}) accepted your consignment. "
               f"We are confirming the booking now.", "load_request", load.id,
               recipient_role="customer", commit=False)
    n.customer_id = load.customer_id
    notify(db, "Driver Accepted", f"You accepted {load.code}",
           f"Waiting for operations to confirm. Pick up {load.weight_ton}T at "
           f"{load.pickup_location} on {load.required_date}.",
           "load_request", load.id, recipient_role="driver", driver_id=d.id,
           commit=False)
    db.commit()

    return {
        "load_id": load.id, "load_code": load.code,
        "workflow_status": load.workflow_status,
        "awaiting_admin_confirmation": True,
        "message": f"You accepted {load.code}. Operations will confirm shortly.",
    }


@router.post("/loads/{load_id}/reject")
def reject_load(load_id: int, db: Session = Depends(get_db), user=Depends(require_driver)):
    """Reject the current matched offer and immediately try the next suitable available driver."""
    d = _me(db, user)
    load = db.query(LoadRequest).get(load_id)
    if not load:
        raise HTTPException(404, "Load not found.")
    offer = (db.query(LoadMatch)
             .filter(LoadMatch.load_request_id == load.id,
                     LoadMatch.driver_id == d.id,
                     LoadMatch.response_status == "PENDING")
             .order_by(LoadMatch.match_score.desc()).first())
    top_offer = (db.query(LoadMatch)
                 .filter(LoadMatch.load_request_id == load.id,
                         LoadMatch.response_status == "PENDING")
                 .order_by(LoadMatch.match_score.desc(), LoadMatch.id.asc()).first())
    if load.workflow_status != "DRIVER_MATCHED" or not offer or not top_offer or top_offer.driver_id != d.id:
        raise HTTPException(403, "This load is not currently matched to you.")

    offer.response_status = "REJECTED"
    offer.responded_at = datetime.now()
    db.commit()

    set_workflow(load, "LOAD_REQUESTED")
    matches = find_matches(db, load, limit=5, persist=True)
    if matches:
        top = matches[0]
        set_workflow(load, "DRIVER_MATCHED")
        n = notify(db, "Load Matched", f"New load matched to you -- {load.code}",
                   f"{load.pickup_location} to {load.drop_location}, {load.weight_ton}T, "
                   f"pickup {load.required_date} {load.required_time}.",
                   "load_request", load.id, recipient_role="driver", commit=False)
        n.driver_id = top["driver_id"]
    else:
        n = notify(db, "Searching for Driver", f"Still searching for {load.code}",
                   "The previous driver declined. We are continuing to search for a suitable driver.",
                   "load_request", load.id, recipient_role="customer", commit=False)
        n.customer_id = load.customer_id
    db.commit()
    return {"load_id": load.id, "workflow_status": load.workflow_status,
            "message": f"You rejected {load.code}."}


@router.get("/trips")
def my_trips(status: str = None, db: Session = Depends(get_db), user=Depends(require_driver)):
    d = _me(db, user)
    q = db.query(Trip).filter(Trip.driver_id == d.id)
    if status and status not in ("All", "all"):
        if status == "In Transit":
            q = q.filter(Trip.status.in_(ACTIVE_TRIP_STATES))
        else:
            q = q.filter(Trip.status == status)
    return [_trip_out(t) for t in q.order_by(Trip.id.desc()).all()]


@router.get("/trips/{trip_id}")
def trip_detail(trip_id: int, db: Session = Depends(get_db), user=Depends(require_driver)):
    d = _me(db, user)
    t = db.query(Trip).filter(Trip.id == trip_id, Trip.driver_id == d.id).first()
    if not t:
        raise HTTPException(404, "Trip not found on your account.")
    data = _trip_out(t)
    data["flow"] = FLOW
    data["next_status"] = (FLOW[FLOW.index(t.status) + 1]
                           if t.status in FLOW and t.status != "Delivered" else None)
    return data


@router.post("/trips/{trip_id}/status")
def update_trip_status(trip_id: int, payload: TripStatusUpdate,
                       db: Session = Depends(get_db), user=Depends(require_driver)):
    """Driver advances the trip. Mirrors the admin flow and notifies the customer.

    Accepts either the display names ("Pickup Reached") or the uppercase tokens
    the driver app uses ("PICKED_UP"), and stores the canonical display name.
    """
    d = _me(db, user)
    t = db.query(Trip).filter(Trip.id == trip_id, Trip.driver_id == d.id).first()
    if not t:
        raise HTTPException(404, "Trip not found on your account.")

    incoming = (payload.status or "").strip()
    status = STATUS_ALIASES.get(incoming.upper().replace(" ", "_"), incoming)
    if status not in FLOW + ["Cancelled"]:
        raise HTTPException(
            400, f"Unknown trip status '{incoming}'. Use one of: {', '.join(FLOW)}.")
    payload.status = status

    t.status = payload.status
    load = t.load_request
    sync_from_trip(load, t.status)
    cust_id = load.customer_id
    msgs = {
        "Pickup Reached": ("Driver Reached Pickup", "Driver reached the pickup point",
                           f"{d.name} has arrived at {load.pickup_location}."),
        "Loading": ("Trip Started", "Loading in progress",
                    f"Your consignment is being loaded at {load.pickup_location}."),
        "In Transit": ("Trip Started", f"{load.code} is on the road",
                       f"{d.name} left {load.pickup_location} for {load.drop_location}."),
        "Reached": ("Driver Near Destination", "Driver reached the destination",
                    f"{d.name} has arrived at {load.drop_location}."),
        "Delivered": ("Trip Completed", f"{load.code} delivered",
                      f"Your consignment was delivered at {load.drop_location}."),
    }

    if payload.status == "In Transit":
        load.status = "In Transit"
    elif payload.status == "Cancelled":
        load.status = "Cancelled"
        d.status, t.truck.status = "Online", "Available"
    elif payload.status == "Delivered":
        load.status = "Delivered"
        t.end_date = datetime.now()
        d.status = "Online"
        d.total_trips = (d.total_trips or 0) + 1
        t.truck.status = "Available"
        if not t.payment:
            fare = calculate_fare(db, load.pickup_location, load.drop_location,
                                  load.weight_ton, t.truck.truck_type, load.distance_km)
            last_p = db.query(Payment).order_by(Payment.id.desc()).first()
            payment = Payment(code=f"PAY{(last_p.id if last_p else 0) + 1:03d}",
                              trip_id=t.id, customer_id=cust_id,
                              amount=t.offered_fare or fare["total_amount"],
                              status="Pending", payment_mode="UPI")
            db.add(payment)
            db.flush()
            last_i = db.query(Invoice).order_by(Invoice.id.desc()).first()
            db.add(Invoice(
                code=f"INV{(last_i.id if last_i else 0) + 1:03d}", payment_id=payment.id,
                trip_id=t.id, base_fare=fare["base_fare"],
                distance_charge=fare["distance_charge"], weight_charge=fare["weight_charge"],
                toll_charge=fare["toll_charge"], loading_charge=fare["loading_charge"],
                unloading_charge=fare["unloading_charge"], driver_bata=fare["driver_bata"],
                platform_fee=fare["platform_fee"], gst=fare["gst"],
                surge_amount=fare["surge_amount"], total_amount=payment.amount))

    if payload.status in msgs:
        ntype, title, body = msgs[payload.status]
        notify(db, ntype, title, body, "trip", t.id, commit=False)
        n = notify(db, ntype, title, body, "trip", t.id,
                   recipient_role="customer", commit=False)
        n.customer_id = cust_id

    if payload.status == "Delivered":
        notify(db, "Trip Completed", f"{t.code} completed",
               f"You delivered {load.code}. Rs{int(t.offered_fare or 0):,} "
               f"has been added to your earnings, pending settlement.",
               "trip", t.id, recipient_role="driver", driver_id=d.id, commit=False)
    db.commit()
    return {"trip_id": t.id, "status": t.status, "load_status": load.status}


@router.post("/trips/{trip_id}/location")
def push_location(trip_id: int, payload: LocationUpdate,
                  db: Session = Depends(get_db), user=Depends(require_driver)):
    d = _me(db, user)
    t = db.query(Trip).filter(Trip.id == trip_id, Trip.driver_id == d.id).first()
    if not t:
        raise HTTPException(404, "Trip not found on your account.")
    db.add(TripLocation(trip_id=t.id, lat=payload.lat, lng=payload.lng,
                        speed_kmph=payload.speed_kmph or 0))
    t.current_lat, t.current_lng = payload.lat, payload.lng
    d.current_lat, d.current_lng = payload.lat, payload.lng
    d.location_updated_at = datetime.now()
    db.commit()
    return {"trip_id": t.id, "lat": payload.lat, "lng": payload.lng}


@router.get("/earnings")
def earnings(db: Session = Depends(get_db), user=Depends(require_driver)):
    d = _me(db, user)
    rows = (db.query(Payment).join(Trip, Payment.trip_id == Trip.id)
            .filter(Trip.driver_id == d.id).order_by(Payment.id.desc()).all())
    today = date.today()
    month_start = today.replace(day=1)
    paid = [p for p in rows if p.status == "Paid"]
    return {
        "summary": {
            "total_earned": sum(p.amount for p in paid),
            "pending": sum(p.amount for p in rows if p.status == "Pending"),
            "this_month": sum(p.amount for p in paid
                              if p.paid_at and p.paid_at.date() >= month_start),
            "today": sum(p.amount for p in paid
                         if p.paid_at and p.paid_at.date() == today),
            "completed_trips": d.total_trips or 0,
        },
        "entries": [{
            "id": p.id, "code": p.code, "amount": p.amount, "status": p.status,
            "payment_mode": p.payment_mode, "created_at": p.created_at,
            "paid_at": p.paid_at,
            "trip_code": p.trip.code if p.trip else None,
            "route": (f"{p.trip.load_request.pickup_location} → "
                      f"{p.trip.load_request.drop_location}") if p.trip else None,
        } for p in rows],
    }


@router.get("/documents")
def documents(db: Session = Depends(get_db), user=Depends(require_driver)):
    d = _me(db, user)
    truck = _truck_of(db, d)
    own = db.query(Document).filter(Document.owner_type == "driver",
                                    Document.owner_id == d.id).all()
    veh = (db.query(Document).filter(Document.owner_type == "truck",
                                     Document.owner_id == truck.id).all()
           if truck else [])
    fmt = lambda rows: [{"id": x.id, "doc_type": x.doc_type, "doc_number": x.doc_number,
                         "status": x.status, "expiry_date": x.expiry_date} for x in rows]
    return {"kyc_status": d.kyc_status, "is_verified": d.is_verified,
            "driver_documents": fmt(own), "vehicle_documents": fmt(veh)}


@router.get("/notifications")
def notifications(db: Session = Depends(get_db), user=Depends(require_driver)):
    d = _me(db, user)
    rows = (db.query(Notification)
            .filter(Notification.recipient_role == "driver", Notification.driver_id == d.id)
            .order_by(Notification.created_at.desc()).limit(60).all())
    return [{"id": n.id, "type": n.type, "title": n.title, "message": n.message,
             "is_read": n.is_read, "created_at": n.created_at} for n in rows]


@router.put("/notifications/read-all")
def read_all(db: Session = Depends(get_db), user=Depends(require_driver)):
    d = _me(db, user)
    n = db.query(Notification).filter(
        Notification.recipient_role == "driver", Notification.driver_id == d.id,
        Notification.is_read.is_(False)).update({"is_read": True})
    db.commit()
    return {"updated": n}


# ------------------------------------------------------------ availability
@router.get("/availability", response_model=list[AvailabilitySlotOut])
def list_availability(db: Session = Depends(get_db), user=Depends(require_driver)):
    """Slots this driver has published."""
    d = _me(db, user)
    return (db.query(DriverAvailabilitySlot)
            .filter(DriverAvailabilitySlot.driver_id == d.id)
            .order_by(DriverAvailabilitySlot.available_from.desc()).all())


@router.post("/availability", response_model=AvailabilitySlotOut, status_code=201)
def add_availability(payload: AvailabilitySlotCreate, db: Session = Depends(get_db),
                     user=Depends(require_driver)):
    """Driver declares when and where they are free.

    Publishing a slot is what puts the driver into the matching pool for loads
    on those dates, and it moves the truck back to Available.
    """
    d = _me(db, user)
    if payload.available_to and payload.available_to < payload.available_from:
        raise HTTPException(400, "The end date cannot be before the start date.")

    point = ((payload.from_lat, payload.from_lng)
             if payload.from_lat is not None and payload.from_lng is not None
             else (geocode(payload.from_location or "") or (None, None)))
    if point[0] is None:
        raise HTTPException(
            400, f"We don't recognise '{payload.from_location}'. Pick a city from the suggestions.")

    truck = None
    if payload.truck_id:
        truck = db.query(Truck).filter(Truck.id == payload.truck_id,
                                       Truck.driver_id == d.id).first()
        if not truck:
            raise HTTPException(400, "That truck is not registered to you.")
    else:
        truck = db.query(Truck).filter(Truck.driver_id == d.id).order_by(Truck.id).first()

    if d.kyc_status != "Verified" or not d.is_verified:
        raise HTTPException(403, "Admin must verify your driver account before you can publish matching availability.")
    if not truck:
        raise HTTPException(400, "Register a truck before publishing availability.")
    if not truck.is_verified:
        raise HTTPException(403, "Admin must verify the selected truck before it can be used for matching.")
    if truck.status == "Busy":
        raise HTTPException(400, "The selected truck is busy on an active assignment.")
    if truck.status == "Maintenance":
        raise HTTPException(400, "The selected truck is under maintenance.")
    if (payload.available_to or payload.available_from) == payload.available_from:
        start_time = payload.available_from_time or "00:00"
        end_time = payload.available_to_time or "23:59"
        if end_time < start_time:
            raise HTTPException(400, "Availability end time cannot be before start time on the same day.")

    slot = DriverAvailabilitySlot(
        driver_id=d.id, truck_id=truck.id if truck else None,
        available_from=payload.available_from,
        available_to=payload.available_to or payload.available_from,
        available_from_time=payload.available_from_time or "00:00",
        available_to_time=payload.available_to_time or "23:59",
        from_location=payload.from_location, from_lat=point[0], from_lng=point[1],
        preferred_drop=payload.preferred_drop,
        preferred_drop_lat=payload.preferred_drop_lat,
        preferred_drop_lng=payload.preferred_drop_lng,
        max_distance_km=payload.max_distance_km or 250,
        notes=payload.notes, status="DRIVER_AVAILABLE", is_active=True,
    )
    db.add(slot)

    # Publishing availability means the driver is ready for work.
    d.current_location = payload.from_location
    d.current_lat, d.current_lng = point
    if d.status == "Offline":
        d.status = "Online"
    if truck and truck.status == "Inactive":
        truck.status = "Available"

    db.commit()
    db.refresh(slot)
    _match_waiting_loads(db, d.id)
    return slot


@router.delete("/availability/{slot_id}", status_code=204)
def remove_availability(slot_id: int, db: Session = Depends(get_db),
                        user=Depends(require_driver)):
    d = _me(db, user)
    slot = db.query(DriverAvailabilitySlot).filter(
        DriverAvailabilitySlot.id == slot_id,
        DriverAvailabilitySlot.driver_id == d.id).first()
    if not slot:
        raise HTTPException(404, "Availability slot not found.")
    db.delete(slot)
    db.commit()
    _release_pending_offers(db, d)
