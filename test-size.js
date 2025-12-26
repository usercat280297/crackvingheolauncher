const axios = require('axios');

async function testSizeAPI() {
  console.log('🧪 Testing Size API...\n');

  try {
    // 1. Clear cache
    console.log('1️⃣ Clearing size cache...');
    await axios.post('http://localhost:3000/api/games/size/clear-cache');
    console.log('✅ Cache cleared\n');

    // 2. Test Black Myth Wukong
    console.log('2️⃣ Fetching size for Black Myth: Wukong (2358720)...');
    const response = await axios.get('http://localhost:3000/api/games/2358720/size');
    console.log('📊 Result:', response.data);
    console.log('');

    // 3. Test another game
    console.log('3️⃣ Fetching size for Elden Ring (1245620)...');
    const response2 = await axios.get('http://localhost:3000/api/games/1245620/size');
    console.log('📊 Result:', response2.data);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testSizeAPI();
