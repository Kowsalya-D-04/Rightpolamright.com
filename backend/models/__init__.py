"""All ORM models for the RightPolamRight platform."""
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text,
)
from sqlalchemy.dialects.mysql import BIGINT as MYSQL_BIGINT
from sqlalchemy.orm import relationship, synonym
from sqlalchemy.ext.hybrid import hybrid_property

from database import Base

# Canonical MySQL identifier type. All PK/FK identifier columns use the same
# signed BIGINT definition so MySQL foreign-key compatibility is guaranteed.
ID_TYPE = MYSQL_BIGINT(unsigned=False)


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id = Column(ID_TYPE, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(160), unique=True, index=True)
    mobile_number = Column(String(20), nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)
    status = Column(String(30), nullable=False, default="ACTIVE")
    email_verified = Column(Boolean, nullable=False, default=False)
    mobile_verified = Column(Boolean, nullable=False, default=False)
    last_login_at = Column(DateTime)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)
    deleted = Column(Boolean, nullable=False, default=False)

    # Compatibility aliases keep the existing frontend/auth/business code
    # working while the ORM maps only to the ACTUAL MySQL column names.
    name = synonym("full_name")
    phone = synonym("mobile_number")

    @hybrid_property
    def is_active(self):
        return (self.status or "").upper() == "ACTIVE" and not bool(self.deleted)

    @is_active.setter
    def is_active(self, value):
        if value:
            self.status = "ACTIVE"
            self.deleted = False
        else:
            self.status = "INACTIVE"

    @is_active.expression
    def is_active(cls):
        return (cls.status == "ACTIVE") & (cls.deleted.is_(False))

    admin = relationship("Admin", back_populates="user", uselist=False)



class Admin(Base):
    __tablename__ = "admins"
    id = Column(ID_TYPE, primary_key=True, index=True)
    user_id = Column(ID_TYPE, ForeignKey("users.id"), nullable=False)
    designation = Column(String(80), default="Super Admin")
    department = Column(String(80), default="Operations")

    user = relationship("User", back_populates="admin")


class Customer(Base):
    __tablename__ = "customers"
    id = Column(ID_TYPE, primary_key=True, index=True)
    user_id = Column(ID_TYPE, ForeignKey("users.id"), index=True)   # login account
    code = Column(String(20), unique=True, index=True)   # CUS001
    name = Column(String(120), nullable=False)
    company = Column(String(150))
    customer_type = Column(String(30), default="Individual")
    phone = Column(String(20), index=True)
    email = Column(String(120), index=True)
    address = Column(Text)
    city = Column(String(80))
    state = Column(String(80))
    pincode = Column(String(10))
    gst_number = Column(String(30))
    status = Column(String(20), default="Active")        # Active | Inactive
    created_at = Column(DateTime, default=_now)

    user = relationship("User", foreign_keys=[user_id])
    load_requests = relationship("LoadRequest", back_populates="customer")


class Driver(Base):
    __tablename__ = "drivers"
    id = Column(ID_TYPE, primary_key=True, index=True)
    user_id = Column(ID_TYPE, ForeignKey("users.id"), index=True)   # login account
    code = Column(String(20), unique=True, index=True)   # DRV001
    name = Column(String(120), nullable=False)
    phone = Column(String(20), index=True)
    email = Column(String(120))
    photo_url = Column(String(255))
    license_image_url = Column(String(255))
    license_number = Column(String(40))
    license_expiry = Column(Date)
    address = Column(Text)

    # Operational state used by the matching engine
    status = Column(String(20), default="Online")        # Online | Busy | Offline | Suspended
    kyc_status = Column(String(20), default="Verified")  # Verified | Pending | Rejected
    is_verified = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)

    current_location = Column(String(120))               # human readable, e.g. "Chennai"
    current_lat = Column(Float)
    current_lng = Column(Float)
    location_updated_at = Column(DateTime, default=_now)

    rating = Column(Float, default=4.5)
    total_trips = Column(Integer, default=0)
    experience_years = Column(Float, default=0)
    created_at = Column(DateTime, default=_now)

    user = relationship("User", foreign_keys=[user_id])
    trucks = relationship("Truck", back_populates="driver")
    trips = relationship("Trip", back_populates="driver")
    ratings = relationship("DriverRating", back_populates="driver")


