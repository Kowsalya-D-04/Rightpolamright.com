from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
from models import Document, Driver, Truck
from schemas import TruckCreate, TruckOut, TruckUpdate
from utils.security import require_admin

router = APIRouter(prefix="/api/trucks", tags=["Trucks"], dependencies=[Depends(require_admin)])


def _out(t: Truck) -> dict:
    d = {c.name: getattr(t, c.name) for c in Truck.__table__.columns}
    d["driver_name"] = t.driver.name if t.driver else None
    return d


@router.get("", response_model=list[TruckOut])
def list_trucks(search: str = Query(None), status: str = Query(None),
                truck_type: str = Query(None), db: Session = Depends(get_db)):
    q = db.query(Truck)
    if search:
        term = f"%{search}%"
        q = q.filter(or_(Truck.truck_number.ilike(term), Truck.owner_name.ilike(term),
                         Truck.model.ilike(term)))
    if status and status != "All":
        q = q.filter(Truck.status == status)
    if truck_type and truck_type != "All":
        q = q.filter(Truck.truck_type == truck_type)
    return [_out(t) for t in q.order_by(Truck.id).all()]


@router.get("/{truck_id}", response_model=TruckOut)
def get_truck(truck_id: int, db: Session = Depends(get_db)):
    t = db.query(Truck).get(truck_id)
    if not t:
        raise HTTPException(404, "Truck not found.")
    return _out(t)


@router.get("/{truck_id}/documents")
def truck_documents(truck_id: int, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.owner_type == "truck",
                                     Document.owner_id == truck_id).all()
    return [{"id": x.id, "doc_type": x.doc_type, "doc_number": x.doc_number,
             "status": x.status, "expiry_date": x.expiry_date} for x in docs]


@router.post("", response_model=TruckOut, status_code=201)
def create_truck(payload: TruckCreate, db: Session = Depends(get_db)):
    if db.query(Truck).filter(Truck.truck_number == payload.truck_number).first():
        raise HTTPException(400, "That truck number is already registered.")
    t = Truck(**payload.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return _out(t)


@router.put("/{truck_id}", response_model=TruckOut)
def update_truck(truck_id: int, payload: TruckUpdate, db: Session = Depends(get_db)):
    t = db.query(Truck).get(truck_id)
    if not t:
        raise HTTPException(404, "Truck not found.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return _out(t)
