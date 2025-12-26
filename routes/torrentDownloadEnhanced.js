const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const TorrentDownloadManager = require('../services/TorrentDownloadManager');

/**
 * 🚀 Enhanced Torrent Download Routes
 * 
 * Features:
 * - Full download management (download, pause, resume, cancel)
 * - Real-time progress via WebSocket (global.io)
 * - Auto-unzip on completion
 * - Error recovery
 */

// Initialize torrent manager (singleton)
let torrentManager = null;

function getTorrentManager() {
  if (!torrentManager) {
    torrentManager = new TorrentDownloadManager({
      downloadPath: process.env.GAMES_PATH || 'C:\\Games\\Torrents',
      maxConnections: 50,
      maxPeers: 30
    });

    // Setup event listeners for WebSocket broadcasting
    setupEventListeners(torrentManager);
  }
  return torrentManager;
}

/**
 * Setup WebSocket event broadcasting
 */
function setupEventListeners(manager) {
  const io = global.io;
  if (!io) {
    console.warn('⚠️  WebSocket not available');
    return;
  }

  // Broadcast progress updates
  manager.on('download-progress', (data) => {
    io.emit('torrent:progress', {
      downloadId: data.id,
      progress: data.progress,
      speed: data.speed,
      eta: data.eta,
      downloaded: data.downloaded,
      total: data.total
    });
  });

  // Download completed
  manager.on('download-complete', (data) => {
    io.emit('torrent:complete', {
      downloadId: data.downloadId,
      gameName: data.gameName,
      outputPath: data.outputPath
    });
  });

  // Unzip started
  manager.on('unzip-start', (data) => {
    io.emit('torrent:unzip-start', {
      downloadId: data.downloadId
    });
  });

  // Unzip progress
  manager.on('unzip-progress', (data) => {
    io.emit('torrent:unzip-progress', {
      downloadId: data.downloadId,
      file: data.file,
      status: data.status
    });
  });

  // Unzip complete
  manager.on('unzip-complete', (data) => {
    io.emit('torrent:unzip-complete', {
      downloadId: data.downloadId
    });
  });

  // Download error
  manager.on('download-error', (data) => {
    io.emit('torrent:error', {
      downloadId: data.downloadId,
      gameName: data.gameName,
      error: data.error.message
    });
  });
}

/**
 * POST /api/torrent/download
 * Start a new torrent download
 * 
 * Body:
 * {
 *   "torrentPath": "path/to/game.torrent" or magnet link,
 *   "gameId": "123",
 *   "gameName": "Cyberpunk 2077",
 *   "outputPath": "C:\\Games\\Cyberpunk" (optional),
 *   "autoUnzip": true
 * }
 */
