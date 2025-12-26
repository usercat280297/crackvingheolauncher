# 🧪 Frontend Testing Guide

## Quick Start Test

### Phase 1: App Startup
1. Start backend: `npm run dev`
2. Wait for "Server running on port 3000"
3. Open Electron app

**Expected**:
- App loads without errors
- Homepage displays with featured games carousel
- No console errors

---

## Phase 2: Homepage - Featured Games

### Test Case: Popular Games Carousel
```
1. Check homepage loads
2. Verify "⭐ Game Nổi Tiếng" section appears
3. Verify carousel shows game cards
4. Verify auto-rotation (changes every 5 seconds)
5. Click Previous/Next buttons
6. Click on game card
```

**Expected**:
- ✅ Carousel displays smoothly
- ✅ Cards show game image, title, badges
- ✅ Denuvo badge shows 🔐 for protected games
- ✅ Auto-rotation works
- ✅ Navigation buttons work
- ✅ Click navigates to GameDetail page

**Console Check**:
```javascript
// Should see these logs:
// ✅ "Fetching popular games..."
// ✅ "Popular games loaded: X games"
```

---

## Phase 3: Game Download - Folder Selection

### Test Case 1: Browse Button
```
1. Go to any game detail page
2. Scroll to download section
3. Click "Download" button
4. Download dialog opens
5. See FolderSelector component
6. Click "Browse" button
```

**Expected**:
- ✅ File picker dialog opens
- ✅ Can navigate folders
- ✅ Selected path appears in field
- ✅ Path is validated

**Browser Console Check**:
```javascript
// If NOT working, check:
// ❌ ipcRenderer.invoke returns error
// ❌ IPC handler not registered in main process
```

### Test Case 2: Drive Quick-Select
```
1. Download dialog open
2. See drive buttons: C:, D:, E:, F:
3. Click on different drives
```

**Expected**:
- ✅ Clicking drive updates path field
- ✅ Path format is correct (e.g., "E:\Games")
- ✅ No errors in console

### Test Case 3: Manual Path Input
```
1. Download dialog open
2. Edit path field manually
3. Type custom path (e.g., "E:\My Games\MyGame")
4. Click outside field
```

**Expected**:
- ✅ Path updates when typing
- ✅ No validation errors for valid paths
- ✅ Submit button works with custom path

---

## Phase 4: Download Progress - Real-Time Monitoring

### Test Case: Download Execution
```
1. Download dialog open
2. Path selected (e.g., "E:\Games")
3. Checkboxes configured
4. Click "Start Download"
5. Wait 2-3 seconds
```

**Expected**:
- ✅ "Start Download" button disables
- ✅ TorrentProgressBar component appears
- ✅ Shows "Downloading..." status
- ✅ Progress bar fills gradually
- ✅ Speed (MB/s) updates
- ✅ ETA calculates and updates
- ✅ Downloaded MB shown

**Console Check**:
```javascript
// Expected logs:
// ✅ POST /api/torrent/download called
// ✅ downloadId received: "uuid-string"
// ✅ Progress polling started
// GET /api/torrent/status/{downloadId} called every 1 second
```

### Test Case: Progress Bar Behavior
```
1. Download in progress
2. Watch progress bar for 10 seconds
3. Verify it advances smoothly
4. Verify stats update every 1 second
```

**Expected**:
- ✅ Progress percentage increases
- ✅ Speed shows current download rate
- ✅ ETA decreases as download progresses
- ✅ No jumpy or glitchy updates
- ✅ Status message matches actual state

---

## Phase 5: Download Completion

### Test Case: Finish Download
```
1. Let download complete
2. OR manually stop download process
3. Watch for completion message
```

**Expected**:
- ✅ Status changes to "Completed! ✅"
- ✅ Progress reaches 100%
- ✅ "Open Folder" button appears
- ✅ Can click to open downloads folder
- ✅ Files unzipped (if applicable)

