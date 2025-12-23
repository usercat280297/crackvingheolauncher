# 🎮 CRACKVINGHEÓ - Game Launcher

A modern game launcher built with Electron, React, and Node.js. Manage your game library with style!

## ✨ Features

- 🎯 **30,000+ Games** - Browse and manage a massive game library
- 🔐 **OAuth Authentication** - Sign in with Google, GitHub, or Steam
- 📦 **Download Manager** - Advanced download system with pause/resume
- 🎨 **Modern UI** - Beautiful dark theme with smooth animations
- 💾 **Cloud Sync** - Save your library across devices
- 🔍 **Smart Search** - Find games instantly
- ⭐ **Reviews & Ratings** - Community-driven game reviews
- 🔔 **Notifications** - Stay updated with game news

## 🚀 Tech Stack

### Frontend
- **Electron** - Desktop app framework
- **React** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Lucide Icons** - Icon library

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Passport.js** - Authentication
- **WebTorrent** - P2P downloads

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/usercat280297/game-launcher.git
   cd game-launcher
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   - MongoDB URI
   - Steam API Key
   - Google OAuth credentials
   - GitHub OAuth credentials

4. **Run development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID and Secret to `.env`

### GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Add callback URL: `http://localhost:3000/api/auth/github/callback`
4. Copy Client ID and Secret to `.env`

## 📝 Scripts

```bash
# Development
npm run dev              # Run all services (Vite + Electron + Server)
npm run dev:vite         # Run Vite dev server only
npm run dev:electron     # Run Electron only
npm run dev:server       # Run backend server only

# Build
npm run build            # Build for production
npm run build:vite       # Build frontend only
npm run build:electron   # Build Electron app

# Database
npm run sync:games       # Sync game data from Steam API
```

## 🗂️ Project Structure

```
game-launcher/
├── electron/           # Electron main process
│   ├── main.js        # Main entry point
│   └── preload.js     # Preload script
├── src/               # React frontend
│   ├── components/    # UI components
│   ├── pages/         # Page components
│   ├── contexts/      # React contexts
│   └── hooks/         # Custom hooks
├── routes/            # Express routes
├── models/            # MongoDB models
├── services/          # Backend services
├── lua_files/         # Game data files
└── public/            # Static assets
```

## 🔐 Security

- All sensitive data is stored in `.env` (not committed)
- Passwords are hashed with bcrypt
- JWT tokens for authentication
- OAuth 2.0 for third-party login
- HTTPS in production

## 📄 License

This project is for educational purposes only. Game content belongs to their respective owners.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📧 Contact

- Email: usercat280297@gmail.com
- GitHub: [@usercat280297](https://github.com/usercat280297)

## 🙏 Acknowledgments

- Steam API for game data
- Epic Games for free games
- All open-source libraries used in this project

---

Made with ❤️ by usercat280297
