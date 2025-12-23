const QuickGameSearch = require('./quickGameSearch');

const searcher = new QuickGameSearch();

async function testSearch() {
    console.log('\n🔍 Testing search for "resident evil"...\n');
    
    const results = await searcher.search('resident evil', 15);
    
    console.log(`Found ${results.length} results:\n`);
    
    results.forEach((game, index) => {
        console.log(`${index + 1}. ${game.name}`);
        console.log(`   AppID: ${game.appId} | Match: ${game.matchType} | Score: ${(game.score * 100).toFixed(0)}%\n`);
    });
    
    // Test other queries
    console.log('\n🔍 Testing search for "resident"...\n');
    const results2 = await searcher.search('resident', 10);
    console.log(`Found ${results2.length} results\n`);
    results2.slice(0, 5).forEach((game, index) => {
        console.log(`${index + 1}. ${game.name} (${game.matchType})`);
    });
    
    console.log('\n🔍 Testing search for "evil"...\n');
    const results3 = await searcher.search('evil', 10);
    console.log(`Found ${results3.length} results\n`);
    results3.slice(0, 5).forEach((game, index) => {
        console.log(`${index + 1}. ${game.name} (${game.matchType})`);
    });
}

testSearch().catch(console.error);
