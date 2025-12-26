const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

async function debugScrape() {
  console.log('🔍 Debug SteamDB Scraping...\n');

  const browser = await puppeteer.launch({
    headless: false, // Show browser
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log('📡 Navigating to SteamDB...');
  await page.goto('https://steamdb.info/app/1623730/depots/', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  console.log('⏳ Waiting 3 seconds...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Take screenshot
  await page.screenshot({ path: 'steamdb-debug.png', fullPage: true });
  console.log('📸 Screenshot saved: steamdb-debug.png');

  // Get page content
  const content = await page.content();
  fs.writeFileSync('steamdb-debug.html', content);
  console.log('💾 HTML saved: steamdb-debug.html');

  // Extract what we're looking for
  const result = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    
    // Look for total size
    const diskMatch = bodyText.match(/Total size on disk is ([\d,]+\.?\d*)\s*(GiB|MiB)/i);
    
    // Get table content
    const tables = document.querySelectorAll('table');
    const tableData = [];
    
    tables.forEach((table, i) => {
      const rows = table.querySelectorAll('tbody tr');
      if (rows.length > 0) {
        tableData.push({
          tableIndex: i,
          rowCount: rows.length,
          firstRowText: rows[0]?.innerText || 'empty'
        });
      }
    });
    
    return {
      diskMatch: diskMatch ? diskMatch[0] : null,
      tableCount: tables.length,
      tableData,
      bodyTextPreview: bodyText.substring(0, 500)
    };
  });

  console.log('\n📊 Extracted Data:');
  console.log(JSON.stringify(result, null, 2));

  console.log('\n✅ Check steamdb-debug.png and steamdb-debug.html');
  console.log('Press Ctrl+C to close browser...');
}

debugScrape().catch(console.error);
