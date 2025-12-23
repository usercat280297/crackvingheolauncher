/**
 * Advanced Download System Integration Examples
 * Showing how professional launchers implement high-speed downloads
 */

// ============================================
// Example 1: Starting a download with all options
// ============================================

async function startAdvancedDownload() {
  const gameData = {
    title: "Cyberpunk 2077",
    appId: 1091500,
    fileSize: 107374182400, // 100 GB
    downloadUrl: "https://cdn.example.com/games/cyberpunk-2077.tar.gz",
    expectedHash: "abc123def456...",
    releaseDate: "2020-12-10"
  };

  // Request download
  const response = await fetch('/api/advanced-downloads/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameTitle: gameData.title,
      fileUrl: gameData.downloadUrl,
      fileSize: gameData.fileSize,
      destination: `C:\\Games\\${gameData.title}`,
      compress: true,                    // Enable compression
      maxBandwidth: 157286400,           // 150 MB/s limit
      priority: 'high',                  // High priority queue
      expectedHash: gameData.expectedHash
    })
  });

  const { downloadId, totalChunks, chunkSize } = await response.json();

  console.log(`🚀 Download started!`);
  console.log(`   ID: ${downloadId}`);
  console.log(`   Chunks: ${totalChunks} × ${(chunkSize / 1024 / 1024).toFixed(0)}MB`);
  console.log(`   Max Threads: 8`);
  console.log(`   Estimated time: ~18 minutes @ 150 MB/s`);

  return downloadId;
}

// ============================================
// Example 2: Real-time progress monitoring
// ============================================

async function monitorDownload(downloadId) {
  const startTime = Date.now();

  const statusInterval = setInterval(async () => {
    const response = await fetch(`/api/advanced-downloads/${downloadId}/status`);
    const { download, activeStatus } = await response.json();

    if (!activeStatus) {
      console.log('Download not active');
      clearInterval(statusInterval);
      return;
    }

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const completedChunks = activeStatus.chunks.filter(c => c.status === 'completed').length;
    const downloadingChunks = activeStatus.chunks.filter(c => c.status === 'downloading').length;

    console.log(`
      ╔═══════════════════════════════════════╗
      ║ DOWNLOAD PROGRESS                     ║
      ╠═══════════════════════════════════════╣
      ║ Game: ${download.gameTitle.padEnd(32)} ║
      ║ ${formatProgress(download.progress).padEnd(38)} ║
      ║ Downloaded: ${formatBytes(download.downloadedSize).padEnd(25)} ║
      ║ Speed: ${formatSpeed(download.speed).padEnd(30)} ║
      ║ ETA: ${(download.eta || '--:--:--').padEnd(33)} ║
      ║ Chunks: ${completedChunks}/${activeStatus.chunks.length} done (${downloadingChunks} active) ║
      ║ Elapsed: ${formatTime(elapsed).padEnd(32)} ║
      ╚═══════════════════════════════════════╝
    `);
  }, 1000);
}

// ============================================
// Example 3: Bandwidth-aware downloading
// ============================================

async function startBandwidthAwareDownload(downloadId) {
  // Check if user is playing a game
  const isGameRunning = await checkIfGameRunning();

  // Adjust bandwidth based on game activity
  const bandwidthSettings = {
    gameRunning: 10 * 1024 * 1024,      // 10 MB/s if game is open
    peakHours: 50 * 1024 * 1024,        // 50 MB/s (6 AM - 8 PM)
    offPeak: 150 * 1024 * 1024          // 150 MB/s (8 PM - 6 AM)
  };

  let maxBandwidth;
  if (isGameRunning) {
    maxBandwidth = bandwidthSettings.gameRunning;
    console.log('⚠️  Game running detected - limiting to 10 MB/s');
  } else if (isPeakHours()) {
    maxBandwidth = bandwidthSettings.peakHours;
    console.log('📊 Peak hours - limiting to 50 MB/s');
  } else {
    maxBandwidth = bandwidthSettings.offPeak;
    console.log('🌙 Off-peak hours - full speed 150 MB/s');
  }

  return maxBandwidth;
}

// ============================================
// Example 4: Handling pause/resume
// ============================================

class SmartPauseManager {
  constructor(downloadId) {
    this.downloadId = downloadId;
    this.isPaused = false;
  }

  // Auto-pause when game launches
  async onGameLaunch(gameId) {
    console.log(`🎮 Game launching - pausing download`);
    
    const response = await fetch(
      `/api/advanced-downloads/${this.downloadId}/pause`,
      { method: 'POST' }
    );
    
    this.isPaused = true;
    console.log(`⏸️  Download paused - ${await response.json()}`);
  }

  // Auto-resume when game closes
  async onGameClose(gameId) {
    console.log(`🏠 Game closed - resuming download`);
    
    const response = await fetch(
      `/api/advanced-downloads/${this.downloadId}/resume`,
      { method: 'POST' }
    );
    
    this.isPaused = false;
    console.log(`▶️  Download resumed - ${await response.json()}`);
  }

  // Resume at specific time (scheduled)
  async scheduleResume(hour) {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    const delay = target - now;

    console.log(`⏰ Scheduled resume at ${target.toLocaleTimeString()}`);

    setTimeout(async () => {
      await this.onGameClose(null);
    }, delay);
  }
}

// ============================================
// Example 5: Compression strategy
// ============================================

