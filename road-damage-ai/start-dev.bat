@echo off
:: Start Road Damage AI - Development Servers
:: Double-click this file to start all servers

echo.
echo ========================================
echo   Road Damage AI - Development Servers
echo ========================================
echo.

cd /d "%~dp0"

echo Starting AI Service (Python)...
start "AI Service - Road Damage AI" cmd /k "cd /d %~dp0 && call venv\Scripts\activate && cd ai && python api/main.py"

timeout /t 3 /nobreak > nul

echo Starting Backend Server (Node.js)...
start "Backend - Road Damage AI" cmd /k "cd /d %~dp0backend-node && npm run dev"

timeout /t 2 /nobreak > nul

echo Starting Frontend Server (Next.js)...
start "Frontend - Road Damage AI" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   All servers are starting!
echo ========================================
echo.
echo   AI Service: http://localhost:8000
echo   Backend:    http://localhost:3001
echo   Frontend:   http://localhost:3000
echo.
echo   Admin Panel: http://localhost:3000/admin/login
echo   Admin Login: admin / admin123
echo.
echo ========================================
echo.
pause
