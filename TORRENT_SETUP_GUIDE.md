# 🎮 HƯỚNG DẪN SETUP TORRENT CHO LAUNCHER

## 📋 Tổng Quan

Hệ thống torrent của bạn được cấu hình để download nhanh từ các file `.torrent` (cocccoc 128KB format).

---

## 📁 FOLDER STRUCTURE

### Cấu trúc khuyến nghị:

```
C:\Games\
├── Torrents/                    ← Nơi lưu torrents đang download
│   ├── Cyberpunk 2077/
│   │   ├── game/
│   │   │   ├── bin/
│   │   │   ├── data/
│   │   │   └── ...
│   │   └── Cyberpunk 2077.zip   (tự động unzip)
│   │
│   └── Elden Ring/
│       ├── game files...
│       └── Elden Ring.zip
│
├── Installed/                   ← Game đã cài (symlink hoặc copy)
│   ├── Cyberpunk 2077/
│   └── Elden Ring/
│
└── Torrents_DB/                 ← .torrent files + metadata
    ├── games.json               ← Danh sách game + torrent links
    ├── Cyberpunk 2077.torrent
    ├── Elden Ring.torrent
    └── ...
```

---

## ⚙️ SETUP BƯỚC-BƯỚC

### Bước 1: Tạo thư mục chính

```bash
# Windows
mkdir C:\Games
mkdir C:\Games\Torrents
mkdir C:\Games\Installed
mkdir C:\Games\Torrents_DB

# Hoặc qua PowerShell
New-Item -ItemType Directory -Path C:\Games\Torrents -Force
New-Item -ItemType Directory -Path C:\Games\Installed -Force
New-Item -ItemType Directory -Path C:\Games\Torrents_DB -Force
```

### Bước 2: Cấu hình biến môi trường (`.env`)

```env
# Backend
GAMES_PATH=C:\Games
TORRENT_DOWNLOAD_PATH=C:\Games\Torrents
TORRENT_INSTALLED_PATH=C:\Games\Installed
TORRENT_DB_PATH=C:\Games\Torrents_DB

# WebTorrent config
WEBTORRENT_MAX_CONNECTIONS=50
WEBTORRENT_MAX_PEERS=30
WEBTORRENT_UPLOAD_SPEED=-1
WEBTORRENT_DOWNLOAD_SPEED=-1
```

### Bước 3: Lưu file .torrent

Đặt các file `.torrent` của game vào `C:\Games\Torrents_DB\`:

```
C:\Games\Torrents_DB\
├── cyberpunk_2077.torrent
├── elden_ring.torrent
├── resident_evil_village.torrent
└── ...
```

### Bước 4: Tạo games.json (danh sách game + torrent)

Tạo file `C:\Games\Torrents_DB\games.json`:

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
      "isActive": true
    },
    {
      "id": 847370,
      "appId": 847370,
      "name": "Elden Ring",
      "torrentFile": "C:\\Games\\Torrents_DB\\elden_ring.torrent",
      "installPath": "C:\\Games\\Installed\\Elden Ring",
      "hasDenuvo": true,
      "isActive": true
    },
    {
      "id": 1391110,
      "appId": 1391110,
      "name": "Resident Evil Village",
      "torrentFile": "C:\\Games\\Torrents_DB\\resident_evil_village.torrent",
      "installPath": "C:\\Games\\Installed\\Resident Evil Village",
      "hasDenuvo": true,
      "isActive": true
    }
  ]
}
```

---

## 🚀 SỬ DỤNG API DOWNLOAD

### 1️⃣ Bắt đầu Download

```bash
curl -X POST http://localhost:3000/api/torrent/download \
  -H "Content-Type: application/json" \
  -d '{
    "torrentPath": "C:\\Games\\Torrents_DB\\cyberpunk_2077.torrent",
    "gameId": "1091500",
    "gameName": "Cyberpunk 2077",
    "outputPath": "C:\\Games\\Torrents\\Cyberpunk 2077",
    "autoUnzip": true
  }'
```

**Response:**
```json
{
  "success": true,
  "downloadId": "1091500",
  "message": "Started downloading Cyberpunk 2077",
  "download": {
    "id": "1091500",
    "gameName": "Cyberpunk 2077",
    "status": "downloading",
    "outputPath": "C:\\Games\\Torrents\\Cyberpunk 2077"
  }
}
```

### 2️⃣ Theo Dõi Progress

```bash
curl http://localhost:3000/api/torrent/status/1091500
```

**Response:**
```json
{
  "success": true,
  "download": {
    "id": "1091500",
    "gameName": "Cyberpunk 2077",
    "status": "downloading",
    "progress": 45.67,
    "speed": 8.5,
    "eta": 3600,
    "downloaded": 25.3,
    "total": 55.4,
    "startTime": "2025-01-15T10:30:00Z",
    "timeElapsed": 1800
  }
}
```

### 3️⃣ Tất cả Downloads

```bash
curl http://localhost:3000/api/torrent/all
```

### 4️⃣ Pause/Resume/Cancel

```bash
# Pause
curl -X POST http://localhost:3000/api/torrent/pause/1091500

# Resume
curl -X POST http://localhost:3000/api/torrent/resume/1091500

# Cancel
curl -X POST http://localhost:3000/api/torrent/cancel/1091500
```

