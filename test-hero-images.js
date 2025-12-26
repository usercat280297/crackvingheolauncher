const axios = require('axios');

const TEST_GAME_ID = '1658280'; // Eiyuden Chronicle: Hundred Heroes

async function testHeroImages() {
  console.log('🧪 Testing Hero Images for game:', TEST_GAME_ID);
  console.log('='.repeat(60));

  try {
    // Step 1: Clear cache
    console.log('\n1️⃣ Clearing cache...');
    try {
      await axios.post('http://localhost:3000/api/steam/cache/clear');
      console.log('✅ Cache cleared');
    } catch (error) {
      console.log('⚠️ Cache clear failed (server might not be running)');
    }

    // Step 2: Fetch game details
    console.log('\n2️⃣ Fetching game details...');
    const response = await axios.get(`http://localhost:3000/api/steam/game/${TEST_GAME_ID}`);
    const game = response.data;

    console.log('\n📊 Game Info:');
    console.log('  Name:', game.name);
    console.log('  App ID:', game.appid);

    console.log('\n🖼️ Images:');
    console.log('  Cover:', game.images?.cover ? '✅ ' + game.images.cover.substring(0, 60) + '...' : '❌ Missing');
    console.log('  Hero:', game.images?.hero ? '✅ ' + game.images.hero.substring(0, 60) + '...' : '❌ Missing');
    console.log('  Logo:', game.images?.logo ? '✅ ' + game.images.logo.substring(0, 60) + '...' : '❌ Missing');
    console.log('  Icon:', game.images?.icon ? '✅ ' + game.images.icon.substring(0, 60) + '...' : '❌ Missing');

    // Step 3: Test direct SteamGridDB
    console.log('\n3️⃣ Testing SteamGridDB directly...');
    const SteamGridDBService = require('./services/SteamGridDBService');
    
    const images = await SteamGridDBService.getAllImagesBySteamId(TEST_GAME_ID);
    
    if (images) {
      console.log('\n📦 SteamGridDB Response:');
      console.log('  Game Name:', images.gameName);
      console.log('  SGDB ID:', images.sgdbGameId);
      console.log('  Grids:', images.allGrids?.length || 0);
      console.log('  Heroes:', images.allHeroes?.length || 0);
      console.log('  Logos:', images.allLogos?.length || 0);
      console.log('  Icons:', images.allIcons?.length || 0);
      
      if (images.allHeroes && images.allHeroes.length > 0) {
        console.log('\n🎭 Available Hero Images:');
        images.allHeroes.slice(0, 3).forEach((hero, i) => {
          console.log(`  ${i + 1}. ${hero.url}`);
        });
      }
    } else {
      console.log('❌ No images found from SteamGridDB');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testHeroImages();
