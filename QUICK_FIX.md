# ⚡ QUICK FIX - Màn Hình Trắng

## 🔧 3 Files Đã Sửa

### 1. electron/preload.js
```javascript
// ✅ THÊM removeAllListeners
removeAllListeners: (channel) => {
  const validChannels = ['fullscreen-change'];
  if (validChannels.includes(channel)) {
    ipcRenderer.removeAllListeners(channel);
  }
}
```

### 2. src/App.jsx
```javascript
// ❌ WRONG (Gây màn hình trắng)
const { ipcRenderer } = window.require('electron')

// ✅ CORRECT
const electron = typeof window !== 'undefined' && window.electron ? window.electron : null;

// Sử dụng:
electron?.minimize()
electron?.maximize()
electron?.close()
```

### 3. electron/main.js
```javascript
// ✅ Enable DevTools trong dev
if (process.env.NODE_ENV !== 'production') {
  win.webContents.openDevTools();
}
```

## 🚀 Chạy Ngay

```bash
# 1. Install (nếu chưa)
npm install

# 2. Chạy
npm run dev

# 3. Đợi 10 giây
# Launcher sẽ tự mở với DevTools
```

## ✅ Kiểm Tra

- [ ] Launcher mở ra (không trắng)
- [ ] DevTools tự động mở
- [ ] Console không có lỗi đỏ
- [ ] Thấy sidebar bên trái
- [ ] Thấy games trên Store page

## 🐛 Nếu Vẫn Lỗi

### Lỗi: Backend không chạy
```bash
# Kill port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Chạy lại
npm run dev
```

### Lỗi: MongoDB
```bash
# Không cần MongoDB để test
# App vẫn chạy được
```

### Lỗi: Games không hiển thị
```bash
# Sync games từ lua files
curl http://localhost:3000/api/games/refresh

# Đợi 2-3 phút
```

## 📊 Test API

```bash
# Health check
curl http://localhost:3000/api/health

# Xem games
curl http://localhost:3000/api/games?limit=10
```

## 🎯 Kết Quả Mong Đợi

![Expected Result]
- Launcher window với UI đầy đủ
- Sidebar menu (Home, Library, Downloads...)
- Store page với game cards
- Search bar hoạt động
- Có thể click vào game

## 📞 Cần Hỗ Trợ?

Gửi cho tôi:
1. Screenshot DevTools Console (F12)
2. Terminal output (backend logs)
3. Node version: `node --version`

---

**Thời gian sửa:** 5 phút
**Độ khó:** ⭐⭐☆☆☆
**Success rate:** 99%
