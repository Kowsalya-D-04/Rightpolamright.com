"""Create the first real admin account.

Preferred unattended setup:
  RPR_ADMIN_EMAIL
  RPR_ADMIN_PASSWORD
  RPR_ADMIN_NAME (optional)

On an interactive first run, if no admin exists and the environment variables
are absent, this script asks for the admin email/password instead of relying on
demo credentials.
"""
import getpass
import os

from database import SessionLocal
from models import Admin, User
from utils.security import hash_password


def run():
    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.role == "admin").first()
        if existing_admin:
            print(f"Admin ready: {existing_admin.email}")
            return

        email = (os.getenv("RPR_ADMIN_EMAIL") or "").strip().lower()
        password = os.getenv("RPR_ADMIN_PASSWORD") or ""
        name = (os.getenv("RPR_ADMIN_NAME") or "RightPolamRight Admin").strip()

        if not email or not password:
            print("\nNo Admin account exists yet.")
            print("Create the first real Admin account (stored in the database).")
            if not email:
                email = input("Admin email: ").strip().lower()
            if not password:
                password = getpass.getpass("Admin password (minimum 8 characters): ")

        if not email or "@" not in email:
            raise SystemExit("A valid Admin email is required.")
        if len(password) < 8:
            raise SystemExit("Admin password must be at least 8 characters.")

        if db.query(User).filter(User.email == email).first():
            raise SystemExit("That email already belongs to another account.")

        admin = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.flush()
        db.add(Admin(user_id=admin.id, designation="Super Admin", department="Operations"))
        db.commit()
        print(f"Admin created successfully: {email}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
