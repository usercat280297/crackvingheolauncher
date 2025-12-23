const http = require('http');

function testSearch(query) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000/api/search/search?q=${encodeURIComponent(query)}&limit=5`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error: ${data.substring(0, 100)}`));
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('Testing search API...\n');
  
  const queries = ['resident', 'cyberpunk', 'gta', 'witcher'];
  
  for (const query of queries) {
    console.log(`🔍 "${query}"`);
    try {
      const data = await testSearch(query);
      console.log(`✅ ${data.results?.length || 0} results`);
      data.results?.slice(0, 3).forEach((g, i) => {
        console.log(`  ${i + 1}. ${g.name} (${g.score}% - ${g.matchType})`);
      });
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    console.log('');
  }
}

runTests();
