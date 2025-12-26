const SteamAPISizeService = require('./services/SteamAPISizeService');

const testGames = [
  { appId: 1623730, name: 'Palworld' },
  { appId: 2050650, name: 'Starfield' },
  { appId: 1817070, name: 'Spider-Man Remastered' },
  { appId: 1966720, name: 'Hogwarts Legacy' },
  { appId: 2399830, name: 'Tekken 8' },
  { appId: 2195250, name: 'Street Fighter 6' },
  { appId: 2369390, name: 'Helldivers 2' },
  { appId: 1551360, name: 'Forza Horizon 5' }
];

async function testSteamAPI() {
  console.log('🧪 Testing Steam Store API Size Fetching...\n');

  for (const game of testGames) {
    try {
      console.log(`Testing ${game.name} (${game.appId})...`);
      
      const startTime = Date.now();
      const size = await SteamAPISizeService.getGameSize(game.appId);
      const elapsed = Date.now() - startTime;
      
      console.log(`  ✅ Size: ${size}`);
      console.log(`  ⏱️  Time: ${(elapsed/1000).toFixed(1)}s\n`);
      
      // Small delay to avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
    }
  }

  console.log('✅ Test complete!');
  process.exit(0);
}

testSteamAPI();
