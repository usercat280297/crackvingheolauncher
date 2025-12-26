# 🎯 DENUVO & STEAMGRIDDB INTEGRATION GUIDE

## ✅ What's Been Completed

### 1. **Backend Services Created** ✅
- ✅ `services/DenuvoDetectionService.js` - Denuvo detection engine
- ✅ `services/EnhancedSteamGridDBService.js` - Beautiful game names & images
- ✅ `routes/denuvo.js` - API endpoints for denuvo checking
- ✅ `server.js` - Updated with denuvo routes

### 2. **API Endpoints Available** ✅
```
GET  /api/denuvo/check/:appId          - Check single game for denuvo
POST /api/denuvo/batch                 - Check multiple games
GET  /api/denuvo/list                  - Get verified denuvo list
GET  /api/denuvo/stats                 - Cache statistics
POST /api/denuvo/clear-cache           - Clear cache
POST /api/steamgriddb/batch            - Batch fetch game assets
```

### 3. **React Components Created** ✅
- ✅ `EnhancedCarousel.jsx` - Beautiful carousel with SteamGridDB data
- ✅ `DenuvoIndicator.jsx` - DRM status badge component

---

## 🧪 TESTING PHASE

### Step 1: Start the Server

```bash
# Terminal 1: Start backend
npm start

# You should see:
# ✅ Express server running on http://localhost:3000
# ✅ Connected to MongoDB (if using)
```

### Step 2: Run Denuvo Detection Tests

```bash
# Terminal 2: Test denuvo detection
node test-denuvo.js

# Expected Output:
# 📊 Testing: Black Myth: Wukong (App ID: 2358720)
#    ✓ Denuvo: 🚫 YES
#    ✓ Verified: ✅ YES
#    ✓ Source: VERIFIED_LIST
#    ✅ PASSED
```

### Step 3: Test SteamGridDB Integration

```bash
# Make sure STEAMGRIDDB_API_KEY is in .env
node test-steamgriddb.js

# Expected Output:
# 🎨 Testing SteamGridDB Integration
# 🎮 Game: Black Myth: Wukong
#    ✅ Beautiful Name: "Black Myth Wukong"
#    ✅ Hero Image: https://...
#    ✅ Logo: https://...
```

### Step 4: Manual API Testing

```bash
# Test denuvo check endpoint
curl http://localhost:3000/api/denuvo/check/2358720

# Response:
# {
#   "success": true,
#   "data": {
#     "appId": 2358720,
#     "hasDenuvo": true,
#     "isVerified": true,
#     "source": "VERIFIED_LIST",
#     "gameTitle": "Black Myth: Wukong"
#   }
# }

# Test batch denuvo check
curl -X POST http://localhost:3000/api/denuvo/batch \
  -H "Content-Type: application/json" \
  -d '{"appIds": [2358720, 2054970, 1364780]}'

# Response shows all games with denuvo status
```

---

## 📱 INTEGRATION STEPS

### Priority 1: Update Home/Store Page

**File**: `pages/Store.jsx` (or similar)

```jsx
import EnhancedCarousel from '../components/EnhancedCarousel';

export default function Store() {
  const [popularGames, setPopularGames] = useState([]);

  useEffect(() => {
    // Fetch popular games
    fetchPopularGames()
      .then(games => {
        setPopularGames(games);
        // Pass app-ids to carousel
      });
  }, []);

  return (
    <div className="store-page">
      {/* Replace old carousel with: */}
      <EnhancedCarousel games={popularGames} />
      
      {/* Rest of page */}
    </div>
  );
}
```

### Priority 2: Add DRM Indicators to Game Cards

**File**: `components/GameCard.jsx` (or similar)

```jsx
import DenuvoIndicator from './DenuvoIndicator';

export default function GameCard({ game }) {
  return (
    <div className="game-card">
      <img src={game.image} />
      <h3>{game.name}</h3>
      
      {/* Add denuvo indicator */}
      <DenuvoIndicator gameId={game.appId} gameName={game.name} />
      
      <p>{game.price}</p>
    </div>
  );
}
```

### Priority 3: GameDetail Page

**File**: `pages/GameDetail.jsx` (or similar)

```jsx
import DenuvoIndicator from '../components/DenuvoIndicator';

export default function GameDetail({ appId }) {
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    // Fetch game details
    fetchGameDetails(appId)
      .then(data => setGameData(data));
  }, [appId]);

  return (
    <div className="game-detail">
      <h1>{gameData?.name}</h1>
      
      {/* Show prominent denuvo status */}
      <DenuvoIndicator gameId={appId} gameName={gameData?.name} />
      
      {/* Game description and other details */}
    </div>
  );
}
```

