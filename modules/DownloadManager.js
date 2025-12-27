const fs = require('fs');
const path = require('path');
const SettingsManager = require('./SettingsManager');
const EventEmitter = require('events');

// WebTorrent will be loaded asynchronously
let WebTorrent = null;

class DownloadManager extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.activeDownloads = new Map();
    this.downloadHistory = new Map();
  }

  /**
   * Initialize WebTorrent asynchronously
   */
  async initializeWebTorrent() {
    if (!this.client) {
      try {
        WebTorrent = (await import('webtorrent')).default;
        this.client = new WebTorrent({
          tracker: true,
          dht: true,
          webSeeds: true
        });
        console.log('✅ WebTorrent initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize WebTorrent:', error.message);
        throw error;
      }
    }
    return this.client;
  }

  /**
   * Get download path from settings
   */
  getDownloadPath() {
    const downloadPath = SettingsManager.get('downloadPath');
    
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }
    
    return downloadPath;
  }

  /**
   * Start torrent download
   */
  async downloadGame(torrentFilePath, gameInfo, progressCallback) {
    try {
      const { gameId, gameName } = gameInfo;

      // Initialize WebTorrent if needed
      await this.initializeWebTorrent();

      // Check concurrent downloads limit
      const maxConcurrent = SettingsManager.get('maxConcurrentDownloads');
      if (this.activeDownloads.size >= maxConcurrent) {
        return {
          success: false,
          error: `Maximum concurrent downloads (${maxConcurrent}) reached. Please wait for a download to finish.`
        };
      }

      // Read torrent file
      const torrentFile = fs.readFileSync(torrentFilePath);

      // Create game download directory
      const baseDownloadPath = this.getDownloadPath();
      const gameDownloadPath = path.join(baseDownloadPath, gameId);

      if (!fs.existsSync(gameDownloadPath)) {
        fs.mkdirSync(gameDownloadPath, { recursive: true });
      }

      console.log(`📂 Downloading to: ${gameDownloadPath}`);

      // Get speed limits from settings
      const uploadLimit = SettingsManager.get('uploadLimit') || -1;
      const downloadLimit = SettingsManager.get('downloadLimit') || -1;

      // Start download - WebTorrent will parse the torrent file
      const torrent = this.client.add(torrentFile, {
        path: gameDownloadPath,
        uploadLimit: uploadLimit === 0 ? -1 : uploadLimit * 1024 * 1024,
        downloadLimit: downloadLimit === 0 ? -1 : downloadLimit * 1024 * 1024
      });

      // Store download info
      const downloadInfo = {
        gameId,
        gameName,
        torrentId: torrent.infoHash,
        path: gameDownloadPath,
        startTime: Date.now(),
        status: 'downloading',
        torrent
      };

      this.activeDownloads.set(gameId, downloadInfo);

      // Emit download started event
      this.emit('download-started', { gameId, gameName });
      progressCallback({ type: 'started', gameId, name: gameName, totalSize: 0 });

      // Handle download ready - log info and notify
      torrent.on('ready', () => {
        console.log('📥 Torrent Info:', {
          name: torrent.name,
          size: this.formatBytes(torrent.length),
          files: torrent.files ? torrent.files.length : 0
        });
        console.log(`✅ Download ready: ${torrent.name}`);
        progressCallback({
          type: 'ready',
          gameId,
          name: torrent.name,
          totalSize: torrent.length,
          numPeers: torrent.numPeers
        });
      });

      // Handle progress
      torrent.on('download', () => {
        const progress = {
          type: 'progress',
          gameId,
          downloaded: torrent.downloaded,
          total: torrent.length,
          progress: Math.round((torrent.downloaded / torrent.length) * 100),
          downloadSpeed: torrent.downloadSpeed,
          uploadSpeed: torrent.uploadSpeed,
          timeRemaining: torrent.timeRemaining,
          numPeers: torrent.numPeers,
          ratio: torrent.ratio,
          paused: torrent.paused
        };

        progressCallback(progress);
        this.emit('progress', progress);
      });

      // Handle completion
      torrent.on('done', () => {
        console.log(`✅ Download completed: ${torrent.name}`);
        downloadInfo.status = 'completed';
        downloadInfo.completedTime = Date.now();

        // Store in history
        this.downloadHistory.set(gameId, downloadInfo);

        progressCallback({
          type: 'completed',
          gameId,
          path: gameDownloadPath,
          totalSize: torrent.length,
          elapsedTime: Date.now() - downloadInfo.startTime
        });

        this.emit('download-completed', { gameId, gameName, path: gameDownloadPath });
      });

      // Handle errors
      torrent.on('error', (err) => {
        console.error('❌ Torrent error:', err);
        downloadInfo.status = 'error';
        downloadInfo.error = err.message;

        progressCallback({
          type: 'error',
          gameId,
          error: err.message
        });

        this.emit('download-error', { gameId, error: err.message });
      });

      return {
        success: true,
        torrentId: torrent.infoHash,
        downloadPath: gameDownloadPath,
        message: 'Download started'
      };

    } catch (error) {
      console.error('❌ Failed to start download:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Pause download
   */
  pauseDownload(gameId) {
    const downloadInfo = this.activeDownloads.get(gameId);
    if (downloadInfo && downloadInfo.torrent) {
      downloadInfo.torrent.pause();
      downloadInfo.status = 'paused';
      this.emit('download-paused', { gameId });
      return { success: true, message: 'Download paused' };
    }
    return { success: false, message: 'Download not found' };
  }

  /**
   * Resume download
   */
  resumeDownload(gameId) {
    const downloadInfo = this.activeDownloads.get(gameId);
    if (downloadInfo && downloadInfo.torrent) {
      downloadInfo.torrent.resume();
      downloadInfo.status = 'downloading';
      this.emit('download-resumed', { gameId });
      return { success: true, message: 'Download resumed' };
    }
    return { success: false, message: 'Download not found' };
  }

  /**
   * Cancel download
   */
  cancelDownload(gameId) {
    const downloadInfo = this.activeDownloads.get(gameId);
    if (downloadInfo && downloadInfo.torrent) {
      downloadInfo.torrent.destroy(() => {
        downloadInfo.status = 'cancelled';
        this.activeDownloads.delete(gameId);
        this.emit('download-cancelled', { gameId });
        console.log(`❌ Download cancelled: ${gameId}`);
      });
      return { success: true, message: 'Download cancelled' };
    }
    return { success: false, message: 'Download not found' };
  }

  /**
   * Get download status
   */
  getDownloadStatus(gameId) {
    const downloadInfo = this.activeDownloads.get(gameId);
    if (!downloadInfo || !downloadInfo.torrent) {
      return null;
    }

    const torrent = downloadInfo.torrent;

    return {
      gameId,
      status: downloadInfo.status,
      name: torrent.name,
      progress: Math.round((torrent.downloaded / torrent.length) * 100),
      downloaded: torrent.downloaded,
      total: torrent.length,
      downloadSpeed: torrent.downloadSpeed,
      uploadSpeed: torrent.uploadSpeed,
      numPeers: torrent.numPeers,
      timeRemaining: torrent.timeRemaining,
      paused: torrent.paused,
      ratio: torrent.ratio,
      startTime: downloadInfo.startTime
    };
  }

  /**
   * Get all active downloads
   */
  getActiveDownloads() {
    const downloads = [];
    for (const [gameId, downloadInfo] of this.activeDownloads) {
      const status = this.getDownloadStatus(gameId);
      if (status) {
        downloads.push(status);
      }
    }
    return downloads;
  }

  /**
   * Get download history
   */
  getDownloadHistory(limit = 50) {
    return Array.from(this.downloadHistory.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit)
      .map(item => ({
        gameId: item.gameId,
        gameName: item.gameName,
        status: item.status,
        totalSize: item.torrent ? item.torrent.length : 0,
        startTime: item.startTime,
        completedTime: item.completedTime,
        path: item.path
      }));
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Cleanup on app close
   */
  destroy() {
    for (const [, downloadInfo] of this.activeDownloads) {
      if (downloadInfo.torrent) {
        downloadInfo.torrent.destroy();
      }
    }
    this.client.destroy();
  }
}

module.exports = new DownloadManager();
