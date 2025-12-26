// ⚠️ CRITICAL: Load .env FIRST before any other imports!
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');
const luaParser = require('./luaParser');
const GameDataSync = require('./services/GameDataSync');
const salesUpdateService = require('./services/SalesUpdateService');
const { getInstance: getOptimizedSteamGridDB } = require('./services/OptimizedSteamGridDBService');
const SteamAchievementService = require('./services/SteamAchievementService');
const SteamDLCService = require('./services/SteamDLCService');
const SteamSizeService = require('./services/SteamAPISizeService');
const SteamVideoService = require('./services/SteamVideoService');
const Game = require('./models/Game');

// 🚀 Auto-update và Cache Services
const cacheManager = require('./services/cacheManager');
const { getInstance: getOptimizedSteamAPI } = require('./services/OptimizedSteamAPIService');
const autoUpdateScheduler = require('./services/autoUpdateScheduler');
// const realTimeService = require('./services/realTimeUpdateService'); // ⚠️  DISABLED - Use optimized services
const imageCacheManager = require('./services/ImageCacheManager');
const { smartCache, warmCache, cacheStats, cacheControl } = require('./middleware/cacheMiddleware');

const gameSearchRouter = require('./routes/gameSearch');
const steamGameRouter = require('./routes/steamGame');
const steamRouter = require('./routes/steam');
const advancedSearchRouter = require('./routes/advancedSearch');
const gameManagementRouter = require('./routes/gameManagement');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const libraryRouter = require('./routes/library');
const downloadsRouter = require('./routes/downloads');
const advancedDownloadsRouter = require('./routes/advancedDownloads');
const reviewsRouter = require('./routes/reviews');
const notificationsRouter = require('./routes/notifications');
const downloadRouter = require('./routes/download');
const salesRouter = require('./routes/sales');
const topGamesRouter = require('./routes/topGames');
const mostPopularRouter = require('./routes/mostPopular');
const gameImagesRouter = require('./routes/gameImages');
const TorrentDownloadManager = require('./services/TorrentDownloadManager');
const torrentDownloadRouter = require('./routes/torrentDownloadEnhanced');
const torrentDBRouter = require('./routes/torrentDB');
const oauthRouter = require('./routes/oauth');
const playtimeRouter = require('./routes/playtime');
const steamDownloadRouter = require('./routes/steamDownload');
const featuredGamesRouter = require('./routes/featuredGames');
const commentsRouter = require('./routes/comments');
const steamGridDBRouter = require('./routes/steamGridDB');
const popularGamesRouter = require('./routes/popularGames');
const denuvoRouter = require('./routes/denuvo');
const passport = require('passport');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
global.io = io;

const PORT = process.env.API_PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/game-launcher';

// 🚀 Initialize WebTorrent (ESM module) before using torrent routes
TorrentDownloadManager.initializeAsync().catch(err => {
  console.error('❌ Failed to initialize WebTorrent:', err.message);
  console.warn('⚠️  Torrent download features will not work');
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// 🚀 Cache middleware - DISABLED
// app.use(smartCache());
// app.use(cacheStats());
// app.use(cacheControl());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    
    // 🔥 Warm up cache
    await warmCache();
    
    // 🎨 Start ImageCacheManager background sync
    console.log('🎨 Starting ImageCacheManager background sync...');
    imageCacheManager.startBackgroundSync();
    
    // Auto-sync DISABLED - Use npm run sync:games to manually sync
    // setTimeout(() => {
    //   GameDataSync.startSync();
    // }, 5000);
    // }, 5000);
    
    // Start sales auto-update service
    setTimeout(() => {
      salesUpdateService.startAutoUpdate();
    }, 10000); // Wait 10s before starting sales updates
    
    // 🚀 Start auto-update scheduler
    console.log('🚀 Starting auto-update services...');
  })
  .catch(err => {
    console.log('⚠️  MongoDB connection failed:', err.message);
    console.log('App will operate in degraded mode');
  });

