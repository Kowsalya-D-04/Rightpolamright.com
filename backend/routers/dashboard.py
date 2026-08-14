from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Driver, LoadRequest, Payment, Trip, Truck
from utils.security import require_admin

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"],
                   dependencies=[Depends(require_admin)])

ACTIVE = ("Assigned", "Pickup Reached", "Loading", "In Transit", "Reached")


@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    today = datetime.now().date()

    def money(*f):
        return float(db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(*f).scalar() or 0)

    return {
        "loads": {
            "total": db.query(LoadRequest).count(),
            "pending": db.query(LoadRequest).filter(LoadRequest.status == "Pending").count(),
            "in_transit": db.query(LoadRequest).filter(LoadRequest.status == "In Transit").count(),
            "delivered": db.query(LoadRequest).filter(LoadRequest.status == "Delivered").count(),
            "assigned": db.query(LoadRequest).filter(LoadRequest.status == "Assigned").count(),
            "cancelled": db.query(LoadRequest).filter(LoadRequest.status == "Cancelled").count(),
        },
        "revenue": {
            "today": money(Payment.status == "Paid", func.date(Payment.paid_at) == str(today)),
            "pending": money(Payment.status == "Pending"),
            "completed": money(Payment.status == "Paid"),
        },
        "fleet": {
            "total_trucks": db.query(Truck).count(),
            "available_trucks": db.query(Truck).filter(Truck.status == "Available").count(),
            "total_drivers": db.query(Driver).count(),
            "online_drivers": db.query(Driver).filter(Driver.status == "Online").count(),
            "active_trips": db.query(Trip).filter(Trip.status.in_(ACTIVE)).count(),
        },
    }


@router.get("/live-operations")
def live_operations(db: Session = Depends(get_db)):
    """Markers for the dashboard map: live trips plus idle available trucks."""
    trips = db.query(Trip).filter(Trip.status.in_(ACTIVE)).all()
    markers = []
    for t in trips:
        lr = t.load_request
        markers.append({
            "type": "trip", "id": t.id, "label": t.truck.truck_number if t.truck else t.code,
            "lat": t.current_lat or (lr.pickup_lat if lr else None),
            "lng": t.current_lng or (lr.pickup_lng if lr else None),
            "status": t.status, "driver": t.driver.name if t.driver else None,
            "route": f"{lr.pickup_location} to {lr.drop_location}" if lr else None,
        })
    idle = (db.query(Driver).filter(Driver.status == "Online",
                                    Driver.current_lat.isnot(None)).limit(20).all())
    for d in idle:
        truck = d.trucks[0] if d.trucks else None
        markers.append({
            "type": "available", "id": d.id,
            "label": truck.truck_number if truck else d.name,
            "lat": d.current_lat, "lng": d.current_lng,
            "status": "Available", "driver": d.name, "route": d.current_location,
        })
    return {"markers": [m for m in markers if m["lat"] is not None]}


@router.get("/recent-loads")
def recent_loads(limit: int = 8, db: Session = Depends(get_db)):
    rows = db.query(LoadRequest).order_by(LoadRequest.id.desc()).limit(limit).all()
    return [{"id": l.id, "code": l.code,
             "route": f"{l.pickup_location} → {l.drop_location}",
             "weight_ton": l.weight_ton, "status": l.status,
             "required_date": l.required_date,
             "customer_name": l.customer.name if l.customer else None} for l in rows]