async function downloadWithCompression(gameData) {
  // Check file size
  const { fileSize } = gameData;
  const GB = 1024 * 1024 * 1024;

  let compressionOptions = {
    compress: false,
    level: 0
  };

  if (fileSize > 50 * GB) {
    // 50+ GB: Always compress
    compressionOptions = {
      compress: true,
      level: 6  // Optimal balance
    };
    console.log(`💾 File is ${(fileSize / GB).toFixed(0)}GB - enabling compression (50% smaller)`);
  } else if (fileSize > 10 * GB) {
    // 10-50 GB: Compress if off-peak
    compressionOptions = {
      compress: !isPeakHours(),
      level: 6
    };
    console.log(`💾 File is ${(fileSize / GB).toFixed(1)}GB - conditional compression`);
  }

  // Start download with compression settings
  const response = await fetch('/api/advanced-downloads/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameTitle: gameData.title,
      fileUrl: gameData.downloadUrl,
      fileSize: gameData.fileSize,
      destination: gameData.destination,
      compress: compressionOptions.compress,
      compressionLevel: compressionOptions.level
    })
  });

  return response.json();
}

// ============================================
// Example 6: Multi-download queue management
// ============================================

class DownloadQueue {
  constructor() {
    this.queue = [];
    this.active = new Map();
    this.MAX_CONCURRENT = 3;
  }

  async addToQueue(gameData, priority = 'normal') {
    this.queue.push({
      ...gameData,
      priority,
      addedAt: new Date()
    });

    // Sort by priority
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    console.log(`📋 Added "${gameData.title}" to queue (${this.queue.length} total)`);
    this.processQueue();
  }

  async processQueue() {
    if (this.active.size >= this.MAX_CONCURRENT) {
      return; // Max concurrent downloads reached
    }

    const game = this.queue.shift();
    if (!game) return;

    console.log(`🚀 Starting download: ${game.title}`);

    const response = await fetch('/api/advanced-downloads/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameTitle: game.title,
        fileUrl: game.downloadUrl,
        fileSize: game.fileSize,
        destination: game.destination,
        compress: game.fileSize > 10 * 1024 * 1024 * 1024
      })
    });

    const { downloadId } = await response.json();
    this.active.set(downloadId, game);

    // When download completes, process next
    this.waitForCompletion(downloadId).then(() => {
      this.active.delete(downloadId);
      console.log(`✅ ${game.title} completed`);
      this.processQueue();
    });
  }

  async waitForCompletion(downloadId) {
    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        const response = await fetch(`/api/advanced-downloads/${downloadId}/status`);
        const { download } = await response.json();

        if (download.status === 'completed') {
          clearInterval(interval);
          resolve();
        }
      }, 5000);
    });
  }

  async cancelDownload(downloadId) {
    await fetch(`/api/advanced-downloads/${downloadId}/cancel`, { method: 'POST' });
    this.active.delete(downloadId);
    console.log(`❌ Download cancelled`);
  }

  getQueueStatus() {
    return {
      active: this.active.size,
      queued: this.queue.length,
      total: this.active.size + this.queue.length,
      activeDownloads: Array.from(this.active.values()).map(g => g.title)
    };
  }
}

// ============================================
// Example 7: Server selection & failover
// ============================================

async function selectBestDownloadServer(gameId) {
  const servers = [
    {
      name: 'CDN US',
      url: 'https://us.cdn.example.com',
      region: 'US',
      expectedBandwidth: 500 // Mbps
    },
    {
      name: 'CDN EU',
      url: 'https://eu.cdn.example.com',
      region: 'EU',
      expectedBandwidth: 400 // Mbps
    },
    {
      name: 'CDN Asia',
      url: 'https://asia.cdn.example.com',
      region: 'Asia',
      expectedBandwidth: 300 // Mbps
    }
  ];

  console.log('🌍 Testing server latency and speed...');

  const results = await Promise.all(
    servers.map(async (server) => {
      try {
        const start = Date.now();
        await fetch(`${server.url}/ping`, { signal: AbortSignal.timeout(5000) });
        const latency = Date.now() - start;

        // Calculate score (lower latency = higher score)
        const score = (1000 - latency) * (server.expectedBandwidth / 500);

        return { ...server, latency, score };
      } catch (error) {
        return { ...server, latency: 9999, score: 0, error: true };
      }
    })
  );

  // Sort by score (best first)
  results.sort((a, b) => b.score - a.score);

  console.log('📊 Server Ranking:');
  results.forEach((r, idx) => {
    if (!r.error) {
      console.log(`   ${idx + 1}. ${r.name} (${r.latency}ms, ${r.expectedBandwidth} Mbps) - Score: ${r.score.toFixed(0)}`);
    } else {
      console.log(`   ${idx + 1}. ${r.name} - OFFLINE`);
    }
  });

  const bestServer = results.find(r => !r.error);
  if (!bestServer) {
    throw new Error('All servers offline!');
  }

  console.log(`✅ Selected: ${bestServer.name}`);
  return bestServer.url;
}

// ============================================
// Helper Functions
// ============================================

function formatProgress(percent) {
  const filled = Math.round(percent / 5);
  const empty = 20 - filled;
  return `[${('█'.repeat(filled) + '░'.repeat(empty))}] ${percent.toFixed(1)}%`;
}

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond) {
  return formatBytes(bytesPerSecond) + '/s';
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function isPeakHours() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 20;
}

async function checkIfGameRunning() {
  // Implementation: Check if any game process is running
  // This is OS-specific (Windows/Linux/macOS)
  return false; // Placeholder
}

// ============================================
// Export for use
// ============================================

module.exports = {
  startAdvancedDownload,
  monitorDownload,
  SmartPauseManager,
  DownloadQueue,
  selectBestDownloadServer,
  formatBytes,
  formatSpeed,
  formatTime
};
