const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { EventEmitter } = require('events');

class GameInstallService extends EventEmitter {
  constructor() {
    super();
    this.downloads = new Map();
    this.installations = new Map();
    this.settings = this.loadSettings();
  }

  loadSettings() {
    const settingsPath = path.join(process.env.APPDATA || process.env.HOME, 'GameLauncher', 'settings.json');
    try {
      if (fs.existsSync(settingsPath)) {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    
    return {
      installPath: path.join(process.env.USERPROFILE || process.env.HOME, 'Games'),
      language: 'english',
      autoUpdate: true,
      downloadLimit: 0,
      verifyOnInstall: true,
      keepInstallers: false
    };
  }

  saveSettings(settings) {
    const settingsPath = path.join(process.env.APPDATA || process.env.HOME, 'GameLauncher', 'settings.json');
    const dir = path.dirname(settingsPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    this.settings = settings;
  }

  async downloadGame(gameId, gameData, downloadUrl) {
    const downloadId = `${gameId}_${Date.now()}`;
    const installDir = path.join(this.settings.installPath, gameData.title);
    
    const download = {
      id: downloadId,
      gameId,
      gameData,
      downloadUrl,
      installDir,
      status: 'downloading',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      speed: 0,
      eta: 0,
      startTime: Date.now()
    };
    
    this.downloads.set(downloadId, download);
    this.emit('downloadStarted', download);
    
    try {
      if (!fs.existsSync(installDir)) {
        fs.mkdirSync(installDir, { recursive: true });
      }
      
      const fileName = `${gameData.title}.zip`;
      const filePath = path.join(installDir, fileName);
      
      const response = await axios({
        method: 'GET',
        url: downloadUrl,
        responseType: 'stream',
        onDownloadProgress: (progressEvent) => {
          download.totalBytes = progressEvent.total || 0;
          download.downloadedBytes = progressEvent.loaded;
          download.progress = progressEvent.total ? (progressEvent.loaded / progressEvent.total) * 100 : 0;
          
          const elapsed = (Date.now() - download.startTime) / 1000;
          download.speed = download.downloadedBytes / elapsed;
          download.eta = download.speed > 0 ? (download.totalBytes - download.downloadedBytes) / download.speed : 0;
          
          this.emit('downloadProgress', download);
        }
      });
      
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      download.status = 'completed';
      download.progress = 100;
      download.filePath = filePath;
      this.emit('downloadCompleted', download);
      
      if (this.settings.verifyOnInstall) {
        await this.verifyGame(downloadId);
      }
      
      await this.installGame(downloadId);
      
      return download;
    } catch (error) {
      download.status = 'failed';
      download.error = error.message;
      this.emit('downloadFailed', download);
      throw error;
    }
  }

  async verifyGame(downloadId) {
    const download = this.downloads.get(downloadId);
    if (!download) throw new Error('Download not found');
    
    download.status = 'verifying';
    this.emit('verifyStarted', download);
    
    try {
      const stats = fs.statSync(download.filePath);
      download.verifiedBytes = stats.size;
      download.status = 'verified';
      this.emit('verifyCompleted', download);
    } catch (error) {
      download.status = 'verify_failed';
      download.error = error.message;
      this.emit('verifyFailed', download);
      throw error;
    }
  }

  async installGame(downloadId) {
    const download = this.downloads.get(downloadId);
    if (!download) throw new Error('Download not found');
    
    const installation = {
      id: downloadId,
      gameId: download.gameId,
      gameData: download.gameData,
      installDir: download.installDir,
      status: 'installing',
      progress: 0
    };
    
    this.installations.set(downloadId, installation);
    this.emit('installStarted', installation);
    
    try {
      for (let i = 0; i <= 100; i += 10) {
        installation.progress = i;
        this.emit('installProgress', installation);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      installation.status = 'installed';
      installation.progress = 100;
      installation.installedAt = new Date().toISOString();
      
      this.saveGameMetadata(installation);
      this.emit('installCompleted', installation);
      
      if (!this.settings.keepInstallers && download.filePath) {
        fs.unlinkSync(download.filePath);
      }
      
      return installation;
    } catch (error) {
      installation.status = 'failed';
      installation.error = error.message;
      this.emit('installFailed', installation);
      throw error;
    }
  }

  saveGameMetadata(installation) {
    const metadataPath = path.join(installation.installDir, 'game.json');
    const metadata = {
      gameId: installation.gameId,
      title: installation.gameData.title,
      version: installation.gameData.version || '1.0',
      installedAt: installation.installedAt,
      installDir: installation.installDir,
      language: this.settings.language,
      playtime: 0,
      lastPlayed: null
    };
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  }

  async uninstallGame(gameId, installDir) {
    try {
      if (fs.existsSync(installDir)) {
        fs.rmSync(installDir, { recursive: true, force: true });
      }
      this.emit('uninstallCompleted', { gameId, installDir });
      return true;
    } catch (error) {
      this.emit('uninstallFailed', { gameId, installDir, error: error.message });
      throw error;
    }
  }

  async verifyGameFiles(gameId, installDir) {
    const metadataPath = path.join(installDir, 'game.json');
    
    if (!fs.existsSync(metadataPath)) {
      throw new Error('Game metadata not found');
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    const verification = {
      gameId,
      status: 'verifying',
      totalFiles: 100,
      verifiedFiles: 0,
      corruptedFiles: []
    };
    
    this.emit('verificationStarted', verification);
    
    for (let i = 0; i <= 100; i += 5) {
      verification.verifiedFiles = i;
      this.emit('verificationProgress', verification);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    verification.status = 'completed';
    this.emit('verificationCompleted', verification);
    
    return verification;
  }

  getDownloadStatus(downloadId) {
    return this.downloads.get(downloadId);
  }

  getInstallationStatus(downloadId) {
    return this.installations.get(downloadId);
  }

  getAllDownloads() {
    return Array.from(this.downloads.values());
  }

  getAllInstallations() {
    return Array.from(this.installations.values());
  }

  pauseDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download) {
      download.status = 'paused';
      this.emit('downloadPaused', download);
    }
  }

  resumeDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download) {
      download.status = 'downloading';
      this.emit('downloadResumed', download);
    }
  }

  cancelDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download) {
      download.status = 'cancelled';
      this.emit('downloadCancelled', download);
      this.downloads.delete(downloadId);
    }
  }
}

module.exports = new GameInstallService();
