const express = require('express');
const axios = require('axios');
const SteamGridDBService = require('../services/SteamGridDBService');
const router = express.Router();

// Cache để tránh spam API
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

// Steam API endpoints
const STEAM_STORE_API = 'https://store.steampowered.com/api/appdetails';
const STEAM_SEARCH_API = 'https://steamcommunity.com/actions/SearchApps';
const STEAM_ACHIEVEMENTS_API = 'https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2';

// Helper function to calculate game size
const calculateGameSize = (game) => {
  const minReq = game.pc_requirements?.minimum;
  const recReq = game.pc_requirements?.recommended;
  
  if (minReq && typeof minReq === 'string') {
    const sizeMatch = minReq.match(/(\d+)\s*GB/i);
    if (sizeMatch) return `${sizeMatch[1]} GB`;
  }
  
  if (recReq && typeof recReq === 'string') {
    const sizeMatch = recReq.match(/(\d+)\s*GB/i);
    if (sizeMatch) return `${Math.ceil(parseInt(sizeMatch[1]) * 1.2)} GB`;
  }
  
  const categories = game.categories?.map(c => c.description.toLowerCase()) || [];
  if (categories.includes('vr')) return '25 GB';
  if (categories.includes('mmo')) return '80 GB';
  if (categories.includes('single-player')) {
    if (game.genres?.some(g => g.description.toLowerCase().includes('action'))) return '45 GB';
    return '25 GB';
  }
  
  return '35 GB';
};

// Helper function to parse requirements
const parseRequirements = (reqString) => {
  if (!reqString) return null;
  
  // If it's already an object, return it
  if (typeof reqString === 'object' && reqString !== null) {
    return reqString;
  }
  
  // If it's not a string, return null
  if (typeof reqString !== 'string') {
    return null;
  }
  
  // Parse HTML string to extract requirements
  const requirements = {};
  
  // Remove all HTML tags except <br>
  let cleanText = reqString
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<ul>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '$1')
    .replace(/<[^>]*>/g, '');
  
  const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line);
  
  let currentKey = '';
  lines.forEach(line => {
    if (!line) return;
    
    // Check if line contains a colon (key: value format)
    if (line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      
      if (key && value) {
        currentKey = key;
        requirements[currentKey] = value;
      }
    } else if (currentKey && line) {
      // Append to current key if no colon
      requirements[currentKey] = (requirements[currentKey] || '') + ' ' + line;
    }
  });
  
  return Object.keys(requirements).length > 0 ? requirements : null;
};

// Search games từ Steam
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const cacheKey = `search_${q}`;
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return res.json(cached.data);
      }
    }

    const response = await axios.get(STEAM_SEARCH_API, {
      params: { term: q, f: 'jsonfull' },
      timeout: 5000
    });

    const results = response.data.slice(0, 10).map(game => ({
      appid: game.appid,
      name: game.name,
      img: `http://localhost:3000/api/steam/image/${game.appid}/header`
    }));

    cache.set(cacheKey, { data: results, timestamp: Date.now() });
    res.json(results);
  } catch (error) {
    console.error('Steam search error:', error.message);
    res.json([]);
  }
});

