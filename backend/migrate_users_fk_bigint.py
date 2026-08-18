"""Data-preserving migration for all foreign keys referencing users.id.

Existing production users.id is BIGINT SIGNED. This migration aligns every
referencing column to BIGINT SIGNED, preserving rows, nullability, FK names,
and ON UPDATE / ON DELETE rules. FOREIGN_KEY_CHECKS is never disabled.
"""
import os
import re
from pathlib import Path

import pymysql
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env", override=False)

host = os.getenv("MYSQL_HOST", "127.0.0.1")
port = int(os.getenv("MYSQL_PORT", "3306"))
database = os.getenv("MYSQL_DATABASE", "rightpolamright")
user = os.getenv("MYSQL_USER", "")
password = os.getenv("MYSQL_PASSWORD", "")

KNOWN_USER_COLUMNS = {
    "admins": "user_id",
    "customers": "user_id",
    "drivers": "user_id",
    "audit_logs": "actor_user_id",
}

ident = re.compile(r"^[A-Za-z0-9_]+$")

def q(name):
    if not ident.fullmatch(name):
        raise RuntimeError(f"Unsafe SQL identifier: {name!r}")
    return f"`{name}`"

conn = pymysql.connect(
    host=host, port=port, user=user, password=password, database=database,
    charset="utf8mb4", autocommit=True, cursorclass=pymysql.cursors.DictCursor,
)

def column_info(table, column):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s AND COLUMN_NAME=%s
            """,
            (database, table, column),
        )
        return cur.fetchone()

def show_create(table):
    with conn.cursor() as cur:
        cur.execute(f"SHOW CREATE TABLE {q(table)}")
        row = cur.fetchone()
        return row.get("Create Table") or list(row.values())[-1]

def table_exists(table):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) AS n FROM information_schema.TABLES "
            "WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s",
            (database, table),
        )
        return cur.fetchone()["n"] > 0

def row_count(table):
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) AS n FROM {q(table)}")
        return int(cur.fetchone()["n"])

def fk_for_column(table, column):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT k.CONSTRAINT_NAME, k.TABLE_NAME, k.COLUMN_NAME,
                   k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME,
                   r.UPDATE_RULE, r.DELETE_RULE
            FROM information_schema.KEY_COLUMN_USAGE k
            JOIN information_schema.REFERENTIAL_CONSTRAINTS r
              ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA
             AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME
             AND r.TABLE_NAME=k.TABLE_NAME
            WHERE k.CONSTRAINT_SCHEMA=%s
              AND k.TABLE_NAME=%s
              AND k.COLUMN_NAME=%s
              AND k.REFERENCED_TABLE_NAME='users'
              AND k.REFERENCED_COLUMN_NAME='id'
            """,
            (database, table, column),
        )
        return cur.fetchone()

def all_user_references():
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT TABLE_NAME, COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE CONSTRAINT_SCHEMA=%s
              AND REFERENCED_TABLE_NAME='users'
              AND REFERENCED_COLUMN_NAME='id'
            """,
            (database,),
        )
        found = {(r["TABLE_NAME"], r["COLUMN_NAME"]) for r in cur.fetchall()}
    for table, column in KNOWN_USER_COLUMNS.items():
        if table_exists(table) and column_info(table, column):
            found.add((table, column))
    return sorted(found)

def signed_bigint(info):
    if not info:
        return False
    return str(info["DATA_TYPE"]).lower() == "bigint" and "unsigned" not in str(info["COLUMN_TYPE"]).lower()

try:
    if not table_exists("users"):
        print("users table does not exist yet; fresh schema creation will use BIGINT SIGNED.")
        raise SystemExit(0)

    parent = column_info("users", "id")
    print("\nSHOW CREATE TABLE users:")
    print(show_create("users"))
    print("\nusers.id metadata:", parent)

    if not signed_bigint(parent):
        raise SystemExit(
            "Aborting: users.id is not BIGINT SIGNED. This reviewed migration is "
            "specifically designed to preserve an existing BIGINT SIGNED users.id."
        )
    if str(parent["IS_NULLABLE"]).upper() != "NO":
        raise SystemExit("Aborting: users.id must be NOT NULL.")

    targets = all_user_references()
    print("\nusers.id referencing columns:", targets or "(none yet)")

    before_counts = {table: row_count(table) for table, _ in targets}

    # Validate every existing relationship BEFORE any DDL change.
    plans = []
    for table, column in targets:
        info = column_info(table, column)
        fk = fk_for_column(table, column)
        print(f"\nSHOW CREATE TABLE {table}:")
        print(show_create(table))
        print(f"{table}.{column} metadata:", info)
        print(f"{table}.{column} FK:", fk)

        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT COUNT(*) AS n
                FROM {q(table)} c
                LEFT JOIN `users` u ON c.{q(column)} = u.`id`
                WHERE c.{q(column)} IS NOT NULL AND u.`id` IS NULL
                """
            )
            orphan_count = int(cur.fetchone()["n"])
        if orphan_count:
            raise SystemExit(
                f"Aborting: {table}.{column} has {orphan_count} orphaned value(s). "
                "No schema changes were applied."
            )

        if signed_bigint(info) and fk:
            print(f"{table}.{column} already BIGINT SIGNED with users.id FK; no ALTER needed.")
            continue

        plans.append((table, column, info, fk))

    # Apply reviewed ALTERs. MySQL DDL auto-commits, so backup has already run.
    for table, column, info, fk in plans:
        nullable_sql = "NULL" if str(info["IS_NULLABLE"]).upper() == "YES" else "NOT NULL"

        if fk:
            with conn.cursor() as cur:
                cur.execute(
                    f"ALTER TABLE {q(table)} DROP FOREIGN KEY {q(fk['CONSTRAINT_NAME'])}"
                )

        with conn.cursor() as cur:
            cur.execute(
                f"ALTER TABLE {q(table)} MODIFY COLUMN {q(column)} BIGINT SIGNED {nullable_sql}"
            )

        constraint_name = fk["CONSTRAINT_NAME"] if fk else f"fk_{table}_{column}_users_id"
        update_rule = fk["UPDATE_RULE"] if fk else "RESTRICT"
        delete_rule = fk["DELETE_RULE"] if fk else "RESTRICT"
        with conn.cursor() as cur:
            cur.execute(
                f"ALTER TABLE {q(table)} ADD CONSTRAINT {q(constraint_name)} "
                f"FOREIGN KEY ({q(column)}) REFERENCES `users` (`id`) "
                f"ON UPDATE {update_rule} ON DELETE {delete_rule}"
            )
        print(f"Altered {table}.{column} -> BIGINT SIGNED and restored FK {constraint_name}.")

    # Post-migration verification.
    failures = []
    for table, column in targets:
        info = column_info(table, column)
        fk = fk_for_column(table, column)
        if not signed_bigint(info) or not fk:
            failures.append(f"{table}.{column}")
        print(f"\nVERIFIED SHOW CREATE TABLE {table}:")
        print(show_create(table))

    after_counts = {table: row_count(table) for table, _ in targets}
    for table, before in before_counts.items():
        after = after_counts[table]
        if before != after:
            failures.append(f"{table} row count changed {before}->{after}")

    with conn.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA=%s",
            (database,),
        )
    print("\nRow counts before:", before_counts)
    print("Row counts after :", after_counts)

    if failures:
        raise SystemExit("Migration verification failed: " + "; ".join(failures))

    print("\nSHOW CREATE TABLE users (final):")
    print(show_create("users"))
    print("\nBIGINT users.id FK migration: SUCCESS")
finally:
    conn.close()
