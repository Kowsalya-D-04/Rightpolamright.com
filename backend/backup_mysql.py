"""Create a backup/export before any data-preserving schema ALTER.

Preferred format: mysqldump --single-transaction.
Fallback: complete JSON row export + SHOW CREATE TABLE DDL for every table.
"""
import json
import os
import shutil
import subprocess
import tempfile
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

import pymysql
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
BACKUP_DIR = ROOT / "backups"
BACKUP_DIR.mkdir(exist_ok=True)
load_dotenv(ROOT / ".env", override=False)

host = os.getenv("MYSQL_HOST", "127.0.0.1")
port = int(os.getenv("MYSQL_PORT", "3306"))
database = os.getenv("MYSQL_DATABASE", "rightpolamright")
user = os.getenv("MYSQL_USER", "")
password = os.getenv("MYSQL_PASSWORD", "")

stamp = datetime.now().strftime("%Y%m%d_%H%M%S")

def find_mysqldump():
    found = shutil.which("mysqldump")
    if found:
        return Path(found)
    candidates = [
        Path(r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"),
        Path(r"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe"),
        Path(r"C:\xampp\mysql\bin\mysqldump.exe"),
    ]
    return next((p for p in candidates if p.exists()), None)

def dump_with_mysqldump(exe):
    outfile = BACKUP_DIR / f"{database}_before_bigint_{stamp}.sql"
    cfg = None
    try:
        fd, cfg_name = tempfile.mkstemp(suffix=".cnf", text=True)
        os.close(fd)
        cfg = Path(cfg_name)
        cfg.write_text(
            "[client]\n"
            f"host={host}\nport={port}\nuser={user}\npassword={password}\n",
            encoding="utf-8",
        )
        cmd = [
            str(exe),
            f"--defaults-extra-file={cfg}",
            "--single-transaction",
            "--routines",
            "--triggers",
            "--events",
            "--hex-blob",
            "--set-gtid-purged=OFF",
            f"--result-file={outfile}",
            database,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or "mysqldump failed")
        if not outfile.exists() or outfile.stat().st_size == 0:
            raise RuntimeError("mysqldump produced an empty backup")
        print(f"MySQL SQL backup created: {outfile}")
        return outfile
    finally:
        if cfg and cfg.exists():
            cfg.unlink()

def json_value(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (bytes, bytearray)):
        return {"__hex__": bytes(value).hex()}
    return value

def fallback_export():
    folder = BACKUP_DIR / f"{database}_before_bigint_{stamp}"
    folder.mkdir(parents=True, exist_ok=False)
    conn = pymysql.connect(
        host=host, port=port, user=user, password=password, database=database,
        charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor,
    )
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT TABLE_NAME FROM information_schema.TABLES "
                "WHERE TABLE_SCHEMA=%s AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
                (database,),
            )
            tables = [r["TABLE_NAME"] for r in cur.fetchall()]

            manifest = {"database": database, "created_at": datetime.now().isoformat(), "tables": {}}
            ddl_parts = []
            for table in tables:
                cur.execute(f"SHOW CREATE TABLE `{table}`")
                row = cur.fetchone()
                create_sql = row.get("Create Table") or list(row.values())[-1]
                ddl_parts.append(f"-- {table}\n{create_sql};\n")

                cur.execute(f"SELECT * FROM `{table}`")
                rows = cur.fetchall()
                serial = [{k: json_value(v) for k, v in r.items()} for r in rows]
                (folder / f"{table}.json").write_text(
                    json.dumps(serial, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
                manifest["tables"][table] = len(serial)

            (folder / "schema.sql").write_text("\n".join(ddl_parts), encoding="utf-8")
            (folder / "manifest.json").write_text(
                json.dumps(manifest, indent=2), encoding="utf-8"
            )
        print(f"MySQL logical backup created: {folder}")
        print("Backup row counts:", manifest["tables"])
        return folder
    finally:
        conn.close()

exe = find_mysqldump()
if exe:
    try:
        dump_with_mysqldump(exe)
    except Exception as exc:
        print(f"mysqldump backup failed ({exc}); using complete logical export instead.")
        fallback_export()
else:
    print("mysqldump not found; creating complete logical export instead.")
    fallback_export()
