const cacheManager = require('./cacheManager');
const SteamDLCService = require('./SteamDLCService');
const Game = require('../models/Game');

class DLCService {
    constructor() {
        this.isUpdating = false;
    }
    
    async getDLCsForGame(appId, forceRefresh = false) {
        const cacheKey = `dlc_${appId}`;
        
        if (!forceRefresh) {
            const cached = await cacheManager.get(cacheKey, 'dlc');
            if (cached) return cached;
        }
        
        try {
            console.log(`🔄 Fetching DLCs for game ${appId}...`);
            
            const dlcs = await SteamDLCService.getDLCsWithStatus(appId, 'demo');
            
            await cacheManager.set(cacheKey, dlcs, 'dlc');
            
            console.log(`✅ DLCs updated for game ${appId}: ${dlcs.length} DLCs`);
            return dlcs;
        } catch (error) {
            console.error(`❌ Error fetching DLCs for ${appId}:`, error);
            return [];
        }
    }
    
    async updateAllDLC() {
        if (this.isUpdating) {
            console.log('⏳ DLC update already in progress');
            return {};
        }
        
        this.isUpdating = true;
        
        try {
            console.log('🔄 Starting bulk DLC update...');
            
            const games = await Game.find({ 
                appId: { $exists: true },
                $or: [
                    { genres: /Action|RPG|Strategy/ },
                    { 'metacritic.score': { $gte: 70 } }
                ]
            })
            .select('appId title')
            .limit(50)
            .lean();
            
            const dlcData = {};
            let updated = 0;
            
            for (const game of games) {
                try {
                    const dlcs = await this.getDLCsForGame(game.appId, true);
                    if (dlcs && dlcs.length > 0) {
                        dlcData[game.appId] = dlcs;
                        updated++;
                        
                        await Game.findOneAndUpdate(
                            { appId: game.appId },
                            { dlcCount: dlcs.length }
                        );
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (error) {
                    console.error(`Failed to get DLCs for ${game.title}:`, error.message);
                }
            }
            
            console.log(`✅ DLC update completed: ${updated}/${games.length} games with DLCs`);
            return dlcData;
        } catch (error) {
            console.error('❌ Bulk DLC update failed:', error);
            return {};
        } finally {
            this.isUpdating = false;
        }
    }
    
    async clearCache() {
        await cacheManager.clear('dlc');
        console.log('🗑️ DLC cache cleared');
    }
}

module.exports = new DLCService();