const axios = require('axios');

class EpicGamesService {
  constructor() {
    this.baseURL = 'https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions';
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  async getFreeGames() {
    try {
      const cacheKey = 'epic_free_games';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await axios.get(this.baseURL, {
        params: {
          locale: 'en-US',
          country: 'US',
          allowCountries: 'US'
        },
        timeout: 10000
      });

      const games = response.data?.data?.Catalog?.searchStore?.elements || [];
      const freeGames = games.filter(game => 
        game.promotions?.promotionalOffers?.length > 0 ||
        game.promotions?.upcomingPromotionalOffers?.length > 0
      );

      const processedGames = freeGames.map(game => ({
        id: game.id,
        title: game.title,
        description: game.description,
        keyImages: game.keyImages,
        seller: game.seller,
        productSlug: game.productSlug,
        urlSlug: game.urlSlug,
        url: `https://store.epicgames.com/en-US/p/${game.productSlug || game.urlSlug}`,
        tags: game.tags,
        categories: game.categories,
        price: {
          totalPrice: game.price?.totalPrice,
          discount: game.price?.discount,
          originalPrice: game.price?.originalPrice,
          voucherDiscount: game.price?.voucherDiscount,
          discountPrice: game.price?.discountPrice,
          currencyCode: game.price?.currencyCode,
          currencyInfo: game.price?.currencyInfo,
          fmtPrice: game.price?.fmtPrice
        },
        promotions: {
          promotionalOffers: game.promotions?.promotionalOffers || [],
          upcomingPromotionalOffers: game.promotions?.upcomingPromotionalOffers || []
        }
      }));

      this.cache.set(cacheKey, {
        data: processedGames,
        timestamp: Date.now()
      });

      return processedGames;
    } catch (error) {
      console.error('❌ Error fetching Epic Games free games:', error.message);
      return [];
    }
  }

  async getSaleGames() {
    try {
      const cacheKey = 'epic_sale_games';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Epic Games doesn't have a public API for sales, so we'll simulate it
      // In a real implementation, you'd need to scrape or use unofficial APIs
      const saleGames = [
        {
          id: 'epic_sale_1',
          title: 'Cyberpunk 2077',
          originalPrice: 59.99,
          salePrice: 29.99,
          discount: 50,
          image: 'https://cdn1.epicgames.com/offer/77f2b98e2cef40c8a7437518bf420e47/EGS_Cyberpunk2077_CDPROJEKTRED_S1_2560x1440-359e77d3cd0a40aebf3bbc130d14c5c7',
          url: 'https://store.epicgames.com/en-US/p/cyberpunk-2077'
        },
        {
          id: 'epic_sale_2',
          title: 'Grand Theft Auto V',
          originalPrice: 29.99,
          salePrice: 14.99,
          discount: 50,
          image: 'https://cdn1.epicgames.com/0584d2013f0149a791e7b9bad0eec102/offer/GTAV_EGS_Artwork_1200x1600_Portrait%20Store%20Banner-1200x1600-382243057711adf80322ed2aeea42191.jpg',
          url: 'https://store.epicgames.com/en-US/p/grand-theft-auto-v'
        }
      ];

      this.cache.set(cacheKey, {
        data: saleGames,
        timestamp: Date.now()
      });

      return saleGames;
    } catch (error) {
      console.error('❌ Error fetching Epic Games sales:', error.message);
      return [];
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new EpicGamesService();