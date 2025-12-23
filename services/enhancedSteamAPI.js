const axios = require('axios');
const Game = require('../models/Game');

class EnhancedSteamAPI {
  constructor() {
    this.apiKey = process.env.STEAM_API_KEY;
    this.baseURL = 'https://api.steampowered.com';
    this.storeURL = 'https://store.steampowered.com/api';
    this.cache = new Map();
    this.cacheDuration = parseInt(process.env.STEAM_CACHE_DURATION) || 86400000;
  }

  async getGameDetails(appId) {
    return this.getFullGameDetails(appId);
  }

  async getFullGameDetails(appId) {
    const cacheKey = `full_${appId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheDuration) {
      return cached.data;
    }

    try {
      const [storeData, achievements, news, reviews] = await Promise.allSettled([
        this.getStoreDetails(appId),
        this.getGameAchievements(appId),
        this.getGameNews(appId, 5),
        this.getGameReviews(appId)
      ]);

      const store = storeData.status === 'fulfilled' ? storeData.value : null;
      
      if (!store) return null;

      const fullData = {
        ...store,
        achievements: achievements.status === 'fulfilled' ? achievements.value : { total: 0, list: [] },
        news: news.status === 'fulfilled' ? news.value : [],
        reviews: reviews.status === 'fulfilled' ? reviews.value : { positive: 0, negative: 0, total: 0 }
      };

      this.cache.set(cacheKey, { data: fullData, timestamp: Date.now() });
      return fullData;
    } catch (error) {
      console.error(`Error fetching full details for ${appId}:`, error.message);
      return null;
    }
  }

  async getStoreDetails(appId) {
    try {
      const response = await axios.get(`${this.storeURL}/appdetails`, {
        params: { appids: appId, l: 'english' },
        timeout: 10000
      });

      const data = response.data[appId];
      if (!data || !data.success || !data.data) return null;

      const game = data.data;
      
      return {
        id: appId,
        steamAppId: appId,
        title: game.name,
        name: game.name,
        type: game.type,
        description: game.short_description || game.detailed_description || '',
        detailedDescription: game.detailed_description || '',
        aboutGame: game.about_the_game || '',
        cover: game.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
        backgroundImage: game.background || game.background_raw || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/page_bg_generated_v6b.jpg`,
        capsuleImage: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/capsule_616x353.jpg`,
        developer: game.developers ? game.developers.join(', ') : 'Unknown',
        publisher: game.publishers ? game.publishers.join(', ') : 'Unknown',
        releaseDate: game.release_date?.date || 'Unknown',
        comingSoon: game.release_date?.coming_soon || false,
        genres: game.genres ? game.genres.map(g => g.description).join(', ') : 'Unknown',
        categories: game.categories ? game.categories.map(c => c.description) : [],
        tags: game.genres ? game.genres.map(g => g.description) : [],
        
        // Pricing
        isFree: game.is_free || false,
        price: game.price_overview ? {
          currency: game.price_overview.currency,
          initial: game.price_overview.initial,
          final: game.price_overview.final,
          discount: game.price_overview.discount_percent,
          formatted: game.price_overview.final_formatted
        } : null,
        onSale: game.price_overview ? game.price_overview.discount_percent > 0 : false,
        discount: game.price_overview?.discount_percent || 0,
        originalPrice: game.price_overview?.initial_formatted || 'Free',
        salePrice: game.price_overview?.final_formatted || 'Free',
        
        // Platforms
        platforms: game.platforms || { windows: true, mac: false, linux: false },
        oslist: this.getPlatformList(game.platforms),
        
        // Requirements
        pcRequirements: this.parseRequirements(game.pc_requirements),
        macRequirements: this.parseRequirements(game.mac_requirements),
        linuxRequirements: this.parseRequirements(game.linux_requirements),
        
        // Media
        screenshots: game.screenshots ? game.screenshots.map(s => ({
          id: s.id,
          thumbnail: s.path_thumbnail,
          full: s.path_full
        })) : [],
        movies: game.movies ? game.movies.map(m => ({
          id: m.id,
          name: m.name,
          thumbnail: m.thumbnail,
          webm: m.webm,
          mp4: m.mp4,
          highlight: m.highlight
        })) : [],
        
        // Metacritic
        metacriticScore: game.metacritic?.score || null,
        metacriticUrl: game.metacritic?.url || null,
        
        // Additional info
        website: game.website || '',
        supportUrl: game.support_info?.url || '',
        supportEmail: game.support_info?.email || '',
        
        // Languages
        languages: this.parseLanguages(game.supported_languages),
        
        // DLC
        dlc: game.dlc || [],
        dlcCount: game.dlc ? game.dlc.length : 0,
        
        // Content
        contentDescriptors: game.content_descriptors?.notes || '',
        legalNotice: game.legal_notice || '',
        
        // Recommendations
        recommendations: game.recommendations?.total || 0,
        
        // Ratings
        rating: game.metacritic?.score ? `${game.metacritic.score}%` : 'N/A',
        
        // Misc
        featured: game.recommendations?.total > 10000,
        tool: game.type === 'dlc' || game.type === 'demo',
        size: 'Unknown',
        
        // Links
        steamUrl: `https://store.steampowered.com/app/${appId}`,
        communityUrl: `https://steamcommunity.com/app/${appId}`,
        
        // Timestamps
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching store details for ${appId}:`, error.message);
      return null;
    }
  }

  async getGameAchievements(appId) {
    try {
      const response = await axios.get(`${this.baseURL}/ISteamUserStats/GetSchemaForGame/v2/`, {
        params: { key: this.apiKey, appid: appId },
        timeout: 5000
      });

      const achievements = response.data?.game?.availableGameStats?.achievements || [];
      
      return {
        total: achievements.length,
        list: achievements.map(a => ({
          name: a.name,
          displayName: a.displayName,
          description: a.description || '',
          icon: a.icon,
          iconGray: a.icongray,
          hidden: a.hidden || false
        }))
      };
    } catch (error) {
      return { total: 0, list: [] };
    }
  }

  async getGameNews(appId, count = 5) {
    try {
      const response = await axios.get(`${this.baseURL}/ISteamNews/GetNewsForApp/v2/`, {
        params: { appid: appId, count, maxlength: 300 },
        timeout: 5000
      });

      const newsItems = response.data?.appnews?.newsitems || [];
      
      return newsItems.map(item => ({
        gid: item.gid,
        title: item.title,
        url: item.url,
        author: item.author,
        contents: item.contents,
        feedlabel: item.feedlabel,
        date: new Date(item.date * 1000).toISOString(),
        feedname: item.feedname
      }));
    } catch (error) {
      return [];
    }
  }

  async getGameReviews(appId) {
    try {
      const response = await axios.get(`${this.storeURL}/appreviews/${appId}`, {
        params: { json: 1, language: 'english', num_per_page: 0 },
        timeout: 5000
      });

      const summary = response.data?.query_summary;
      
      return {
        positive: summary?.total_positive || 0,
        negative: summary?.total_negative || 0,
        total: summary?.total_reviews || 0,
        score: summary?.review_score || 0,
        scoreDesc: summary?.review_score_desc || 'No reviews'
      };
    } catch (error) {
      return { positive: 0, negative: 0, total: 0 };
    }
  }

  async batchFetchGames(appIds, progressCallback) {
    const games = [];
    const total = appIds.length;
    const delay = parseInt(process.env.STEAM_REQUEST_DELAY) || 2500;
    const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 2;

    console.log(`\n🎮 Fetching ${total} games from Steam API...`);
    console.log(`⚙️  Settings: ${delay}ms delay, ${maxConcurrent} concurrent requests\n`);

    for (let i = 0; i < appIds.length; i += maxConcurrent) {
      const batch = appIds.slice(i, i + maxConcurrent);
      const promises = batch.map(appId => this.getFullGameDetails(appId));
      
      const results = await Promise.allSettled(promises);
      
      for (let index = 0; index < results.length; index++) {
        const result = results[index];
        const appId = batch[index];
        const current = i + index + 1;
        
        if (result.status === 'fulfilled' && result.value) {
          games.push(result.value);
          console.log(`✓ [${current}/${total}] ${result.value.title}`);
          
          // Save to database
          try {
            await Game.findOneAndUpdate(
              { appId: result.value.steamAppId },
              {
                appId: result.value.steamAppId,
                title: result.value.title,
                description: result.value.description,
                detailedDescription: result.value.detailedDescription,
                shortDescription: result.value.description,
                aboutTheGame: result.value.aboutGame,
                headerImage: result.value.cover,
                capsuleImage: result.value.capsuleImage,
                backgroundImage: result.value.backgroundImage,
                developers: result.value.developer ? result.value.developer.split(', ') : [],
                publishers: result.value.publisher ? result.value.publisher.split(', ') : [],
                genres: result.value.genres ? result.value.genres.split(', ') : [],
                releaseDate: result.value.releaseDate,
                comingSoon: result.value.comingSoon,
                price: result.value.price,
                isFree: result.value.isFree,
                onSale: result.value.onSale,
                discount: result.value.discount,
                platforms: result.value.platforms,
                metacritic: result.value.metacriticScore ? {
                  score: result.value.metacriticScore,
                  url: result.value.metacriticUrl
                } : undefined,
                recommendations: result.value.recommendations,
                achievements: result.value.achievements ? {
                  total: result.value.achievements.total,
                  highlighted: result.value.achievements.list
                } : { total: 0 },
                screenshots: result.value.screenshots,
                movies: result.value.movies,
                pcRequirements: result.value.pcRequirements,
                steamUrl: result.value.steamUrl,
                steamDbUrl: `https://steamdb.info/app/${appId}`,
                hasLua: true,
                luaFile: `${appId}.lua`,
                lastUpdated: new Date()
              },
              { upsert: true, new: true }
            );
          } catch (dbError) {
            console.error(`Failed to save game ${appId} to DB:`, dbError.message);
          }
          
          if (progressCallback) progressCallback(current, total, result.value);
        } else if (result.status === 'rejected' && result.reason?.response?.status === 429) {
          console.log(`⚠️  Rate limit hit! Pausing for 60 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 60000));
          i -= maxConcurrent; // Retry this batch
          continue;
        } else {
          console.log(`✗ [${current}/${total}] Failed: ${appId}`);
        }
      }

      if (i + maxConcurrent < appIds.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log(`\n✅ Successfully fetched ${games.length}/${total} games\n`);
    return games;
  }

  parseRequirements(req) {
    if (!req || typeof req !== 'object') return {};
    
    const cleanHTML = (html) => {
      if (!html) return '';
      return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<li>/gi, '• ')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    };
    
    return {
      minimum: cleanHTML(req.minimum),
      recommended: cleanHTML(req.recommended)
    };
  }

  parseLanguages(langString) {
    if (!langString) return 'English';
    
    const cleaned = langString.replace(/<[^>]*>/g, '');
    const langs = cleaned.split(',').map(l => l.trim()).filter(l => l);
    
    return langs.slice(0, 10).join(', ');
  }

  getPlatformList(platforms) {
    if (!platforms) return 'windows';
    
    const list = [];
    if (platforms.windows) list.push('windows');
    if (platforms.mac) list.push('mac');
    if (platforms.linux) list.push('linux');
    
    return list.join(',') || 'windows';
  }

  getCacheStats() {
    return {
      cachedGames: this.cache.size,
      cacheDuration: `${this.cacheDuration / 1000 / 60 / 60} hours`
    };
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new EnhancedSteamAPI();
