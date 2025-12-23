const fs = require('fs');
const path = require('path');
const axios = require('axios');

const CONCURRENT_REQUESTS = 5; // Fetch 5 games at once
const DELAY_PER_REQUEST = 200; // 200ms per request

async function fetchGameName(appId) {
    try {
        const response = await axios.get(
            `https://store.steampowered.com/api/appdetails?appids=${appId}`,
            { timeout: 10000 }
        );
        
        const data = response.data[appId];
        if (data && data.success && data.data && data.data.name) {
            return { appId, name: data.data.name, success: true };
        }
        
        return { appId, name: `Game ${appId}`, success: false };
    } catch (error) {
        if (error.response?.status === 429) {
            throw new Error('RATE_LIMITED');
        }
        return { appId, name: `Game ${appId}`, success: false };
    }
}

async function buildCacheFromLua() {
    console.log('🚀 Building complete cache from Lua files...');
    console.log(`⏱️  Concurrent mode: ${CONCURRENT_REQUESTS} requests at once`);
    
    const luaFolder = './lua_files';
    
    // Extract all appIds from lua files
    const files = fs.readdirSync(luaFolder).filter(f => f.endsWith('.lua'));
    const allAppIds = new Set();
    
    files.forEach(file => {
        const appId = parseInt(file.replace('.lua', ''));
        if (!isNaN(appId)) {
            allAppIds.add(appId);
        }
    });
    
    const appIdsArray = Array.from(allAppIds);
    console.log(`📁 Found ${appIdsArray.length} lua files`);
    
    // Load existing cache to avoid re-fetching
    let gameNames = new Map();
    if (fs.existsSync('./gameNamesCache.json')) {
        const existingCache = JSON.parse(fs.readFileSync('./gameNamesCache.json', 'utf8'));
        gameNames = new Map(Object.entries(existingCache));
        console.log(`📦 Loaded ${gameNames.size} from existing cache`);
    }
    
    // Find games to fetch
    const toFetch = appIdsArray.filter(id => !gameNames.has(id.toString()));
    console.log(`⏳ Need to fetch: ${toFetch.length}`);
    console.log('');

    let fetched = 0;
    let failed = 0;
    let rateLimited = 0;

    // Process in batches with concurrent requests
    for (let i = 0; i < toFetch.length; i += CONCURRENT_REQUESTS) {
        const batch = toFetch.slice(i, i + CONCURRENT_REQUESTS);
        
        try {
            const promises = batch.map(appId => 
                fetchGameName(appId).catch(err => {
                    if (err.message === 'RATE_LIMITED') {
                        throw err;
                    }
                    return { appId, name: `Game ${appId}`, success: false };
                })
            );
            
            const results = await Promise.all(promises);
            
            results.forEach(result => {
                gameNames.set(result.appId.toString(), result.name);
                if (result.success) fetched++;
                else failed++;
            });
            
            const progress = ((i + batch.length) / toFetch.length * 100).toFixed(1);
            const totalProgress = (gameNames.size / appIdsArray.length * 100).toFixed(1);
            console.log(`✅ Batch ${Math.floor(i / CONCURRENT_REQUESTS) + 1} - Fetched: ${fetched}, Total: ${gameNames.size}/${appIdsArray.length} (${totalProgress}%)`);
            
            // Delay between batches
            await new Promise(resolve => setTimeout(resolve, DELAY_PER_REQUEST * batch.length));
            
        } catch (error) {
            if (error.message === 'RATE_LIMITED') {
                rateLimited++;
                console.log(`⚠️  Rate limited! Pausing for 5 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
                // Retry this batch
                i -= CONCURRENT_REQUESTS;
            } else {
                console.error('Error in batch:', error.message);
            }
        }
    }

    // Save cache
    fs.writeFileSync(
        './gameNamesCache.json',
        JSON.stringify(Object.fromEntries(gameNames), null, 2)
    );

    console.log('');
    console.log('✅ Cache build complete!');
    console.log(`📊 Final stats:`);
    console.log(`   - Total games: ${gameNames.size}/${appIdsArray.length}`);
    console.log(`   - Successfully fetched: ${fetched}`);
    console.log(`   - Fallback names: ${gameNames.size - fetched}`);
    console.log(`   - Rate limit hits: ${rateLimited}`);
    console.log('');
    console.log('💾 Cache saved to: gameNamesCache.json');
    console.log('🎮 Ready to search all games!');
    
    process.exit(0);
}

buildCacheFromLua().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
