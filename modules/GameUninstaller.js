/**
 * GameUninstaller Module
 * Handles uninstalling games and removing files
 */

const fs = require('fs');
const path = require('path');
const { rimraf } = require('rimraf');
const { EventEmitter } = require('events');

class GameUninstaller extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Uninstall a game
   */
  async uninstallGame(gameId, gameName, installPath, options = {}) {
    try {
      const { keepSaves = false, keepConfig = false } = options;

      console.log(`🗑️  Uninstalling ${gameName}...`);

      // Verify path exists
      if (!fs.existsSync(installPath)) {
        throw new Error(`Game path not found: ${installPath}`);
      }

      // Check if it's a valid game directory (has some files)
      const files = fs.readdirSync(installPath);
      if (files.length === 0) {
        console.warn(`⚠️  Game directory is empty: ${installPath}`);
      }

      // Emit uninstall started
      this.emit('uninstall-started', { gameId, gameName });

      let deletedSize = 0;
      let filesDeleted = 0;

      // Delete game files
      try {
        // Calculate total size before deletion
        deletedSize = this.calculateDirectorySize(installPath);

        // Remove directory
        await rimraf(installPath, { force: true });

        filesDeleted = files.length;
        console.log(`✅ Deleted game files for ${gameName}`);
      } catch (error) {
        console.error(`❌ Failed to delete game files: ${error.message}`);
        throw error;
      }

      // Remove config/save files if requested
      if (!keepSaves) {
        try {
          const savesPaths = this.findGameSavesPaths(gameId);
          for (const savePath of savesPaths) {
            if (fs.existsSync(savePath)) {
              await rimraf(savePath, { force: true });
              console.log(`✅ Removed saves: ${savePath}`);
            }
          }
        } catch (error) {
          console.warn(`⚠️  Could not remove saves: ${error.message}`);
        }
      }

      // Remove shortcuts
      try {
        this.removeGameShortcuts(gameId, gameName);
        console.log(`✅ Removed shortcuts for ${gameName}`);
      } catch (error) {
        console.warn(`⚠️  Could not remove shortcuts: ${error.message}`);
      }

      // Emit uninstall completed
      this.emit('uninstall-completed', {
        gameId,
        gameName,
        deletedSize,
        filesDeleted
      });

      return {
        success: true,
        message: `${gameName} uninstalled successfully`,
        gameId,
        deletedSize,
        filesDeleted
      };
    } catch (error) {
      console.error(`❌ Uninstall failed for ${gameName}:`, error.message);

      this.emit('uninstall-error', {
        gameId,
        gameName,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        gameId
      };
    }
  }

  /**
   * Calculate directory size in bytes
   */
  calculateDirectorySize(dirPath) {
    let size = 0;

    try {
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          size += this.calculateDirectorySize(filePath);
        } else {
          size += stat.size;
        }
      }
    } catch (error) {
      console.warn(`Could not calculate size for ${dirPath}: ${error.message}`);
    }

    return size;
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
   * Find game saves paths
   */
  findGameSavesPaths(gameId) {
    const paths = [];
    const userHomeDir = process.env.USERPROFILE || process.env.HOME;

    // Common save locations
    const commonPaths = [
      path.join(userHomeDir, 'AppData', 'Local', 'game-' + gameId),
      path.join(userHomeDir, 'AppData', 'Roaming', 'game-' + gameId),
      path.join(userHomeDir, 'Documents', 'My Games', 'game-' + gameId),
      path.join(userHomeDir, '.config', 'game-' + gameId),
      path.join(userHomeDir, '.local', 'share', 'game-' + gameId),
    ];

    return commonPaths.filter(p => fs.existsSync(p));
  }

  /**
   * Remove game shortcuts
   */
  removeGameShortcuts(gameId, gameName) {
    try {
      const userHomeDir = process.env.USERPROFILE || process.env.HOME;
      const desktopPath = path.join(userHomeDir, 'Desktop');
      const startMenuPath = path.join(
        userHomeDir,
        'AppData',
        'Roaming',
        'Microsoft',
        'Windows',
        'Start Menu',
        'Programs'
      );

      // Remove desktop shortcut
      const desktopShortcut = path.join(desktopPath, `${gameName}.lnk`);
      if (fs.existsSync(desktopShortcut)) {
        fs.unlinkSync(desktopShortcut);
      }

      // Remove start menu shortcut
      const startMenuShortcut = path.join(startMenuPath, `${gameName}.lnk`);
      if (fs.existsSync(startMenuShortcut)) {
        fs.unlinkSync(startMenuShortcut);
      }
    } catch (error) {
      console.warn(`Could not remove shortcuts: ${error.message}`);
    }
  }

  /**
   * Get uninstall info
   */
  getUninstallInfo(installPath) {
    try {
      if (!fs.existsSync(installPath)) {
        return {
          exists: false
        };
      }

      const size = this.calculateDirectorySize(installPath);
      const stat = fs.statSync(installPath);

      return {
        exists: true,
        path: installPath,
        sizeBytes: size,
        sizeFormatted: this.formatBytes(size),
        createdTime: stat.birthtime,
        modifiedTime: stat.mtime
      };
    } catch (error) {
      console.error(`Error getting uninstall info: ${error.message}`);
      return {
        exists: false,
        error: error.message
      };
    }
  }

  /**
   * Verify uninstallation
   */
  verifyUninstalled(installPath) {
    return !fs.existsSync(installPath);
  }
}

// Export singleton instance
module.exports = new GameUninstaller();
