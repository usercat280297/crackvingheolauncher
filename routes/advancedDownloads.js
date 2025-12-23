const express = require('express');
const router = express.Router();
const Download = require('../models/Download');
const DownloadChunk = require('../models/DownloadChunk');
const { createReadStream, createWriteStream, existsSync, mkdirSync, statSync } = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');

// Store active downloads in memory
const activeDownloads = new Map();
const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks for optimal multi-threading
const MAX_THREADS = 8; // 8 concurrent threads per download
const DOWNLOAD_TIMEOUT = 30000; // 30 second timeout per chunk

/**
 * ==========================================
 * 1. MULTI-THREADED DOWNLOAD MANAGER
 * ==========================================
 */
class MultiThreadedDownloadManager {
  constructor(downloadId, fileUrl, destination, fileSize) {
    this.downloadId = downloadId;
    this.fileUrl = fileUrl;
    this.destination = destination;
    this.fileSize = fileSize;
    this.chunks = [];
    this.downloadedSize = 0;
    this.startTime = Date.now();
    this.isPaused = false;
    this.isCancelled = false;
    this.bytesPerSecond = 0;
    this.lastUpdate = Date.now();
    this.lastDownloadedSize = 0;
  }

  /**
   * Calculate chunks for parallel download
   * Divide file into manageable chunks
   */
  calculateChunks() {
    const numChunks = Math.ceil(this.fileSize / CHUNK_SIZE);
    this.chunks = [];

    for (let i = 0; i < numChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min((i + 1) * CHUNK_SIZE - 1, this.fileSize - 1);
      
      this.chunks.push({
        id: i,
        start,
        end,
        size: end - start + 1,
        downloaded: 0,
        status: 'pending', // pending, downloading, completed, failed
        retries: 0,
        maxRetries: 3,
        url: `${this.fileUrl}?chunk=${i}`, // server returns specific byte range
        hash: null // will be set after download
      });
    }

    return this.chunks;
  }

