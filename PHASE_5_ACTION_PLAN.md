# 📋 PHASE 5: Library Management - Action Plan

**Status:** Ready to Begin  
**Estimated Time:** 3-4 hours  
**Complexity:** Medium

---

## 🎯 Phase 5 Overview

Build a game library management system allowing users to:
- View installed games
- Launch games
- Uninstall games
- Track game statistics

---

## 📝 Detailed Requirements

### 1. Library Page Component
**File:** `src/pages/Library.jsx`

Display:
- [ ] List of installed games
- [ ] Game cards with cover image
- [ ] Game name and version
- [ ] Installation date
- [ ] Game size on disk
- [ ] Action buttons (Launch, Uninstall, Properties)

### 2. Launch Game Function
**File:** `modules/GameLauncher.js`

Features:
- [ ] Find game executable
- [ ] Start game process
- [ ] Track running processes
- [ ] Show "Playing Now" status
- [ ] Auto-close launcher on game start

### 3. Uninstall Game Function
**File:** `modules/GameUninstaller.js`

Features:
- [ ] Delete game files
- [ ] Remove config files
- [ ] Remove shortcuts
- [ ] Show confirmation dialog
- [ ] Progress bar for deletion

### 4. Game Statistics
**File:** `routes/library.js` (API)

Endpoints:
- [ ] GET /api/library - all games
- [ ] GET /api/library/:gameId - game details
- [ ] GET /api/library/:gameId/stats - game stats
- [ ] DELETE /api/library/:gameId - uninstall
- [ ] POST /api/library/:gameId/launch - launch game

### 5. UI Components

#### Game Card Component
**File:** `src/components/GameCard.jsx`
```jsx
Props: {
  game: { id, name, cover, size, installDate, playing }
  onLaunch: (gameId)
  onUninstall: (gameId)
  onProperties: (gameId)
}
```

#### Library View
- Grid layout (3-4 columns)
- Search/filter games
- Sort by name, date, size
- Show "Playing Now" badge
- Responsive design

---

## 🔄 Implementation Plan

### Step 1: Create Backend Modules
**Time:** 1 hour

```
1. modules/GameLauncher.js
   - findGameExecutable(gameId)
   - launchGame(gameId)
   - getRunningGames()
   - killGame(gameId)

2. modules/GameUninstaller.js
   - uninstallGame(gameId, progressCallback)
   - removeGameFiles(gamePath)
   - removeRegistry(gameId)
   - removeShortcuts(gameId)

3. routes/library.js
   - GET /api/library
   - GET /api/library/:gameId
   - DELETE /api/library/:gameId
   - POST /api/library/:gameId/launch
```

### Step 2: Create API Routes
**Time:** 30 minutes

Connect modules to Express routes:
- Test with curl
- Error handling
- Response formatting

### Step 3: Create Frontend Components
**Time:** 1 hour

```
1. src/components/GameCard.jsx
   - Display game info
   - Show action buttons
   - Status badges

2. src/pages/Library.jsx (Update existing)
   - Grid of GameCards
   - Search/filter
   - Launch/uninstall modals
```

### Step 4: Integration & Styling
**Time:** 1 hour

- Connect buttons to API
- Add loading states
- Add confirmation dialogs
- Responsive design
- Dark mode styling

### Step 5: Testing & Polish
**Time:** 30 minutes

- Test launch functionality
- Test uninstall workflow
- Test error cases
- Polish UI

---

## 🏗️ Architecture

```
Library Page (React)
├── GameCard (per game)
│   ├── Game image
│   ├── Game info
│   └── Action buttons
│       ├── Launch → GameLauncher
│       ├── Uninstall → GameUninstaller
│       └── Properties → GameDetails
└── List logic
    ├── Search
    ├── Filter
    └── Sort

GameLauncher (Backend)
├── Find executable
├── Start process
└── Track status

GameUninstaller (Backend)
├── Confirm deletion
├── Delete files
└── Clean registry
```

---

## 📂 Files to Create

```
Backend:
1. modules/GameLauncher.js (120 lines)
2. modules/GameUninstaller.js (100 lines)
3. routes/library.js (150 lines)

Frontend:
4. src/components/GameCard.jsx (200 lines)
5. src/pages/Library.jsx (update existing) (100 lines)

Config:
6. Update server.js (register routes)
7. Update App.jsx (if needed)
```

---

## 🧪 Testing Checklist

