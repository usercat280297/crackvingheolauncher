# 🔍 COMPREHENSIVE TROUBLESHOOTING GUIDE

## 📋 TABLE OF CONTENTS
1. [Màn Hình Trắng](#white-screen)
2. [Backend Issues](#backend)
3. [Database Issues](#database)
4. [Electron Issues](#electron)
5. [API Issues](#api)
6. [Performance Issues](#performance)
7. [Build Issues](#build)

---

## 1. MÀN HÌNH TRẮNG {#white-screen}

### Triệu Chứng
- Launcher mở ra nhưng toàn màu trắng
- Không thấy UI gì cả
- DevTools có lỗi đỏ

### Nguyên Nhân
```javascript
// App.jsx - WRONG ❌
const { ipcRenderer } = window.require('electron')
// → window.require không tồn tại trong Vite
```

### Giải Pháp ✅
**Đã sửa trong commit này:**
- `electron/preload.js` - Expose đầy đủ API
- `src/App.jsx` - Dùng window.electron
- `electron/main.js` - Enable DevTools

### Verify Fix
```javascript
// Paste vào DevTools Console:
console.log(window.electron);
// Phải thấy: { minimize: f, maximize: f, close: f, ... }
```

---

## 2. BACKEND ISSUES {#backend}

### Issue 2.1: Port Already in Use

**Triệu chứng:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Giải pháp:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Issue 2.2: Backend Not Starting

**Triệu chứng:**
```
npm run dev
# Backend không chạy
```

**Debug:**
```bash
# Chạy backend riêng để xem lỗi
node server.js

# Xem lỗi chi tiết
```

**Lỗi thường gặp:**

**A. Module not found**
```bash
Error: Cannot find module 'express'
# Fix:
npm install
```

**B. Syntax error**
```bash
SyntaxError: Unexpected token
# Fix: Kiểm tra Node version
node --version  # Cần >= 14.0.0
```

**C. MongoDB connection failed**
```bash
MongoDB connection failed
# Fix: Xem section Database Issues
```

### Issue 2.3: API Returns 404

**Triệu chứng:**
```
GET http://localhost:3000/api/games 404 (Not Found)
```

**Kiểm tra:**
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Nếu 404 → Backend chưa chạy
# Nếu 200 → Backend OK, check route
```

---

## 3. DATABASE ISSUES {#database}

### Issue 3.1: MongoDB Not Installed

**Triệu chứng:**
```
MongoDB connection failed: connect ECONNREFUSED 127.0.0.1:27017
```

**Giải pháp A: Cài MongoDB Local**
```bash
# Download
https://www.mongodb.com/try/download/community

# Install và start service
# Windows: MongoDB service tự động chạy
# Linux: sudo systemctl start mongod
# Mac: brew services start mongodb-community
```

**Giải pháp B: Dùng MongoDB Atlas (Cloud)**
```bash
# 1. Tạo account: https://www.mongodb.com/cloud/atlas
# 2. Tạo free cluster (M0)
# 3. Lấy connection string
# 4. Update .env:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/game-launcher
```

**Giải pháp C: Chạy Không MongoDB**
```javascript
// server.js - Comment MongoDB code
// mongoose.connect(MONGODB_URI)
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.log('MongoDB failed'));

// App vẫn chạy nhưng không có:
// - User auth
// - Library
// - Download history
```

### Issue 3.2: Database Empty

**Triệu chứng:**
```
Games page shows: "No games found"
```

**Giải pháp:**
```bash
# Sync games từ lua files
curl http://localhost:3000/api/games/refresh

# Hoặc browser:
http://localhost:3000/api/games/refresh

# Đợi 2-5 phút
# Check progress:
curl http://localhost:3000/api/games/sync-status
```

### Issue 3.3: Duplicate Games

**Triệu chứng:**
```
Games hiển thị nhiều lần
```

**Giải pháp:**
```bash
# Clear database
curl -X POST http://localhost:3000/api/games/clear-cache

# Re-sync
curl http://localhost:3000/api/games/refresh
```

---

## 4. ELECTRON ISSUES {#electron}

### Issue 4.1: Window Not Opening

**Triệu chứng:**
```
npm run dev
# Vite chạy, backend chạy, nhưng không có window
```

**Debug:**
```bash
# Check electron logs
# Terminal sẽ show lỗi electron
```

**Lỗi thường gặp:**

**A. Vite chưa ready**
```bash
# electron/main.js đợi Vite
# Nếu Vite chậm → electron timeout
# Fix: Tăng timeout trong package.json
"dev:electron": "wait-on http://localhost:5173 --timeout 60000 && electron ."
```

**B. Port 5173 bị chiếm**
```bash
# Kill port
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Issue 4.2: DevTools Not Opening

**Triệu chứng:**
```
F12 không mở DevTools
```

**Giải pháp:**
```javascript
// electron/main.js
// Đảm bảo có dòng này:
if (process.env.NODE_ENV !== 'production') {
  win.webContents.openDevTools();
}
```

### Issue 4.3: IPC Not Working

**Triệu chứng:**
```
Minimize/Maximize/Close buttons không hoạt động
```

**Debug:**
```javascript
// DevTools Console:
console.log(window.electron);
// Phải thấy object với methods

// Test:
window.electron.minimize();
// Window phải minimize
```

**Fix:**
```javascript
// Kiểm tra electron/preload.js
// Phải có contextBridge.exposeInMainWorld
```

---

## 5. API ISSUES {#api}

### Issue 5.1: CORS Error

**Triệu chứng:**
```
Access to fetch at 'http://localhost:3000/api/games' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Giải pháp:**
```javascript
// server.js - Đảm bảo có:
const cors = require('cors');
app.use(cors());
```

### Issue 5.2: Slow API Response

**Triệu chứng:**
```
Games load rất chậm (>5 giây)
```

**Debug:**
```bash
# Check số games trong DB
curl http://localhost:3000/api/games/cache-stats

# Nếu >10,000 games → Cần optimize
```

**Giải pháp:**
```javascript
// src/pages/Store.jsx
// Giảm limit
const params = new URLSearchParams({
  limit: '20', // Từ 50 → 20
});

// Hoặc thêm pagination
```

### Issue 5.3: Search Not Working

**Triệu chứng:**
```
Search bar không trả về kết quả
```

**Debug:**
```bash
# Test search API
curl "http://localhost:3000/api/search/search?q=GTA"

# Nếu empty → Chưa có index
```

**Giải pháp:**
```bash
# Build search index
node buildAdvancedIndex.js

# Hoặc
npm run build:cache
```

---

## 6. PERFORMANCE ISSUES {#performance}

### Issue 6.1: High Memory Usage

**Triệu chứng:**
```
Task Manager: Electron > 1GB RAM
```

**Giải pháp:**
```javascript
// electron/main.js
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  enableRemoteModule: false, // Thêm dòng này
}
```

### Issue 6.2: Slow Rendering

**Triệu chứng:**
```
UI lag khi scroll
```

**Giải pháp:**
```javascript
// src/pages/Store.jsx
// Thêm virtualization
import { FixedSizeGrid } from 'react-window';

// Hoặc lazy load images
<img loading="lazy" src={...} />
```

### Issue 6.3: High CPU Usage

**Triệu chứng:**
```
CPU 100% khi idle
```

**Debug:**
```javascript
// DevTools → Performance tab
// Record và xem bottleneck
```

**Lỗi thường gặp:**
```javascript
// Infinite loop trong useEffect
useEffect(() => {
  fetchGames(); // ❌ Gọi mãi
}, [fetchGames]); // fetchGames thay đổi mỗi render

// Fix:
useEffect(() => {
  fetchGames();
}, []); // ✅ Chỉ gọi 1 lần
```

---

## 7. BUILD ISSUES {#build}

### Issue 7.1: Build Failed

**Triệu chứng:**
```
npm run build
# Error: ...
```

**Debug:**
```bash
# Build từng phần
npm run build:vite  # Build frontend
npm run build:electron  # Build electron
```

**Lỗi thường gặp:**

**A. Out of memory**
```bash
FATAL ERROR: Reached heap limit Allocation failed
# Fix:
set NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

**B. Module not found**
```bash
# Fix:
npm install
npm run build
```

### Issue 7.2: Built App Not Working

**Triệu chứng:**
```
npm run build → Success
Chạy .exe → Màn hình trắng
```

**Debug:**
```javascript
// electron/main.js
// Trong production, load từ file:
if (app.isPackaged) {
  win.loadFile(path.join(__dirname, '../dist/index.html'));
} else {
  win.loadURL('http://localhost:5173');
}
```

---

## 🆘 EMERGENCY FIXES

### Nuclear Option 1: Clean Install
```bash
# Xóa tất cả
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Restart
npm run dev
```

### Nuclear Option 2: Reset Database
```bash
# Clear DB
curl -X POST http://localhost:3000/api/games/clear-cache

# Re-sync
curl http://localhost:3000/api/games/refresh
```

### Nuclear Option 3: Fresh Clone
```bash
# Backup .env
copy .env .env.backup

# Clone lại
git clone <repo>
cd <repo>

# Restore .env
copy .env.backup .env

# Install
npm install
npm run dev
```

---

## 📊 DIAGNOSTIC COMMANDS

```bash
# System info
node --version
npm --version
mongod --version

# Check ports
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Test API
curl http://localhost:3000/api/health
curl http://localhost:3000/api/games/cache-stats

# Check processes
tasklist | findstr node
tasklist | findstr electron

# Logs
type backend.log
type electron.log
```

---

## 🎯 SUCCESS CHECKLIST

- [ ] `npm run dev` chạy không lỗi
- [ ] Backend log: "✅ MongoDB connected"
- [ ] Backend log: "🚀 API server running on port 3000"
- [ ] Vite log: "Local: http://localhost:5173/"
- [ ] Electron window mở ra
- [ ] DevTools tự động mở
- [ ] Console không có lỗi đỏ
- [ ] Sidebar hiển thị
- [ ] Games hiển thị trên Store
- [ ] Search hoạt động
- [ ] Click game → Detail page
- [ ] Download button hoạt động

---

**Last Updated:** 2024
**Version:** 1.0.0
**Support:** Check FIX_GUIDE_COMPLETE.md
