"""Print the exact MySQL CREATE TABLE DDL generated from current ORM models."""
import sys
import types
import importlib.util
from pathlib import Path

from sqlalchemy.dialects import mysql
from sqlalchemy.orm import declarative_base
from sqlalchemy.schema import CreateTable

BACKEND = Path(__file__).resolve().parent
MODELS = BACKEND / "models" / "__init__.py"

# Avoid constructing a live engine; DDL compilation only needs Base.
fake_db = types.ModuleType("database")
fake_db.Base = declarative_base()
sys.modules["database"] = fake_db

spec = importlib.util.spec_from_file_location("rpr_models_ddl", MODELS)
model_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(model_module)

dialect = mysql.dialect()
users = model_module.Base.metadata.tables["users"]
admins = model_module.Base.metadata.tables["admins"]

print("ACTUAL GENERATED CREATE TABLE users:")
print(str(CreateTable(users).compile(dialect=dialect)).strip())
print("\nACTUAL GENERATED CREATE TABLE admins:")
print(str(CreateTable(admins).compile(dialect=dialect)).strip())

u = users.c.id
a = admins.c.user_id
print("\nCOMPILED TYPE CHECK:")
print("users.id:", u.type.compile(dialect=dialect),
      "unsigned=", getattr(u.type, "unsigned", None),
      "nullable=", u.nullable)
print("admins.user_id:", a.type.compile(dialect=dialect),
      "unsigned=", getattr(a.type, "unsigned", None),
      "nullable=", a.nullable)

if (
    u.type.compile(dialect=dialect) != a.type.compile(dialect=dialect)
    or getattr(u.type, "unsigned", None) != getattr(a.type, "unsigned", None)
):
    raise SystemExit("FAIL: users.id and admins.user_id compile incompatibly.")
print("DDL TYPE CHECK: PASS")
