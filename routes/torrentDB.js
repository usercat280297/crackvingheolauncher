const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');

/**
 * 📂 Quản lý torrent database
 * Lưu trữ thông tin các torrent game
 */

const TORRENT_DB_PATH = process.env.TORRENT_DB_PATH || 'C:\\Games\\Torrents_DB';

// Load games.json
async function loadGamesDB() {
  try {
    const dbPath = path.join(TORRENT_DB_PATH, 'games.json');
    if (await fs.pathExists(dbPath)) {
      const data = await fs.readJson(dbPath);
      return data.games || [];
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading games.json:', error);
    return [];
  }
}

/**
 * GET /api/torrent-db/game/:appId
 * Lấy thông tin torrent của game
 */
router.get('/game/:appId', async (req, res) => {
  try {
    const appId = parseInt(req.params.appId);
    const games = await loadGamesDB();
    
    const gameInfo = games.find(g => 
      g.appId === appId || g.id === appId
    );

    if (!gameInfo) {
      return res.status(404).json({
        success: false,
        error: `Game ${appId} not found in torrent database`
      });
    }

    // Kiểm tra torrent file có tồn tại không
    const torrentExists = await fs.pathExists(gameInfo.torrentFile);

    res.json({
      success: true,
      game: {
        id: gameInfo.id,
        appId: gameInfo.appId,
        name: gameInfo.name,
        torrentFile: gameInfo.torrentFile,
        torrentExists,
        installPath: gameInfo.installPath,
        hasDenuvo: gameInfo.hasDenuvo,
        isActive: gameInfo.isActive,
        size: gameInfo.size || 'Unknown'
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
 * GET /api/torrent-db/all
 * Lấy danh sách tất cả game torrent
 */
router.get('/all', async (req, res) => {
  try {
    const games = await loadGamesDB();
    const active = games.filter(g => g.isActive !== false);

    res.json({
      success: true,
      count: active.length,
      games: active.map(g => ({
        id: g.id,
        appId: g.appId,
        name: g.name,
        hasDenuvo: g.hasDenuvo,
        size: g.size || 'Unknown'
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/torrent-db/denuvo
 * Lấy danh sách game Denuvo torrent
 */
router.get('/denuvo', async (req, res) => {
  try {
    const games = await loadGamesDB();
    const denuvoGames = games.filter(g => 
      g.hasDenuvo && g.isActive !== false
    );

    res.json({
      success: true,
      count: denuvoGames.length,
      games: denuvoGames.map(g => ({
        id: g.id,
        appId: g.appId,
        name: g.name,
        size: g.size || 'Unknown'
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/torrent-db/add
 * Thêm game mới vào torrent DB
 */
router.post('/add', async (req, res) => {
  try {
    const {
      id,
      appId,
      name,
      torrentFile,
      installPath,
      hasDenuvo = false,
      size = 'Unknown'
    } = req.body;

    if (!id || !appId || !name || !torrentFile) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check torrent file exists
    const torrentExists = await fs.pathExists(torrentFile);
    if (!torrentExists) {
      return res.status(400).json({
        success: false,
        error: `Torrent file not found: ${torrentFile}`
      });
    }

    // Load current database
    let games = await loadGamesDB();
    
    // Check duplicate
    if (games.some(g => g.appId === appId)) {
      return res.status(400).json({
        success: false,
        error: `Game ${appId} already exists`
      });
    }

    // Add new game
    const newGame = {
      id,
      appId,
      name,
      torrentFile,
      installPath,
      hasDenuvo,
      size,
      isActive: true,
      addedAt: new Date().toISOString()
    };

    games.push(newGame);

    // Save database
    const dbPath = path.join(TORRENT_DB_PATH, 'games.json');
    await fs.ensureDir(TORRENT_DB_PATH);
    await fs.writeJson(dbPath, { games }, { spaces: 2 });

    res.json({
      success: true,
      message: `Added game ${name}`,
      game: newGame
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/torrent-db/remove/:appId
 * Xóa game khỏi database
 */
router.delete('/remove/:appId', async (req, res) => {
  try {
    const appId = parseInt(req.params.appId);
    let games = await loadGamesDB();

    const initialLength = games.length;
    games = games.filter(g => g.appId !== appId);

    if (games.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: `Game ${appId} not found`
      });
    }

    // Save updated database
    const dbPath = path.join(TORRENT_DB_PATH, 'games.json');
    await fs.writeJson(dbPath, { games }, { spaces: 2 });

    res.json({
      success: true,
      message: `Removed game ${appId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/torrent-db/stats
 * Lấy stats về torrent DB
 */
router.get('/stats', async (req, res) => {
  try {
    const games = await loadGamesDB();
    const denuvoCount = games.filter(g => g.hasDenuvo).length;
    const activeCount = games.filter(g => g.isActive !== false).length;

    // Check disk space
    const { execSync } = require('child_process');
    let freeSpace = 'Unknown';
    try {
      // Windows: fsutil volume diskfree C:
      const result = execSync('fsutil volume diskfree C:', { encoding: 'utf8' });
      const match = result.match(/\d+/g);
      if (match) {
        const bytes = parseInt(match[0]);
        freeSpace = (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
      }
    } catch (e) {
      // Fallback: use fs.statfs if available
    }

    res.json({
      success: true,
      stats: {
        totalGames: games.length,
        activeGames: activeCount,
        denuvoGames: denuvoCount,
        torrentDBPath: TORRENT_DB_PATH,
        diskSpaceFree: freeSpace
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
