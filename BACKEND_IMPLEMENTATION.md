# Backend Search Implementation - Complete Guide

## Architecture Overview

```
Frontend (React)
    ↓
/api/search/search → GameSearchRouter
    ↓
QuickGameSearch (Main Logic)
    ├── Cache: gameNamesCache.json
    ├── Fuzzy Matching: Levenshtein distance
    └── Lazy Loading: Fetch from Steam on-demand
```

## Components

### 1. **quickGameSearch.js** - Core Search Engine
- **Fuzzy matching algorithm**: Levenshtein distance (handles typos)
- **Multi-level matching**:
  - Exact match (100%)
  - Prefix match (90%) - starts with query
  - Contains match (80%) - includes query
  - Fuzzy match (60%+) - similar names
- **Smart caching**:
  - In-flight deduplication (don't fetch same game twice)
  - Failed ID tracking (don't retry non-existent games)
  - Normalized index for fast search
- **Lazy loading**: Fetch from Steam only when needed

### 2. **routes/gameSearch.js** - API Routes
```
GET /api/search/search?q=resident&limit=20
  → Returns ranked results with match type & score

GET /api/search/suggestions?q=resi&limit=5
  → Returns top suggestions for autocomplete

GET /api/search/stats
  → Returns cache status (total cached, coverage %)

POST /api/search/build-cache
  → Trigger background cache build

GET /api/search/reload-cache
  → Reload cache from disk
```

### 3. **server.js** - Express Server
- Mounts search router at `/api/search`
- Pre-loads Lua games on startup
- Handles MongoDB optional connection
- CORS enabled for frontend access

## Build Process

### Option 1: Build Popular Games (Fast - ~2 min)
```bash
npm run build:popular
```
Caches ~40 popular games including all Resident Evil games

### Option 2: Build Complete Cache (Slow - ~6-8 hours)
```bash
npm run build:cache
```
Fetches all 30,174 games from Steam with smart rate-limiting

## Search Algorithm

### Workflow
```
Input: "resident"
  ↓
1. Normalize: "resident" → "resident"
2. Search Cache:
   - Check normalized index
   - Exact match? → Resident Evil (score: 1.0)
   - Prefix match? → Resident Evil 2 (score: 0.9)
   - Contains? → Resident Evil 3 (score: 0.8)
   - Fuzzy? → "residentevil" (score: 0.85)
  ↓
3. Sort by score & return top N
```

### Similarity Calculation
Uses Levenshtein distance:
- `"resident"` vs `"Resident Evil"` = 95% similarity
- `"residentevil"` vs `"Resident Evil"` = 85% similarity
- Threshold: 60% (0.6)

## Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Search (cached) | <5ms | From normalized index |
| First search (uncached) | 0.5-2s | Fetch from Steam |
| Duplicate search | <5ms | In-flight dedup cache |
| Build popular cache | ~1 min | 40 games |
| Build full cache | 6-8 hrs | 30k games, rate-limited |

## Error Handling

### 429 (Rate Limited)
- Exponential backoff: 800ms → 1200ms → ... → 5s
- Auto-retry with longer delays
- Degrade gracefully - return cached results

### Network Errors
- Track failed IDs to avoid retry spam
- Fail silently and continue searching
- Return whatever cached results exist

### Empty Cache
- Search returns empty array
- Log message for debugging
- No random results (was causing "Kebab Chefs" bug)

## Files Modified

1. **quickGameSearch.js** - Complete rewrite
   - Added fuzzy matching (Levenshtein distance)
   - Added lazy loading with deduplication
   - Added smart failure tracking
   - Removed broken fallback logic

2. **routes/gameSearch.js** - Async fixes
   - Made search() and getSuggestions() async
   - Added /build-cache endpoint
   - Added /reload-cache endpoint
   - Added /stats endpoint

3. **server.js** - Route mounting
   - Mount at `/api/search` (in addition to `/api/game-search`)
   - Added error handling for pre-load

4. **package.json** - New scripts
   - `build:cache` - Build full cache
   - `build:popular` - Build popular games cache

5. **buildGameCache.js** - New file
   - Full cache builder with exponential backoff
   - Progress tracking with smart rate-limiting

6. **buildPopularGames.js** - New file
   - Quick cache for testing
   - Includes all Resident Evil games

## Testing

### Manual Test
```bash
# Start server
npm run dev:server

# In another terminal, test endpoint
curl "http://localhost:3000/api/search/search?q=resident&limit=10"
```

### Expected Response
```json
{
  "query": "resident",
  "count": 5,
  "results": [
    {
      "appId": 304240,
      "name": "Resident Evil 7: Biohazard",
      "file": "304240.lua",
      "matchType": "contains",
      "score": 80
    },
    ...
  ],
  "suggestions": [...]
}
```

## Deployment Checklist

- [ ] Run `npm run build:popular` to populate initial cache
- [ ] Or `npm run build:cache` for complete cache (takes 6-8 hours)
- [ ] Test `/api/search/search?q=test`
- [ ] Verify `gameNamesCache.json` exists and has data
- [ ] Check MongoDB connection (optional, logs to console)
- [ ] Vite frontend should connect to `localhost:3000/api/search`

## Future Improvements

1. **Database-backed cache** - Replace JSON file with DB
2. **Batch fetch** - Get multiple games per request (better rate-limiting)
3. **User preferences** - Cache recently searched games locally
4. **Elasticsearch** - For millions of games (overkill for current use case)
5. **Redis cache** - Distributed caching for multiple instances
