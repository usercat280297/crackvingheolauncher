/**
 * ============================================
 * STORE GAME NAME ENHANCEMENT SERVICE
 * Fetches beautiful game names from SteamGridDB
 * for Store page display
 * ============================================
 */

class StoreGameNameService {
  constructor() {
    this.cache = new Map();
    this.apiBase = 'http://localhost:3000/api';
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Get beautiful name for a game from cache or API
   * Tries: SteamGridDB name -> Database name -> Steam name -> Fallback
   */
  async getBeautifulName(gameId, fallbackName = '') {
    try {
      // Check cache first
      const cached = this.getCached(gameId);
      if (cached) return cached;

      // Try to fetch from backend API (which uses SteamGridDB)
      const beautifulName = await this.fetchFromAPI(gameId);
      
      if (beautifulName) {
        this.setCached(gameId, beautifulName);
        return beautifulName;
      }

      // Fallback to provided name
      return fallbackName || `Game ${gameId}`;
    } catch (error) {
      console.error(`[StoreGameNameService] Error fetching name for ${gameId}:`, error.message);
      return fallbackName || `Game ${gameId}`;
    }
  }

  /**
   * Batch fetch beautiful names for multiple games
   * Optimized for rendering store pages
   */
  async getBeautifulNamesBatch(gameIds) {
    try {
      // Separate cached vs uncached
      const uncached = gameIds.filter(id => !this.getCached(id));
      
      if (uncached.length === 0) {
        // All cached
        return gameIds.map(id => ({
          gameId: id,
          beautifulName: this.getCached(id)
        }));
      }

      // Fetch uncached in batches (max 50 per request)
      const results = [];
      for (let i = 0; i < uncached.length; i += 50) {
        const batch = uncached.slice(i, i + 50);
        const batchResults = await this.fetchBatchFromAPI(batch);
        results.push(...batchResults);
      }

      // Combine with cached
      return gameIds.map(id => {
        const cached = this.getCached(id);
        const fetched = results.find(r => r.gameId === id);
        return {
          gameId: id,
          beautifulName: cached || fetched?.beautifulName || `Game ${id}`
        };
      });
    } catch (error) {
      console.error('[StoreGameNameService] Batch fetch error:', error.message);
      return gameIds.map(id => ({
        gameId: id,
        beautifulName: this.getCached(id) || `Game ${id}`
      }));
    }
  }

  /**
   * Fetch from backend API with caching
   */
  async fetchFromAPI(gameId) {
    try {
      const response = await fetch(`${this.apiBase}/denuvo/steamgriddb/name/${gameId}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        console.warn(`[StoreGameNameService] API response ${response.status} for game ${gameId}`);
        return null;
      }

      const data = await response.json();
      
      // Prioritize: SteamGridDB name > Database name > Steam name
      return data.beautifulName || 
             data.databaseName || 
             data.steamName || 
             null;
    } catch (error) {
      console.warn(`[StoreGameNameService] API fetch failed for ${gameId}:`, error.message);
      return null;
    }
  }

  /**
   * Batch fetch from backend API
   */
  async fetchBatchFromAPI(gameIds) {
    try {
      const response = await fetch(`${this.apiBase}/denuvo/steamgriddb/batch-names`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameIds })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Cache all results
      data.names?.forEach(item => {
        const beautifulName = item.beautifulName || 
                              item.databaseName || 
                              item.steamName;
        if (beautifulName) {
          this.setCached(item.gameId, beautifulName);
        }
      });

      return data.names || [];
    } catch (error) {
      console.warn('[StoreGameNameService] Batch API failed:', error.message);
      return [];
    }
  }

  /**
   * Get from memory cache
   */
  getCached(gameId) {
    const cached = this.cache.get(gameId);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(gameId);
      return null;
    }

    return cached.name;
  }

  /**
   * Set in memory cache
   */
  setCached(gameId, name) {
    this.cache.set(gameId, {
      name,
      expiresAt: Date.now() + this.cacheExpiry
    });
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache stats (for debugging)
   */
  getCacheStats() {
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;

    this.cache.forEach(item => {
      if (now > item.expiresAt) {
        expiredCount++;
      } else {
        validCount++;
      }
    });

    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount,
      percentFilled: ((validCount / (validCount + expiredCount)) * 100).toFixed(2) + '%'
    };
  }
}

// Export singleton instance
const storeGameNameService = new StoreGameNameService();

export default storeGameNameService;
