const fs = require('fs');
const path = require('path');
const axios = require('axios');

class GameIndexer {
    constructor() {
        this.gameIndex = new Map();
        this.luaFolder = './lua_files';
    }

    // Extract appID từ file .lua
    extractAppId(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const match = content.match(/addappid\((\d+)\)/);
            return match ? parseInt(match[1]) : null;
        } catch (error) {
            return null;
        }
    }

    // Tra cứu tên game từ Steam API
    async getGameName(appId) {
        try {
            const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}&filters=basic`);
            const data = response.data[appId];
            return data?.success ? data.data.name : null;
        } catch (error) {
            return null;
        }
    }

    // Scan tất cả file .lua và build index
    async buildIndex() {
        console.log('🔍 Scanning lua files...');
        const files = fs.readdirSync(this.luaFolder).filter(f => f.endsWith('.lua'));
        const batchSize = 100;
        
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const appIds = [];
            
            // Extract appIDs from batch
            batch.forEach(file => {
                const filePath = path.join(this.luaFolder, file);
                const appId = this.extractAppId(filePath);
                if (appId) appIds.push({ appId, file });
            });
            
            // Batch API call
            if (appIds.length > 0) {
                console.log(`📁 ${i+1}-${Math.min(i+batchSize, files.length)}/${files.length}`);
                await this.batchGetGameNames(appIds);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
            }
        }
        
        console.log(`✅ Indexed ${this.gameIndex.size} games`);
        this.saveIndex();
    }

    // Batch get game names
    async batchGetGameNames(appIds) {
        const ids = appIds.map(item => item.appId).join(',');
        try {
            const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${ids}&filters=basic`);
            
            appIds.forEach(({ appId, file }) => {
                const data = response.data[appId];
                if (data?.success) {
                    this.gameIndex.set(appId, {
                        name: data.data.name,
                        file: file,
                        searchText: data.data.name.toLowerCase()
                    });
                }
            });
        } catch (error) {
            console.log(`❌ Batch failed for ${ids}`);
        }
    }

    // Lưu index vào file
    saveIndex() {
        const indexData = Object.fromEntries(this.gameIndex);
        fs.writeFileSync('./gameIndex.json', JSON.stringify(indexData, null, 2));
        console.log('💾 Index saved to gameIndex.json');
    }

    // Load index từ file
    loadIndex() {
        try {
            const data = JSON.parse(fs.readFileSync('./gameIndex.json', 'utf8'));
            this.gameIndex = new Map(Object.entries(data).map(([k, v]) => [parseInt(k), v]));
            console.log(`📚 Loaded ${this.gameIndex.size} games from index`);
        } catch (error) {
            console.log('❌ No existing index found');
        }
    }

    // Search games
    search(query) {
        const searchTerm = query.toLowerCase();
        const results = [];
        
        for (const [appId, game] of this.gameIndex) {
            if (game.searchText.includes(searchTerm)) {
                results.push({
                    appId,
                    name: game.name,
                    file: game.file
                });
            }
        }
        
        return results;
    }
}

module.exports = GameIndexer;