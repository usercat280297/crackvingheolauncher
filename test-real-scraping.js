const SteamDBSizeService = require('./services/SteamDBSizeService');

// Test với games KHÔNG có trong knownSizes
const testGames = [
  { appId: 1623730, name: 'Palworld' },
  { appId: 2050650, name: 'Starfield' },
  { appId: 1817070, name: 'Spider-Man Remastered' },
  { appId: 1966720, name: 'Hogwarts Legacy' },
  { appId: 2399830, name: 'Tekken 8' }
];

async function testRealScraping() {
  console.log('🧪 Testing REAL SteamDB Scraping (not from cache)...\n');

  // Clear known sizes to force scraping
  SteamDBSizeService.knownSizes = {};

  for (const game of testGames) {
    try {
      console.log(`Testing ${game.name} (${game.appId})...`);
      
      const startTime = Date.now();
      const size = await SteamDBSizeService.getGameSize(game.appId);
      const elapsed = Date.now() - startTime;
      
      console.log(`  Size: ${size}`);
      console.log(`  Time: ${(elapsed/1000).toFixed(1)}s`);
      
      if (size.includes('GB') || size.includes('MB')) {
        console.log('  ✅ SUCCESS\n');
      } else {
        console.log('  ⚠️  SUSPICIOUS\n');
      }
      
      // Delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
    }
  }

  await SteamDBSizeService.closeBrowser();
  process.exit(0);
}

testRealScraping();
