"""Pydantic request/response models."""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- auth ----------
class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False


class UserOut(ORMModel):
    id: int
    name: str
    email: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class SessionUser(ORMModel):
    """The signed-in account plus the profile row it points at."""
    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    customer_id: Optional[int] = None
    driver_id: Optional[int] = None
    driver_code: Optional[str] = None
    customer_code: Optional[str] = None
    kyc_status: Optional[str] = None


class RoleTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: SessionUser


class CustomerRegister(BaseModel):
    name: str
    company: Optional[str] = None
    customer_type: Optional[str] = "Individual"
    email: str
    phone: str
    password: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class DriverRegister(BaseModel):
    name: str
    phone: str
    email: str
    password: str
    license_number: str
    license_expiry: Optional[date] = None
    vehicle_number: str
    truck_type: str
    truck_capacity: float
    experience_years: Optional[float] = 0
    address: Optional[str] = None
    city: Optional[str] = None
    truck_model: Optional[str] = None
    truck_color: Optional[str] = None
    driver_image_url: Optional[str] = None
    license_image_url: Optional[str] = None
    rc_image_url: Optional[str] = None
    insurance_image_url: Optional[str] = None
    truck_image_url: Optional[str] = None


class CustomerLoadCreate(BaseModel):
    pickup_location: str
    drop_location: str
    load_type: Optional[str] = "General Goods"
    truck_type: str
    weight_ton: float
    required_date: Optional[date] = None
    required_time: Optional[str] = "09:00"
    expected_delivery_date: Optional[date] = None
    contact_number: Optional[str] = None
    special_instructions: Optional[str] = None
    load_image_url: Optional[str] = None
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    drop_lat: Optional[float] = None
    drop_lng: Optional[float] = None


class AvailabilitySlotCreate(BaseModel):
    available_from: date
    available_to: Optional[date] = None
    available_from_time: Optional[str] = "00:00"
    available_to_time: Optional[str] = "23:59"
    from_location: str
    from_lat: Optional[float] = None
    from_lng: Optional[float] = None
    preferred_drop: Optional[str] = None
    preferred_drop_lat: Optional[float] = None
    preferred_drop_lng: Optional[float] = None
    max_distance_km: Optional[float] = 250
    truck_id: Optional[int] = None
    trip_type: Optional[str] = "NEW_LOAD"
    total_capacity_ton: Optional[float] = None
    available_capacity_ton: Optional[float] = None
    notes: Optional[str] = None


class AvailabilitySlotOut(ORMModel):
    id: int
    driver_id: int
    truck_id: Optional[int] = None
    available_from: Optional[date] = None
    available_to: Optional[date] = None
    available_from_time: Optional[str] = None
    available_to_time: Optional[str] = None
    from_location: Optional[str] = None
    from_lat: Optional[float] = None
    from_lng: Optional[float] = None
    preferred_drop: Optional[str] = None
    preferred_drop_lat: Optional[float] = None
    preferred_drop_lng: Optional[float] = None
    max_distance_km: Optional[float] = None
    trip_type: Optional[str] = None
    total_capacity_ton: Optional[float] = None
    available_capacity_ton: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = "DRIVER_AVAILABLE"
    is_active: bool = True


class QuoteRequest(BaseModel):
    pickup_location: str
    drop_location: str
    weight_ton: float
    truck_type: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    drop_lat: Optional[float] = None
    drop_lng: Optional[float] = None


class ReviewCreate(BaseModel):
    rating: float
    comment: Optional[str] = None


# ---------- customers ----------
class CustomerBase(BaseModel):
    name: str
    company: Optional[str] = None
    customer_type: Optional[str] = "Individual"
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    gst_number: Optional[str] = None
    status: str = "Active"


class CustomerCreate(CustomerBase):
    pass


class CustomerOut(CustomerBase, ORMModel):
    id: int
    code: Optional[str] = None
    total_loads: int = 0
    completed_loads: int = 0
    cancelled_loads: int = 0
    total_spent: float = 0


# ---------- drivers ----------
class DriverBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None
    address: Optional[str] = None
    status: str = "Online"
    kyc_status: str = "Verified"
    current_location: Optional[str] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    rating: float = 4.5
    is_active: bool = True
    is_verified: bool = True


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None
    address: Optional[str] = None
    status: Optional[str] = None
    kyc_status: Optional[str] = None
    current_location: Optional[str] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    rating: Optional[float] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class DriverOut(DriverBase, ORMModel):
    id: int
    code: Optional[str] = None
    total_trips: int = 0
    photo_url: Optional[str] = None


# ---------- trucks ----------
class TruckBase(BaseModel):
    truck_number: str
    truck_type: str
    model: Optional[str] = None
    capacity_ton: float
    owner_name: Optional[str] = None
    chassis_number: Optional[str] = None
    engine_number: Optional[str] = None
    insurance_expiry: Optional[date] = None
    fitness_expiry: Optional[date] = None
    permit_expiry: Optional[date] = None
    pollution_expiry: Optional[date] = None
    status: str = "Available"
    driver_id: Optional[int] = None
    is_verified: bool = True


class TruckCreate(TruckBase):
    pass


