const path = require('path');
const fs = require('fs-extra');
const extract = require('extract-zip');
const EventEmitter = require('events');
const os = require('os');
const torrentConfig = require('../config/torrentConfig');
let WebTorrent;

/**
 * 🚀 Torrent Download Manager with Auto-Unzip
 * 
 * Features:
 * - Download game từ .torrent (cocccoc 128kb files)
 * - Auto-unzip nếu file bị zip
 * - Progress tracking
 * - Multi-source download (WebTorrent)
 * - Resume support
 */

class TorrentDownloadManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    if (!WebTorrent) {
      throw new Error('WebTorrent not initialized. Call initializeAsync() first.');
    }
    
    // Merge với config - use fastMode by default for quick downloads
    const finalConfig = {
      ...torrentConfig,
      ...torrentConfig.fastMode, // Use optimized fast mode
      ...options
    };
    
    this.client = new WebTorrent({
      maxConns: finalConfig.maxConnections || 100,
      maxPeers: finalConfig.maxPeers || 60,
      nodeId: Buffer.from('CrackVingheo'),
      ...finalConfig
    });

    this.downloads = new Map();
    this.defaultDownloadPath = options.downloadPath || 
      path.join(process.env.GAMES_PATH || 'C:\\Games', 'Torrents');

    // Event listeners
    this.client.on('error', (err) => {
      console.error('❌ WebTorrent error:', err);
      this.emit('error', err);
    });

    console.log('✅ TorrentDownloadManager initialized with FastMode optimization');
  }

  /**
   * Download game từ torrent
   * @param {string} torrentPath - Path đến .torrent file hoặc magnet link
   * @param {Object} options - Download options
   */
  async downloadGame(torrentPath, options = {}) {
    try {
      const {
        gameId,
        gameName = 'Unknown Game',
        outputPath = this.defaultDownloadPath,
        autoUnzip = true,
        priority = 1
      } = options;

      // Tạo thư mục đích
      await fs.ensureDir(outputPath);

      console.log(`📥 Starting torrent download: ${gameName}`);
      console.log(`   From: ${torrentPath}`);
      console.log(`   To: ${outputPath}`);

      // Tạo torrent instance
      const torrent = await new Promise((resolve, reject) => {
        this.client.add(torrentPath, { path: outputPath }, (torrent) => {
          console.log(`✅ Torrent added: ${torrent.name}`);
          resolve(torrent);
        });

        setTimeout(() => {
          reject(new Error('Torrent add timeout (30s)'));
        }, 30000);
      });

      const downloadId = gameId || Date.now().toString();
      const download = {
        id: downloadId,
        torrent,
        gameName,
        outputPath,
        autoUnzip,
        startTime: Date.now(),
        status: 'downloading',
        progress: 0,
        speed: 0,
        eta: 0
      };

      this.downloads.set(downloadId, download);

      // Track progress
      this.trackProgress(downloadId, torrent);

      // Lắng nghe sự kiện torrent
      torrent.on('done', async () => {
        console.log(`✅ Download completed: ${gameName}`);
        download.status = 'completed';
        download.progress = 100;
        this.emit('download-complete', { downloadId, gameName, outputPath });

        // Auto unzip nếu cần
        if (autoUnzip) {
          try {
            await this.autoUnzipGame(downloadId, torrent);
          } catch (error) {
            console.error(`⚠️  Auto-unzip failed: ${error.message}`);
            download.unzipError = error.message;
          }
        }
      });

      torrent.on('error', (err) => {
        console.error(`❌ Torrent error for ${gameName}:`, err);
        download.status = 'error';
        download.error = err.message;
        this.emit('download-error', { downloadId, gameName, error: err });
      });

      return { downloadId, download };
    } catch (error) {
      console.error(`❌ Failed to start download for ${options.gameName}:`, error);
      throw error;
    }
  }

  /**
   * Track download progress
   */
  trackProgress(downloadId, torrent) {
    const download = this.downloads.get(downloadId);
    
    const interval = setInterval(() => {
      if (!this.downloads.has(downloadId)) {
        clearInterval(interval);
        return;
      }

      const progress = (torrent.progress * 100).toFixed(2);
      const downloaded = (torrent.downloaded / (1024 * 1024 * 1024)).toFixed(2); // GB
      const total = (torrent.length / (1024 * 1024 * 1024)).toFixed(2); // GB
      const speed = (torrent.downloadSpeed / (1024 * 1024)).toFixed(2); // MB/s
      
      // ETA: (remaining bytes) / (bytes per second)
      const remaining = torrent.length - torrent.downloaded;
      const eta = torrent.downloadSpeed > 0 
        ? Math.round(remaining / torrent.downloadSpeed)
        : 0;

      download.progress = parseFloat(progress);
      download.speed = parseFloat(speed);
      download.eta = eta;
      download.downloaded = parseFloat(downloaded);
      download.total = parseFloat(total);

      this.emit('download-progress', { 
        downloadId, 
        ...download 
      });

      // Log progress mỗi 5 giây
      if (Math.round(torrent.progress * 100) % 5 === 0) {
        console.log(
          `📊 ${download.gameName}: ${downloaded}/${total} GB ` +
          `(${progress}%) @ ${speed} MB/s - ETA: ${this.formatTime(eta)}`
        );
      }

      if (torrent.done) {
        clearInterval(interval);
      }
    }, 1000);
  }

  /**
   * Auto unzip game files
   */
  async autoUnzipGame(downloadId, torrent) {
    const download = this.downloads.get(downloadId);
    
    console.log(`🔍 Scanning for zip files in ${download.outputPath}...`);
    download.status = 'unzipping';
    this.emit('unzip-start', { downloadId });

    try {
      // Tìm tất cả .zip files
      const files = await fs.readdir(download.outputPath);
      const zipFiles = files.filter(f => f.toLowerCase().endsWith('.zip'));

      if (zipFiles.length === 0) {
        console.log('✅ No zip files found - download ready to play!');
        download.status = 'ready';
        return;
      }

      console.log(`📦 Found ${zipFiles.length} zip file(s) to extract`);

      for (const zipFile of zipFiles) {
        const zipPath = path.join(download.outputPath, zipFile);
        const extractPath = download.outputPath;

        console.log(`📤 Extracting: ${zipFile}...`);

        try {
          await extract(zipPath, { dir: extractPath });
          console.log(`✅ Extracted: ${zipFile}`);

          // Xóa file zip sau khi extract
          await fs.remove(zipPath);
          console.log(`🗑️  Deleted zip file: ${zipFile}`);

          this.emit('unzip-progress', { 
            downloadId, 
            file: zipFile,
            status: 'extracted'
          });
        } catch (error) {
          console.error(`❌ Failed to extract ${zipFile}:`, error);
          throw error;
        }
      }

      console.log(`✅ All files extracted successfully!`);
      download.status = 'ready';
      this.emit('unzip-complete', { downloadId });

    } catch (error) {
      console.error(`❌ Unzip failed:`, error);
      download.status = 'unzip-error';
      throw error;
    }
  }

  /**
   * Lấy trạng thái download
   */
  getDownloadStatus(downloadId) {
    return this.downloads.get(downloadId) || null;
  }

  /**
   * Lấy tất cả downloads
   */
  getAllDownloads() {
    return Array.from(this.downloads.values()).map(d => ({
      id: d.id,
      gameName: d.gameName,
      status: d.status,
      progress: d.progress,
      speed: d.speed,
      eta: d.eta,
      downloaded: d.downloaded,
      total: d.total,
      startTime: d.startTime
    }));
  }

  /**
   * Pause download
   */
  pauseDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download && download.torrent) {
      download.torrent.pause();
      download.status = 'paused';
      console.log(`⏸️  Paused: ${download.gameName}`);
    }
  }

  /**
   * Resume download
   */
  resumeDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download && download.torrent) {
      download.torrent.resume();
      download.status = 'downloading';
      console.log(`▶️  Resumed: ${download.gameName}`);
    }
  }

  /**
   * Cancel download
   */
  async cancelDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download && download.torrent) {
      this.client.remove(download.torrent);
      this.downloads.delete(downloadId);
      console.log(`❌ Cancelled: ${download.gameName}`);
    }
  }

  /**
   * Format thời gian (giây → HH:MM:SS)
   */
  formatTime(seconds) {
    if (seconds <= 0) return '00:00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Cleanup (destroy client)
   */
  destroy() {
    if (this.client) {
      this.client.destroy();
      console.log('🛑 TorrentDownloadManager destroyed');
    }
  }

  /**
   * Initialize WebTorrent module (async)
   * Call this once at app startup
   */
  static async initializeAsync() {
    if (!WebTorrent) {
      const module = await import('webtorrent');
      WebTorrent = module.default;
      console.log('✅ WebTorrent module loaded (ESM)');
    }
  }
}

module.exports = TorrentDownloadManager;
