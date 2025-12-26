# 🎮 Hướng Dẫn Test End-to-End: Game Download Flow

**Mục đích**: Test toàn bộ flow từ tìm game → download → auto-unzip trong launcher

## 📋 Yêu Cầu Ban Đầu

✅ **Đã có sẵn**:
- Torrent file: `torrent file game/Need for Speed Heat.torrent` (252KB)
- Backend routes đã integrate vào server.js
- WebTorrent module fixed (ESM compatible)
- Torrent database route `/api/torrent-db/add`

## 🔧 Setup Trước Test

### 1. Tạo Folder Structure

```powershell
# Mở PowerShell và chạy:
mkdir C:\Games\Torrents
mkdir C:\Games\Installed
mkdir C:\Games\Torrents_DB
```

### 2. Tạo File .env (nếu chưa có)

```
GAMES_PATH=C:\Games
TORRENT_DB_PATH=C:\Games\Torrents_DB
STEAM_API_KEY=your_key_here
```

### 3. Khởi Động Backend

```bash
# Terminal 1
npm run dev

# Chờ khi thấy "✅ Server running on port 3000"
```

## 🧪 Test Steps

### Step 1: Verify Backend API hoạt động

```bash
# Terminal 2 (tùy chọn)
curl http://localhost:3000/api/torrent-db/all

# Nếu thành công sẽ return: { success: true, games: [] }
```

### Step 2: Add Game tới Torrent Database

```bash
curl -X POST http://localhost:3000/api/torrent-db/add \
  -H "Content-Type: application/json" \
  -d '{
    "appId": 1398620,
    "name": "Need for Speed Heat",
    "torrentFile": "Need for Speed Heat.torrent",
    "hasDenuvo": true,
    "year": 2019
  }'

# Response: { success: true, game: { ... } }
```

### Step 3: Verify Game được Add

```bash
curl http://localhost:3000/api/torrent-db/all

# Sẽ thấy game vừa add trong danh sách
```

### Step 4: Check Game Detail API

```bash
curl http://localhost:3000/api/torrent-db/game/1398620

# Return game info + torrent file path
```

### Step 5: Test Download API

```bash
# POST request để start download
curl -X POST http://localhost:3000/api/torrent/download \
  -H "Content-Type: application/json" \
  -d '{
    "torrentPath": "e:\\Tạo app backend nè\\Tạo app backend\\torrent file game\\Need for Speed Heat.torrent",
    "gameId": 1398620,
    "gameName": "Need for Speed Heat",
    "downloadPath": "C:\\Games\\Torrents",
    "autoUnzip": true
  }'

# Response: { success: true, downloadId: "uuid", message: "Download started" }
```

### Step 6: Track Download Progress

```bash
# Lấy download ID từ response trên (ví dụ: "12345-abc")
curl http://localhost:3000/api/torrent/status/12345-abc

# Response: 
# {
#   "downloadId": "12345-abc",
#   "gameName": "Need for Speed Heat",
#   "status": "downloading",
#   "progress": 0.25,           # 25%
#   "speed": 5242880,           # 5 MB/s
#   "eta": 120,                 # 120 seconds
#   "downloaded": 104857600,    # 100 MB
#   "total": 419430400          # 400 MB
# }
```

### Step 7: Monitor Download Completion

```bash
# Chạy script test để simulate full flow
node test-torrent-flow.js

# Hoặc monitor thủ công mỗi 2 giây:
# (Windows PowerShell)
while($true) {
  curl http://localhost:3000/api/torrent/status/12345-abc;
  Start-Sleep -Seconds 2;
}
```

## 🚀 Frontend Integration (Game Detail)

Sau khi test API thành công, integrate vào GameDetail.jsx:

