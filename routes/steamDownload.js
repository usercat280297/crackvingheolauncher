const express = require('express');
const router = express.Router();
const steamDownloadManager = require('../services/SteamDownloadManager');

// @desc    Start game download
// @route   POST /api/steam-download/start
// @access  Public
router.post('/start', async (req, res) => {
  try {
    const { appId, gameName } = req.body;

    if (!appId) {
      return res.status(400).json({ 
        success: false, 
        message: 'AppID is required' 
      });
    }

    const result = await steamDownloadManager.startDownload(appId, gameName || `Game ${appId}`);
    res.json(result);
  } catch (error) {
    console.error('Start download error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start download' 
    });
  }
});

// @desc    Get download progress
// @route   GET /api/steam-download/progress/:appId
// @access  Public
router.get('/progress/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const progress = await steamDownloadManager.getDownloadProgress(appId);
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get progress' 
    });
  }
});

// @desc    Pause download
// @route   POST /api/steam-download/pause/:appId
// @access  Public
router.post('/pause/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const result = await steamDownloadManager.pauseDownload(appId);
    res.json(result);
  } catch (error) {
    console.error('Pause download error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to pause download' 
    });
  }
});

// @desc    Resume download
// @route   POST /api/steam-download/resume/:appId
// @access  Public
router.post('/resume/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const result = await steamDownloadManager.resumeDownload(appId);
    res.json(result);
  } catch (error) {
    console.error('Resume download error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to resume download' 
    });
  }
});

// @desc    Cancel download
// @route   POST /api/steam-download/cancel/:appId
// @access  Public
router.post('/cancel/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const result = await steamDownloadManager.cancelDownload(appId);
    res.json(result);
  } catch (error) {
    console.error('Cancel download error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel download' 
    });
  }
});

// @desc    Get all active downloads
// @route   GET /api/steam-download/active
// @access  Public
router.get('/active', (req, res) => {
  try {
    const downloads = steamDownloadManager.getActiveDownloads();
    res.json({
      success: true,
      data: downloads
    });
  } catch (error) {
    console.error('Get active downloads error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get active downloads' 
    });
  }
});

module.exports = router;
