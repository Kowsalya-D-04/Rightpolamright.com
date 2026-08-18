r"""One-time legacy data importer: SQLite -> MySQL.

This file is NOT used by the application at runtime. It exists only to move
records from an older rightpolamright.db into the MySQL schema, after which
the legacy SQLite file can be archived/deleted.

Usage:
  venv\Scripts\python.exe import_legacy_sqlite_to_mysql.py C:\path\to\rightpolamright.db
"""
import sqlite3
import sys
from datetime import date, datetime
from pathlib import Path

from sqlalchemy import inspect

from database import Base, engine
import models  # noqa: F401

if len(sys.argv) != 2:
    raise SystemExit("Usage: import_legacy_sqlite_to_mysql.py <legacy-sqlite-db-path>")

source = Path(sys.argv[1]).resolve()
if not source.exists():
    raise SystemExit(f"Legacy SQLite file not found: {source}")

Base.metadata.create_all(bind=engine)

sqlite_conn = sqlite3.connect(source)
sqlite_conn.row_factory = sqlite3.Row

mysql_tables = {t.name: t for t in Base.metadata.sorted_tables}
mysql_inspector = inspect(engine)
mysql_existing = set(mysql_inspector.get_table_names())

def convert_value(column, value):
    if value is None:
        return None
    pytype = None
    try:
        pytype = column.type.python_type
    except Exception:
        return value
    if pytype is datetime and isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
        except ValueError:
            return value
    if pytype is date and isinstance(value, str):
        try:
            return date.fromisoformat(value[:10])
        except ValueError:
            return value
    if pytype is bool:
        return bool(value)
    return value

inserted = {}
with engine.begin() as mysql_conn:
    # Base.metadata.sorted_tables respects FK dependency order.
    for table in Base.metadata.sorted_tables:
        name = table.name
        if name not in mysql_existing:
            continue
        exists = sqlite_conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
            (name,),
        ).fetchone()
        if not exists:
            continue

        source_columns = {
            r["name"] for r in sqlite_conn.execute(f'PRAGMA table_info("{name}")').fetchall()
        }
        common = [c for c in table.columns if c.name in source_columns]
        if not common:
            continue

        rows = sqlite_conn.execute(f'SELECT * FROM "{name}"').fetchall()
        count = 0
        for row in rows:
            payload = {c.name: convert_value(c, row[c.name]) for c in common}
            # Preserve IDs and existing business references. Ignore duplicates
            # so this importer can be re-run safely during migration work.
            try:
                mysql_conn.execute(table.insert().values(**payload))
                count += 1
            except Exception:
                # Existing row/unique key: leave the MySQL copy intact.
                pass
        inserted[name] = count

sqlite_conn.close()
print("Legacy SQLite import complete.")
for table, count in inserted.items():
    print(f"  {table}: {count} row(s) inserted")
print("The application now continues exclusively on MySQL.")
