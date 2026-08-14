"""Endpoints for the signed-in customer. Scoped to their own records only."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import (
    Customer, DriverRating, Invoice, LoadRequest, Notification, Payment, Trip,
)
from schemas import CustomerLoadCreate, ReviewCreate
from services.geo import resolve_point, road_distance_km
from services.matching import find_matches
from services.notifications import notify
from services.pricing import calculate_fare, price_load
from services.workflow import progress, set_workflow
from utils.security import require_customer

router = APIRouter(prefix="/api/customer", tags=["Customer Portal"])


def _me(db: Session, user) -> Customer:
    c = db.query(Customer).filter(Customer.user_id == user.id).first()
    if not c:
        raise HTTPException(404, "No customer profile is linked to this account.")
    return c


def _load_out(l: LoadRequest) -> dict:
    trip = l.trip
    return {
        "id": l.id, "code": l.code,
        "pickup_location": l.pickup_location, "drop_location": l.drop_location,
        "load_type": l.load_type, "truck_type": l.truck_type,
        "weight_ton": l.weight_ton, "distance_km": l.distance_km,
        "required_date": l.required_date, "required_time": l.required_time,
        "status": l.status, "estimated_fare": l.estimated_fare,
        "workflow_status": l.workflow_status,
        "workflow": progress(l),
        "unit_price_per_km": l.unit_price_per_km,
        "load_image_url": l.load_image_url,
        "special_instructions": l.special_instructions, "created_at": l.created_at,
        "pickup_lat": l.pickup_lat, "pickup_lng": l.pickup_lng,
        "drop_lat": l.drop_lat, "drop_lng": l.drop_lng,
        "trip_id": trip.id if trip else None,
        "trip_code": trip.code if trip else None,
        "trip_status": trip.status if trip else None,
        "driver_name": trip.driver.name if trip and trip.driver else None,
        "driver_phone": trip.driver.phone if trip and trip.driver else None,
        "driver_rating": trip.driver.rating if trip and trip.driver else None,
        "truck_number": trip.truck.truck_number if trip and trip.truck else None,
        "truck_type_assigned": trip.truck.truck_type if trip and trip.truck else None,
        # Assignment details are intentionally released only after Admin
        # confirmation creates the Trip. Driver acceptance alone is not a final
        # assignment and must not expose driver contact details to the customer.
        "accepted_driver_name": trip.driver.name if trip and trip.driver else None,
        "accepted_driver_phone": trip.driver.phone if trip and trip.driver else None,
        "accepted_truck_number": trip.truck.truck_number if trip and trip.truck else None,
    }


@router.get("/profile")
def profile(db: Session = Depends(get_db), user=Depends(require_customer)):
    c = _me(db, user)
    return {c_.name: getattr(c, c_.name) for c_ in Customer.__table__.columns}


@router.put("/profile")
def update_profile(payload: dict, db: Session = Depends(get_db), user=Depends(require_customer)):
    c = _me(db, user)
    for field in ("name", "company", "phone", "address", "city", "state", "pincode", "gst_number"):
        if field in payload and payload[field] is not None:
            setattr(c, field, payload[field])
    db.commit()
    return {"message": "Profile updated."}


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user=Depends(require_customer)):
    c = _me(db, user)
    loads = db.query(LoadRequest).filter(LoadRequest.customer_id == c.id).all()
    paid = float(db.query(func.coalesce(func.sum(Payment.amount), 0))
                 .filter(Payment.customer_id == c.id, Payment.status == "Paid").scalar() or 0)
    pending = float(db.query(func.coalesce(func.sum(Payment.amount), 0))
                    .filter(Payment.customer_id == c.id, Payment.status == "Pending").scalar() or 0)
    by = lambda s: sum(1 for l in loads if l.status == s)
    recent = sorted(loads, key=lambda l: l.id, reverse=True)[:6]
    return {
        "customer": {"name": c.name, "company": c.company, "code": c.code},
        "stats": {
            "active_loads": by("Assigned") + by("In Transit"),
            "pending": by("Pending"), "in_transit": by("In Transit"),
            "delivered": by("Delivered"), "cancelled": by("Cancelled"),
            "total_loads": len(loads),
            "total_paid": paid, "pending_payments": pending,
        },
        "recent_loads": [_load_out(l) for l in recent],
    }


@router.get("/loads")
def my_loads(status: str = None, db: Session = Depends(get_db), user=Depends(require_customer)):
    c = _me(db, user)
    q = db.query(LoadRequest).filter(LoadRequest.customer_id == c.id)
    if status and status not in ("All", "all"):
        q = q.filter(LoadRequest.status == status)
    return [_load_out(l) for l in q.order_by(LoadRequest.id.desc()).all()]


@router.get("/loads/{load_id}")
def load_detail(load_id: int, db: Session = Depends(get_db), user=Depends(require_customer)):
    c = _me(db, user)
    l = db.query(LoadRequest).filter(LoadRequest.id == load_id,
                                     LoadRequest.customer_id == c.id).first()
    if not l:
        raise HTTPException(404, "Load not found on your account.")
    return _load_out(l)


@router.post("/loads", status_code=201)
def book_load(payload: CustomerLoadCreate, db: Session = Depends(get_db),
              user=Depends(require_customer)):
    """Customer books a load. It lands in the admin queue as Pending."""
    c = _me(db, user)
    p = resolve_point(payload.pickup_location, payload.pickup_lat, payload.pickup_lng)
    d = resolve_point(payload.drop_location, payload.drop_lat, payload.drop_lng)
    distance = road_distance_km(p[0], p[1], d[0], d[1]) if p[0] and d[0] else None

    last = db.query(LoadRequest).order_by(LoadRequest.id.desc()).first()
    load = LoadRequest(
        code=f"LD{1001 + (last.id if last else 0)}", customer_id=c.id,
        pickup_location=payload.pickup_location, pickup_lat=p[0], pickup_lng=p[1],
        drop_location=payload.drop_location, drop_lat=d[0], drop_lng=d[1],
        load_type=payload.load_type, truck_type=payload.truck_type,
        weight_ton=payload.weight_ton, distance_km=distance,
        required_date=payload.required_date, required_time=payload.required_time,
        special_instructions=payload.special_instructions,
        load_image_url=payload.load_image_url,
    )
    # One pricing call, persisted on the row -- customer, driver and admin all
    # read this same number afterwards.
    fare = price_load(db, load)
    load.budget = fare["total_amount"]
    set_workflow(load, "LOAD_REQUESTED")
    db.add(load)
    db.commit()
    db.refresh(load)

    notify(db, "Load Created", f"New load {load.code}",
           f"{c.name} booked {load.weight_ton}T from {load.pickup_location} "
           f"to {load.drop_location}.", "load_request", load.id, commit=False)
    notify(db, "Load Created", f"Load {load.code} received",
           f"We are finding the right truck for your {load.pickup_location} to "
           f"{load.drop_location} consignment.", "load_request", load.id,
           recipient_role="customer", commit=False)
    db.query(Notification).filter(Notification.reference_id == load.id,
                                  Notification.recipient_role == "customer").update(
        {"customer_id": c.id})
    db.commit()

    # --- Automatic Load Matching -------------------------------------
    # As soon as the load is priced, the backend checks live driver
    # availability (route, distance, weight vs. capacity, truck type and the
    # driver's declared availability window) and, if a suitable driver
    # exists, moves the load straight to DRIVER_MATCHED and puts it in front
    # of the best-matched driver. No driver is ever assigned at random -- this
    # only surfaces the ranked shortlist the matching engine already scores;
    # the driver still has to accept, and admin still confirms.
    matches = find_matches(db, load, limit=5, persist=True)
    if matches:
        top = matches[0]
        set_workflow(load, "DRIVER_MATCHED")
        db.commit()

        notify(db, "Driver Matched", f"Driver matched for {load.code}",
               f"{top['driver_name']} ({top['truck_number']}) is the best match "
               f"for {load.pickup_location} to {load.drop_location} "
               f"({top['grade']}, {top['match_score']}/100).",
               "load_request", load.id, commit=False)
        n_drv = notify(
            db, "Load Matched", f"New load matched to you -- {load.code}",
            f"{load.pickup_location} to {load.drop_location}, {load.weight_ton}T, "
            f"pickup {load.required_date}. Estimated fare Rs{int(top['estimated_fare']):,}. "
            "Review and accept it from Available Loads.",
            "load_request", load.id, recipient_role="driver", commit=False)
        n_drv.driver_id = top["driver_id"]
        n_cust = notify(
            db, "Driver Matched", f"We found a driver for {load.code}",
            f"{top['driver_name']} is a good match for your consignment. "
            "Waiting for the driver to accept.", "load_request", load.id,
            recipient_role="customer", commit=False)
        n_cust.customer_id = c.id
        db.commit()
    else:
        notify(db, "No Driver Available", f"No match yet for {load.code}",
               f"No driver/truck currently fits {load.weight_ton}T, "
               f"{load.truck_type} on {load.pickup_location} to {load.drop_location}. "
               "Matching will retry automatically when a compatible driver becomes available.",
               "load_request", load.id, commit=True)

    db.refresh(load)
    return _load_out(load)


@router.get("/loads/{load_id}/track")
def track(load_id: int, db: Session = Depends(get_db), user=Depends(require_customer)):
    c = _me(db, user)
    l = db.query(LoadRequest).filter(LoadRequest.id == load_id,
                                     LoadRequest.customer_id == c.id).first()
    if not l:
        raise HTTPException(404, "Load not found on your account.")
    t = l.trip
    if not t:
        # Driver identity/contact is private until Admin confirms the assignment
        # and creates the Trip. The customer can still see the workflow progress
        # in real time without receiving unconfirmed assignment details.
        accepted = l.workflow_status == "DRIVER_ACCEPTED"
        matched = l.workflow_status == "DRIVER_MATCHED"
        return {
            "load": _load_out(l), "trip": None, "pending_driver": None,
            "message": (
                "A driver accepted your load. Admin confirmation is pending." if accepted else
                "A compatible driver has been matched. Waiting for the driver to accept." if matched else
                "Searching for a compatible available driver."
            ),
        }
    return {
        "load": _load_out(l),
        "trip": {
            "id": t.id, "code": t.code, "status": t.status,
            "eta_minutes": t.eta_minutes, "start_date": t.start_date,
            "driver_name": t.driver.name if t.driver else None,
            "driver_phone": t.driver.phone if t.driver else None,
            "truck_number": t.truck.truck_number if t.truck else None,
            "current": {"lat": t.current_lat, "lng": t.current_lng},
            "pickup": {"lat": l.pickup_lat, "lng": l.pickup_lng, "name": l.pickup_location},
            "drop": {"lat": l.drop_lat, "lng": l.drop_lng, "name": l.drop_location},
        },
    }


@router.get("/payments")
def payments(db: Session = Depends(get_db), user=Depends(require_customer)):
    c = _me(db, user)
    rows = (db.query(Payment).filter(Payment.customer_id == c.id)
            .order_by(Payment.id.desc()).all())
    out = []
    for p in rows:
        inv = db.query(Invoice).filter(Invoice.payment_id == p.id).first()
        out.append({
            "id": p.id, "code": p.code, "amount": p.amount, "status": p.status,
            "payment_mode": p.payment_mode, "created_at": p.created_at,
            "paid_at": p.paid_at,
            "trip_code": p.trip.code if p.trip else None,
            "route": (f"{p.trip.load_request.pickup_location} → "
                      f"{p.trip.load_request.drop_location}") if p.trip else None,
            "invoice_id": inv.id if inv else None,
        })
    total = sum(p["amount"] for p in out)
    return {
        "summary": {
            "total": total,
            "paid": sum(p["amount"] for p in out if p["status"] == "Paid"),
            "pending": sum(p["amount"] for p in out if p["status"] == "Pending"),
        },
        "payments": out,
    }


@router.get("/notifications")
def notifications(db: Session = Depends(get_db), user=Depends(require_customer)):
    c = _me(db, user)
    rows = (db.query(Notification)
            .filter(Notification.recipient_role == "customer",
                    Notification.customer_id == c.id)
            .order_by(Notification.created_at.desc()).limit(60).all())
    return [{"id": n.id, "type": n.type, "title": n.title, "message": n.message,
             "is_read": n.is_read, "created_at": n.created_at} for n in rows]


@router.put("/notifications/read-all")
def read_all(db: Session = Depends(get_db), user=Depends(require_customer)):
    c = _me(db, user)
    n = db.query(Notification).filter(
        Notification.recipient_role == "customer", Notification.customer_id == c.id,
        Notification.is_read.is_(False)).update({"is_read": True})
    db.commit()
    return {"updated": n}


@router.post("/trips/{trip_id}/review", status_code=201)
def review(trip_id: int, payload: ReviewCreate, db: Session = Depends(get_db),
           user=Depends(require_customer)):
    c = _me(db, user)
    t = db.query(Trip).get(trip_id)
    if not t or t.load_request.customer_id != c.id:
        raise HTTPException(404, "Trip not found on your account.")
    if t.status != "Delivered":
        raise HTTPException(400, "You can review a trip once it has been delivered.")
    if db.query(DriverRating).filter(DriverRating.trip_id == trip_id).first():
        raise HTTPException(400, "You have already reviewed this trip.")

    db.add(DriverRating(driver_id=t.driver_id, trip_id=t.id, customer_id=c.id,
                        rating=payload.rating, comment=payload.comment))
    db.flush()
    # Keep the driver's headline rating in step with their reviews.
    avg = (db.query(func.avg(DriverRating.rating))
           .filter(DriverRating.driver_id == t.driver_id).scalar())
    if avg:
        t.driver.rating = round(float(avg), 1)
    db.commit()
    return {"message": "Thanks for the review.", "driver_rating": t.driver.rating}


@router.get("/reviewable-trips")
def reviewable(db: Session = Depends(get_db), user=Depends(require_customer)):
    c = _me(db, user)
    rated = {r.trip_id for r in db.query(DriverRating)
             .filter(DriverRating.customer_id == c.id).all()}
    trips = (db.query(Trip).join(LoadRequest, Trip.load_request_id == LoadRequest.id)
             .filter(LoadRequest.customer_id == c.id, Trip.status == "Delivered").all())
    return [{"id": t.id, "code": t.code,
             "route": f"{t.load_request.pickup_location} → {t.load_request.drop_location}",
             "driver_name": t.driver.name if t.driver else None,
             "truck_number": t.truck.truck_number if t.truck else None,
             "reviewed": t.id in rated} for t in trips]
