#!/usr/bin/env node

/**
 * ============================================
 * DENUVO DETECTION TEST SCRIPT
 * Test accurate denuvo detection for 43k users
 * ============================================
 */

require('dotenv').config();
const DenuvoDetectionService = require('./services/DenuvoDetectionService');
const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:3000';

// Test games (should have accurate denuvo detection)
const TEST_GAMES = [
  // Verified Denuvo Games
  { appId: 2358720, name: 'Black Myth: Wukong', expectedDenuvo: true },
  { appId: 2054970, name: 'Dragon\'s Dogma 2', expectedDenuvo: true },
  { appId: 1364780, name: 'Street Fighter 6', expectedDenuvo: true },
  { appId: 2515020, name: 'Final Fantasy XVI', expectedDenuvo: true },
  { appId: 2124490, name: 'Silent Hill 2 Remake', expectedDenuvo: true },
  
  // Anti-Cheat Games
  { appId: 1172470, name: 'Apex Legends', expectedDenuvo: false },
  { appId: 730, name: 'Counter-Strike 2', expectedDenuvo: false },
  
  // DRM-Free Games
  { appId: 413150, name: 'Stardew Valley', expectedDenuvo: false },
  { appId: 367520, name: 'Hollow Knight', expectedDenuvo: false },
  
  // Sports Games (Usually Denuvo)
  { appId: 2878980, name: 'NBA 2K25', expectedDenuvo: true },
  { appId: 2488620, name: 'F1 24', expectedDenuvo: true },
];

async function testDenuvoDetection() {
  console.log('🧪 Starting Denuvo Detection Tests\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const test of TEST_GAMES) {
    try {
      console.log(`\n📊 Testing: ${test.name} (App ID: ${test.appId})`);

      // Test 1: Local service
      const status = await DenuvoDetectionService.getFullDenuvoStatus(test.appId);
      console.log(`   ✓ Denuvo: ${status.hasDenuvo ? '🚫 YES' : '✅ NO'}`);
      console.log(`   ✓ Verified: ${status.isVerified ? '✅ YES' : '❌ NO'}`);
      console.log(`   ✓ Source: ${status.source}`);

      // Test 2: API endpoint
      const response = await axios.get(
        `${API_BASE}/api/denuvo/check/${test.appId}`
      );

      if (response.data.success) {
        console.log(`   ✓ API Response: ${response.data.data.hasDenuvo ? '🚫 DENUVO' : '✅ NO DENUVO'}`);
        
        if (status.hasDenuvo === test.expectedDenuvo) {
          console.log(`   ✅ PASSED`);
          passed++;
        } else {
          console.log(`   ❌ FAILED - Expected: ${test.expectedDenuvo}, Got: ${status.hasDenuvo}`);
          failed++;
        }
      } else {
        console.log(`   ❌ API Error: ${response.data.error}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failed++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📈 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total: ${TEST_GAMES.length}`);
  console.log(`   ✨ Success Rate: ${((passed / TEST_GAMES.length) * 100).toFixed(1)}%\n`);

  // Cache stats
  const stats = DenuvoDetectionService.getCacheStats();
  console.log(`📦 Cache Stats:`);
  console.log(`   Cached Games: ${stats.cachedGames}`);
  console.log(`   Verified Denuvo Games: ${stats.verifiedDenuvoCount}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

async function batchTestDenuvo() {
  console.log('🚀 Batch Testing Denuvo Detection\n');

  const appIds = TEST_GAMES.map(g => g.appId);

  try {
    console.log(`Testing ${appIds.length} games in batch...`);
    
    const response = await axios.post(
      `${API_BASE}/api/denuvo/batch`,
      { appIds },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    if (response.data.success) {
      console.log(`✅ Batch test successful!\n`);
      
      let denuvoCount = 0;
      let drmFreeCount = 0;
      
      for (const [appId, result] of Object.entries(response.data.data)) {
        const game = TEST_GAMES.find(g => g.appId === parseInt(appId));
        const status = result.hasDenuvo ? '🚫' : '✅';
        console.log(`${status} ${game?.name || appId}: ${result.hasDenuvo ? 'DENUVO' : 'NO DENUVO'}`);
        
        if (result.hasDenuvo) denuvoCount++;
        else drmFreeCount++;
      }

      console.log(`\n📊 Summary:`);
      console.log(`   Denuvo Games: ${denuvoCount}`);
      console.log(`   Non-Denuvo Games: ${drmFreeCount}`);
    } else {
      console.log(`❌ Error: ${response.data.error}`);
    }
  } catch (error) {
    console.error(`❌ Batch test failed: ${error.message}`);
  }
}

async function runAllTests() {
  await testDenuvoDetection();
  console.log('\n' + '='.repeat(60) + '\n');
  await batchTestDenuvo();
}

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testDenuvoDetection,
  batchTestDenuvo,
};
