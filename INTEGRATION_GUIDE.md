# 🎮 HƯỚNG DẪN TÍCH HỢP FEATURES VỚI LAUNCHER

## 1️⃣ HIỂN THỊ GAME NỔI TIẾNG TRÊN TRANG CHỦ

### Cập nhật `src/pages/Store.jsx`

Thêm vào useEffect để fetch game nổi tiếng + Denuvo:

```jsx
// Thêm state mới
const [mostPopularGames, setMostPopularGames] = useState([]);
const [loadingPopular, setLoadingPopular] = useState(false);

// Thêm useEffect mới
useEffect(() => {
  const fetchMostPopular = async () => {
    try {
      setLoadingPopular(true);
      
      // Lấy game nổi tiếng (Denuvo + trending)
      const response = await fetch(
        'http://localhost:3000/api/most-popular?limit=10'
      );
      const data = await response.json();
      
      if (data.success) {
        // Sắp xếp: Denuvo trước, sau đó trending
        const sorted = data.data.sort((a, b) => {
          if (a.isDenuvo && !b.isDenuvo) return -1;
          if (!a.isDenuvo && b.isDenuvo) return 1;
          return (b.rating || 0) - (a.rating || 0);
        });
        
        setMostPopularGames(sorted);
      }
    } catch (error) {
      console.error('Error fetching most popular games:', error);
    } finally {
      setLoadingPopular(false);
    }
  };

  fetchMostPopular();
}, []);

// Thêm component để hiển thị
const renderMostPopular = () => {
  if (loadingPopular) return <div className="loading">Loading popular games...</div>;
  if (mostPopularGames.length === 0) return null;

  return (
    <section className="most-popular-section">
      <div className="section-header">
        <h2>🔥 Trending & ⚡ Denuvo Games</h2>
        <p>Popular games được chơi nhiều nhất</p>
      </div>
      
      <div className="games-grid">
        {mostPopularGames.map(game => (
          <Link 
            key={game.id} 
            to={`/game/${game.id}`}
            className="game-card popular-card"
          >
            <div className="game-image-wrapper">
              <img 
                src={game.cover || game.hero} 
                alt={game.title}
                className="game-image"
              />
              
              {/* Badge Denuvo/Trending */}
              {game.badge && (
                <div className="badge-wrapper">
                  <span className={`badge ${game.isDenuvo ? 'denuvo' : 'trending'}`}>
                    {game.badge}
                  </span>
                </div>
              )}
              
              {/* Rating */}
              <div className="rating-overlay">
                <span className="rating">{game.rating}%</span>
              </div>
            </div>
            
            <div className="game-info">
              <h3>{game.title}</h3>
              <p className="genres">
                {game.genres?.slice(0, 2).join(', ') || 'N/A'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

// Trong JSX return, thêm trước các sections khác:
return (
  <div className="store-page">
    {renderMostPopular()}
    
    {/* Các sections khác như featured, sales, etc */}
  </div>
);
```

### CSS untuk Most Popular section:

```css
.most-popular-section {
  margin: 2rem 0;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(255, 0, 0, 0.1) 0%, rgba(255, 0, 0, 0) 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 0, 0, 0.2);
}

.most-popular-section .section-header {
  margin-bottom: 2rem;
}

.most-popular-section h2 {
  font-size: 2rem;
  color: #ff4444;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 20px rgba(255, 0, 0, 0.3);
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.game-card.popular-card {
  position: relative;
  transition: transform 0.3s, box-shadow 0.3s;
}

.game-card.popular-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 8px 24px rgba(255, 0, 0, 0.3);
}

.badge-wrapper {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  animation: pulse 2s infinite;
}

.badge.denuvo {
  background: #ff4444;
  color: white;
  box-shadow: 0 0 15px rgba(255, 68, 68, 0.6);
}

.badge.trending {
  background: #ffaa00;
  color: white;
  box-shadow: 0 0 15px rgba(255, 170, 0, 0.6);
}

.rating-overlay {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 4px 8px;
  border-radius: 4px;
  margin: 8px;
}

.rating {
  color: #00ff00;
  font-weight: bold;
  font-size: 0.9rem;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

---

## 2️⃣ HIỂN THỊ CACHE STATS

### Thêm endpoint call:

```jsx
// Trong Admin/Settings component
useEffect(() => {
  const fetchImageCacheStats = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/game-images/stats');
      const data = await response.json();
      setCacheStats(data);
    } catch (error) {
      console.error('Error fetching cache stats:', error);
    }
  };

  fetchImageCacheStats();
}, []);

// Hiển thị
{cacheStats && (
  <div className="cache-stats">
    <h3>Image Cache Stats</h3>
    <p>Cached: {cacheStats.cached}/{cacheStats.total} games ({cacheStats.cacheRate})</p>
    
    <button onClick={() => {
      fetch('http://localhost:3000/api/game-images/sync-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 })
      }).then(() => alert('Sync started!'));
    }}>
      🔄 Sync Images (50 games)
    </button>
  </div>
)}
```

---

## 3️⃣ TÍCH HỢP TORRENT DOWNLOAD VỚI GAMEDETAIL

### Cập nhật `src/pages/GameDetail.jsx`

```jsx
import TorrentDownloadProgress from '../components/TorrentDownloadProgress';

