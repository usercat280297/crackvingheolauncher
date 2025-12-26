# 🚀 Auto-Update System Documentation

## Tổng quan
Hệ thống auto-update cho phép tất cả API tự động cập nhật theo thời gian thực với cache thông minh.

## Tính năng chính

### 🔄 Auto-Update Scheduler
- **Popular Games**: Cập nhật mỗi 30 phút
- **Games List**: Cập nhật mỗi 1 giờ  
- **DLC Data**: Cập nhật mỗi 45 phút
- **Steam Data**: Cập nhật mỗi 6 giờ
- **Images**: Cập nhật mỗi 24 giờ
- **Game Sizes**: Cập nhật mỗi 12 giờ

### 💾 Cache System
- **Memory Cache**: NodeCache với TTL tự động
- **Disk Cache**: Persistent cache cho dữ liệu quan trọng
- **Smart Cache**: Tự động detect cache type theo API path

### 🔌 Real-time Updates
- **WebSocket**: Kết nối real-time với client
- **Auto-reconnect**: Tự động kết nối lại khi mất kết nối
- **Notifications**: Thông báo khi có update mới

## API Endpoints

### Cache Management
```
GET  /api/cache/stats     - Xem thống kê cache
POST /api/cache/clear     - Xóa cache (query: ?type=games)
POST /api/cache/refresh   - Force refresh (query: ?type=all)
GET  /api/cache/status    - Xem trạng thái scheduler
```

### Manual Updates
```javascript
// Trigger manual update
fetch('/api/cache/refresh?type=popular')
fetch('/api/cache/refresh?type=games') 
fetch('/api/cache/refresh?type=dlc')
fetch('/api/cache/refresh?type=steam')
fetch('/api/cache/refresh?type=images')
fetch('/api/cache/refresh?type=sizes')
fetch('/api/cache/refresh?type=all')
```

## Client-side Usage

### Kết nối WebSocket
```javascript
// Auto-connect khi load page
// Script: /public/js/realtime-client.js

// Manual methods
realTimeClient.requestUpdate('popular');
realTimeClient.subscribe(['games', 'dlc']);
```

### Event Listeners
```javascript
// Listen for updates
realTimeClient.on('popular_games', (data) => {
    console.log('Popular games updated:', data);
});

realTimeClient.on('games_list', (data) => {
    console.log('Games list updated:', data);
});
```

## Cache Configuration

### Cache Types & TTL
```javascript
{
    games: { ttl: 3600, persistent: true },      // 1 giờ
    dlc: { ttl: 1800, persistent: true },        // 30 phút  
    steamData: { ttl: 86400, persistent: true }, // 1 ngày
    images: { ttl: 604800, persistent: true },   // 1 tuần
    search: { ttl: 300, persistent: false },     // 5 phút
    popular: { ttl: 7200, persistent: true },    // 2 giờ
    gameDetails: { ttl: 3600, persistent: true } // 1 giờ
}
```

## Environment Variables

Thêm vào `.env`:
```env
# Cache settings
CACHE_DURATION=300000          # 5 phút default
STEAM_CACHE_DURATION=86400000  # 1 ngày cho Steam data

# Rate limiting
STEAM_REQUEST_DELAY=2500       # 2.5s giữa các request
MAX_CONCURRENT_REQUESTS=2      # Max 2 request đồng thời
```

## Monitoring

### Cache Stats
```javascript
// GET /api/cache/stats
{
    "cache": {
        "memory": { "keys": 150, "hits": 1250, "misses": 45 },
        "disk": { "keys": 50, "size": 2048576 }
    },
    "realtime": {
        "connectedClients": 3,
        "bufferedUpdates": 0
    }
}
```

### Scheduler Status
```javascript
// GET /api/cache/status
{
    "isRunning": true,
    "queueLength": 0,
    "activeJobs": 1,
    "lastUpdates": {
        "popular": 1703123456789,
        "games": 1703120000000
    }
}
```

## Performance Benefits

### Before Auto-Update
- ❌ Mỗi request phải fetch từ database/API
- ❌ Response time: 500-2000ms
- ❌ Database load cao
- ❌ User phải chờ loading

### After Auto-Update  
- ✅ Data được cache sẵn
- ✅ Response time: 10-50ms
- ✅ Database load thấp
- ✅ Real-time updates tự động
- ✅ Offline-first experience

## Troubleshooting

### Cache Issues
```bash
# Clear all cache
curl -X POST http://localhost:3000/api/cache/clear

# Clear specific cache
curl -X POST http://localhost:3000/api/cache/clear?type=games

# Force refresh
curl -X POST http://localhost:3000/api/cache/refresh?type=all
```

### WebSocket Issues
```javascript
// Check connection status
console.log(realTimeClient.getStatus());

// Manual reconnect
realTimeClient.disconnect();
realTimeClient.connect();
```

### Scheduler Issues
```bash
# Check scheduler status
curl http://localhost:3000/api/cache/status

# Restart server to reset scheduler
npm run dev:server
```

## File Structure
```
services/
├── cacheManager.js          # Cache management
├── autoUpdateScheduler.js   # Cron jobs scheduler  
├── realTimeUpdateService.js # WebSocket real-time
├── gameService.js          # Game data với cache
├── dlcService.js           # DLC data với cache
├── steamService.js         # Steam API với cache
└── imageService.js         # Image management

middleware/
└── cacheMiddleware.js      # Cache middleware cho routes

public/js/
└── realtime-client.js      # Client-side WebSocket
```

## Usage Examples

### API với Auto-Cache
```javascript
// Tất cả API routes tự động có cache
app.get('/api/games', smartCache(), async (req, res) => {
    // Data sẽ được cache tự động
    const games = await gameService.getAllGames();
    res.json(games);
});
```

### Manual Cache Control
```javascript
// Force refresh specific data
const gameService = require('./services/gameService');
await gameService.getPopularGames(true); // forceRefresh = true
```

### Real-time UI Updates
```html
<!-- Add data attributes for auto-update -->
<div data-popular-games>
    <!-- Popular games sẽ tự động update -->
</div>

<img data-game-id="123" src="...">
<!-- Image sẽ tự động update khi có image mới -->

<script src="/js/realtime-client.js"></script>
```

## Kết luận

Hệ thống auto-update này cung cấp:
- ⚡ Performance cực nhanh với cache
- 🔄 Auto-update theo thời gian thực  
- 🔌 Real-time notifications
- 💾 Persistent cache cho reliability
- 📊 Monitoring và stats chi tiết
- 🛠️ Easy configuration và troubleshooting