---

## 🔧 CẤU HÌNH TORRENT OPTIMIZATION

File: `config/torrentConfig.js`

### Điều chỉnh cho tốc độ cao:

```javascript
// Để tốc độ cao nhất:
maxConnections: 100,      // Nhiều kết nối
maxPeers: 50,             // Nhiều peers
uploadSpeed: -1,          // Upload unlimited
downloadSpeed: -1,        // Download unlimited

// Cho network yếu:
maxConnections: 20,
maxPeers: 15,
uploadSpeed: 1024 * 1024, // 1 MB/s
downloadSpeed: 5 * 1024 * 1024 // 5 MB/s
```

---

## 📊 EXPECTED SPEEDS

### Với cocccoc 128KB format:

| Scenario | Speed | ETA (50GB) |
|----------|-------|-----------|
| Seeders tốt (100+) | 5-10 MB/s | 1-2 giờ |
| Seeders vừa (20-50) | 2-5 MB/s | 3-7 giờ |
| Seeders ít (<20) | 0.5-2 MB/s | 7-24 giờ |
| Network yếu | < 0.5 MB/s | 24+ giờ |

---

## 🎯 BEST PRACTICES

### 1️⃣ Quản lý file .torrent

```bash
# Giữ file .torrent sau khi download
# → Có thể resume nếu bị gián đoạn
# → Seeders cho cộng đồng

# Xóa .torrent nếu đã hoàn thành + seeders không cần
del C:\Games\Torrents_DB\cyberpunk_2077.torrent
```

### 2️⃣ Auto-unzip

Launcher sẽ tự động:
1. Detect file `.zip` trong thư mục
2. Extract vào cùng thư mục
3. Xóa file `.zip` sau extract

→ **User không phải manual unzip!** ✅

### 3️⃣ Resume downloads

Nếu internet bị gián đoạn:
1. Launcher detect incomplete download
2. Tự động resume (POST `/api/torrent/resume/{id}`)
3. Không phải download lại từ đầu

### 4️⃣ Monitor disk space

```powershell
# Check disk space
Get-Volume C: | Select-Object SizeRemaining

# Dù vậy, có thể set warning:
# Nếu C: < 20GB → Hỏi user xóa game
# Nếu C: < 5GB → Dừng download
```

---

## 🔗 INTEGRATION VỚI GAMEDETAIL

### Trong `GameDetail.jsx`:

```jsx
// Khi user click "Install/Download"
const handleInstallGame = async (gameId, gameName) => {
  try {
    // 1. Fetch torrent path từ backend
    const torrentResponse = await fetch(
      `/api/games/${gameId}/torrent-info`
    );
    const { torrentPath } = await torrentResponse.json();

    // 2. Bắt đầu download
    const downloadResponse = await fetch(
      'http://localhost:3000/api/torrent/download',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          torrentPath,
          gameId,
          gameName,
          autoUnzip: true
        })
      }
    );

    const { downloadId } = await downloadResponse.json();

    // 3. Track progress
    const interval = setInterval(async () => {
      const statusResponse = await fetch(
        `/api/torrent/status/${downloadId}`
      );
      const { download } = await statusResponse.json();
      
      // Update UI với progress
      setDownloadProgress({
        progress: download.progress,
        speed: `${download.speed} MB/s`,
        eta: formatTime(download.eta)
      });

      if (download.status === 'ready') {
        clearInterval(interval);
        showNotification('✅ Game cài xong!');
      }
    }, 1000);
  } catch (error) {
    showError('Download failed: ' + error.message);
  }
};
```

---

## 🛠️ TROUBLESHOOTING

### Download chậm?

1. **Check seeders**: Có đủ seeders không?
   ```bash
   curl http://localhost:3000/api/torrent/status/{id}
   # Xem speed field
   ```

2. **Check connection**: Network bình thường không?
   ```bash
   ping google.com
   speedtest.net
   ```

3. **Increase connections**:
   ```javascript
   // config/torrentConfig.js
   maxConnections: 100,
   maxPeers: 50
   ```

### File không unzip?

1. **Check log**: Xem có error không
2. **Manual unzip**: 
   ```bash
   # Windows
   Expand-Archive "path\to\file.zip" -DestinationPath "path\to\output"
   ```

### Download bị interrupt?

- Launcher sẽ tự resume nếu được
- Hoặc user click Resume button

### Disk space đầy?

- Launcher detect tự động
- Hỏi user: "Delete old games?" hoặc "Change download path?"

---

## 📞 SUPPORT

Nếu gặp vấn đề:

1. Check logs: `npm run dev` → xem console
2. Check `.env`: Các đường dẫn có đúng không?
3. Check disk space: `C:\Games\Torrents` còn chỗ không?
4. Check network: Internet ổn định không?
5. Check torrent file: File `.torrent` có đúng không?

---

## 🎊 KẾT QUẢ CUỐI CÙNG

Sau khi setup xong:

✅ User click "Install"
✅ Game download từ torrent
✅ Auto-unzip nếu cần
✅ Game ready to play
✅ Resume support nếu bị interrupt

**Total time**: 1-24 giờ (tùy tốc độ internet + seeders)

---

**Happy gaming! 🎮**
