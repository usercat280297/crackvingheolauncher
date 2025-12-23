# 🚀 HƯỚNG DẪN SỬA LỖI VÀ CHẠY LAUNCHER

## ✅ CÁC LỖI ĐÃ SỬA

### 1. Lỗi Màn Hình Trắng (CRITICAL)
**Nguyên nhân:** `window.require('electron')` không tồn tại trong Vite dev mode

**Đã sửa:**
- ✅ `electron/preload.js` - Thêm `removeAllListeners`
- ✅ `src/App.jsx` - Dùng `window.electron` thay vì `window.require`
- ✅ `electron/main.js` - Enable DevTools trong development

### 2. Các File Đã Được Cập Nhật
```
electron/
  ├── preload.js ✅ (Thêm removeAllListeners API)
  └── main.js ✅ (Enable DevTools cho dev)

src/
  └── App.jsx ✅ (Safe electron access)
```

## 🎯 CÁCH CHẠY LAUNCHER

### Bước 1: Cài Đặt Dependencies
```bash
npm install
```

### Bước 2: Chạy Development Mode
```bash
npm run dev
```

Lệnh này sẽ chạy 3 process đồng thời:
1. **Vite Dev Server** (Frontend) - Port 5173
2. **Express API Server** (Backend) - Port 3000
3. **Electron** (Desktop App)

### Bước 3: Kiểm Tra
- ✅ Launcher window mở ra (không còn trắng)
- ✅ DevTools tự động mở (để debug)
- ✅ Console không có lỗi đỏ
- ✅ Games hiển thị trên Store page

## 🐛 TROUBLESHOOTING

### Vấn đề 1: Vẫn Màn Hình Trắng

**Giải pháp:**
1. Mở DevTools (F12 hoặc Ctrl+Shift+I)
2. Xem tab Console - tìm lỗi màu đỏ
3. Chụp màn hình và gửi cho tôi

**Lỗi thường gặp:**
```javascript
// Nếu thấy lỗi này:
"Cannot read property 'minimize' of undefined"

// Nghĩa là: electron chưa được expose đúng
// Kiểm tra file electron/preload.js
```

### Vấn đề 2: Backend Không Chạy

**Triệu chứng:**
```
Failed to fetch http://localhost:3000/api/...
```

**Giải pháp:**
```bash
# Kiểm tra port 3000 có bị chiếm không
netstat -ano | findstr :3000

# Nếu có process đang dùng, kill nó:
taskkill /PID <PID_NUMBER> /F

# Hoặc đổi port trong .env:
API_PORT=3001
```

### Vấn đề 3: MongoDB Không Kết Nối

**Triệu chứng:**
```
MongoDB connection failed
```

**Giải pháp:**

**Option A: Cài MongoDB Local**
1. Download: https://www.mongodb.com/try/download/community
2. Install và chạy MongoDB service
3. Restart launcher

**Option B: Dùng MongoDB Atlas (Cloud - FREE)**
1. Tạo account: https://www.mongodb.com/cloud/atlas/register
2. Tạo free cluster
3. Lấy connection string
4. Update `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/game-launcher
```

**Option C: Chạy Không Cần MongoDB**
Launcher vẫn hoạt động nhưng không có:
- User authentication
- Library management
- Download history

### Vấn đề 4: Games Không Hiển Thị

**Nguyên nhân:** Chưa có data trong database

**Giải pháp:**
```bash
# Sync games từ lua files
curl http://localhost:3000/api/games/refresh

# Hoặc mở browser:
http://localhost:3000/api/games/refresh
```

Đợi 2-5 phút để sync hoàn tất.

### Vấn đề 5: Port Already in Use

**Lỗi:**
```
Port 3000 is already in use
Port 5173 is already in use
```

**Giải pháp:**
```bash
# Kill tất cả Node processes
taskkill /F /IM node.exe

# Hoặc restart máy
```

## 📊 KIỂM TRA HỆ THỐNG

### Test Backend API
```bash
# Health check
curl http://localhost:3000/api/health

# Xem số games
curl http://localhost:3000/api/games/cache-stats

# Test search
curl "http://localhost:3000/api/search/search?q=GTA"
```

