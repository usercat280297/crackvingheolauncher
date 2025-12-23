@echo off
echo Testing Search API...
echo.
echo Starting server in background...
start /B node server.js

timeout /t 3 /nobreak >nul

echo.
echo Testing search for "resident evil"...
curl "http://localhost:3000/api/search/search?q=resident%%20evil&limit=10"

echo.
echo.
echo Testing search for "resident"...
curl "http://localhost:3000/api/search/search?q=resident&limit=5"

echo.
echo.
echo Testing search stats...
curl "http://localhost:3000/api/search/stats"

echo.
echo.
echo Done! Press any key to exit...
pause >nul
