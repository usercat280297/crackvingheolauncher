# 🚀 Complete Game Download Implementation Guide

**Tình huống**: Bạn có file `.torrent` cho game "Need for Speed Heat" và muốn user có thể tải game từ launcher bằng cách:
1. Tìm game trong Store
2. Vào trang chi tiết game (Game Detail)
3. Bấm nút "Download (Torrent)"
4. Chọn ổ cứng để tải
5. Xem progress real-time
6. Game được tải và giải nén tự động

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     GAME LAUNCHER                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Store.jsx]  ←  User searches game                    │
│        ↓                                                │
│  [GameDetail.jsx]  ←  User clicks game card            │
│        ↓                                                │
│  [Download Dialog]  ←  User clicks "Download" button   │
│        ↓                                                │
│  [TorrentProgressBar]  ←  Download status updates      │
│        ↓                                                │
│  [Auto-unzip + Ready]  ←  Game extracted in C:\Games   │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  GET /api/search?query=...                                │
│     ↓ Returns games matching search                        │
│                                                            │
│  GET /api/torrent-db/game/{appId}                          │
│     ↓ Returns game with torrent file info                  │
│                                                            │
│  POST /api/torrent/download                               │
│     ↓ TorrentDownloadManager starts WebTorrent client     │
│     ↓ Returns downloadId for tracking                      │
│                                                            │
│  GET /api/torrent/status/{downloadId}                      │
│     ↓ Real-time progress (called every 1s)                │
│     ↓ Returns: progress%, speed, ETA, files extracted     │
│                                                            │
│  WebTorrent Client                                         │
│     ↓ Connects to DHT/trackers to download files          │
│     ↓ On complete: extract-zip automatically extracts     │
│     ↓ Files saved to C:\Games\Torrents\...                │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              FILE SYSTEM (Local PC)                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  e:\Tạo app backend nè\Tạo app backend\                │
│    └─ torrent file game\                               │
│       └─ Need for Speed Heat.torrent                   │
│                                                         │
│  C:\Games\Torrents_DB\                                 │
│    └─ games.json  ← Database with game + torrent info  │
│                                                         │
│  C:\Games\Torrents\                                    │
│    └─ Need for Speed Heat\                             │
│       └─ [extracted game files]                        │
│                                                         │
│  C:\Games\Installed\  ← For shortcuts/installed games  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Setup Checklist

- [x] Created `/api/torrent-db/add` endpoint
- [x] Created `/api/torrent-db/game/{appId}` endpoint
- [x] Created `/api/torrent/download` endpoint
- [x] Created `/api/torrent/status/{downloadId}` endpoint
- [x] WebTorrent + extract-zip dependencies installed
- [x] Environment variables added to .env
- [x] Folder structure created (C:\Games\*)
- [x] games.json database initialized
- [x] Fixed WebTorrent ESM import issue
- [ ] Frontend components created (TODO)
- [ ] Backend + Frontend connected (TODO)

---

## 🔄 Complete Flow Step-by-Step

### Step 1: Backend Routes Registration

**File**: `server.js`

```javascript
// Already added:
const torrentDownloadRouter = require('./routes/torrentDownload');
const torrentDBRouter = require('./routes/torrentDB');

app.use('/api/torrent', torrentDownloadRouter);
app.use('/api/torrent-db', torrentDBRouter);
```

✅ **Status**: Already integrated

---

### Step 2: Initialize Game in Database

You can add game to database via API:

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
```

This creates entry in `C:\Games\Torrents_DB\games.json`:
```json
{
  "id": "12345...",
  "appId": 1398620,
  "name": "Need for Speed Heat",
  "torrentFile": "Need for Speed Heat.torrent",
  "installPath": null,
  "hasDenuvo": true,
  "year": 2019,
  "addedAt": "2025-12-25T..."
}
```

---

### Step 3: User Finds Game in Store

**Component**: `Store.jsx` (needs update)

```jsx
import { useState, useEffect } from 'react';
import GameCard from './components/GameCard';

