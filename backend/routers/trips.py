from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Driver, Invoice, LoadRequest, Payment, Trip, TripLocation, Truck
from schemas import LocationUpdate, TripOut, TripStatusUpdate
from services.notifications import notify
from services.workflow import sync_from_trip
from services.pricing import calculate_fare
from utils.security import require_admin

router = APIRouter(prefix="/api/trips", tags=["Trips"], dependencies=[Depends(require_admin)])

FLOW = ["Assigned", "Pickup Reached", "Loading", "In Transit", "Reached", "Delivered"]


def _out(t: Trip) -> dict:
    lr = t.load_request
    return {
        "id": t.id, "code": t.code, "load_request_id": t.load_request_id,
        "load_code": lr.code if lr else None,
        "driver_id": t.driver_id, "driver_name": t.driver.name if t.driver else None,
        "driver_phone": t.driver.phone if t.driver else None,
        "truck_id": t.truck_id, "truck_number": t.truck.truck_number if t.truck else None,
        "status": t.status, "offered_fare": t.offered_fare, "advance_amount": t.advance_amount,
        "pickup_location": lr.pickup_location if lr else None,
        "drop_location": lr.drop_location if lr else None,
        "distance_km": lr.distance_km if lr else None,
        "eta_minutes": t.eta_minutes, "current_lat": t.current_lat, "current_lng": t.current_lng,
        "start_date": t.start_date,
        "customer_name": lr.customer.name if lr and lr.customer else None,
    }


@router.get("", response_model=list[TripOut])
def list_trips(status: str = Query(None), db: Session = Depends(get_db)):
    q = db.query(Trip)
    if status and status != "All":
        q = q.filter(Trip.status == status)
    return [_out(t) for t in q.order_by(Trip.id.desc()).all()]


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    t = db.query(Trip).get(trip_id)
    if not t:
        raise HTTPException(404, "Trip not found.")
    return _out(t)


@router.post("/{trip_id}/location")
def push_location(trip_id: int, payload: LocationUpdate, db: Session = Depends(get_db)):
    t = db.query(Trip).get(trip_id)
    if not t:
        raise HTTPException(404, "Trip not found.")
    db.add(TripLocation(trip_id=trip_id, lat=payload.lat, lng=payload.lng,
                        speed_kmph=payload.speed_kmph or 0))
    t.current_lat, t.current_lng = payload.lat, payload.lng
    if t.driver:
        t.driver.current_lat, t.driver.current_lng = payload.lat, payload.lng
        t.driver.location_updated_at = datetime.now()
    db.commit()
    return {"trip_id": trip_id, "lat": payload.lat, "lng": payload.lng}


@router.get("/{trip_id}/location")
def get_location(trip_id: int, db: Session = Depends(get_db)):
    t = db.query(Trip).get(trip_id)
    if not t:
        raise HTTPException(404, "Trip not found.")
    lr = t.load_request
    history = (db.query(TripLocation).filter(TripLocation.trip_id == trip_id)
               .order_by(TripLocation.id).all())
    return {
        "trip_id": trip_id, "status": t.status,
        "current": {"lat": t.current_lat, "lng": t.current_lng},
        "pickup": {"lat": lr.pickup_lat, "lng": lr.pickup_lng, "name": lr.pickup_location},
        "drop": {"lat": lr.drop_lat, "lng": lr.drop_lng, "name": lr.drop_location},
        "eta_minutes": t.eta_minutes,
        "history": [{"lat": h.lat, "lng": h.lng, "recorded_at": h.recorded_at} for h in history],
    }


@router.put("/{trip_id}/status")
def update_status(trip_id: int, payload: TripStatusUpdate, db: Session = Depends(get_db)):
    t = db.query(Trip).get(trip_id)
    if not t:
        raise HTTPException(404, "Trip not found.")
    if payload.status not in FLOW + ["Cancelled"]:
        raise HTTPException(400, "Unknown trip status.")

    t.status = payload.status
    load = t.load_request
    sync_from_trip(load, t.status)

    if payload.status == "In Transit":
        load.status = "In Transit"
        notify(db, "Trip Started", f"{t.code} is on the road",
               f"{t.driver.name} left {load.pickup_location}.", "trip", t.id, commit=False)
    elif payload.status == "Pickup Reached":
        notify(db, "Driver Reached Pickup", f"{t.driver.name} reached pickup",
               f"Arrived at {load.pickup_location}.", "trip", t.id, commit=False)
    elif payload.status == "Reached":
        notify(db, "Driver Near Destination", f"{t.code} reached destination",
               f"Arrived at {load.drop_location}.", "trip", t.id, commit=False)
    elif payload.status == "Delivered":
        load.status = "Delivered"
        t.end_date = datetime.now()
        t.driver.status = "Online"
        t.driver.total_trips = (t.driver.total_trips or 0) + 1
        t.truck.status = "Available"

        if not t.payment:
            fare = calculate_fare(db, load.pickup_location, load.drop_location,
                                  load.weight_ton, t.truck.truck_type, load.distance_km)
            last_p = db.query(Payment).order_by(Payment.id.desc()).first()
            payment = Payment(
                code=f"PAY{(last_p.id if last_p else 0) + 1:03d}", trip_id=t.id,
                customer_id=load.customer_id, amount=t.offered_fare or fare["total_amount"],
                status="Pending", payment_mode="UPI",
            )
            db.add(payment)
            db.flush()
            last_i = db.query(Invoice).order_by(Invoice.id.desc()).first()
            db.add(Invoice(
                code=f"INV{(last_i.id if last_i else 0) + 1:03d}", payment_id=payment.id,
                trip_id=t.id, base_fare=fare["base_fare"],
                distance_charge=fare["distance_charge"], weight_charge=fare["weight_charge"],
                fuel_charge=fare.get("fuel_charge", 0), toll_charge=fare["toll_charge"], loading_charge=fare["loading_charge"],
                unloading_charge=fare["unloading_charge"], driver_bata=fare["driver_bata"],
                platform_fee=fare["platform_fee"], gst=fare["gst"],
                surge_amount=fare["surge_amount"], total_amount=payment.amount,
            ))
        notify(db, "Trip Completed", f"{t.code} delivered",
               f"Load {load.code} delivered at {load.drop_location}.", "trip", t.id, commit=False)
    elif payload.status == "Cancelled":
        load.status = "Cancelled"
        t.driver.status = "Online"
        t.truck.status = "Available"

    # Mirror the event to the customer's notification feed.
    CUSTOMER_MSG = {
        "Pickup Reached": ("Driver Reached Pickup", "Driver reached the pickup point"),
        "In Transit": ("Trip Started", "Your consignment is on the road"),
        "Reached": ("Driver Near Destination", "Driver reached the destination"),
        "Delivered": ("Trip Completed", "Your consignment was delivered"),
    }
    if payload.status in CUSTOMER_MSG:
        ntype, title = CUSTOMER_MSG[payload.status]
        note = notify(db, ntype, title,
                      f"{load.code}: {load.pickup_location} to {load.drop_location}.",
                      "trip", t.id, recipient_role="customer", commit=False)
        note.customer_id = load.customer_id

    db.commit()
    return {"trip_id": t.id, "status": t.status, "load_status": load.status}
