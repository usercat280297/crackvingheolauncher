const fs = require('fs');
const path = require('path');
const axios = require('axios');

class SimpleGameSearch {
    constructor() {
        this.appIds = [];
        this.steamGames = new Map();
        this.luaFolder = './lua_files';
        this.cacheFile = './gameNamesCache.json';
        this.loadAppIds();
        this.loadGameNames();
    }

    loadAppIds() {
        try {
            const files = fs.readdirSync(this.luaFolder).filter(f => f.endsWith('.lua'));
            this.appIds = files.map(f => parseInt(f.replace('.lua', ''))).filter(id => !isNaN(id));
            console.log(`📁 Loaded ${this.appIds.length} appIDs from lua files`);
        } catch (error) {
            console.error('Error loading appIDs:', error);
        }
    }

    async loadGameNames() {
        // Load from cache
        if (fs.existsSync(this.cacheFile)) {
            try {
                const cache = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
                this.steamGames = new Map(Object.entries(cache));
                console.log(`📚 Loaded ${this.steamGames.size} game names from cache`);
                return;
            } catch (e) {}
        }

        // Fetch from Steam API
        try {
            console.log('🔄 Fetching Steam app list...');
            const response = await axios.get('http://api.steampowered.com/ISteamApps/GetAppList/v2/');
            const apps = response.data.applist.apps;
            
            // Only store games we have lua files for
            for (const app of apps) {
                if (this.appIds.includes(app.appid)) {
                    this.steamGames.set(app.appid.toString(), app.name);
                }
            }
            
            // Save cache
            fs.writeFileSync(this.cacheFile, JSON.stringify(Object.fromEntries(this.steamGames)));
            console.log(`✅ Cached ${this.steamGames.size} game names`);
        } catch (error) {
            console.error('Error loading Steam app list:', error.message);
        }
    }

    search(query, limit = 20) {
        const searchTerm = query.toLowerCase().trim();
        if (!searchTerm || this.steamGames.size === 0) return [];

        const exactMatches = [];
        const startsWithMatches = [];
        const containsMatches = [];

        for (const [appId, gameName] of this.steamGames) {
            const lowerName = gameName.toLowerCase();

            if (lowerName === searchTerm) {
                exactMatches.push({ appId: parseInt(appId), name: gameName, file: `${appId}.lua`, matchType: 'exact', score: 1.0 });
            } else if (lowerName.startsWith(searchTerm)) {
                startsWithMatches.push({ appId: parseInt(appId), name: gameName, file: `${appId}.lua`, matchType: 'prefix', score: 0.9 });
            } else if (lowerName.includes(searchTerm)) {
                containsMatches.push({ appId: parseInt(appId), name: gameName, file: `${appId}.lua`, matchType: 'contains', score: 0.8 });
            }
        }

        return [
            ...exactMatches,
            ...startsWithMatches.slice(0, limit),
            ...containsMatches.slice(0, limit)
        ].slice(0, limit);
    }

    getSuggestions(query, limit = 5) {
        return this.search(query, limit * 2).slice(0, limit);
    }
}

module.exports = SimpleGameSearch;