```jsx
// GameDetail.jsx

import { useState, useEffect } from 'react';

export default function GameDetail({ gameId }) {
  const [downloadId, setDownloadId] = useState(null);
  const [downloadPath, setDownloadPath] = useState('C:\\Games\\Torrents');
  const [progress, setProgress] = useState(null);

  // Step 1: Fetch game detail (including torrent info)
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await fetch(`/api/torrent-db/game/${gameId}`);
        const game = await res.json();
        console.log('Game loaded:', game);
        // game.torrentFile = "Need for Speed Heat.torrent"
      } catch (err) {
        console.error('Error loading game:', err);
      }
    };
    fetchGame();
  }, [gameId]);

  // Step 2: Handle download button click
  const handleDownload = async () => {
    try {
      const response = await fetch('/api/torrent/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          torrentPath: `e:\\Tạo app backend nè\\Tạo app backend\\torrent file game\\${torrentFileName}`,
          gameId: gameId,
          gameName: gameName,
          downloadPath: downloadPath,
          autoUnzip: true
        })
      });

      const data = await response.json();
      setDownloadId(data.downloadId);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  // Step 3: Track progress real-time
  useEffect(() => {
    if (!downloadId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/torrent/status/${downloadId}`);
        const status = await res.json();
        setProgress(status);

        if (status.status === 'completed') {
          console.log('✅ Download complete!');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error tracking progress:', err);
      }
    }, 1000); // Update mỗi 1 giây

    return () => clearInterval(interval);
  }, [downloadId]);

  // Step 4: Render Download UI
  return (
    <div className="game-detail">
      {/* Game info */}
      <h1>{gameName}</h1>

      {/* Download button */}
      {!downloadId && (
        <button onClick={handleDownload} className="btn-download">
          📥 Download (Torrent)
        </button>
      )}

      {/* Progress bar */}
      {downloadId && progress && (
        <div className="download-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress.progress * 100}%` }}
            />
          </div>
          <p>
            {(progress.progress * 100).toFixed(1)}% 
            ({(progress.downloaded / 1024 / 1024).toFixed(0)}MB / {(progress.total / 1024 / 1024).toFixed(0)}MB)
          </p>
          <p>
            Speed: {(progress.speed / 1024 / 1024).toFixed(2)} MB/s
            | ETA: {Math.floor(progress.eta / 60)}m {Math.floor(progress.eta % 60)}s
          </p>
          {progress.status === 'completed' && (
            <p className="success">✅ Download complete! Game ready to play.</p>
          )}
        </div>
      )}
    </div>
  );
}
```

## 📱 UI Components cần tạo

### 1. TorrentDownloadButton.jsx
```jsx
// components/TorrentDownloadButton.jsx
export default function TorrentDownloadButton({ gameId, gameName, torrentFile }) {
  const [showDialog, setShowDialog] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowDialog(true)}>
        📥 Download (Torrent)
      </button>
      
      {showDialog && (
        <DownloadDialog 
          gameId={gameId}
          gameName={gameName}
          torrentFile={torrentFile}
          onClose={() => setShowDialog(false)}
        />
      )}
    </>
  );
}
```

### 2. DownloadDialog.jsx
```jsx
// components/DownloadDialog.jsx
export default function DownloadDialog({ gameName, onClose }) {
  const [downloadPath, setDownloadPath] = useState('C:\\Games\\Torrents');
  
  return (
    <dialog open>
      <h2>Download {gameName}</h2>
      
      <label>
        Download location:
        <input 
          type="text" 
          value={downloadPath}
          onChange={(e) => setDownloadPath(e.target.value)}
        />
      </label>
      
      <button onClick={startDownload}>Start Download</button>
      <button onClick={onClose}>Cancel</button>
    </dialog>
  );
}
```

### 3. TorrentProgressBar.jsx
```jsx
// components/TorrentProgressBar.jsx
export default function TorrentProgressBar({ progress }) {
  if (!progress) return null;
  
  return (
    <div className="torrent-progress">
      <h3>Downloading {progress.gameName}</h3>
      
      <div className="progress-bar">
        <div 
          className="fill"
          style={{ width: `${progress.progress * 100}%` }}
        />
      </div>
      
      <div className="stats">
        <span>{(progress.progress * 100).toFixed(1)}%</span>
        <span>{(progress.speed / 1024 / 1024).toFixed(2)} MB/s</span>
        <span>ETA: {Math.floor(progress.eta / 60)}m</span>
      </div>
      
      {progress.status === 'unzipping' && <p>Extracting files...</p>}
      {progress.status === 'completed' && <p className="success">✅ Complete!</p>}
    </div>
  );
}
```

## 🔍 Debugging

### Nếu download không start:
```bash
# 1. Check server logs
npm run dev

# 2. Verify torrent file path đúng
dir "e:\Tạo app backend nè\Tạo app backend\torrent file game"

# 3. Check download folder exists
mkdir C:\Games\Torrents
```

### Nếu progress không update:
```bash
# Check status endpoint
curl http://localhost:3000/api/torrent/status/YOUR_DOWNLOAD_ID

# Nếu 404, download đã finish hoặc ID sai
```

### Nếu WebTorrent error:
```bash
# Restart server
npm run dev

# Check logs cho "✅ WebTorrent module loaded"
```

## 📊 Expected Flow in Launcher

```
1. User opens Store
   ↓
2. Searches "Need for Speed Heat"
   ↓ GET /api/search?query=Need%20for%20Speed%20Heat
3. Clicks game card
   ↓
4. GameDetail page opens
   ↓ GET /api/torrent-db/game/1398620
5. Sees "Download (Torrent)" button
   ↓
6. Clicks button → Download Dialog appears
   ↓
7. Selects drive (C:) → Clicks "Download"
   ↓ POST /api/torrent/download
8. Returns downloadId
   ↓
9. TorrentProgressBar renders
   ↓ GET /api/torrent/status/{downloadId} (every 1s)
10. Shows progress 0% → 100%
    ↓
11. Auto-unzip starts
    ↓
12. ✅ Game ready in C:\Games\Torrents\Need for Speed Heat\
    ↓
13. Show "Open Folder" / "Play Game" button
```

## ✅ Checklist

- [ ] Backend routes compile without errors
- [ ] `/api/torrent-db/add` works
- [ ] `/api/torrent/download` starts download
- [ ] `/api/torrent/status/{id}` returns progress
- [ ] TorrentDownloadManager initializes successfully
- [ ] WebTorrent connects to DHT/trackers
- [ ] Download progress increases over time
- [ ] Auto-unzip extracts files correctly
- [ ] Frontend GameDetail.jsx integrated
- [ ] Download button visible in UI
- [ ] Progress bar updates in real-time
- [ ] Completion message shows

## 🎬 Next Step

Sau khi test xong, integrate các component vào:
1. `src/pages/Store.jsx` - Add search result
2. `src/pages/GameDetail.jsx` - Add download section
3. `src/components/` - Add TorrentProgressBar

Hãy run `node test-torrent-flow.js` đã!
