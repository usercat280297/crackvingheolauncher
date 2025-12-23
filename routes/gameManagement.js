const express = require('express');
const router = express.Router();
const gameInstallService = require('../services/gameInstallService');

// Get settings
router.get('/settings', (req, res) => {
  res.json({
    success: true,
    settings: gameInstallService.settings
  });
});

// Update settings
router.post('/settings', (req, res) => {
  try {
    const newSettings = { ...gameInstallService.settings, ...req.body };
    gameInstallService.saveSettings(newSettings);
    
    res.json({
      success: true,
      settings: newSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start download
router.post('/download', async (req, res) => {
  try {
    const { gameId, gameData, downloadUrl } = req.body;
    
    if (!gameId || !gameData || !downloadUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const download = await gameInstallService.downloadGame(gameId, gameData, downloadUrl);
    
    res.json({
      success: true,
      download
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get download status
router.get('/download/:downloadId', (req, res) => {
  const download = gameInstallService.getDownloadStatus(req.params.downloadId);
  
  if (!download) {
    return res.status(404).json({
      success: false,
      error: 'Download not found'
    });
  }
  
  res.json({
    success: true,
    download
  });
});

// Get all downloads
router.get('/downloads', (req, res) => {
  const downloads = gameInstallService.getAllDownloads();
  
  res.json({
    success: true,
    downloads
  });
});

// Pause download
router.post('/download/:downloadId/pause', (req, res) => {
  gameInstallService.pauseDownload(req.params.downloadId);
  
  res.json({
    success: true,
    message: 'Download paused'
  });
});

// Resume download
router.post('/download/:downloadId/resume', (req, res) => {
  gameInstallService.resumeDownload(req.params.downloadId);
  
  res.json({
    success: true,
    message: 'Download resumed'
  });
});

// Cancel download
router.post('/download/:downloadId/cancel', (req, res) => {
  gameInstallService.cancelDownload(req.params.downloadId);
  
  res.json({
    success: true,
    message: 'Download cancelled'
  });
});

// Get installation status
router.get('/installation/:downloadId', (req, res) => {
  const installation = gameInstallService.getInstallationStatus(req.params.downloadId);
  
  if (!installation) {
    return res.status(404).json({
      success: false,
      error: 'Installation not found'
    });
  }
  
  res.json({
    success: true,
    installation
  });
});

// Get all installations
router.get('/installations', (req, res) => {
  const installations = gameInstallService.getAllInstallations();
  
  res.json({
    success: true,
    installations
  });
});

// Uninstall game
router.post('/uninstall', async (req, res) => {
  try {
    const { gameId, installDir } = req.body;
    
    if (!gameId || !installDir) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    await gameInstallService.uninstallGame(gameId, installDir);
    
    res.json({
      success: true,
      message: 'Game uninstalled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify game files
router.post('/verify', async (req, res) => {
  try {
    const { gameId, installDir } = req.body;
    
    if (!gameId || !installDir) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const verification = await gameInstallService.verifyGameFiles(gameId, installDir);
    
    res.json({
      success: true,
      verification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Launch game
router.post('/launch', (req, res) => {
  try {
    const { gameId, installDir, launchOptions } = req.body;
    
    if (!gameId || !installDir) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Simulate game launch
    res.json({
      success: true,
      message: 'Game launched',
      gameId,
      installDir,
      launchOptions: launchOptions || {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
