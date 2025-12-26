const express = require('express');
const router = express.Router();

// GET playtime for a game
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    res.json({ 
      gameId,
      playtime: 0,
      lastPlayed: null
    });
  } catch (error) {
    console.error('Error fetching playtime:', error);
    res.status(500).json({ error: 'Failed to fetch playtime' });
  }
});

// POST update playtime
router.post('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { duration } = req.body;
    res.json({ 
      success: true,
      gameId,
      playtime: duration
    });
  } catch (error) {
    console.error('Error updating playtime:', error);
    res.status(500).json({ error: 'Failed to update playtime' });
  }
});

module.exports = router;
