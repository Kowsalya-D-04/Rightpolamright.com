"""Verify MySQL connectivity and create the configured database if permitted."""
import os
import re
from pathlib import Path

import pymysql
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env", override=False)

host = os.getenv("MYSQL_HOST", "127.0.0.1").strip()
port = int(os.getenv("MYSQL_PORT", "3306"))
database = os.getenv("MYSQL_DATABASE", "rightpolamright").strip()
user = os.getenv("MYSQL_USER", "").strip()
password = os.getenv("MYSQL_PASSWORD", "")

if not user:
    raise SystemExit("MYSQL_USER is missing. Run configure_mysql.py or start.bat.")

if not re.fullmatch(r"[A-Za-z0-9_]+", database):
    raise SystemExit("MYSQL_DATABASE may contain only letters, numbers and underscore.")

try:
    connection = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        charset="utf8mb4",
        autocommit=True,
        connect_timeout=8,
    )
    with connection.cursor() as cursor:
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS `{database}` "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
    connection.close()

    # Verify the selected database itself.
    verify = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        charset="utf8mb4",
        connect_timeout=8,
    )
    with verify.cursor() as cursor:
        cursor.execute("SELECT DATABASE(), VERSION()")
        selected, version = cursor.fetchone()
    verify.close()
    print(f"MySQL ready: database={selected}, server={version}")
except Exception as exc:
    raise SystemExit(
        "Could not connect to MySQL. Make sure MySQL Server is running and the "
        f"configured credentials are valid. Details: {exc}"
    )