export default function Store() {
  const [games, setGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    // Call backend search
    const res = await fetch(`/api/search?query=${query}`);
    const results = await res.json();
    setGames(results);
  };

  return (
    <div className="store">
      <input 
        type="text"
        placeholder="Search games..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      
      <div className="game-list">
        {games.map(game => (
          <GameCard key={game.appId} game={game} />
        ))}
      </div>
    </div>
  );
}
```

---

### Step 4: User Clicks Game → GameDetail Page Opens

**Component**: `GameDetail.jsx` (needs update)

```jsx
import { useState, useEffect } from 'react';
import TorrentDownloadButton from './TorrentDownloadButton';

export default function GameDetail({ gameId }) {
  const [game, setGame] = useState(null);
  const [torrentInfo, setTorrentInfo] = useState(null);

  // Step 1: Fetch game details
  useEffect(() => {
    const fetchGame = async () => {
      // First try torrent DB
      const torrentRes = await fetch(`/api/torrent-db/game/${gameId}`);
      const torrentGame = await torrentRes.json();
      
      if (torrentGame?.success === false) {
        // Game not in torrent DB, fetch from Steam API
        const steamRes = await fetch(`/api/steam/${gameId}`);
        const steamGame = await steamRes.json();
        setGame(steamGame);
      } else {
        // Game in torrent DB
        setGame(torrentGame.game);
        setTorrentInfo(torrentGame.game.torrentFile);
      }
    };

    fetchGame();
  }, [gameId]);

  if (!game) return <div>Loading...</div>;

  return (
    <div className="game-detail">
      <div className="header">
        <img src={game.headerImage} alt={game.name} />
      </div>

      <div className="content">
        <h1>{game.name}</h1>
        <p>{game.shortDescription}</p>
        
        {/* Show download button if torrent available */}
        {torrentInfo && (
          <TorrentDownloadButton 
            gameId={game.appId}
            gameName={game.name}
            torrentFile={torrentInfo}
          />
        )}
      </div>
    </div>
  );
}
```

---

### Step 5: User Clicks Download Button → Dialog Opens

**Component**: `components/TorrentDownloadButton.jsx` (new)

```jsx
import { useState } from 'react';
import DownloadDialog from './DownloadDialog';

export default function TorrentDownloadButton({ gameId, gameName, torrentFile }) {
  const [showDialog, setShowDialog] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (downloadPath) => {
    setDownloading(true);
    
    try {
      const response = await fetch('/api/torrent/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          torrentPath: `e:\\Tạo app backend nè\\Tạo app backend\\torrent file game\\${torrentFile}`,
          gameId: gameId,
          gameName: gameName,
          downloadPath: downloadPath,
          autoUnzip: true
        })
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const data = await response.json();
      // Pass downloadId to progress component
      onDownloadStart(data.downloadId);
      setShowDialog(false);
      
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to start download');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowDialog(true)}
        disabled={downloading}
        className="btn-download-torrent"
      >
        {downloading ? 'Starting...' : '📥 Download (Torrent)'}
      </button>

      {showDialog && (
        <DownloadDialog
          gameName={gameName}
          onDownload={handleDownload}
          onCancel={() => setShowDialog(false)}
        />
      )}
    </>
  );
}
```

---

### Step 6: Download Dialog - User Selects Drive

**Component**: `components/DownloadDialog.jsx` (new)

```jsx
import { useState } from 'react';