export default function GameDetail() {
  const { id } = useParams();
  const [torrentInfo, setTorrentInfo] = useState(null);
  const [downloadId, setDownloadId] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState(null);

  // Fetch torrent info
  useEffect(() => {
    const fetchTorrentInfo = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/torrent-db/game/${id}`);
        const data = await response.json();
        
        if (data.success) {
          setTorrentInfo(data.game);
        }
      } catch (error) {
        console.error('Error fetching torrent info:', error);
      }
    };

    fetchTorrentInfo();
  }, [id]);

  // Handle download start
  const handleInstallTorrent = async () => {
    if (!torrentInfo || !torrentInfo.torrentExists) {
      alert('❌ Torrent file not found!');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/torrent/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          torrentPath: torrentInfo.torrentFile,
          gameId: torrentInfo.appId,
          gameName: torrentInfo.name,
          autoUnzip: true
        })
      });

      const data = await response.json();
      if (data.success) {
        setDownloadId(data.downloadId);
        startDownloadTracking(data.downloadId);
      }
    } catch (error) {
      console.error('Error starting download:', error);
      alert('❌ Failed to start download');
    }
  };

  // Track download progress
  const startDownloadTracking = (dId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/torrent/status/${dId}`);
        const data = await response.json();
        
        if (data.success) {
          setDownloadStatus(data.download);
          
          if (data.download.status === 'ready') {
            clearInterval(interval);
            alert(`✅ ${data.download.gameName} cài xong!`);
          }
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 1000);
  };

  // Render install button
  return (
    <div className="game-detail">
      {/* ... existing game info ... */}
      
      {torrentInfo && (
        <div className="install-section">
          <h3>📥 Cài Đặt Game</h3>
          
          {downloadId ? (
            <TorrentDownloadProgress 
              download={downloadStatus}
              onCancel={() => {
                fetch(`http://localhost:3000/api/torrent/cancel/${downloadId}`, {
                  method: 'POST'
                });
                setDownloadId(null);
              }}
            />
          ) : (
            <button 
              className="btn-install"
              onClick={handleInstallTorrent}
            >
              ⬇️ Download Game ({torrentInfo.size})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

### Component `TorrentDownloadProgress.jsx`:

```jsx
export default function TorrentDownloadProgress({ download, onCancel }) {
  const formatSpeed = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + ' MB/s';
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="download-progress">
      <div className="status-badge">{download?.status}</div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${download?.progress || 0}%` }}
        />
      </div>
      
      <div className="progress-text">
        <span>{download?.progress?.toFixed(1)}%</span>
        <span>{download?.downloaded?.toFixed(1)}GB / {download?.total?.toFixed(1)}GB</span>
      </div>
      
      <div className="progress-stats">
        <span>⚡ {formatSpeed(download?.speed || 0)}</span>
        <span>⏱️ ETA: {formatTime(download?.eta || 0)}</span>
      </div>
      
      {download?.status === 'unzipping' && (
        <div className="unzipping-message">
          📤 Đang giải nén files...
        </div>
      )}
      
      {download?.status === 'ready' && (
        <div className="ready-message">
          ✅ Game cài xong! Ready to play
        </div>
      )}
      
      {['downloading', 'paused'].includes(download?.status) && (
        <div className="download-actions">
          {download?.status === 'downloading' && (
            <button onClick={() => {
              fetch(`/api/torrent/pause/${download.id}`, { method: 'POST' });
            }}>⏸️ Pause</button>
          )}
          
          {download?.status === 'paused' && (
            <button onClick={() => {
              fetch(`/api/torrent/resume/${download.id}`, { method: 'POST' });
            }}>▶️ Resume</button>
          )}
          
          <button onClick={onCancel} className="btn-cancel">❌ Cancel</button>
        </div>
      )}
    </div>
  );
}
```

---

## 4️⃣ DÙNG IMAGE CACHE

### Trong bất kỳ component cần ảnh:

```jsx
import { useEffect, useState } from 'react';

function GameImage({ appId, gameName }) {
  const [images, setImages] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        // Cache sẽ tự động hoạt động
        const response = await fetch(
          `http://localhost:3000/api/game-images/${appId}`
        );
        const data = await response.json();
        
        if (data.success) {
          setImages(data.images);
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [appId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Lấy từ cache (nhanh) */}
      <img src={images?.cover} alt={gameName} />
      
      {/* Fallback nếu cover không có */}
      {!images?.cover && (
        <img src={`https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`} alt={gameName} />
      )}
    </div>
  );
}
```

---

## 🎯 CHECKLIST TÍCH HỢP

- [ ] API `/api/most-popular` hoạt động
- [ ] API `/api/game-images/{appId}` hoạt động
- [ ] API `/api/torrent/download` hoạt động
- [ ] Store.jsx hiển thị game nổi tiếng
- [ ] Game badge (Denuvo/Trending) hiển thị
- [ ] GameDetail.jsx có button Install Torrent
- [ ] Download progress tracking hoạt động
- [ ] Auto-unzip hoạt động
- [ ] Resume download hoạt động
- [ ] Image cache MongoDB hoạt động

---

## 📊 EXPECTED RESULTS

### Trang chủ:
```
[🔥 Trending & ⚡ Denuvo Games]
[Cyberpunk 2077 ⚡] [Elden Ring ⚡] [Resident Evil ⚡]
[95%] [88%] [91%]
```

### Game Detail:
```
[Game Info]
...
📥 Cài Đặt Game
[⬇️ Download Game (55GB)]

[Progress: 45.67%]
[25.3 GB / 55.4 GB]
[⚡ 8.5 MB/s]  [⏱️ ETA: 01:00:23]
```

Happy coding! 🎮

