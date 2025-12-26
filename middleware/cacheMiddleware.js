const cacheManager = require('../services/cacheManager');
const realTimeService = require('../services/realTimeUpdateService');

// Cache middleware cho API responses
const cacheMiddleware = (type = 'default', customTTL = null) => {
    return async (req, res, next) => {
        // Tạo cache key từ URL và query params
        const cacheKey = `${type}_${req.originalUrl}_${JSON.stringify(req.query)}`;
        
        try {
            // Kiểm tra cache trước
            const cachedData = await cacheManager.get(cacheKey, type);
            
            if (cachedData && !req.query.refresh) {
                // Thêm cache headers
                res.set({
                    'X-Cache': 'HIT',
                    'X-Cache-Key': cacheKey,
                    'X-Cache-Type': type
                });
                
                return res.json({
                    success: true,
                    data: cachedData,
                    cached: true,
                    timestamp: Date.now()
                });
            }
            
            // Override res.json để cache response
            const originalJson = res.json;
            res.json = function(data) {
                // Cache successful responses
                if (data && data.success !== false) {
                    const dataToCache = data.data || data;
                    cacheManager.set(cacheKey, dataToCache, type);
                    
                    // Notify real-time service
                    realTimeService.notifyUpdate(type, dataToCache);
                }
                
                // Thêm cache headers
                res.set({
                    'X-Cache': 'MISS',
                    'X-Cache-Key': cacheKey,
                    'X-Cache-Type': type
                });
                
                return originalJson.call(this, data);
            };
            
            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

// Cache invalidation middleware
const invalidateCache = (types = []) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        
        res.json = async function(data) {
            // Invalidate cache sau khi response thành công
            if (data && data.success !== false) {
                for (const type of types) {
                    await cacheManager.clear(type);
                    console.log(`🗑️ Invalidated cache type: ${type}`);
                }
            }
            
            return originalJson.call(this, data);
        };
        
        next();
    };
};

// Smart cache middleware - tự động detect cache type
const smartCache = () => {
    return (req, res, next) => {
        const path = req.path.toLowerCase();
        let cacheType = 'default';
        
        // Auto-detect cache type based on path
        if (path.includes('/games')) {
            if (path.includes('/popular')) {
                cacheType = 'popular';
            } else if (path.includes('/search')) {
                cacheType = 'search';
            } else if (path.includes('/detail')) {
                cacheType = 'gameDetails';
            } else {
                cacheType = 'games';
            }
        } else if (path.includes('/dlc')) {
            cacheType = 'dlc';
        } else if (path.includes('/steam')) {
            cacheType = 'steamData';
        } else if (path.includes('/image')) {
            cacheType = 'images';
        } else if (path.includes('/size')) {
            cacheType = 'sizes';
        }
        
        // Apply cache middleware
        return cacheMiddleware(cacheType)(req, res, next);
    };
};

// Cache warming middleware - preload data
const warmCache = async () => {
    console.log('🔥 Warming up cache...');
    
    try {
        // Preload critical data
        await cacheManager.preloadCriticalData();
        
        console.log('✅ Cache warmed up successfully');
    } catch (error) {
        console.error('❌ Cache warming failed:', error);
    }
};

// Cache stats middleware
const cacheStats = () => {
    return (req, res, next) => {
        if (req.path === '/api/cache/stats') {
            const stats = cacheManager.getStats();
            const realtimeStats = realTimeService.getStats();
            
            return res.json({
                success: true,
                data: {
                    cache: stats,
                    realtime: realtimeStats,
                    timestamp: Date.now()
                }
            });
        }
        
        next();
    };
};

// Cache control middleware
const cacheControl = () => {
    return async (req, res, next) => {
        if (req.path.startsWith('/api/cache/')) {
            const action = req.path.split('/').pop();
            
            switch (action) {
                case 'clear':
                    const type = req.query.type;
                    await cacheManager.clear(type);
                    return res.json({
                        success: true,
                        message: `Cache cleared${type ? ` for type: ${type}` : ' (all)'}`
                    });
                    
                case 'refresh':
                    const refreshType = req.query.type || 'all';
                    const autoUpdateScheduler = require('../services/autoUpdateScheduler');
                    await autoUpdateScheduler.triggerUpdate(refreshType);
                    return res.json({
                        success: true,
                        message: `Refresh triggered for: ${refreshType}`
                    });
                    
                case 'status':
                    const autoScheduler = require('../services/autoUpdateScheduler');
                    return res.json({
                        success: true,
                        data: autoScheduler.getStatus()
                    });
            }
        }
        
        next();
    };
};

// Response compression với cache
const compressedCache = (type = 'default') => {
    return async (req, res, next) => {
        const acceptsGzip = req.headers['accept-encoding'] && 
                           req.headers['accept-encoding'].includes('gzip');
        
        if (acceptsGzip) {
            const cacheKey = `compressed_${type}_${req.originalUrl}_${JSON.stringify(req.query)}`;
            
            const cachedData = await cacheManager.get(cacheKey, type);
            if (cachedData) {
                res.set({
                    'Content-Encoding': 'gzip',
                    'X-Cache': 'HIT-COMPRESSED'
                });
                return res.send(cachedData);
            }
        }
        
        return cacheMiddleware(type)(req, res, next);
    };
};

module.exports = {
    cacheMiddleware,
    invalidateCache,
    smartCache,
    warmCache,
    cacheStats,
    cacheControl,
    compressedCache
};