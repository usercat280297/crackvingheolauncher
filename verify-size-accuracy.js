const SteamDBSizeService = require('./services/SteamDBSizeService');

// Test với các game phổ biến có size đã biết
const testGames = [
  { appId: 2358720, name: 'Black Myth: Wukong', expectedSize: '139.6 GB' },
  { appId: 1245620, name: 'Elden Ring', expectedSize: '60.0 GB' },
  { appId: 1091500, name: 'Cyberpunk 2077', expectedSize: '150.0 GB' },
  { appId: 271590, name: 'GTA V', expectedSize: '175.0 GB' },
  { appId: 1174180, name: 'Red Dead Redemption 2', expectedSize: '125.0 GB' }
];

async function verifyAccuracy() {
  console.log('🧪 Testing Size Accuracy...\n');

  let correct = 0;
  let total = 0;

  for (const game of testGames) {
    try {
      console.log(`Testing ${game.name} (${game.appId})...`);
      console.log(`  Expected: ${game.expectedSize}`);
      
      const size = await SteamDBSizeService.getGameSize(game.appId);
      console.log(`  Got: ${size}`);
      
      if (size === game.expectedSize) {
        console.log('  ✅ CORRECT\n');
        correct++;
      } else {
        console.log('  ⚠️  DIFFERENT\n');
      }
      
      total++;
      
      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
      total++;
    }
  }

  console.log('='.repeat(60));
  console.log(`📊 Accuracy: ${correct}/${total} (${Math.round(correct/total*100)}%)`);
  console.log('='.repeat(60));

  await SteamDBSizeService.closeBrowser();
  process.exit(0);
}

verifyAccuracy();
