@echo off
title Special Need Vehicle Rental — Starting Servers
echo.
echo =====================================================
echo  Special Need Vehicle Rental — Starting Servers
echo =====================================================
echo.

:: Add Node.js to PATH for this session
set "PATH=%LOCALAPPDATA%\node\node-v20.20.2-win-x64;%PATH%"

:: Verify node is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Make sure it is installed.
    pause
    exit /b
)

echo Starting Backend API on port 8080...
start "BACKEND — API (port 8080)" cmd /k "set PATH=%LOCALAPPDATA%\node\node-v20.20.2-win-x64;%PATH% && cd /d C:\Users\DueDiligence\Desktop\car_rental && npm run dev"

timeout /t 4 /nobreak >nul

echo Starting Frontend on port 5173...
start "FRONTEND — Vite (port 5173)" cmd /k "set PATH=%LOCALAPPDATA%\node\node-v20.20.2-win-x64;%PATH% && cd /d C:\Users\DueDiligence\Desktop\car_rental\frontend && npm run dev"

timeout /t 6 /nobreak >nul

echo.
echo =====================================================
echo  Both servers should now be running.
echo.
echo  Open in your browser:
echo    http://localhost:5173         (Booking site)
echo    http://localhost:5173/admin   (Admin panel)
echo.
echo  Admin login: username=admin  password=admin
echo.
echo  Keep the two server windows open while using the app.
echo  Close this window — it is safe to close.
echo =====================================================
echo.
pause
