"""Central place where domain events turn into notification rows."""
from sqlalchemy.orm import Session

from models import Notification


def notify(db: Session, type_: str, title: str, message: str,
           reference_type: str = None, reference_id: int = None,
           recipient_role: str = "admin", driver_id: int = None,
           commit: bool = True) -> Notification:
    n = Notification(
        type=type_, title=title, message=message,
        reference_type=reference_type, reference_id=reference_id,
        recipient_role=recipient_role, driver_id=driver_id,
    )
    db.add(n)
    if commit:
        db.commit()
        db.refresh(n)
    return n
