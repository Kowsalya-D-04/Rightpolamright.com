# RightPolamRight MySQL Setup

RightPolamRight now uses **MySQL only**. There is no SQLite runtime fallback.

## First run

1. Install/start MySQL Server 8.x.
2. Run `start.bat`.
3. On the first run, the launcher asks for:
   - MySQL host
   - port
   - database name
   - MySQL username
   - MySQL password
4. These values are saved to the project-root `.env`.
5. `prepare_mysql.py` connects to MySQL and creates the configured database when the account has permission.
6. `migrate.py` creates/updates all RightPolamRight tables in MySQL.
7. The normal first-admin bootstrap then runs against MySQL.

## Recommended MySQL user

Run this in MySQL as an administrator, changing the password first:

```sql
CREATE DATABASE IF NOT EXISTS rightpolamright
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'rightpolamright_user'@'localhost'
  IDENTIFIED BY 'CHANGE_THIS_STRONG_PASSWORD';

GRANT ALL PRIVILEGES ON rightpolamright.*
  TO 'rightpolamright_user'@'localhost';

FLUSH PRIVILEGES;
```

Then use:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=rightpolamright
MYSQL_USER=rightpolamright_user
MYSQL_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
```

## Migrating an older SQLite installation

The production application does not read SQLite anymore. A one-time importer is included only to preserve old installations:

```bat
cd backend
venv\Scripts\python.exe import_legacy_sqlite_to_mysql.py "C:\path\to\old\rightpolamright.db"
```

Run it only after MySQL is configured and `migrate.py` has created the MySQL schema. After verifying the imported records, archive/delete the old `.db` file.

## Runtime behavior

All SQLAlchemy sessions, API reads/writes, authentication records, loads, availability, matches, trips, pricing, payments, notifications, ratings, and admin data use the MySQL connection configured by the `MYSQL_*` variables.
