const express = require('express');
const GameLauncher = require('../modules/GameLauncher');
const GameUninstaller = require('../modules/GameUninstaller');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Mock game library database
const gameLibrary = new Map();

// Initialize with sample games
function initializeLibrary() {
  return [
    {
      id: '570',
      name: 'Dota 2',
      cover: 'https://cdn.akamai.steamstatic.com/steam/apps/570/header.jpg',
      size: 35 * 1024 * 1024 * 1024,
      installDate: new Date('2024-01-15'),
      installPath: 'C:\\Games\\Dota2',
      playing: false,
      lastPlayed: new Date('2025-12-20'),
      totalPlayTime: 245
    },
    {
      id: '1091500',
      name: 'Cyberpunk 2077',
      cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg',
      size: 120 * 1024 * 1024 * 1024,
      installDate: new Date('2023-12-10'),
      installPath: 'C:\\Games\\Cyberpunk2077',
      playing: false,
      lastPlayed: new Date('2025-12-18'),
      totalPlayTime: 156
    }
  ];
}

const initialGames = initializeLibrary();
initialGames.forEach(game => gameLibrary.set(game.id, game));

/**
 * Format bytes to human readable
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * GET /api/library
 * Get all games in library
 */
router.get('/', (req, res) => {
  try {
    const games = Array.from(gameLibrary.values()).map(game => ({
      ...game,
      sizeFormatted: formatBytes(game.size),
      playing: GameLauncher.isGameRunning(game.id)
    }));

    res.json({
      success: true,
      data: games,
      total: games.length
    });
  } catch (error) {
    console.error('Error fetching library:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/library/:gameId
 * Get specific game details
 */
router.get('/:gameId', (req, res) => {
  try {
    const game = gameLibrary.get(req.params.gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    const launchInfo = GameLauncher.getGameLaunchInfo(req.params.gameId);

    res.json({
      success: true,
      data: {
        ...game,
        sizeFormatted: formatBytes(game.size),
        launchInfo
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/library/:gameId/stats
 * Get game statistics
 */
router.get('/:gameId/stats', (req, res) => {
  try {
    const game = gameLibrary.get(req.params.gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    const launchInfo = GameLauncher.getGameLaunchInfo(req.params.gameId);

    res.json({
      success: true,
      data: {
        gameId: game.id,
        gameName: game.name,
        installDate: game.installDate,
        lastPlayed: game.lastPlayed,
        totalPlayTime: game.totalPlayTime,
        currentPlayTime: launchInfo.running ? launchInfo.playTime : null,
        size: game.size,
        sizeFormatted: formatBytes(game.size),
        playing: launchInfo.running
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/library/:gameId/launch
 * Launch a game
 */
router.post('/:gameId/launch', (req, res) => {
  try {
    const game = gameLibrary.get(req.params.gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    const result = GameLauncher.launchGame(
      game.id,
      game.name,
      game.installPath
    );

    if (result.success) {
      game.lastPlayed = new Date();
      gameLibrary.set(game.id, game);

      res.json({
        success: true,
        message: result.message,
        gameId: game.id,
        pid: result.pid
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/library/:gameId/close
 * Close a running game
 */
router.post('/:gameId/close', (req, res) => {
  try {
    const game = gameLibrary.get(req.params.gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    const result = GameLauncher.killGame(game.id);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/library/:gameId
 * Uninstall a game
 */
router.delete('/:gameId', async (req, res) => {
  try {
    const game = gameLibrary.get(req.params.gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    if (GameLauncher.isGameRunning(game.id)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot uninstall: Game is currently running'
      });
    }

    const { keepSaves = false } = req.body || {};

    const result = await GameUninstaller.uninstallGame(
      game.id,
      game.name,
      game.installPath,
      { keepSaves }
    );

    if (result.success) {
      gameLibrary.delete(game.id);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/library/running/games
 * Get all running games
 */
router.get('/running/games', (req, res) => {
  try {
    const running = GameLauncher.getRunningGames();

    res.json({
      success: true,
      data: running,
      count: running.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;


