@echo off
REM ============================================================
REM  RightPolamRight - Smart Logistics Partner
REM  Starts the FastAPI backend and the React frontend.
REM
REM  Uses the Windows Python Launcher (py -3). The bare "python"
REM  command is never used, because on many Windows machines it
REM  resolves to the Microsoft Store alias rather than a real
REM  interpreter. Once the virtual environment exists we call its
REM  own interpreter directly.
REM
REM  All paths are derived from this file's location (%~dp0), so
REM  the project runs from any folder and any user account,
REM  including paths containing spaces or brackets such as
REM  "...\Downloads\rightpolamright (2)\rightpolamright".
REM ============================================================
title RightPolamRight Launcher
setlocal

REM Work from the folder this script lives in, whatever it is called.
cd /d "%~dp0"

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "VENV_PY=%BACKEND%\venv\Scripts\python.exe"

echo.
echo  ============================================
echo   RightPolamRight Logistics Platform
echo  ============================================
echo.

REM ---------- 1. Python check (launcher only) ----------
py -3 --version >nul 2>&1
if errorlevel 1 goto no_python

for /f "tokens=*" %%v in ('py -3 --version 2^>^&1') do set "PYVER=%%v"
echo  [OK] Found %PYVER% via the Python Launcher.

REM ---------- 2. Node check ----------
where npm >nul 2>&1
if errorlevel 1 goto no_node

REM ---------- 3. Sanity check on the project layout ----------
if not exist "%BACKEND%\main.py" goto bad_layout
if not exist "%FRONTEND%\package.json" goto bad_layout

REM ---------- 4. Don't start duplicate servers ----------
netstat -ano | findstr /r /c:":8000 .*LISTENING" >nul 2>&1
if not errorlevel 1 echo  [!] Port 8000 is already in use - the API may already be running.
netstat -ano | findstr /r /c:":5173 .*LISTENING" >nul 2>&1
if not errorlevel 1 echo  [!] Port 5173 is already in use - the web app may already be running.

REM ---------- 5. Virtual environment ----------
echo  [1/4] Preparing the backend...
if exist "%VENV_PY%" goto venv_ready

echo        Creating the virtual environment ^(first run only^)...
py -3 -m venv "%BACKEND%\venv"
if errorlevel 1 goto venv_failed
if not exist "%VENV_PY%" goto venv_failed

:venv_ready
echo        Installing Python packages...
"%VENV_PY%" -m pip install --upgrade pip --quiet
"%VENV_PY%" -m pip install -r "%BACKEND%\requirements.txt" --quiet
if errorlevel 1 goto pip_failed

REM ---------- 6. MySQL / first admin ----------
echo  [2/4] Preparing MySQL...
pushd "%BACKEND%"
"%VENV_PY%" configure_mysql.py
if errorlevel 1 (
    popd
    goto mysql_config_failed
)
"%VENV_PY%" prepare_mysql.py
if errorlevel 1 (
    popd
    goto mysql_connection_failed
)
echo        Creating a pre-migration MySQL backup...
"%VENV_PY%" backup_mysql.py
if errorlevel 1 (
    popd
    goto database_failed
)
echo        Aligning users.id foreign keys to BIGINT SIGNED without dropping data...
"%VENV_PY%" migrate_users_fk_bigint.py
if errorlevel 1 (
    popd
    goto database_failed
)
echo        Checking the actual existing MySQL schema...
"%VENV_PY%" mysql_schema_preflight.py
if errorlevel 1 (
    popd
    goto database_failed
)
echo        Verifying ORM-generated MySQL DDL...
"%VENV_PY%" verify_mysql_ddl.py
if errorlevel 1 (
    popd
    goto database_failed
)
"%VENV_PY%" migrate.py
if errorlevel 1 (
    popd
    goto database_failed
)
echo        Verifying live users table columns...
"%VENV_PY%" verify_users_schema.py
if errorlevel 1 (
    popd
    goto database_failed
)
echo        Verifying live MySQL PK/FK definitions...
"%VENV_PY%" verify_mysql_live_schema.py
if errorlevel 1 (
    popd
    goto database_failed
)
"%VENV_PY%" bootstrap_admin.py
if errorlevel 1 (
    popd
    goto admin_failed
)
echo        Verifying Admin user and admins row...
"%VENV_PY%" verify_admin_bootstrap.py
if errorlevel 1 (
    popd
    goto admin_failed
)
popd

