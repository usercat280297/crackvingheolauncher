const express = require('express');
const Library = require('../models/Library');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get user library
router.get('/', protect, async (req, res) => {
  try {
    const { sort = 'addedAt', order = '-1', search = '', isFavorite = false } = req.query;

    let query = { userId: req.user._id };

    if (search) {
      query.title = new RegExp(search, 'i');
    }

    if (isFavorite === 'true') {
      query.isFavorite = true;
    }

    const sortObj = {};
    sortObj[sort] = parseInt(order);

    const games = await Library.find(query).sort(sortObj);

    res.json({
      success: true,
      count: games.length,
      games
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching library'
    });
  }
});

// Add game to library
router.post('/add', protect, async (req, res) => {
  try {
    const { appId, title, thumbnail } = req.body;

    if (!appId || !title) {
      return res.status(400).json({
        success: false,
        message: 'appId and title are required'
      });
    }

    // Check if already in library
    let libraryItem = await Library.findOne({
      userId: req.user._id,
      appId
    });

    if (libraryItem) {
      return res.status(400).json({
        success: false,
        message: 'Game already in library'
      });
    }

    // Create library item
    libraryItem = new Library({
      userId: req.user._id,
      appId,
      title,
      thumbnail
    });

    await libraryItem.save();

    res.status(201).json({
      success: true,
      message: 'Game added to library',
      game: libraryItem
    });
  } catch (error) {
    console.error('Add to library error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding game to library'
    });
  }
});

// Remove game from library
router.delete('/remove/:appId', protect, async (req, res) => {
  try {
    const result = await Library.deleteOne({
      userId: req.user._id,
      appId: parseInt(req.params.appId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Game not found in library'
      });
    }

    res.json({
      success: true,
      message: 'Game removed from library'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing game'
    });
  }
});

// Toggle favorite
router.put('/toggle-favorite/:appId', protect, async (req, res) => {
  try {
    const game = await Library.findOne({
      userId: req.user._id,
      appId: parseInt(req.params.appId)
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found in library'
      });
    }

    game.isFavorite = !game.isFavorite;
    await game.save();

    res.json({
      success: true,
      message: 'Favorite toggled',
      game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling favorite'
    });
  }
});

// Update game info
router.put('/update/:appId', protect, async (req, res) => {
  try {
    const { isInstalled, installPath, installSize, playTime, lastPlayed, rating, notes } = req.body;

    const game = await Library.findOne({
      userId: req.user._id,
      appId: parseInt(req.params.appId)
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found in library'
      });
    }

    if (isInstalled !== undefined) game.isInstalled = isInstalled;
    if (installPath !== undefined) game.installPath = installPath;
    if (installSize !== undefined) game.installSize = installSize;
    if (playTime !== undefined) game.playTime = playTime;
    if (lastPlayed !== undefined) game.lastPlayed = lastPlayed;
    if (rating !== undefined) game.rating = Math.min(Math.max(rating, 0), 10);
    if (notes !== undefined) game.notes = notes;

    game.updatedAt = new Date();
    await game.save();

    res.json({
      success: true,
      message: 'Game updated',
      game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating game'
    });
  }
});

// Get library stats
router.get('/stats', protect, async (req, res) => {
  try {
    const totalGames = await Library.countDocuments({ userId: req.user._id });
    const installedGames = await Library.countDocuments({ userId: req.user._id, isInstalled: true });
    const favoriteGames = await Library.countDocuments({ userId: req.user._id, isFavorite: true });
    
    // Calculate total play time
    const result = await Library.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: null, totalPlayTime: { $sum: '$playTime' }, totalInstallSize: { $sum: '$installSize' } } }
    ]);

    const stats = result[0] || { totalPlayTime: 0, totalInstallSize: 0 };

    res.json({
      success: true,
      totalGames,
      installedGames,
      favoriteGames,
      totalPlayTime: stats.totalPlayTime,
      totalInstallSize: stats.totalInstallSize
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
});

module.exports = router;


