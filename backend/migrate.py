"""Additive schema migration for databases created before role-based accounts.

Adds any missing columns in place, so an existing rightpolamright.db keeps its
data instead of needing a re-seed. Safe to run on every startup.
"""
from sqlalchemy import inspect, text

from database import Base, engine
import models  # noqa: F401 - register all ORM tables before create_all

# table -> {column: SQL type}
NEW_COLUMNS = {
    "customers": {
        "user_id": "INTEGER",
        "state": "VARCHAR(80)",
        "pincode": "VARCHAR(10)",
    },
    "drivers": {
        "user_id": "INTEGER",
        "experience_years": "FLOAT DEFAULT 0",
    },
    "notifications": {
        "customer_id": "INTEGER",
    },
    "load_matches": {
        "response_status": "VARCHAR(20) DEFAULT 'PENDING'",
        "responded_at": "DATETIME",
    },
    "driver_availability_slots": {
        "available_from_time": "VARCHAR(10) DEFAULT '00:00'",
        "available_to_time": "VARCHAR(10) DEFAULT '23:59'",
        "status": "VARCHAR(30) DEFAULT 'DRIVER_AVAILABLE'",
        "preferred_drop_lat": "FLOAT",
        "preferred_drop_lng": "FLOAT",
    },
    "load_requests": {
        "workflow_status": "VARCHAR(30) DEFAULT 'LOAD_REQUESTED'",
        "unit_price_per_km": "FLOAT",
        "price_breakdown": "TEXT",
        "load_image_url": "VARCHAR(255)",
        "accepted_driver_id": "INTEGER",
        "accepted_truck_id": "INTEGER",
        "driver_accepted_at": "DATETIME",
        "admin_confirmed_at": "DATETIME",
    },
}

# Existing rows predate workflow_status; derive it from the operational status
# so old loads slot into the new lifecycle instead of all reading LOAD_CREATED.
BACKFILL = [
    ("UPDATE load_requests SET workflow_status = 'COMPLETED' "
     "WHERE status = 'Delivered' AND (workflow_status IS NULL OR workflow_status = 'LOAD_CREATED')"),
    ("UPDATE load_requests SET workflow_status = 'TRIP_STARTED' "
     "WHERE status = 'In Transit' AND (workflow_status IS NULL OR workflow_status = 'LOAD_CREATED')"),
    ("UPDATE load_requests SET workflow_status = 'ASSIGNED' "
     "WHERE status = 'Assigned' AND (workflow_status IS NULL OR workflow_status = 'LOAD_CREATED')"),
    ("UPDATE load_requests SET workflow_status = 'CANCELLED' "
     "WHERE status = 'Cancelled' AND (workflow_status IS NULL OR workflow_status = 'LOAD_CREATED')"),
    # Older rows were priced before unit price existed; derive it from the
    # figures already stored so every screen can show price-per-km.
    ("UPDATE load_requests SET unit_price_per_km = ROUND(estimated_fare / distance_km, 2) "
     "WHERE unit_price_per_km IS NULL AND distance_km > 0 AND estimated_fare > 0"),
    ("UPDATE load_requests SET workflow_status = 'LOAD_REQUESTED' "
     "WHERE status = 'Pending' AND (workflow_status IS NULL OR workflow_status = 'LOAD_CREATED')"),
]


def run() -> list[str]:
    # A brand-new SQLite database has no tables yet. Create the current schema
    # first, then apply additive ALTER/backfill steps for older databases.
    Base.metadata.create_all(bind=engine)
    applied = []
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as conn:
        for table, columns in NEW_COLUMNS.items():
            if table not in existing_tables:
                continue  # create_all will build it fresh
            present = {c["name"] for c in inspector.get_columns(table)}
            for column, coltype in columns.items():
                if column in present:
                    continue
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {coltype}"))
                applied.append(f"{table}.{column}")

        if "load_requests" in existing_tables:
            for sql in BACKFILL:
                try:
                    conn.execute(text(sql))
                except Exception:
                    pass  # column not there yet on a brand-new database
    return applied


if __name__ == "__main__":
    changes = run()
    print("Migration applied:", ", ".join(changes) if changes else "nothing to do")
