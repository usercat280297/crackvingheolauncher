const Game = require('../models/Game');
const cacheManager = require('./cacheManager');
const SteamGridDBService = require('./SteamGridDBService');
const SteamSizeService = require('./SteamAPISizeService');

class GameService {
    constructor() {
        this.isUpdating = false;
    }
    
    async getPopularGames(forceRefresh = false) {
        const cacheKey = 'popular_games';
        
        if (!forceRefresh) {
            const cached = await cacheManager.get(cacheKey, 'popular');
            if (cached) return cached;
        }
        
        try {
            console.log('🔄 Fetching popular games from database...');
            
            const popularGames = await Game.find({
                $or: [
                    { onSale: true },
                    { 'metacritic.score': { $gte: 80 } },
                    { rating: { $gte: '80' } }
                ]
            })
            .sort({ 'metacritic.score': -1, rating: -1 })
            .limit(50)
            .lean();
            
            const transformedGames = popularGames.map(game => this.transformGame(game));
            await cacheManager.set(cacheKey, transformedGames, 'popular');
            
            console.log(`✅ Popular games updated: ${transformedGames.length} games`);
            return transformedGames;
        } catch (error) {
            console.error('❌ Error fetching popular games:', error);
            return [];
        }
    }
    
    async getAllGames(forceRefresh = false, page = 1, limit = 50, search = '', category = 'All') {
        const cacheKey = `games_list_${page}_${limit}_${search}_${category}`;
        
        if (!forceRefresh) {
            const cached = await cacheManager.get(cacheKey, 'games');
            if (cached) return cached;
        }
        
        try {
            console.log(`🔄 Fetching games page ${page}...`);
            
            const query = {};
            if (search) query.$text = { $search: search };
            if (category !== 'All') query.genres = category;
            
            const totalGames = await Game.countDocuments(query);
            const games = await Game.find(query)
                .sort(search ? { score: { $meta: "textScore" } } : { title: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();
            
            const transformedGames = games.map(game => this.transformGame(game));
            
            const result = {
                games: transformedGames,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalGames / limit),
                    totalGames: totalGames,
                    hasNext: page * limit < totalGames,
                    hasPrev: page > 1
                }
            };
            
            await cacheManager.set(cacheKey, result, 'games');
            console.log(`✅ Games page ${page} updated: ${transformedGames.length} games`);
            return result;
        } catch (error) {
            console.error('❌ Error fetching games:', error);
            return { games: [], pagination: {} };
        }
    }
    
    async updateAllSizes() {
        if (this.isUpdating) {
            console.log('⏳ Size update already in progress');
            return {};
        }
        
        this.isUpdating = true;
        
        try {
            console.log('🔄 Starting bulk size update...');
            
            const games = await Game.find({ appId: { $exists: true } })
                .select('appId title')
                .limit(100)
                .lean();
            
            const sizeData = {};
            let updated = 0;
            
            for (const game of games) {
                try {
                    const size = await SteamSizeService.getGameSize(game.appId);
                    if (size) {
                        sizeData[game.appId] = size;
                        updated++;
                        
                        await Game.findOneAndUpdate(
                            { appId: game.appId },
                            { size: size.formatted || '50 GB' }
                        );
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    console.error(`Failed to get size for ${game.title}:`, error.message);
                }
            }
            
            console.log(`✅ Size update completed: ${updated}/${games.length} games`);
            return sizeData;
        } catch (error) {
            console.error('❌ Bulk size update failed:', error);
            return {};
        } finally {
            this.isUpdating = false;
        }
    }
    
    transformGame(game) {
        return {
            ...game,
            id: game.appId || game._id,
            cover: game.images?.cover || 
                   game.headerImage ||
                   game.images?.steamHeader || 
                   `http://localhost:3000/api/steam/image/${game.appId}/header`,
            hero: game.images?.hero || 
                  game.images?.steamLibrary,
            logo: game.images?.logo,
            backgroundImage: game.images?.hero || 
                           game.images?.steamBackground ||
                           `http://localhost:3000/api/steam/image/${game.appId}/library`,
            screenshots: game.images?.screenshots || game.screenshots?.map((s, i) => 
                s.path_full || `http://localhost:3000/api/steam/screenshot/${game.appId}/${i}`
            ) || [
                `http://localhost:3000/api/steam/image/${game.appId}/header`,
                `http://localhost:3000/api/steam/image/${game.appId}/capsule`,
                `http://localhost:3000/api/steam/image/${game.appId}/library`
            ],
            title: game.title || 'Unknown Game',
            developer: game.developers?.[0] || 'Unknown',
            publisher: game.publishers?.[0] || 'Unknown',
            rating: game.metacritic?.score ? `${game.metacritic.score}%` : 'N/A',
            size: game.size || '50 GB',
            genres: Array.isArray(game.genres) ? game.genres.join(', ') : (game.genres || '')
        };
    }
    
    async clearCache() {
        await cacheManager.clear('games');
        await cacheManager.clear('popular');
        await cacheManager.clear('gameDetails');
        console.log('🗑️ Game caches cleared');
    }
}

module.exports = new GameService();