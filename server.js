// ⚠️ CRITICAL: Load .env FIRST before any other imports!
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const luaParser = require('./luaParser');
const GameDataSync = require('./services/GameDataSync');
const salesUpdateService = require('./services/SalesUpdateService');
const Game = require('./models/Game');

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
const oauthRouter = require('./routes/oauth');
const passport = require('passport');

const app = express();
const PORT = process.env.API_PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/game-launcher';

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    // Auto-sync DISABLED - Use npm run sync:games to manually sync
    // setTimeout(() => {
    //   GameDataSync.startSync();
    // }, 5000);
    
    // Start sales auto-update service
    setTimeout(() => {
      salesUpdateService.startAutoUpdate();
    }, 10000); // Wait 10s before starting sales updates
  })
  .catch(err => {
    console.log('⚠️  MongoDB connection failed:', err.message);
    console.log('App will operate in degraded mode');
  });

// API Routes
app.use('/api/game-management', gameManagementRouter);
app.use('/api/steam', steamRouter);
app.use('/api/search', gameSearchRouter); // Use QuickGameSearch with 13k+ cached games
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/library', libraryRouter);
app.use('/api/downloads', downloadsRouter);
app.use('/api/advanced-downloads', advancedDownloadsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/download', downloadRouter);
app.use('/api/sales', salesRouter);
app.use('/api/top-games', topGamesRouter);
app.use('/api/auth', oauthRouter);

// Legacy routes (kept for backwards compatibility)
app.use('/api/advanced-search', advancedSearchRouter); // Lua-based search
app.use('/api/steam-game', steamGameRouter);

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
      cover: game.headerImage || `http://localhost:3000/api/steam/image/${game.appId}/header`,
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
    
    // Transform game data
    const transformedGame = {
      ...game,
      id: game.appId || game._id,
      cover: game.headerImage || `http://localhost:3000/api/steam/image/${game.appId}/header`,
      backgroundImage: game.backgroundImage || `http://localhost:3000/api/steam/image/${game.appId}/library`,
      title: game.title || 'Unknown Game',
      developer: game.developers?.[0] || 'Unknown',
      publisher: game.publishers?.[0] || 'Unknown',
      rating: game.metacritic?.score ? `${game.metacritic.score}%` : 'N/A',
      size: '50 GB',
      genres: Array.isArray(game.genres) ? game.genres.join(', ') : (game.genres || ''),
      screenshots: game.screenshots?.map((s, i) => 
        s.path_full || `http://localhost:3000/api/steam/screenshot/${game.appId}/${i}`
      ) || [
        `http://localhost:3000/api/steam/image/${game.appId}/header`,
        `http://localhost:3000/api/steam/image/${game.appId}/capsule`,
        `http://localhost:3000/api/steam/image/${game.appId}/library`
      ]
    };
    
    res.json(transformedGame);
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ error: 'Failed to fetch game details' });
  }
});

const server = app.listen(PORT, 'localhost', () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   Health: /api/health`);
  console.log(`   Games: /api/games (with pagination & search)`);
  console.log(`   Game Detail: /api/games/:id`);
  console.log(`   Featured: /api/games/featured`);
  console.log(`   On Sale: /api/games/on-sale`);
  console.log(`   Refresh: /api/games/refresh`);
  console.log(`   Cache Stats: /api/games/cache-stats`);
  console.log(`   Auth: /api/auth (register, login, verify)`);
  console.log(`   User: /api/user (profile, preferences)`);
  console.log(`   Library: /api/library (games collection)`);
  console.log(`   Downloads: /api/downloads`);
  console.log(`   Reviews: /api/reviews`);
  console.log(`   Notifications: /api/notifications`);
  console.log(`   Search: /api/search`);
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