#!/usr/bin/env node

/**
 * Test script for GameDetail API endpoint
 * Run: node test-game-detail.js
 */

const http = require('http');

// Test game IDs from lua_files
const testGameIds = [10, 1002, 100980, 1007, 1008080];

console.log('🧪 Testing Game Detail API Endpoint');
console.log('====================================\n');

async function testGameEndpoint(gameId) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/games/${gameId}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const status = res.statusCode;
          
          if (status === 200) {
            console.log(`✅ Game ${gameId}: SUCCESS`);
            console.log(`   Title: ${json.title || 'N/A'}`);
            console.log(`   Developer: ${json.developer || 'N/A'}`);
            console.log(`   Genres: ${(json.genres || []).join(', ') || 'N/A'}`);
          } else {
            console.log(`❌ Game ${gameId}: FAILED (${status})`);
            console.log(`   Message: ${json.message || json.error || 'Unknown error'}`);
          }
        } catch (e) {
          console.log(`❌ Game ${gameId}: ERROR parsing response`);
          console.log(`   Response: ${data.substring(0, 100)}`);
        }
        console.log('');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Game ${gameId}: CONNECTION ERROR`);
      console.log(`   Error: ${error.message}`);
      console.log('   Make sure server is running: npm run dev:server\n');
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  console.log('Testing game IDs:', testGameIds.join(', '));
  console.log('Make sure server is running on port 3000\n');
  
  for (const gameId of testGameIds) {
    await testGameEndpoint(gameId);
    await new Promise(r => setTimeout(r, 500)); // Delay between tests
  }
  
  console.log('====================================');
  console.log('✅ Test completed');
  process.exit(0);
}

runTests();
