@echo off
echo ========================================
echo   RESTART LAUNCHER (Clean)
echo ========================================
echo.

echo [1/4] Killing all Node processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM electron.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Starting Backend Server...
start "Backend Server" cmd /k "npm run dev:server"
timeout /t 12 /nobreak >nul

echo [3/4] Starting Vite Dev Server...
start "Vite Dev" cmd /k "npm run dev:vite"
timeout /t 5 /nobreak >nul

echo [4/4] Starting Electron App...
start "Electron" cmd /k "npm run dev:electron"

echo.
echo ========================================
echo   All services restarted!
echo   DevTools will open automatically
echo ========================================
echo.
pause
