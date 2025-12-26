/**
 * ============================================
 * STEAMGRIDDB SERVICE - ENHANCED
 * Fetch beautiful game names & images
 * ============================================
 */

const axios = require('axios');
const fs = require('fs');

class EnhancedSteamGridDBService {
  constructor() {
    this.apiKey = process.env.STEAMGRIDDB_API_KEY;
    this.baseUrl = 'https://www.steamgriddb.com/api/v2';
    this.cache = {};
    this.cacheFile = './steamgriddb_cache.json';
    this.requestDelay = 200; // ms between requests
    this.lastRequestTime = 0;
    this.loadCache();

    if (!this.apiKey) {
      console.warn('⚠️  STEAMGRIDDB_API_KEY not found in .env');
    }
  }

  /**
   * Rate limiting
   */
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.requestDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.requestDelay - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Search game by Steam app ID
   * Returns beautiful game info including official name
   */
  async searchGameBySteamId(steamId) {
    try {
      // Check cache first
      if (this.cache[steamId]) {
        return this.cache[steamId];
      }

      if (!this.apiKey) {
        console.warn(`⚠️  No API key for SteamGridDB`);
        return null;
      }

      await this.waitForRateLimit();

      const response = await axios.get(`${this.baseUrl}/search/steam/${steamId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 10000,
      });

      const data = response.data?.data || [];
      if (data.length === 0) return null;

      // Get the most relevant result (usually first is best)
      const gameInfo = {
        steamId,
        id: data[0]?.id,
        name: data[0]?.name || null, // Beautiful official name
        releaseDate: data[0]?.release_date || null,
        verified: data[0]?.verified || false,
        timestamp: Date.now(),
      };

      // Cache it
      this.cache[steamId] = gameInfo;
      this.saveCache();

      return gameInfo;
    } catch (error) {
      console.error(`❌ SteamGridDB search error for ${steamId}:`, error.message);
      return null;
    }
  }

  /**
   * Get best artwork for game
   * Returns high-quality images
   */
  async getBestArtwork(steamId, filters = {}) {
    try {
      await this.waitForRateLimit();

      // Default filters for high quality
      const defaultFilters = {
        type: 'artwork', // artwork, hero, logo, icon
        style: 'blurred',
        oneoftag: true,
      };

      const queryParams = { ...defaultFilters, ...filters };
      const queryString = new URLSearchParams(queryParams).toString();

      const response = await axios.get(
        `${this.baseUrl}/artwork/steam/${steamId}?${queryString}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }
      );

      const artworks = response.data?.data || [];
      return artworks.map(art => ({
        id: art.id,
        url: art.url,
        thumb: art.thumb,
        width: art.width,
        height: art.height,
        upvotes: art.upvotes,
      }));
    } catch (error) {
      console.error(`❌ SteamGridDB artwork error for ${steamId}:`, error.message);
      return [];
    }
  }

  /**
   * Get best hero image (carousel/banner)
   */
  async getHeroImage(steamId) {
    try {
      await this.waitForRateLimit();

      const response = await axios.get(
        `${this.baseUrl}/heroes/steam/${steamId}?limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }
      );

      const heroes = response.data?.data || [];
      if (heroes.length === 0) return null;

      return {
        id: heroes[0].id,
        url: heroes[0].url,
        thumb: heroes[0].thumb,
        upvotes: heroes[0].upvotes,
      };
    } catch (error) {
      console.error(`❌ SteamGridDB hero error for ${steamId}:`, error.message);
      return null;
    }
  }

  /**
   * Get logo image (for carousel text)
   */
  async getLogoImage(steamId) {
    try {
      await this.waitForRateLimit();

      const response = await axios.get(
        `${this.baseUrl}/logos/steam/${steamId}?limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }
      );

      const logos = response.data?.data || [];
      if (logos.length === 0) return null;

      return {
        id: logos[0].id,
        url: logos[0].url,
        thumb: logos[0].thumb,
        upvotes: logos[0].upvotes,
      };
    } catch (error) {
      console.error(`❌ SteamGridDB logo error for ${steamId}:`, error.message);
      return null;
    }
  }

  /**
   * Get complete game assets
   * Hero image + logo + official name
   */
  async getCompleteGameAssets(steamId) {
    try {
      // Search for game info first
      const gameInfo = await this.searchGameBySteamId(steamId);
      
      // Fetch hero and logo in parallel
      const [hero, logo] = await Promise.all([
        this.getHeroImage(steamId),
        this.getLogoImage(steamId),
      ]);

      return {
        steamId,
        name: gameInfo?.name || null,
        hero: hero?.url || null,
        heroThumb: hero?.thumb || null,
        logo: logo?.url || null,
        logoThumb: logo?.thumb || null,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`❌ Error getting complete assets for ${steamId}:`, error.message);
      return null;
    }
  }

  /**
   * Batch fetch game assets for carousel
   */
  async batchFetchGameAssets(steamIds) {
    const results = {};
    
    for (const steamId of steamIds) {
      try {
        results[steamId] = await this.getCompleteGameAssets(steamId);
      } catch (error) {
        console.error(`❌ Error for ${steamId}:`, error.message);
        results[steamId] = null;
      }
    }

    return results;
  }

  /**
   * Cache management
   */
  loadCache() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        this.cache = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️  Could not load SteamGridDB cache:', error.message);
    }
  }

  saveCache() {
    try {
      fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.error('❌ Error saving SteamGridDB cache:', error.message);
    }
  }

  /**
   * Clear old cache entries
   */
  clearOldCache(maxAgeMs = 30 * 24 * 60 * 60 * 1000) {
    const now = Date.now();
    let cleared = 0;

    for (const steamId in this.cache) {
      const entry = this.cache[steamId];
      if (now - entry.timestamp > maxAgeMs) {
        delete this.cache[steamId];
        cleared++;
      }
    }

    if (cleared > 0) {
      this.saveCache();
      console.log(`✅ Cleared ${cleared} old cache entries`);
    }

    return cleared;
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      cachedGames: Object.keys(this.cache).length,
      cacheSize: JSON.stringify(this.cache).length,
    };
  }
}

module.exports = new EnhancedSteamGridDBService();
