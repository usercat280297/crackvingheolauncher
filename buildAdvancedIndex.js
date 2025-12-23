const AdvancedGameSearch = require('./advancedGameSearch');

async function buildAdvancedIndex() {
    console.log('🚀 Building advanced game search index...');
    const search = new AdvancedGameSearch();
    await search.buildIndex();
    console.log('✅ Advanced index completed!');
    process.exit(0);
}

buildAdvancedIndex().catch(console.error);