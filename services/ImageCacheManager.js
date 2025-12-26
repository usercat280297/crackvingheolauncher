const path = require('path');
const fs = require('fs-extra');
const SteamGridDBService = require('./SteamGridDBService');
const Game = require('../models/Game');
const cron = require('node-cron');

/**
 * 🚀 ImageCacheManager - Background Cache Sync
 * 
 * Features:
 * - Auto-cache images từ SteamGridDB
 * - Background sync every 1 hour
 * - 20 games per sync batch
 * - Smart cache invalidation
 */

class ImageCacheManager {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.totalCached = 0;
    this.totalFailed = 0;
  }

  /**
   * Start background cache sync (runs every 1 hour)
   */
  startBackgroundSync() {
    // Run every 1 hour
    cron.schedule('0 * * * *', async () => {
      await this.syncCacheBatch();
    });

    console.log('✅ ImageCacheManager: Background sync scheduled (every 1 hour)');

    // Initial sync after 5 minutes
    setTimeout(() => {
      this.syncCacheBatch().catch(err => console.error('Initial cache sync failed:', err));
    }, 5 * 60 * 1000);
  }

  /**
   * Sync 20 games without cached images
   */
  async syncCacheBatch(limit = 20) {
    if (this.isSyncing) {
      console.warn('⚠️  Cache sync already in progress, skipping batch');
      return;
    }

    this.isSyncing = true;
    console.log(`🔄 Starting image cache sync (batch: ${limit} games)...`);

    try {
      // Find games without complete image cache
      const gamesToCache = await Game.find({
        $or: [
          { images: { $exists: false } },
          { 'images.cover': null },
          { lastImageCacheUpdate: { $exists: false } }
        ],
        title: { $nin: ['Unknown Game', 'Unknown'] }
      })
      .limit(limit)
      .select('_id appId title')
      .lean();

      console.log(`📊 Found ${gamesToCache.length} games to cache`);

      if (gamesToCache.length === 0) {
        console.log('✅ All games have cached images');
        this.isSyncing = false;
        return;
      }

      // Process each game
      for (const game of gamesToCache) {
        try {
          await this.fetchAndCacheImages(game.appId);
          this.totalCached++;
        } catch (error) {
          console.error(`❌ Failed to cache ${game.title}:`, error.message);
          this.totalFailed++;
        }

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.lastSyncTime = new Date();
      console.log(`✅ Cache sync completed: ${this.totalCached} cached, ${this.totalFailed} failed`);

    } catch (error) {
      console.error('❌ Cache sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Fetch images from SteamGridDB and cache in MongoDB
   */
  async fetchAndCacheImages(steamAppId) {
    try {
      const game = await Game.findOne({ appId: steamAppId });
      if (!game) {
        throw new Error(`Game ${steamAppId} not found`);
      }

      // Check if cache is still valid (less than 7 days old)
      if (game.lastImageCacheUpdate) {
        const cacheAge = Date.now() - game.lastImageCacheUpdate.getTime();
        if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
          console.log(`✅ [CACHE FRESH] ${game.title} - Cache age: ${Math.floor(cacheAge / 60000)} minutes`);
          return game.images;
        }
      }

      console.log(`🔍 Fetching images for: ${game.title}`);

      // Get SteamGridDB game ID (may be missing for some appIds)
      const sgdbGame = await SteamGridDBService.getGameBySteamId(steamAppId);
      if (!sgdbGame?.id) {
        console.warn(`⚠️ SteamGridDB game not found for ${steamAppId}, using Steam fallbacks only`);
      }

      // Fetch all image types in parallel (if we have an SGDB game id)
      let grids = [];
      let heroes = [];
      let logos = [];
      let icons = [];

      if (sgdbGame?.id) {
        [grids, heroes, logos, icons] = await Promise.all([
          SteamGridDBService.getGrids(sgdbGame.id, { limit: 3 }).catch(() => []),
          SteamGridDBService.getHeroes(sgdbGame.id, { limit: 2 }).catch(() => []),
          SteamGridDBService.getLogos(sgdbGame.id, { limit: 2 }).catch(() => []),
          SteamGridDBService.getIcons(sgdbGame.id, { limit: 2 }).catch(() => [])
        ]);
      } else {
        // No SGDB data available - continue with empty arrays so we fall back to Steam images
        grids = [];
        heroes = [];
        logos = [];
        icons = [];
      }

      // Sanitize screenshots - convert objects to string URLs (prefer full path)
      const screenshotUrls = (game.screenshots || [])
        .filter(s => s)
        .slice(0, 5)
        .map(s => {
          if (typeof s === 'string') return s;
          return s.path_full || s.path_full || s.path_full || s.path_thumbnail || s.path_thumbnail || s.path_full || null;
        })
        .filter(Boolean);

      // Build cache object
      const images = {
        // Grid (cover) images
        cover: grids?.[0]?.url || null,
        coverThumb: grids?.[0]?.thumb || null,
        coverAlt1: grids?.[1]?.url || null,
        coverAlt2: grids?.[2]?.url || null,

        // Hero images
        hero: heroes?.[0]?.url || null,
        heroThumb: heroes?.[0]?.thumb || null,
        heroAlt: heroes?.[1]?.url || null,

        // Logo images
        logo: logos?.[0]?.url || null,
        logoThumb: logos?.[0]?.thumb || null,
        logoAlt: logos?.[1]?.url || null,

        // Icon images
        icon: icons?.[0]?.url || null,
        iconThumb: icons?.[0]?.thumb || null,
        iconAlt: icons?.[1]?.url || null,

        // Steam original images
        steamHeader: game.headerImage,
        steamLibrary: game.capsuleImage,
        steamBackground: game.backgroundImage,

        // Screenshots (string URLs)
        screenshots: screenshotUrls,

        // Cache metadata
        source: sgdbGame?.id ? 'SteamGridDB' : 'SteamFallback',
        cachedAt: new Date(),
        imageCount: (grids?.length || 0) + (heroes?.length || 0) + (logos?.length || 0) + (icons?.length || 0) + screenshotUrls.length
      };

      // If we ended up with zero images, log a warning so we can inspect later
      if (!images.imageCount || images.imageCount === 0) {
        console.warn(`⚠️ No images found for ${game.title} (appId: ${steamAppId}), storing Steam fallbacks if any`);
      }

      // Update database
      await Game.findByIdAndUpdate(
        game._id,
        {
          images,
          lastImageCacheUpdate: new Date()
        },
        { new: true }
      );

      console.log(`✅ Cached ${images.imageCount} images for: ${game.title}`);
      return images;

    } catch (error) {
      console.error(`❌ Error caching images for ${steamAppId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get cached images for a game (or fetch if not cached)
   */
  async getImages(steamAppId) {
    try {
      const game = await Game.findOne({ appId: steamAppId }).select('images lastImageCacheUpdate title');

      // Return cached images if available and fresh (less than 7 days)
      if (game?.images && Object.keys(game.images).length > 0) {
        if (game.lastImageCacheUpdate) {
          const cacheAge = Date.now() - game.lastImageCacheUpdate.getTime();
          if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
            console.log(`✅ [Cache HIT] ${game.title}`);
            return game.images;
          }
        }
      }

      console.log(`🔄 [Cache MISS] Fetching fresh images for ${steamAppId}...`);
      return await this.fetchAndCacheImages(steamAppId);

    } catch (error) {
      console.error(`❌ Error getting images for ${steamAppId}:`, error.message);
      return null;
    }
  }

  /**
   * Clear old cache entries (older than 30 days)
   */
  async clearOldCache(daysOld = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      const result = await Game.updateMany(
        { lastImageCacheUpdate: { $lt: cutoffDate } },
        { $set: { images: null, lastImageCacheUpdate: null } }
      );

      console.log(`🧹 Cleared cache for ${result.modifiedCount} old games`);
      return result;
    } catch (error) {
      console.error('❌ Error clearing old cache:', error);
      throw error;
    }
  }

  /**
   * Force refresh cache for all games
   */
  async forceRefreshAll() {
    try {
      console.log('🔄 Force refreshing cache for all games...');
      const count = await Game.countDocuments({
        title: { $nin: ['Unknown Game', 'Unknown'] }
      });

      await Game.updateMany(
        { title: { $nin: ['Unknown Game', 'Unknown'] } },
        { $set: { images: null, lastImageCacheUpdate: null } }
      );

      console.log(`✅ Marked ${count} games for cache refresh`);
      return count;
    } catch (error) {
      console.error('❌ Error force refreshing cache:', error);
      throw error;
    }
  }

  /**
   * Backwards compatible wrapper for routes using older method name
   */
  async getImagesBySteamId(steamAppId) {
    return this.getImages(steamAppId);
  }

  /**
   * Trigger background sync (backwards compatible)
   */
  backgroundSyncImages(limit = 20) {
    // Fire-and-forget
    this.syncCacheBatch(limit).catch(err => console.error('Background sync failed:', err));
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const total = await Game.countDocuments({
        title: { $nin: ['Unknown Game', 'Unknown'] }
      });

      const cached = await Game.countDocuments({
        images: { $exists: true, $ne: null },
        'images.cover': { $ne: null }
      });

      const coverage = total > 0 ? ((cached / total) * 100).toFixed(2) : 0;

      return {
        total,
        cached,
        coverage: `${coverage}%`,
        lastSyncTime: this.lastSyncTime,
        totalSynced: this.totalCached,
        totalFailed: this.totalFailed,
        isSyncing: this.isSyncing
      };
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return null;
    }
  }
}

module.exports = new ImageCacheManager();
