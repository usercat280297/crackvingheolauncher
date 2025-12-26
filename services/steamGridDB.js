const axios = require('axios');

const STEAMGRIDDB_API = 'https://www.steamgriddb.com/api/v2';
const API_KEY = process.env.STEAMGRIDDB_API_KEY || ''; // Add your key to .env

// Cache for 24 hours
const cache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * Fetch hero image từ SteamGridDB
 * @param {number} appId - Steam App ID
 * @returns {Promise<string|null>} - Hero image URL hoặc null
 */
async function getHeroImage(appId) {
  if (!appId) return null;

  // Check cache
  const cacheKey = `hero_${appId}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    // Fetch từ SteamGridDB
    const response = await axios.get(`${STEAMGRIDDB_API}/heroes?appid=${appId}&limit=1`, {
      headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {},
      timeout: 5000
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      const heroUrl = response.data.data[0].url;
      
      // Cache result
      cache.set(cacheKey, {
        data: heroUrl,
        timestamp: Date.now()
      });
      
      return heroUrl;
    }
  } catch (error) {
    console.warn(`Failed to fetch hero for appId ${appId}:`, error.message);
  }

  return null;
}

/**
 * Fetch cover/grid image từ SteamGridDB
 * @param {number} appId - Steam App ID
 * @returns {Promise<string|null>} - Cover image URL hoặc null
 */
async function getCoverImage(appId) {
  if (!appId) return null;

  const cacheKey = `cover_${appId}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    const response = await axios.get(`${STEAMGRIDDB_API}/grids?appid=${appId}&limit=1`, {
      headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {},
      timeout: 5000
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      const coverUrl = response.data.data[0].url;
      
      cache.set(cacheKey, {
        data: coverUrl,
        timestamp: Date.now()
      });
      
      return coverUrl;
    }
  } catch (error) {
    console.warn(`Failed to fetch cover for appId ${appId}:`, error.message);
  }

  return null;
}

/**
 * Fetch logo từ SteamGridDB
 * @param {number} appId - Steam App ID
 * @returns {Promise<string|null>} - Logo URL hoặc null
 */
async function getLogoImage(appId) {
  if (!appId) return null;

  const cacheKey = `logo_${appId}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    const response = await axios.get(`${STEAMGRIDDB_API}/logos?appid=${appId}&limit=1`, {
      headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {},
      timeout: 5000
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      const logoUrl = response.data.data[0].url;
      
      cache.set(cacheKey, {
        data: logoUrl,
        timestamp: Date.now()
      });
      
      return logoUrl;
    }
  } catch (error) {
    console.warn(`Failed to fetch logo for appId ${appId}:`, error.message);
  }

  return null;
}

/**
 * Fetch tất cả images (hero, cover, logo)
 * @param {number} appId - Steam App ID
 * @returns {Promise<Object>} - { hero, cover, logo } URLs
 */
async function getAllImages(appId) {
  if (!appId) return { hero: null, cover: null, logo: null };

  const cacheKey = `all_${appId}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    const [hero, cover, logo] = await Promise.all([
      getHeroImage(appId),
      getCoverImage(appId),
      getLogoImage(appId)
    ]);

    const result = { hero, cover, logo };
    
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    console.error(`Failed to fetch all images for appId ${appId}:`, error.message);
    return { hero: null, cover: null, logo: null };
  }
}

/**
 * Clear cache cho một game hoặc tất cả
 * @param {number} appId - Steam App ID (optional)
 */
function clearCache(appId = null) {
  if (appId) {
    cache.delete(`hero_${appId}`);
    cache.delete(`cover_${appId}`);
    cache.delete(`logo_${appId}`);
    cache.delete(`all_${appId}`);
  } else {
    cache.clear();
  }
}

module.exports = {
  getHeroImage,
  getCoverImage,
  getLogoImage,
  getAllImages,
  clearCache
};
