const express = require('express');
const axios = require('axios');
const router = express.Router();

// Cache để tránh spam API
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

// Steam API endpoints
const STEAM_STORE_API = 'https://store.steampowered.com/api/appdetails';
const STEAM_SEARCH_API = 'https://steamcommunity.com/actions/SearchApps';
const STEAM_ACHIEVEMENTS_API = 'https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2';

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
    
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return res.json(cached.data);
      }
    }

    const response = await axios.get(STEAM_STORE_API, {
      params: { appids: appid, l: 'english' },
      timeout: 10000
    });

    const gameData = response.data[appid];
    if (!gameData || !gameData.success) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = gameData.data;
    const result = {
      appid: game.steam_appid,
      name: game.name,
      description: game.short_description || game.detailed_description?.replace(/<[^>]*>/g, '') || '',
      cover: `http://localhost:3000/api/steam/image/${appid}/header`,
      screenshots: game.screenshots?.slice(0, 5).map((s, i) => 
        `http://localhost:3000/api/steam/screenshot/${appid}/${i}`
      ) || [],
      videoId: game.movies?.[0]?.webm?.max || game.movies?.[0]?.mp4?.max || null,
      developer: game.developers?.[0] || 'Unknown',
      publisher: game.publishers?.[0] || 'Unknown',
      releaseDate: game.release_date?.date || 'Unknown',
      genres: game.genres?.map(g => g.description).join(', ') || '',
      price: game.price_overview ? `$${game.price_overview.final_formatted}` : 'Free',
      rating: game.metacritic?.score ? `${game.metacritic.score}%` : 'N/A',
      requirements: {
        minimum: game.pc_requirements?.minimum || '',
        recommended: game.pc_requirements?.recommended || ''
      }
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    res.json(result);
  } catch (error) {
    console.error('Steam game details error:', error.message);
    res.status(500).json({ error: 'Failed to fetch game details' });
  }
});

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

// Proxy cho screenshot
router.get('/screenshot/:appid/:index', async (req, res) => {
  try {
    const { appid, index } = req.params;
    
    // Get game data để lấy screenshot URLs
    const gameResponse = await axios.get(STEAM_STORE_API, {
      params: { appids: appid, l: 'english' },
      timeout: 5000
    });

    const gameData = gameResponse.data[appid];
    if (!gameData?.success || !gameData.data.screenshots?.[index]) {
      return res.status(404).send('Screenshot not found');
    }

    const screenshotUrl = gameData.data.screenshots[index].path_full;
    const response = await axios.get(screenshotUrl, {
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
    res.redirect('https://via.placeholder.com/600x338/1a1a1a/ffffff?text=No+Screenshot');
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
      params: { appid, key: 'STEAMKEY' },
      timeout: 10000
    });

    const achievements = response.data?.game?.availableGameStats?.achievements || [];
    const result = achievements.slice(0, 20).map(ach => ({
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

module.exports = router;