---

## 🔧 CONFIGURATION CHECKLIST

- [ ] **STEAMGRIDDB_API_KEY** in `.env`
  ```
  STEAMGRIDDB_API_KEY=your_key_here
  ```
  Get key at: https://www.steamgriddb.com/profile/preferences/api

- [ ] **Node dependencies** installed
  ```bash
  npm install
  ```

- [ ] **MongoDB** running (if using caching)
  ```bash
  mongod
  ```

- [ ] **server.js** has denuvo route imported ✅
  ```javascript
  const denuvoRouter = require('./routes/denuvo');
  app.use('/api/denuvo', denuvoRouter);
  ```

---

## 📊 DENUVO GAME DATABASE

### Verified Denuvo Games (60+ in system):

**Latest 2024-2025 Games:**
- 🎮 Black Myth: Wukong (2358720)
- 🎮 Dragon's Dogma 2 (2054970)
- 🎮 Street Fighter 6 (1364780)
- 🎮 Final Fantasy XVI (2515020)
- 🎮 Monster Hunter Wilds (2246340)
- 🎮 F1 25 (3059520)
- 🎮 NBA 2K26 (3472040)
- 🎮 Tekken 8 (2081640)

### Non-Denuvo Games:
- ✅ Cyberpunk 2077 (1091500) - No denuvo
- ✅ Stardew Valley (413150) - DRM-free
- ✅ Hollow Knight (367520) - DRM-free

**Note:** Some games use anti-cheat instead (EAC, BattlEye) - handled separately

---

## 🐛 TROUBLESHOOTING

### Issue: "STEAMGRIDDB_API_KEY not found"
**Solution:**
```bash
1. Go to: https://www.steamgriddb.com/profile/preferences/api
2. Generate API key
3. Add to .env: STEAMGRIDDB_API_KEY=your_key_here
4. Restart server: npm start
```

### Issue: Denuvo not detecting on game X
**Solution:**
1. Verify app-id is correct: Check Steam store URL
2. Run: `curl http://localhost:3000/api/denuvo/check/APP_ID`
3. Check source (should be VERIFIED_LIST or STEAM_ANALYSIS)
4. If missing, add to VERIFIED_DRM in DenuvoDetectionService.js

### Issue: Beautiful names not showing
**Solution:**
1. Check API key is valid
2. Verify game exists on SteamGridDB
3. Check rate limiting: Service waits 200ms between requests
4. View cache: `curl http://localhost:3000/api/denuvo/stats`

### Issue: Carousel not rendering
**Solution:**
1. Verify EnhancedCarousel.jsx is in correct path
2. Check game data is being passed correctly
3. Verify assets are fetched from `/api/steamgriddb/batch`
4. Check browser console for errors

---

## 📈 PERFORMANCE NOTES

### Caching Strategy:
- **DenuvoDetectionService**: 30-day cache (denuvo_cache.json)
- **EnhancedSteamGridDBService**: 30-day cache (steamgriddb_cache.json)
- **In-memory caching**: Hot games cached during session

### Rate Limiting:
- **Steam API**: 500ms delay between batch requests
- **SteamGridDB API**: 200ms delay between requests
- **Recommended**: Batch 10-20 games at a time

### Expected Performance:
- Single denuvo check: ~50ms (cached) or ~500ms (API call)
- Batch 10 games: ~2-3 seconds
- Carousel load: ~1-2 seconds (after cache warm)

---

## ✨ NEXT STEPS

After Integration Testing:

1. **Monitor Cache Hit Rate**
   - Track cache performance
   - Adjust expiration if needed (currently 30 days)

2. **User Feedback Loop**
   - Collect which games users ask about denuvo
   - Add any missing games to VERIFIED_DRM list

3. **Enhance Detection**
   - Add publisher detection (EA, Capcom, etc.)
   - Add genre-based analysis
   - Add review-based detection

4. **Scale for 43k Users**
   - Cache warming on startup
   - CDN for image delivery
   - API rate limiting on batch endpoints

---

## 📞 SUPPORT

For issues during integration:
1. Check console for error messages
2. Run test scripts to verify services
3. Check cache files in root directory
4. Verify environment variables

Cache files to check:
- `denuvo_cache.json`
- `steamgriddb_cache.json`

---

**Status**: ✅ All backend complete, ready for integration testing
**For 43k Community**: Accurate denuvo detection + beautiful game names
**Date**: 2025
