const express = require('express');
const axios = require('axios');
const salesUpdateService = require('../services/SalesUpdateService');
const router = express.Router();

// Epic Games Free Games API
router.get('/epic/free', async (req, res) => {
  try {
    const cachedData = salesUpdateService.getEpicSales();
    
    if (cachedData.success && cachedData.data.length > 0) {
      res.json({
        success: true,
        data: cachedData.data,
        lastUpdated: cachedData.lastUpdate,
        cached: true
      });
    } else {
      // Force update if no cached data
      const freshData = await salesUpdateService.updateEpicSales();
      res.json({
        success: freshData.length > 0,
        data: freshData,
        lastUpdated: new Date().toISOString(),
        cached: false
      });
    }
  } catch (error) {
    console.error('Epic Games API Error:', error.message);
    res.json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

// Steam Featured & Specials API
router.get('/steam/featured', async (req, res) => {
  try {
    const cachedData = salesUpdateService.getSteamSales();
    
    if (cachedData.success && cachedData.data.length > 0) {
      res.json({
        success: true,
        data: cachedData.data,
        lastUpdated: cachedData.lastUpdate,
        cached: true
      });
    } else {
      // Force update if no cached data
      const freshData = await salesUpdateService.updateSteamSales();
      res.json({
        success: freshData.length > 0,
        data: freshData,
        lastUpdated: new Date().toISOString(),
        cached: false
      });
    }
  } catch (error) {
    console.error('Steam API Error:', error.message);
    res.json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

// Steam Top Sellers
router.get('/steam/topsellers', async (req, res) => {
  try {
    const response = await axios.get('https://store.steampowered.com/api/featuredcategories/?cc=US&l=english');
    
    const topSellers = response.data.top_sellers?.items?.slice(0, 10).map(game => ({
      id: game.id,
      title: game.name,
      image: game.header_image,
      originalPrice: game.original_price ? `$${(game.original_price / 100).toFixed(2)}` : null,
      discountPrice: game.final_price ? `$${(game.final_price / 100).toFixed(2)}` : null,
      discount: game.discount_percent ? `${game.discount_percent}%` : null,
      url: `https://store.steampowered.com/app/${game.id}/`,
      tags: game.tags || []
    })) || [];

    res.json({
      success: true,
      data: topSellers,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Steam Top Sellers API Error:', error.message);
    res.json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

// Force refresh sales data
router.post('/refresh', async (req, res) => {
  try {
    await salesUpdateService.updateAllSales();
    res.json({
      success: true,
      message: 'Sales data refreshed successfully',
      status: salesUpdateService.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get sales update status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: salesUpdateService.getStatus()
  });
});

module.exports = router;