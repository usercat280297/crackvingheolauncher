/**
 * Cache utility for managing localStorage caching with TTL
 * Provides consistent caching strategy across the app
 */

/**
 * Save data to cache with timestamp
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 * @param {number} ttlHours - Time to live in hours (default 24)
 */
export const setCache = (key, data, ttlHours = 24) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl: ttlHours * 60 * 60 * 1000 // Convert hours to milliseconds
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
    return true;
  } catch (err) {
    console.error('Cache set error:', err);
    return false;
  }
};

/**
 * Get data from cache if still valid
 * @param {string} key - Cache key
 * @returns {*} Cached data or null if expired/not found
 */
export const getCache = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;

    // Check if cache is still valid
    if (age < cacheData.ttl) {
      return cacheData.data;
    } else {
      // Remove expired cache
      removeCache(key);
      return null;
    }
  } catch (err) {
    console.error('Cache get error:', err);
    return null;
  }
};

/**
 * Remove specific cache
 * @param {string} key - Cache key
 */
export const removeCache = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Cache remove error:', err);
  }
};

/**
 * Clear all game-related caches
 */
export const clearGameCaches = () => {
  const keys = [
    'popular_games_cache',
    'featured_games_cache',
    'top_sellers_cache',
    'most_played_cache'
  ];
  
  keys.forEach(key => removeCache(key));
  
  // Also clear update caches (pattern: updates_cache_*)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('updates_cache_')) {
      removeCache(key);
    }
  }
};

/**
 * Get cache TTL remaining in minutes
 * @param {string} key - Cache key
 * @returns {number} Minutes remaining or -1 if not cached
 */
export const getCacheTTL = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return -1;

    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;
    const remaining = cacheData.ttl - age;

    return remaining > 0 ? Math.ceil(remaining / 60000) : -1;
  } catch (err) {
    console.error('Cache TTL error:', err);
    return -1;
  }
};

/**
 * Fetch with automatic caching
 * @param {string} url - API endpoint
 * @param {string} cacheKey - Cache key
 * @param {number} cacheTtlHours - Cache TTL in hours
 * @param {object} options - Fetch options
 * @returns {Promise<*>} Response data
 */
export const fetchWithCache = async (
  url,
  cacheKey,
  cacheTtlHours = 24,
  options = {}
) => {
  try {
    // Check cache first
    const cached = getCache(cacheKey);
    if (cached !== null) {
      console.log(`📦 Using cached data for ${cacheKey}`);
      return cached;
    }

    // Fetch from API
    console.log(`📡 Fetching ${url}`);
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Save to cache
    setCache(cacheKey, data, cacheTtlHours);
    console.log(`💾 Cached ${cacheKey}`);

    return data;
  } catch (err) {
    console.error(`Fetch error for ${url}:`, err);
    
    // Try to return stale cache if available
    const staleCache = localStorage.getItem(cacheKey);
    if (staleCache) {
      try {
        console.warn(`⚠️ Using stale cache for ${cacheKey}`);
        return JSON.parse(staleCache).data;
      } catch (e) {
        console.error('Stale cache parse error:', e);
      }
    }
    
    throw err;
  }
};

/**
 * Pre-fetch and cache common data
 * Call on app initialization
 */
export const preFetchCommonData = async () => {
  const endpoints = [
    {
      url: 'http://localhost:3000/api/most-popular?limit=10',
      key: 'popular_games_cache',
      ttl: 12
    },
    {
      url: 'http://localhost:3000/api/top-games/top-sellers?limit=5',
      key: 'top_sellers_cache',
      ttl: 12
    }
  ];

  for (const endpoint of endpoints) {
    try {
      await fetchWithCache(endpoint.url, endpoint.key, endpoint.ttl);
    } catch (err) {
      console.warn(`Pre-fetch failed for ${endpoint.key}:`, err);
    }
  }
};

export default {
  setCache,
  getCache,
  removeCache,
  clearGameCaches,
  getCacheTTL,
  fetchWithCache,
  preFetchCommonData
};
