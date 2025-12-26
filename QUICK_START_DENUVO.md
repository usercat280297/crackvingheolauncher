# 🚀 QUICK START: DENUVO DETECTION SYSTEM

## ⏱️ 5-Minute Setup & Test

### STEP 1: Verify System (2 minutes)

```bash
# Run system verification
node verify-denuvo-system.js

# Expected output:
# ✅ All checks passed! System is ready for testing.
```

If you see errors:
- ❌ Missing STEAMGRIDDB_API_KEY?
  - Get it: https://www.steamgriddb.com/profile/preferences/api
  - Add to `.env`: `STEAMGRIDDB_API_KEY=your_key_here`

### STEP 2: Start Server (1 minute)

```bash
# Terminal 1
npm start

# Should see:
# ✅ Express server running on http://localhost:3000
# ✅ All systems operational
```

### STEP 3: Test Denuvo Detection (1 minute)

```bash
# Terminal 2 - Test single game
curl http://localhost:3000/api/denuvo/check/2358720

# Should return:
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
```

### STEP 4: Test Batch Processing (1 minute)

```bash
# Test multiple games at once
curl -X POST http://localhost:3000/api/denuvo/batch \
  -H "Content-Type: application/json" \
  -d '{"appIds": [2358720, 2054970, 1364780]}'

# Response shows all games with denuvo status
```

---

## 🧪 RUN FULL TEST SUITES

### Option A: Quick Test (Recommended First)

```bash
# Terminal 2 (while server running in Terminal 1)
node test-denuvo.js

# Tests 10 games:
# ✅ Black Myth Wukong - DENUVO
# ✅ Dragon's Dogma 2 - DENUVO
# ✅ Street Fighter 6 - DENUVO
# ... more games ...
# 📊 Success Rate: 100%
```

### Option B: SteamGridDB Test

```bash
# Terminal 2 (while server running)
node test-steamgriddb.js

# Tests beautiful names:
# 🎨 Testing SteamGridDB Integration
# ✅ Black Myth Wukong - Beautiful Name: "Black Myth Wukong"
# ✅ Hero Image: https://...
# ✅ Logo: https://...
```

---

## 📱 INTEGRATION INTO YOUR APP

### Quick Integration (5 minutes)

#### 1. Add Carousel to Home/Store Page

Find your Store.jsx or Home.jsx file:

```jsx
// At top, add import:
import EnhancedCarousel from '../components/EnhancedCarousel';

// In your component, add this where carousel should be:
<EnhancedCarousel games={yourGames} />
```

#### 2. Add DRM Badge to Game Cards

Find your GameCard.jsx component:

```jsx
// At top, add import:
import DenuvoIndicator from '../components/DenuvoIndicator';

// In your card JSX, add:
<DenuvoIndicator gameId={game.appId} gameName={game.name} />
```

#### 3. Add DRM Info to Game Details

Find your GameDetail.jsx:

```jsx
// At top, add import:
import DenuvoIndicator from '../components/DenuvoIndicator';

// In your detail page, add:
<section>
  <h3>DRM Status</h3>
  <DenuvoIndicator gameId={appId} gameName={gameName} />
</section>
```

---

## 🎯 API ENDPOINTS REFERENCE

### Check Single Game
```bash
GET /api/denuvo/check/:appId
curl http://localhost:3000/api/denuvo/check/2358720
```

### Check Multiple Games
```bash
POST /api/denuvo/batch
curl -X POST http://localhost:3000/api/denuvo/batch \
  -H "Content-Type: application/json" \
  -d '{"appIds": [2358720, 2054970]}'
```

### Get Verified List
```bash
GET /api/denuvo/list
curl http://localhost:3000/api/denuvo/list
```

### Get Cache Stats
```bash
GET /api/denuvo/stats
curl http://localhost:3000/api/denuvo/stats
```

### Fetch Beautiful Game Assets
```bash
POST /api/steamgriddb/batch
curl -X POST http://localhost:3000/api/steamgriddb/batch \
  -H "Content-Type: application/json" \
  -d '{"appIds": [2358720, 2054970]}'
```

---

## 🔍 POPULAR GAME APP-IDs TO TEST

| Game | App ID | Type |
|------|--------|------|
| Black Myth: Wukong | 2358720 | ✅ Denuvo |
| Dragon's Dogma 2 | 2054970 | ✅ Denuvo |
| Street Fighter 6 | 1364780 | ✅ Denuvo |
| Final Fantasy XVI | 2515020 | ✅ Denuvo |
| Stardew Valley | 413150 | 🆓 DRM-Free |
| Counter-Strike 2 | 730 | 🛡️ Anti-Cheat |
| Elden Ring | 1245620 | ✅ Denuvo |
| Cyberpunk 2077 | 1091500 | ✅ Denuvo |

---

## ❌ TROUBLESHOOTING

### Server won't start
```bash
# Check Node version (need 14+)
node --version

# Check port 3000 is free
# If not, set different port: PORT=3001 npm start
```

### API returns errors
```bash
# Check server is running
curl http://localhost:3000/api/health

# Check .env variables
cat .env | grep STEAMGRIDDB
```

### Beautiful names not showing
```bash
# Verify API key is valid
echo $STEAMGRIDDB_API_KEY

# Clear cache and retry
rm steamgriddb_cache.json
npm start
```

### Components not rendering
```bash
# Check file paths are correct
ls components/EnhancedCarousel.jsx
ls components/DenuvoIndicator.jsx

# Check imports match your folder structure
```

---

## ✨ SUCCESS INDICATORS

### ✅ System is working if you see:

1. **Verification Script**:
   ```
   ✅ All checks passed! System is ready for testing.
   ```

2. **API Response** (for denuvo check):
   ```json
   {
     "success": true,
     "data": { "appId": 2358720, "hasDenuvo": true }
   }
   ```

3. **Test Script**:
   ```
   📈 Test Results:
      ✅ Passed: 10
      ❌ Failed: 0
      ✨ Success Rate: 100%
   ```

4. **Carousel Renders**:
   - Games auto-rotate every 6 seconds
   - Beautiful game names display
   - Hero images show as backgrounds
   - Navigation buttons work

5. **DRM Badges Show**:
   - 🚫 Red for Denuvo
   - 🆓 Green for DRM-Free
   - 🛡️ Yellow for Anti-Cheat
   - 🔒 Blue for Steam DRM

---

## 📊 PERFORMANCE

### Expected Times:
- Single denuvo check: **50ms** (cached) / **500ms** (fresh)
- Batch 10 games: **2-3 seconds**
- Beautiful names fetch: **200ms per game**
- Carousel load: **1-2 seconds** (with images)

### Caching:
- Cache expiration: **30 days**
- Cache location: `denuvo_cache.json`, `steamgriddb_cache.json`
- Hit rate: **90%+** after first run

---

## 🎯 NEXT STEPS

1. ✅ Run verification: `node verify-denuvo-system.js`
2. ✅ Start server: `npm start`
3. ✅ Run tests: `node test-denuvo.js`
4. ✅ Integrate components into your UI
5. ✅ Test with real game data
6. ✅ Deploy to production

---

## 📞 NEED HELP?

1. Check the detailed guide: `DENUVO_INTEGRATION_GUIDE.md`
2. Review test files: `test-denuvo.js`, `test-steamgriddb.js`
3. Check server logs for error messages
4. Run verification: `verify-denuvo-system.js`

---

**Status**: ✅ **READY TO USE**  
**For**: 43,000 Community Members  
**Features**: Accurate Denuvo Detection + Beautiful Game Names

🚀 **Let's go!**
