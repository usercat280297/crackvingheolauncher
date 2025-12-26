/**
 * ============================================
 * OPTIMIZED STEAMGRIDDB SERVICE
 * Tối ưu hóa rate limiting + batch requests
 * ============================================
 */

const axios = require('axios');
const fs = require('fs');
const {
  STEAMGRIDDB_CONFIG,
  RequestPoolManager,
  AdaptiveRateLimiter,
  RequestCacheManager,
} = require('../config/rateLimitOptimization');

class OptimizedSteamGridDBService {
  constructor() {
    this.apiKey = process.env.STEAMGRIDDB_API_KEY;
    this.baseUrl = 'https://www.steamgriddb.com/api/v2';
    this.cacheFile = './steamgriddb_cache.json';

    // Initialize managers
    this.requestPool = new RequestPoolManager(STEAMGRIDDB_CONFIG);
    this.rateLimiter = new AdaptiveRateLimiter('SteamGridDB', STEAMGRIDDB_CONFIG);
    this.memoryCache = new RequestCacheManager(STEAMGRIDDB_CONFIG.cacheDuration);

    this.loadCache();

    if (!this.apiKey) {
      console.warn('⚠️  STEAMGRIDDB_API_KEY not found in .env');
    }

    console.log('✅ OptimizedSteamGridDBService initialized');
  }

  /**
   * Search game by Steam app ID
   */
  async searchGameBySteamId(steamId) {
    const cacheKey = `steam_${steamId}`;
    
    // Check memory cache first
    const cached = this.memoryCache.get(cacheKey);
    if (cached && STEAMGRIDDB_CONFIG.cacheFirst) {
      return cached;
    }

    if (!this.apiKey) {
      return this.memoryCache.get(cacheKey) || null;
    }

    try {
      const result = await this.requestPool.execute(
        () => this._fetchSearchResults(steamId, `${this.baseUrl}/search/steam/${steamId}`),
        { steamId, type: 'search' }
      );

      if (result) {
        this.memoryCache.set(cacheKey, result);
        this.rateLimiter.recordSuccess();
      }

      return result;
    } catch (error) {
      this.rateLimiter.recordFailure(error.response?.status);
      console.warn(`⚠️  SteamGridDB search failed for ${steamId}: ${error.message}`);
      
      // Fallback to cached data if available
      return this.memoryCache.get(cacheKey) || null;
    }
  }

  /**
   * Search games by multiple Steam IDs (batch)
   */
  async searchGamesBatch(steamIds, parallel = 3) {
    console.log(`📥 SteamGridDB: Fetching ${steamIds.length} games...`);

    const chunks = this.chunkArray(steamIds, parallel);
    const results = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      const promises = chunk.map(steamId =>
        this.searchGameBySteamId(steamId).catch(err => {
          console.warn(`⚠️  Failed for ${steamId}`);
          return null;
        })
      );

      const batchResults = await Promise.all(promises);
      results.push(...batchResults.filter(r => r !== null));

      // Progress update
      console.log(`  ✓ ${Math.min((i + 1) * parallel, steamIds.length)}/${steamIds.length}`);
    }

    return results;
  }

  /**
   * Get game images (grids/logos/heroes)
   */
  async getGameImages(steamId, type = 'grids') {
    const cacheKey = `images_${steamId}_${type}`;
    
    const cached = this.memoryCache.get(cacheKey);
    if (cached && STEAMGRIDDB_CONFIG.cacheFirst) {
      return cached;
    }

    if (!this.apiKey) {
      return null;
    }

    try {
      const endpoint = `${this.baseUrl}/${type}/steam/${steamId}`;
      const result = await this.requestPool.execute(
        () => this._fetchImages(endpoint),
        { steamId, type }
      );

      if (result) {
        this.memoryCache.set(cacheKey, result);
        this.rateLimiter.recordSuccess();
      }

      return result;
    } catch (error) {
      this.rateLimiter.recordFailure(error.response?.status);
      console.warn(`⚠️  Failed to get ${type} for ${steamId}`);
      return this.memoryCache.get(cacheKey) || null;
    }
  }

  /**
   * Internal: Fetch search results
   */
  async _fetchSearchResults(steamId, url) {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      timeout: 10000,
    });

    const data = response.data?.data || [];
    if (data.length === 0) return null;

    return {
      steamId,
      id: data[0]?.id,
      name: data[0]?.name || null,
      releaseDate: data[0]?.release_date || null,
      verified: data[0]?.verified || false,
      timestamp: Date.now(),
    };
  }

  /**
   * Internal: Fetch images
   */
  async _fetchImages(url) {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      timeout: 10000,
    });

    const data = response.data?.data || [];
    return data.map(img => ({
      id: img.id,
      url: img.url,
      thumb: img.thumb,
      author: img.author,
      language: img.language || 'en',
    }));
  }

  /**
   * Bulk get images for multiple games
   */
  async getGameImagesBatch(steamIds, imageType = 'grids', parallel = 2) {
    console.log(`🖼️  Fetching ${imageType} for ${steamIds.length} games...`);

    const chunks = this.chunkArray(steamIds, parallel);
    const results = {};

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      const promises = chunk.map(steamId =>
        this.getGameImages(steamId, imageType).then(images => ({
          steamId,
          images
        }))
      );

      const batchResults = await Promise.all(promises);
      
      batchResults.forEach(({ steamId, images }) => {
        if (images) {
          results[steamId] = images;
        }
      });

      console.log(`  ✓ ${Math.min((i + 1) * parallel, steamIds.length)}/${steamIds.length}`);
    }

    return results;
  }

  /**
   * Utility functions
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  loadCache() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
        Object.entries(data).forEach(([key, value]) => {
          this.memoryCache.set(key, value);
        });
        console.log(`✅ Loaded SteamGridDB cache (${Object.keys(data).length} items)`);
      }
    } catch (error) {
      console.warn('Failed to load SteamGridDB cache:', error.message);
    }
  }

  saveCache() {
    try {
      const cacheData = {};
      for (const [key, { value }] of this.memoryCache.cache.entries()) {
        cacheData[key] = value;
      }
      fs.writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.warn('Failed to save SteamGridDB cache:', error.message);
    }
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
   * Clear cache
   */
  clearCache() {
    this.memoryCache.clear();
    try {
      fs.unlinkSync(this.cacheFile);
      console.log('✅ SteamGridDB cache cleared');
    } catch (error) {
      console.warn('Failed to clear cache:', error.message);
    }
  }
}

// Singleton
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new OptimizedSteamGridDBService();
    }
    return instance;
  },
  OptimizedSteamGridDBService,
};
