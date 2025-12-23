const axios = require('axios');

class SteamService {
  constructor() {
    this.baseURL = 'https://store.steampowered.com/api';
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  async getFeaturedGames() {
    try {
      const cacheKey = 'steam_featured';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await axios.get(`${this.baseURL}/featured`, {
        timeout: 10000
      });

      const featured = response.data;
      const processedGames = [];

      // Process featured games
      if (featured.featured_win) {
        featured.featured_win.forEach(game => {
          processedGames.push({
            id: game.id,
            name: game.name,
            discounted: game.discounted,
            discount_percent: game.discount_percent,
            original_price: game.original_price,
            final_price: game.final_price,
            currency: game.currency,
            large_capsule_image: game.large_capsule_image,
            small_capsule_image: game.small_capsule_image,
            windows_available: game.windows_available,
            mac_available: game.mac_available,
            linux_available: game.linux_available,
            streamingvideo_available: game.streamingvideo_available,
            discount_expiration: game.discount_expiration,
            header_image: game.header_image,
            controller_support: game.controller_support,
            url: `https://store.steampowered.com/app/${game.id}/`
          });
        });
      }

      // Process daily deals
      if (featured.daily_deal) {
        processedGames.push({
          id: featured.daily_deal.id,
          name: featured.daily_deal.name,
          discounted: featured.daily_deal.discounted,
          discount_percent: featured.daily_deal.discount_percent,
          original_price: featured.daily_deal.original_price,
          final_price: featured.daily_deal.final_price,
          currency: featured.daily_deal.currency,
          large_capsule_image: featured.daily_deal.large_capsule_image,
          small_capsule_image: featured.daily_deal.small_capsule_image,
          header_image: featured.daily_deal.header_image,
          url: `https://store.steampowered.com/app/${featured.daily_deal.id}/`,
          isDailyDeal: true
        });
      }

      this.cache.set(cacheKey, {
        data: processedGames,
        timestamp: Date.now()
      });

      return processedGames;
    } catch (error) {
      console.error('❌ Error fetching Steam featured games:', error.message);
      return [];
    }
  }

  async getSpecialOffers() {
    try {
      const cacheKey = 'steam_specials';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await axios.get(`${this.baseURL}/featuredcategories`, {
        timeout: 10000
      });

      const categories = response.data;
      const specials = [];

      // Process specials
      if (categories.specials && categories.specials.items) {
        categories.specials.items.forEach(game => {
          specials.push({
            id: game.id,
            name: game.name,
            discounted: game.discounted,
            discount_percent: game.discount_percent,
            original_price: game.original_price,
            final_price: game.final_price,
            currency: game.currency,
            large_capsule_image: game.large_capsule_image,
            small_capsule_image: game.small_capsule_image,
            header_image: game.header_image,
            url: `https://store.steampowered.com/app/${game.id}/`,
            tags: game.tags || []
          });
        });
      }

      this.cache.set(cacheKey, {
        data: specials,
        timestamp: Date.now()
      });

      return specials;
    } catch (error) {
      console.error('❌ Error fetching Steam special offers:', error.message);
      return [];
    }
  }

  async getGameDetails(appId) {
    try {
      const cacheKey = `steam_game_${appId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await axios.get(`${this.baseURL}/appdetails`, {
        params: {
          appids: appId,
          filters: 'basic,price_overview'
        },
        timeout: 10000
      });

      const gameData = response.data[appId];
      if (!gameData || !gameData.success) {
        return null;
      }

      const game = gameData.data;
      const processedGame = {
        steam_appid: game.steam_appid,
        name: game.name,
        type: game.type,
        is_free: game.is_free,
        detailed_description: game.detailed_description,
        about_the_game: game.about_the_game,
        short_description: game.short_description,
        header_image: game.header_image,
        website: game.website,
        developers: game.developers,
        publishers: game.publishers,
        platforms: game.platforms,
        categories: game.categories,
        genres: game.genres,
        screenshots: game.screenshots,
        movies: game.movies,
        price_overview: game.price_overview,
        url: `https://store.steampowered.com/app/${game.steam_appid}/`
      };

      this.cache.set(cacheKey, {
        data: processedGame,
        timestamp: Date.now()
      });

      return processedGame;
    } catch (error) {
      console.error(`❌ Error fetching Steam game details for ${appId}:`, error.message);
      return null;
    }
  }

  formatPrice(price, currency = 'USD') {
    if (!price) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price / 100);
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new SteamService();