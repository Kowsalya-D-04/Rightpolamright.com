"""Load requests, Smart Load Matching and assignment."""
import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
from models import (
    Customer, Driver, DriverAvailabilitySlot, LoadMatch, LoadRequest, Trip, Truck,
)
from schemas import (
    AssignRequest, LoadRequestCreate, LoadRequestOut, LoadRequestUpdate,
    MatchResponse,
)
from services.geo import resolve_point, road_distance_km
from services.matching import MAX_PICKUP_DISTANCE_KM, WEIGHTS, find_matches
from services.notifications import notify
from services.pricing import calculate_fare, price_load
from services.workflow import progress, set_workflow
from utils.security import require_admin

ACTIVE_STATES = ("Assigned", "Pickup Reached", "Loading", "In Transit", "Reached")


router = APIRouter(prefix="/api/load-requests", tags=["Load Requests"],
                   dependencies=[Depends(require_admin)])


def _out(l: LoadRequest) -> dict:
    d = {c.name: getattr(l, c.name) for c in LoadRequest.__table__.columns}
    d["customer_name"] = l.customer.name if l.customer else None
    d["customer_phone"] = l.customer.phone if l.customer else None
    d["workflow"] = progress(l)
    d["accepted_driver_name"] = l.accepted_driver.name if l.accepted_driver else None
    d["accepted_truck_number"] = l.accepted_truck.truck_number if l.accepted_truck else None
    return d


@router.get("", response_model=list[LoadRequestOut])
def list_loads(search: str = Query(None), status: str = Query(None),
               db: Session = Depends(get_db)):
    q = db.query(LoadRequest).join(Customer, LoadRequest.customer_id == Customer.id)
    if search:
        term = f"%{search}%"
        q = q.filter(or_(LoadRequest.code.ilike(term), Customer.name.ilike(term),
                         LoadRequest.pickup_location.ilike(term),
                         LoadRequest.drop_location.ilike(term)))
    if status and status != "All":
        q = q.filter(LoadRequest.status == status)
    return [_out(l) for l in q.order_by(LoadRequest.id.desc()).all()]


@router.get("/{load_id}", response_model=LoadRequestOut)
def get_load(load_id: int, db: Session = Depends(get_db)):
    l = db.query(LoadRequest).get(load_id)
    if not l:
        raise HTTPException(404, "Load request not found.")
    return _out(l)


@router.post("", response_model=LoadRequestOut, status_code=201)
def create_load(payload: LoadRequestCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).get(payload.customer_id)
    if not customer:
        raise HTTPException(400, "Select a valid customer.")

    data = payload.model_dump()
    p = resolve_point(data["pickup_location"])
    d = resolve_point(data["drop_location"])
    distance = road_distance_km(p[0], p[1], d[0], d[1]) if p[0] and d[0] else None

    last = db.query(LoadRequest).order_by(LoadRequest.id.desc()).first()
    code = f"LD{1001 + (last.id if last else 0)}"

    load = LoadRequest(
        code=code, pickup_lat=p[0], pickup_lng=p[1], drop_lat=d[0], drop_lng=d[1],
        distance_km=distance, status="Pending", **data,
    )
    fare = price_load(db, load)
    load.budget = fare["total_amount"]
    set_workflow(load, "LOAD_REQUESTED")

    db.add(load)
    db.commit()
    db.refresh(load)

    notify(db, "Load Created", f"New load {load.code}",
           f"{customer.name} requested {load.weight_ton}T from {load.pickup_location} to {load.drop_location}.",
           "load_request", load.id)
    return _out(load)


