// Quick test to fetch a game from API
const http = require('http');

const testIds = [10, 100, 1000, 5000, 30101];

async function testGame(id) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/games/${id}`,
      method: 'GET',
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const game = JSON.parse(data);
          console.log(`\n✅ Game ${id}: Status ${res.statusCode}`);
          console.log(`   Title: ${game.title || 'NO TITLE'}`);
          console.log(`   ID: ${game.id}`);
          console.log(`   Has cover: ${!!game.cover}`);
          console.log(`   Has description: ${!!game.description}`);
          resolve({ id, status: res.statusCode, title: game.title });
        } catch (e) {
          console.log(`❌ Game ${id}: Failed to parse JSON`);
          console.log(`   Data: ${data.substring(0, 100)}`);
          resolve({ id, status: res.statusCode, error: e.message });
        }
      });
    });
    
    req.on('error', (e) => {
      console.log(`❌ Game ${id}: Network error - ${e.message}`);
      resolve({ id, error: e.message });
    });
    
    req.on('timeout', () => {
      console.log(`❌ Game ${id}: Timeout`);
      req.destroy();
      resolve({ id, error: 'Timeout' });
    });
    
    req.end();
  });
}

async function main() {
  console.log('Testing API endpoints...\n');
  for (const id of testIds) {
    await testGame(id);
  }
  console.log('\n✅ Test completed');
  process.exit(0);
}

main();
