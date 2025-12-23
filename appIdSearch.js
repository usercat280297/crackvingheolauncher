const fs = require('fs');

class AppIdSearch {
    constructor() {
        this.appIds = [];
        this.luaFolder = './lua_files';
        this.loadAppIds();
    }

    loadAppIds() {
        const files = fs.readdirSync(this.luaFolder).filter(f => f.endsWith('.lua'));
        this.appIds = files.map(f => {
            const appId = parseInt(f.replace('.lua', ''));
            return isNaN(appId) ? null : appId;
        }).filter(id => id !== null);
        
        console.log(`✅ Loaded ${this.appIds.length} game appIDs`);
    }

    // Return appIDs only - frontend will fetch names
    search(query, limit = 20) {
        // For now, just return some appIDs
        // Later we'll add proper name search when we have the mapping
        return this.appIds.slice(0, limit).map(appId => ({
            appId,
            file: `${appId}.lua`
        }));
    }

    getSuggestions(query, limit = 5) {
        return this.search(query, limit);
    }

    getAllAppIds() {
        return this.appIds;
    }
}

module.exports = AppIdSearch;