@router.put("/{load_id}", response_model=LoadRequestOut)
def update_load(load_id: int, payload: LoadRequestUpdate, db: Session = Depends(get_db)):
    l = db.query(LoadRequest).get(load_id)
    if not l:
        raise HTTPException(404, "Load request not found.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(l, k, v)
    if payload.pickup_location or payload.drop_location:
        p = resolve_point(l.pickup_location)
        d = resolve_point(l.drop_location)
        l.pickup_lat, l.pickup_lng = p
        l.drop_lat, l.drop_lng = d
        l.distance_km = road_distance_km(p[0], p[1], d[0], d[1]) if p[0] and d[0] else None
    db.commit()
    db.refresh(l)
    return _out(l)


@router.delete("/{load_id}", status_code=204)
def delete_load(load_id: int, db: Session = Depends(get_db)):
    l = db.query(LoadRequest).get(load_id)
    if not l:
        raise HTTPException(404, "Load request not found.")
    if l.trip:
        raise HTTPException(400, "This load has a trip against it. Cancel the trip first.")
    db.delete(l)
    db.commit()


# ---------------------------------------------------------------- matching
@router.get("/{load_id}/matches", response_model=MatchResponse)
def get_matches(load_id: int, limit: int = Query(10, ge=1, le=50),
                db: Session = Depends(get_db)):
    """Run the matching engine against live database records."""
    load = db.query(LoadRequest).get(load_id)
    if not load:
        raise HTTPException(404, "Load request not found.")

    total_candidates = db.query(Truck).count()
    matches = find_matches(db, load, limit=limit)

    shortlisted = {
        m.driver_id for m in db.query(LoadMatch)
        .filter(LoadMatch.load_request_id == load_id, LoadMatch.is_shortlisted.is_(True)).all()
    }
    for m in matches:
        m["is_shortlisted"] = m["driver_id"] in shortlisted

    criteria = {
        "pickup_location": load.pickup_location,
        "drop_location": load.drop_location,
        "required_date": load.required_date,
        "required_time": load.required_time,
        "truck_type": load.truck_type,
        "load_type": load.load_type,
        "weight_ton": load.weight_ton,
        "max_budget": load.budget,
        "search_radius_km": MAX_PICKUP_DISTANCE_KM,
        "weights": WEIGHTS,
    }
    return {"load": _out(load), "criteria": criteria,
            "total_candidates": total_candidates, "matches": matches}


@router.post("/{load_id}/matches/{driver_id}/shortlist")
def toggle_shortlist(load_id: int, driver_id: int, db: Session = Depends(get_db)):
    m = (db.query(LoadMatch)
         .filter(LoadMatch.load_request_id == load_id, LoadMatch.driver_id == driver_id)
         .first())
    if not m:
        raise HTTPException(404, "Run matching for this load first.")
    m.is_shortlisted = not m.is_shortlisted
    db.commit()
    return {"driver_id": driver_id, "is_shortlisted": m.is_shortlisted}


# -------------------------------------------------------------- assignment
@router.post("/{load_id}/assign")
def assign_load(load_id: int, payload: AssignRequest, db: Session = Depends(get_db)):
    load = db.query(LoadRequest).get(load_id)
    if not load:
        raise HTTPException(404, "Load request not found.")
    if load.status != "Pending":
        raise HTTPException(400, f"This load is already {load.status}.")
    if load.workflow_status != "DRIVER_ACCEPTED":
        raise HTTPException(400, "A matched driver must accept the load before admin can assign it.")
    if payload.driver_id != load.accepted_driver_id or payload.truck_id != load.accepted_truck_id:
        raise HTTPException(400, "Admin must confirm the driver/truck pair that accepted this load.")

    driver = db.query(Driver).get(payload.driver_id)
    truck = db.query(Truck).get(payload.truck_id)
    if not driver or not truck:
        raise HTTPException(400, "Select a valid driver and truck.")

    # Re-validate at assign time -- state may have changed since matching ran.
    if truck.capacity_ton < load.weight_ton:
        raise HTTPException(400, "That truck cannot carry this weight.")
    active = ("Assigned", "Pickup Reached", "Loading", "In Transit", "Reached")
    if db.query(Trip).filter(Trip.driver_id == driver.id, Trip.status.in_(active)).first():
        raise HTTPException(400, f"{driver.name} is already on an active trip.")

    last = db.query(Trip).order_by(Trip.id.desc()).first()
    trip = Trip(
        code=f"TRP{(last.id if last else 0) + 1:03d}",
        load_request_id=load.id, driver_id=driver.id, truck_id=truck.id,
        status="Assigned",
        offered_fare=payload.offered_fare or load.estimated_fare,
        advance_amount=payload.advance_amount or 0,
        message_to_driver=payload.message_to_driver,
        start_date=datetime.now(),
        current_lat=load.pickup_lat, current_lng=load.pickup_lng,
        eta_minutes=int((load.distance_km or 0) / 45 * 60) if load.distance_km else None,
    )
    db.add(trip)

    load.admin_confirmed_at = datetime.now()
    set_workflow(load, "ADMIN_CONFIRMED")
    set_workflow(load, "ASSIGNED")
    driver.status = "Busy"
    truck.status = "Busy"

    db.commit()
    db.refresh(trip)

    notify(db, "Driver Assigned", f"{driver.name} assigned to {load.code}",
           f"{truck.truck_number} assigned for {load.pickup_location} to {load.drop_location}. "
           f"Fare Rs{int(trip.offered_fare or 0):,}.",
           "trip", trip.id, recipient_role="driver", driver_id=driver.id, commit=False)
    customer_note = notify(
        db, "Driver Assigned", f"Truck assigned to {load.code}",
        f"{driver.name} ({truck.truck_number}) will carry your consignment from "
        f"{load.pickup_location} to {load.drop_location}.",
        "trip", trip.id, recipient_role="customer", commit=False)
    customer_note.customer_id = load.customer_id
    db.commit()

    return {
        "trip_id": trip.id, "trip_code": trip.code, "load_status": load.status,
        "driver_status": driver.status, "truck_status": truck.status,
        "message": f"{load.code} assigned to {driver.name} ({truck.truck_number}).",
    }


# --------------------------------------------------- driver-accepted queue
@router.get("/{load_id}/assignment")
def assignment_overview(load_id: int, db: Session = Depends(get_db)):
    """Everything the admin needs to confirm one load, in a single call.

    Customer, load, image, distance, priced fare, the driver who accepted,
    their published availability, truck details and the workflow position.
    """
    load = db.query(LoadRequest).get(load_id)
    if not load:
        raise HTTPException(404, "Load request not found.")

    c = load.customer
    d = load.accepted_driver
    t = load.accepted_truck
    breakdown = json.loads(load.price_breakdown) if load.price_breakdown else None

    slots = []
    if d:
        rows = (db.query(DriverAvailabilitySlot)
                .filter(DriverAvailabilitySlot.driver_id == d.id,
                        DriverAvailabilitySlot.is_active.is_(True))
                .order_by(DriverAvailabilitySlot.available_from).all())
        slots = [{"id": s.id, "from": s.available_from, "to": s.available_to,
                  "from_time": s.available_from_time, "to_time": s.available_to_time,
                  "from_location": s.from_location,
                  "preferred_drop": s.preferred_drop,
                  "max_distance_km": s.max_distance_km} for s in rows]

    return {
        "load": _out(load),
        "workflow": progress(load),
        "customer": ({"id": c.id, "code": c.code, "name": c.name, "company": c.company,
                      "phone": c.phone, "email": c.email, "city": c.city,
                      "address": c.address} if c else None),
        "pricing": {
            "estimated_fare": load.estimated_fare,
            "unit_price_per_km": load.unit_price_per_km,
            "distance_km": load.distance_km,
            "breakdown": breakdown,
        },
        "accepted_driver": ({"id": d.id, "code": d.code, "name": d.name,
                             "phone": d.phone, "rating": d.rating,
                             "total_trips": d.total_trips,
                             "current_location": d.current_location,
                             "kyc_status": d.kyc_status,
                             "accepted_at": load.driver_accepted_at} if d else None),
        "driver_availability": slots,
        "truck": ({"id": t.id, "truck_number": t.truck_number,
                   "truck_type": t.truck_type, "capacity_ton": t.capacity_ton,
                   "model": t.model, "status": t.status} if t else None),
        "trip": ({"id": load.trip.id, "code": load.trip.code,
                  "status": load.trip.status} if load.trip else None),
        "admin_confirmed_at": load.admin_confirmed_at,
    }


@router.post("/{load_id}/confirm")
def confirm_assignment(load_id: int, db: Session = Depends(get_db)):
    """Admin confirms the driver's acceptance and the trip is created."""
    load = db.query(LoadRequest).get(load_id)
    if not load:
        raise HTTPException(404, "Load request not found.")
    if load.workflow_status != "DRIVER_ACCEPTED":
        raise HTTPException(
            400, "No driver acceptance is waiting on this load.")

    driver = load.accepted_driver
    truck = load.accepted_truck
    if not driver or not truck:
        raise HTTPException(400, "The accepted driver or truck is no longer available.")
    if truck.capacity_ton < load.weight_ton:
        raise HTTPException(400, "That truck cannot carry this weight.")
    if db.query(Trip).filter(Trip.driver_id == driver.id,
                             Trip.status.in_(ACTIVE_STATES)).first():
        raise HTTPException(400, f"{driver.name} is already on an active trip.")

    last = db.query(Trip).order_by(Trip.id.desc()).first()
    trip = Trip(
        code=f"TRP{(last.id if last else 0) + 1:03d}",
        load_request_id=load.id, driver_id=driver.id, truck_id=truck.id,
        status="Assigned", offered_fare=load.estimated_fare,
        advance_amount=0,
        message_to_driver="Confirmed by operations.",
        start_date=datetime.now(),
        current_lat=load.pickup_lat, current_lng=load.pickup_lng,
        eta_minutes=int((load.distance_km or 0) / 45 * 60) if load.distance_km else None,
    )
    db.add(trip)
    load.admin_confirmed_at = datetime.now()
    set_workflow(load, "ADMIN_CONFIRMED")
    db.flush()
    set_workflow(load, "ASSIGNED")
    driver.status = "Busy"
    truck.status = "Busy"
    db.commit()
    db.refresh(trip)

    n = notify(db, "Driver Assigned", f"{load.code} confirmed",
               f"{driver.name} ({truck.truck_number}) is confirmed for your "
               f"{load.pickup_location} to {load.drop_location} consignment.",
               "trip", trip.id, recipient_role="customer", commit=False)
    n.customer_id = load.customer_id
    notify(db, "Driver Assigned", f"{load.code} confirmed",
           f"Operations confirmed your acceptance. Trip {trip.code} is live.",
           "trip", trip.id, recipient_role="driver", driver_id=driver.id, commit=False)
    db.commit()

    return {"trip_id": trip.id, "trip_code": trip.code,
            "workflow_status": load.workflow_status,
            "message": f"{load.code} confirmed. Trip {trip.code} created for {driver.name}."}