### Launch Game
- [ ] Click Launch button
- [ ] Game starts
- [ ] Launcher minimizes/closes
- [ ] Game shows as "Playing"
- [ ] Launcher resumes when game closes

### Uninstall Game
- [ ] Click Uninstall button
- [ ] Confirmation dialog shows
- [ ] Progress bar during deletion
- [ ] Game removed from list
- [ ] Files deleted from disk

### Library Display
- [ ] All games display
- [ ] Cards look good
- [ ] Search works
- [ ] Filter works
- [ ] Sort works
- [ ] Responsive on mobile

### Error Handling
- [ ] Game not found → error message
- [ ] Uninstall fails → rollback
- [ ] Missing executable → error message

---

## 💻 Code Examples

### GameLauncher.js
```javascript
const { execFile } = require('child_process');

class GameLauncher {
  static launchGame(gameId) {
    const game = this.findGameInLibrary(gameId);
    if (!game) throw new Error('Game not found');
    
    const executable = this.findExecutable(game.installPath);
    if (!executable) throw new Error('Executable not found');
    
    execFile(executable, [], { cwd: game.installPath });
    return { success: true, gameId };
  }
}
```

### Library API Route
```javascript
router.post('/api/library/:gameId/launch', (req, res) => {
  try {
    GameLauncher.launchGame(req.params.gameId);
    res.json({ success: true, message: 'Game launched' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
```

### GameCard Component
```jsx
function GameCard({ game, onLaunch, onUninstall }) {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden hover:shadow-lg transition">
      <img src={game.cover} alt={game.name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="font-bold text-white">{game.name}</h3>
        <p className="text-gray-400 text-sm">{formatBytes(game.size)}</p>
        <div className="flex gap-2 mt-4">
          <button onClick={() => onLaunch(game.id)}>Launch</button>
          <button onClick={() => onUninstall(game.id)}>Uninstall</button>
        </div>
      </div>
    </div>
  );
}
```

---

## 📊 Estimated Metrics

| Component | Lines | Time |
|-----------|-------|------|
| GameLauncher | 120 | 30 min |
| GameUninstaller | 100 | 30 min |
| Library Route | 150 | 30 min |
| GameCard Component | 200 | 30 min |
| Library Page | 150 | 30 min |
| Testing & Polish | - | 30 min |
| **Total** | **720** | **3 hours** |

---

## 🎯 Success Criteria

Phase 5 is complete when:

- [x] GameLauncher module works
- [x] GameUninstaller module works
- [x] Library API route works (5+ endpoints)
- [x] GameCard component displays correctly
- [x] Launch button starts game
- [x] Uninstall removes game
- [x] Library page shows all games
- [x] Search/filter works
- [x] Responsive design works
- [x] No console errors
- [x] Smooth user experience

---

## 📝 Notes

### Considerations

1. **Game Detection**
   - Scan for common game directories
   - Auto-populate on first launch
   - Allow manual adding

2. **Launch Behavior**
   - Close launcher or minimize?
   - Track game running status
   - Resume launcher on game close

3. **Uninstall Behavior**
   - Keep saves? (ask user)
   - Keep config files?
   - Verify deletion

4. **Performance**
   - Don't block UI during scan
   - Show progress bar
   - Use background workers

---

## 🚀 Ready to Start?

When you're ready to begin Phase 5, follow these steps:

1. **Create Backend Modules**
   - GameLauncher.js
   - GameUninstaller.js

2. **Create API Routes**
   - Library.js with endpoints

3. **Create Frontend Components**
   - GameCard.jsx
   - Update Library.jsx

4. **Connect & Test**
   - Integration
   - Testing
   - Polish

5. **Document**
   - API docs
   - Usage examples
   - Completion summary

---

## 📞 Next Phases

After Phase 5:

**Phase 6: User Accounts** (4-5 hours)
- Registration/Login
- Per-user libraries
- Per-user settings
- Cloud sync

**Phase 7: Cloud & Social** (5-7 hours)
- Cloud save sync
- Friends list
- Game recommendations
- Achievements

---

## 🎉 Let's Build It!

Phase 5 will add the final piece of the puzzle - a complete library management system that makes your launcher feel like a professional game client.

**Ready? Let's go! 🚀**

---

*Action Plan: Phase 5 Library Management*  
*Estimated Time: 3-4 hours*  
*Overall Project Progress: 80% → 90% after Phase 5*
