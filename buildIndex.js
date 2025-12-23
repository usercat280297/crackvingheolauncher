const GameIndexer = require('./gameIndexer');

async function buildIndex() {
    const indexer = new GameIndexer();
    await indexer.buildIndex();
    console.log('✅ Index building completed!');
    process.exit(0);
}

buildIndex().catch(console.error);