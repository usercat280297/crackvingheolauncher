#!/usr/bin/env node

/**
 * ============================================
 * VERIFY DENUVO FIX AND BEAUTIFUL NAMES
 * Tests accuracy of Denuvo detection
 * ============================================
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Test games with KNOWN Denuvo status
const TEST_GAMES = [
  // Should HAVE Denuvo
  { gameId: 2358720, name: 'Black Myth: Wukong', hasDenuvo: true },
  { gameId: 2054790, name: "Dragon's Dogma 2", hasDenuvo: true },
  { gameId: 2246340, name: 'Monster Hunter Wilds', hasDenuvo: true },
  { gameId: 1364780, name: 'Street Fighter 6', hasDenuvo: true },
  { gameId: 2515020, name: 'Final Fantasy XVI', hasDenuvo: true },
  
  // Should NOT have Denuvo
  { gameId: 1245620, name: 'Elden Ring', hasDenuvo: false },
  { gameId: 1174180, name: 'Red Dead Redemption 2', hasDenuvo: false },
  { gameId: 271590, name: 'Grand Theft Auto V', hasDenuvo: false },
  { gameId: 10090, name: 'Call of Duty 4: Modern Warfare', hasDenuvo: false },
  { gameId: 730, name: 'Counter-Strike 2', hasDenuvo: false },
];

async function testDenuvoDetection() {
  console.log('\n🔍 TESTING DENUVO DETECTION ACCURACY\n');
  console.log('═'.repeat(70));

  let correct = 0;
  let incorrect = 0;
  const errors = [];

  for (const game of TEST_GAMES) {
    try {
      const response = await axios.get(`${API_BASE}/denuvo/check/${game.gameId}`, {
        timeout: 5000
      });

      const data = response.data;
      const detected = data.hasDenuvo || data.denuvoProtected || false;

      // Check if correct
      const isCorrect = detected === game.hasDenuvo;

      if (isCorrect) {
        correct++;
        console.log(`✅ ${game.name} (${game.gameId})`);
        console.log(`   Expected: ${game.hasDenuvo ? 'HAS Denuvo' : 'NO Denuvo'} → Detected: ${detected ? 'HAS Denuvo' : 'NO Denuvo'}`);
      } else {
        incorrect++;
        console.log(`❌ ${game.name} (${game.gameId})`);
        console.log(`   Expected: ${game.hasDenuvo ? 'HAS Denuvo' : 'NO Denuvo'} → Detected: ${detected ? 'HAS Denuvo' : 'NO Denuvo'}`);
        errors.push({
          game: game.name,
          gameId: game.gameId,
          expected: game.hasDenuvo,
          detected
        });
      }
      console.log('');
    } catch (error) {
      console.log(`⚠️  ${game.name} (${game.gameId}) - Request failed`);
      console.log(`   Error: ${error.message}\n`);
      incorrect++;
      errors.push({
        game: game.name,
        gameId: game.gameId,
        error: error.message
      });
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('═'.repeat(70));
  console.log(`\n📊 RESULTS:`);
  console.log(`   ✅ Correct: ${correct}/${TEST_GAMES.length}`);
  console.log(`   ❌ Incorrect: ${incorrect}/${TEST_GAMES.length}`);
  console.log(`   Accuracy: ${((correct / TEST_GAMES.length) * 100).toFixed(1)}%\n`);

  if (errors.length > 0) {
    console.log('⚠️  ERRORS TO FIX:');
    errors.forEach(err => {
      if (err.error) {
        console.log(`   - ${err.game}: ${err.error}`);
      } else {
        console.log(`   - ${err.game}: Expected ${err.expected}, got ${err.detected}`);
      }
    });
  }
}

async function testBeautifulNames() {
  console.log('\n🎨 TESTING BEAUTIFUL GAME NAMES\n');
  console.log('═'.repeat(70));

  const testIds = [2358720, 1364780, 2050650, 10090, 1245620];
  
  try {
    const response = await axios.post(`${API_BASE}/denuvo/steamgriddb/batch-names`, {
      gameIds: testIds
    });

    const { names } = response.data;

    console.log('Game Names from SteamGridDB:\n');
    names.forEach(item => {
      const name = item.beautifulName || '(No beautiful name)';
      console.log(`   [${item.gameId}] ${name}`);
    });
    console.log('');
  } catch (error) {
    console.log(`❌ Failed to fetch beautiful names: ${error.message}\n`);
  }
}

async function runAllTests() {
  try {
    // Test connection
    console.log('🔌 Checking API connection...');
    try {
      await axios.get(`${API_BASE}/denuvo/list`, { timeout: 3000 });
      console.log('✅ API is running\n');
    } catch (error) {
      console.log('❌ API is not responding!');
      console.log('   Make sure server is running on port 3000\n');
      process.exit(1);
    }

    await testDenuvoDetection();
    await testBeautifulNames();

    console.log('═'.repeat(70));
    console.log('\n✨ Tests complete!\n');
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