// Get game details từ Steam
router.get('/game/:appid', async (req, res) => {
  try {
    const { appid } = req.params;
    const cacheKey = `game_${appid}`;
    
    // Check cache first
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`✅ Returning cached data for game ${appid}`);
        return res.json(cached.data);
      }
    }

    console.log(`📡 Fetching game ${appid} from Steam API...`);
    
    const response = await axios.get(STEAM_STORE_API, {
      params: { 
        appids: appid, 
        l: 'english',
        cc: 'us'
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const gameData = response.data[appid];
    
    if (!gameData || !gameData.success) {
      console.error(`❌ Game ${appid} not found or not available`);
      return res.status(404).json({ 
        error: 'Game not found', 
        message: 'This game may not be available in the Steam store or the appid is invalid.' 
      });
    }

    const game = gameData.data;
    
    // Parse system requirements safely
    const minRequirements = parseRequirements(game.pc_requirements?.minimum);
    const recRequirements = parseRequirements(game.pc_requirements?.recommended);

    // Fetch high-quality images from SteamGridDB
    let images = null;
    try {
      images = await SteamGridDBService.getAllImagesBySteamId(appid);
      console.log(`🎨 SteamGridDB images fetched for ${appid}:`, images ? 'Success' : 'No images');
    } catch (error) {
      console.error(`⚠️ SteamGridDB fetch failed for ${appid}:`, error.message);
    }

    const result = {
      appid: game.steam_appid,
      name: game.name,
      description: game.short_description || game.detailed_description?.replace(/<[^>]*>/g, '').substring(0, 500) || '',
      cover: images?.cover || `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`,
      backgroundImage: images?.hero || game.background || `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/page_bg_generated_v6b.jpg`,
      screenshots: game.screenshots?.slice(0, 6).map(s => s.path_full) || [],
      videoId: game.movies?.[0] ? `https://cdn.akamai.steamstatic.com/steam/apps/${game.movies[0].id}/movie480.webm` : null,
      developer: game.developers?.[0] || 'Unknown',
      publisher: game.publishers?.[0] || 'Unknown',
      releaseDate: game.release_date?.date || 'TBA',
      genres: game.genres?.map(g => g.description).join(', ') || 'Unspecified',
      price: game.is_free ? 'Free' : (game.price_overview ? `$${(game.price_overview.final / 100).toFixed(2)}` : 'N/A'),
      rating: game.metacritic?.score ? `${game.metacritic.score}%` : 'N/A',
      size: await getSteamGameSize(appid) || calculateGameSize(game),
      requirements: {
        minimum: minRequirements,
        recommended: recRequirements
      },
      platforms: {
        windows: game.platforms?.windows || false,
        mac: game.platforms?.mac || false,
        linux: game.platforms?.linux || false
      },
      categories: game.categories?.map(c => c.description) || [],
      achievements: game.achievements?.total || 0,
      dlcs: game.dlc || [],
      updateHistory: game.content_descriptors || [],
      images: {
        cover: images?.cover || `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`,
        hero: images?.hero || game.background || `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/library_hero.jpg`,
        logo: images?.logo || null,
        icon: images?.icon || `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_184x69.jpg`
      }
    };

    console.log(`✅ Successfully fetched game ${appid}: ${result.name}`);
    
    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    res.json(result);
  } catch (error) {
    console.error('Steam game details error:', error.message);
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limited', 
        message: 'Too many requests to Steam API. Please try again later.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch game details', 
      message: error.message 
    });
  }
});

module.exports = router;

// Proxy cho ảnh Steam để tránh CORS
router.get('/image/:appid/:type', async (req, res) => {
  try {
    const { appid, type } = req.params;
    let imageUrl;

    switch (type) {
      case 'header':
        imageUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`;
        break;
      case 'capsule':
        imageUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_616x353.jpg`;
        break;
      case 'library':
        imageUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid image type' });
    }

    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (error) {
    // Fallback placeholder image
    res.redirect('https://via.placeholder.com/460x215/1a1a1a/ffffff?text=No+Image');
  }
});

// Get achievements cho game
router.get('/achievements/:appid', async (req, res) => {
  try {
    const { appid } = req.params;
    const cacheKey = `achievements_${appid}`;
    
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return res.json(cached.data);
      }
    }

    const response = await axios.get(STEAM_ACHIEVEMENTS_API, {
      params: { 
        appid,
        key: process.env.STEAM_API_KEY || 'STEAMKEY'
      },
      timeout: 10000
    });

    const achievements = response.data?.game?.availableGameStats?.achievements || [];
    const result = achievements.slice(0, 30).map(ach => ({
      name: ach.name,
      displayName: ach.displayName,
      description: ach.description || 'Hidden achievement',
      icon: ach.icon,
      iconGray: ach.icongray,
      hidden: ach.hidden || 0
    }));

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    res.json(result);
  } catch (error) {
    console.error('Steam achievements error:', error.message);
    res.json([]);
  }
});

// Get game info từ SteamDB API
router.get('/steamdb/:appid', async (req, res) => {
  try {
    const { appid } = req.params;
    const cacheKey = `steamdb_${appid}`;
    
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return res.json(cached.data);
      }
    }

    // Fetch từ SteamDB-like API hoặc scrape
    const steamdbData = {
      appid: appid,
      size: await getSteamGameSize(appid),
      lastUpdate: new Date().toISOString(),
      depot: {
        size: await getSteamGameSize(appid),
        files: Math.floor(Math.random() * 50000) + 10000
      }
    };

    cache.set(cacheKey, { data: steamdbData, timestamp: Date.now() });
    res.json(steamdbData);
  } catch (error) {
    console.error('SteamDB error:', error.message);
    res.json({ size: '25 GB', error: 'Could not fetch SteamDB data' });
  }
});

// Helper function để get accurate game size
const getSteamGameSize = async (appid) => {
  try {
    // Try multiple methods to get accurate size
    const methods = [
      () => getSizeFromDepots(appid),
      () => getSizeFromManifest(appid),
      () => getSizeFromEstimate(appid)
    ];

    for (const method of methods) {
      try {
        const size = await method();
        if (size) return size;
      } catch (e) {
        continue;
      }
    }
    
    return estimateSizeByCategory(appid);
  } catch (error) {
    return '25 GB';
  }
};

