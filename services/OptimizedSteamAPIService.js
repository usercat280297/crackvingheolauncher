/**
 * ============================================
 * OPTIMIZED STEAM API SERVICE
 * Giải quyết Rate Limiting issues
 * ============================================
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const {
  STEAM_API_CONFIG,
  RequestPoolManager,
  AdaptiveRateLimiter,
  RequestCacheManager,
} = require('../config/rateLimitOptimization');

class OptimizedSteamAPIService {
  constructor() {
    this.apiKey = process.env.STEAM_API_KEY;
    this.cachePath = path.join(__dirname, '../steam_cache');
    this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    
    // Initialize managers
    this.requestPool = new RequestPoolManager(STEAM_API_CONFIG);
    this.rateLimiter = new AdaptiveRateLimiter('Steam API', STEAM_API_CONFIG);
    this.memoryCache = new RequestCacheManager(this.CACHE_DURATION);
    
    // Ensure cache directory exists
    if (!fs.existsSync(this.cachePath)) {
      fs.mkdirSync(this.cachePath, { recursive: true });
      console.log('✅ Created steam_cache directory');
    }

    // Cleanup cache every 1 hour
    setInterval(() => this.memoryCache.cleanup(), 60 * 60 * 1000);
  }

  /**
   * Get game details - With optimized rate limiting
   */
  async getGameDetails(appId) {
    // Check memory cache first
    const cacheKey = `game_${appId}`;
    const cached = this.memoryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Check file cache
    const fileCached = this.getCachedGameData(appId);
    if (fileCached) {
      this.memoryCache.set(cacheKey, fileCached);
      return fileCached;
    }

    // Request via pool
    try {
      const result = await this.requestPool.execute(
        () => this._fetchGameDetails(appId),
        { appId }
      );
      
      if (result) {
        this.cacheGameData(appId, result);
        this.memoryCache.set(cacheKey, result);
        this.rateLimiter.recordSuccess();
      }
      
      return result;
    } catch (error) {
      this.rateLimiter.recordFailure(error.response?.status);
      console.error(`❌ Failed to get game details for ${appId}:`, error.message);
      return null;
    }
  }

  /**
   * Get multiple games in batch with optimized concurrency
   */
  async getGameDetailsBatch(appIds, options = {}) {
    const {
      parallel = 3,
      skipCache = false,
      timeout = 20000
    } = options;

    console.log(`📥 Fetching ${appIds.length} games with parallelism=${parallel}...`);

    const results = [];
    const chunks = this.chunkArray(appIds, parallel);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`📊 Processing batch ${i + 1}/${chunks.length} (${chunk.length} games)`);

      const promises = chunk.map(appId => 
        this.getGameDetails(appId).catch(err => {
          console.warn(`⚠️  Failed for ${appId}: ${err.message}`);
          return null;
        })
      );

      const batchResults = await Promise.all(promises);
      results.push(...batchResults.filter(r => r !== null));
    }

    console.log(`✅ Fetched ${results.length}/${appIds.length} games`);
    return results;
  }

  /**
   * Internal fetch method
   */
  async _fetchGameDetails(appId) {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=us`;
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (response.data && response.data[appId] && response.data[appId].success) {
      const gameData = response.data[appId].data;
      return this.transformSteamData(gameData, appId);
    }

    return null;
  }

  /**
   * Transform Steam API data
   */
  transformSteamData(steamData, appId) {
    const basePrice = steamData.is_free ? 0 : 
                     (steamData.price_overview ? steamData.price_overview.initial / 100 : 0);
    const currentPrice = steamData.is_free ? 0 :
                        (steamData.price_overview ? steamData.price_overview.final / 100 : basePrice);
    const discount = steamData.price_overview ? steamData.price_overview.discount_percent : 0;

    return {
      id: appId,
      steamAppId: appId,
      title: steamData.name || `Game ${appId}`,
      description: steamData.short_description || steamData.about_the_game || '',
      thumbnail: steamData.header_image || null,
      screenshots: (steamData.screenshots || []).map(s => s.path_thumbnail).slice(0, 5),
      trailer: steamData.movies ? steamData.movies[0]?.webm?.max || null : null,
      genres: (steamData.genres || []).map(g => g.description),
      tags: (steamData.tags || []).slice(0, 10),
      releaseDate: steamData.release_date?.date || null,
      developers: steamData.developers || [],
      publishers: steamData.publishers || [],
      basePrice,
      currentPrice,
      discount,
      isFree: steamData.is_free || false,
      metacritic: steamData.metacritic?.score || null,
      platforms: {
        windows: steamData.platforms?.windows || false,
        mac: steamData.platforms?.mac || false,
        linux: steamData.platforms?.linux || false,
      },
      reviewScore: steamData.review_score || null,
      reviewType: steamData.review_type || null,
      positiveReviews: steamData.positive || 0,
      negativeReviews: steamData.negative || 0,
      required_age: steamData.required_age || 0,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Cache helpers
   */
  getCachedGameData(appId) {
    const filePath = path.join(this.cachePath, `${appId}.json`);
    try {
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        const age = Date.now() - stat.mtime.getTime();
        
        if (age < this.CACHE_DURATION) {
          return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } else {
          // Cache expired
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.warn(`Failed to read cache for ${appId}:`, error.message);
    }
    return null;
  }

  cacheGameData(appId, data) {
    try {
      const filePath = path.join(this.cachePath, `${appId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn(`Failed to cache ${appId}:`, error.message);
    }
  }

  /**
   * Utility: Chunk array
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get service stats
   */
  getStats() {
    return {
      pool: this.requestPool.getStats(),
      rateLimiter: {
        currentDelay: this.rateLimiter.config.baseDelay,
        backoffLevel: this.rateLimiter.backoffLevel,
        consecutiveFailures: this.rateLimiter.consecutiveFailures,
      },
      cache: this.memoryCache.getStats(),
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.memoryCache.clear();
    try {
      const files = fs.readdirSync(this.cachePath);
      files.forEach(file => {
        fs.unlinkSync(path.join(this.cachePath, file));
      });
      console.log('✅ Cache cleared');
    } catch (error) {
      console.warn('Failed to clear cache:', error.message);
    }
  }
}

// Singleton instance
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new OptimizedSteamAPIService();
    }
    return instance;
  },
  OptimizedSteamAPIService,
};
