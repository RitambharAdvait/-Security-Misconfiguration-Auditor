@echo off
title Windows Security Misconfiguration Auditor (ASArP Framework)
cd /d "%~dp0"

echo =====================================================================
echo   Windows Security Misconfiguration Auditor (ASArP Framework)
echo   Automated Security Assessment ^& Audit of Remote Platforms
echo =====================================================================
echo.

if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Python virtual environment not found in venv\
    echo Please ensure the venv folder exists.
    pause
    exit /b 1
)

echo [*] Checking port 8000...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo [*] Launching dashboard in your default browser...
start http://localhost:8000

echo [*] Starting Auditor Backend Server on port 8000...
echo [*] ==============================================================
echo [*]  KEEP THIS WINDOW OPEN while using the dashboard!
echo [*]  To stop the server, press Ctrl+C or close this window.
echo [*] ==============================================================
echo.

"venv\Scripts\python.exe" -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pause
