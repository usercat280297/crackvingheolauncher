const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const ImageCacheManager = require('../services/ImageCacheManager');

/**
 * GET /api/game-images/:appId
 * Lấy ảnh từ cache hoặc SteamGridDB (với auto-caching)
 */
router.get('/:appId', async (req, res) => {
  try {
    const appId = parseInt(req.params.appId);

    // Lấy từ cache hoặc fetch + cache
    const images = await ImageCacheManager.getImagesBySteamId(appId);

    if (!images) {
      return res.status(404).json({ 
        error: 'Images not found',
        appId 
      });
    }

    res.json({ 
      success: true,
      appId,
      images,
      cached: true
    });
  } catch (error) {
    console.error(`❌ Error getting images for ${req.params.appId}:`, error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/game-images/:appId/cover
 * Lấy cover image
 */
router.get('/:appId/cover', async (req, res) => {
  try {
    const appId = parseInt(req.params.appId);
    const images = await ImageCacheManager.getImagesBySteamId(appId);

    if (!images || !images.cover) {
      return res.status(404).json({ error: 'Cover image not found' });
    }

    res.json({ 
      success: true,
      appId,
      cover: images.cover,
      thumb: images.coverThumb
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/game-images/:appId/hero
 * Lấy hero image (wide banner)
 */
router.get('/:appId/hero', async (req, res) => {
  try {
    const appId = parseInt(req.params.appId);
    const images = await ImageCacheManager.getImagesBySteamId(appId);

    if (!images || !images.hero) {
      return res.status(404).json({ error: 'Hero image not found' });
    }

    res.json({ 
      success: true,
      appId,
      hero: images.hero,
      thumb: images.heroThumb
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/game-images/sync-cache
 * Trigger manual sync cache (admin only)
 */
router.post('/sync-cache', async (req, res) => {
  try {
    const { limit = 20 } = req.body;

    // TODO: Add auth middleware to check admin

    console.log(`🔄 Manual sync triggered for ${limit} games`);
    ImageCacheManager.backgroundSyncImages(limit);

    res.json({ 
      success: true,
      message: `Started syncing ${limit} games in background`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/game-images/stats
 * Lấy stats về cache
 */
router.get('/stats', async (req, res) => {
  try {
    const total = await Game.countDocuments();
    const cached = await Game.countDocuments({ 
      images: { $exists: true, $ne: {} }
    });
    const cacheRate = Math.round((cached / total) * 100);

    res.json({
      success: true,
      total,
      cached,
      cacheRate: `${cacheRate}%`,
      message: `${cached}/${total} games have cached images`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