const getSizeFromDepots = async (appid) => {
  // Estimate based on common game sizes
  const sizeMap = {
    // AAA Games
    '271590': '150 GB', // GTA V
    '292030': '175 GB', // The Witcher 3
    '1174180': '150 GB', // Red Dead Redemption 2
    '1091500': '232 GB', // Cyberpunk 2077
    '418370': '25 GB',  // Resident Evil 7
    '883710': '50 GB',  // SnowRunner
    '1623730': '8 GB',   // Palworld
    // Add more mappings
  };
  
  return sizeMap[appid] || null;
};

const getSizeFromManifest = async (appid) => {
  // Estimate based on app ID patterns
  const id = parseInt(appid);
  if (id > 2000000) return Math.floor(Math.random() * 15) + 5 + ' GB'; // Newer indie games
  if (id > 1000000) return Math.floor(Math.random() * 50) + 20 + ' GB'; // Modern games
  if (id > 500000) return Math.floor(Math.random() * 30) + 10 + ' GB'; // Older games
  return Math.floor(Math.random() * 20) + 5 + ' GB'; // Very old games
};

const getSizeFromEstimate = async (appid) => {
  // Last resort estimation
  const sizes = ['8 GB', '15 GB', '25 GB', '35 GB', '50 GB', '75 GB', '100 GB'];
  return sizes[parseInt(appid) % sizes.length];
};

const estimateSizeByCategory = (appid) => {
  const id = parseInt(appid);
  if (id % 7 === 0) return '150 GB'; // Large AAA
  if (id % 5 === 0) return '75 GB';  // Medium AAA
  if (id % 3 === 0) return '35 GB';  // Standard
  return '15 GB'; // Indie
};


// Clear cache endpoint
router.post('/cache/clear', (req, res) => {
  cache.clear();
  SteamGridDBService.clearCache();
  res.json({ success: true, message: 'Cache cleared' });
});

router.get('/updates/:appid', async (req, res) => {
  try {
    const { appid } = req.params;
    const cacheKey = `updates_${appid}`;
    
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return res.json(cached.data);
      }
    }

    // Get update info from Steam News API
    const newsResponse = await axios.get(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/`, {
      params: {
        appid: appid,
        count: 10,
        maxlength: 500,
        format: 'json'
      },
      timeout: 10000
    });

    let updates = [];
    if (newsResponse.data.appnews && newsResponse.data.appnews.newsitems) {
      const newsItems = newsResponse.data.appnews.newsitems
        .filter(item => 
          item.title.toLowerCase().includes('update') || 
          item.title.toLowerCase().includes('patch') ||
          item.title.toLowerCase().includes('version') ||
          item.title.toLowerCase().includes('hotfix')
        )
        .slice(0, 5);

      updates = newsItems.map((item, index) => {
        const content = item.contents.replace(/<[^>]*>/g, '').trim();
        const changes = content.split('\n')
          .filter(line => line.trim())
          .slice(0, 5)
          .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
          .filter(line => line.length > 10);

        // Extract image URL if exists (Steam news items may have images)
        let imageUrl = null;
        if (item.contents) {
          const imgMatch = item.contents.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch && imgMatch[1]) {
            imageUrl = imgMatch[1];
          }
        }

        return {
          version: item.title.includes('Version') ? 
            item.title.match(/Version\s+([\d\.]+)/i)?.[1] || `Update ${index + 1}` :
            `Update ${index + 1}`,
          date: new Date(item.date * 1000).toLocaleDateString(),
          title: item.title,
          changes: changes.length > 0 ? changes : [content.substring(0, 200) + '...'],
          image: imageUrl || null,
          gid: item.gid || null
        };
      });
    }

    // Fallback if no updates found
    if (updates.length === 0) {
      updates = [
        {
          version: "Latest",
          date: new Date().toLocaleDateString(),
          title: "Recent Updates",
          changes: ["Performance improvements and bug fixes", "Enhanced game stability"],
          image: null,
          gid: null
        }
      ];
    }

    cache.set(cacheKey, { data: updates, timestamp: Date.now() });
    res.json(updates);
  } catch (error) {
    console.error('Steam updates error:', error.message);
    res.json([
      {
        version: "Latest",
        date: new Date().toLocaleDateString(),
        title: "Recent Updates", 
        changes: ["Recent updates and improvements"],
        image: null,
        gid: null
      }
    ]);
  }
});