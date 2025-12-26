const fs = require('fs-extra');
const path = require('path');
const { exec, spawn } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class SteamDownloadManager {
  constructor() {
    this.steamToolsPath = path.join(__dirname, '..', 'SteamTools');
    this.luaFilesPath = path.join(__dirname, '..', 'lua_files');
    this.steamPath = 'C:\\Program Files (x86)\\Steam'; // Default Steam path
    this.activeDownloads = new Map();
    this.steamProcess = null;
  }

  /**
   * Find Steam installation path
   */
  async findSteamPath() {
    try {
      const { stdout } = await execPromise('reg query "HKEY_CURRENT_USER\\Software\\Valve\\Steam" /v SteamPath');
      const match = stdout.match(/SteamPath\s+REG_SZ\s+(.+)/);
      if (match) {
        this.steamPath = match[1].trim().replace(/\//g, '\\');
        return this.steamPath;
      }
    } catch (error) {
      console.log('⚠️  Steam not found in registry, using default path');
    }
    return this.steamPath;
  }

  /**
   * Copy lua file to SteamTools directory
   */
  async copyLuaFile(appId) {
    try {
      const luaFileName = `${appId}.lua`;
      const sourcePath = path.join(this.luaFilesPath, luaFileName);
      const destPath = path.join(this.steamToolsPath, luaFileName);

      if (!await fs.pathExists(sourcePath)) {
        throw new Error(`Lua file not found for AppID ${appId}`);
      }

      await fs.copy(sourcePath, destPath, { overwrite: true });
      console.log(`✅ Copied ${luaFileName} to SteamTools`);
      return destPath;
    } catch (error) {
      console.error('❌ Error copying lua file:', error);
      throw error;
    }
  }

  /**
   * Kill all Steam processes
   */
  async killSteam() {
    try {
      await execPromise('taskkill /F /IM steam.exe /T');
      await execPromise('taskkill /F /IM steamwebhelper.exe /T');
      console.log('🔪 Killed Steam processes');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log('ℹ️  Steam was not running');
    }
  }

  /**
   * Start Steam in hidden mode
   */
  async startSteamHidden() {
    await this.findSteamPath();
    const steamExe = path.join(this.steamPath, 'steam.exe');

    if (!await fs.pathExists(steamExe)) {
      throw new Error('Steam executable not found');
    }

    // Start Steam with -silent flag (runs in background)
    this.steamProcess = spawn(steamExe, ['-silent', '-no-browser'], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });

    this.steamProcess.unref();
    console.log('🎮 Started Steam in hidden mode');
    
    // Wait for Steam to initialize
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  /**
   * Trigger download via steam:// protocol
   */
  async triggerDownload(appId) {
    try {
      const steamUrl = `steam://install/${appId}`;
      await execPromise(`start "" "${steamUrl}"`);
      console.log(`📥 Triggered download for AppID ${appId}`);
      return true;
    } catch (error) {
      console.error('❌ Error triggering download:', error);
      return false;
    }
  }

  /**
   * Get download progress from Steam
   */
  async getDownloadProgress(appId) {
    try {
      // Read Steam's download state from appmanifest file
      const manifestPath = path.join(this.steamPath, 'steamapps', `appmanifest_${appId}.acf`);
      
      if (!await fs.pathExists(manifestPath)) {
        return {
          status: 'queued',
          progress: 0,
          bytesDownloaded: 0,
          bytesTotal: 0,
          speed: 0
        };
      }

      const content = await fs.readFile(manifestPath, 'utf8');
      
      // Parse ACF file
      const sizeOnDisk = this.parseACFValue(content, 'SizeOnDisk');
      const bytesDownloaded = this.parseACFValue(content, 'BytesDownloaded');
      const bytesToDownload = this.parseACFValue(content, 'BytesToDownload');
      const stateFlags = this.parseACFValue(content, 'StateFlags');

      // Calculate progress
      const progress = bytesToDownload > 0 
        ? Math.round((bytesDownloaded / bytesToDownload) * 100) 
        : 0;

      // Determine status based on StateFlags
      let status = 'downloading';
      if (stateFlags === '4') status = 'installed';
      else if (stateFlags === '1026') status = 'downloading';
      else if (stateFlags === '1030') status = 'paused';

      return {
        status,
        progress,
        bytesDownloaded: parseInt(bytesDownloaded) || 0,
        bytesTotal: parseInt(bytesToDownload) || 0,
        speed: await this.getCurrentDownloadSpeed()
      };
    } catch (error) {
      console.error('Error getting download progress:', error);
      return {
        status: 'error',
        progress: 0,
        bytesDownloaded: 0,
        bytesTotal: 0,
        speed: 0
      };
    }
  }

  /**
   * Parse ACF file value
   */
  parseACFValue(content, key) {
    const regex = new RegExp(`"${key}"\\s+"([^"]+)"`);
    const match = content.match(regex);
    return match ? match[1] : '0';
  }

  /**
   * Get current download speed from Steam
   */
  async getCurrentDownloadSpeed() {
    try {
      // Read from Steam's download stats
      const statsPath = path.join(this.steamPath, 'logs', 'content_log.txt');
      if (!await fs.pathExists(statsPath)) return 0;

      const content = await fs.readFile(statsPath, 'utf8');
      const lines = content.split('\n');
      const lastLine = lines[lines.length - 1];
      
      // Extract speed from log (this is approximate)
      const speedMatch = lastLine.match(/(\d+)\s*KB\/s/);
      return speedMatch ? parseInt(speedMatch[1]) * 1024 : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Start download process
   */
  async startDownload(appId, gameName) {
    try {
      console.log(`🚀 Starting download for ${gameName} (${appId})`);

      // Step 1: Copy lua file
      await this.copyLuaFile(appId);

      // Step 2: Kill existing Steam
      await this.killSteam();

      // Step 3: Start Steam hidden
      await this.startSteamHidden();

      // Step 4: Trigger download
      await this.triggerDownload(appId);

      // Step 5: Track download
      const downloadInfo = {
        appId,
        gameName,
        startTime: Date.now(),
        status: 'downloading'
      };

      this.activeDownloads.set(appId, downloadInfo);

      // Start monitoring
      this.monitorDownload(appId);

      return {
        success: true,
        message: 'Download started successfully',
        appId
      };
    } catch (error) {
      console.error('❌ Error starting download:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Monitor download progress
   */
  async monitorDownload(appId) {
    const interval = setInterval(async () => {
      const progress = await this.getDownloadProgress(appId);
      
      // Emit progress event
      if (global.io) {
        global.io.emit('download-progress', {
          appId,
          ...progress
        });
      }

      // Stop monitoring if complete or error
      if (progress.status === 'installed' || progress.status === 'error') {
        clearInterval(interval);
        this.activeDownloads.delete(appId);
        console.log(`✅ Download completed for AppID ${appId}`);
      }
    }, 1000); // Update every second
  }

  /**
   * Pause download
   */
  async pauseDownload(appId) {
    try {
      await execPromise(`steam://pause/${appId}`);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Resume download
   */
  async resumeDownload(appId) {
    try {
      await execPromise(`steam://resume/${appId}`);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Cancel download
   */
  async cancelDownload(appId) {
    try {
      await execPromise(`steam://uninstall/${appId}`);
      this.activeDownloads.delete(appId);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get all active downloads
   */
  getActiveDownloads() {
    return Array.from(this.activeDownloads.values());
  }
}

module.exports = new SteamDownloadManager();
