const express = require('express');
const Download = require('../models/Download');
const fs = require('fs-extra');
const path = require('path');

const router = express.Router();

// In-memory store for active downloads
const activeDownloads = new Map();

/**
 * GET /api/downloads
 * Get all downloads
 */
router.get('/', async (req, res) => {
  try {
    const downloads = Array.from(activeDownloads.values());
    res.json(downloads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/downloads/:id
 * Get specific download
 */
router.get('/:id', (req, res) => {
  try {
    const download = activeDownloads.get(req.params.id);
    if (!download) {
      return res.status(404).json({ error: 'Download not found' });
    }
    res.json(download);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/downloads/start
 * Start a new download
 */
router.post('/start', async (req, res) => {
  try {
    const { gameId, gameTitle, downloadPath, fileSize = 1024 * 1024 * 1024 } = req.body;

    if (!gameId || !gameTitle || !downloadPath) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create download directory if it doesn't exist
    await fs.ensureDir(downloadPath);

    const downloadId = `${gameId}-${Date.now()}`;
    const filePath = path.join(downloadPath, `${gameTitle}.iso`);

    const download = {
      id: downloadId,
      gameId,
      gameTitle,
      downloadPath,
      filePath,
      fileSize,
      downloadedBytes: 0,
      progress: 0,
      status: 'downloading',
      speed: 0,
      eta: 0,
      startTime: Date.now(),
      retries: 0,
      maxRetries: 3,
      error: null,
      createdAt: new Date()
    };

    activeDownloads.set(downloadId, download);

    // Save to DB
    try {
      const dbDownload = new Download({
        gameId,
        gameTitle,
        downloadPath,
        filePath,
        fileSize,
        status: 'downloading',
        retries: 0
      });
      await dbDownload.save();
    } catch (dbError) {
      console.warn('Failed to save download to DB:', dbError.message);
    }

    res.json({
      success: true,
      downloadId,
      message: 'Download started'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/downloads/:id/pause
 * Pause a download
 */
router.post('/:id/pause', (req, res) => {
  try {
    const download = activeDownloads.get(req.params.id);
    if (!download) {
      return res.status(404).json({ error: 'Download not found' });
    }

    download.status = 'paused';
    
    // Update DB
    Download.findByIdAndUpdate(req.params.id, { status: 'paused' }).catch(e => 
      console.warn('Failed to update DB:', e.message)
    );

    res.json({ success: true, message: 'Download paused' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/downloads/:id/resume
 * Resume a download
 */
router.post('/:id/resume', (req, res) => {
  try {
    const download = activeDownloads.get(req.params.id);
    if (!download) {
      return res.status(404).json({ error: 'Download not found' });
    }

    if (download.status !== 'paused') {
      return res.status(400).json({ error: 'Can only resume paused downloads' });
    }

    download.status = 'downloading';
    
    // Update DB
    Download.findByIdAndUpdate(req.params.id, { status: 'downloading' }).catch(e => 
      console.warn('Failed to update DB:', e.message)
    );

    res.json({ success: true, message: 'Download resumed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/downloads/:id/cancel
 * Cancel a download
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const download = activeDownloads.get(req.params.id);
    if (!download) {
      return res.status(404).json({ error: 'Download not found' });
    }

    download.status = 'cancelled';

    // Clean up partial file
    if (fs.existsSync(download.filePath)) {
      await fs.remove(download.filePath);
    }

    activeDownloads.delete(req.params.id);

    // Update DB
    Download.findByIdAndUpdate(req.params.id, { status: 'cancelled' }).catch(e => 
      console.warn('Failed to update DB:', e.message)
    );

    res.json({ success: true, message: 'Download cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/downloads/:id/retry
 * Retry a failed download with auto-retry logic
 */
router.post('/:id/retry', (req, res) => {
  try {
    const download = activeDownloads.get(req.params.id);
    if (!download) {
      return res.status(404).json({ error: 'Download not found' });
    }

    if (download.status !== 'failed') {
      return res.status(400).json({ error: 'Can only retry failed downloads' });
    }

    if (download.retries >= download.maxRetries) {
      return res.status(400).json({
        error: `Max retries (${download.maxRetries}) exceeded`
      });
    }

    // Reset download state
    download.status = 'downloading';
    download.retries += 1;
    download.error = null;
    download.downloadedBytes = 0;
    download.progress = 0;
    download.eta = 0;

    // Update DB
    Download.findByIdAndUpdate(req.params.id, {
      status: 'downloading',
      retries: download.retries,
      error: null,
      downloadedBytes: 0,
      progress: 0
    }).catch(e => console.warn('Failed to update DB:', e.message));

    res.json({ success: true, message: 'Download retry started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/downloads/simulate-progress/:id
 * Simulate download progress
 */
router.post('/simulate-progress/:id', (req, res) => {
  try {
    const download = activeDownloads.get(req.params.id);
    if (!download) {
      return res.status(404).json({ error: 'Download not found' });
    }

    if (download.status !== 'downloading') {
      return res.json({ message: 'Download not in progress' });
    }

    // Simulate random speed (10-40 MB/s)
    const speed = 10 * 1024 * 1024 + Math.random() * 30 * 1024 * 1024;
    const chunkSize = speed / 10; // Update every 100ms

    download.downloadedBytes += chunkSize;
    download.speed = Math.round(speed / (1024 * 1024)); // MB/s

    // Calculate ETA
    const remainingBytes = download.fileSize - download.downloadedBytes;
    const etaSeconds = remainingBytes / speed;
    download.eta = Math.round(etaSeconds);

    // Calculate progress
    download.progress = Math.min(
      100,
      Math.round((download.downloadedBytes / download.fileSize) * 100)
    );

    // Complete when progress reaches 100%
    if (download.progress >= 100) {
      download.status = 'completed';
      download.downloadedBytes = download.fileSize;
      download.progress = 100;
      download.speed = 0;
      download.eta = 0;
      
      // Create dummy file
      fs.writeFileSync(download.filePath, Buffer.alloc(Math.min(download.fileSize, 1024 * 1024)));
      
      // Update DB
      Download.findByIdAndUpdate(req.params.id, {
        status: 'completed',
        progress: 100,
        downloadedBytes: download.fileSize,
        completedTime: new Date()
      }).catch(e => console.warn('Failed to update DB:', e.message));
    } else {
      // Periodic DB update
      if (download.progress % 10 === 0) {
        Download.findByIdAndUpdate(req.params.id, {
          progress: download.progress,
          downloadedBytes: download.downloadedBytes,
          speed: download.speed,
          eta: download.eta
        }).catch(e => console.warn('Failed to update DB:', e.message));
      }
    }

    res.json({ success: true, download });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/downloads/fail/:id
 * Mark download as failed (triggers auto-retry if retries left)
 */
router.post('/fail/:id', async (req, res) => {
  try {
    const { error = 'Unknown error' } = req.body;
    const download = activeDownloads.get(req.params.id);
    
    if (!download) {
      return res.status(404).json({ error: 'Download not found' });
    }

    download.error = error;
    download.status = 'failed';

    // Auto-retry logic
    if (download.retries < download.maxRetries) {
      // Schedule auto-retry after 5 seconds
      setTimeout(() => {
        if (activeDownloads.has(req.params.id)) {
          const d = activeDownloads.get(req.params.id);
          if (d.status === 'failed' && d.retries < d.maxRetries) {
            d.status = 'downloading';
            d.retries += 1;
            d.error = null;
            d.downloadedBytes = 0;
            d.progress = 0;
            console.log(`Auto-retrying download ${req.params.id} (attempt ${d.retries}/${d.maxRetries})`);
          }
        }
      }, 5000);

      return res.json({
        success: true,
        message: `Download failed. Will auto-retry in 5 seconds (${download.retries}/${download.maxRetries})`,
        willRetry: true
      });
    } else {
      // Max retries reached
      Download.findByIdAndUpdate(req.params.id, {
        status: 'failed',
        error,
        retries: download.retries
      }).catch(e => console.warn('Failed to update DB:', e.message));

      return res.json({
        success: false,
        message: `Download failed. Max retries (${download.maxRetries}) exceeded`,
        willRetry: false
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/downloads/:id
 * Delete a completed download
 */
router.delete('/:id', async (req, res) => {
  try {
    const download = activeDownloads.get(req.params.id);
    if (download) {
      if (download.status === 'downloading' || download.status === 'paused') {
        return res.status(400).json({
          error: 'Cannot delete active download. Cancel it first.'
        });
      }

      // Clean up file if exists
      if (fs.existsSync(download.filePath)) {
        await fs.remove(download.filePath);
      }

      activeDownloads.delete(req.params.id);
    }

    // Delete from DB
    Download.findByIdAndDelete(req.params.id).catch(e => 
      console.warn('Failed to delete from DB:', e.message)
    );

    res.json({ success: true, message: 'Download deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
