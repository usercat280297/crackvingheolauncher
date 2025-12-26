const axios = require('axios');
const cacheManager = require('./cacheManager');

class SteamService {
    constructor() {
        this.steamApiKey = process.env.STEAM_API_KEY;
        this.isUpdating = false;
        this.steamAppsCache = null;
    }
    
    async getSteamApps(forceRefresh = false) {
        const cacheKey = 'steam_apps_list';
        
        if (!forceRefresh) {
            const cached = await cacheManager.get(cacheKey, 'steamData');
            if (cached) {
                this.steamAppsCache = cached;
                return cached;
            }
        }
        
        try {
            console.log('🔄 Fetching Steam apps list...');
            const response = await axios.get('https://api.steampowered.com/ISteamApps/GetAppList/v2/');
            const apps = response.data.applist.apps;
            
            await cacheManager.set(cacheKey, apps, 'steamData');
            this.steamAppsCache = apps;
            
            console.log(`✅ Steam apps updated: ${apps.length} apps`);
            return apps;
        } catch (error) {
            console.error('❌ Error fetching Steam apps:', error);
            return this.steamAppsCache || [];
        }
    }
    
    async updateSteamApps() {
        if (this.isUpdating) {
            console.log('⏳ Steam update already in progress');
            return this.steamAppsCache;
        }
        
        this.isUpdating = true;
        
        try {
            const apps = await this.getSteamApps(true);
            const appsMap = {};
            apps.forEach(app => {
                appsMap[app.appid] = app.name;
            });
            
            await cacheManager.set('steam_apps_map', appsMap, 'steamData');
            console.log('✅ Steam apps lookup map created');
            return apps;
        } catch (error) {
            console.error('❌ Steam apps update failed:', error);
            return [];
        } finally {
            this.isUpdating = false;
        }
    }
    
    async clearCache() {
        await cacheManager.clear('steamData');
        this.steamAppsCache = null;
        console.log('🗑️ Steam cache cleared');
    }
    
    getCacheStats() {
        return {
            appsLoaded: this.steamAppsCache ? this.steamAppsCache.length : 0,
            apiKeyConfigured: !!this.steamApiKey,
            isUpdating: this.isUpdating
        };
    }
}

module.exports = new SteamService();