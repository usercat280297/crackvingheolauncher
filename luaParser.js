const fs = require('fs');
const path = require('path');
const SteamAPIService = require('./services/enhancedSteamAPI');
const Game = require('./models/Game');

class LuaGameParser {
  constructor() {
    this.luaFilesPath = path.join(__dirname, 'lua_files');
    this.gameCache = null;
    this.lastScanTime = 0;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.useSteamAPI = process.env.USE_STEAM_API !== 'false';
    this.forceRealFetch = true; // Force fetch from Steam on first load
  }

  // Parse Lua file content to extract game data
  parseLuaFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const gameData = this.extractGameInfo(content);
      return gameData;
    } catch (error) {
      console.error(`Error parsing Lua file ${filePath}:`, error);
      return null;
    }
  }

  // Extract game information from Lua content
  extractGameInfo(luaContent) {
    const gameInfo = {};

    // Method 1: Handle addappid() format
    const appIdMatches = luaContent.match(/addappid\((\d+)\)/g);
    if (appIdMatches && appIdMatches.length > 0) {
      const firstMatch = appIdMatches[0].match(/addappid\((\d+)\)/);
      if (firstMatch) {
        gameInfo.appId = parseInt(firstMatch[1]);
        return gameInfo;
      }
    }

    // Method 2: Handle simple number format (just appid)
    const simpleAppId = luaContent.match(/^\s*(\d+)\s*$/m);
    if (simpleAppId) {
      gameInfo.appId = parseInt(simpleAppId[1]);
      return gameInfo;
    }

    // Method 3: Extract from filename (e.g., 480.lua -> appid 480)
    const filename = path.basename(luaContent);
    const filenameMatch = filename.match(/^(\d+)\.lua$/);
    if (filenameMatch) {
      gameInfo.appId = parseInt(filenameMatch[1]);
      return gameInfo;
    }

    // Method 4: Handle AppInfo format (original)
    const appIdMatch = luaContent.match(/["']appid["']\s*["']?(\d+)["']?/i);
    if (appIdMatch) {
      gameInfo.appId = parseInt(appIdMatch[1]);
      return gameInfo;
    }

    // Method 5: Any number in the file
    const anyNumber = luaContent.match(/\b(\d{3,})\b/);
    if (anyNumber) {
      gameInfo.appId = parseInt(anyNumber[1]);
      return gameInfo;
    }

    return gameInfo;
  }

  // Get all Lua files from lua_files directory
  getAllLuaFiles() {
    try {
      if (!fs.existsSync(this.luaFilesPath)) {
        console.log('❌ lua_files directory not found at:', this.luaFilesPath);
        return [];
      }

      const files = fs.readdirSync(this.luaFilesPath);
      const luaFiles = files.filter(file => file.endsWith('.lua'));
      
      console.log(`📂 Found ${luaFiles.length} .lua files in ${this.luaFilesPath}`);
      return luaFiles;
    } catch (error) {
      console.error('Error reading lua_files directory:', error);
      return [];
    }
  }

  // Extract App IDs from filenames (fastest method)
  extractAppIdsFromFilenames(luaFiles) {
    const appIds = new Set();
    
    luaFiles.forEach(file => {
      // Extract appid from filename: "480.lua" -> 480
      const match = file.match(/^(\d+)\.lua$/);
      if (match) {
        appIds.add(parseInt(match[1]));
      }
    });
    
    return Array.from(appIds);
  }

  // Parse all Lua files and fetch from Steam API
  async parseAllGames() {
    const now = Date.now();
    
    // Check cache
    if (this.gameCache && (now - this.lastScanTime) < this.CACHE_DURATION) {
      console.log(`💾 Using cached data: ${this.gameCache.length} games`);
      return this.gameCache;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎮 GAME LIBRARY INITIALIZATION`);
    console.log(`${'='.repeat(60)}\n`);

    const luaFiles = this.getAllLuaFiles();
    
    if (luaFiles.length === 0) {
      console.log('❌ No .lua files found!');
      console.log(`📍 Looking in: ${this.luaFilesPath}`);
      console.log(`\n💡 Tip: Make sure your lua_files folder exists and contains .lua files`);
      return [];
    }

    // Try to extract App IDs from filenames first (fastest)
    let appIds = this.extractAppIdsFromFilenames(luaFiles);
    
    // If filename extraction failed, parse file contents
    if (appIds.length === 0) {
      console.log(`📄 Parsing file contents...`);
      const appIdSet = new Set();
      
      for (const file of luaFiles) {
        const filePath = path.join(this.luaFilesPath, file);
        const gameData = this.parseLuaFile(filePath);
        
        if (gameData && gameData.appId) {
          appIdSet.add(gameData.appId);
        }
      }
      
      appIds = Array.from(appIdSet);
    }

    console.log(`✅ Extracted ${appIds.length} unique App IDs from ${luaFiles.length} files`);

    if (appIds.length === 0) {
      console.log(`\n❌ Could not extract any App IDs!`);
      console.log(`📋 Example lua file content should be:`);
      console.log(`   addappid(480)`);
      console.log(`   OR just: 480`);
      console.log(`   OR filename: 480.lua`);
      return [];
    }

    // Show some examples
    console.log(`📋 Sample App IDs: ${appIds.slice(0, 10).join(', ')}...`);

    // Fetch from Steam API if enabled
    if (this.useSteamAPI && this.forceRealFetch) {
      console.log(`\n🔑 Steam API: ${process.env.STEAM_API_KEY ? 'Configured ✅' : 'Not configured ❌'}`);
      
      if (!process.env.STEAM_API_KEY) {
        console.log(`\n⚠️  Warning: STEAM_API_KEY not set in .env`);
        console.log(`   Using basic data without Steam API\n`);
        const games = this.createBasicGameData(appIds);
        this.gameCache = games;
        this.lastScanTime = now;
        return games;
      }

      // Check which games are already in DB
      const existingGames = await Game.find({ appId: { $in: appIds } }, 'appId').lean();
      const existingAppIds = new Set(existingGames.map(g => g.appId));
      const missingAppIds = appIds.filter(id => !existingAppIds.has(id));
      
      console.log(`💾 Found ${existingAppIds.size} games already in Database`);
      console.log(`🆕 Need to fetch ${missingAppIds.length} new games`);

      if (missingAppIds.length === 0) {
        console.log(`✅ All games are already in database!\n`);
        // Load from DB
        const games = await Game.find({ appId: { $in: appIds } }).lean();
        this.gameCache = games;
        this.lastScanTime = now;
        return games;
      }

      console.log(`🚀 Starting real Steam API fetch for ${missingAppIds.length} games...`);
      console.log(`⏱️  This will take approximately ${Math.ceil(missingAppIds.length * 1.2 / 60)} minutes\n`);
      
      const newGames = await SteamAPIService.batchFetchGames(
        missingAppIds,
        (current, total, gameData) => {
          // Progress callback - already handled in batchFetchGames
        }
      );

      // Load all games from DB (existing + newly fetched)
      const allGames = await Game.find({ appId: { $in: appIds } }).lean();
      this.gameCache = allGames;
      this.lastScanTime = now;
      
      return allGames;
    } else if (this.useSteamAPI) {
      console.log(`\n🔑 Steam API: ${process.env.STEAM_API_KEY ? 'Configured ✅' : 'Not configured ❌'}`);
      
      if (!process.env.STEAM_API_KEY) {
        console.log(`\n⚠️  Warning: STEAM_API_KEY not set in .env`);
        console.log(`   Using basic data without Steam API\n`);
        const games = this.createBasicGameData(appIds);
        this.gameCache = games;
        this.lastScanTime = now;
        return games;
      }

      // Check which games are already in DB
      const existingGames = await Game.find({ appId: { $in: appIds } }, 'appId').lean();
      const existingAppIds = new Set(existingGames.map(g => g.appId));
      const missingAppIds = appIds.filter(id => !existingAppIds.has(id));
      
      console.log(`💾 Found ${existingAppIds.size} games already in Database`);
      console.log(`🆕 Need to fetch ${missingAppIds.length} new games`);

      if (missingAppIds.length === 0) {
        console.log(`✅ All games are already in database!\n`);
        // Load from DB
        const games = await Game.find({ appId: { $in: appIds } }).lean();
        this.gameCache = games;
        this.lastScanTime = now;
        return games;
      }

      const newGames = await SteamAPIService.batchFetchGames(
        missingAppIds,
        (current, total, gameData) => {
          // Progress callback - already handled in batchFetchGames
        }
      );

      // Load all games from DB (existing + newly fetched)
      const allGames = await Game.find({ appId: { $in: appIds } }).lean();
      this.gameCache = allGames;
      this.lastScanTime = now;
      
      return allGames;
    } else {
      console.log(`\n⚠️  Steam API disabled (USE_STEAM_API=false)`);
      console.log(`   Using basic data without Steam API\n`);
      const games = this.createBasicGameData(appIds);
      
      this.gameCache = games;
      this.lastScanTime = now;
      
      return games;
    }
  }

  // Create basic game data without Steam API (fallback)
  createBasicGameData(appIds) {
    console.log(`📦 Creating basic game data for ${appIds.length} games...`);
    
    return appIds.map(appId => ({
      id: appId,
      steamAppId: appId,
      title: `Game ${appId}`,
      name: `Game ${appId}`,
      description: `Steam Game ID: ${appId}`,
      cover: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      developer: 'Unknown',
      publisher: 'Unknown',
      releaseDate: 'Unknown',
      genres: 'Unknown',
      rating: 'N/A',
      size: 'Unknown',
      featured: false,
      onSale: false,
      discount: 0,
      originalPrice: 'N/A',
      salePrice: 'N/A',
      isFree: false,
      tool: false,
      oslist: 'windows',
      platforms: { windows: true, mac: false, linux: false }
    }));
  }

  // Fetch single game from Steam
  async fetchGameFromSteam(appId) {
    console.log(`🔍 Fetching game ${appId} from Steam API...`);
    const gameData = await SteamAPIService.getGameDetails(appId);
    
    if (gameData) {
      console.log(`✓ ${gameData.title}`);
      return gameData;
    } else {
      console.log(`✗ Failed to fetch game ${appId}`);
      return null;
    }
  }

  // Get cache stats
  getCacheStats() {
    return {
      gamesCached: this.gameCache ? this.gameCache.length : 0,
      lastScanTime: this.lastScanTime ? new Date(this.lastScanTime).toISOString() : 'Never',
      cacheDuration: `${this.CACHE_DURATION / 1000 / 60} minutes`,
      steamCacheStats: SteamAPIService.getCacheStats(),
      steamAPIEnabled: this.useSteamAPI,
      luaFilesPath: this.luaFilesPath
    };
  }

  // Clear all caches
  clearCache() {
    this.gameCache = null;
    this.lastScanTime = 0;
    SteamAPIService.clearCache();
    console.log('🗑️  All caches cleared');
  }

  // Force refresh from Steam
  async forceRefresh() {
    console.log('🔄 Force refresh initiated...');
    this.clearCache();
    return await this.parseAllGames();
  }
}

module.exports = new LuaGameParser();