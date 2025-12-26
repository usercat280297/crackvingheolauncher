/**
 * ============================================
 * DENUVO API ROUTES
 * Accurate detection + Beautiful game names
 * ============================================
 */

const express = require('express');
const DenuvoDetectionService = require('../services/DenuvoDetectionService');
const EnhancedSteamGridDBService = require('../services/EnhancedSteamGridDBService');

const router = express.Router();

/**
 * GET /api/denuvo/check/:appId
 * Check if game has Denuvo
 */
router.get('/check/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const result = await DenuvoDetectionService.getFullDenuvoStatus(appId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Denuvo check error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/denuvo/batch
 * Batch check denuvo for multiple games
 */
router.post('/batch', async (req, res) => {
  try {
    const { appIds } = req.body;

    if (!Array.isArray(appIds)) {
      return res.status(400).json({
        success: false,
        error: 'appIds must be an array',
      });
    }

    const results = await DenuvoDetectionService.batchCheckDenuvo(appIds);

    res.json({
      success: true,
      count: appIds.length,
      data: results,
    });
  } catch (error) {
    console.error('❌ Batch denuvo error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/denuvo/list
 * Get verified denuvo games list
 */
router.get('/list', (req, res) => {
  try {
    const verified = DenuvoDetectionService.getVerifiedDenuvoList();

    res.json({
      success: true,
      count: verified.critical.length,
      data: verified,
    });
  } catch (error) {
    console.error('❌ List denuvo error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/denuvo/stats
 * Get cache statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = DenuvoDetectionService.getCacheStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ Stats error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/denuvo/clear-cache
 * Clear old cache entries
 */
router.post('/clear-cache', (req, res) => {
  try {
    DenuvoDetectionService.clearOldCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error('❌ Cache clear error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
