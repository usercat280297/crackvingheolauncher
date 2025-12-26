const axios = require('axios');

class SteamDLCService {
  constructor() {
    this.apiKey = process.env.STEAM_API_KEY;
    this.cache = new Map();
    this.cacheTimeout = 86400000; // 24 hours (tăng từ 1h)
    this.requestDelay = 1000; // 1s delay between requests
  }

  /**
   * Delay helper for rate limiting
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry helper with exponential backoff
   */
  async retryRequest(fn, retries = 3, delayMs = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.delay(delayMs * Math.pow(2, i));
      }
    }
  }
  /**
   * Get DLC list for a game from Steam Store API
   */
  async getGameDLCs(appId) {
    const cacheKey = `dlc_${appId}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`✅ DLC cache hit for ${appId}`);
        return cached.data;
      }
    }

    try {
      console.log(`🔍 Fetching DLCs for game ${appId}...`);
      
      // Fetch game details with retry
      const response = await this.retryRequest(() => 
        axios.get(`https://store.steampowered.com/api/appdetails`, {
          params: { appids: appId, cc: 'us', l: 'english' },
          timeout: 15000 // Tăng timeout
        })
      );

      const gameData = response.data?.[appId]?.data;
      if (!gameData || !gameData.dlc || gameData.dlc.length === 0) {
        console.log(`ℹ️ No DLCs found for ${appId}`);
        // Cache empty result to avoid repeated requests
        this.cache.set(cacheKey, { data: [], timestamp: Date.now() });
        return [];
      }

      const dlcIds = gameData.dlc || [];
      console.log(`📦 Found ${dlcIds.length} DLCs for ${appId}`);
      
      // Fetch details for each DLC with delay
      const dlcDetails = [];
      for (const dlcId of dlcIds.slice(0, 30)) { // Tăng limit lên 30
        try {
          const dlc = await this.getDLCDetails(dlcId);
          if (dlc) dlcDetails.push(dlc);
          await this.delay(this.requestDelay); // Rate limiting
        } catch (error) {
          console.error(`⚠️ Failed to fetch DLC ${dlcId}:`, error.message);
        }
      }

      console.log(`✅ Successfully fetched ${dlcDetails.length} DLC details`);

      // Cache result
      this.cache.set(cacheKey, {
        data: dlcDetails,
        timestamp: Date.now()
      });

      return dlcDetails;
    } catch (error) {
      console.error(`❌ Failed to fetch DLCs for ${appId}:`, error.message);
      // Return cached data if available, even if expired
      if (this.cache.has(cacheKey)) {
        console.log(`⚠️ Returning expired cache for ${appId}`);
        return this.cache.get(cacheKey).data;
      }
      return [];
    }
  }

  /**
   * Get details for a specific DLC
   */
  async getDLCDetails(dlcId) {
    try {
      const response = await this.retryRequest(() =>
        axios.get(`https://store.steampowered.com/api/appdetails`, {
          params: { appids: dlcId, cc: 'us', l: 'english' },
          timeout: 12000
        })
      );

      const dlcData = response.data?.[dlcId]?.data;
      if (!dlcData) return null;

      return {
        appId: dlcId,
        name: dlcData.name,
        description: dlcData.short_description || dlcData.about_the_game || 'No description available',
        headerImage: dlcData.header_image,
        capsuleImage: `https://cdn.cloudflare.steamstatic.com/steam/apps/${dlcId}/capsule_231x87.jpg`,
        releaseDate: dlcData.release_date?.date || 'TBA',
        price: this.formatPrice(dlcData.price_overview),
        isFree: dlcData.is_free || false,
        size: this.estimateDLCSize(dlcId),
        installed: false,
        steamUrl: `https://store.steampowered.com/app/${dlcId}/`
      };
    } catch (error) {
      console.error(`⚠️ Failed to fetch DLC ${dlcId}:`, error.message);
      return null;
    }
  }

  /**
   * Format price information
   */
  formatPrice(priceOverview) {
    if (!priceOverview) {
      return 'Free';
    }

    const price = priceOverview.final / 100;
    const currency = priceOverview.currency === 'USD' ? '$' : priceOverview.currency;
    
    if (priceOverview.discount_percent > 0) {
      const originalPrice = priceOverview.initial / 100;
      return {
        current: `${currency}${price.toFixed(2)}`,
        original: `${currency}${originalPrice.toFixed(2)}`,
        discount: priceOverview.discount_percent
      };
    }

    return `${currency}${price.toFixed(2)}`;
  }

  /**
   * Estimate DLC size based on appId (for consistency)
   */
  estimateDLCSize(dlcId) {
    // Generate consistent size based on dlcId
    const sizeInMB = (dlcId % 5000) + 500; // Between 500MB - 5.5GB
    
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB} MB`;
  }

  /**
   * Get DLC with installation status
   */
  async getDLCsWithStatus(appId, userId = 'demo') {
    const dlcs = await this.getGameDLCs(appId);
    
    // Get installation status from database (implement later)
    // For now, return DLCs with default status
    return dlcs.map(dlc => ({
      ...dlc,
      installed: false
    }));
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new SteamDLCService();
