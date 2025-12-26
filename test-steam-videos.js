require('dotenv').config();
const SteamVideoService = require('./services/SteamVideoService');

const testGames = [
  { id: 2358720, name: 'Black Myth: Wukong' },
  { id: 1091500, name: 'Cyberpunk 2077' },
  { id: 1174180, name: 'Red Dead Redemption 2' },
  { id: 1245620, name: 'Elden Ring' },
  { id: 1938090, name: 'Call of Duty: Modern Warfare III' }
];

async function testSteamVideos() {
  console.log('🎬 Testing Steam Video Fetching\n');
  console.log('='.repeat(70));

  for (const game of testGames) {
    console.log(`\n📹 ${game.name} (${game.id})`);
    console.log('-'.repeat(70));

    try {
      const videos = await SteamVideoService.fetchGameVideos(game.id);
      
      if (videos.length === 0) {
        console.log('❌ No videos found');
        continue;
      }

      console.log(`✅ Found ${videos.length} video(s):\n`);

      videos.forEach((video, index) => {
        console.log(`${index + 1}. ${video.name}`);
        console.log(`   ${video.highlight ? '⭐ MAIN TRAILER' : '   Additional video'}`);
        console.log(`   Thumbnail: ${video.thumbnail}`);
        console.log(`   HLS: ${video.hls || 'N/A'}`);
        console.log(`   DASH H264: ${video.dash_h264 || 'N/A'}`);
        console.log(`   Best URL: ${video.videoUrl || 'N/A'}`);
        console.log('');
      });

      // Test main trailer
      const mainTrailer = await SteamVideoService.getMainTrailer(game.id);
      if (mainTrailer) {
        console.log(`🎯 Main Trailer: ${mainTrailer.name}`);
        console.log(`   URL: ${mainTrailer.videoUrl}\n`);
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }

  console.log('='.repeat(70));
  console.log('\n✅ Test completed!\n');

  // Cache stats
  const stats = SteamVideoService.getCacheStats();
  console.log(`📊 Cache: ${stats.size} games cached`);
  console.log('\n💡 API Endpoints:');
  console.log('   GET /api/games/:id/videos    - Get all videos');
  console.log('   GET /api/games/:id/trailer   - Get main trailer only\n');
}

testSteamVideos().catch(console.error);
