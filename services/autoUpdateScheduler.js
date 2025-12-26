const cron = require('node-cron');
const cacheManager = require('./cacheManager');
const steamService = require('./steamService');
const gameService = require('./gameService');
const dlcService = require('./dlcService');
const imageService = require('./imageService');

class AutoUpdateScheduler {
    constructor() {
        this.isRunning = false;
        this.updateQueue = [];
        this.maxConcurrent = 3;
        this.currentJobs = 0;
        
        // Update intervals (in minutes)
        this.intervals = {
            popular: 30,      // Popular games mỗi 30 phút
            games: 60,        // Game list mỗi 1 giờ
            dlc: 45,          // DLC mỗi 45 phút
            steamData: 360,   // Steam data mỗi 6 giờ
            images: 1440,     // Images mỗi 24 giờ
            sizes: 720        // Game sizes mỗi 12 giờ
        };
        
        this.lastUpdate = {};
        this.init();
    }
    
    init() {
        console.log('🚀 Auto Update Scheduler initializing...');
        
        // Schedule các job update
        this.schedulePopularGames();
        this.scheduleGamesList();
        this.scheduleDLCUpdates();
        this.scheduleSteamData();
        this.scheduleImageUpdates();
        this.scheduleSizeUpdates();
        
        // Cleanup job
        this.scheduleCleanup();
        
        // Health check
        this.scheduleHealthCheck();
        
        console.log('✅ Auto Update Scheduler started');
        this.isRunning = true;
    }
    
    // Popular games - mỗi 30 phút
    schedulePopularGames() {
        cron.schedule('*/30 * * * *', async () => {
            await this.executeUpdate('popular', async () => {
                console.log('🔄 Updating popular games...');
                const popularGames = await gameService.getPopularGames(true); // force refresh
                await cacheManager.set('popular_games', popularGames, 'popular');
                console.log('✅ Popular games updated');
                return popularGames;
            });
        });
    }
    
    // Games list - mỗi 1 giờ
    scheduleGamesList() {
        cron.schedule('0 * * * *', async () => {
            await this.executeUpdate('games', async () => {
                console.log('🔄 Updating games list...');
                const gamesList = await gameService.getAllGames(true); // force refresh
                await cacheManager.set('games_list', gamesList, 'games');
                console.log('✅ Games list updated');
                return gamesList;
            });
        });
    }
    
    // DLC updates - mỗi 45 phút
    scheduleDLCUpdates() {
        cron.schedule('*/45 * * * *', async () => {
            await this.executeUpdate('dlc', async () => {
                console.log('🔄 Updating DLC data...');
                const dlcData = await dlcService.updateAllDLC();
                await cacheManager.set('dlc_data', dlcData, 'dlc');
                console.log('✅ DLC data updated');
                return dlcData;
            });
        });
    }
    
    // Steam data - mỗi 6 giờ
    scheduleSteamData() {
        cron.schedule('0 */6 * * *', async () => {
            await this.executeUpdate('steamData', async () => {
                console.log('🔄 Updating Steam data...');
                const steamData = await steamService.updateSteamApps();
                await cacheManager.set('steam_apps', steamData, 'steamData');
                console.log('✅ Steam data updated');
                return steamData;
            });
        });
    }
    
    // Image updates - mỗi 24 giờ
    scheduleImageUpdates() {
        cron.schedule('0 2 * * *', async () => { // 2 AM daily
            await this.executeUpdate('images', async () => {
                console.log('🔄 Updating game images...');
                const imageData = await imageService.updateAllImages();
                await cacheManager.set('game_images', imageData, 'images');
                console.log('✅ Game images updated');
                return imageData;
            });
        });
    }
    
    // Size updates - mỗi 12 giờ
    scheduleSizeUpdates() {
        cron.schedule('0 */12 * * *', async () => {
            await this.executeUpdate('sizes', async () => {
                console.log('🔄 Updating game sizes...');
                const sizeData = await gameService.updateAllSizes();
                await cacheManager.set('game_sizes', sizeData, 'sizes');
                console.log('✅ Game sizes updated');
                return sizeData;
            });
        });
    }
    
    // Cleanup cache - mỗi ngày lúc 3 AM
    scheduleCleanup() {
        cron.schedule('0 3 * * *', async () => {
            console.log('🧹 Running cache cleanup...');
            await this.cleanupExpiredCache();
            console.log('✅ Cache cleanup completed');
        });
    }
    
    // Health check - mỗi 15 phút
    scheduleHealthCheck() {
        cron.schedule('*/15 * * * *', async () => {
            await this.healthCheck();
        });
    }
    
