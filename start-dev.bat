@echo off
echo ========================================
echo   crackvinheo Game Launcher
echo   Starting all services...
echo ========================================
echo.

echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "npm run dev:server"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Vite Dev Server...
start "Vite Dev" cmd /k "npm run dev:vite"
timeout /t 5 /nobreak >nul

echo [3/3] Starting Electron App...
start "Electron" cmd /k "npm run dev:electron"

echo.
echo ========================================
echo   All services started!
echo   Check the opened windows for logs
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
