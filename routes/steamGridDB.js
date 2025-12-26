const express = require('express');
const router = express.Router();
const steamGridDB = require('../services/steamGridDB');

/**
 * GET /api/steam-grid-db/images/:appId
 * Fetch all images (hero, cover, logo) from SteamGridDB
 */
router.get('/images/:appId', async (req, res) => {
  try {
    const { appId } = req.params;

    if (!appId || isNaN(appId)) {
      return res.status(400).json({ error: 'Invalid appId' });
    }

    const images = await steamGridDB.getAllImages(parseInt(appId));

    res.json({
      success: true,
      appId: parseInt(appId),
      images
    });
  } catch (error) {
    console.error('Error fetching images:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/steam-grid-db/hero/:appId
 * Fetch hero image only
 */
router.get('/hero/:appId', async (req, res) => {
  try {
    const { appId } = req.params;

    if (!appId || isNaN(appId)) {
      return res.status(400).json({ error: 'Invalid appId' });
    }

    const hero = await steamGridDB.getHeroImage(parseInt(appId));

    res.json({
      success: true,
      appId: parseInt(appId),
      hero
    });
  } catch (error) {
    console.error('Error fetching hero:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/steam-grid-db/cover/:appId
 * Fetch cover image only
 */
router.get('/cover/:appId', async (req, res) => {
  try {
    const { appId } = req.params;

    if (!appId || isNaN(appId)) {
      return res.status(400).json({ error: 'Invalid appId' });
    }

    const cover = await steamGridDB.getCoverImage(parseInt(appId));

    res.json({
      success: true,
      appId: parseInt(appId),
      cover
    });
  } catch (error) {
    console.error('Error fetching cover:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/steam-grid-db/logo/:appId
 * Fetch logo image only
 */
router.get('/logo/:appId', async (req, res) => {
  try {
    const { appId } = req.params;

    if (!appId || isNaN(appId)) {
      return res.status(400).json({ error: 'Invalid appId' });
    }

    const logo = await steamGridDB.getLogoImage(parseInt(appId));

    res.json({
      success: true,
      appId: parseInt(appId),
      logo
    });
  } catch (error) {
    console.error('Error fetching logo:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/steam-grid-db/clear-cache
 * Clear cache for a game or all games
 */
router.post('/clear-cache', async (req, res) => {
  try {
    const { appId } = req.body;

    if (appId) {
      steamGridDB.clearCache(parseInt(appId));
      return res.json({
        success: true,
        message: `Cache cleared for appId ${appId}`
      });
    } else {
      steamGridDB.clearCache();
      return res.json({
        success: true,
        message: 'All cache cleared'
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
