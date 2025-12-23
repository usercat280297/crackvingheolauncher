# 🎮 Advanced Game Launcher - Steam/Epic Clone

Modern game launcher với đầy đủ tính năng như Steam/Epic Games, tích hợp Steam API, quản lý game, download, cài đặt, verify files.

## ✨ Features Hoàn Chỉnh

### 🎯 Core Features
- ✅ **Steam API Integration** - Fetch đầy đủ thông tin game từ Steam
- ✅ **Game Management** - Download, Install, Verify, Uninstall
- ✅ **Settings System** - Cấu hình thư mục, ngôn ngữ, download
- ✅ **Download Manager** - Multi-source, pause/resume, progress tracking
- ✅ **Game Library** - Quản lý game đã cài đặt
- ✅ **Search & Filter** - Tìm kiếm và lọc game theo thể loại

### 📊 Game Details (Giống Steam)
- Screenshots gallery với lightbox
- System requirements (minimum & recommended)
- Achievements list với icons
- DLC information
- Reviews & ratings
- Metacritic scores
- Developer & publisher info
- Release dates
- Pricing & discounts
- Platform support (Windows/Mac/Linux)
- Languages supported
- News & updates

### 🎨 UI/UX Features
- Featured games carousel
- Special offers section
- Category filtering
- Beautiful gradient backgrounds
- Smooth animations & transitions
- Responsive design
- Professional Steam-like interface

### ⚙️ Settings & Configuration
- Install directory selection
- Language preferences (8 languages)
- Download speed limiting
- Auto-update toggle
- Verify on install option
- Keep installers option
- Storage information display

## 🚀 Quick Start

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình Steam API Key
Tạo file `.env` và thêm:
```env
STEAM_API_KEY=your_steam_api_key_here
USE_STEAM_API=true
STEAM_REQUEST_DELAY=1200
MAX_CONCURRENT_REQUESTS=5
```

Lấy Steam API Key tại: https://steamcommunity.com/dev/apikey

### 3. Tạo thư mục lua_files
```bash
mkdir lua_files
```

Thêm các file `.lua` với tên là Steam App ID:
```
lua_files/
  ├── 480.lua      # Portal 2
  ├── 730.lua      # CS:GO
  ├── 570.lua      # Dota 2
  └── ...
```

Nội dung file lua (ví dụ `480.lua`):
```lua
addappid(480)
```

### 4. Chạy development
```bash
npm run dev
```

Server sẽ chạy tại:
- Frontend: http://localhost:5173
- API: http://localhost:3000

## 📁 Cấu Trúc Project

```
├── services/
│   ├── gameInstallService.js      # Download, install, verify, uninstall
│   └── enhancedSteamAPI.js        # Full Steam API integration
├── routes/
│   └── gameManagement.js          # API routes cho game management
├── src/
│   ├── pages/
│   │   ├── Store.jsx              # Trang chủ với featured games
│   │   ├── GameDetail.jsx         # Chi tiết game (giống Steam)
│   │   ├── Downloads.jsx          # Quản lý downloads
│   │   └── Settings.jsx           # Cấu hình launcher
│   └── components/
├── lua_files/                     # Steam App IDs
├── luaParser.js                   # Parse lua files & fetch Steam data
└── server.js                      # Express API server
```

## 🎮 API Endpoints

### Game Management
```
POST   /api/game-management/download        # Start download
GET    /api/game-management/downloads       # Get all downloads
POST   /api/game-management/download/:id/pause
POST   /api/game-management/download/:id/resume
POST   /api/game-management/download/:id/cancel
POST   /api/game-management/uninstall       # Uninstall game
POST   /api/game-management/verify          # Verify game files
POST   /api/game-management/launch          # Launch game
GET    /api/game-management/settings        # Get settings
POST   /api/game-management/settings        # Update settings
```

### Games
```
GET    /api/games                           # Get all games (paginated)
GET    /api/games/:id                       # Get game details
GET    /api/games/featured                  # Get featured games
GET    /api/games/on-sale                   # Get games on sale
GET    /api/games/refresh                   # Force refresh cache
```

## 🔧 Configuration

### Settings.json Location
Windows: `%APPDATA%\GameLauncher\settings.json`
Mac/Linux: `~/.config/GameLauncher/settings.json`

### Default Settings
```json
{
  "installPath": "C:\\Users\\YourName\\Games",
  "language": "english",
  "autoUpdate": true,
  "downloadLimit": 0,
  "verifyOnInstall": true,
  "keepInstallers": false
}
```

## 🎯 Steam API Data Fetched

Mỗi game sẽ có đầy đủ thông tin:

### Basic Info
- Title, description, detailed description
- Developer, publisher
- Release date
- Genres, categories, tags

### Media
- Header image, background image, capsule image
- Screenshots (thumbnail + full size)
- Videos/trailers

### Pricing
- Current price, original price
- Discount percentage
- Free to play status
- Sale information

### Technical
- Platform support (Windows/Mac/Linux)
- System requirements (min & recommended)
- Supported languages
- File size

### Community
- Metacritic score
- User reviews (positive/negative/total)
- Recommendations count
- Achievements count

### Additional
- DLC list
- News & updates
- Website, support URL
- Legal notices

## 🎨 UI Components

### GameDetail Page
- Hero section với background image
- Action buttons (Download/Play/Verify/Uninstall)
- Tabs: About, Screenshots, Requirements, Achievements, DLC
- Price display với discount
- Platform icons
- Review statistics

### Downloads Page
- Active downloads list
- Progress bars với speed & ETA
- Pause/Resume/Cancel controls
- Installation progress
- File size formatting

### Settings Page
- Install directory picker
- Language selector (8 languages)
- Download speed limiter
- Toggle switches cho options
- Storage information
- Save/Reset buttons

### Store Page
- Featured games carousel (auto-rotate)
- Special offers section
- Category filters
- Search functionality
- Games grid với hover effects

## 🔐 Security & Best Practices

- ✅ Input validation
- ✅ Error handling
- ✅ Rate limiting cho Steam API
- ✅ Caching để giảm API calls
- ✅ File verification
- ✅ Safe file operations

## 📦 Dependencies

### Backend
- express - Web framework
- axios - HTTP client
- dotenv - Environment variables
- cors - CORS middleware

### Frontend
- react - UI library
- react-router-dom - Routing
- lucide-react - Icons
- tailwindcss - Styling

## 🚀 Production Build

```bash
# Build frontend
npm run build

# Build Electron app
npm run build:electron
```

## 🎯 Roadmap

- [ ] Torrent support
- [ ] Cloud saves
- [ ] Friend system
- [ ] Chat integration
- [ ] Mod support
- [ ] Controller support
- [ ] Streaming integration
- [ ] Achievement tracking
- [ ] Playtime tracking
- [ ] Auto-update system

## 📝 Notes

- Steam API có rate limit, nên sử dụng caching
- File lua chỉ cần chứa Steam App ID
- Download URLs cần được cấu hình cho từng game
- Verify files hiện tại là simulation, cần implement checksum
- Launch game cần integrate với game executables

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## 🙏 Credits

- Steam API for game data
- Lucide React for icons
- TailwindCSS for styling

---

Made with ❤️ by Your Team