class Truck(Base):
    __tablename__ = "trucks"
    id = Column(ID_TYPE, primary_key=True, index=True)
    truck_number = Column(String(20), unique=True, index=True)
    truck_type = Column(String(50), index=True)          # Open Truck | Container | Trailer | Tipper | Tanker
    model = Column(String(80))
    color = Column(String(40))
    truck_image_url = Column(String(255))
    rc_image_url = Column(String(255))
    insurance_image_url = Column(String(255))
    capacity_ton = Column(Float, nullable=False)
    owner_name = Column(String(120))
    chassis_number = Column(String(50))
    engine_number = Column(String(50))
    insurance_expiry = Column(Date)
    fitness_expiry = Column(Date)
    permit_expiry = Column(Date)
    pollution_expiry = Column(Date)
    status = Column(String(20), default="Available")     # Available | Busy | Maintenance | Inactive
    is_verified = Column(Boolean, default=True)
    driver_id = Column(ID_TYPE, ForeignKey("drivers.id"))
    created_at = Column(DateTime, default=_now)

    driver = relationship("Driver", back_populates="trucks")
    trips = relationship("Trip", back_populates="truck")


class LoadRequest(Base):
    __tablename__ = "load_requests"
    id = Column(ID_TYPE, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True)   # LD1001
    customer_id = Column(ID_TYPE, ForeignKey("customers.id"), nullable=False)

    pickup_location = Column(String(120), nullable=False)
    pickup_lat = Column(Float)
    pickup_lng = Column(Float)
    drop_location = Column(String(120), nullable=False)
    drop_lat = Column(Float)
    drop_lng = Column(Float)

    load_type = Column(String(60))                       # General Goods | Fragile | ...
    truck_type = Column(String(50), index=True)
    weight_ton = Column(Float, nullable=False)
    distance_km = Column(Float)
    required_date = Column(Date, index=True)
    required_time = Column(String(10), default="09:00")
    expected_delivery_date = Column(Date)
    contact_number = Column(String(20))
    budget = Column(Float)
    special_instructions = Column(Text)

    status = Column(String(20), default="Pending", index=True)  # Pending|Assigned|In Transit|Delivered|Cancelled

    # Fine-grained lifecycle shown to all three portals. `status` stays as the
    # coarse operational state so existing screens and queries keep working.
    workflow_status = Column(String(30), default="LOAD_REQUESTED", index=True)

    # Priced once by services/pricing.py and stored, so every screen shows the
    # same number instead of recalculating it.
    estimated_fare = Column(Float)
    unit_price_per_km = Column(Float)
    price_breakdown = Column(Text)                       # JSON snapshot

    load_image_url = Column(String(255))

    # Driver self-acceptance trail (admin confirms afterwards).
    accepted_driver_id = Column(ID_TYPE, ForeignKey("drivers.id"))
    accepted_truck_id = Column(ID_TYPE, ForeignKey("trucks.id"))
    driver_accepted_at = Column(DateTime)
    admin_confirmed_at = Column(DateTime)

    created_at = Column(DateTime, default=_now)

    customer = relationship("Customer", back_populates="load_requests")
    accepted_driver = relationship("Driver", foreign_keys=[accepted_driver_id])
    accepted_truck = relationship("Truck", foreign_keys=[accepted_truck_id])
    matches = relationship("LoadMatch", back_populates="load_request", cascade="all, delete-orphan")
    trip = relationship("Trip", back_populates="load_request", uselist=False)


class LoadMatch(Base):
    """A persisted snapshot of a matching run, so admins can shortlist."""
    __tablename__ = "load_matches"
    id = Column(ID_TYPE, primary_key=True, index=True)
    load_request_id = Column(ID_TYPE, ForeignKey("load_requests.id"), nullable=False)
    driver_id = Column(ID_TYPE, ForeignKey("drivers.id"), nullable=False)
    truck_id = Column(ID_TYPE, ForeignKey("trucks.id"), nullable=False)

    match_score = Column(Float)
    distance_km = Column(Float)
    estimated_fare = Column(Float)
    score_breakdown = Column(Text)                        # JSON string
    is_shortlisted = Column(Boolean, default=False)
    response_status = Column(String(20), default="PENDING", index=True)  # PENDING | ACCEPTED | REJECTED
    responded_at = Column(DateTime)
    created_at = Column(DateTime, default=_now)

    load_request = relationship("LoadRequest", back_populates="matches")
    driver = relationship("Driver")
    truck = relationship("Truck")


