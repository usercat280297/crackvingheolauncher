const axios = require('axios');
const fs = require('fs');

const STEAM_API_KEY = 'C8389A6AE249466D0A5234DC9D2D23C6';

async function buildCache() {
    console.log('Fetching Steam app list...');
    
    const response = await axios.get(`https://api.steampowered.com/IStoreService/GetAppList/v1/?key=${STEAM_API_KEY}&max_results=50000`);
    const apps = response.data.response.apps;
    
    console.log(`Got ${apps.length} apps`);
    
    // Load existing lua appIDs
    const luaFiles = fs.readdirSync('./lua_files').filter(f => f.endsWith('.lua'));
    const luaAppIds = new Set(luaFiles.map(f => parseInt(f.replace('.lua', ''))).filter(id => !isNaN(id)));
    
    console.log(`Found ${luaAppIds.size} lua files`);
    
    // Build cache
    const cache = {};
    for (const app of apps) {
        if (luaAppIds.has(app.appid)) {
            cache[app.appid] = app.name;
        }
    }
    
    fs.writeFileSync('./gameNamesCache.json', JSON.stringify(cache, null, 2));
    console.log(`✅ Cached ${Object.keys(cache).length} game names`);
}

buildCache().catch(console.error);
