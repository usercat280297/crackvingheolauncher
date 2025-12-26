# ⚡ QUICK TORRENT SETUP - 3 STEPS

> Fast game installation for 43,000 community members

---

## ✅ WHAT YOU HAVE

- ✅ Torrent downloader ready
- ✅ Auto-unzip system ready
- ✅ WebSocket progress tracking ready
- ✅ Resume/pause/cancel support ready
- ✅ API endpoints ready

**Just add your torrent files!**

---

## 🎬 SETUP IN 3 STEPS

### **STEP 1: Prepare Torrent Files** (5 minutes)

Create folder for torrent files:
```bash
mkdir "C:\Games\Torrents"
```

Move your .torrent files there:
```
C:\Games\Torrents\
├── black-myth-wukong.torrent
├── dragons-dogma-2.torrent
├── street-fighter-6.torrent
└── ... more torrents
```

### **STEP 2: Update Game Database** (5 minutes)

Add torrent info to each game:

```javascript
// In your games database
{
  appId: 2358720,
  name: "Black Myth: Wukong",
  torrentPath: "C:\\Games\\Torrents\\black-myth-wukong.torrent",
  size: "130 GB",
  seeders: 2500,  // From torrent site
  leechers: 1200
}
```

### **STEP 3: Add Download Button to UI** (10 minutes)

```jsx
import { useState } from 'react';

export function GameCard({ game }) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const downloadGame = async () => {
    setDownloading(true);
    
    const res = await fetch('/api/torrent/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        torrentPath: game.torrentPath,
        gameName: game.name,
        outputPath: `C:\\Games\\${game.name}`
      })
    });

    const data = await res.json();
    const downloadId = data.downloadId;

    // Connect WebSocket for progress
    const socket = io();
    socket.on('torrent:progress', (event) => {
      if (event.downloadId === downloadId) {
        setProgress(event.progress);
      }
    });

    socket.on('torrent:complete', (event) => {
      if (event.downloadId === downloadId) {
        setDownloading(false);
        alert(`${game.name} ready to install!`);
      }
    });
  };

  return (
    <div className="game-card">
      <img src={game.image} alt={game.name} />
      <h3>{game.name}</h3>
      
      {downloading ? (
        <div className="progress-bar">
          <div style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      ) : (
        <button onClick={downloadGame}>
          📥 Download {game.size}
        </button>
      )}
    </div>
  );
}
```

---

## 🧪 TEST IT

### Test Download API
```bash
# Start download
curl -X POST http://localhost:3000/api/torrent/download \
  -H "Content-Type: application/json" \
  -d '{
    "torrentPath": "C:\\Games\\Torrents\\black-myth-wukong.torrent",
    "gameName": "Black Myth: Wukong",
    "outputPath": "C:\\Games\\Downloaded"
  }'

# Get progress
curl http://localhost:3000/api/torrent/progress/download_ID

# Pause
curl -X POST http://localhost:3000/api/torrent/download/download_ID/pause

# Resume
curl -X POST http://localhost:3000/api/torrent/download/download_ID/resume
```

---

## 📊 KEY ENDPOINTS

| Endpoint | Method | What it does |
|----------|--------|-------------|
| `/api/torrent/download` | POST | Start new download |
| `/api/torrent/progress/:id` | GET | Get current progress |
| `/api/torrent/download/:id/pause` | POST | Pause download |
| `/api/torrent/download/:id/resume` | POST | Resume download |
| `/api/torrent/download/:id/cancel` | POST | Cancel download |
| `/api/torrent/list` | GET | List all torrents |
| `/api/torrent/stats` | GET | Get statistics |

---

## 🎯 USER EXPERIENCE

```
Game Page
    ↓
User clicks "Download"
    ↓
Download starts
    ↓
Progress bar shows: 🔄 45% (2.5 MB/s, 10 min left)
    ↓
Can pause/resume while downloading
    ↓
File auto-extracts when done
    ↓
Notification: "Ready to Install!" ✅
    ↓
User launches game
```

