"""Geo helpers: a city gazetteer plus haversine distance.

Coordinates are stored on records themselves; this table is only a fallback
so that free-text locations typed by a customer can still be geocoded.
"""
import math

CITY_COORDS = {
    "chennai": (13.0827, 80.2707),
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),
    "coimbatore": (11.0168, 76.9558),
    "madurai": (9.9252, 78.1198),
    "trichy": (10.7905, 78.7047),
    "tiruchirappalli": (10.7905, 78.7047),
    "salem": (11.6643, 78.1460),
    "vellore": (12.9165, 79.1325),
    "hosur": (12.7409, 77.8253),
    "kanchipuram": (12.8342, 79.7036),
    "sriperumbudur": (12.9675, 79.9430),
    "tiruppur": (11.1085, 77.3411),
    "erode": (11.3410, 77.7172),
    "thanjavur": (10.7870, 79.1378),
    "tuticorin": (8.7642, 78.1348),
    "nagercoil": (8.1780, 77.4285),
    "pondicherry": (11.9416, 79.8083),
    "puducherry": (11.9416, 79.8083),
    "ambattur": (13.1143, 80.1548),
    "tambaram": (12.9229, 80.1275),
    "avadi": (13.1147, 80.1098),
    "chengalpattu": (12.6819, 79.9888),
    "hyderabad": (17.3850, 78.4867),
    "mumbai": (19.0760, 72.8777),
    "pune": (18.5204, 73.8567),
    "kochi": (9.9312, 76.2673),
    "mysore": (12.2958, 76.6394),
    "mangalore": (12.9141, 74.8560),
    "vijayawada": (16.5062, 80.6480),
    "visakhapatnam": (17.6868, 83.2185),
    "tirupati": (13.6288, 79.4192),
    "delhi": (28.6139, 77.2090),
    "kolkata": (22.5726, 88.3639),
    "ahmedabad": (23.0225, 72.5714),
    "nagpur": (21.1458, 79.0882),
}

EARTH_RADIUS_KM = 6371.0
# Straight-line distance under-reports road distance; this is the usual
# correction factor for Indian highway networks.
ROAD_FACTOR = 1.25


def geocode(place: str):
    """Return (lat, lng) for a place name, or None when unknown."""
    if not place:
        return None
    key = place.strip().lower()
    if key in CITY_COORDS:
        return CITY_COORDS[key]
    for city, coords in CITY_COORDS.items():
        if city in key or key in city:
            return coords
    return None


def haversine_km(lat1, lng1, lat2, lng2) -> float:
    if None in (lat1, lng1, lat2, lng2):
        return None
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def road_distance_km(lat1, lng1, lat2, lng2) -> float:
    straight = haversine_km(lat1, lng1, lat2, lng2)
    if straight is None:
        return None
    return round(straight * ROAD_FACTOR, 1)


def resolve_point(place: str, lat=None, lng=None):
    """Prefer stored coordinates, fall back to the gazetteer."""
    if lat is not None and lng is not None:
        return lat, lng
    return geocode(place) or (None, None)
