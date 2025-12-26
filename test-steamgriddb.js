// test-steamgriddb.js - Test SteamGridDB API
require('dotenv').config();

const steamGridDB = require('./services/SteamGridDBService');

// Popular game Steam App IDs for testing
const testGames = [
  { id: 2358720, name: 'Black Myth: Wukong' },
  { id: 1091500, name: 'Cyberpunk 2077' },
  { id: 1174180, name: 'Red Dead Redemption 2' },
  { id: 1245620, name: 'Elden Ring' },
  { id: 1938090, name: 'Call of Duty: Modern Warfare III' }
];

async function testSteamGridDB() {
  console.log('🧪 Testing SteamGridDB API\n');
  console.log('='.repeat(60));

  // Check if API key is configured
  if (!process.env.STEAMGRIDDB_API_KEY) {
    console.error('\n❌ ERROR: STEAMGRIDDB_API_KEY not found in .env');
    console.log('\n📝 To fix:');
    console.log('1. Go to: https://www.steamgriddb.com/profile/preferences/api');
    console.log('2. Generate an API key');
    console.log('3. Add to .env: STEAMGRIDDB_API_KEY=your_key_here');
    console.log('\n');
    return;
  }

  console.log('✅ API Key configured\n');

  // Test 1: Get single game images
  console.log('Test 1: Fetching images for Black Myth: Wukong\n');
  try {
    const images = await steamGridDB.getAllImagesBySteamId(2358720);
    
    if (images) {
      console.log('✅ Success!\n');
      console.log('Game Info:');
      console.log(`  Name: ${images.gameName}`);
      console.log(`  Steam ID: ${images.steamAppId}`);
      console.log(`  SGDB ID: ${images.sgdbGameId}\n`);
      
      console.log('Images Found:');
      console.log(`  Cover: ${images.cover ? '✅' : '❌'} ${images.cover || 'Not found'}`);
      console.log(`  Hero: ${images.hero ? '✅' : '❌'} ${images.hero || 'Not found'}`);
      console.log(`  Logo: ${images.logo ? '✅' : '❌'} ${images.logo || 'Not found'}`);
      console.log(`  Icon: ${images.icon ? '✅' : '❌'} ${images.icon || 'Not found'}`);
      console.log(`  Total Covers Available: ${images.allGrids?.length || 0}`);
      console.log(`  Total Heroes Available: ${images.allHeroes?.length || 0}`);
      console.log('\n');
    } else {
      console.log('❌ Game not found in SteamGridDB\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message, '\n');
  }

  console.log('='.repeat(60));

  // Test 2: Batch test multiple games
  console.log('\nTest 2: Testing multiple games\n');
  
  for (const game of testGames) {
    try {
      const cover = await steamGridDB.getBestCover(game.id);
      const hasCustomCover = !cover.includes('steamstatic.com');
      
      console.log(`${hasCustomCover ? '✅' : '⚠️ '} ${game.name.padEnd(35)} - ${hasCustomCover ? 'Custom cover' : 'Steam fallback'}`);
    } catch (error) {
      console.log(`❌ ${game.name.padEnd(35)} - Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));

  // Test 3: Search functionality
  console.log('\nTest 3: Search functionality\n');
  try {
    const results = await steamGridDB.searchGames('Elden Ring');
    console.log(`Found ${results.length} results for "Elden Ring":`);
    results.slice(0, 3).forEach(game => {
      console.log(`  - ${game.name} (ID: ${game.id})`);
    });
    console.log('\n');
  } catch (error) {
    console.error('❌ Search error:', error.message, '\n');
  }

  console.log('='.repeat(60));

  // Test 4: Cache statistics
  console.log('\nTest 4: Cache statistics\n');
  const cacheStats = steamGridDB.getCacheStats();
  console.log(`Cache size: ${cacheStats.size} items`);
  console.log('Cached keys:', cacheStats.keys.join(', '));
  console.log('\n');

  console.log('='.repeat(60));
  console.log('\n✅ All tests completed!\n');

  // Example usage in your code
  console.log('💡 Example Usage:\n');
  console.log('```javascript');
  console.log('const steamGridDB = require(\'./services/SteamGridDBService\');\n');
  console.log('// Get all images for a game');
  console.log('const images = await steamGridDB.getAllImagesBySteamId(2358720);\n');
  console.log('// Use in your Game model');
  console.log('game.cover = images.cover;');
  console.log('game.hero = images.hero;');
  console.log('game.logo = images.logo;\n');
  console.log('// Or get just the best cover with fallback');
  console.log('const cover = await steamGridDB.getBestCover(2358720);');
  console.log('```\n');
}

// Run tests
testSteamGridDB().catch(console.error);