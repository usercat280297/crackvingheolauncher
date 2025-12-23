// Test script để kiểm tra API
const testGameId = 730; // Counter-Strike: Global Offensive

console.log('🧪 Testing Game Detail API...\n');

async function testAPI() {
  try {
    console.log(`📡 Fetching game ${testGameId}...`);
    const response = await fetch(`http://localhost:3000/api/games/${testGameId}`);
    
    console.log(`📥 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ SUCCESS! Game data received:');
      console.log(`   Title: ${data.title}`);
      console.log(`   Developer: ${data.developer}`);
      console.log(`   Rating: ${data.rating}`);
      console.log(`   Size: ${data.size}`);
      console.log(`   Genres: ${data.genres}`);
      console.log('\n✅ API is working correctly!');
    } else {
      const error = await response.json();
      console.log('\n⚠️  API returned error:');
      console.log(JSON.stringify(error, null, 2));
    }
  } catch (error) {
    console.log('\n❌ ERROR: Cannot connect to API');
    console.log(`   ${error.message}`);
    console.log('\n💡 Make sure server is running:');
    console.log('   npm run dev:server');
  }
}

testAPI();
