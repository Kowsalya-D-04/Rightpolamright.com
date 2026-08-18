"""Dynamic pricing engine.

Every component is computed from database-backed rules and live demand.
No final price is ever hardcoded.
"""
from datetime import date, datetime

from sqlalchemy.orm import Session

from models import LoadRequest, PricingRule, RoutePricing, Truck
from services.geo import resolve_point, road_distance_km

DEFAULT_RULE = dict(
    base_fare=8000, rate_per_km=20, rate_per_ton=300, rate_per_kg=0.30, fuel_charge_per_km=0, loading_charge=1000,
    unloading_charge=1000, driver_bata=1500, platform_fee_percent=5, gst_percent=18,
)

TRUCK_TYPE_MULTIPLIER = {
    "Open Truck": 1.0,
    "Container": 1.12,
    "Trailer": 1.25,
    "Tipper": 1.08,
    "Tanker": 1.20,
}


def _rule_for(db: Session, truck_type: str) -> dict:
    rule = (
        db.query(PricingRule)
        .filter(PricingRule.truck_type == truck_type, PricingRule.is_active.is_(True))
        .first()
    )
    if not rule:
        return dict(DEFAULT_RULE)
    return dict(
        base_fare=rule.base_fare, rate_per_km=rule.rate_per_km, rate_per_ton=rule.rate_per_ton,
        rate_per_kg=(rule.rate_per_kg if getattr(rule, "rate_per_kg", None) is not None else (rule.rate_per_ton or 0) / 1000),
        fuel_charge_per_km=rule.fuel_charge_per_km or 0, loading_charge=rule.loading_charge, unloading_charge=rule.unloading_charge,
        driver_bata=rule.driver_bata, platform_fee_percent=rule.platform_fee_percent,
        gst_percent=rule.gst_percent,
    )


def compute_demand(db: Session, pickup: str = None, drop: str = None) -> dict:
    """Surge is driven by live supply/demand, not a fixed number."""
    pending = db.query(LoadRequest).filter(LoadRequest.status == "Pending").count()
    available = db.query(Truck).filter(Truck.status == "Available").count()

    ratio = pending / available if available else (2.0 if pending else 0.0)

    route_demand = None
    if pickup and drop:
        rp = (
            db.query(RoutePricing)
            .filter(RoutePricing.origin.ilike(pickup), RoutePricing.destination.ilike(drop))
            .first()
        )
        if rp:
            route_demand = rp.demand_level

    if ratio >= 1.5 or route_demand == "High":
        level, multiplier = "High", 1.15
    elif ratio >= 0.8:
        level, multiplier = "Moderate", 1.07
    else:
        level, multiplier = "Normal", 1.0

    # Night dispatch premium
    hour = datetime.now().hour
    if hour >= 22 or hour < 5:
        multiplier = round(multiplier + 0.05, 2)

    return {
        "level": level,
        "multiplier": multiplier,
        "pending_loads": pending,
        "available_trucks": available,
        "ratio": round(ratio, 2),
        "route_demand": route_demand,
    }


def toll_for_route(db: Session, pickup: str, drop: str, distance_km: float) -> float:
    rp = (
        db.query(RoutePricing)
        .filter(RoutePricing.origin.ilike(pickup or ""), RoutePricing.destination.ilike(drop or ""))
        .first()
    )
    if rp and rp.toll_charge:
        return float(rp.toll_charge)
    return round((distance_km or 0) * 4.5, 0)   # ~Rs4.50/km of tolled highway


def calculate_fare(
    db: Session,
    pickup: str,
    drop: str,
    weight_ton: float,
    truck_type: str,
    distance_km: float = None,
    pickup_lat=None, pickup_lng=None, drop_lat=None, drop_lng=None,
) -> dict:
    """Return a full fare breakdown. Called by the API and the matcher."""
    if not distance_km:
        p = resolve_point(pickup, pickup_lat, pickup_lng)
        d = resolve_point(drop, drop_lat, drop_lng)
        distance_km = road_distance_km(p[0], p[1], d[0], d[1]) or 0

    rule = _rule_for(db, truck_type)
    type_multiplier = TRUCK_TYPE_MULTIPLIER.get(truck_type, 1.0)

    # The configured Rate Per KM is the canonical unit price. Base Price is
    # Distance × Rate Per KM, exactly once, in this backend service.
    rate_per_km = round(rule["rate_per_km"] * type_multiplier, 2)
    base_price = round(distance_km * rate_per_km)
    # Preserve the project's existing fixed base fare as an additional fixed charge.
    base_fare = round(rule["base_fare"] * type_multiplier)
    distance_charge = base_price
    rate_per_kg = float(rule.get("rate_per_kg") or ((rule.get("rate_per_ton") or 0) / 1000))
    weight_charge = round((weight_ton or 0) * 1000 * rate_per_kg)
    fuel_charge = round((distance_km or 0) * rule["fuel_charge_per_km"])
    toll = toll_for_route(db, pickup, drop, distance_km)
    loading = rule["loading_charge"]
    unloading = rule["unloading_charge"]
    bata = round(rule["driver_bata"] * (1 + (distance_km // 500) * 0.5))

    subtotal_before_fees = (
        base_fare + distance_charge + weight_charge + fuel_charge + toll + loading + unloading + bata
    )
    platform_fee = round(subtotal_before_fees * rule["platform_fee_percent"] / 100)
    taxable = subtotal_before_fees + platform_fee
    gst = round(taxable * rule["gst_percent"] / 100)
    subtotal = taxable + gst

    demand = compute_demand(db, pickup, drop)
    surge_amount = round(subtotal * (demand["multiplier"] - 1))
    total = round(subtotal + surge_amount)

    dist = round(distance_km, 1)
    # Unit price is the admin-configured per-km rate, not total/distance.
    unit_price = rate_per_km

    return {
        "distance_km": dist,
        "unit_price_per_km": unit_price,
        "base_price": base_price,
        "base_fare": base_fare,
        "distance_charge": distance_charge,
        "weight_charge": weight_charge,
        "fuel_charge": fuel_charge,
        "toll_charge": toll,
        "loading_charge": loading,
        "unloading_charge": unloading,
        "driver_bata": bata,
        "platform_fee": platform_fee,
        "gst": gst,
        "subtotal": subtotal,
        "surge_level": demand["level"],
        "surge_multiplier": demand["multiplier"],
        "surge_amount": surge_amount,
        "total_amount": total,
        "demand": demand,
        "rate_per_km": rate_per_km,
        "rate_per_kg": rate_per_kg,
    }


def price_load(db: Session, load) -> dict:
    """Price a LoadRequest and persist the snapshot onto the row.

    This is the single source of truth. Customer, Driver and Admin screens all
    read `estimated_fare` / `unit_price_per_km` / `price_breakdown` from the
    load itself, so no screen ever recalculates a fare with its own formula.
    """
    import json as _json

    quote = calculate_fare(
        db,
        pickup=load.pickup_location,
        drop=load.drop_location,
        weight_ton=load.weight_ton,
        truck_type=load.truck_type,
        distance_km=load.distance_km,
        pickup_lat=load.pickup_lat, pickup_lng=load.pickup_lng,
        drop_lat=load.drop_lat, drop_lng=load.drop_lng,
    )
    load.distance_km = quote["distance_km"]
    load.estimated_fare = quote["total_amount"]
    load.unit_price_per_km = quote["unit_price_per_km"]
    load.price_breakdown = _json.dumps(quote)
    return quote
