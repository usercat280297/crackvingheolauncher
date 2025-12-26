#!/usr/bin/env node

/**
 * ============================================
 * RATE LIMIT MONITOR
 * Theo dõi hoạt động rate limiting
 * ============================================
 */

const { getInstance: getSteamAPI } = require('./services/OptimizedSteamAPIService');
const { getInstance: getSteamGridDB } = require('./services/OptimizedSteamGridDBService');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(text, color = 'reset') {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

async function monitorRateLimiting() {
  log('\n📊 RATE LIMIT MONITORING SYSTEM\n', 'cyan');

  const steamAPI = getSteamAPI();
  const steamGridDB = getSteamGridDB();

  // Sample games to test
  const testGames = [
    { id: 2358720, name: 'Black Myth Wukong' },
    { id: 1245620, name: 'Elden Ring' },
    { id: 271590, name: 'Grand Theft Auto V' },
    { id: 1196590, name: 'Resident Evil Village' },
    { id: 1364780, name: 'Street Fighter 6' },
  ];

  log('Testing Steam API Rate Limiting...', 'blue');
  log('─'.repeat(50) + '\n', 'blue');

  // Test sequential requests
  log('1️⃣  Sequential Requests (1 at a time):\n', 'yellow');
  
  const startTime = Date.now();
  for (let i = 0; i < testGames.slice(0, 3).length; i++) {
    const game = testGames[i];
    const t0 = Date.now();
    
    try {
      // This will use cache or make API call with rate limiting
      const result = await steamAPI.getGameDetails(game.id);
      const elapsed = Date.now() - t0;
      
      if (result) {
        log(`  ✅ ${game.name}: ${elapsed}ms`, 'green');
      } else {
        log(`  ⚠️  ${game.name}: No data (may be cache miss)`, 'yellow');
      }
    } catch (error) {
      log(`  ❌ ${game.name}: ${error.message}`, 'red');
    }
  }

  const sequentialTime = Date.now() - startTime;
  log(`\nTotal time: ${sequentialTime}ms\n`, 'yellow');

  log('2️⃣  Batch Requests (Optimized):\n', 'yellow');
  
  const startTime2 = Date.now();
  try {
    const games = await steamAPI.getGameDetailsBatch(
      testGames.map(g => g.id),
      { parallel: 2 }
    );
    const batchTime = Date.now() - startTime2;
    
    log(`  ✅ Fetched ${games.length}/${testGames.length} games`, 'green');
    log(`  Total time: ${batchTime}ms\n`, 'green');
  } catch (error) {
    log(`  ❌ Batch failed: ${error.message}\n`, 'red');
  }

  // Show statistics
  log('📈 SERVICE STATISTICS\n', 'cyan');
  log('─'.repeat(50) + '\n', 'cyan');

  const steamStats = steamAPI.getStats();
  const griddbStats = steamGridDB.getStats();

  log('Steam API Pool Stats:', 'blue');
  log(`  Total requests: ${steamStats.pool.total}`, 'blue');
  log(`  Successful: ${steamStats.pool.success}`, 'green');
  log(`  Failed: ${steamStats.pool.failed}`, 'red');
  log(`  Retried: ${steamStats.pool.retried}`, 'yellow');
  log(`  Queue length: ${steamStats.pool.queueLength}`, 'blue');

  log(`\nRate Limiter Status:`, 'blue');
  log(`  Current delay: ${steamStats.rateLimiter.currentDelay}ms`, 'blue');
  log(`  Backoff level: ${steamStats.rateLimiter.backoffLevel}`, 'blue');
  log(`  Failure streak: ${steamStats.rateLimiter.consecutiveFailures}`, 'yellow');

  log(`\nCache Status:`, 'blue');
  log(`  Items cached: ${steamStats.cache.size}`, 'blue');
  log(`  Cache TTL: ${steamStats.cache.ttl / 1000 / 60 / 60} hours`, 'blue');

  log('\n' + '─'.repeat(50), 'cyan');
  log('SteamGridDB Pool Stats:', 'blue');
  log(`  Total requests: ${griddbStats.pool.total}`, 'blue');
  log(`  Successful: ${griddbStats.pool.success}`, 'green');
  log(`  Failed: ${griddbStats.pool.failed}`, 'red');

  // Health check
  log('\n' + '─'.repeat(50) + '\n', 'cyan');
  log('💪 HEALTH CHECK\n', 'cyan');

  if (steamStats.pool.failed === 0) {
    log('  ✅ No failures detected', 'green');
  } else if (steamStats.pool.success > steamStats.pool.failed * 10) {
    log('  ⚠️  Low failure rate (acceptable)', 'yellow');
  } else {
    log('  ❌ High failure rate (needs investigation)', 'red');
  }

  if (steamStats.rateLimiter.backoffLevel === 0) {
    log('  ✅ No rate limit backoff', 'green');
  } else {
    log(`  ⚠️  In backoff mode (level ${steamStats.rateLimiter.backoffLevel})`, 'yellow');
  }

  log('\n' + '='.repeat(50) + '\n', 'cyan');

  // Recommendations
  log('💡 RECOMMENDATIONS\n', 'yellow');

  if (steamStats.pool.failed > 5) {
    log('  • Consider increasing delay: STEAM_API_CONFIG.baseDelay = 2000', 'yellow');
  }

  if (steamStats.rateLimiter.backoffLevel > 2) {
    log('  • Server is under heavy rate limiting, reduce concurrent requests', 'yellow');
  }

  if (steamStats.cache.size < 100) {
    log('  • Low cache size, consider running bulk sync to warm cache', 'yellow');
  } else {
    log('  ✅ Cache is well populated', 'green');
  }

  log('\n');
}

// Run monitor
monitorRateLimiting().catch(error => {
  console.error('Monitor failed:', error);
  process.exit(1);
});