---

## ⚙️ CONFIGURATION

### Edit Download Path
**File**: `.env`
```
GAMES_PATH=D:\Games\Downloads
```

### Edit Performance
**File**: `config/torrentConfig.js`
```javascript
maxConnections: 100      // More = faster
maxPeers: 60             // More = faster
requestTimeout: 3000     // Lower = quicker disconnect
uploadSpeed: -1          // -1 = unlimited
downloadSpeed: -1        // -1 = unlimited
```

---

## 📱 WEBSOCKET EVENTS

Real-time updates to frontend:

```javascript
// Progress (every 1 second)
socket.on('torrent:progress', (data) => {
  console.log(`${data.progress}% - ${data.speed}`);
});

// Completed
socket.on('torrent:complete', (data) => {
  console.log('Download done! Extracting...');
});

// Unzip progress
socket.on('torrent:unzip-progress', (data) => {
  console.log(`Extracting: ${data.file}`);
});

// Unzip done
socket.on('torrent:unzip-complete', (data) => {
  console.log('Ready to install!');
});

// Error
socket.on('torrent:error', (data) => {
  console.error(`Download failed: ${data.error}`);
});
```

---

## 🚀 PERFORMANCE TIPS

**For Faster Downloads**:
1. Use torrents with 1000+ seeders
2. Increase `maxConnections` to 150
3. Increase `maxPeers` to 100
4. Enable upload sharing (helps torrent ecosystem)

**For Large Files**:
1. Set `downloadSpeed: 50000000` (50 MB/s limit, adjust as needed)
2. Use stable internet (not WiFi if possible)
3. Enable pause/resume for long downloads

**For Low Bandwidth**:
1. Download one game at a time
2. Reduce `maxPeers` to 20
3. Reduce `requestPipeline` to 5

---

## ✨ FEATURES YOU GET

✅ **Real-time Progress** - Users see % downloaded, speed, ETA  
✅ **Pause/Resume** - Stop and continue anytime  
✅ **Auto-Extract** - Files unzip automatically  
✅ **Error Recovery** - Resume failed downloads  
✅ **Multi-source** - DHT, trackers, PEX for speed  
✅ **Bandwidth Control** - Cap upload/download speeds  
✅ **Peer Selection** - Automatically picks fastest peers  

---

## 🎬 LIVE DEMO

### Start a download:
```bash
curl -X POST http://localhost:3000/api/torrent/download \
  -H "Content-Type: application/json" \
  -d '{
    "torrentPath": "path/to/torrent.torrent",
    "gameName": "Game Name",
    "outputPath": "C:\\Games\\Downloaded"
  }'
```

**Response**:
```json
{
  "success": true,
  "downloadId": "download_abc123",
  "gameName": "Game Name",
  "progress": 0,
  "message": "Download started"
}
```

### Check progress (repeat this):
```bash
curl http://localhost:3000/api/torrent/progress/download_abc123
```

**Response**:
```json
{
  "downloadId": "download_abc123",
  "progress": 15,
  "speed": "3.2 MB/s",
  "eta": "45 minutes",
  "downloaded": "1.5 GB",
  "total": "10 GB",
  "status": "downloading"
}
```

### When 100% complete:
```json
{
  "status": "extracting"  // Auto-unzip starting
}
```

### When extracted:
```json
{
  "status": "complete"    // Ready to install!
}
```

---

## 📞 NEXT STEPS

1. ✅ Place .torrent files in `C:\Games\Torrents\`
2. ✅ Add torrent paths to game database
3. ✅ Add download button to game cards
4. ✅ Test with one game first
5. ✅ Deploy to production

---

## 🎉 READY!

**Your users can now download games via torrent!**

```
High Speed ✅
Auto-Extract ✅
Real-time Progress ✅
Resume Support ✅
Error Recovery ✅
For 43k Members ✅
```

**Total Setup Time**: ~20 minutes

---

**Start here**: Add your .torrent files to `C:\Games\Torrents\`

Let me know when ready for next phase! 🚀
