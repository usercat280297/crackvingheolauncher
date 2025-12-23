const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.toPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;
    const user = req.user; // Set by protect middleware

    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// Update preferences
router.put('/preferences', protect, async (req, res) => {
  try {
    const { theme, language, autoUpdate, notificationsEnabled } = req.body;
    const user = req.user;

    if (theme) user.preferences.theme = theme;
    if (language) user.preferences.language = language;
    if (autoUpdate !== undefined) user.preferences.autoUpdate = autoUpdate;
    if (notificationsEnabled !== undefined) user.preferences.notificationsEnabled = notificationsEnabled;

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated',
      preferences: user.preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating preferences'
    });
  }
});

// Get preferences
router.get('/preferences', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      preferences: req.user.preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching preferences'
    });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        users: []
      });
    }

    const users = await User.find({
      $or: [
        { username: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') }
      ]
    }).select('-password').limit(20);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching users'
    });
  }
});

module.exports = router;
