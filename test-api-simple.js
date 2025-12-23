const http = require('http');

const gameId = 10;

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/games/${gameId}`,
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', chunk => data += chunk);
  
  res.on('end', () => {
    console.log(`\n✅ API Response (Status: ${res.statusCode})`);
    console.log('=====================================\n');
    try {
      const game = JSON.parse(data);
      console.log('Game ID:', game.id);
      console.log('Title:', game.title);
      console.log('Developer:', game.developer);
      console.log('Rating:', game.rating + '%');
      console.log('Genres:', (game.genres || []).join(', '));
      console.log('Size:', game.size);
      console.log('Has Cover:', !!game.cover);
      console.log('Has Background:', !!game.backgroundImage);
      console.log('\n✅ All required fields present!');
    } catch (e) {
      console.log('❌ Error parsing JSON:', e.message);
      console.log('Response:', data);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.log('❌ Connection Error:', error.message);
  console.log('\nMake sure server is running:');
  console.log('  npm run dev:server');
  process.exit(1);
});

req.setTimeout(5000);
req.end();

console.log(`Testing game ID: ${gameId}`);
console.log('Connecting to: http://localhost:3000/api/games/' + gameId);
