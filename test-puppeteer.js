const SteamDBSizeService = require('./services/SteamDBSizeService');

async function test() {
  console.log('🧪 Testing Puppeteer SteamDB Scraper...\n');

  try {
    // Test game mới (không có trong knownSizes)
    console.log('Testing Elden Ring (1245620)...');
    const size = await SteamDBSizeService.getGameSize(1245620);
    console.log('Result:', size);
    console.log('');

    // Close browser
    await SteamDBSizeService.closeBrowser();
    console.log('✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test();
