const fs = require('fs');
const path = require('path');

// Build index từ filename (appID) thay vì call API
function buildQuickIndex() {
    console.log('🚀 Building quick index from filenames...');
    
    const luaFolder = './lua_files';
    const files = fs.readdirSync(luaFolder).filter(f => f.endsWith('.lua'));
    const gameIndex = {};
    
    files.forEach((file, i) => {
        const appId = file.replace('.lua', '');
        if (/^\d+$/.test(appId)) {
            gameIndex[appId] = {
                name: `Game ${appId}`, // Placeholder name
                file: file,
                searchText: `game ${appId}`
            };
        }
        
        if (i % 1000 === 0) {
            console.log(`📁 Processed ${i}/${files.length}`);
        }
    });
    
    fs.writeFileSync('./gameIndex.json', JSON.stringify(gameIndex, null, 2));
    console.log(`✅ Quick index built: ${Object.keys(gameIndex).length} games`);
}

buildQuickIndex();