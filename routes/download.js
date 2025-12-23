const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

let WebTorrent;
let client;
const activeDownloads = new Map();

// Dynamic import WebTorrent
(async () => {
  const module = await import('webtorrent');
  WebTorrent = module.default;
  client = new WebTorrent();
  console.log('✅ WebTorrent initialized');
})();

// Start download
router.post('/start', async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({ error: 'WebTorrent not ready yet' });
    }
    
    const { gameId, gameName, installPath, autoUpdate, createShortcut } = req.body;
    
    // Test torrent - Big Buck Bunny (nhẹ, 350MB)
    const testTorrent = 'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny';
    
    const downloadPath = path.join(installPath, gameName);
    
    // Create download directory
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    const torrent = client.add(testTorrent, {
      path: downloadPath
    });

    const downloadId = `${gameId}_${Date.now()}`;
    
    activeDownloads.set(downloadId, {
      id: downloadId,
      gameId,
      gameName,
      torrent,
      installPath: downloadPath,
      autoUpdate,
      createShortcut,
      status: 'downloading',
      progress: 0,
      speed: 0,
      downloaded: 0,
      total: 0,
      startTime: Date.now()
    });

    torrent.on('download', () => {
      const download = activeDownloads.get(downloadId);
      if (download) {
        download.progress = Math.round((torrent.progress * 100) * 100) / 100;
        download.speed = torrent.downloadSpeed;
        download.downloaded = torrent.downloaded;
        download.total = torrent.length;
      }
    });

    torrent.on('done', () => {
      const download = activeDownloads.get(downloadId);
      if (download) {
        download.status = 'completed';
        download.progress = 100;
        console.log(`✅ Download completed: ${gameName}`);
      }
    });

    torrent.on('error', (err) => {
      console.error('Torrent error:', err);
      const download = activeDownloads.get(downloadId);
      if (download) {
        download.status = 'error';
        download.error = err.message;
      }
    });

    res.json({
      success: true,
      downloadId,
      message: 'Download started'
    });
  } catch (error) {
    console.error('Download start error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get download status
router.get('/status/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const download = activeDownloads.get(downloadId);
  
  if (!download) {
    return res.status(404).json({ error: 'Download not found' });
  }

  res.json({
    id: download.id,
    gameId: download.gameId,
    gameName: download.gameName,
    status: download.status,
    progress: download.progress,
    speed: download.speed,
    downloaded: download.downloaded,
    total: download.total,
    installPath: download.installPath
  });
});

// Get all downloads
router.get('/list', (req, res) => {
  const downloads = Array.from(activeDownloads.values()).map(d => ({
    id: d.id,
    gameId: d.gameId,
    gameName: d.gameName,
    status: d.status,
    progress: d.progress,
    speed: d.speed,
    downloaded: d.downloaded,
    total: d.total,
    installPath: d.installPath
  }));
  
  res.json(downloads);
});

// Pause download
router.post('/pause/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const download = activeDownloads.get(downloadId);
  
  if (!download) {
    return res.status(404).json({ error: 'Download not found' });
  }

  download.torrent.pause();
  download.status = 'paused';
  
  res.json({ success: true, message: 'Download paused' });
});

// Resume download
router.post('/resume/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const download = activeDownloads.get(downloadId);
  
  if (!download) {
    return res.status(404).json({ error: 'Download not found' });
  }

  download.torrent.resume();
  download.status = 'downloading';
  
  res.json({ success: true, message: 'Download resumed' });
});

// Cancel download
router.post('/cancel/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const download = activeDownloads.get(downloadId);
  
  if (!download) {
    return res.status(404).json({ error: 'Download not found' });
  }

  download.torrent.destroy();
  activeDownloads.delete(downloadId);
  
  res.json({ success: true, message: 'Download cancelled' });
});

module.exports = router;
