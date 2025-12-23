@echo off
echo ========================================
echo   RESUME GAME SYNC
echo ========================================
echo.
echo This will continue syncing games from lua files
echo Current: ~1900 games synced
echo Remaining: ~41,000+ games
echo.
echo Estimated time: 2-3 hours
echo.
pause
echo.
echo Starting sync...
node resume-sync.js
pause
