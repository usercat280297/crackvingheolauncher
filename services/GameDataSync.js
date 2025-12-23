const fs = require('fs');
const path = require('path');
const Game = require('../models/Game');
const steamAPIService = require('./enhancedSteamAPI');
const luaParser = require('../luaParser');

class GameDataSync {
  constructor() {
    this.steamAPI = steamAPIService;
    this.isSyncing = false;
    this.totalGames = 0;
    this.processed = 0;
    this.success = 0;
    this.failed = 0;
    this.rateLimited = 0;
  }

  async startSync() {
    if (this.isSyncing) {
      console.log('⚠️  Game sync already in progress');
      return;
    }

    this.isSyncing = true;
    console.log('🚀 Starting Game Data Sync...');

    try {
      // 1. Get all AppIDs from Lua files
      const luaFiles = luaParser.getAllLuaFiles();
      const appIds = new Set();
      
      luaFiles.forEach(file => {
        // Method: Extract from filename (fastest and most reliable for this structure)
        const match = file.match(/^(\d+)\.lua$/);
        if (match) {
          appIds.add(parseInt(match[1]));
        }
      });

      console.log(`📂 Found ${appIds.size} unique AppIDs from Lua files`);
      this.totalGames = appIds.size;

      // 2. Get existing games in DB to skip
      const existingGames = await Game.find({}, 'appId').lean();
      const existingAppIds = new Set(existingGames.map(g => g.appId));
      
      console.log(`💾 Found ${existingAppIds.size} games already in Database`);

      // 3. Filter missing games
      const missingAppIds = [...appIds].filter(id => !existingAppIds.has(id));
      
      console.log(`Hz Need to fetch details for ${missingAppIds.length} new games`);

      if (missingAppIds.length === 0) {
        console.log('✅ All games are already synced!');
        this.isSyncing = false;
        return;
      }

      // 4. Process queue with rate limiting
      await this.processQueue(missingAppIds);

    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async processQueue(appIds) {
    // Process in batches to respect rate limits
    // Single request per batch with delay to be safe
    const BATCH_SIZE = 1; 
    const DELAY_MS = 2000; 
    
    console.log(`🚀 Starting processing of ${appIds.length} games...`);
    console.log(`ℹ️  Batch size: ${BATCH_SIZE}, Delay: ${DELAY_MS}ms`);

    for (let i = 0; i < appIds.length; i += BATCH_SIZE) {
      if (!this.isSyncing) break;
      
      const batch = appIds.slice(i, i + BATCH_SIZE);
      
      try {
        await Promise.all(batch.map(appId => this.fetchAndSaveGame(appId)));
      } catch (error) {
        if (error.response && error.response.status === 429) {
          console.log('⚠️  Rate limit hit (429). Pausing for 60 seconds...');
          await new Promise(resolve => setTimeout(resolve, 60000));
          // Retry logic could be added here, but for now we just pause and continue (might miss this batch)
          // To properly retry, we would need to decrement i
          i -= BATCH_SIZE; 
        } else {
          console.error('Error processing batch:', error.message);
        }
      }
      
      // Calculate progress
      const progress = Math.round(((i + batch.length) / appIds.length) * 1000) / 10;
      if (i % 10 === 0) {
        console.log(`📊 Sync Progress: ${i + batch.length}/${appIds.length} (${progress}%) | ✅ ${this.success} | ❌ ${this.failed}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
    
    this.isSyncing = false;
    console.log('✅ Game data sync completed');
    console.log(`📊 Final Stats: Total: ${this.totalGames} | Success: ${this.success} | Failed: ${this.failed}`);
  }

  async fetchAndSaveGame(appId) {
    try {
      // Fetch from Steam
      const details = await this.steamAPI.getFullGameDetails(appId);
      
      if (!details) {
        // Even if Steam API fails (removed game?), create a basic entry so we don't keep retrying
        // or maybe we want to retry later? For now, let's create a placeholder if it's in Lua
        await this.createBasicEntry(appId);
        this.failed++;
        return;
      }

      // Map to our Schema
      const gameData = {
        appId: details.steamAppId,
        title: details.name,
        description: details.description,
        detailedDescription: details.detailedDescription,
        shortDescription: details.description, // Steam often mixes these
        aboutTheGame: details.aboutGame,
        headerImage: details.cover,
        capsuleImage: details.capsuleImage,
        backgroundImage: details.backgroundImage,
        developers: details.developer ? details.developer.split(', ') : [],
        publishers: details.publisher ? details.publisher.split(', ') : [],
        genres: details.genres ? details.genres.split(', ') : [],
        releaseDate: details.releaseDate,
        comingSoon: details.comingSoon,
        price: details.price,
        isFree: details.isFree,
        platforms: details.platforms,
        metacritic: details.metacritic,
        recommendations: details.recommendations,
        achievements: details.achievements ? {
          total: details.achievements.total,
          highlighted: details.achievements.list
        } : { total: 0 },
        screenshots: details.screenshots,
        movies: details.movies,
        pcRequirements: details.pcRequirements,
        
        steamUrl: `https://store.steampowered.com/app/${appId}`,
        steamDbUrl: `https://steamdb.info/app/${appId}`,
        
        hasLua: true,
        luaFile: `${appId}.lua`,
        lastUpdated: new Date()
      };

      // Upsert
      await Game.findOneAndUpdate({ appId: appId }, gameData, { upsert: true, new: true });
      this.success++;

    } catch (error) {
      console.error(`Error saving game ${appId}:`, error.message);
      this.failed++;
    }
  }

  async createBasicEntry(appId) {
    // Create a minimal entry for games not on Steam Store anymore
    try {
      await Game.findOneAndUpdate({ appId: appId }, {
        appId: appId,
        title: `Unknown Game (${appId})`,
        description: 'Data not available on Steam Store',
        hasLua: true,
        luaFile: `${appId}.lua`,
        steamDbUrl: `https://steamdb.info/app/${appId}`,
        lastUpdated: new Date()
      }, { upsert: true });
    } catch (e) {
      console.error('Failed to create basic entry', e);
    }
  }
}

module.exports = new GameDataSync();
