class SalesUpdateService {
  constructor() {
    this.updateInterval = null;
    this.isUpdating = false;
    this.lastUpdate = {
      epic: null,
      steam: null
    };
    this.cache = {
      epic: [],
      steam: []
    };
  }

  // Start auto-update service
  startAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Update immediately
    this.updateAllSales();

    // Then update every 30 minutes
    this.updateInterval = setInterval(() => {
      this.updateAllSales();
    }, 30 * 60 * 1000);

    console.log('🔄 Sales auto-update service started (30min intervals)');
  }

  // Stop auto-update service
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('⏹️ Sales auto-update service stopped');
  }

  // Update all sales data
  async updateAllSales() {
    if (this.isUpdating) {
      console.log('⏳ Sales update already in progress, skipping...');
      return;
    }

    this.isUpdating = true;
    console.log('🔄 Updating sales data...');

    try {
      await Promise.all([
        this.updateEpicSales(),
        this.updateSteamSales()
      ]);
      console.log('✅ Sales data updated successfully');
    } catch (error) {
      console.error('❌ Error updating sales data:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  // Update Epic Games sales
  async updateEpicSales() {
    try {
      const axios = require('axios');
      const response = await axios.get('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US', {
        timeout: 10000
      });
      
      const freeGames = response.data.data.Catalog.searchStore.elements
        .filter(game => game.promotions && game.promotions.promotionalOffers.length > 0)
        .map(game => ({
          id: game.id,
          title: game.title,
          description: game.description,
          image: game.keyImages?.find(img => img.type === 'OfferImageWide')?.url || 
                 game.keyImages?.find(img => img.type === 'DieselStoreFrontWide')?.url ||
                 game.keyImages?.[0]?.url,
          originalPrice: game.price?.totalPrice?.fmtPrice?.originalPrice || '$0',
          discountPrice: 'FREE',
          discount: 'FREE',
          url: `https://store.epicgames.com/en-US/p/${game.catalogNs?.mappings?.[0]?.pageSlug || game.productSlug}`,
          endDate: game.promotions.promotionalOffers[0]?.promotionalOffers[0]?.endDate
        }));

      this.cache.epic = freeGames;
      this.lastUpdate.epic = new Date();
      console.log(`📦 Epic Games: Updated ${freeGames.length} free games`);
      
      return freeGames;
    } catch (error) {
      console.error('❌ Epic Games API error:', error.message);
      return this.cache.epic; // Return cached data on error
    }
  }

  // Update Steam sales
  async updateSteamSales() {
    try {
      const axios = require('axios');
      const response = await axios.get('https://store.steampowered.com/api/featuredcategories/?cc=US&l=english', {
        timeout: 10000
      });
      
      const specials = response.data.specials?.items?.slice(0, 10).map(game => ({
        id: game.id,
        title: game.name,
        image: game.header_image,
        originalPrice: game.original_price ? `$${(game.original_price / 100).toFixed(2)}` : null,
        discountPrice: game.final_price ? `$${(game.final_price / 100).toFixed(2)}` : null,
        discount: game.discount_percent ? `${game.discount_percent}%` : null,
        url: `https://store.steampowered.com/app/${game.id}/`,
        tags: game.tags || []
      })) || [];

      this.cache.steam = specials;
      this.lastUpdate.steam = new Date();
      console.log(`🎮 Steam: Updated ${specials.length} featured games`);
      
      return specials;
    } catch (error) {
      console.error('❌ Steam API error:', error.message);
      return this.cache.steam; // Return cached data on error
    }
  }

  // Get cached Epic sales
  getEpicSales() {
    return {
      data: this.cache.epic,
      lastUpdate: this.lastUpdate.epic,
      success: this.cache.epic.length > 0
    };
  }

  // Get cached Steam sales
  getSteamSales() {
    return {
      data: this.cache.steam,
      lastUpdate: this.lastUpdate.steam,
      success: this.cache.steam.length > 0
    };
  }

  // Get update status
  getStatus() {
    return {
      isUpdating: this.isUpdating,
      lastUpdate: {
        epic: this.lastUpdate.epic,
        steam: this.lastUpdate.steam
      },
      cacheSize: {
        epic: this.cache.epic.length,
        steam: this.cache.steam.length
      },
      autoUpdateActive: !!this.updateInterval
    };
  }
}

// Create singleton instance
const salesUpdateService = new SalesUpdateService();

module.exports = salesUpdateService;