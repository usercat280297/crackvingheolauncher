const express = require('express');
const router = express.Router();
const DownloadManager = require('../modules/DownloadManager');
const path = require('path');
const fs = require('fs');

/**
 * POST /api/downloads/start
 * Start a new download
 */
router.post('/start', (req, res) => {
  try {
    const { torrentPath, gameId, gameName } = req.body;

    if (!torrentPath || !gameId || !gameName) {
      return res.status(400).json({
        success: false,
        error: 'torrentPath, gameId, and gameName are required'
      });
    }

    if (!fs.existsSync(torrentPath)) {
      return res.status(404).json({
        success: false,
        error: 'Torrent file not found'
      });
    }

    // Use HTTP streaming for progress updates
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    const progressCallback = (data) => {
      res.write(JSON.stringify(data) + '\n');
    };

    DownloadManager.downloadGame(
      torrentPath,
      { gameId, gameName },
      progressCallback
    ).then(result => {
      res.write(JSON.stringify(result) + '\n');
      res.end();
    }).catch(error => {
      res.write(JSON.stringify({
        success: false,
        error: error.message
      }) + '\n');
      res.end();
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/downloads/active
 * Get all active downloads
 */
router.get('/active', (req, res) => {
  try {
    const downloads = DownloadManager.getActiveDownloads();
    res.json({
      success: true,
      data: downloads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/downloads/history
 * Get download history
 */
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = DownloadManager.getDownloadHistory(limit);
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/downloads/:gameId
 * Get specific download status
 */
router.get('/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    const status = DownloadManager.getDownloadStatus(gameId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Download not found'
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/downloads/:gameId/pause
 * Pause a download
 */
router.put('/:gameId/pause', (req, res) => {
  try {
    const { gameId } = req.params;
    const result = DownloadManager.pauseDownload(gameId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/downloads/:gameId/resume
 * Resume a download
 */
router.put('/:gameId/resume', (req, res) => {
  try {
    const { gameId } = req.params;
    const result = DownloadManager.resumeDownload(gameId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/downloads/:gameId
 * Cancel a download
 */
router.delete('/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    const result = DownloadManager.cancelDownload(gameId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
