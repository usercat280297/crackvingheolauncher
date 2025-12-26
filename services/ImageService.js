const cacheManager = require('./cacheManager');
const SteamGridDBService = require('./SteamGridDBService');
const Game = require('../models/Game');

class ImageService {
    constructor() {
        this.isUpdating = false;
    }
    
    async getGameImages(appId, forceRefresh = false) {
        const cacheKey = `images_${appId}`;
        
        if (!forceRefresh) {
            const cached = await cacheManager.get(cacheKey, 'images');
            if (cached) return cached;
        }
        
        try {
            console.log(`🔄 Fetching images for game ${appId}...`);
            
            const images = await SteamGridDBService.getAllImagesBySteamId(appId);
            
            if (images) {
                await cacheManager.set(cacheKey, images, 'images');
                console.log(`✅ Images updated for game ${appId}`);
                return images;
            }
            
            const fallbackImages = {
                cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
                hero: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_hero.jpg`,
                logo: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/logo.png`,
                icon: `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${appId}/${appId}_icon.jpg`,
                screenshots: [
                    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/ss_1.jpg`,
                    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/ss_2.jpg`,
                    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/ss_3.jpg`
                ]
            };
            
            await cacheManager.set(cacheKey, fallbackImages, 'images');
            return fallbackImages;
        } catch (error) {
            console.error(`❌ Error fetching images for ${appId}:`, error);
            return null;
        }
    }
    
    async updateAllImages() {
        if (this.isUpdating) {
            console.log('⏳ Image update already in progress');
            return {};
        }
        
        this.isUpdating = true;
        
        try {
            console.log('🔄 Starting bulk image update...');
            
            const games = await Game.find({
                appId: { $exists: true },
                $or: [
                    { 'images.cover': { $exists: false } },
                    { 'images.cover': null },
                    { 'images.cover': '' }
                ]
            })
            .select('appId title')
            .limit(100)
            .lean();
            
            const imageData = {};
            let updated = 0;
            
            const batchSize = 10;
            for (let i = 0; i < games.length; i += batchSize) {
                const batch = games.slice(i, i + batchSize);
                
                await Promise.all(batch.map(async (game) => {
                    try {
                        const images = await this.getGameImages(game.appId, true);
                        if (images) {
                            imageData[game.appId] = images;
                            updated++;
                            
                            await Game.findOneAndUpdate(
                                { appId: game.appId },
                                { images }
                            );
                        }
                    } catch (error) {
                        console.error(`Failed to get images for ${game.title}:`, error.message);
                    }
                }));
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log(`📸 Image update progress: ${Math.min(i + batchSize, games.length)}/${games.length}`);
            }
            
            console.log(`✅ Image update completed: ${updated}/${games.length} games`);
            return imageData;
        } catch (error) {
            console.error('❌ Bulk image update failed:', error);
            return {};
        } finally {
            this.isUpdating = false;
        }
    }
    
    async clearCache() {
        await cacheManager.clear('images');
        SteamGridDBService.clearCache();
        console.log('🗑️ Image cache cleared');
    }
}

module.exports = new ImageService();