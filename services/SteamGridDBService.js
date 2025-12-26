const axios = require('axios');

class SteamGridDBService {
  constructor() {
    this.apiKey = process.env.STEAMGRIDDB_API_KEY;
    this.baseUrl = 'https://www.steamgriddb.com/api/v2';
    this.cache = new Map(); // In-memory cache
    
    if (!this.apiKey) {
      console.warn('⚠️  SteamGridDB API key not configured');
      console.warn('   Get your free API key at: https://www.steamgriddb.com/profile/preferences/api');
    } else {
      console.log('✅ SteamGridDB API configured');
    }
  }

  /**
   * Make API request with error handling
   */
  async request(endpoint, params = {}) {
    if (!this.apiKey) {
      throw new Error('SteamGridDB API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        params,
        timeout: 8000
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        console.error(`SteamGridDB API error: ${error.response.status} - ${error.response.statusText}`);
        console.error('Response:', error.response.data);
      } else {
        console.error(`SteamGridDB request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get game by Steam App ID
   * @param {number} steamAppId - Steam Application ID
   * @returns {Promise<Object|null>} Game data
   */
  async getGameBySteamId(steamAppId) {
    const cacheKey = `game_${steamAppId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.request(`/games/steam/${steamAppId}`);
      const game = response.data || null;
      
      if (game) {
        this.cache.set(cacheKey, game);
      }
      
      return game;
    } catch (error) {
      console.error(`Failed to get game ${steamAppId}:`, error.message);
      return null;
    }
  }

  /**
   * Get grid covers (vertical posters - 600x900)
   * @param {number} gameId - SteamGridDB game ID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of grid images
   */
  async getGrids(gameId, options = {}) {
    try {
      const params = {
        dimensions: options.dimensions || '600x900',
        styles: options.styles || undefined,
        types: options.types || undefined,
        limit: options.limit || 10
      };

      const response = await this.request(`/grids/game/${gameId}`, params);
      return response.data || [];
    } catch (error) {
      console.error(`Failed to get grids for game ${gameId}:`, error.message);
      return [];
    }
  }

  /**
   * Get hero images (wide banners - 1920x620)
   */
  async getHeroes(gameId, options = {}) {
    try {
      const params = {
        dimensions: options.dimensions || '1920x620',
        styles: options.styles || undefined,
        types: options.types || undefined,
        limit: options.limit || 5
      };

      const response = await this.request(`/heroes/game/${gameId}`, params);
      return response.data || [];
    } catch (error) {
      console.error(`Failed to get heroes for game ${gameId}:`, error.message);
      return [];
    }
  }

  /**
   * Get logo images (transparent PNGs)
   */
  async getLogos(gameId, options = {}) {
    try {
      const params = {
        styles: options.styles || undefined,
        types: options.types || undefined,
        limit: options.limit || 5
      };

      const response = await this.request(`/logos/game/${gameId}`, params);
      return response.data || [];
    } catch (error) {
      console.error(`Failed to get logos for game ${gameId}:`, error.message);
      return [];
    }
  }

  /**
   * Get icon images (square icons)
   * Note: Don't specify dimensions as API doesn't support filtering by size
   */
  async getIcons(gameId, options = {}) {
    try {
      const params = {
        // Don't specify dimensions - API will return all available sizes
        styles: options.styles || undefined,
        types: options.types || undefined,
        limit: options.limit || 5
      };

      const response = await this.request(`/icons/game/${gameId}`, params);
      return response.data || [];
    } catch (error) {
      console.error(`Failed to get icons for game ${gameId}:`, error.message);
      return [];
    }
  }

  /**
   * Get ALL images for a game by Steam App ID
   * This is the main method you'll use most of the time
   * @param {number} steamAppId - Steam Application ID
   * @returns {Promise<Object|null>} All images for the game
   */
  async getAllImagesBySteamId(steamAppId) {
    const cacheKey = `images_${steamAppId}`;
    
    if (this.cache.has(cacheKey)) {
      console.log(`📦 Using cached images for ${steamAppId}`);
      return this.cache.get(cacheKey);
    }

    try {
      // Step 1: Get SteamGridDB game ID
      const game = await this.getGameBySteamId(steamAppId);
      if (!game) {
        console.log(`❌ Game ${steamAppId} not found in SteamGridDB`);
        return null;
      }

      const sgdbGameId = game.id;
      console.log(`✅ Found game in SteamGridDB: ${game.name} (ID: ${sgdbGameId})`);

      // Step 2: Fetch all image types in parallel
      const [grids, heroes, logos, icons] = await Promise.all([
        this.getGrids(sgdbGameId),
        this.getHeroes(sgdbGameId),
        this.getLogos(sgdbGameId),
        this.getIcons(sgdbGameId)
      ]);

      console.log(`📊 Images fetched - Grids: ${grids.length}, Heroes: ${heroes.length}, Logos: ${logos.length}, Icons: ${icons.length}`);

      const result = {
        steamAppId,
        sgdbGameId,
        gameName: game.name,
        
        // Best quality images (first result)
        cover: grids[0]?.url || null,
        coverThumb: grids[0]?.thumb || null,
        hero: heroes[0]?.url || null,
        heroThumb: heroes[0]?.thumb || null,
        logo: logos[0]?.url || null,
        logoThumb: logos[0]?.thumb || null,
        icon: icons[0]?.url || null,
        iconThumb: icons[0]?.thumb || null,
        
        // All available images (for selection)
        allGrids: grids,
        allHeroes: heroes,
        allLogos: logos,
        allIcons: icons
      };

      console.log(`🎨 Final images - Cover: ${result.cover ? '✓' : '✗'}, Hero: ${result.hero ? '✓' : '✗'}, Logo: ${result.logo ? '✓' : '✗'}`);

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`❌ Failed to get all images for ${steamAppId}:`, error.message);
      return null;
    }
  }

  /**
   * Get best cover image with fallback to Steam CDN
   * @param {number} steamAppId - Steam Application ID
   * @returns {Promise<string>} Cover image URL
   */
  async getBestCover(steamAppId) {
    try {
      const images = await this.getAllImagesBySteamId(steamAppId);
      
      if (images && images.cover) {
        return images.cover;
      }
    } catch (error) {
      console.error(`Error getting SteamGridDB cover for ${steamAppId}:`, error.message);
    }
    
    // Fallback to Steam CDN
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamAppId}/header.jpg`;
  }

  /**
   * Search games by name
   * @param {string} query - Game name to search
   * @returns {Promise<Array>} Array of matching games
   */
  async searchGames(query) {
    try {
      const response = await this.request('/search/autocomplete/' + encodeURIComponent(query));
      return response.data || [];
    } catch (error) {
      console.error(`Failed to search for "${query}":`, error.message);
      return [];
    }
  }

  /**
   * Clear cache (useful for development)
   */
  clearCache() {
    this.cache.clear();
    console.log('✅ SteamGridDB cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
module.exports = new SteamGridDBService();