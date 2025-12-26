const SteamAPISizeService = require('./services/SteamAPISizeService');

const testGames = [
  { appId: 990080, name: 'Hogwarts Legacy' },
  { appId: 1966720, name: 'Lethal Company' },
  { appId: 1623730, name: 'Palworld' },
  { appId: 1245620, name: 'Elden Ring' },
  { appId: 2358720, name: 'Black Myth: Wukong' }
];

async function testCorrectIDs() {
  console.log('🧪 Testing with Correct AppIDs...\n');

  for (const game of testGames) {
    try {
      console.log(`${game.name} (${game.appId})...`);
      
      const size = await SteamAPISizeService.getGameSize(game.appId);
      console.log(`  Size: ${size}\n`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`  Error: ${error.message}\n`);
    }
  }

  process.exit(0);
}

testCorrectIDs();
