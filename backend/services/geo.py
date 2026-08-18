"""Geospatial helpers for RightPolamRight.

Coordinates selected through Google Places are persisted on loads/availability.
Free-text legacy records are resolved through Google Geocoding when configured;
there is no production hard-coded city list.
"""
import json, math, os, urllib.parse, urllib.request

EARTH_RADIUS_KM = 6371.0
ROAD_FACTOR = 1.25  # only a resilience fallback if Google Directions is unavailable


def _key(): return os.getenv("GOOGLE_MAPS_API_KEY", "").strip()


def geocode(place: str):
    if not place or not _key(): return None
    url="https://maps.googleapis.com/maps/api/geocode/json?"+urllib.parse.urlencode({"address":place,"region":"in","key":_key()})
    try:
        with urllib.request.urlopen(url,timeout=10) as r: data=json.loads(r.read().decode())
        if data.get("status") != "OK" or not data.get("results"): return None
        loc=data["results"][0]["geometry"]["location"]
        return loc["lat"],loc["lng"]
    except Exception: return None


def haversine_km(lat1,lng1,lat2,lng2):
    if None in (lat1,lng1,lat2,lng2): return None
    p1,p2=math.radians(lat1),math.radians(lat2); dphi=math.radians(lat2-lat1); dlambda=math.radians(lng2-lng1)
    a=math.sin(dphi/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dlambda/2)**2
    return 2*EARTH_RADIUS_KM*math.asin(math.sqrt(a))


def road_distance_km(lat1,lng1,lat2,lng2):
    route=google_route_info(lat1,lng1,lat2,lng2)
    if route: return route["distance_km"]
    straight=haversine_km(lat1,lng1,lat2,lng2)
    return round(straight*ROAD_FACTOR,1) if straight is not None else None


def resolve_point(place,lat=None,lng=None):
    if lat is not None and lng is not None: return lat,lng
    return geocode(place) or (None,None)


def google_route_info(lat1,lng1,lat2,lng2):
    if not _key() or None in (lat1,lng1,lat2,lng2): return None
    params=urllib.parse.urlencode({"origin":f"{lat1},{lng1}","destination":f"{lat2},{lng2}","mode":"driving","key":_key()})
    try:
        with urllib.request.urlopen("https://maps.googleapis.com/maps/api/directions/json?"+params,timeout=12) as r: data=json.loads(r.read().decode())
        if data.get("status") != "OK" or not data.get("routes"): return None
        leg=data["routes"][0]["legs"][0]
        return {"distance_km":round(leg["distance"]["value"]/1000,1),"duration_minutes":round(leg["duration"]["value"]/60),"duration_text":leg["duration"]["text"]}
    except Exception: return None