router.post('/download', async (req, res) => {
  try {
    const { torrentPath, gameId, gameName, outputPath, autoUnzip = true } = req.body;

    if (!torrentPath || !gameName) {
      return res.status(400).json({
        success: false,
        error: 'torrentPath and gameName are required'
      });
    }

    const manager = getTorrentManager();
    const result = await manager.downloadGame(torrentPath, {
      gameId,
      gameName,
      outputPath,
      autoUnzip
    });

    // Emit download started event
    global.io?.emit('torrent:started', {
      downloadId: result.downloadId,
      gameName,
      status: 'downloading'
    });

    res.json({
      success: true,
      downloadId: result.downloadId,
      message: `Started downloading ${gameName}`,
      download: {
        id: result.downloadId,
        gameName: result.download.gameName,
        status: result.download.status,
        outputPath: result.download.outputPath,
        autoUnzip: result.download.autoUnzip
      }
    });
  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/torrent/status/:downloadId
 * Get download status with detailed info
 */
router.get('/status/:downloadId', (req, res) => {
  try {
    const manager = getTorrentManager();
    const status = manager.getDownloadStatus(req.params.downloadId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Download not found'
      });
    }

    const timeElapsed = Math.round((Date.now() - status.startTime) / 1000);
    const timeRemaining = status.eta;
    const averageSpeed = status.downloaded > 0 ? (status.downloaded * 1024) / (timeElapsed / 3600) : 0; // MB/h

    res.json({
      success: true,
      download: {
        id: status.id,
        gameName: status.gameName,
        status: status.status,
        progress: status.progress,
        speed: status.speed, // MB/s
        eta: status.eta, // seconds
        downloaded: status.downloaded, // GB
        total: status.total, // GB
        startTime: new Date(status.startTime).toISOString(),
        timeElapsed,
        timeRemaining,
        averageSpeed: parseFloat(averageSpeed.toFixed(2)),
        autoUnzip: status.autoUnzip,
        outputPath: status.outputPath,
        error: status.error || null,
        unzipError: status.unzipError || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/torrent/all
 * Get all active downloads
 */
router.get('/all', (req, res) => {
  try {
    const manager = getTorrentManager();
    const downloads = manager.getAllDownloads();

    res.json({
      success: true,
      count: downloads.length,
      downloads: downloads.map(d => ({
        ...d,
        startTime: new Date(d.startTime).toISOString(),
        timeElapsed: Math.round((Date.now() - d.startTime) / 1000)
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/torrent/pause/:downloadId
 * Pause a download
 */
router.post('/pause/:downloadId', (req, res) => {
  try {
    const manager = getTorrentManager();
    const status = manager.getDownloadStatus(req.params.downloadId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Download not found'
      });
    }

    manager.pauseDownload(req.params.downloadId);

    // Emit pause event
    global.io?.emit('torrent:paused', {
      downloadId: req.params.downloadId,
      gameName: status.gameName
    });

    res.json({
      success: true,
      message: `Paused: ${status.gameName}`,
      downloadId: req.params.downloadId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/torrent/resume/:downloadId
 * Resume a paused download
 */
router.post('/resume/:downloadId', (req, res) => {
  try {
    const manager = getTorrentManager();
    const status = manager.getDownloadStatus(req.params.downloadId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Download not found'
      });
    }

    manager.resumeDownload(req.params.downloadId);

    // Emit resume event
    global.io?.emit('torrent:resumed', {
      downloadId: req.params.downloadId,
      gameName: status.gameName
    });

    res.json({
      success: true,
      message: `Resumed: ${status.gameName}`,
      downloadId: req.params.downloadId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/torrent/cancel/:downloadId
 * Cancel a download
 */
router.post('/cancel/:downloadId', async (req, res) => {
  try {
    const manager = getTorrentManager();
    const status = manager.getDownloadStatus(req.params.downloadId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Download not found'
      });
    }

    const gameName = status.gameName;
    await manager.cancelDownload(req.params.downloadId);

    // Emit cancel event
    global.io?.emit('torrent:cancelled', {
      downloadId: req.params.downloadId,
      gameName
    });

    res.json({
      success: true,
      message: `Cancelled: ${gameName}`,
      downloadId: req.params.downloadId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/torrent/retry/:downloadId
 * Retry a failed download
 */
router.post('/retry/:downloadId', async (req, res) => {
  try {
    const manager = getTorrentManager();
    const status = manager.getDownloadStatus(req.params.downloadId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Download not found'
      });
    }

    if (status.status !== 'error') {
      return res.status(400).json({
        success: false,
        error: 'Download is not in error state'
      });
    }

    // Cancel old download
    await manager.cancelDownload(req.params.downloadId);

    // Start new download with same parameters
    const result = await manager.downloadGame(status.torrentPath, {
      gameId: status.id,
      gameName: status.gameName,
      outputPath: status.outputPath,
      autoUnzip: status.autoUnzip
    });

    res.json({
      success: true,
      message: `Retry started for: ${status.gameName}`,
      newDownloadId: result.downloadId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/torrent/:downloadId
 * Delete completed download folder
 */
router.delete('/:downloadId', async (req, res) => {
  try {
    const manager = getTorrentManager();
    const status = manager.getDownloadStatus(req.params.downloadId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Download not found'
      });
    }

    if (status.status !== 'ready' && status.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Can only delete completed downloads'
      });
    }

    // Ask for confirmation with folder path
    res.json({
      success: true,
      message: 'Ready to delete',
      downloadId: req.params.downloadId,
      outputPath: status.outputPath,
      gameName: status.gameName,
      requiresConfirmation: true
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/torrent/:downloadId/confirm-delete
 * Confirm deletion and remove folder
 */
router.post('/:downloadId/confirm-delete', async (req, res) => {
  try {
    const manager = getTorrentManager();
    const status = manager.getDownloadStatus(req.params.downloadId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Download not found'
      });
    }

    const outputPath = status.outputPath;

    // Remove folder
    await fs.remove(outputPath);

    // Remove from manager
    manager.downloads.delete(req.params.downloadId);

    // Emit delete event
    global.io?.emit('torrent:deleted', {
      downloadId: req.params.downloadId,
      gameName: status.gameName
    });

    res.json({
      success: true,
      message: `Deleted: ${status.gameName}`,
      downloadId: req.params.downloadId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/torrent/stats
 * Get torrent manager statistics
 */
router.get('/stats', (req, res) => {
  try {
    const manager = getTorrentManager();
    const downloads = manager.getAllDownloads();

    const downloading = downloads.filter(d => d.status === 'downloading').length;
    const paused = downloads.filter(d => d.status === 'paused').length;
    const completed = downloads.filter(d => d.status === 'ready' || d.status === 'completed').length;
    const failed = downloads.filter(d => d.status === 'error').length;

    const totalSpeed = downloads
      .filter(d => d.status === 'downloading')
      .reduce((sum, d) => sum + (d.speed || 0), 0);

    const totalDownloaded = downloads.reduce((sum, d) => sum + (d.downloaded || 0), 0);
    const totalSize = downloads.reduce((sum, d) => sum + (d.total || 0), 0);

    res.json({
      success: true,
      stats: {
        total: downloads.length,
        downloading,
        paused,
        completed,
        failed,
        totalSpeed: parseFloat(totalSpeed.toFixed(2)),
        totalDownloaded: parseFloat(totalDownloaded.toFixed(2)),
        totalSize: parseFloat(totalSize.toFixed(2)),
        totalProgress: totalSize > 0 ? parseFloat(((totalDownloaded / totalSize) * 100).toFixed(2)) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
