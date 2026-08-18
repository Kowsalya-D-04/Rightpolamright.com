"""Create/update the project-root .env with MySQL connection settings."""
import getpass
import os
from pathlib import Path

from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / ".env"

REQUIRED = ("MYSQL_HOST", "MYSQL_PORT", "MYSQL_DATABASE", "MYSQL_USER")


def _clean(v):
    return "" if v is None else str(v).strip()


def _read():
    values = {}
    if ENV_PATH.exists():
        values.update({k: _clean(v) for k, v in dotenv_values(ENV_PATH).items()})
    # Process environment wins over file values.
    for k in ("MYSQL_HOST", "MYSQL_PORT", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD"):
        if os.getenv(k) is not None:
            values[k] = os.getenv(k)
    return values


def _env_value(value):
    value = "" if value is None else str(value)
    # Double-quote values so spaces, #, = and other password characters survive dotenv parsing.
    return '"' + value.replace('\\', '\\\\').replace('"', '\\"') + '"'


def _write(values):
    existing_lines = []
    if ENV_PATH.exists():
        existing_lines = ENV_PATH.read_text(encoding="utf-8").splitlines()

    mysql_keys = {"MYSQL_HOST", "MYSQL_PORT", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD"}
    kept = [line for line in existing_lines
            if not any(line.lstrip().startswith(f"{k}=") for k in mysql_keys)]

    mysql_block = [
        "# MySQL database - required; SQLite is not used",
        f"MYSQL_HOST={values['MYSQL_HOST']}",
        f"MYSQL_PORT={values['MYSQL_PORT']}",
        f"MYSQL_DATABASE={values['MYSQL_DATABASE']}",
        f"MYSQL_USER={values['MYSQL_USER']}",
        f"MYSQL_PASSWORD={values.get('MYSQL_PASSWORD', '')}",
    ]

    text = "\n".join(kept).rstrip()
    if text:
        text += "\n\n"
    text += "\n".join(mysql_block) + "\n"
    ENV_PATH.write_text(text, encoding="utf-8")


def run():
    values = _read()
    complete = all(_clean(values.get(k)) for k in REQUIRED)
    if complete:
        print(
            f"MySQL configured: {values.get('MYSQL_USER')}@"
            f"{values.get('MYSQL_HOST')}:{values.get('MYSQL_PORT')}/"
            f"{values.get('MYSQL_DATABASE')}"
        )
        return

    print("\nMySQL configuration is required. RightPolamRight no longer uses SQLite.")
    host = input(f"MySQL host [{values.get('MYSQL_HOST') or '127.0.0.1'}]: ").strip()
    port = input(f"MySQL port [{values.get('MYSQL_PORT') or '3306'}]: ").strip()
    database = input(f"MySQL database [{values.get('MYSQL_DATABASE') or 'rightpolamright'}]: ").strip()
    user = input(f"MySQL user [{values.get('MYSQL_USER') or 'root'}]: ").strip()
    password = getpass.getpass("MySQL password: ")

    values["MYSQL_HOST"] = host or values.get("MYSQL_HOST") or "127.0.0.1"
    values["MYSQL_PORT"] = port or values.get("MYSQL_PORT") or "3306"
    values["MYSQL_DATABASE"] = database or values.get("MYSQL_DATABASE") or "rightpolamright"
    values["MYSQL_USER"] = user or values.get("MYSQL_USER") or "root"
    values["MYSQL_PASSWORD"] = password

    _write(values)
    print(f"MySQL settings saved to {ENV_PATH}")


if __name__ == "__main__":
    run()
