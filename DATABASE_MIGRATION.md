# Database Migration Status

## Runtime database

RightPolamRight is configured for **MySQL only**.

- SQLAlchemy driver: `mysql+pymysql`
- MySQL Python driver: PyMySQL
- Character set: `utf8mb4`
- Connection pooling: enabled with pre-ping/recycle
- Database settings: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
- Configuration source: project-root `.env` or process environment

There is no runtime SQLite default or fallback.

## Startup

`start.bat` performs:

1. Create/reuse Python venv with `py -3`
2. Install backend dependencies including PyMySQL
3. Prompt for MySQL settings when they are not configured
4. Verify MySQL Server connectivity and create the database if permitted
5. Run SQLAlchemy schema migration against MySQL
6. Bootstrap/verify the Admin account in MySQL
7. Start FastAPI
8. Start the Vite frontend

## Existing SQLite data

The supplied project database contained no application rows, so no bundled SQLite database is retained.

For another installation that has older SQLite records, `backend/import_legacy_sqlite_to_mysql.py`
is provided strictly as a **one-time migration tool**. It is not imported or used by the running
application. Once migration is verified, archive/delete the old SQLite file.
