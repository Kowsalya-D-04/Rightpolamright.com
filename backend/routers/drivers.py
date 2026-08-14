from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
from models import Document, Driver, Trip, Truck
from schemas import DriverCreate, DriverOut, DriverUpdate
from services.geo import geocode
from utils.security import require_admin

router = APIRouter(prefix="/api/drivers", tags=["Drivers"], dependencies=[Depends(require_admin)])

ACTIVE = ("Assigned", "Pickup Reached", "Loading", "In Transit", "Reached")


@router.get("", response_model=list[DriverOut])
def list_drivers(search: str = Query(None), status: str = Query(None), db: Session = Depends(get_db)):
    q = db.query(Driver)
    if search:
        term = f"%{search}%"
        q = q.filter(or_(Driver.name.ilike(term), Driver.phone.ilike(term),
                         Driver.code.ilike(term), Driver.license_number.ilike(term)))
    if status and status != "All":
        q = q.filter(Driver.status == status)
    return q.order_by(Driver.id).all()


@router.get("/{driver_id}", response_model=DriverOut)
def get_driver(driver_id: int, db: Session = Depends(get_db)):
    d = db.query(Driver).get(driver_id)
    if not d:
        raise HTTPException(404, "Driver not found.")
    return d


@router.get("/{driver_id}/profile")
def driver_profile(driver_id: int, db: Session = Depends(get_db)):
    d = db.query(Driver).get(driver_id)
    if not d:
        raise HTTPException(404, "Driver not found.")
    trucks = db.query(Truck).filter(Truck.driver_id == d.id).all()
    current = (db.query(Trip).filter(Trip.driver_id == d.id, Trip.status.in_(ACTIVE))
               .order_by(Trip.id.desc()).first())
    docs = db.query(Document).filter(Document.owner_type == "driver",
                                     Document.owner_id == d.id).all()
    return {
        "driver": DriverOut.model_validate(d).model_dump(),
        "trucks": [{"id": t.id, "truck_number": t.truck_number, "truck_type": t.truck_type,
                    "capacity_ton": t.capacity_ton, "status": t.status,
                    "is_verified": t.is_verified} for t in trucks],
        "current_trip": ({"id": current.id, "code": current.code, "status": current.status,
                          "pickup": current.load_request.pickup_location,
                          "drop": current.load_request.drop_location} if current else None),
        "documents": [{"id": x.id, "doc_type": x.doc_type, "doc_number": x.doc_number,
                       "status": x.status, "expiry_date": x.expiry_date} for x in docs],
    }


@router.post("/{driver_id}/verification")
def set_driver_verification(driver_id: int, payload: dict, db: Session = Depends(get_db)):
    """Approve/reject a registered driver and their assigned trucks atomically.

    Matching intentionally requires verified drivers and verified trucks. The
    registration flow creates both as pending/inactive, so Admin must complete
    this step before the driver can enter the matching pool.
    """
    d = db.query(Driver).get(driver_id)
    if not d:
        raise HTTPException(404, "Driver not found.")

    status = str(payload.get("status") or "").strip().title()
    if status not in ("Verified", "Rejected"):
        raise HTTPException(400, "status must be Verified or Rejected.")

    trucks = db.query(Truck).filter(Truck.driver_id == d.id).all()
    if status == "Verified" and not trucks:
        raise HTTPException(400, "Verify/register at least one truck before approving this driver.")

    d.kyc_status = status
    d.is_verified = status == "Verified"
    if status == "Rejected":
        d.status = "Offline"

    for truck in trucks:
        truck.is_verified = status == "Verified"
        if status == "Verified" and truck.status == "Inactive":
            truck.status = "Available"
        elif status == "Rejected" and truck.status != "Busy":
            truck.status = "Inactive"

    db.commit()
    db.refresh(d)
    return {
        "driver_id": d.id,
        "kyc_status": d.kyc_status,
        "is_verified": d.is_verified,
        "trucks": [{
            "id": t.id, "truck_number": t.truck_number,
            "status": t.status, "is_verified": t.is_verified,
        } for t in trucks],
    }


@router.post("", response_model=DriverOut, status_code=201)
def create_driver(payload: DriverCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()
    if data.get("current_location") and not data.get("current_lat"):
        pt = geocode(data["current_location"])
        if pt:
            data["current_lat"], data["current_lng"] = pt
    count = db.query(Driver).count()
    d = Driver(code=f"DRV{count + 1:03d}", **data)
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.put("/{driver_id}", response_model=DriverOut)
def update_driver(driver_id: int, payload: DriverUpdate, db: Session = Depends(get_db)):
    d = db.query(Driver).get(driver_id)
    if not d:
        raise HTTPException(404, "Driver not found.")
    data = payload.model_dump(exclude_unset=True)
    if data.get("current_location") and "current_lat" not in data:
        pt = geocode(data["current_location"])
        if pt:
            data["current_lat"], data["current_lng"] = pt
    for k, v in data.items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return d


@router.put("/{driver_id}/documents/{doc_id}")
def set_document_status(driver_id: int, doc_id: int, status: str, db: Session = Depends(get_db)):
    doc = db.query(Document).get(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found.")
    doc.status = status
    db.commit()
    return {"id": doc.id, "status": doc.status}
