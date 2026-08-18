"""Explicitly reset ONLY the configured RightPolamRight MySQL development schema.

This is intentionally NOT called automatically by start.bat.
It refuses to run unless RPR_ALLOW_DEV_DB_RESET=YES.
"""
import os
import re
from pathlib import Path

import pymysql
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env", override=False)

if os.getenv("RPR_ALLOW_DEV_DB_RESET") != "YES":
    raise SystemExit(
        "Refusing to drop data. Set RPR_ALLOW_DEV_DB_RESET=YES only for a disposable "
        "RightPolamRight development database, then run this script again."
    )

host = os.getenv("MYSQL_HOST", "127.0.0.1")
port = int(os.getenv("MYSQL_PORT", "3306"))
database = os.getenv("MYSQL_DATABASE", "rightpolamright")
user = os.getenv("MYSQL_USER", "")
password = os.getenv("MYSQL_PASSWORD", "")

if database != "rightpolamright":
    raise SystemExit(
        f"Refusing reset because MYSQL_DATABASE is {database!r}, not 'rightpolamright'."
    )
if not re.fullmatch(r"[A-Za-z0-9_]+", database):
    raise SystemExit("Invalid database name.")

answer = input(
    "This will permanently delete ALL data in MySQL database 'rightpolamright'. "
    "Type RESET RIGHTPOLAMRIGHT to continue: "
).strip()
if answer != "RESET RIGHTPOLAMRIGHT":
    raise SystemExit("Reset cancelled.")

conn = pymysql.connect(host=host, port=port, user=user, password=password,
                       charset="utf8mb4", autocommit=True)
with conn.cursor() as cur:
    cur.execute(f"DROP DATABASE `{database}`")
    cur.execute(
        f"CREATE DATABASE `{database}` CHARACTER SET utf8mb4 "
        "COLLATE utf8mb4_unicode_ci"
    )
conn.close()
print("RightPolamRight development schema reset successfully.")
print("Run start.bat to recreate the corrected schema.")