class Trip(Base):
    __tablename__ = "trips"
    id = Column(ID_TYPE, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True)   # TRP001
    load_request_id = Column(ID_TYPE, ForeignKey("load_requests.id"), nullable=False)
    driver_id = Column(ID_TYPE, ForeignKey("drivers.id"), nullable=False)
    truck_id = Column(ID_TYPE, ForeignKey("trucks.id"), nullable=False)

    status = Column(String(30), default="Assigned", index=True)
    offered_fare = Column(Float)
    advance_amount = Column(Float, default=0)
    message_to_driver = Column(Text)

    start_date = Column(DateTime)
    end_date = Column(DateTime)
    current_lat = Column(Float)
    current_lng = Column(Float)
    eta_minutes = Column(Integer)
    delivery_photo_url = Column(String(255))
    delivery_signature_url = Column(String(255))
    delivery_confirmed_at = Column(DateTime)
    created_at = Column(DateTime, default=_now)

    load_request = relationship("LoadRequest", back_populates="trip")
    driver = relationship("Driver", back_populates="trips")
    truck = relationship("Truck", back_populates="trips")
    locations = relationship("TripLocation", back_populates="trip", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="trip", uselist=False)


class TripLocation(Base):
    __tablename__ = "trip_locations"
    id = Column(ID_TYPE, primary_key=True, index=True)
    trip_id = Column(ID_TYPE, ForeignKey("trips.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    speed_kmph = Column(Float, default=0)
    recorded_at = Column(DateTime, default=_now)

    trip = relationship("Trip", back_populates="locations")


class Payment(Base):
    __tablename__ = "payments"
    id = Column(ID_TYPE, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True)   # PAY001
    trip_id = Column(ID_TYPE, ForeignKey("trips.id"))
    customer_id = Column(ID_TYPE, ForeignKey("customers.id"))
    amount = Column(Float, nullable=False)
    status = Column(String(20), default="Pending")       # Paid | Pending | Failed | Refunded
    payment_mode = Column(String(20), default="UPI")     # UPI | Card | Net Banking | Wallet | Cash
    transaction_reference = Column(String(80), index=True)
    provider_reference = Column(String(120))
    paid_at = Column(DateTime)
    created_at = Column(DateTime, default=_now)

    trip = relationship("Trip", back_populates="payment")
    customer = relationship("Customer")
    invoice = relationship("Invoice", back_populates="payment", uselist=False)


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(ID_TYPE, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True)   # INV001
    payment_id = Column(ID_TYPE, ForeignKey("payments.id"))
    trip_id = Column(ID_TYPE, ForeignKey("trips.id"))

    base_fare = Column(Float, default=0)
    distance_charge = Column(Float, default=0)
    weight_charge = Column(Float, default=0)
    fuel_charge = Column(Float, default=0)
    toll_charge = Column(Float, default=0)
    loading_charge = Column(Float, default=0)
    unloading_charge = Column(Float, default=0)
    driver_bata = Column(Float, default=0)
    platform_fee = Column(Float, default=0)
    gst = Column(Float, default=0)
    surge_amount = Column(Float, default=0)
    total_amount = Column(Float, default=0)
    created_at = Column(DateTime, default=_now)

    payment = relationship("Payment", back_populates="invoice")
    trip = relationship("Trip")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(ID_TYPE, primary_key=True, index=True)
    type = Column(String(40), index=True)
    title = Column(String(150))
    message = Column(Text)
    reference_type = Column(String(30))
    reference_id = Column(Integer)
    recipient_role = Column(String(20), default="admin")   # admin | driver | customer
    driver_id = Column(ID_TYPE, ForeignKey("drivers.id"))
    customer_id = Column(ID_TYPE, ForeignKey("customers.id"))
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=_now, index=True)


class Document(Base):
    __tablename__ = "documents"
    id = Column(ID_TYPE, primary_key=True, index=True)
    owner_type = Column(String(20), index=True)          # driver | truck
    owner_id = Column(Integer, index=True)
    doc_type = Column(String(40))                        # Aadhaar | Driving License | RC Book | ...
    doc_number = Column(String(60))
    file_url = Column(String(255))
    status = Column(String(20), default="Verified")      # Verified | Pending | Rejected
    expiry_date = Column(Date)
    created_at = Column(DateTime, default=_now)


class PricingRule(Base):
    __tablename__ = "pricing_rules"
    id = Column(ID_TYPE, primary_key=True, index=True)
    truck_type = Column(String(50), index=True)
    base_fare = Column(Float, default=8000)
    rate_per_km = Column(Float, default=20)
    rate_per_ton = Column(Float, default=300)
    rate_per_kg = Column(Float, default=0.30)
    fuel_charge_per_km = Column(Float, default=0)
    loading_charge = Column(Float, default=1000)
    unloading_charge = Column(Float, default=1000)
    driver_bata = Column(Float, default=1500)
    platform_fee_percent = Column(Float, default=5)
    gst_percent = Column(Float, default=18)
    is_active = Column(Boolean, default=True)


class RoutePricing(Base):
    __tablename__ = "route_pricing"
    id = Column(ID_TYPE, primary_key=True, index=True)
    origin = Column(String(80), index=True)
    destination = Column(String(80), index=True)
    distance_km = Column(Float)
    toll_charge = Column(Float, default=0)
    demand_level = Column(String(20), default="Normal")  # Low | Normal | High
    is_active = Column(Boolean, default=True)


class DriverRating(Base):
    __tablename__ = "driver_ratings"
    id = Column(ID_TYPE, primary_key=True, index=True)
    driver_id = Column(ID_TYPE, ForeignKey("drivers.id"), nullable=False)
    trip_id = Column(ID_TYPE, ForeignKey("trips.id"))
    customer_id = Column(ID_TYPE, ForeignKey("customers.id"))
    rating = Column(Float, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, default=_now)

    driver = relationship("Driver", back_populates="ratings")


class DriverAvailability(Base):
    """Unavailability windows (leave, servicing, pre-booked)."""
    __tablename__ = "driver_availability"
    id = Column(ID_TYPE, primary_key=True, index=True)
    driver_id = Column(ID_TYPE, ForeignKey("drivers.id"), nullable=False)
    unavailable_date = Column(Date, index=True)
    reason = Column(String(120))


class DriverAvailabilitySlot(Base):
    """A driver declaring when and where they are free to take work.

    Matching prefers drivers who have published a slot covering the load's
    date and origin; it is the driver-side half of the matching handshake.
    """
    __tablename__ = "driver_availability_slots"
    id = Column(ID_TYPE, primary_key=True, index=True)
    driver_id = Column(ID_TYPE, ForeignKey("drivers.id"), nullable=False, index=True)
    truck_id = Column(ID_TYPE, ForeignKey("trucks.id"))

    available_from = Column(Date, index=True)
    available_to = Column(Date, index=True)
    available_from_time = Column(String(10), default="00:00")
    available_to_time = Column(String(10), default="23:59")
    from_location = Column(String(120))                  # where the truck will be
    from_lat = Column(Float)
    from_lng = Column(Float)
    preferred_drop = Column(String(120))                 # optional return-leg bias
    preferred_drop_lat = Column(Float)
    preferred_drop_lng = Column(Float)
    max_distance_km = Column(Float, default=250)
    trip_type = Column(String(30), default="NEW_LOAD")
    total_capacity_ton = Column(Float)
    available_capacity_ton = Column(Float)
    notes = Column(String(200))
    status = Column(String(30), default="DRIVER_AVAILABLE", index=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=_now)

    driver = relationship("Driver")
    truck = relationship("Truck")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(ID_TYPE, primary_key=True, index=True)
    actor_user_id = Column(ID_TYPE, ForeignKey("users.id"))
    action = Column(String(80), nullable=False, index=True)
    entity_type = Column(String(50), index=True)
    entity_id = Column(Integer)
    reason = Column(Text)
    before_json = Column(Text)
    after_json = Column(Text)
    created_at = Column(DateTime, default=_now, index=True)