class TruckUpdate(BaseModel):
    truck_number: Optional[str] = None
    truck_type: Optional[str] = None
    model: Optional[str] = None
    capacity_ton: Optional[float] = None
    owner_name: Optional[str] = None
    chassis_number: Optional[str] = None
    engine_number: Optional[str] = None
    insurance_expiry: Optional[date] = None
    status: Optional[str] = None
    driver_id: Optional[int] = None
    is_verified: Optional[bool] = None


class TruckOut(TruckBase, ORMModel):
    id: int
    driver_name: Optional[str] = None


# ---------- load requests ----------
class LoadRequestBase(BaseModel):
    customer_id: int
    pickup_location: str
    drop_location: str
    load_type: Optional[str] = "General Goods"
    truck_type: str
    weight_ton: float
    required_date: Optional[date] = None
    required_time: Optional[str] = "09:00"
    budget: Optional[float] = None
    special_instructions: Optional[str] = None


class LoadRequestCreate(LoadRequestBase):
    pass


class LoadRequestUpdate(BaseModel):
    pickup_location: Optional[str] = None
    drop_location: Optional[str] = None
    load_type: Optional[str] = None
    truck_type: Optional[str] = None
    weight_ton: Optional[float] = None
    required_date: Optional[date] = None
    required_time: Optional[str] = None
    budget: Optional[float] = None
    special_instructions: Optional[str] = None
    status: Optional[str] = None


class LoadRequestOut(LoadRequestBase, ORMModel):
    id: int
    code: str
    status: str
    workflow_status: Optional[str] = None
    unit_price_per_km: Optional[float] = None
    load_image_url: Optional[str] = None
    accepted_driver_id: Optional[int] = None
    accepted_truck_id: Optional[int] = None
    distance_km: Optional[float] = None
    estimated_fare: Optional[float] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    created_at: Optional[datetime] = None
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    drop_lat: Optional[float] = None
    drop_lng: Optional[float] = None


# ---------- matching ----------
class MatchOut(BaseModel):
    has_published_availability: bool = False
    availability_window: Optional[dict] = None
    driver_id: int
    driver_code: Optional[str] = None
    driver_name: str
    driver_phone: Optional[str] = None
    driver_rating: Optional[float] = None
    driver_status: Optional[str] = None
    driver_total_trips: Optional[int] = 0
    truck_id: int
    truck_number: str
    truck_type: str
    truck_model: Optional[str] = None
    truck_capacity: float
    truck_status: Optional[str] = None
    current_location: Optional[str] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    distance_from_pickup_km: Optional[float] = None
    estimated_fare: Optional[float] = None
    fare_breakdown: Optional[dict] = None
    match_score: float
    grade: str
    availability_label: Optional[str] = None
    score_breakdown: Optional[dict] = None
    is_shortlisted: bool = False


class MatchResponse(BaseModel):
    load: LoadRequestOut
    criteria: dict
    total_candidates: int
    matches: List[MatchOut]


class AssignRequest(BaseModel):
    driver_id: int
    truck_id: int
    offered_fare: Optional[float] = None
    advance_amount: Optional[float] = 0
    message_to_driver: Optional[str] = None


# ---------- trips ----------
class TripOut(ORMModel):
    id: int
    code: str
    load_request_id: int
    load_code: Optional[str] = None
    driver_id: int
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    truck_id: int
    truck_number: Optional[str] = None
    status: str
    offered_fare: Optional[float] = None
    advance_amount: Optional[float] = None
    pickup_location: Optional[str] = None
    drop_location: Optional[str] = None
    distance_km: Optional[float] = None
    eta_minutes: Optional[int] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    start_date: Optional[datetime] = None
    customer_name: Optional[str] = None


class LocationUpdate(BaseModel):
    lat: float
    lng: float
    speed_kmph: Optional[float] = 0


class TripStatusUpdate(BaseModel):
    status: str


# ---------- payments / invoices ----------
class PaymentOut(ORMModel):
    id: int
    code: str
    trip_id: Optional[int] = None
    trip_code: Optional[str] = None
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    amount: float
    status: str
    payment_mode: str
    created_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None


class PaymentStatusUpdate(BaseModel):
    status: str
    payment_mode: Optional[str] = None


# ---------- pricing ----------
class PricingRequest(BaseModel):
    pickup_location: str
    drop_location: str
    weight_ton: float
    truck_type: str
    distance_km: Optional[float] = None


class PricingRuleUpdate(BaseModel):
    """Admin-editable rate card. Every field is optional so the admin can
    change just the Rate Per KM without resending the whole row."""
    base_fare: Optional[float] = None
    rate_per_km: Optional[float] = None
    rate_per_ton: Optional[float] = None
    rate_per_kg: Optional[float] = None
    fuel_charge_per_km: Optional[float] = None
    loading_charge: Optional[float] = None
    unloading_charge: Optional[float] = None
    driver_bata: Optional[float] = None
    platform_fee_percent: Optional[float] = None
    gst_percent: Optional[float] = None
    is_active: Optional[bool] = None
    reason: Optional[str] = None


# ---------- notifications ----------
class NotificationOut(ORMModel):
    id: int
    type: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None
    is_read: bool
    created_at: Optional[datetime] = None
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