export default function DownloadDialog({ gameName, onDownload, onCancel }) {
  const [selectedPath, setSelectedPath] = useState('C:\\Games\\Torrents');

  const drives = ['C:\\', 'D:\\', 'E:\\', 'F:\\'];

  return (
    <dialog open className="download-dialog">
      <div className="dialog-content">
        <h2>Download {gameName}</h2>
        
        <div className="form-group">
          <label>Select download location:</label>
          
          <div className="drive-selector">
            {drives.map(drive => (
              <button
                key={drive}
                onClick={() => setSelectedPath(drive + 'Games\\Torrents')}
                className={selectedPath.startsWith(drive) ? 'selected' : ''}
              >
                {drive}
              </button>
            ))}
          </div>
          
          <input
            type="text"
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            placeholder="Download path"
          />
        </div>

        <div className="buttons">
          <button 
            onClick={() => onDownload(selectedPath)}
            className="btn-primary"
          >
            Start Download
          </button>
          <button 
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}
```

---

### Step 7: Download Starts → Progress Bar Shows

**Component**: `components/TorrentProgressBar.jsx` (new)

```jsx
import { useState, useEffect } from 'react';

export default function TorrentProgressBar({ downloadId, gameName }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  // Poll for progress every 1 second
  useEffect(() => {
    if (!downloadId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/torrent/status/${downloadId}`);
        
        if (!res.ok) {
          // Download finished or not found
          clearInterval(interval);
          return;
        }

        const data = await res.json();
        setProgress(data);

        // Stop polling when complete
        if (data.status === 'completed' || data.status === 'error') {
          clearInterval(interval);
        }

      } catch (err) {
        console.error('Progress fetch error:', err);
        setError(err.message);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [downloadId]);

  if (!progress) return <div>Starting download...</div>;

  const progressPercent = (progress.progress * 100).toFixed(1);
  const downloadedMB = (progress.downloaded / 1024 / 1024).toFixed(0);
  const totalMB = (progress.total / 1024 / 1024).toFixed(0);
  const speedMBs = (progress.speed / 1024 / 1024).toFixed(2);
  const etaMinutes = Math.floor(progress.eta / 60);
  const etaSeconds = Math.floor(progress.eta % 60);

  return (
    <div className="torrent-progress">
      <h3>{gameName}</h3>

      {/* Status */}
      <div className="status">
        <span className="status-text">
          {progress.status === 'downloading' && '📥 Downloading'}
          {progress.status === 'unzipping' && '📦 Extracting'}
          {progress.status === 'completed' && '✅ Complete'}
          {progress.status === 'error' && '❌ Error'}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="progress-text">{progressPercent}%</span>
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="stat">
          <label>Downloaded:</label>
          <span>{downloadedMB}MB / {totalMB}MB</span>
        </div>
        <div className="stat">
          <label>Speed:</label>
          <span>{speedMBs} MB/s</span>
        </div>
        <div className="stat">
          <label>ETA:</label>
          <span>{etaMinutes}m {etaSeconds}s</span>
        </div>
      </div>

      {/* Status Messages */}
      {progress.status === 'unzipping' && (
        <p className="info">📦 Extracting files, please wait...</p>
      )}

      {progress.status === 'completed' && (
        <div className="success">
          <p>✅ Download and extraction complete!</p>
          <p>Game saved to: {progress.installPath || 'C:\\Games\\Torrents'}</p>
          <button onClick={() => window.location.reload()}>
            Continue
          </button>
        </div>
      )}

      {progress.status === 'error' && (
        <p className="error">❌ {error || 'Download failed'}</p>
      )}
    </div>
  );
}
```

---

## 🎨 CSS Styling

**File**: `src/styles/torrent-download.css` (new)

```css
/* Download Dialog */
.download-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 500px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  padding: 30px;
  z-index: 1000;
}

.download-dialog h2 {
  margin-top: 0;
  color: #333;
}

.form-group {
  margin: 20px 0;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
  color: #555;
}

.drive-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.drive-selector button {
  padding: 10px 15px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.drive-selector button:hover {
  border-color: #007bff;
}

.drive-selector button.selected {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

/* Progress Bar */
.torrent-progress {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.torrent-progress h3 {
  margin-top: 0;
  color: #333;
}

.status {
  margin: 15px 0;
}

.status-text {
  font-size: 14px;
  font-weight: bold;
  color: #666;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 15px 0;
}

.progress-bar {
  flex: 1;
  height: 24px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #45a049);
  transition: width 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.progress-text {
  min-width: 50px;
  text-align: right;
  font-weight: bold;
  color: #333;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin: 20px 0;
}

.stat {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  text-align: center;
}

.stat label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}

.stat span {
  display: block;
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.info, .success, .error {
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
  font-size: 14px;
}

.info {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #1976d2;
}

.success {
  background: #e8f5e9;
  color: #388e3c;
  border: 1px solid #388e3c;
}

.success button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #388e3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #c62828;
}
```

---

## 🧪 Testing

### Test 1: Backend Routes (No Frontend)

```bash
# 1. Start backend
npm run dev

# 2. In new terminal, add game to database
curl -X POST http://localhost:3000/api/torrent-db/add \
  -H "Content-Type: application/json" \
  -d '{
    "appId": 1398620,
    "name": "Need for Speed Heat",
    "torrentFile": "Need for Speed Heat.torrent",
    "hasDenuvo": true
  }'

# 3. Verify game is in database
curl http://localhost:3000/api/torrent-db/all

# 4. Get game details
curl http://localhost:3000/api/torrent-db/game/1398620

# 5. Start download
curl -X POST http://localhost:3000/api/torrent/download \
  -H "Content-Type: application/json" \
  -d '{
    "torrentPath": "e:\\Tạo app backend nè\\Tạo app backend\\torrent file game\\Need for Speed Heat.torrent",
    "gameId": 1398620,
    "gameName": "Need for Speed Heat",
    "downloadPath": "C:\\Games\\Torrents",
    "autoUnzip": true
  }'

# 6. Check progress (replace with actual downloadId)
curl http://localhost:3000/api/torrent/status/YOUR_DOWNLOAD_ID
```

### Test 2: Run Auto Test Script

```bash
node test-torrent-flow.js
```

### Test 3: Full Frontend Integration (After implementing components)

1. Run `npm run dev`
2. Open http://localhost:5174
3. Go to Store page
4. Search for "Need for Speed Heat"
5. Click on game card
6. Click "Download (Torrent)" button
7. Select drive and start download
8. Watch progress bar in real-time

---

## 📋 Implementation Checklist

### Backend (✅ DONE)
- [x] WebTorrent integration fixed
- [x] Torrent download API created
- [x] Progress tracking API created
- [x] Games database API created
- [x] Auto-unzip functionality
- [x] Event emitters for UI updates
- [x] Environment variables configured

### Frontend (⏳ TODO - Follow below)
- [ ] Create `components/TorrentDownloadButton.jsx`
- [ ] Create `components/DownloadDialog.jsx`
- [ ] Create `components/TorrentProgressBar.jsx`
- [ ] Update `pages/GameDetail.jsx`
- [ ] Add import statements
- [ ] Add CSS styling
- [ ] Test with backend
- [ ] Add error handling
- [ ] Add user feedback (notifications)

---

## 🚀 Quick Start

1. **Setup environment**:
   ```bash
   node setup-torrent-test.js
   ```

2. **Start backend**:
   ```bash
   npm run dev
   ```

3. **Test API** (in another terminal):
   ```bash
   node test-torrent-flow.js
   ```

4. **Implement frontend components** (See components above)

5. **Test in launcher**:
   - Search "Need for Speed Heat"
   - Click game card
   - Click "Download"
   - Monitor progress

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| WebTorrent error | Restart backend: `npm run dev` |
| Download doesn't start | Check torrent file path exists |
| Progress not updating | Verify download started (check console logs) |
| Download folder issues | Run `node setup-torrent-test.js` again |
| Zip extraction fails | Ensure extract-zip installed: `npm install extract-zip` |
| Port already in use | Change API_PORT in .env |

---

## 📚 Related Files

- **Backend Routes**: [routes/torrentDownload.js](routes/torrentDownload.js)
- **Backend Routes**: [routes/torrentDB.js](routes/torrentDB.js)
- **Backend Service**: [services/TorrentDownloadManager.js](services/TorrentDownloadManager.js)
- **Configuration**: [config/torrentConfig.js](config/torrentConfig.js)
- **Tests**: [test-torrent-flow.js](test-torrent-flow.js)
- **Setup**: [setup-torrent-test.js](setup-torrent-test.js)

---

**Ready to implement? Start with Step 1 in the Testing section! 🚀**
