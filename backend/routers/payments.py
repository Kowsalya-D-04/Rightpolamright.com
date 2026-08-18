from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Customer, Invoice, Payment, Trip
from schemas import PaymentOut, PaymentStatusUpdate
from services.notifications import notify
from utils.security import require_admin

router = APIRouter(prefix="/api", tags=["Payments"], dependencies=[Depends(require_admin)])


def _out(p: Payment) -> dict:
    return {
        "id": p.id, "code": p.code, "trip_id": p.trip_id,
        "trip_code": p.trip.code if p.trip else None,
        "customer_id": p.customer_id,
        "customer_name": p.customer.name if p.customer else None,
        "amount": p.amount, "status": p.status, "payment_mode": p.payment_mode,
        "created_at": p.created_at, "paid_at": p.paid_at,
    }


@router.get("/payments/summary")
def payments_summary(db: Session = Depends(get_db)):
    today = datetime.now().date()
    month_start = today.replace(day=1)

    def total(*filters):
        return float(db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(*filters).scalar() or 0)

    return {
        "today_collection": total(Payment.status == "Paid", func.date(Payment.paid_at) == str(today)),
        "pending": total(Payment.status == "Pending"),
        "this_month": total(Payment.status == "Paid", Payment.paid_at >= month_start),
        "total_revenue": total(Payment.status == "Paid"),
    }


@router.get("/payments", response_model=list[PaymentOut])
def list_payments(status: str = Query(None), db: Session = Depends(get_db)):
    q = db.query(Payment)
    if status and status != "All":
        q = q.filter(Payment.status == status)
    return [_out(p) for p in q.order_by(Payment.id.desc()).all()]


@router.put("/payments/{payment_id}/status", response_model=PaymentOut)
def update_payment(payment_id: int, payload: PaymentStatusUpdate, db: Session = Depends(get_db)):
    p = db.query(Payment).get(payment_id)
    if not p:
        raise HTTPException(404, "Payment not found.")
    p.status = payload.status
    if payload.payment_mode:
        p.payment_mode = payload.payment_mode
    if payload.status == "Paid":
        p.paid_at = datetime.now()
        notify(db, "Payment Received", f"Payment {p.code} received",
               f"Rs{int(p.amount):,} received via {p.payment_mode}.", "payment", p.id, commit=False)
        if p.customer_id:
            note = notify(db, "Payment Received", f"Payment {p.code} confirmed",
                          f"We received Rs{int(p.amount):,} via {p.payment_mode}. Thank you.",
                          "payment", p.id, recipient_role="customer", commit=False)
            note.customer_id = p.customer_id
        if p.trip and p.trip.driver_id:
            notify(db, "Payment Received", f"Earnings credited for {p.trip.code}",
                   f"Rs{int(p.amount):,} settled for your trip.",
                   "payment", p.id, recipient_role="driver",
                   driver_id=p.trip.driver_id, commit=False)
    db.commit()
    return _out(p)


@router.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.query(Invoice).get(invoice_id)
    if not inv:
        raise HTTPException(404, "Invoice not found.")
    trip = inv.trip
    load = trip.load_request if trip else None
    customer = load.customer if load else None
    return {
        "invoice": {c.name: getattr(inv, c.name) for c in Invoice.__table__.columns},
        "trip": {"code": trip.code if trip else None,
                 "driver": trip.driver.name if trip and trip.driver else None,
                 "truck": trip.truck.truck_number if trip and trip.truck else None},
        "load": {"code": load.code if load else None,
                 "pickup": load.pickup_location if load else None,
                 "drop": load.drop_location if load else None,
                 "weight_ton": load.weight_ton if load else None,
                 "distance_km": load.distance_km if load else None},
        "customer": {"name": customer.name if customer else None,
                     "phone": customer.phone if customer else None,
                     "address": customer.address if customer else None,
                     "gst_number": customer.gst_number if customer else None},
        "payment": {"code": inv.payment.code if inv.payment else None,
                    "status": inv.payment.status if inv.payment else None,
                    "mode": inv.payment.payment_mode if inv.payment else None},
    }


@router.get("/invoices")
def list_invoices(db: Session = Depends(get_db)):
    rows = db.query(Invoice).order_by(Invoice.id.desc()).all()
    return [{"id": i.id, "code": i.code, "trip_code": i.trip.code if i.trip else None,
             "total_amount": i.total_amount, "created_at": i.created_at} for i in rows]
