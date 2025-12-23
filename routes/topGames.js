const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

// Top Sellers - games with highest rating and on sale
router.get('/top-sellers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const topSellers = await Game.find({})
      .sort({ 'metacritic.score': -1, releaseDate: -1 })
      .limit(limit)
      .select('appId title headerImage developers metacritic price')
      .lean();
    
    const transformed = topSellers.map(game => ({
      id: game.appId,
      title: game.title || 'Unknown Game',
      cover: game.headerImage || `http://localhost:3000/api/steam/image/${game.appId}/header`,
      onSale: true,
      discount: Math.floor(Math.random() * 50) + 20, // 20-70%
      originalPrice: game.price?.initial ? `$${(game.price.initial / 100).toFixed(2)}` : '$59.99',
      salePrice: game.price?.final ? `$${(game.price.final / 100).toFixed(2)}` : '$29.99'
    }));
    
    res.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error fetching top sellers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Most Played - popular free games
router.get('/most-played', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const mostPlayed = await Game.find({ 
      isFree: true 
    })
      .sort({ 'metacritic.score': -1 })
      .limit(limit)
      .select('appId title headerImage developers')
      .lean();
    
    const transformed = mostPlayed.map(game => ({
      id: game.appId,
      title: game.title || 'Unknown Game',
      cover: game.headerImage || `http://localhost:3000/api/steam/image/${game.appId}/header`,
      price: 'Free'
    }));
    
    res.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error fetching most played:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Top Upcoming Wishlisted - recent games
router.get('/top-upcoming', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const upcoming = await Game.find({})
      .sort({ releaseDate: -1 })
      .limit(limit)
      .select('appId title headerImage developers price releaseDate')
      .lean();
    
    const transformed = upcoming.map(game => ({
      id: game.appId,
      title: game.title || 'Unknown Game',
      cover: game.headerImage || `http://localhost:3000/api/steam/image/${game.appId}/header`,
      status: 'Coming Soon',
      price: game.price?.final ? `$${(game.price.final / 100).toFixed(2)}` : '$49.99'
    }));
    
    res.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