  /**
   * Start multi-threaded download
   * Download multiple chunks in parallel
   */
  async startDownload(onProgress) {
    try {
      // Ensure destination directory exists
      const dir = path.dirname(this.destination);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Calculate chunks
      this.calculateChunks();

      // Save initial state to DB
      await Download.findByIdAndUpdate(this.downloadId, {
        status: 'downloading',
        totalChunks: this.chunks.length,
        chunkSize: CHUNK_SIZE,
        startedAt: new Date()
      });

      // Create download queue with max concurrent threads
      const queue = [];
      let activeThreads = 0;

      return new Promise((resolve, reject) => {
        const downloadNextChunk = async () => {
          // Check if should stop
          if (this.isCancelled) {
            reject(new Error('Download cancelled'));
            return;
          }

          if (this.isPaused) {
            // Wait before retrying
            setTimeout(downloadNextChunk, 1000);
            return;
          }

          // Find pending or failed chunk
          const chunk = this.chunks.find(c => 
            c.status === 'pending' || (c.status === 'failed' && c.retries < c.maxRetries)
          );

          if (!chunk) {
            // All chunks done or downloading
            if (activeThreads === 0) {
              // Check if all completed
              const allDone = this.chunks.every(c => c.status === 'completed');
              if (allDone) {
                resolve();
                return;
              }
            }
            setTimeout(downloadNextChunk, 100);
            return;
          }

          // Start downloading this chunk
          if (activeThreads < MAX_THREADS) {
            activeThreads++;
            chunk.status = 'downloading';

            this.downloadChunk(chunk, onProgress)
              .then(() => {
                chunk.status = 'completed';
                activeThreads--;
                downloadNextChunk(); // Download next
              })
              .catch(err => {
                if (chunk.retries < chunk.maxRetries) {
                  chunk.retries++;
                  chunk.status = 'pending';
                  activeThreads--;
                  console.log(`⚠️  Chunk ${chunk.id} failed, retrying (${chunk.retries}/${chunk.maxRetries})`);
                  setTimeout(() => downloadNextChunk(), 2000);
                } else {
                  chunk.status = 'failed';
                  activeThreads--;
                  console.error(`❌ Chunk ${chunk.id} failed after ${chunk.maxRetries} retries`);
                  reject(err);
                }
              });

            downloadNextChunk(); // Try to start another chunk if we have threads available
          } else {
            setTimeout(downloadNextChunk, 100);
          }
        };

        downloadNextChunk();
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download single chunk with retry logic
   */
  async downloadChunk(chunk, onProgress) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Get file stream with byte range request
        const response = await axios.get(chunk.url, {
          responseType: 'stream',
          headers: {
            'Range': `bytes=${chunk.start}-${chunk.end}`
          },
          timeout: DOWNLOAD_TIMEOUT
        });

        // Prepare write stream (append to file at correct position)
        const writeStream = createWriteStream(this.destination, {
          flags: 'r+', // Open for reading and writing
          start: chunk.start
        });

        // Calculate hash while downloading
        const hash = crypto.createHash('sha256');

        let chunkDownloaded = 0;
        response.data.on('data', (chunk) => {
          chunkDownloaded += chunk.length;
          chunk.downloaded = chunkDownloaded;
          this.downloadedSize += chunk.length;
          hash.update(chunk);

          // Update progress callback
          if (onProgress) {
            onProgress({
              downloadedSize: this.downloadedSize,
              totalSize: this.fileSize,
              progress: (this.downloadedSize / this.fileSize) * 100,
              speed: this.calculateSpeed(),
              eta: this.calculateETA(),
              chunks: this.chunks
            });
          }
        });

        // Pipe and wait for completion
        await pipeline(response.data, writeStream);

        // Save hash
        chunk.hash = hash.digest('hex');
        return;

      } catch (error) {
        lastError = error;
        console.log(`Attempt ${attempt + 1}/${maxRetries + 1} failed for chunk ${chunk.id}`);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  /**
   * Calculate current download speed (bytes/second)
   */
  calculateSpeed() {
    const now = Date.now();
    const timeDiff = (now - this.lastUpdate) / 1000; // seconds
    
    if (timeDiff < 1) return this.bytesPerSecond; // Update every second

    const sizeDiff = this.downloadedSize - this.lastDownloadedSize;
    this.bytesPerSecond = Math.round(sizeDiff / timeDiff);
    this.lastUpdate = now;
    this.lastDownloadedSize = this.downloadedSize;

    return this.bytesPerSecond;
  }

  /**
   * Calculate ETA (Estimated Time of Arrival)
   */
  calculateETA() {
    const speed = this.calculateSpeed();
    if (speed === 0) return null;

    const remaining = this.fileSize - this.downloadedSize;
    const secondsLeft = remaining / speed;

    return {
      seconds: Math.round(secondsLeft),
      formatted: this.formatTime(secondsLeft)
    };
  }

  formatTime(seconds) {
    if (seconds < 0) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  cancel() {
    this.isCancelled = true;
  }
}

/**
 * ==========================================
 * 2. COMPRESSION MANAGER
 * ==========================================
 */
class CompressionManager {
  /**
   * Compress file for faster download
   * Returns: compressed file path, compression ratio
   */
  static async compressFile(sourcePath, destinationPath) {
    const sourceStream = createReadStream(sourcePath);
    const destinationStream = createWriteStream(destinationPath);
    const compressStream = zlib.createGzip({ level: 6 }); // Level 6 = balance speed/compression

    const startSize = statSync(sourcePath).size;

    await pipeline(sourceStream, compressStream, destinationStream);

    const endSize = statSync(destinationPath).size;
    const ratio = ((1 - endSize / startSize) * 100).toFixed(2);

    return {
      path: destinationPath,
      originalSize: startSize,
      compressedSize: endSize,
      ratio: `${ratio}%`,
      saved: startSize - endSize
    };
  }

  /**
   * Decompress downloaded file
   */
  static async decompressFile(sourcePath, destinationPath) {
    const sourceStream = createReadStream(sourcePath);
    const destinationStream = createWriteStream(destinationPath);
    const decompressStream = zlib.createGunzip();

    await pipeline(sourceStream, decompressStream, destinationStream);
  }
}

/**
 * ==========================================
 * 3. FILE VERIFICATION
 * ==========================================
 */
class FileVerifier {
  /**
   * Calculate file hash for verification
   */
  static async verifyFile(filePath, expectedHash) {
    return new Promise((resolve, reject) => {
      const stream = createReadStream(filePath);
      const hash = crypto.createHash('sha256');

      stream.on('data', (data) => {
        hash.update(data);
      });

      stream.on('end', () => {
        const fileHash = hash.digest('hex');
        const isValid = fileHash === expectedHash;
        resolve({
          isValid,
          fileHash,
          expectedHash,
          match: isValid ? '✓ MATCH' : '✗ MISMATCH'
        });
      });

      stream.on('error', reject);
    });
  }

  /**
   * Verify all chunks have correct hashes
   */
  static async verifyChunks(chunks) {
    const results = [];
    
    for (const chunk of chunks) {
      const isValid = chunk.hash === chunk.expectedHash;
      results.push({
        chunkId: chunk.id,
        isValid,
        hash: chunk.hash,
        expectedHash: chunk.expectedHash
      });
    }

    const allValid = results.every(r => r.isValid);
    return { allValid, results };
  }
}

/**
 * ==========================================
 * 4. API ENDPOINTS
 * ==========================================
 */

/**
 * GET /api/advanced-downloads
 * List all downloads with detailed status
 */
router.get('/', async (req, res) => {
  try {
    const downloads = await Download.find()
      .populate('chunks')
      .sort({ createdAt: -1 });

    res.json(downloads.map(d => {
      const manager = activeDownloads.get(d._id.toString());
      return {
        ...d.toObject(),
        activeStatus: manager ? {
          isPaused: manager.isPaused,
          isCancelled: manager.isCancelled,
          speed: manager.bytesPerSecond,
          eta: manager.calculateETA(),
          chunks: manager.chunks
        } : null
      };
    }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced-downloads/start
 * Start a multi-threaded download
 * Body: { gameTitle, fileUrl, fileSize, destination, compress }
 */
router.post('/start', async (req, res) => {
  try {
    const { gameTitle, fileUrl, fileSize, destination, compress = false } = req.body;

    // Create download record
    const download = await Download.create({
      gameTitle,
      fileUrl,
      fileSize,
      destination,
      status: 'initializing',
      compress,
      downloadedSize: 0,
      progress: 0,
      speed: 0,
      eta: null,
      startedAt: new Date()
    });

    // Create download manager
    const manager = new MultiThreadedDownloadManager(
      download._id.toString(),
      fileUrl,
      destination,
      fileSize
    );

    activeDownloads.set(download._id.toString(), manager);

    // Start download in background
    manager.startDownload(async (progress) => {
      // Update progress in real-time
      await Download.findByIdAndUpdate(download._id, {
        downloadedSize: progress.downloadedSize,
        progress: progress.progress,
        speed: progress.speed,
        eta: progress.eta?.formatted,
        status: 'downloading'
      });
    })
      .then(async () => {
        // Download complete
        if (compress) {
          // Compress downloaded file
          const compressedPath = `${destination}.gz`;
          await CompressionManager.compressFile(destination, compressedPath);
          
          await Download.findByIdAndUpdate(download._id, {
            status: 'completed',
            completedAt: new Date(),
            compressed: true,
            compressedPath
          });
        } else {
          await Download.findByIdAndUpdate(download._id, {
            status: 'completed',
            completedAt: new Date()
          });
        }

        activeDownloads.delete(download._id.toString());
      })
      .catch(async (error) => {
        await Download.findByIdAndUpdate(download._id, {
          status: 'failed',
          error: error.message
        });
        activeDownloads.delete(download._id.toString());
      });

    res.json({
      downloadId: download._id,
      status: 'Download started',
      totalChunks: manager.chunks.length,
      chunkSize: CHUNK_SIZE,
      maxThreads: MAX_THREADS
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced-downloads/:id/pause
 * Pause active download
 */
router.post('/:id/pause', async (req, res) => {
  try {
    const manager = activeDownloads.get(req.params.id);
    if (!manager) {
      return res.status(404).json({ error: 'Download not found' });
    }

    manager.pause();
    await Download.findByIdAndUpdate(req.params.id, { status: 'paused' });

    res.json({ status: 'Download paused' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced-downloads/:id/resume
 * Resume paused download
 */
router.post('/:id/resume', async (req, res) => {
  try {
    const manager = activeDownloads.get(req.params.id);
    if (!manager) {
      return res.status(404).json({ error: 'Download not found' });
    }

    manager.resume();
    await Download.findByIdAndUpdate(req.params.id, { status: 'downloading' });

    res.json({ status: 'Download resumed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced-downloads/:id/cancel
 * Cancel active download
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const manager = activeDownloads.get(req.params.id);
    if (!manager) {
      return res.status(404).json({ error: 'Download not found' });
    }

    manager.cancel();
    await Download.findByIdAndUpdate(req.params.id, { status: 'cancelled' });

    activeDownloads.delete(req.params.id);

    res.json({ status: 'Download cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced-downloads/:id/verify
 * Verify downloaded file integrity
 */
router.post('/:id/verify', async (req, res) => {
  try {
    const download = await Download.findById(req.params.id);
    if (!download) {
      return res.status(404).json({ error: 'Download not found' });
    }

    const result = await FileVerifier.verifyFile(
      download.destination,
      download.expectedHash
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/advanced-downloads/:id/status
 * Get detailed status of download
 */
router.get('/:id/status', async (req, res) => {
  try {
    const download = await Download.findById(req.params.id);
    const manager = activeDownloads.get(req.params.id);

    if (!download) {
      return res.status(404).json({ error: 'Download not found' });
    }

    res.json({
      download: download.toObject(),
      activeStatus: manager ? {
        isPaused: manager.isPaused,
        isCancelled: manager.isCancelled,
        bytesPerSecond: manager.bytesPerSecond,
        eta: manager.calculateETA(),
        chunks: manager.chunks.map(c => ({
          id: c.id,
          status: c.status,
          downloaded: c.downloaded,
          size: c.size,
          progress: (c.downloaded / c.size) * 100,
          retries: c.retries
        }))
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
