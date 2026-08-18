"""Verify live MySQL users.id / FK compatibility after migration."""
import os
from pathlib import Path

import pymysql
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env", override=False)

database = os.getenv("MYSQL_DATABASE", "rightpolamright")
conn = pymysql.connect(
    host=os.getenv("MYSQL_HOST", "127.0.0.1"),
    port=int(os.getenv("MYSQL_PORT", "3306")),
    user=os.getenv("MYSQL_USER", ""),
    password=os.getenv("MYSQL_PASSWORD", ""),
    database=database,
    charset="utf8mb4",
    cursorclass=pymysql.cursors.DictCursor,
)

expected = {
    "admins": "user_id",
    "customers": "user_id",
    "drivers": "user_id",
    "audit_logs": "actor_user_id",
}

def col(table, column):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT DATA_TYPE, COLUMN_TYPE, IS_NULLABLE
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s AND COLUMN_NAME=%s
            """,
            (database, table, column),
        )
        return cur.fetchone()

def show_create(table):
    with conn.cursor() as cur:
        cur.execute(f"SHOW CREATE TABLE `{table}`")
        row = cur.fetchone()
        return row.get("Create Table") or list(row.values())[-1]

def exists(table):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) AS n FROM information_schema.TABLES "
            "WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s",
            (database, table),
        )
        return cur.fetchone()["n"] > 0

def has_fk(table, column):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE CONSTRAINT_SCHEMA=%s AND TABLE_NAME=%s AND COLUMN_NAME=%s
              AND REFERENCED_TABLE_NAME='users' AND REFERENCED_COLUMN_NAME='id'
            """,
            (database, table, column),
        )
        return cur.fetchone()

def signed_bigint(info):
    return (
        info
        and str(info["DATA_TYPE"]).lower() == "bigint"
        and "unsigned" not in str(info["COLUMN_TYPE"]).lower()
    )

failures = []
try:
    print("FINAL SHOW CREATE TABLE users:")
    print(show_create("users"))
    parent = col("users", "id")
    print("FINAL users.id:", parent)
    if not signed_bigint(parent) or str(parent["IS_NULLABLE"]).upper() != "NO":
        failures.append("users.id is not BIGINT SIGNED NOT NULL")

    for table, column in expected.items():
        if not exists(table):
            print(f"{table}: table does not exist yet; fresh ORM DDL will use BIGINT.")
            continue
        info = col(table, column)
        fk = has_fk(table, column)
        print(f"\nFINAL SHOW CREATE TABLE {table}:")
        print(show_create(table))
        print(f"{table}.{column}:", info, "FK:", fk)
        if not signed_bigint(info):
            failures.append(f"{table}.{column} is not BIGINT SIGNED")
        if not fk:
            failures.append(f"{table}.{column} has no FK to users.id")

    with conn.cursor() as cur:
        cur.execute(
            "SELECT TABLE_NAME FROM information_schema.TABLES "
            "WHERE TABLE_SCHEMA=%s AND TABLE_TYPE='BASE TABLE'",
            (database,),
        )
        tables = [r["TABLE_NAME"] for r in cur.fetchall()]
    counts = {}
    for table in tables:
        with conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) AS n FROM `{table}`")
            counts[table] = int(cur.fetchone()["n"])
    print("\nFINAL database row counts:", counts)
    print("FINAL database total rows:", sum(counts.values()))

    if failures:
        raise SystemExit("LIVE MYSQL VERIFICATION FAILED: " + "; ".join(failures))
    print("\nLIVE MYSQL BIGINT/FK VERIFICATION: PASS")
finally:
    conn.close()
