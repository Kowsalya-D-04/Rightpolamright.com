"""Read-only MySQL preflight for the existing production-compatible schema."""

import os
from pathlib import Path

import pymysql
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env", override=False)

conn = pymysql.connect(
    host=os.getenv("MYSQL_HOST", "127.0.0.1"),
    port=int(os.getenv("MYSQL_PORT", "3306")),
    user=os.getenv("MYSQL_USER", ""),
    password=os.getenv("MYSQL_PASSWORD", ""),
    database=os.getenv("MYSQL_DATABASE", "rightpolamright"),
    charset="utf8mb4",
    cursorclass=pymysql.cursors.DictCursor,
)

try:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*) AS table_count
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'users'
            """
        )
        exists = cur.fetchone()

        if not exists or int(exists["table_count"]) == 0:
            print(
                "No users table yet; "
                "fresh schema will be created from BIGINT ORM models."
            )
            raise SystemExit(0)

        cur.execute("SHOW CREATE TABLE `users`")
        row = cur.fetchone()

        ddl = row.get("Create Table") or list(row.values())[-1]

        print("ACTUAL SHOW CREATE TABLE users:")
        print(ddl)

        cur.execute(
            """
            SELECT DATA_TYPE, COLUMN_TYPE, IS_NULLABLE
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'users'
              AND COLUMN_NAME = 'id'
            """
        )

        info = cur.fetchone()

        print("ACTUAL users.id:", info)

        if not info:
            raise SystemExit("users.id is missing.")

        if str(info["DATA_TYPE"]).lower() != "bigint":
            raise SystemExit("users.id is not BIGINT.")

        if "unsigned" in str(info["COLUMN_TYPE"]).lower():
            raise SystemExit(
                "users.id is UNSIGNED; expected BIGINT SIGNED."
            )

        if str(info["IS_NULLABLE"]).upper() != "NO":
            raise SystemExit("users.id must be NOT NULL.")

        print(
            "Existing users.id is BIGINT SIGNED "
            "and compatible with the current model."
        )

finally:
    conn.close()