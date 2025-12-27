/**
 * GameLauncher Module
 * Handles launching games and tracking running processes
 */

const { execFile, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');

class GameLauncher extends EventEmitter {
  constructor() {
    super();
    this.runningGames = new Map(); // Map<gameId, ProcessInfo>
  }

  /**
   * Find game executable in installation path
   */
  findExecutable(gamePath) {
    if (!fs.existsSync(gamePath)) {
      throw new Error(`Game path does not exist: ${gamePath}`);
    }

    // Common executable names to search for
    const commonNames = [
      'Game.exe',
      'game.exe',
      path.basename(gamePath) + '.exe',
      'launch.exe',
      'run.exe',
      'start.exe',
    ];

    // Try common names first
    for (const name of commonNames) {
      const execPath = path.join(gamePath, name);
      if (fs.existsSync(execPath)) {
        return execPath;
      }
    }

    // Search for any .exe in root directory
    try {
      const files = fs.readdirSync(gamePath);
      const exeFiles = files.filter(f => f.toLowerCase().endsWith('.exe'));
      if (exeFiles.length > 0) {
        return path.join(gamePath, exeFiles[0]);
      }
    } catch (error) {
      throw new Error(`Cannot read game directory: ${error.message}`);
    }

    throw new Error(`No executable found in: ${gamePath}`);
  }

  /**
   * Launch a game
   */
  launchGame(gameId, gameName, installPath) {
    try {
      // Check if already running
      if (this.runningGames.has(gameId)) {
        throw new Error(`Game "${gameName}" is already running`);
      }

      // Find executable
      const executable = this.findExecutable(installPath);

      // Launch game
      console.log(`🚀 Launching ${gameName}...`);
      const process = spawn(executable, [], {
        cwd: installPath,
        detached: true,
        stdio: 'ignore'
      });

      // Store process info
      const processInfo = {
        gameId,
        gameName,
        pid: process.pid,
        startTime: new Date(),
        installPath,
      };

      this.runningGames.set(gameId, processInfo);

      // Handle process exit
      process.on('exit', () => {
        this.runningGames.delete(gameId);
        this.emit('game-closed', { gameId, gameName });
        console.log(`🎮 ${gameName} closed`);
      });

      // Emit event
      this.emit('game-launched', processInfo);

      return {
        success: true,
        message: `Launching ${gameName}...`,
        gameId,
        pid: process.pid
      };
    } catch (error) {
      console.error(`❌ Failed to launch ${gameName}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all running games
   */
  getRunningGames() {
    return Array.from(this.runningGames.values()).map(info => ({
      gameId: info.gameId,
      gameName: info.gameName,
      pid: info.pid,
      startTime: info.startTime,
      playTime: this.getPlayTime(info.startTime)
    }));
  }

  /**
   * Check if a game is running
   */
  isGameRunning(gameId) {
    return this.runningGames.has(gameId);
  }

  /**
   * Get play time in minutes
   */
  getPlayTime(startTime) {
    const now = new Date();
    const diff = now - startTime;
    return Math.floor(diff / (1000 * 60)); // Convert to minutes
  }

  /**
   * Kill a running game
   */
  killGame(gameId) {
    try {
      const processInfo = this.runningGames.get(gameId);
      if (!processInfo) {
        throw new Error(`Game is not running: ${gameId}`);
      }

      // Try to kill the process
      process.kill(-processInfo.pid); // Negative PID kills process group
      this.runningGames.delete(gameId);

      return {
        success: true,
        message: `Closed ${processInfo.gameName}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get game launch info
   */
  getGameLaunchInfo(gameId) {
    const processInfo = this.runningGames.get(gameId);
    if (!processInfo) {
      return {
        running: false,
        gameId
      };
    }

    return {
      running: true,
      gameId: processInfo.gameId,
      gameName: processInfo.gameName,
      pid: processInfo.pid,
      startTime: processInfo.startTime,
      playTime: this.getPlayTime(processInfo.startTime)
    };
  }

  /**
   * Get total play time for a game (from stats)
   */
  getTotalPlayTime(stats) {
    if (!stats || !stats.totalPlayTime) return 0;
    return stats.totalPlayTime; // in hours
  }
}

// Export singleton instance
module.exports = new GameLauncher();
