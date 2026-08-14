from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from database import get_db
from models import Customer, LoadRequest, Payment, Trip
from schemas import CustomerCreate, CustomerOut
from utils.security import require_admin

router = APIRouter(prefix="/api/customers", tags=["Customers"], dependencies=[Depends(require_admin)])


def _serialize(db: Session, c: Customer) -> dict:
    loads = db.query(LoadRequest).filter(LoadRequest.customer_id == c.id).all()
    spent = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.customer_id == c.id, Payment.status == "Paid")
        .scalar()
    )
    return {
        **{k: getattr(c, k) for k in
           ["id", "code", "name", "company", "phone", "email", "address", "city", "gst_number", "status"]},
        "total_loads": len(loads),
        "completed_loads": sum(1 for l in loads if l.status == "Delivered"),
        "cancelled_loads": sum(1 for l in loads if l.status == "Cancelled"),
        "total_spent": float(spent or 0),
    }


@router.get("", response_model=list[CustomerOut])
def list_customers(search: str = Query(None), db: Session = Depends(get_db)):
    q = db.query(Customer)
    if search:
        term = f"%{search}%"
        q = q.filter(or_(Customer.name.ilike(term), Customer.phone.ilike(term),
                         Customer.email.ilike(term), Customer.code.ilike(term)))
    return [_serialize(db, c) for c in q.order_by(Customer.id).all()]


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    c = db.query(Customer).get(customer_id)
    if not c:
        raise HTTPException(404, "Customer not found.")
    return _serialize(db, c)


@router.get("/{customer_id}/loads")
def customer_loads(customer_id: int, db: Session = Depends(get_db)):
    loads = (db.query(LoadRequest).filter(LoadRequest.customer_id == customer_id)
             .order_by(LoadRequest.id.desc()).all())
    return [{"id": l.id, "code": l.code, "pickup_location": l.pickup_location,
             "drop_location": l.drop_location, "weight_ton": l.weight_ton,
             "status": l.status, "required_date": l.required_date,
             "estimated_fare": l.estimated_fare} for l in loads]


@router.post("", response_model=CustomerOut, status_code=201)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    count = db.query(Customer).count()
    c = Customer(code=f"CUS{count + 1:03d}", **payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return _serialize(db, c)


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, payload: CustomerCreate, db: Session = Depends(get_db)):
    c = db.query(Customer).get(customer_id)
    if not c:
        raise HTTPException(404, "Customer not found.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return _serialize(db, c)