app.use('/api/game-management', gameManagementRouter);
app.use('/api/steam', steamRouter);
app.use('/api/search', gameSearchRouter); // Use QuickGameSearch with 13k+ cached games
app.use('/api/auth', authRouter);
app.use('/api/auth', oauthRouter); // OAuth routes under /api/auth
app.use('/api/user', userRouter);
app.use('/api/library', libraryRouter);
app.use('/api/downloads', downloadsRouter);
app.use('/api/advanced-downloads', advancedDownloadsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/download', downloadRouter);
app.use('/api/sales', salesRouter);
app.use('/api/top-games', topGamesRouter);
app.use('/api/most-popular', mostPopularRouter);
app.use('/api/popular-games', popularGamesRouter);
app.use('/api/game-images', gameImagesRouter);
app.use('/api/torrent', torrentDownloadRouter);
app.use('/api/torrent-db', torrentDBRouter);
app.use('/api/playtime', playtimeRouter);
app.use('/api/steam-download', steamDownloadRouter);
app.use('/api/games/featured', featuredGamesRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/steam-grid-db', steamGridDBRouter);

// 🎯 Denuvo detection API
app.use('/api/denuvo', denuvoRouter);

// Legacy routes (kept for backwards compatibility)
// app.use('/api/advanced-search', advancedSearchRouter); // Lua-based search
// app.use('/api/steam-game', steamGameRouter);

// Get high-quality images for a game
app.get('/api/games/:id/images', async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const images = await SteamGridDBService.getAllImagesBySteamId(appId);
    
    if (!images) {
      return res.status(404).json({ 
        error: 'Images not found',
        fallback: {
          cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
        }
      });
    }
    
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update game images
app.post('/api/games/:id/update-images', async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const images = await SteamGridDBService.getAllImagesBySteamId(appId);
    
    if (!images) {
      return res.status(404).json({ error: 'Images not found' });
    }
    
    // Update game in database
    await Game.findOneAndUpdate(
      { appId },
      { 
        'images.cover': images.cover,
        'images.hero': images.hero,
        'images.logo': images.logo,
        'images.icon': images.icon
      }
    );
    
    res.json({ success: true, images });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SteamGridDB cache stats
app.get('/api/steamgriddb/stats', (req, res) => {
  const stats = SteamGridDBService.getCacheStats();
  res.json({
    cacheSize: stats.size,
    apiKeyConfigured: !!process.env.STEAMGRIDDB_API_KEY,
    cachedKeys: stats.keys
  });
});

// Clear SteamGridDB cache
app.post('/api/steamgriddb/clear-cache', (req, res) => {
  SteamGridDBService.clearCache();
  res.json({ success: true, message: 'SteamGridDB cache cleared' });
});

// Get game videos/trailers
app.get('/api/games/:id/videos', async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const videos = await SteamVideoService.fetchGameVideos(appId);
    res.json({ success: true, videos, count: videos.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get main trailer only
app.get('/api/games/:id/trailer', async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const trailer = await SteamVideoService.getMainTrailer(appId);
    if (trailer) {
      res.json({ success: true, trailer });
    } else {
      res.status(404).json({ success: false, error: 'No trailer found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get game achievements
app.get('/api/games/:id/achievements', async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const userId = req.query.userId || 'demo'; // Get from auth later
    const data = await SteamAchievementService.getAchievementsWithProgress(appId, userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unlock achievement
app.post('/api/games/:id/achievements/:name/unlock', async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const achievementName = req.params.name;
    const userId = req.body.userId || 'demo';
    
    const success = await SteamAchievementService.unlockAchievement(appId, achievementName, userId);
    
    if (success) {
      res.json({ success: true, message: 'Achievement unlocked!' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to unlock achievement' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get game DLCs
app.get('/api/games/:id/dlcs', async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const userId = req.query.userId || 'demo';
    const dlcs = await SteamDLCService.getDLCsWithStatus(appId, userId);
    res.json({ success: true, dlcs, count: dlcs.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get game size
app.get('/api/games/:id/size', async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const forceRefresh = req.query.refresh === 'true';
    
    if (forceRefresh) {
      SteamSizeService.cache.delete(`size_${appId}`);
    }
    
    const size = await SteamSizeService.getGameSize(appId);
    res.json({ success: true, size });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get game size with DLCs
app.get('/api/games/:id/size/full', async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const dlcIds = req.query.dlcs ? req.query.dlcs.split(',').map(id => parseInt(id)) : [];
    const breakdown = await SteamSizeService.getSizeBreakdown(appId, dlcIds);
    res.json({ success: true, ...breakdown });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear size cache
app.post('/api/games/size/clear-cache', (req, res) => {
  SteamSizeService.clearCache();
  res.json({ success: true, message: 'Size cache cleared' });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const count = await Game.countDocuments();
  res.json({
    status: 'ok',
    gamesIndexed: count,
    steamAPIEnabled: process.env.USE_STEAM_API !== 'false',
    isSyncing: GameDataSync.isSyncing
  });
});

// Get all games with pagination (MongoDB Version)
app.get('/api/games', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const category = req.query.category || 'All';
    
    const query = {};
    
    // Search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Category Filter
    if (category !== 'All') {
      query.genres = category;
    }

    const totalGames = await Game.countDocuments(query);
    const games = await Game.find(query)
      .sort(search ? { score: { $meta: "textScore" } } : { title: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-__v')
      .lean(); // Use lean for better performance
    
    // Transform games to include cover field
    const transformedGames = games.map(game => ({
      ...game,
      id: game.appId || game._id,
      // ✨ Dùng high-quality images
      cover: game.images?.cover || 
             game.images?.steamHeader || 
             game.headerImage ||
             `http://localhost:3000/api/steam/image/${game.appId}/header`,
      hero: game.images?.hero || 
            game.images?.steamLibrary,
      logo: game.images?.logo,
      backgroundImage: game.images?.hero || 
                       game.images?.steamBackground ||
                       `https://cdn.akamai.steamstatic.com/steam/apps/${game.appId}/page_bg_generated_v6b.jpg`,
      screenshots: game.images?.screenshots || [],
      title: game.title || 'Unknown Game',
      developer: game.developers?.[0] || 'Unknown',
      rating: game.metacritic?.score ? `${game.metacritic.score}%` : 'N/A',
      size: '50 GB', // Default
      genres: Array.isArray(game.genres) ? game.genres.join(', ') : (game.genres || '')
    }));
    
    console.log(`Serving page ${page}: ${transformedGames.length} games (${totalGames} total)`);
    
    res.json({
      games: transformedGames,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalGames / limit),
        totalGames: totalGames,
        hasNext: page * limit < totalGames,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Sync status endpoint
app.get('/api/games/sync-status', (req, res) => {
  res.json({
    isSyncing: GameDataSync.isSyncing,
    total: GameDataSync.totalGames,
    processed: GameDataSync.processed,
    success: GameDataSync.success,
    failed: GameDataSync.failed
  });
});

// Force refresh cache endpoint (Trigger Sync)
app.get('/api/games/refresh', (req, res) => {
  if (GameDataSync.isSyncing) {
    return res.status(400).json({ message: 'Sync already in progress' });
  }
  
  GameDataSync.startSync();
  res.json({ message: 'Sync started' });
});

// Clear cache endpoint (Clear DB)
app.post('/api/games/clear-cache', async (req, res) => {
  try {
    await Game.deleteMany({});
    res.json({ 
      success: true,
      message: 'All game data cleared from database' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to clear database' 
    });
  }
});

// Get cache stats
app.get('/api/games/cache-stats', async (req, res) => {
  const count = await Game.countDocuments();
  res.json({
    success: true,
    stats: {
      gamesCached: count,
      steamAPIEnabled: process.env.USE_STEAM_API !== 'false',
      syncStatus: {
        isSyncing: GameDataSync.isSyncing,
        processed: GameDataSync.processed,
        total: GameDataSync.totalGames
      }
    },
    currentGames: count,
    isLoading: GameDataSync.isSyncing
  });
});

// Get featured games
app.get('/api/games/featured', async (req, res) => {
  try {
    // Get games with high ratings or on sale from MongoDB
    const featuredGames = await Game.find({
      $or: [
        { onSale: true },
        { rating: { $gte: '80' } } // Assuming rating is stored as string in mixed schema, or adjust if number
      ]
    })
    .sort({ rating: -1 })
    .limit(10);
    
    res.json(featuredGames);
  } catch (error) {
    console.error('Error fetching featured games:', error);
    res.status(500).json({ error: 'Failed to fetch featured games' });
  }
});

// Get games on sale
app.get('/api/games/on-sale', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const onSaleGames = await Game.find({ 
      onSale: true,
      discount: { $gt: 0 }
    })
    .sort({ discount: -1 })
    .limit(limit);
    
    res.json(onSaleGames);
  } catch (error) {
    console.error('Error fetching on-sale games:', error);
    res.status(500).json({ error: 'Failed to fetch on-sale games' });
  }
});
// Get single game by ID
app.get('/api/games/:id', async (req, res) => {
  try {
    const gameId = req.params.id;
    
    // Try to find by appId (Number) or _id (ObjectId)
    let game;
    if (!isNaN(gameId)) {
      game = await Game.findOne({ appId: parseInt(gameId) }).lean();
    } else {
      game = await Game.findById(gameId).lean();
    }
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Auto-fetch images nếu chưa có
    if (!game.images?.cover) {
      SteamGridDBService.getAllImagesBySteamId(game.appId)
        .then(images => {
          if (images) {
            Game.findOneAndUpdate(
              { appId: game.appId },
              { images }
            ).catch(err => console.error('Failed to update images:', err));
          }
        })
        .catch(err => console.error('Failed to fetch images:', err));
    }
    
    // Transform game data
    const transformedGame = {
      ...game,
      id: game.appId || game._id,
      // ✨ Ưu tiên SteamGridDB cover (vertical poster đẹp)
      cover: game.images?.cover || 
             game.headerImage ||
             game.images?.steamHeader || 
             `http://localhost:3000/api/steam/image/${game.appId}/header`,
      hero: game.images?.hero || 
            game.images?.steamLibrary,
      logo: game.images?.logo,
      backgroundImage: game.images?.hero || 
                       game.images?.steamBackground ||
                       `http://localhost:3000/api/steam/image/${game.appId}/library`,
      screenshots: game.images?.screenshots || game.screenshots?.map((s, i) => 
        s.path_full || `http://localhost:3000/api/steam/screenshot/${game.appId}/${i}`
      ) || [
        `http://localhost:3000/api/steam/image/${game.appId}/header`,
        `http://localhost:3000/api/steam/image/${game.appId}/capsule`,
        `http://localhost:3000/api/steam/image/${game.appId}/library`
      ],
      title: game.title || 'Unknown Game',
      developer: game.developers?.[0] || 'Unknown',
      publisher: game.publishers?.[0] || 'Unknown',
      rating: game.metacritic?.score ? `${game.metacritic.score}%` : 'N/A',
      size: '50 GB',
      genres: Array.isArray(game.genres) ? game.genres.join(', ') : (game.genres || '')
    };
    
    res.json(transformedGame);
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ error: 'Failed to fetch game details' });
  }
});

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

server.listen(PORT, 'localhost', () => {
  console.log(`🚀 API server running on port ${PORT}`);
  
  // 🔌 Setup WebSocket for real-time updates (via socket.io global)
  // realTimeService.setupWebSocketServer(server); // ⚠️ DISABLED - using optimized services
  console.log('✅ WebSocket server setup complete');
  
  console.log(`📊 Available endpoints:`);
  console.log(`   Health: /api/health`);
  console.log(`   Games: /api/games (with pagination & search)`);
  console.log(`   Game Detail: /api/games/:id`);
  console.log(`   Featured: /api/games/featured`);
  console.log(`   On Sale: /api/games/on-sale`);
  console.log(`   Refresh: /api/games/refresh`);
  console.log(`   Cache Stats: /api/cache/stats`);
  console.log(`   Cache Control: /api/cache/clear, /api/cache/refresh, /api/cache/status`);
  console.log(`   Auth: /api/auth (register, login, verify)`);
  console.log(`   User: /api/user (profile, preferences)`);
  console.log(`   Library: /api/library (games collection)`);
  console.log(`   Downloads: /api/downloads`);
  console.log(`   Reviews: /api/reviews`);
  console.log(`   Notifications: /api/notifications`);
  console.log(`   Search: /api/search`);
  console.log(`🔄 Auto-update scheduler: ACTIVE`);
  console.log(`🔌 WebSocket real-time updates: ACTIVE`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
  } else {
    console.error(`❌ Server error: ${err.message}`);
  }
});

server.on('listening', () => {
  console.log(`✅ Server is now listening on port ${PORT}`);
  console.log(`🔑 Steam API: ${process.env.STEAM_API_KEY ? 'Configured' : 'Not configured'}`);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});