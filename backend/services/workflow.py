"""Shared load lifecycle for Customer, Driver and Admin portals."""
from models import LoadRequest

FLOW = [
    "LOAD_REQUESTED",
    "DRIVER_MATCHED",
    "DRIVER_ACCEPTED",
    "ADMIN_CONFIRMED",
    "ASSIGNED",
    "TRIP_STARTED",
    "COMPLETED",
]

COARSE = {
    "LOAD_REQUESTED": "Pending",
    "DRIVER_MATCHED": "Pending",
    "DRIVER_ACCEPTED": "Pending",
    "ADMIN_CONFIRMED": "Pending",
    "ASSIGNED": "Assigned",
    "TRIP_STARTED": "In Transit",
    "COMPLETED": "Delivered",
    "CANCELLED": "Cancelled",
    # Backward compatibility for databases created by older builds.
    "LOAD_CREATED": "Pending",
    "WAITING_FOR_DRIVER": "Pending",
    "IN_PROGRESS": "In Transit",
}

LABELS = {
    "LOAD_REQUESTED": "Searching for Driver",
    "DRIVER_MATCHED": "Driver Matched",
    "DRIVER_ACCEPTED": "Driver Accepted",
    "ADMIN_CONFIRMED": "Admin Confirmed",
    "ASSIGNED": "Driver Assigned",
    "TRIP_STARTED": "Trip Started",
    "COMPLETED": "Trip Completed",
    "CANCELLED": "Cancelled",
    "LOAD_CREATED": "Load Request Created",
    "WAITING_FOR_DRIVER": "Searching for Driver",
    "IN_PROGRESS": "Trip Started",
}


def set_workflow(load: LoadRequest, state: str) -> LoadRequest:
    if state not in COARSE:
        raise ValueError(f"Unknown workflow state: {state}")
    load.workflow_status = state
    load.status = COARSE[state]
    return load


def progress(load: LoadRequest) -> dict:
    current = load.workflow_status or "LOAD_REQUESTED"
    aliases = {"LOAD_CREATED": "LOAD_REQUESTED", "WAITING_FOR_DRIVER": "LOAD_REQUESTED", "IN_PROGRESS": "TRIP_STARTED"}
    current = aliases.get(current, current)
    if current == "CANCELLED":
        return {"current": current, "label": LABELS[current], "cancelled": True,
                "steps": [{"key": k, "label": LABELS[k], "done": False, "current": False} for k in FLOW]}
    idx = FLOW.index(current) if current in FLOW else 0
    steps = [{"key": "LOAD_CREATED", "label": "Load Request Created", "done": True, "current": False}]
    steps += [{"key": k, "label": LABELS[k], "done": i < idx, "current": i == idx}
              for i, k in enumerate(FLOW)]
    return {"current": current, "label": LABELS.get(current, current), "cancelled": False, "steps": steps}


TRIP_TO_WORKFLOW = {
    "Assigned": "ASSIGNED",
    "Pickup Reached": "TRIP_STARTED",
    "Loading": "TRIP_STARTED",
    "In Transit": "TRIP_STARTED",
    "Reached": "TRIP_STARTED",
    "Delivered": "COMPLETED",
    "Cancelled": "CANCELLED",
}


def sync_from_trip(load: LoadRequest, trip_status: str) -> LoadRequest:
    state = TRIP_TO_WORKFLOW.get(trip_status)
    if state:
        set_workflow(load, state)
    return load
