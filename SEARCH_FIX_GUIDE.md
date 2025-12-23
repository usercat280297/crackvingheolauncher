# 🔧 Hướng Dẫn Fix Tìm Kiếm

## Vấn Đề
Tìm kiếm "resident evil" không trả về kết quả vì:
1. **Cache trống** - File `gameNamesCache.json` chưa có dữ liệu tên game
2. **Thuật toán yếu** - Chỉ dùng `.includes()` mà không fuzzy matching
3. **Không chuẩn hóa text** - Các ký tự đặc biệt gây lỗi

## Giải Pháp

### 1. Build Cache Game Names
Chạy lệnh này để fetch tên game từ Steam API (có thể mất 5-10 phút):

```bash
npm run build:cache
```

**Hoặc** gọi API khi server đang chạy:
```bash
curl -X POST http://localhost:3000/api/search/build-cache
```

### 2. Cải Tiến Thuật Toán Tìm Kiếm
Thay đổi được áp dụng:

✅ **Matching tốt hơn:**
- **Exact match** (100%) - "resident" = "Resident"
- **Prefix match** (90%) - "resi" matches "Resident Evil"
- **Contains match** (80%) - "evil" matches "Resident Evil"  
- **Fuzzy match** (60%+) - "residentevil" matches "Resident Evil" bằng Levenshtein distance

✅ **Normalize text:**
- Loại bỏ ký tự đặc biệt
- Chuẩn hóa khoảng trắng
- Case-insensitive matching

### 3. Các Endpoints Mới

#### `/api/search/stats`
Xem số lượng game đã cache:
```bash
curl http://localhost:3000/api/search/stats
```
Response:
```json
{
  "totalGamesCached": 2500,
  "totalAppIds": 3000,
  "coverage": "83.3%"
}
```

#### `/api/search/search?q=resident&limit=20`
Tìm kiếm với fuzzy matching:
```bash
curl "http://localhost:3000/api/search/search?q=resident&limit=20"
```

#### `/api/search/reload-cache`
Reload cache (sau khi manual update cache file):
```bash
curl http://localhost:3000/api/search/reload-cache
```

## Kết Quả Sau Fix

**Trước:**
```
Search: "resident evil"
Result: Không tìm thấy (0 games)
```

**Sau:**
```
Search: "resident"
Results:
  - [exact] Resident Evil (100%)
  - [exact] Resident Evil 2 (100%)
  - [exact] Resident Evil 3 (100%)
  ...

Search: "resident evil 4"
Results:
  - [exact] Resident Evil 4 (100%)
  - [prefix] Resident Evil 4 - Game Guide (90%)
  ...

Search: "residentevil" (typo/no space)
Results:
  - [fuzzy] Resident Evil (85%)
  - [fuzzy] Resident Evil 2 (82%)
  ...
```

## Cơ Chế Hoạt Động

### Initialization
```javascript
// Load cache và build normalized index
const searcher = new QuickGameSearch();
// - Đọc lua files để lấy appIds
// - Load gameNamesCache.json
// - Build normalized index cho fuzzy matching
```

### Search Flow
```
Query Input
  ↓
Normalize Text (remove special chars)
  ↓
Exact Match? → Return with score 1.0
  ↓
Prefix Match? → Return with score 0.9
  ↓
Contains Match? → Return with score 0.8
  ↓
Fuzzy Match (Levenshtein)? → Return with score 0.6-0.99
  ↓
Sort by score & return top N results
```

### Levenshtein Distance
Tính số lần edit tối thiểu để convert string này sang string khác:
- "resident" → "residentevil" = 5 edits (69% similarity)
- "resident" → "resident evil" = 1 edit (95% similarity)

Threshold: 0.6 (60% similarity minimum)

## Files Thay Đổi

1. **quickGameSearch.js** (Main fix)
   - Add normalize text function
   - Add Levenshtein distance (fuzzy matching)
   - Add normalized index
   - Improve search algorithm
   - Add cache rebuild method

2. **routes/gameSearch.js**
   - Add `/build-cache` endpoint
   - Add `/reload-cache` endpoint  
   - Add better `/stats` endpoint
   - Fix minimum query length to 1 char

3. **package.json**
   - Add `build:cache` script

4. **buildGameCache.js** (New file)
   - Standalone script để build cache toàn bộ
   - Show progress với rate limiting
   - Can be run: `npm run build:cache`

## Tips

- Cache sẽ tự động save khi fetch game mới
- Fuzzy matching sử dụng Levenshtein distance (không cần external library)
- Search là synchronous (không async) - rất nhanh
- Các typo nhỏ sẽ được handle bởi fuzzy match

## Debug

Để xem chi tiết matching:
```javascript
const gameSearch = new QuickGameSearch();
const results = gameSearch.search("resident", 20);
console.log(results);
// [
//   { name: "Resident Evil", matchType: "exact", score: 1.0 },
//   { name: "Resident Evil 2", matchType: "contains", score: 0.8 },
//   ...
// ]
```
