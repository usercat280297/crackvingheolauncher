const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const TorrentDownloadManager = require('../services/TorrentDownloadManager');

// Initialize torrent manager (singleton)
let torrentManager = null;

function getTorrentManager() {
  if (!torrentManager) {
    torrentManager = new TorrentDownloadManager({
      downloadPath: process.env.GAMES_PATH || 'C:\\Games\\Torrents',
      maxConnections: 50,
      maxPeers: 30
    });
  }
  return torrentManager;
}

/**
 * POST /api/torrent/download
 * Bắt đầu download game từ torrent
 * 
 * Body:
 * {
 *   "torrentPath": "path/to/game.torrent" hoặc magnet link,
 *   "gameId": "123",
 *   "gameName": "Cyberpunk 2077",
 *   "outputPath": "C:\\Games\\Cyberpunk", (optional)
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

    res.json({
      success: true,
      downloadId: result.downloadId,
      message: `Started downloading ${gameName}`,
      download: {
        id: result.downloadId,
        gameName: result.download.gameName,
        status: result.download.status,
        outputPath: result.download.outputPath
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
 * Lấy trạng thái download
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
        timeElapsed: Math.round((Date.now() - status.startTime) / 1000)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/torrent/all
 * Lấy tất cả downloads
 */
router.get('/all', (req, res) => {
  try {
    const manager = getTorrentManager();
    const downloads = manager.getAllDownloads();

    res.json({
      success: true,
      count: downloads.length,
      downloads
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/torrent/pause/:downloadId
 * Tạm dừng download
 */
router.post('/pause/:downloadId', (req, res) => {
  try {
    const manager = getTorrentManager();
    manager.pauseDownload(req.params.downloadId);

    res.json({
      success: true,
      message: 'Download paused'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/torrent/resume/:downloadId
 * Tiếp tục download
 */
router.post('/resume/:downloadId', (req, res) => {
  try {
    const manager = getTorrentManager();
    manager.resumeDownload(req.params.downloadId);

    res.json({
      success: true,
      message: 'Download resumed'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/torrent/cancel/:downloadId
 * Hủy download
 */
router.post('/cancel/:downloadId', async (req, res) => {
  try {
    const manager = getTorrentManager();
    await manager.cancelDownload(req.params.downloadId);

    res.json({
      success: true,
      message: 'Download cancelled'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