    // Execute update với queue management
    async executeUpdate(type, updateFunction) {
        if (this.currentJobs >= this.maxConcurrent) {
            console.log(`⏳ Update ${type} queued (max concurrent reached)`);
            this.updateQueue.push({ type, updateFunction });
            return;
        }
        
        this.currentJobs++;
        const startTime = Date.now();
        
        try {
            const result = await updateFunction();
            this.lastUpdate[type] = Date.now();
            
            const duration = Date.now() - startTime;
            console.log(`✅ ${type} update completed in ${duration}ms`);
            
            // Process queue
            this.processQueue();
            
            return result;
        } catch (error) {
            console.error(`❌ ${type} update failed:`, error);
        } finally {
            this.currentJobs--;
        }
    }
    
    // Process update queue
    async processQueue() {
        if (this.updateQueue.length > 0 && this.currentJobs < this.maxConcurrent) {
            const { type, updateFunction } = this.updateQueue.shift();
            await this.executeUpdate(type, updateFunction);
        }
    }
    
    // Manual trigger update
    async triggerUpdate(type) {
        console.log(`🔄 Manual trigger: ${type}`);
        
        switch (type) {
            case 'popular':
                return await this.executeUpdate('popular', async () => {
                    const data = await gameService.getPopularGames(true);
                    await cacheManager.set('popular_games', data, 'popular');
                    return data;
                });
                
            case 'games':
                return await this.executeUpdate('games', async () => {
                    const data = await gameService.getAllGames(true);
                    await cacheManager.set('games_list', data, 'games');
                    return data;
                });
                
            case 'dlc':
                return await this.executeUpdate('dlc', async () => {
                    const data = await dlcService.updateAllDLC();
                    await cacheManager.set('dlc_data', data, 'dlc');
                    return data;
                });
                
            case 'steam':
                return await this.executeUpdate('steamData', async () => {
                    const data = await steamService.updateSteamApps();
                    await cacheManager.set('steam_apps', data, 'steamData');
                    return data;
                });
                
            case 'images':
                return await this.executeUpdate('images', async () => {
                    const data = await imageService.updateAllImages();
                    await cacheManager.set('game_images', data, 'images');
                    return data;
                });
                
            case 'sizes':
                return await this.executeUpdate('sizes', async () => {
                    const data = await gameService.updateAllSizes();
                    await cacheManager.set('game_sizes', data, 'sizes');
                    return data;
                });
                
            case 'all':
                console.log('🔄 Triggering all updates...');
                await Promise.all([
                    this.triggerUpdate('popular'),
                    this.triggerUpdate('games'),
                    this.triggerUpdate('dlc'),
                    this.triggerUpdate('steam'),
                    this.triggerUpdate('images'),
                    this.triggerUpdate('sizes')
                ]);
                break;
                
            default:
                throw new Error(`Unknown update type: ${type}`);
        }
    }
    
    // Cleanup expired cache
    async cleanupExpiredCache() {
        const stats = cacheManager.getStats();
        console.log('📊 Cache stats before cleanup:', stats);
        
        // Clear expired entries
        // Memory cache tự động clear, chỉ cần clear disk cache cũ
        const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 ngày
        
        for (const [key, data] of Object.entries(cacheManager.diskCache)) {
            if (data.timestamp < cutoffTime) {
                await cacheManager.deleteDiskCache(key);
                console.log(`🗑️ Cleaned expired cache: ${key}`);
            }
        }
        
        const newStats = cacheManager.getStats();
        console.log('📊 Cache stats after cleanup:', newStats);
    }
    
    // Health check
    async healthCheck() {
        const stats = cacheManager.getStats();
        const queueLength = this.updateQueue.length;
        const activeJobs = this.currentJobs;
        
        // Log nếu có vấn đề
        if (queueLength > 10) {
            console.warn(`⚠️ High queue length: ${queueLength}`);
        }
        
        if (activeJobs >= this.maxConcurrent) {
            console.warn(`⚠️ Max concurrent jobs reached: ${activeJobs}`);
        }
        
        // Log stats mỗi giờ
        const now = new Date();
        if (now.getMinutes() === 0) {
            console.log('📊 Scheduler Health:', {
                queue: queueLength,
                activeJobs,
                cacheStats: stats,
                lastUpdates: this.lastUpdate
            });
        }
    }
    
    // Get scheduler status
    getStatus() {
        return {
            isRunning: this.isRunning,
            queueLength: this.updateQueue.length,
            activeJobs: this.currentJobs,
            lastUpdates: this.lastUpdate,
            cacheStats: cacheManager.getStats()
        };
    }
    
    // Stop scheduler
    stop() {
        this.isRunning = false;
        console.log('🛑 Auto Update Scheduler stopped');
    }
}

module.exports = new AutoUpdateScheduler();