### Test Frontend
1. Mở launcher
2. F12 để mở DevTools
3. Vào tab Console
4. Không có lỗi đỏ = OK ✅

### Test Electron IPC
```javascript
// Paste vào DevTools Console:
console.log('Electron:', window.electron);
// Nên thấy object với minimize, maximize, close methods
```

## 🎮 FEATURES CHECKLIST

### Core Features
- [x] Launcher mở ra (không trắng)
- [x] Sidebar navigation
- [x] Store page với games
- [x] Search functionality
- [x] Game detail page
- [x] Download system
- [x] Settings page

### Advanced Features
- [ ] User authentication (cần MongoDB)
- [ ] Library management (cần MongoDB)
- [ ] Download history (cần MongoDB)
- [ ] Reviews system (cần MongoDB)

## 🔍 DEBUG MODE

### Enable Verbose Logging

**Backend (server.js):**
```javascript
// Thêm vào đầu file
process.env.DEBUG = 'true';
```

**Frontend (DevTools Console):**
```javascript
// Enable React DevTools
localStorage.setItem('debug', 'true');
```

### View Logs

**Backend:**
```bash
# Xem real-time logs
npm run dev:server

# Hoặc
node server.js
```

**Frontend:**
- F12 → Console tab
- F12 → Network tab (xem API calls)

**Electron:**
- Main process: Terminal output
- Renderer process: DevTools Console

## 📈 PERFORMANCE TIPS

### 1. Tăng Tốc Độ Load Games
```javascript
// src/pages/Store.jsx
// Giảm limit nếu load chậm
const params = new URLSearchParams({
  page: page.toString(),
  limit: '20', // Giảm từ 50 xuống 20
  search,
  category: selectedCategory
});
```

### 2. Cache Images
```javascript
// Thêm vào index.html
<link rel="preconnect" href="http://localhost:3000">
<link rel="dns-prefetch" href="http://localhost:3000">
```

### 3. Lazy Load Components
```javascript
// src/main.jsx
import { lazy, Suspense } from 'react';

const Store = lazy(() => import('./pages/Store'));
const GameDetail = lazy(() => import('./pages/GameDetail'));
```

## 🚀 PRODUCTION BUILD

### Build Launcher
```bash
npm run build
```

Output: `dist/` folder với executable

### Build Checklist
- [ ] Update version in package.json
- [ ] Test all features
- [ ] Disable DevTools (electron/main.js)
- [ ] Update MongoDB URI (production)
- [ ] Update API URLs (if deployed)

## 📞 SUPPORT

### Nếu Vẫn Gặp Lỗi

Cung cấp thông tin sau:
1. **Screenshot DevTools Console** (F12)
2. **Backend logs** (terminal output)
3. **System info:**
   ```bash
   node --version
   npm --version
   ```
4. **File package.json**

### Useful Commands

```bash
# Clear cache và reinstall
rm -rf node_modules package-lock.json
npm install

# Reset database
curl -X POST http://localhost:3000/api/games/clear-cache

# Force sync games
curl http://localhost:3000/api/games/refresh

# Check running processes
netstat -ano | findstr :3000
netstat -ano | findstr :5173
```

## 🎉 SUCCESS INDICATORS

Launcher hoạt động đúng khi:
- ✅ Window mở ra với UI đầy đủ
- ✅ Sidebar hiển thị menu items
- ✅ Store page load games
- ✅ Search bar hoạt động
- ✅ Click vào game → Game detail page
- ✅ Download button hoạt động
- ✅ Settings page mở được
- ✅ Không có lỗi trong Console

## 📚 NEXT STEPS

Sau khi launcher chạy ổn:

1. **Thêm Games:**
   - Thêm lua files vào `lua_files/`
   - Chạy sync: `curl http://localhost:3000/api/games/refresh`

2. **Customize UI:**
   - Edit `src/pages/Store.jsx`
   - Edit `src/App.jsx`
   - Edit `tailwind.config.js`

3. **Add Features:**
   - User profiles
   - Game reviews
   - Download manager
   - Cloud saves

4. **Deploy:**
   - Backend: Railway, Heroku, AWS
   - Database: MongoDB Atlas
   - Launcher: GitHub Releases

---

**Made with ❤️ for 43,000 users**

Chúc bạn thành công! 🚀
