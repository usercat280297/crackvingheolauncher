const SteamManifestSizeService = require('./services/SteamManifestSizeService');

async function testDirectly() {
  console.log('🧪 Testing SteamManifestSizeService directly...\n');

  try {
    // Test Black Myth Wukong
    console.log('1️⃣ Black Myth: Wukong (2358720)');
    const depots = SteamManifestSizeService.getDepotIdsFromLua(2358720);
    console.log('   Depot IDs:', depots);
    
    const size1 = await SteamManifestSizeService.getGameSize(2358720);
    console.log('   Size:', size1);
    console.log('');

    // Test Elden Ring
    console.log('2️⃣ Elden Ring (1245620)');
    const depots2 = SteamManifestSizeService.getDepotIdsFromLua(1245620);
    console.log('   Depot IDs:', depots2);
    
    const size2 = await SteamManifestSizeService.getGameSize(1245620);
    console.log('   Size:', size2);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDirectly();
