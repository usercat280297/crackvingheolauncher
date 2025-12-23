// Test to simulate browser fetch to /api/games/:id
const http = require('http');

async function testAPI() {
  console.log('Testing API game fetch...\n');
  
  const testGames = [10, 100, 1000, 30101];
  
  for (const gameId of testGames) {
    console.log(`\n=== Testing Game ID: ${gameId} ===`);
    
    await new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/games/${gameId}`,
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log(`Status: ${res.statusCode}`);
          
          if (res.statusCode === 200) {
            try {
              const game = JSON.parse(data);
              console.log(`✅ Success!`);
              console.log(`   Title: ${game.title}`);
              console.log(`   ID: ${game.id}`);
              console.log(`   Developer: ${game.developer}`);
              console.log(`   Genres: ${game.genres?.join(', ') || 'N/A'}`);
              console.log(`   Has cover: ${!!game.cover}`);
              console.log(`   Has backgroundImage: ${!!game.backgroundImage}`);
              console.log(`   Has description: ${!!game.description}`);
              console.log(`   Has systemRequirements: ${!!game.systemRequirements}`);
            } catch (e) {
              console.log(`❌ Error parsing JSON: ${e.message}`);
            }
          } else {
            console.log(`⚠️ Error: Game not found or server error`);
            try {
              const error = JSON.parse(data);
              console.log(`   Message: ${error.message || error.error}`);
            } catch (e) {
              console.log(`   Raw data: ${data.substring(0, 100)}`);
            }
          }
          resolve();
        });
      });
      
      req.on('error', (e) => {
        console.log(`❌ Network error: ${e.code || e.message || JSON.stringify(e)}`);
        console.log(`   Error details: ${e.toString()}`);
        resolve();
      });
      
      req.on('timeout', () => {
        console.log(`❌ Request timeout`);
        req.destroy();
        resolve();
      });
      
      req.setTimeout(3000);
      req.end();
    });
  }
  
  console.log('\n✅ Test completed');
  process.exit(0);
}

// Run test
setTimeout(testAPI, 500); // Wait a bit for server to fully initialize
