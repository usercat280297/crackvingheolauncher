# 🎮 SETUP GUIDE - Torrent Download System

## 📋 Mục Lục
1. [Folder Structure](#folder-structure)
2. [Environment Configuration](#environment-configuration)
3. [Torrent Files Setup](#torrent-files-setup)
4. [API Usage Examples](#api-usage-examples)
5. [Troubleshooting](#troubleshooting)
6. [Performance Optimization](#performance-optimization)

---

## 📁 Folder Structure

### Recommended Directory Layout

```
C:\
├── Games\                          # Base games directory
│   ├── Torrents\                   # Torrent downloads (extracted files)
│   │   ├── Cyberpunk 2077\
│   │   │   ├── game\
│   │   │   ├── bin\
│   │   │   └── data\
│   │   ├── Elden Ring\
│   │   ├── GTA 6\
│   │   └── ...
│   │
│   ├── TorrentMetadata\            # Torrent files (.torrent files)
│   │   ├── cyberpunk2077.torrent
│   │   ├── eldenring.torrent
│   │   └── ...
│   │
│   └── Cache\                      # Game cache & temp files
│       └── Images\
│
└── AppData\Roaming\
    └── CrackVinheo\                # App config
        ├── settings.json
        └── user_data.json
```

### Create Folders

```bash
# PowerShell
New-Item -ItemType Directory -Path "C:\Games\Torrents" -Force
New-Item -ItemType Directory -Path "C:\Games\TorrentMetadata" -Force
New-Item -ItemType Directory -Path "C:\Games\Cache\Images" -Force
```

---

## ⚙️ Environment Configuration

### .env Setup

Create `.env` file in project root:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/game-launcher
MONGODB_USER=
MONGODB_PASS=

# API
API_PORT=3000
NODE_ENV=production

# Steam API
STEAM_API_KEY=your_steam_api_key
STEAMDB_API_KEY=your_steamdb_key

# Paths (Windows)
GAMES_PATH=C:\Games
TORRENTS_PATH=C:\Games\Torrents
TORRENT_METADATA_PATH=C:\Games\TorrentMetadata

# Torrent Settings
TORRENT_MAX_CONNECTIONS=100
TORRENT_MAX_PEERS=60
TORRENT_UPLOAD_SPEED=-1
TORRENT_DOWNLOAD_SPEED=-1

# Cache Settings
IMAGE_CACHE_ENABLED=true
IMAGE_CACHE_TTL=604800000

# OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_secret

# Features
AUTO_UNZIP_ENABLED=true
BACKGROUND_SYNC_ENABLED=true
BACKGROUND_SYNC_INTERVAL=3600000
```

---

## 🎬 Torrent Files Setup

### Where to Store Torrent Files

**Location**: `C:\Games\TorrentMetadata\`

Torrent files should be placed here and referenced in download requests.

### Naming Convention

```
Format: [GameName]_[Platform]_[Language].torrent

Examples:
- Cyberpunk2077_Windows_EN.torrent
- EldenRing_Windows_EN.torrent
- GTA6_Windows_EN.torrent
- Starfield_Windows_EN.torrent
```

### Creating Torrent Files from Game Files

For developers: Use `createtorrent-cli` or `transmission-cli`:

```bash
# Install torrent creation tool
npm install -g create-torrent

# Create torrent from folder
create-torrent "C:\Games\Torrents\GameFolder" -o "C:\Games\TorrentMetadata\game.torrent"
```

---

## 📡 API Usage Examples

### 1. Start Download

```bash
# Start torrent download
curl -X POST http://localhost:3000/api/torrent/download \
  -H "Content-Type: application/json" \
  -d '{
    "torrentPath": "C:\\Games\\TorrentMetadata\\cyberpunk2077.torrent",
    "gameId": "1091500",
    "gameName": "Cyberpunk 2077",
    "outputPath": "C:\\Games\\Torrents\\Cyberpunk 2077",
    "autoUnzip": true
  }'

# Response:
{
  "success": true,
  "downloadId": "1091500",
  "message": "Started downloading Cyberpunk 2077",
  "download": {
    "id": "1091500",
    "gameName": "Cyberpunk 2077",
    "status": "downloading",
    "outputPath": "C:\\Games\\Torrents\\Cyberpunk 2077",
    "autoUnzip": true
  }
}
```

### 2. Check Download Status

```bash
curl http://localhost:3000/api/torrent/status/1091500

# Response:
{
  "success": true,
  "download": {
    "id": "1091500",
    "gameName": "Cyberpunk 2077",
    "status": "downloading",
    "progress": 45.5,
    "speed": 25.3,          // MB/s
    "eta": 3600,           // seconds
    "downloaded": 22.5,    // GB
    "total": 50.0,        // GB
    "startTime": "2025-12-25T10:30:00Z",
    "timeElapsed": 900,    // seconds
    "timeRemaining": 3600,
    "averageSpeed": 90.0,  // MB/h
    "autoUnzip": true,
    "outputPath": "C:\\Games\\Torrents\\Cyberpunk 2077",
    "error": null
  }
}
```

### 3. Pause Download

```bash
curl -X POST http://localhost:3000/api/torrent/pause/1091500

# Response:
{
  "success": true,
  "message": "Paused: Cyberpunk 2077",
  "downloadId": "1091500"
}
```

### 4. Resume Download

```bash
curl -X POST http://localhost:3000/api/torrent/resume/1091500
```

### 5. Cancel Download

```bash
curl -X POST http://localhost:3000/api/torrent/cancel/1091500
```

### 6. Get All Downloads

```bash
curl http://localhost:3000/api/torrent/all

# Response:
{
  "success": true,
  "count": 3,
  "downloads": [
    {
      "id": "1091500",
      "gameName": "Cyberpunk 2077",
      "status": "downloading",
      "progress": 45.5,
      "speed": 25.3,
      "eta": 3600,
      "downloaded": 22.5,
      "total": 50.0,
      "startTime": "2025-12-25T10:30:00Z",
      "timeElapsed": 900
    }
  ]
}
```

### 7. Get Torrent Statistics

```bash
curl http://localhost:3000/api/torrent/stats

# Response:
{
  "success": true,
  "stats": {
    "total": 5,
    "downloading": 2,
    "paused": 1,
    "completed": 2,
    "failed": 0,
    "totalSpeed": 45.6,      // MB/s
    "totalDownloaded": 100.5, // GB
    "totalSize": 250.0,      // GB
    "totalProgress": 40.2    // %
  }
}
```

### 8. Popular Games API

```bash
# Get popular/trending games
curl "http://localhost:3000/api/popular-games?limit=20&page=1"

# Get only Denuvo games
curl "http://localhost:3000/api/popular-games/denuvo?limit=10"

# Get trending games
curl "http://localhost:3000/api/popular-games/trending?limit=10"

# Get top rated games
curl "http://localhost:3000/api/popular-games/top-rated?limit=10"

# Get featured games (for homepage)
curl "http://localhost:3000/api/popular-games/featured"
```

---

## 🧪 Troubleshooting

### Problem: Download speed is slow

**Solution**: Check torrent config optimization:

```javascript
// In config/torrentConfig.js, use fastMode
fastMode: {
  maxConnections: 150,
  maxPeers: 100,
  requestPipeline: 32,
  blockSize: 32768,
  chunkSize: 512 * 1024,
  pieceSelection: 'rarest-first'
}
```

### Problem: Files not unzipping automatically

**Solution**: Check auto-unzip is enabled:

```bash
# In .env
AUTO_UNZIP_ENABLED=true

# In download request
"autoUnzip": true
```

### Problem: WebSocket not broadcasting progress

**Solution**: Ensure global.io is initialized in server.js:

```javascript
const socketIO = require('socket.io');
const io = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
global.io = io;
```

### Problem: Torrent file not found

**Solution**: Check torrent file path:

```bash
# Verify torrent file exists
Test-Path "C:\Games\TorrentMetadata\cyberpunk2077.torrent"

# Use full path in API request
"torrentPath": "C:\\Games\\TorrentMetadata\\cyberpunk2077.torrent"
```

---

## 🚀 Performance Optimization

### For Fast Download (128KB Files)

1. **Increase peer connections**:
```javascript
maxConnections: 150,
maxPeers: 100
```

2. **Use larger block size**:
```javascript
blockSize: 32768 // 32KB instead of 16KB
```

3. **Optimize piece selection**:
```javascript
pieceSelection: 'rarest-first'
```

4. **Increase memory buffer**:
```javascript
memoryBuffer: 4 * 1024 * 1024 // 4MB buffer
chunkSize: 512 * 1024 // 512KB chunks
```

### Network Optimization

1. **Use multiple trackers**:
   - OpenWebTorrent
   - BTorrent
   - Demonii
   - TorrentEU

2. **Enable DHT & PEX**:
```javascript
dht: true,
pex: true
```

3. **Enable UPnP** for port mapping:
```javascript
upnp: true,
natTraversal: true
```

### Disk Optimization

1. **Use SSD for downloads**:
   - Faster I/O operations
   - Better throughput

2. **Enable compression**:
   - Reduce disk space usage
   - Trade CPU for disk I/O

3. **Monitor disk space**:
   - Ensure at least 100GB free
   - Pause if disk is nearly full

---

## 📊 Monitoring & Logging

### Enable Detailed Logging

```javascript
// In server.js
if (process.env.DEBUG_TORRENT) {
  torrentManager.on('download-progress', (data) => {
    console.log(`[TORRENT] ${data.id}: ${data.progress.toFixed(2)}% @ ${data.speed.toFixed(2)} MB/s`);
  });
}
```

### Check Torrent Manager Status

```bash
# Restart in debug mode
DEBUG_TORRENT=true npm run dev:server
```

---

## 🎯 Best Practices

1. **Always use full paths** for torrent files
2. **Enable auto-unzip** for better UX
3. **Monitor disk space** before large downloads
4. **Use fastMode** for optimal speed
5. **Enable background image cache sync** for better UI
6. **Keep torrents organized** in TorrentMetadata folder
7. **Implement download pause/resume** in frontend
8. **Show real-time progress** via WebSocket
9. **Log errors** for debugging
10. **Test with small torrent** before production

---

## 📚 Additional Resources

- **WebTorrent Docs**: https://webtorrent.io/
- **BitTorrent Protocol**: https://www.bittorrent.org/
- **SteamGridDB**: https://www.steamgriddb.com/
- **MongoDB**: https://www.mongodb.com/

---

## ✅ Checklist

- [ ] Created folder structure
- [ ] Configured .env file
- [ ] Placed torrent files in metadata folder
- [ ] Tested API endpoints
- [ ] Verified WebSocket connection
- [ ] Checked image cache working
- [ ] Confirmed auto-unzip enabled
- [ ] Monitored download performance
- [ ] Enabled background sync
- [ ] Documented custom paths

---

## 📞 Support

For issues or questions:
1. Check logs in `console`
2. Verify .env configuration
3. Check folder permissions
4. Ensure MongoDB is running
5. Restart the application

Good luck! 🚀
