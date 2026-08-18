"""Create/repair the first RightPolamRight Admin account using the live MySQL users schema.

This script never drops tables, disables foreign keys, or bypasses SQLAlchemy.
"""
import getpass
import os

from database import SessionLocal
from models import Admin, User
from utils.security import hash_password

DEFAULT_ADMIN_EMAIL = "adminrightpolamright@gmail.com"


def run():
    db = SessionLocal()
    try:
        email = (os.getenv("RPR_ADMIN_EMAIL") or DEFAULT_ADMIN_EMAIL).strip().lower()
        password = os.getenv("RPR_ADMIN_PASSWORD") or ""
        full_name = (os.getenv("RPR_ADMIN_NAME") or "RightPolamRight Admin").strip()
        mobile_number = (os.getenv("RPR_ADMIN_MOBILE") or "").strip()

        # Always resolve the required Admin by the preserved email first.
        user = db.query(User).filter(User.email == email).first()

        if user:
            if (user.role or "").lower() != "admin":
                raise SystemExit(
                    f"{email} already exists but its role is {user.role!r}, not 'admin'. "
                    "No existing user was modified."
                )
            if (user.status or "").upper() != "ACTIVE" or user.deleted:
                raise SystemExit(
                    f"{email} exists but is not an active Admin account. "
                    "No existing data was modified automatically."
                )

            admin_row = db.query(Admin).filter(Admin.user_id == user.id).first()
            if not admin_row:
                db.add(Admin(
                    user_id=user.id,
                    designation="Super Admin",
                    department="Operations",
                ))
                db.commit()
                print(f"Admin profile row created for existing user: {email}")
            else:
                print(f"Admin ready: {email} (user_id={user.id}, admin_id={admin_row.id})")
            return

        if not password:
            print("\nNo Admin user exists with the configured email.")
            password = getpass.getpass("Admin password (minimum 8 characters): ")
        if len(password) < 8:
            raise SystemExit("Admin password must be at least 8 characters.")

        # mobile_number is NOT NULL in the current live users table, so do
        # not invent a fake number. Require the operator to provide it.
        if not mobile_number:
            mobile_number = input("Admin mobile number: ").strip()
        if not mobile_number:
            raise SystemExit("Admin mobile number is required by the current users schema.")

        if db.query(User).filter(User.mobile_number == mobile_number).first():
            raise SystemExit("That mobile number already belongs to another user.")

        user = User(
            full_name=full_name,
            email=email,
            mobile_number=mobile_number,
            password_hash=hash_password(password),
            role="admin",
            status="ACTIVE",
            email_verified=False,
            mobile_verified=False,
            deleted=False,
        )
        db.add(user)
        db.flush()

        admin_row = Admin(
            user_id=user.id,
            designation="Super Admin",
            department="Operations",
        )
        db.add(admin_row)
        db.commit()
        db.refresh(user)
        db.refresh(admin_row)

        print(
            f"Admin created successfully: {user.email} "
            f"(user_id={user.id}, admin_id={admin_row.id})"
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
