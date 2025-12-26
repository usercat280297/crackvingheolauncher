const axios = require('axios');
const cheerio = require('cheerio');

async function testSteamDBScrape() {
  try {
    console.log('🔍 Testing SteamDB scrape for Black Myth: Wukong (2358720)...\n');
    
    const response = await axios.get(
      'https://steamdb.info/app/2358720/depots/',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://steamdb.info/'
        },
        timeout: 15000
      }
    );

    console.log('✅ Response received, status:', response.status);
    console.log('📄 Content length:', response.data.length, 'bytes\n');

    const $ = cheerio.load(response.data);
    
    // Method 1: Search for total size text
    const bodyText = $('body').text();
    console.log('🔎 Searching for "Total size on disk"...');
    const diskSizeMatch = bodyText.match(/Total size on disk is ([\d,]+\.?\d*)\s*(GiB|MiB)/i);
    
    if (diskSizeMatch) {
      console.log('✅ Found:', diskSizeMatch[0]);
      console.log('   Value:', diskSizeMatch[1]);
      console.log('   Unit:', diskSizeMatch[2]);
    } else {
      console.log('❌ Not found in body text\n');
    }

    // Method 2: Parse depot table
    console.log('\n📊 Parsing depot table...');
    const tables = $('table');
    console.log('Found', tables.length, 'tables\n');

    tables.each((i, table) => {
      const $table = $(table);
      const rows = $table.find('tbody tr');
      
      if (rows.length > 0) {
        console.log(`Table ${i + 1}: ${rows.length} rows`);
        
        rows.slice(0, 5).each((j, row) => {
          const $row = $(row);
          const cells = $row.find('td');
          
          if (cells.length >= 4) {
            const id = $(cells[0]).text().trim();
            const config = $(cells[1]).text().trim();
            const size = $(cells[3]).text().trim();
            
            console.log(`  Row ${j + 1}: ID=${id}, Config="${config}", Size="${size}"`);
          }
        });
        console.log('');
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testSteamDBScrape();
