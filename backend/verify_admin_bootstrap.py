"""Verify the bootstrap Admin through SQLAlchemy after bootstrap_admin.py."""
import os

from database import SessionLocal
from models import Admin, User

ADMIN_EMAIL = (
    os.getenv("RPR_ADMIN_EMAIL") or "adminrightpolamright@gmail.com"
).strip().lower()

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
    if not user:
        raise SystemExit(f"ADMIN BOOTSTRAP VERIFICATION FAILED: user {ADMIN_EMAIL} not found.")

    admin = db.query(Admin).filter(Admin.user_id == user.id).first()
    if not admin:
        raise SystemExit(
            f"ADMIN BOOTSTRAP VERIFICATION FAILED: admins row for user_id={user.id} not found."
        )

    if (user.role or "").lower() != "admin":
        raise SystemExit(
            f"ADMIN BOOTSTRAP VERIFICATION FAILED: role={user.role!r}, expected 'admin'."
        )
    if (user.status or "").upper() != "ACTIVE" or user.deleted:
        raise SystemExit(
            "ADMIN BOOTSTRAP VERIFICATION FAILED: Admin user is not ACTIVE."
        )

    print("ADMIN USER VERIFICATION:")
    print({
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "status": user.status,
    })
    print("ADMIN PROFILE VERIFICATION:")
    print({
        "id": admin.id,
        "user_id": admin.user_id,
        "designation": admin.designation,
        "department": admin.department,
    })
    print("ADMIN BOOTSTRAP VERIFICATION: PASS")
finally:
    db.close()
