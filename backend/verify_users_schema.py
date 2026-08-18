"""Verify the live MySQL users table matches the current User ORM mapping."""
from sqlalchemy import inspect, text

from database import engine

REQUIRED = {
    "id",
    "full_name",
    "email",
    "mobile_number",
    "password_hash",
    "role",
    "status",
    "email_verified",
    "mobile_verified",
    "last_login_at",
    "created_at",
    "updated_at",
    "deleted",
}

inspector = inspect(engine)
if "users" not in inspector.get_table_names():
    raise SystemExit("users table is missing after migration.")

columns = {c["name"]: c for c in inspector.get_columns("users")}
missing = sorted(REQUIRED - set(columns))
if missing:
    raise SystemExit(
        "users table does not match the current application schema; missing: "
        + ", ".join(missing)
    )

# Old compatibility-only names must NOT be required as physical DB columns.
legacy_physical = sorted({"name", "phone", "is_active"} & set(columns))

with engine.connect() as conn:
    ddl = conn.execute(text("SHOW CREATE TABLE `users`")).fetchone()[1]
    count = conn.execute(text("SELECT COUNT(*) FROM `users`")).scalar_one()

print("POST-MIGRATION SHOW CREATE TABLE users:")
print(ddl)
print("POST-MIGRATION users row count:", count)
print("POST-MIGRATION users columns:", ", ".join(columns))
if legacy_physical:
    print(
        "Note: legacy physical columns are present but are not used by the current User ORM:",
        ", ".join(legacy_physical),
    )
print("USERS SCHEMA VERIFICATION: PASS")
