# 🔍 Vấn đề Search API - Đã Fix

## Vấn đề
Mặc dù đã fetch hơn 22k games và cache 13,161 games, nhưng khi search "resident evil" vẫn không tìm thấy kết quả.

## Nguyên nhân
1. **Route Conflict**: Frontend gọi `/api/search/search` nhưng server đang mount:
   - `/api/search` → `advancedSearchRouter` (Lua-based, ít games hơn)
   - `/api/game-search` → `gameSearchRouter` (QuickGameSearch, 13k+ cached games)

2. **Thuật toán Search**: Thuật toán cũ có threshold fuzzy matching quá cao (0.6) và không xử lý tốt multi-word queries như "resident evil"

## Giải pháp đã áp dụng

### 1. Cải thiện thuật toán search (`quickGameSearch.js`)
- ✅ Thêm **word-match** logic cho multi-word queries
- ✅ Giảm fuzzy threshold từ 0.6 → 0.5
- ✅ Cải thiện scoring system:
  - Exact match: 100%
  - Prefix match: 95%
  - Contains: 85%
  - Word match: 75-85%
  - Partial match: 40-60%
  - Fuzzy: 50%+

### 2. Swap route priority (`server.js`)
```javascript
// TRƯỚC:
app.use('/api/search', advancedSearchRouter);        // Lua-based
app.use('/api/game-search', gameSearchRouter);       // QuickGameSearch

// SAU:
app.use('/api/search', gameSearchRouter);            // QuickGameSearch ✅
app.use('/api/advanced-search', advancedSearchRouter); // Lua-based (legacy)
```

## Kết quả Test

### Test với "resident evil":
```
Found 15 results:

1. Resident Evil (exact match - 100%)
2. Resident Evil 5 (prefix - 95%)
3. Resident Evil 6 (prefix - 95%)
4. Resident Evil Revelations (prefix - 95%)
5. Resident Evil 4 (2005) (prefix - 95%)
6. Resident Evil 0 (prefix - 95%)
7. Resident Evil 7 Biohazard (prefix - 95%)
8. Resident Evil 3 (prefix - 95%)
9. RESIDENT EVIL RESISTANCE (prefix - 95%)
10. Resident Evil Village (prefix - 95%)
11. Resident Evil Re:Verse (prefix - 95%)
12. Resident Evil 2 Original Soundtrack (prefix - 95%)
13. Resident Evil 4 (prefix - 95%)
```

## Cache Stats
- **Total games in cache**: 13,161
- **Total .lua files**: 30,174
- **Coverage**: 43.6%

## Cách test

### 1. Test trực tiếp với Node.js:
```bash
node test-search-resident.js
```

### 2. Test API endpoint (sau khi start server):
```bash
# Start server
node server.js

# Test search
curl "http://localhost:3000/api/search/search?q=resident%20evil&limit=10"

# Check stats
curl "http://localhost:3000/api/search/stats"
```

### 3. Test từ frontend:
- Mở app
- Gõ "resident evil" vào search bar
- Kết quả sẽ hiện ngay lập tức

## Các endpoint search

| Endpoint | Mô tả | Cache |
|----------|-------|-------|
| `/api/search/search?q=...` | QuickGameSearch (Primary) | 13k+ games |
| `/api/search/suggestions?q=...` | Auto-complete suggestions | 13k+ games |
| `/api/search/stats` | Cache statistics | - |
| `/api/advanced-search/search?q=...` | Lua-based search (Legacy) | ~1k games |

## Lưu ý
- Server cần **restart** để áp dụng thay đổi route
- Cache được load tự động khi server start
- Nếu muốn rebuild cache: `POST /api/search/build-cache`
- Nếu muốn reload cache: `GET /api/search/reload-cache`

## Files đã thay đổi
1. ✅ `quickGameSearch.js` - Cải thiện thuật toán search
2. ✅ `server.js` - Swap route priority
3. ✅ `test-search-resident.js` - Test script
4. ✅ `SEARCH_FIX.md` - Documentation này

---
**Status**: ✅ FIXED - Search "resident evil" giờ trả về 13+ kết quả chính xác
