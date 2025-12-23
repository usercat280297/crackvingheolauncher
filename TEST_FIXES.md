# 🔧 Các Lỗi Đã Sửa

## ❌ Lỗi Chính: Màn Hình Trắng

### Nguyên nhân:
```javascript
// App.jsx - WRONG ❌
const { ipcRenderer } = window.require('electron')
```

**Vấn đề:**
- `window.require` không tồn tại trong môi trường Vite development
- Code này chạy ngay khi module load, gây crash toàn bộ app
- Electron chỉ expose API qua `window.electron` từ preload.js

### Giải pháp:
```javascript
// App.jsx - CORRECT ✅
const electron = typeof window !== 'undefined' && window.electron ? window.electron : null;

// Sử dụng với safe checks
electron?.minimize()
electron?.maximize()
electron?.close()
```

## 🔧 Các File Đã Sửa

### 1. `electron/preload.js`
**Thêm:** `removeAllListeners` method
```javascript
removeAllListeners: (channel) => {
  const validChannels = ['fullscreen-change'];
  if (validChannels.includes(channel)) {
    ipcRenderer.removeAllListeners(channel);
  }
}
```

### 2. `src/App.jsx`
**Sửa 3 chỗ:**
1. Import và khởi tạo electron
2. useEffect với electron listeners
3. Tất cả button handlers (minimize, maximize, close)

### 3. `electron/main.js`
**Cải thiện:**
- Enable DevTools trong development mode
- Chỉ block DevTools trong production
- Tự động mở DevTools khi dev

## 🚀 Cách Test

### Bước 1: Dọn dẹp
```bash
# Xóa node_modules và reinstall (nếu cần)
rm -rf node_modules
npm install
```

### Bước 2: Chạy Development
```bash
npm run dev
```

### Bước 3: Kiểm tra
✅ Launcher mở ra không còn màn hình trắng
✅ DevTools tự động mở (để debug)
✅ Có thể minimize/maximize/close window
✅ Sidebar hoạt động bình thường

## 🐛 Debug Tips

### Nếu vẫn màn hình trắng:

1. **Mở DevTools** (Ctrl+Shift+I hoặc F12)
2. **Xem Console** - tìm lỗi đỏ
3. **Kiểm tra Network** - API có chạy không?

### Các lỗi thường gặp:

#### Lỗi 1: Backend không chạy
```
Failed to fetch http://localhost:3000/api/...
```
**Giải pháp:** Chạy `npm run dev` (nó sẽ chạy cả backend)

#### Lỗi 2: MongoDB không kết nối
```
MongoDB connection failed
```
**Giải pháp:** 
- Cài MongoDB: https://www.mongodb.com/try/download/community
- Hoặc dùng MongoDB Atlas (cloud)
- Hoặc comment code MongoDB trong server.js

#### Lỗi 3: Port đã được sử dụng
```
Port 3000 is already in use
```
**Giải pháp:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Hoặc đổi port trong .env
API_PORT=3001
```

## 📋 Checklist Hoàn Chỉnh

### Frontend ✅
- [x] App.jsx sử dụng window.electron
- [x] Safe checks cho electron API
- [x] Contexts hoạt động đúng
- [x] Routes được cấu hình

### Electron ✅
- [x] Preload expose đầy đủ API
- [x] Main process cấu hình đúng
- [x] DevTools enabled trong dev

### Backend (Cần kiểm tra)
- [ ] MongoDB đang chạy
- [ ] Server.js khởi động thành công
- [ ] API endpoints hoạt động
- [ ] Lua files được parse đúng

## 🎯 Các Bước Tiếp Theo

### 1. Kiểm tra Backend
```bash
# Test API health
curl http://localhost:3000/api/health

# Hoặc mở browser
http://localhost:3000/api/health
```

### 2. Kiểm tra Database
```bash
# Xem games trong DB
curl http://localhost:3000/api/games/cache-stats
```

### 3. Test Search
```bash
# Test search API
curl "http://localhost:3000/api/search/search?q=GTA"
```

### 4. Sync Lua Files
```bash
# Force refresh cache từ lua files
curl http://localhost:3000/api/games/refresh
```

## 🔍 Monitoring

### Console Logs Quan Trọng:

**Backend:**
```
✅ MongoDB connected
✅ Page loaded successfully
🚀 API server running on port 3000
```

**Frontend (DevTools):**
```
✅ No errors in Console
✅ Network requests successful (200 OK)
✅ React components rendering
```

## 💡 Best Practices

### 1. Luôn dùng Safe Checks
```javascript
// GOOD ✅
electron?.minimize()

// BAD ❌
electron.minimize()
```

### 2. Handle Errors
```javascript
try {
  const response = await fetch(url);
  const data = await response.json();
} catch (error) {
  console.error('Error:', error);
  // Show user-friendly message
}
```

### 3. Validate Data
```javascript
if (!game || !game.title) {
  console.warn('Invalid game data');
  return;
}
```

## 🎉 Kết Quả Mong Đợi

Sau khi sửa:
- ✅ Launcher mở ra với UI đầy đủ
- ✅ Sidebar hiển thị menu
- ✅ Store page load games
- ✅ Search hoạt động
- ✅ Download system ready
- ✅ Không còn màn hình trắng!

## 📞 Support

Nếu vẫn gặp lỗi, cung cấp:
1. Screenshot DevTools Console
2. Backend logs (terminal output)
3. File package.json
4. Node version: `node --version`
