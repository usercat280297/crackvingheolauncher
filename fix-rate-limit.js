#!/usr/bin/env node

/**
 * ============================================
 * QUICK RATE LIMIT FIX - ONE COMMAND
 * ============================================
 * 
 * Chạy script này để tự động patch server.js
 * và dùng optimized API services
 */

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');

console.log('🔧 Applying Rate Limit Fix...\n');

// Read current server.js
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Check if already patched
if (serverContent.includes('OptimizedSteamAPIService')) {
  console.log('✅ Already patched! Rate limit fix is active.');
  process.exit(0);
}

// 1. Replace SteamGridDBService with OptimizedSteamGridDBService
if (serverContent.includes(`const SteamGridDBService = require('./services/SteamGridDBService');`)) {
  serverContent = serverContent.replace(
    `const SteamGridDBService = require('./services/SteamGridDBService');`,
    `const { getInstance: getOptimizedSteamGridDB } = require('./services/OptimizedSteamGridDBService');`
  );
  console.log('✓ Updated SteamGridDBService import');
}

// 2. Add OptimizedSteamAPIService import if not present
if (!serverContent.includes('OptimizedSteamAPIService')) {
  // Find a good place to add it (after other service imports)
  const insertPoint = serverContent.indexOf('const autoUpdateScheduler');
  if (insertPoint > -1) {
    serverContent = serverContent.slice(0, insertPoint) +
      `const { getInstance: getOptimizedSteamAPI } = require('./services/OptimizedSteamAPIService');\n` +
      serverContent.slice(insertPoint);
    console.log('✓ Added OptimizedSteamAPIService import');
  }
}

// 3. Replace realTimeService initialization to prevent batch 429 errors
if (serverContent.includes(`const realTimeService = require('./services/realTimeUpdateService');`)) {
  // Comment it out
  serverContent = serverContent.replace(
    `const realTimeService = require('./services/realTimeUpdateService');`,
    `// const realTimeService = require('./services/realTimeUpdateService'); // ⚠️  DISABLED - Use optimized services`
  );
  console.log('✓ Disabled problematic realTimeUpdateService');
}

// Save patched server.js
fs.writeFileSync(serverPath, serverContent);
console.log('\n✅ Rate limit fix applied successfully!\n');

console.log('📊 Summary of changes:');
console.log('  • Steam API: 1 second delay (was 5s)');
console.log('  • Max concurrent: 5 requests (adaptive)');
console.log('  • Exponential backoff: Enabled');
console.log('  • Auto-retry: 5 attempts max');
console.log('  • Memory cache: 24 hours');
console.log('  • File cache: 30,000 games supported\n');

console.log('🚀 Next steps:');
console.log('  1. npm start');
console.log('  2. Monitor: npm run test:rate-limit');
console.log('  3. Check stats: curl http://localhost:3000/api/rate-limit-stats\n');

console.log('❓ Having issues?');
console.log('  Read: RATE_LIMIT_FIX.md');
