const NodeCache = require('node-cache');
const fs = require('fs').promises;
const path = require('path');

class CacheManager {
    constructor() {
        // Cache trong memory với TTL
        this.memoryCache = new NodeCache({ 
            stdTTL: 300, // 5 phút default
            checkperiod: 60, // Check expired keys mỗi 60s
            useClones: false // Tăng performance
        });
        
        // Cache file paths
        this.cacheDir = path.join(__dirname, '../cache');
        this.diskCacheFile = path.join(this.cacheDir, 'disk-cache.json');
        
        // Cache configurations cho từng loại data
        this.cacheConfigs = {
            games: { ttl: 3600, persistent: true }, // 1 giờ
            dlc: { ttl: 1800, persistent: true }, // 30 phút  
            steamData: { ttl: 86400, persistent: true }, // 1 ngày
            images: { ttl: 604800, persistent: true }, // 1 tuần
            search: { ttl: 300, persistent: false }, // 5 phút
            popular: { ttl: 7200, persistent: true }, // 2 giờ
            gameDetails: { ttl: 3600, persistent: true }, // 1 giờ
            sizes: { ttl: 86400, persistent: true } // 1 ngày
        };
        
        this.init();
    }
    
    async init() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
            await this.loadDiskCache();
            console.log('✅ Cache Manager initialized');
        } catch (error) {
            console.error('❌ Cache Manager init error:', error);
        }
    }
    
    // Get cache với fallback
    async get(key, type = 'default') {
        try {
            // Kiểm tra memory cache trước
            const memoryData = this.memoryCache.get(key);
            if (memoryData) {
                return memoryData;
            }
            
            // Kiểm tra disk cache nếu persistent
            const config = this.cacheConfigs[type] || { ttl: 300, persistent: false };
            if (config.persistent) {
                const diskData = await this.getDiskCache(key);
                if (diskData && !this.isExpired(diskData, config.ttl)) {
                    // Load lại vào memory
                    this.memoryCache.set(key, diskData.data, config.ttl);
                    return diskData.data;
                }
            }
            
            return null;
        } catch (error) {
            console.error(`Cache get error for ${key}:`, error);
            return null;
        }
    }
    
    // Set cache
    async set(key, data, type = 'default') {
        try {
            const config = this.cacheConfigs[type] || { ttl: 300, persistent: false };
            
            // Set memory cache
            this.memoryCache.set(key, data, config.ttl);
            
            // Set disk cache nếu persistent
            if (config.persistent) {
                await this.setDiskCache(key, data);
            }
            
            return true;
        } catch (error) {
            console.error(`Cache set error for ${key}:`, error);
            return false;
        }
    }
    
    // Delete cache
    async delete(key) {
        this.memoryCache.del(key);
        await this.deleteDiskCache(key);
    }
    
    // Clear all cache
    async clear(type = null) {
        if (type) {
            // Clear specific type
            const keys = this.memoryCache.keys();
            keys.forEach(key => {
                if (key.startsWith(type)) {
                    this.memoryCache.del(key);
                }
            });
        } else {
            // Clear all
            this.memoryCache.flushAll();
            await fs.unlink(this.diskCacheFile).catch(() => {});
        }
    }
    
    // Disk cache operations
    async loadDiskCache() {
        try {
            const data = await fs.readFile(this.diskCacheFile, 'utf8');
            this.diskCache = JSON.parse(data);
        } catch (error) {
            this.diskCache = {};
        }
    }
    
    async saveDiskCache() {
        try {
            await fs.writeFile(this.diskCacheFile, JSON.stringify(this.diskCache, null, 2));
        } catch (error) {
            console.error('Save disk cache error:', error);
        }
    }
    
    async getDiskCache(key) {
        return this.diskCache[key] || null;
    }
    
    async setDiskCache(key, data) {
        this.diskCache[key] = {
            data,
            timestamp: Date.now()
        };
        await this.saveDiskCache();
    }
    
    async deleteDiskCache(key) {
        delete this.diskCache[key];
        await this.saveDiskCache();
    }
    
    // Utility methods
    isExpired(cacheData, ttl) {
        return Date.now() - cacheData.timestamp > (ttl * 1000);
    }
    
    // Get cache stats
    getStats() {
        return {
            memory: {
                keys: this.memoryCache.keys().length,
                hits: this.memoryCache.getStats().hits,
                misses: this.memoryCache.getStats().misses
            },
            disk: {
                keys: Object.keys(this.diskCache).length,
                size: JSON.stringify(this.diskCache).length
            }
        };
    }
    
    // Preload critical data
    async preloadCriticalData() {
        const criticalKeys = [
            'popular_games',
            'game_index',
            'steam_apps'
        ];
        
        console.log('🔄 Preloading critical cache data...');
        for (const key of criticalKeys) {
            const data = await this.get(key);
            if (data) {
                console.log(`✅ Preloaded: ${key}`);
            }
        }
    }
}

module.exports = new CacheManager();