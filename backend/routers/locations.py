"""Real Google Maps location, route, distance and route-town APIs.

No production location suggestions or route towns are hard-coded. Configure
GOOGLE_MAPS_API_KEY (server key) and VITE_GOOGLE_MAPS_API_KEY (browser key).
"""
import json, os, urllib.parse, urllib.request
from fastapi import APIRouter, Depends, HTTPException, Query
from utils.security import get_current_user

router = APIRouter(prefix="/api/locations", tags=["Locations"], dependencies=[Depends(get_current_user)])
KEY = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()


def _google(path, params):
    if not KEY:
        raise HTTPException(503, "Google Maps is not configured. Set GOOGLE_MAPS_API_KEY before using location/route features.")
    params = {**params, "key": KEY}
    url = "https://maps.googleapis.com/maps/api/" + path + "?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=12) as r:
            data = json.loads(r.read().decode("utf-8"))
    except Exception as exc:
        raise HTTPException(502, f"Google Maps request failed: {exc}")
    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        raise HTTPException(502, data.get("error_message") or f"Google Maps returned {data.get('status')}")
    return data


def _locality(lat, lng):
    data = _google("geocode/json", {"latlng": f"{lat},{lng}", "result_type": "locality|administrative_area_level_2"})
    for result in data.get("results", []):
        for comp in result.get("address_components", []):
            types = comp.get("types", [])
            if "locality" in types or "administrative_area_level_2" in types:
                return comp.get("long_name")
    return None


@router.get("/config")
def config():
    return {"google_maps_configured": bool(KEY)}


@router.get("/search")
def search(q: str = Query("", min_length=2), limit: int = 8):
    data = _google("place/autocomplete/json", {"input": q, "components": "country:in", "types": "geocode"})
    out=[]
    for pred in data.get("predictions", [])[:limit]:
        detail = _google("place/details/json", {"place_id": pred["place_id"], "fields": "name,formatted_address,geometry,place_id"})
        result=detail.get("result", {})
        loc=result.get("geometry",{}).get("location",{})
        if loc.get("lat") is None: continue
        out.append({"name": result.get("formatted_address") or pred.get("description"), "lat": loc["lat"], "lng": loc["lng"], "place_id": pred["place_id"]})
    return out


@router.get("/route")
def route(pickup_lat: float, pickup_lng: float, drop_lat: float, drop_lng: float):
    data=_google("directions/json", {"origin": f"{pickup_lat},{pickup_lng}", "destination": f"{drop_lat},{drop_lng}", "mode":"driving", "alternatives":"false"})
    routes=data.get("routes",[])
    if not routes: raise HTTPException(404,"No driving route was found between the selected locations.")
    r=routes[0]; leg=r["legs"][0]
    # Derive towns from the actual route step coordinates; never from a static list.
    steps=leg.get("steps",[])
    sample=[]
    stride=max(1, len(steps)//8)
    for i,step in enumerate(steps):
        if i % stride == 0 or i == len(steps)-1:
            p=step.get("end_location",{})
            if p.get("lat") is not None: sample.append((p["lat"],p["lng"]))
    towns=[]
    for lat,lng in sample[:10]:
        name=_locality(lat,lng)
        if name and name not in towns: towns.append(name)
    return {"resolved": True, "distance_km": round(leg["distance"]["value"]/1000,1), "duration_minutes": round(leg["duration"]["value"]/60), "duration_text": leg["duration"]["text"], "route_towns": towns, "overview_polyline": r.get("overview_polyline",{}).get("points"), "start_address": leg.get("start_address"), "end_address": leg.get("end_address")}


@router.get("/distance")
def distance(pickup_lat: float, pickup_lng: float, drop_lat: float, drop_lng: float):
    return route(pickup_lat,pickup_lng,drop_lat,drop_lng)