REM ---------- 7. Start the API ----------
REM /D sets the working directory, so the command itself can stay a
REM short relative path. That keeps this line free of nested quotes
REM even when the project path contains spaces or brackets.
echo  [3/4] Starting the API on http://localhost:8000 ...
start "RightPolamRight API" /D "%BACKEND%" cmd /k "venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

REM ---------- 8. Start the web app ----------
echo  [4/4] Starting the web app on http://localhost:5173 ...
REM Check the project's local Vite binary, not a global Vite installation.
if exist "%FRONTEND%\node_modules\.bin\vite.cmd" goto npm_ready
echo        Installing frontend packages ^(first run takes a few minutes^)...
pushd "%FRONTEND%"
if exist "package-lock.json" (
    call npm ci
) else (
    call npm install
)
popd
if not exist "%FRONTEND%\node_modules\.bin\vite.cmd" goto npm_failed

:npm_ready
start "RightPolamRight Web" /D "%FRONTEND%" cmd /k "call npm run dev"

echo.
echo  ============================================
echo   Web app  : http://localhost:5173
echo   API      : http://localhost:8000
echo   API docs : http://localhost:8000/docs
echo   Database : MySQL only
echo.
echo   Sign in with accounts stored in MySQL.
echo   Customer and Driver accounts are created through Register.
echo   First run prompts for an Admin if none exists; env vars are also supported.
echo  ============================================
echo.
echo  Two new windows opened. Closing them stops the servers.
echo  If a window closed instantly, read the error it printed.
timeout /t 14 >nul
start "" http://localhost:5173
goto done

REM ---------------------------------------------------- failures
:database_failed
echo  [X] MySQL schema initialization/migration failed.
echo      Read the Python error above for the exact reason.
echo.
pause
exit /b 1

:mysql_config_failed
echo  [X] MySQL configuration failed.
echo      You can also copy .env.example to .env and set MYSQL_HOST,
echo      MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER and MYSQL_PASSWORD.
echo.
pause
exit /b 1

:mysql_connection_failed
echo  [X] Could not connect to MySQL.
echo      Make sure MySQL Server is installed, running, and your .env
echo      credentials are correct. The configured user must be able to
echo      access/create the configured database.
echo.
pause
exit /b 1

:admin_failed
echo  [X] Admin setup failed. Check RPR_ADMIN_EMAIL, RPR_ADMIN_PASSWORD, RPR_ADMIN_NAME and RPR_ADMIN_MOBILE.
echo.
pause
exit /b 1

:no_python
echo  [X] Python 3 is required. Please install Python 3 and make sure the Python Launcher (py) is available.
echo.
pause
exit /b 1

:no_node
echo  [X] Node.js / npm was not found on PATH.
echo      Install Node.js 18+ from https://nodejs.org, then open a new
echo      Command Prompt and run start.bat again.
echo.
pause
exit /b 1

:bad_layout
echo  [X] This script is not sitting next to the project folders.
echo      Expected to find:
echo        "%BACKEND%\main.py"
echo        "%FRONTEND%\package.json"
echo      Move start.bat into the rightpolamright folder that contains
echo      the backend and frontend directories.
echo.
pause
exit /b 1

:venv_failed
echo  [X] Could not create the virtual environment with "py -3 -m venv".
echo      Try running this by hand to see the reason:
echo        py -3 -m venv "%BACKEND%\venv"
echo.
pause
exit /b 1

:pip_failed
echo  [X] Backend dependencies failed to install.
echo      Try running this by hand to see the reason:
echo        "%VENV_PY%" -m pip install -r "%BACKEND%\requirements.txt"
echo.
pause
exit /b 1

:npm_failed
echo  [X] Frontend dependencies failed to install.
echo      Try running "npm install" inside the frontend folder to see why.
echo.
pause
exit /b 1

:done
endlocal
