@echo off
echo 🚀 Installing Auto-Update System Dependencies...

echo.
echo 📦 Installing Node.js packages...
npm install node-cache node-cron ws

echo.
echo ✅ Dependencies installed successfully!

echo.
echo 🔄 Starting server with auto-update system...
node server.js

pause