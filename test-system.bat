@echo off
echo ========================================
echo   LAUNCHER DIAGNOSTIC TOOL
echo ========================================
echo.

echo [1/5] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo OK: Node.js installed
echo.

echo [2/5] Checking MongoDB...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MongoDB not found or not running
    echo The app will work but without database features
) else (
    echo OK: MongoDB installed
)
echo.

echo [3/5] Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
) else (
    echo OK: Dependencies installed
)
echo.

echo [4/5] Testing Backend API...
echo Starting backend server...
start /B cmd /c "node server.js > backend.log 2>&1"
timeout /t 5 /nobreak >nul

curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Backend not responding
    echo Check backend.log for errors
    type backend.log
    pause
    exit /b 1
) else (
    echo OK: Backend is running
)
echo.

echo [5/5] System Status
echo ========================================
curl -s http://localhost:3000/api/health
echo.
echo ========================================
echo.

echo All checks passed!
echo.
echo To start the launcher:
echo   npm run dev
echo.
echo To view logs:
echo   Backend: backend.log
echo   Frontend: Check DevTools Console (F12)
echo.
pause
