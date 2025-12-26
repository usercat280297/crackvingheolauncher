/**
 * ============================================
 * API ROUTES FOR BEAUTIFUL GAME NAMES
 * Provides SteamGridDB names for Store page
 * ============================================
 */

const express = require('express');
const router = express.Router();

// Mock data - Replace with actual DB queries
const beautifulGameNames = {
  2246340: { beautifulName: 'Monster Hunter: Wilds', source: 'steamgriddb' },
  1364780: { beautifulName: 'STREET FIGHTER 6', source: 'steamgriddb' },
  2050650: { beautifulName: 'RESIDENT EVIL 4', source: 'steamgriddb' },
  2515020: { beautifulName: 'FINAL FANTASY XVI', source: 'steamgriddb' },
  2124490: { beautifulName: 'SILENT HILL 2', source: 'steamgriddb' },
  1245620: { beautifulName: 'ELDEN RING', source: 'steamgriddb' },
  1174180: { beautifulName: 'Red Dead Redemption 2', source: 'steamgriddb' },
  271590: { beautifulName: 'Grand Theft Auto V', source: 'steamgriddb' },
  730: { beautifulName: 'Counter-Strike 2', source: 'steamgriddb' },
  10090: { beautifulName: 'Call of Duty 4: Modern Warfare', source: 'steamgriddb' },
};

/**
 * GET /api/denuvo/steamgriddb/name/:gameId
 * Get beautiful name for a single game
 */
router.get('/steamgriddb/name/:gameId', (req, res) => {
  try {
    const gameId = req.params.gameId;
    const name = beautifulGameNames[gameId];

    if (name) {
      return res.json({
        gameId,
        beautifulName: name.beautifulName,
        source: name.source,
        success: true
      });
    }

    // Fallback
    res.json({
      gameId,
      beautifulName: null,
      source: 'fallback',
      success: false
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch game name',
      message: error.message
    });
  }
});

/**
 * POST /api/denuvo/steamgriddb/batch-names
 * Get beautiful names for multiple games
 */
router.post('/steamgriddb/batch-names', (req, res) => {
  try {
    const { gameIds } = req.body;

    if (!Array.isArray(gameIds)) {
      return res.status(400).json({ error: 'gameIds must be an array' });
    }

    const names = gameIds.map(gameId => {
      const name = beautifulGameNames[gameId];
      return {
        gameId,
        beautifulName: name?.beautifulName || null,
        source: name?.source || 'fallback'
      };
    });

    res.json({
      names,
      success: true,
      cached: names.filter(n => n.beautifulName).length,
      total: names.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch batch names',
      message: error.message
    });
  }
});

module.exports = router;
