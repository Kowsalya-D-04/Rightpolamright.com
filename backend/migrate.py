"""Additive MySQL schema migration for existing RightPolamRight installations.

Creates the current schema and adds missing columns in place. Safe to run on every startup.
"""
import os

from sqlalchemy import inspect, text

from database import Base, engine
import models  # noqa: F401 - register all ORM tables before create_all


EXPECTED_USER_FKS = {
    "admins": "user_id",
    "customers": "user_id",
    "drivers": "user_id",
    "audit_logs": "actor_user_id",
}


def _mysql_column_signature(conn, table: str, column: str):
    row = conn.execute(text("""
        SELECT DATA_TYPE, COLUMN_TYPE
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :table_name
          AND COLUMN_NAME = :column_name
    """), {"table_name": table, "column_name": column}).mappings().first()
    if not row:
        return None
    return (str(row["DATA_TYPE"]).lower(), str(row["COLUMN_TYPE"]).lower())


def _check_existing_user_fk_types():
    """Fail early when a partial/legacy schema has incompatible users.id FKs.

    MySQL requires referenced/referencing integer columns to match signedness
    and integer family. We never disable FK checks or remove relationships.
    """
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if "users" not in tables:
        return

    with engine.connect() as conn:
        parent = _mysql_column_signature(conn, "users", "id")
        if not parent:
            return
        incompatible = []
        for table, column in EXPECTED_USER_FKS.items():
            if table not in tables:
                continue
            child = _mysql_column_signature(conn, table, column)
            if child and child != parent:
                incompatible.append((table, column, child, parent))

    if not incompatible:
        return

    details = "; ".join(
        f"{table}.{column}={child[1]} but users.id={parent[1]}"
        for table, column, child, parent in incompatible
    )
    raise RuntimeError(
        "Existing MySQL schema contains incompatible foreign-key column types: "
        + details
        + ". This is usually a partially-created/legacy development schema. "
          "Preserve production data with an ALTER migration; for a disposable "
          "development database run backend/reset_mysql_dev.py explicitly."
    )


# table -> {column: SQL type}
NEW_COLUMNS = {
    "customers": {
        "user_id": "BIGINT",
        "state": "VARCHAR(80)",
        "pincode": "VARCHAR(10)",
        "customer_type": "VARCHAR(30) DEFAULT 'Individual'",
    },
    "drivers": {
        "user_id": "BIGINT",
        "experience_years": "FLOAT DEFAULT 0",
        "license_image_url": "VARCHAR(255)",
    },
    "trucks": {
        "color": "VARCHAR(40)",
        "truck_image_url": "VARCHAR(255)",
        "rc_image_url": "VARCHAR(255)",
        "insurance_image_url": "VARCHAR(255)",
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
        "trip_type": "VARCHAR(30) DEFAULT 'NEW_LOAD'",
        "total_capacity_ton": "FLOAT",
        "available_capacity_ton": "FLOAT",
    },
    "pricing_rules": {"fuel_charge_per_km": "FLOAT DEFAULT 0", "rate_per_kg": "FLOAT DEFAULT 0.30"},
    "invoices": {"fuel_charge": "FLOAT DEFAULT 0"},
    "payments": {"transaction_reference": "VARCHAR(80)", "provider_reference": "VARCHAR(120)"},
    "trips": {"delivery_photo_url": "VARCHAR(255)", "delivery_signature_url": "VARCHAR(255)", "delivery_confirmed_at": "DATETIME"},
    "load_requests": {
        "workflow_status": "VARCHAR(30) DEFAULT 'LOAD_REQUESTED'",
        "unit_price_per_km": "FLOAT",
        "price_breakdown": "TEXT",
        "load_image_url": "VARCHAR(255)",
        "accepted_driver_id": "INTEGER",
        "accepted_truck_id": "INTEGER",
        "driver_accepted_at": "DATETIME",
        "admin_confirmed_at": "DATETIME",
        "expected_delivery_date": "DATE",
        "contact_number": "VARCHAR(20)",
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
    # MYSQL model type verification: the same imported metadata create_all() uses.
    users_id = Base.metadata.tables["users"].c.id
    admin_user_id = Base.metadata.tables["admins"].c.user_id
    print(
        "Imported ORM key types:",
        f"users.id={users_id.type!s} unsigned={getattr(users_id.type, 'unsigned', None)};",
        f"admins.user_id={admin_user_id.type!s} unsigned={getattr(admin_user_id.type, 'unsigned', None)}",
    )
    _check_existing_user_fk_types()
    # A brand-new MySQL database has no tables yet. Create the current schema
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
                conn.execute(text(f"ALTER TABLE `{table}` ADD COLUMN `{column}` {coltype}"))
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
