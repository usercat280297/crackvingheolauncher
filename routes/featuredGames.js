const express = require('express');
const router = express.Router();
const axios = require('axios');

// Cache featured games for 1 hour
let cachedFeatured = null;
let cacheTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Get featured games from Steam
router.get('/featured', async (req, res) => {
  try {
    // Return cache if valid
    if (cachedFeatured && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
      return res.json(cachedFeatured);
    }

    // Fetch from Steam Featured API
    const response = await axios.get('https://store.steampowered.com/api/featured/', {
      timeout: 10000
    });

    if (!response.data || !response.data.featured_win) {
      throw new Error('Invalid Steam API response');
    }

    // Get top 7 featured games
    const featured = response.data.featured_win.slice(0, 7).map(game => ({
      id: game.id,
      title: game.name,
      cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/header.jpg`,
      hero: `https://cdn2.steamgriddb.com/steam/${game.id}/hero.png`,
      description: game.header_image ? 'Featured on Steam' : '',
      rating: game.discount_percent > 0 ? '90%' : '85%',
      developer: 'Steam Featured',
      size: '50 GB',
      discount: game.discount_percent || 0,
      originalPrice: game.original_price ? `$${(game.original_price / 100).toFixed(2)}` : null,
      finalPrice: game.final_price ? `$${(game.final_price / 100).toFixed(2)}` : null
    }));

    // Cache result
    cachedFeatured = featured;
    cacheTime = Date.now();

    res.json(featured);
  } catch (error) {
    console.error('Error fetching featured games:', error.message);
    
    // Fallback to popular game IDs if Steam API fails
    const fallbackIds = [1091500, 292030, 1174180, 1245620, 1593500, 1151640, 2358720];
    const fallback = fallbackIds.map(id => ({
      id,
      title: 'Popular Game',
      cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`,
      hero: `https://cdn2.steamgriddb.com/steam/${id}/hero.png`,
      description: 'Popular on Steam',
      rating: '85%',
      developer: 'Steam',
      size: '50 GB'
    }));

    res.json(fallback);
  }
});

module.exports = router;