---

## Error Scenarios

### Scenario 1: Backend Not Running
**Symptom**: FeaturedPopularGames shows no games, TorrentProgressBar doesn't update

**Fix**:
```bash
npm run dev  # Make sure this is running
```

### Scenario 2: Torrent Download Fails
**Symptom**: Download button click does nothing or shows error

**Check**:
1. Verify torrent file exists:
   ```
   C:\Games\Torrents_DB\{gameId}.torrent
   ```
2. Check server logs for errors
3. Verify WebTorrent initialized:
   ```
   // Look for in logs: "✅ WebTorrent initialized"
   ```

### Scenario 3: Folder Picker Not Working
**Symptom**: Browse button doesn't open file picker dialog

**Check**:
1. Ensure running in Electron (not web browser)
2. Check for IPC handler in main.js:
   ```javascript
   ipcMain.handle('dialog:openDirectory', async () => {
     // handler code
   });
   ```

### Scenario 4: Progress Not Updating
**Symptom**: Progress bar frozen, not advancing

**Check**:
1. Verify `/api/torrent/status/{id}` endpoint
2. Check browser Network tab:
   - Should see GET requests every 1 second
   - Response should have `progress`, `speed`, `eta` fields
3. Check console for fetch errors

---

## Console Log Expectations

### Successful Flow Logs:
```javascript
// 1. App starts
"🚀 Server running on port 3000"

// 2. FeaturedPopularGames component
"📡 Fetching popular games..."
"✅ Popular games data loaded"
"Carousel initialized with X games"

// 3. Download dialog opens
"📱 Download dialog opened for game: Cyberpunk 2077"

// 4. Download starts
"📤 Posting to /api/torrent/download"
"🎬 Download ID received: abc-123-def"
"⏱️ Progress polling started"

// 5. Progress updates (every 1 second)
"📊 Progress update: 45% | 5.2MB/s | ETA: 2h 15m"

// 6. Download completes
"✅ Download complete!"
"🎉 Game ready to play"
```

---

## Performance Metrics

### Acceptable Performance:
- **Homepage Load**: < 2 seconds
- **FeaturedPopularGames Render**: < 1 second
- **Download Dialog Open**: Instant
- **Progress Update**: Every 1 second (smooth)
- **File Picker Open**: < 1 second
- **Memory Usage**: < 200MB increase during download

---

## Multi-Drive Testing

### Test All Drives:
```
1. Test Download to C:\Games ✓
2. Test Download to D:\Games ✓
3. Test Download to E:\Games ✓
4. Test Download to F:\Games ✓
```

**Each should**:
- ✅ Open file picker showing that drive
- ✅ Display correct path
- ✅ Download to correct location
- ✅ Auto-unzip in correct location

---

## Cleanup After Testing

```bash
# Remove test downloads
rm C:\Games\*
rm D:\Games\*  (if testing)
rm E:\Games\*  (if testing)

# Clear localStorage if needed
# (In browser console)
localStorage.clear();
```

---

## Checklist - Ready When All ✅

- [ ] Featured games show on homepage
- [ ] Carousel auto-rotates
- [ ] Denuvo badges display
- [ ] Game links work
- [ ] Browse button opens file picker
- [ ] Drive quick-select buttons work
- [ ] Manual path input works
- [ ] Download button triggers API call
- [ ] Progress bar appears
- [ ] Progress updates in real-time
- [ ] Speed and ETA display correctly
- [ ] Download completes successfully
- [ ] Files extracted to selected location
- [ ] Multi-drive support confirmed
- [ ] No console errors
- [ ] No memory leaks

---

## If All Tests Pass

✅ **Frontend integration is complete!**

You can now:
1. Browse and find games
2. View game details
3. Select download location (any drive)
4. Monitor download progress in real-time
5. Auto-extract and run games

---

*Test Date: ___________*  
*Tester: ___________*  
*Status: ___________*
