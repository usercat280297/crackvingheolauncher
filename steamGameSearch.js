const axios = require('axios');
const fs = require('fs');
const path = require('path');

class SteamGameSearch {
    constructor() {
        this.steamAppList = null;
        this.luaAppIds = new Set();
        this.luaFolder = './lua_files';
        this.cacheFile = './steamAppList.json';
        this.loadLuaAppIds();
    }

    // Load all appIDs from lua files
    loadLuaAppIds() {
        try {
            const files = fs.readdirSync(this.luaFolder).filter(f => f.endsWith('.lua'));
            files.forEach(file => {
                const filePath = path.join(this.luaFolder, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const match = content.match(/addappid\((\d+)\)/);
                if (match) {
                    this.luaAppIds.add(parseInt(match[1]));
                }
            });
            console.log(`📁 Loaded ${this.luaAppIds.size} appIDs from lua files`);
        } catch (error) {
            console.error('Error loading lua files:', error);
        }
    }

    // Load Steam app list (cache for 24h)
    async loadSteamAppList() {
        try {
            // Check cache
            if (fs.existsSync(this.cacheFile)) {
                const stats = fs.statSync(this.cacheFile);
                const age = Date.now() - stats.mtimeMs;
                if (age < 24 * 60 * 60 * 1000) { // 24 hours
                    this.steamAppList = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
                    console.log(`📚 Loaded ${this.steamAppList.length} Steam apps from cache`);
                    return;
                }
            }

            // Fetch from Steam API
            console.log('🔄 Fetching Steam app list...');
            const response = await axios.get('http://api.steampowered.com/ISteamApps/GetAppList/v2/', {
                timeout: 30000
            });
            this.steamAppList = response.data.applist.apps;
            
            // Save cache
            fs.writeFileSync(this.cacheFile, JSON.stringify(this.steamAppList));
            console.log(`✅ Loaded ${this.steamAppList.length} Steam apps`);
        } catch (error) {
            console.error('Error loading Steam app list:', error.message);
            this.steamAppList = [];
        }
    }

    // Search games
    async search(query, limit = 20) {
        if (!this.steamAppList) {
            await this.loadSteamAppList();
        }

        const searchTerm = query.toLowerCase().trim();
        if (!searchTerm) return [];

        const results = [];
        const exactMatches = [];
        const startsWithMatches = [];
        const containsMatches = [];

        // Search in Steam app list
        for (const app of this.steamAppList) {
            // Only include games that exist in our lua files
            if (!this.luaAppIds.has(app.appid)) continue;

            const appName = app.name.toLowerCase();

            if (appName === searchTerm) {
                exactMatches.push({
                    appId: app.appid,
                    name: app.name,
                    file: `${app.appid}.lua`,
                    matchType: 'exact',
                    score: 1.0
                });
            } else if (appName.startsWith(searchTerm)) {
                startsWithMatches.push({
                    appId: app.appid,
                    name: app.name,
                    file: `${app.appid}.lua`,
                    matchType: 'prefix',
                    score: 0.9
                });
            } else if (appName.includes(searchTerm)) {
                containsMatches.push({
                    appId: app.appid,
                    name: app.name,
                    file: `${app.appid}.lua`,
                    matchType: 'contains',
                    score: 0.8
                });
            }

            // Stop if we have enough results
            if (exactMatches.length + startsWithMatches.length + containsMatches.length >= limit * 3) {
                break;
            }
        }

        // Combine and limit results
        return [
            ...exactMatches,
            ...startsWithMatches.slice(0, limit),
            ...containsMatches.slice(0, limit)
        ].slice(0, limit);
    }

    // Get suggestions
    async getSuggestions(query, limit = 5) {
        const results = await this.search(query, limit * 2);
        return results.slice(0, limit);
    }
}

module.exports = SteamGameSearch;
