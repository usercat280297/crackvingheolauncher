# 🚀 QUICK START - HƯỚNG DẪN NHANH

## 1️⃣ INSTALL DEPENDENCY

```bash
npm install extract-zip
```

Hoặc:
```bash
npm install
```

---

## 2️⃣ SETUP FOLDER & FILES

### Tạo thư mục:
```bash
# Windows PowerShell
mkdir C:\Games\Torrents
mkdir C:\Games\Installed
mkdir C:\Games\Torrents_DB
```

### Tạo file `C:\Games\Torrents_DB\games.json`:

```json
{
  "games": [
    {
      "id": 1091500,
      "appId": 1091500,
      "name": "Cyberpunk 2077",
      "torrentFile": "C:\\Games\\Torrents_DB\\cyberpunk_2077.torrent",
      "installPath": "C:\\Games\\Installed\\Cyberpunk 2077",
      "hasDenuvo": true,
      "size": "55 GB",
      "isActive": true
    },
    {
      "id": 847370,
      "appId": 847370,
      "name": "Elden Ring",
      "torrentFile": "C:\\Games\\Torrents_DB\\elden_ring.torrent",
      "installPath": "C:\\Games\\Installed\\Elden Ring",
      "hasDenuvo": true,
      "size": "60 GB",
      "isActive": true
    }
  ]
}
```

### Copy .torrent files:
```bash
# Copy game .torrent files vào: C:\Games\Torrents_DB\
# Ví dụ:
# C:\Games\Torrents_DB\cyberpunk_2077.torrent
# C:\Games\Torrents_DB\elden_ring.torrent
```

### Cập nhật `.env`:
```env
GAMES_PATH=C:\Games
TORRENT_DOWNLOAD_PATH=C:\Games\Torrents
TORRENT_INSTALLED_PATH=C:\Games\Installed
TORRENT_DB_PATH=C:\Games\Torrents_DB
```

---

## 3️⃣ RUN SERVER

```bash
npm run dev
```

Hoặc chỉ backend:
```bash
npm run dev:server
```

---

## 4️⃣ TEST API

### Test 1: Lấy game nổi tiếng
```bash
curl http://localhost:3000/api/most-popular?limit=5
```

**Expected:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1091500,
      "title": "Cyberpunk 2077",
      "isDenuvo": true,
      "badge": "⚡ Denuvo",
      "rating": 95
    }
  ]
}
```

### Test 2: Lấy thông tin torrent game
```bash
curl http://localhost:3000/api/torrent-db/game/1091500
```

**Expected:**
```json
{
  "success": true,
  "game": {
    "id": 1091500,
    "name": "Cyberpunk 2077",
    "torrentFile": "C:\\Games\\Torrents_DB\\cyberpunk_2077.torrent",
    "torrentExists": true,
    "hasDenuvo": true
  }
}
```

### Test 3: Bắt đầu download
```bash
curl -X POST http://localhost:3000/api/torrent/download \
  -H "Content-Type: application/json" \
  -d '{
    "torrentPath": "C:\\Games\\Torrents_DB\\cyberpunk_2077.torrent",
    "gameId": "1091500",
    "gameName": "Cyberpunk 2077",
    "autoUnzip": true
  }'
```

**Expected:**
```json
{
  "success": true,
  "downloadId": "1091500",
  "message": "Started downloading Cyberpunk 2077"
}
```

### Test 4: Check download progress
```bash
curl http://localhost:3000/api/torrent/status/1091500
```

**Expected:**
```json
{
  "success": true,
  "download": {
    "id": "1091500",
    "gameName": "Cyberpunk 2077",
    "status": "downloading",
    "progress": 25.5,
    "speed": 8.5,
    "eta": 3600,
    "downloaded": 14.2,
    "total": 55.4
  }
}
```

---

## 5️⃣ INTEGRATE FRONTEND (Optional)

Thêm code từ [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) vào:
- [src/pages/Store.jsx](src/pages/Store.jsx) - Hiển thị game nổi tiếng
- [src/pages/GameDetail.jsx](src/pages/GameDetail.jsx) - Button download torrent

---

## 📚 DOCUMENTATION

| File | Nội dung |
|------|---------|
| [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) | Tóm tắt toàn bộ features |
| [TORRENT_SETUP_GUIDE.md](TORRENT_SETUP_GUIDE.md) | Chi tiết setup torrent |
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) | Code examples + tích hợp |

---

## 🎯 CHECKLIST

- [ ] Install dependency: `npm install extract-zip`
- [ ] Tạo folder: `C:\Games\Torrents`, `Installed`, `Torrents_DB`
- [ ] Tạo `games.json` với danh sách game
- [ ] Copy `.torrent` files vào `Torrents_DB/`
- [ ] Cập nhật `.env`
- [ ] Run `npm run dev`
- [ ] Test API (curl commands trên)
- [ ] (Optional) Integrate frontend code

---

## ⚡ QUICK API CALLS

### PowerShell (Windows):

```powershell
# Test 1: Most popular games
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/most-popular?limit=5" -Method Get
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3

# Test 2: Start download
$body = @{
    torrentPath = "C:\Games\Torrents_DB\cyberpunk_2077.torrent"
    gameId = "1091500"
    gameName = "Cyberpunk 2077"
    autoUnzip = $true
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/torrent/download" `
  -Method Post `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body

# Test 3: Check progress
Invoke-WebRequest -Uri "http://localhost:3000/api/torrent/status/1091500" -Method Get
```

---

## 🆘 TROUBLESHOOTING

### Error: "extract-zip not found"
```bash
npm install extract-zip
```

### Error: "TORRENT_DB_PATH not found"
```bash
# Kiểm tra .env
cat .env

# Nếu không có TORRENT_DB_PATH, thêm vào:
TORRENT_DB_PATH=C:\Games\Torrents_DB
```

### Error: "Torrent file not found"
```bash
# Kiểm tra file .torrent tồn tại
ls C:\Games\Torrents_DB\*.torrent

# Hoặc cập nhật games.json với đường dẫn đúng
```

### Download chậm?
```javascript
// Cập nhật config/torrentConfig.js:
maxConnections: 100    // Increase từ 50
maxPeers: 50          // Increase từ 30
```

---

## 📞 SUPPORT

1. Check logs: `npm run dev` → xem console output
2. Check `.env` configuration
3. Check folder permissions (có quyền ghi vào C:\Games không?)
4. Check network (Internet ổn định?)
5. Check torrent file (File .torrent có valid không?)

---

**Bạn đã sẵn sàng! 🚀**

Bắt đầu test API đi!

