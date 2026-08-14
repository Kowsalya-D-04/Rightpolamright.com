"""Authentication for all three roles.

One JWT system, one users table. The role on the token decides which portal
the person lands in and which endpoints they may call.
"""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Customer, Driver, Truck, User
from schemas import (
    CustomerRegister, DriverRegister, LoginRequest, RoleTokenResponse,
    SessionUser, TokenResponse, UserOut,
)
from services.geo import geocode
from services.notifications import notify
from utils.security import (
    create_access_token, get_current_user, hash_password, verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


# --------------------------------------------------------------- helpers
def session_user(db: Session, user: User) -> dict:
    """Bundle the account with the customer/driver row it owns."""
    data = {
        "id": user.id, "name": user.name, "email": user.email,
        "role": user.role, "phone": user.phone,
        "customer_id": None, "driver_id": None,
        "customer_code": None, "driver_code": None, "kyc_status": None,
    }
    if user.role == "customer":
        c = db.query(Customer).filter(Customer.user_id == user.id).first()
        if c:
            data["customer_id"], data["customer_code"] = c.id, c.code
    elif user.role == "driver":
        d = db.query(Driver).filter(Driver.user_id == user.id).first()
        if d:
            data["driver_id"], data["driver_code"] = d.id, d.code
            data["kyc_status"] = d.kyc_status
    return data


def _issue(db: Session, user: User) -> dict:
    token = create_access_token(user.id, {"role": user.role, "name": user.name})
    return {"access_token": token, "token_type": "bearer",
            "user": session_user(db, user)}


def _find_user(db: Session, identifier: str) -> User | None:
    ident = (identifier or "").strip()
    return (db.query(User)
            .filter((User.email == ident.lower()) | (User.phone == ident))
            .first())


def _authenticate(db: Session, payload: LoginRequest, expected_role: str | None):
    user = _find_user(db, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Email or password is incorrect.")
    if not user.is_active:
        raise HTTPException(403, "This account has been deactivated.")
    if expected_role and user.role != expected_role:
        raise HTTPException(
            403,
            f"This is the {expected_role} sign-in. Your account is registered as "
            f"{user.role} — use the {user.role} sign-in instead.",
        )
    return _issue(db, user)


def _guard_email(db: Session, email: str, phone: str):
    email = email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(400, "An account with that email already exists. Sign in instead.")
    if phone and db.query(User).filter(User.phone == phone.strip()).first():
        raise HTTPException(400, "An account with that phone number already exists.")
    return email


# ---------------------------------------------------------------- login
@router.post("/login", response_model=RoleTokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Role-agnostic sign-in. The response says which portal to open."""
    return _authenticate(db, payload, None)


@router.post("/admin/login", response_model=RoleTokenResponse)
def admin_login(payload: LoginRequest, db: Session = Depends(get_db)):
    return _authenticate(db, payload, "admin")


@router.post("/customer/login", response_model=RoleTokenResponse)
def customer_login(payload: LoginRequest, db: Session = Depends(get_db)):
    return _authenticate(db, payload, "customer")


@router.post("/driver/login", response_model=RoleTokenResponse)
def driver_login(payload: LoginRequest, db: Session = Depends(get_db)):
    return _authenticate(db, payload, "driver")


@router.get("/me", response_model=SessionUser)
def me(current=Depends(get_current_user), db: Session = Depends(get_db)):
    return session_user(db, current)


# --------------------------------------------------------- registration
# There is deliberately no admin registration route. Admin accounts are
# created by seeding or by another admin, never self-service.

@router.post("/customer/register", response_model=RoleTokenResponse, status_code=201)
def register_customer(payload: CustomerRegister, db: Session = Depends(get_db)):
    email = _guard_email(db, payload.email, payload.phone)

    user = User(name=payload.name, email=email, phone=payload.phone.strip(),
                password_hash=hash_password(payload.password), role="customer")
    db.add(user)
    db.flush()

    count = db.query(Customer).count()
    customer = Customer(
        user_id=user.id, code=f"CUS{count + 1:03d}", name=payload.name,
        company=payload.company, phone=payload.phone.strip(), email=email,
        address=payload.address, city=payload.city, state=payload.state,
        pincode=payload.pincode, status="Active",
    )
    db.add(customer)
    db.commit()
    db.refresh(user)

    notify(db, "Load Created", "New customer registered",
           f"{customer.name} ({customer.company or 'individual'}) created an account.",
           "customer", customer.id)
    return _issue(db, user)


@router.post("/driver/register", response_model=RoleTokenResponse, status_code=201)
def register_driver(payload: DriverRegister, db: Session = Depends(get_db)):
    email = _guard_email(db, payload.email, payload.phone)
    if db.query(Truck).filter(Truck.truck_number == payload.vehicle_number.strip()).first():
        raise HTTPException(400, "That vehicle number is already registered.")

    user = User(name=payload.name, email=email, phone=payload.phone.strip(),
                password_hash=hash_password(payload.password), role="driver")
    db.add(user)
    db.flush()

    # The registration form asks for an address, not a city. Geocode whichever
    # we have -- without coordinates the driver can never be matched or shown
    # a distance to pickup.
    place = (payload.city or "").strip() or (payload.address or "").strip()
    point = geocode(place) or (None, None)
    if point[0] is None and payload.address:
        # "Ambattur, Chennai" -> try each comma-separated part.
        for part in reversed([p.strip() for p in payload.address.split(",") if p.strip()]):
            hit = geocode(part)
            if hit:
                place, point = part, hit
                break
    count = db.query(Driver).count()
    driver = Driver(
        user_id=user.id, code=f"DRV{count + 1:03d}", name=payload.name,
        phone=payload.phone.strip(), email=email,
        license_number=payload.license_number, license_expiry=payload.license_expiry,
        address=payload.address, experience_years=payload.experience_years or 0,
        current_location=place or payload.city, current_lat=point[0], current_lng=point[1],
        # A new driver waits for document checks before they can be matched.
        status="Offline", kyc_status="Pending", is_verified=False, is_active=True,
        rating=4.0, total_trips=0,
    )
    db.add(driver)
    db.flush()

    truck = Truck(
        truck_number=payload.vehicle_number.strip().upper(),
        truck_type=payload.truck_type, capacity_ton=payload.truck_capacity,
        owner_name=payload.name, driver_id=driver.id,
        status="Inactive", is_verified=False,
    )
    db.add(truck)
    db.commit()
    db.refresh(user)

    notify(db, "Document Expiry", "New driver awaiting verification",
           f"{driver.name} ({driver.code}) registered with {truck.truck_number}. "
           f"Verify documents to make them available for matching.",
           "driver", driver.id)
    return _issue(db, user)
