"""Location lookup for the pickup/drop pickers and distance preview.

Backed by the gazetteer in services/geo.py, so it works with no Google Maps
key. If a Places key is configured later, only this router needs to change.
"""
from fastapi import APIRouter, Depends, Query

from services.geo import CITY_COORDS, resolve_point, road_distance_km
from utils.security import get_current_user

router = APIRouter(prefix="/api/locations", tags=["Locations"],
                   dependencies=[Depends(get_current_user)])

# Title-cased display names, built once.
_PLACES = sorted({c.title() for c in CITY_COORDS})


@router.get("/search")
def search(q: str = Query("", min_length=0), limit: int = 8):
    """Type-ahead suggestions for a location field."""
    term = (q or "").strip().lower()
    if not term:
        pool = ["Chennai", "Bangalore", "Coimbatore", "Madurai", "Hyderabad",
                "Salem", "Trichy", "Kochi"]
    else:
        starts = [p for p in _PLACES if p.lower().startswith(term)]
        contains = [p for p in _PLACES if term in p.lower() and p not in starts]
        pool = starts + contains
    out = []
    for name in pool[:limit]:
        lat, lng = CITY_COORDS[name.lower()]
        out.append({"name": name, "lat": lat, "lng": lng})
    return out


@router.get("/distance")
def distance(pickup: str, drop: str):
    """Road distance between two places, used for the live price preview."""
    p = resolve_point(pickup)
    d = resolve_point(drop)
    if p[0] is None or d[0] is None:
        unknown = pickup if p[0] is None else drop
        return {"resolved": False,
                "message": f"We don't have coordinates for '{unknown}'. Pick a suggestion from the list.",
                "distance_km": None}
    return {
        "resolved": True,
        "distance_km": road_distance_km(p[0], p[1], d[0], d[1]),
        "pickup": {"name": pickup, "lat": p[0], "lng": p[1]},
        "drop": {"name": drop, "lat": d[0], "lng": d[1]},
    }
