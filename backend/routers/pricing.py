from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import PricingRule, RoutePricing
from schemas import PricingRequest, PricingRuleUpdate, QuoteRequest
from services.geo import resolve_point, road_distance_km
from services.pricing import calculate_fare, compute_demand
from utils.security import get_current_user, require_admin

router = APIRouter(prefix="/api/pricing", tags=["Pricing"],
                   dependencies=[Depends(require_admin)])

# Quoting is not an admin action -- customers need it live on Book Load, and
# drivers see the same figure on a load card. Same engine, open to any signed-in
# user, so the number can never diverge between portals.
quote_router = APIRouter(prefix="/api/pricing", tags=["Pricing"],
                         dependencies=[Depends(get_current_user)])


@router.post("/calculate")
def calculate(payload: PricingRequest, db: Session = Depends(get_db)):
    return calculate_fare(
        db, pickup=payload.pickup_location, drop=payload.drop_location,
        weight_ton=payload.weight_ton, truck_type=payload.truck_type,
        distance_km=payload.distance_km,
    )


@router.get("/demand")
def demand(db: Session = Depends(get_db)):
    return compute_demand(db)


@router.get("/rules")
def rules(db: Session = Depends(get_db)):
    return {
        "pricing_rules": [{c.name: getattr(r, c.name) for c in PricingRule.__table__.columns}
                          for r in db.query(PricingRule).all()],
        "route_pricing": [{c.name: getattr(r, c.name) for c in RoutePricing.__table__.columns}
                          for r in db.query(RoutePricing).all()],
    }


@router.put("/rules/{rule_id}")
def update_rule(rule_id: int, payload: PricingRuleUpdate, db: Session = Depends(get_db)):
    """Admin configures the Rate Per KM and other charge components.

    This is the single source of truth for pricing: every screen (Customer
    Book Load, Driver load cards, Admin matching/assignment) prices through
    `services.pricing.calculate_fare`, which reads straight from this table --
    so changing the rate here takes effect everywhere immediately, with no
    separate formula anywhere else to keep in sync.
    """
    rule = db.query(PricingRule).get(rule_id)
    if not rule:
        raise HTTPException(404, "Pricing rule not found.")
    data = payload.model_dump(exclude_unset=True)
    for field in ("base_fare", "rate_per_km", "rate_per_ton", "loading_charge",
                 "unloading_charge", "driver_bata", "platform_fee_percent", "gst_percent"):
        if field in data and data[field] is not None and data[field] < 0:
            raise HTTPException(400, f"{field.replace('_', ' ').title()} cannot be negative.")
    for k, v in data.items():
        setattr(rule, k, v)
    db.commit()
    db.refresh(rule)
    return {c.name: getattr(rule, c.name) for c in PricingRule.__table__.columns}


@router.put("/route-tariffs/{route_id}")
def update_route_tariff(route_id: int, payload: dict, db: Session = Depends(get_db)):
    """Admin edits a route's toll charge / demand level."""
    rp = db.query(RoutePricing).get(route_id)
    if not rp:
        raise HTTPException(404, "Route tariff not found.")
    if "toll_charge" in payload and payload["toll_charge"] is not None:
        if float(payload["toll_charge"]) < 0:
            raise HTTPException(400, "Toll charge cannot be negative.")
        rp.toll_charge = float(payload["toll_charge"])
    if "demand_level" in payload and payload["demand_level"] in ("Low", "Normal", "High"):
        rp.demand_level = payload["demand_level"]
    db.commit()
    db.refresh(rp)
    return {c.name: getattr(rp, c.name) for c in RoutePricing.__table__.columns}


@quote_router.post("/quote")
def quote(payload: QuoteRequest, db: Session = Depends(get_db)):
    """Live estimate for the Book Load screen.

    Same engine as the stored price, so the number the customer sees before
    booking matches the one saved against the load.
    """
    p = resolve_point(payload.pickup_location, payload.pickup_lat, payload.pickup_lng)
    d = resolve_point(payload.drop_location, payload.drop_lat, payload.drop_lng)
    if p[0] is None or d[0] is None:
        raise HTTPException(
            400, "Choose pickup and drop locations from the suggestions so we can measure the route.")

    distance = road_distance_km(p[0], p[1], d[0], d[1])
    fare = calculate_fare(db, payload.pickup_location, payload.drop_location,
                          payload.weight_ton, payload.truck_type, distance,
                          p[0], p[1], d[0], d[1])
    return {
        "distance_km": distance,
        "unit_price_per_km": fare["unit_price_per_km"],
        "estimated_fare": fare["total_amount"],
        "breakdown": fare,
        "pickup": {"name": payload.pickup_location, "lat": p[0], "lng": p[1]},
        "drop": {"name": payload.drop_location, "lat": d[0], "lng": d[1]},
    }
