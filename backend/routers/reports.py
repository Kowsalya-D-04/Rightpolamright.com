from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Driver, LoadRequest, Payment, Trip
from utils.security import require_admin

router = APIRouter(prefix="/api/reports", tags=["Reports"],
                   dependencies=[Depends(require_admin)])


def _range(period: str, start: str = None, end: str = None):
    today = datetime.now().date()
    if period == "today":
        return today, today
    if period == "week":
        return today - timedelta(days=today.weekday()), today
    if period == "month":
        return today.replace(day=1), today
    if period == "year":
        return today.replace(month=1, day=1), today
    if period == "custom" and start and end:
        return datetime.fromisoformat(start).date(), datetime.fromisoformat(end).date()
    return today - timedelta(days=365), today


@router.get("/summary")
def summary(period: str = Query("month"), start: str = None, end: str = None,
            db: Session = Depends(get_db)):
    s, e = _range(period, start, end)
    loads = db.query(LoadRequest).filter(func.date(LoadRequest.created_at) >= str(s),
                                         func.date(LoadRequest.created_at) <= str(e)).all()
    revenue = float(
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == "Paid", func.date(Payment.created_at) >= str(s),
                func.date(Payment.created_at) <= str(e)).scalar() or 0)
    return {
        "period": period, "start": s, "end": e,
        "total_loads": len(loads),
        "completed": sum(1 for l in loads if l.status == "Delivered"),
        "cancelled": sum(1 for l in loads if l.status == "Cancelled"),
        "total_revenue": revenue,
        "loads_by_status": [
            {"status": st, "count": sum(1 for l in loads if l.status == st)}
            for st in ["Pending", "Assigned", "In Transit", "Delivered", "Cancelled"]
        ],
    }


@router.get("/revenue")
def revenue(months: int = 6, db: Session = Depends(get_db)):
    rows = (db.query(func.strftime("%Y-%m", Payment.created_at).label("m"),
                     func.coalesce(func.sum(Payment.amount), 0))
            .filter(Payment.status == "Paid").group_by("m").order_by("m").all())
    labels = {"01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun",
              "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"}
    data = [{"month": labels.get((m or "-")[5:7], m), "revenue": float(v)} for m, v in rows][-months:]
    return {"monthly": data}


@router.get("/daily-loads")
def daily_loads(days: int = 14, db: Session = Depends(get_db)):
    rows = (db.query(func.date(LoadRequest.created_at).label("d"), func.count(LoadRequest.id))
            .group_by("d").order_by("d").all())
    return {"daily": [{"date": str(d)[5:], "loads": c} for d, c in rows][-days:]}


@router.get("/top-routes")
def top_routes(limit: int = 5, db: Session = Depends(get_db)):
    rows = (db.query(LoadRequest.pickup_location, LoadRequest.drop_location,
                     func.count(LoadRequest.id).label("c"))
            .group_by(LoadRequest.pickup_location, LoadRequest.drop_location)
            .order_by(func.count(LoadRequest.id).desc()).limit(limit).all())
    return {"routes": [{"route": f"{a} → {b}", "loads": c} for a, b, c in rows]}


@router.get("/top-drivers")
def top_drivers(limit: int = 5, db: Session = Depends(get_db)):
    rows = db.query(Driver).order_by(Driver.total_trips.desc()).limit(limit).all()
    return {"drivers": [{"name": d.name, "trips": d.total_trips or 0, "rating": d.rating}
                        for d in rows]}
