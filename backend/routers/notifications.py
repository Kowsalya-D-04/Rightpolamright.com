from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Notification
from schemas import NotificationOut
from utils.security import require_admin

router = APIRouter(prefix="/api/notifications", tags=["Notifications"],
                   dependencies=[Depends(require_admin)])


@router.get("", response_model=list[NotificationOut])
def list_notifications(unread_only: bool = Query(False), limit: int = Query(100),
                       db: Session = Depends(get_db)):
    q = db.query(Notification)
    if unread_only:
        q = q.filter(Notification.is_read.is_(False))
    return q.order_by(Notification.created_at.desc()).limit(limit).all()


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db)):
    return {"count": db.query(Notification).filter(Notification.is_read.is_(False)).count()}


@router.put("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).get(notification_id)
    if not n:
        raise HTTPException(404, "Notification not found.")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n


@router.put("/read-all")
def mark_all_read(db: Session = Depends(get_db)):
    updated = db.query(Notification).filter(Notification.is_read.is_(False)).update({"is_read": True})
    db.commit()
    return {"updated": updated}
