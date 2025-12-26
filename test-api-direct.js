#!/usr/bin/env node

/**
 * Direct API Test - No HTTP, Direct Function Call
 */

const DenuvoDetectionService = require('./services/DenuvoDetectionService');

async function testAPI() {
  console.log('\n🧪 DIRECT API TEST (Simulating HTTP calls)\n');
  console.log('═'.repeat(70));

  const testGames = [
    { id: 2358720, name: 'Black Myth: Wukong' },
    { id: 2054790, name: "Dragon's Dogma 2" },
    { id: 2246340, name: 'Monster Hunter Wilds' },
    { id: 1364780, name: 'Street Fighter 6' },
    { id: 2515020, name: 'Final Fantasy XVI' },
    { id: 1245620, name: 'Elden Ring' },
    { id: 1174180, name: 'Red Dead Redemption 2' },
    { id: 271590, name: 'Grand Theft Auto V' },
    { id: 10090, name: 'Call of Duty 4' },
    { id: 730, name: 'Counter-Strike 2' },
  ];

  console.log('\nSIMULATING: GET /api/denuvo/check/:appId\n');

  for (const game of testGames) {
    try {
      const result = await DenuvoDetectionService.getFullDenuvoStatus(game.id);
      
      // Check different possible response formats
      const hasDenuvo = result.hasDenuvo || result.data?.hasDenuvo || false;
      
      console.log(`${hasDenuvo ? '🚫' : '🆓'} ${game.name} (${game.id})`);
      console.log(`   Status: ${hasDenuvo ? 'HAS Denuvo' : 'NO Denuvo'}`);
      console.log(`   Raw: ${JSON.stringify(result).substring(0, 100)}...`);
      console.log('');
    } catch (error) {
      console.log(`❌ ${game.name}: ${error.message}\n`);
    }
  }

  console.log('═'.repeat(70));
  console.log('\n✅ All API calls completed!\n');
}

testAPI().catch(console.error);
