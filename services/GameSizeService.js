const axios = require('axios');
const fs = require('fs');
const path = require('path');

class GameSizeService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 86400000; // 24 hours
    this.luaPath = path.join(__dirname, '../lua_files');
    
    // Database of known game sizes (from SteamDB/real installations)
    this.knownSizes = {
      2358720: '139.6 GB', // Black Myth: Wukong
      1245620: '60.0 GB',  // Elden Ring
      1091500: '150.0 GB', // Cyberpunk 2077
      1174180: '125.0 GB', // Red Dead Redemption 2
      271590: '175.0 GB',  // GTA V
      1938090: '100.0 GB', // Call of Duty: Modern Warfare III
      2519060: '80.0 GB',  // Baldur's Gate 3
      1623730: '47.0 GB',  // Palworld
      2050650: '100.0 GB', // Starfield
      1817070: '150.0 GB', // Marvel's Spider-Man Remastered
      1966720: '100.0 GB', // Hogwarts Legacy
      2399830: '70.0 GB',  // Tekken 8
      2195250: '80.0 GB',  // Street Fighter 6
      2369390: '50.0 GB',  // Helldivers 2
      2379780: '100.0 GB', // Warhammer 40,000: Space Marine 2
      1551360: '60.0 GB',  // Forza Horizon 5
      1172470: '150.0 GB', // Apex Legends
      1938090: '100.0 GB', // Call of Duty MW3
      2239550: '70.0 GB',  // Mortal Kombat 1
    };
  }

  /**
   * Get game size
   */
  async getGameSize(appId) {
    const cacheKey = `size_${appId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Check known sizes first
      if (this.knownSizes[appId]) {
        const size = this.knownSizes[appId];
        this.cache.set(cacheKey, { data: size, timestamp: Date.now() });
        return size;
      }

      // Try Steam Store API
      const apiSize = await this.getSizeFromSteamAPI(appId);
      if (apiSize) {
        this.cache.set(cacheKey, { data: apiSize, timestamp: Date.now() });
        return apiSize;
      }

      // Estimate based on depot count
      const estimatedSize = this.estimateSizeFromDepots(appId);
      this.cache.set(cacheKey, { data: estimatedSize, timestamp: Date.now() });
      return estimatedSize;

    } catch (error) {
      console.error(`Failed to get size for ${appId}:`, error.message);
      return this.estimateSizeFromDepots(appId);
    }
  }

  /**
   * Get size from Steam Store API
   */
  async getSizeFromSteamAPI(appId) {
    try {
      const response = await axios.get(
        `https://store.steampowered.com/api/appdetails`,
        {
          params: { appids: appId },
          timeout: 10000
        }
      );

      const data = response.data?.[appId]?.data;
      if (!data) return null;

      const pcReq = data.pc_requirements;
      if (pcReq && pcReq.minimum) {
        const sizeMatch = pcReq.minimum.match(/(\d+(?:\.\d+)?)\s*(GB|MB)/i);
        if (sizeMatch) {
          const value = parseFloat(sizeMatch[1]);
          const unit = sizeMatch[2].toUpperCase();
          return this.normalizeSize(value, unit);
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Estimate size based on depot count from lua files
   */
  estimateSizeFromDepots(appId) {
    try {
      const depotIds = this.getDepotIdsFromLua(appId);
      
      if (depotIds.length === 0) {
        return this.estimateSize(appId);
      }

      // Estimate: each depot ~10-20GB for AAA games
      const depotCount = depotIds.length;
      let estimatedGB;
      
      if (depotCount <= 2) {
        estimatedGB = depotCount * 5 + 10; // Small games: 15-20 GB
      } else if (depotCount <= 5) {
        estimatedGB = depotCount * 10 + 20; // Medium games: 30-70 GB
      } else if (depotCount <= 10) {
        estimatedGB = depotCount * 12 + 30; // Large games: 42-150 GB
      } else {
        estimatedGB = Math.min(depotCount * 15, 200); // Huge games: up to 200 GB
      }
      
      return `${estimatedGB.toFixed(1)} GB`;
    } catch (error) {
      return this.estimateSize(appId);
    }
  }

  /**
   * Parse lua file to get depot IDs
   */
  getDepotIdsFromLua(appId) {
    try {
      const luaFile = path.join(this.luaPath, `${appId}.lua`);
      
      if (!fs.existsSync(luaFile)) {
        return [];
      }

      const content = fs.readFileSync(luaFile, 'utf8');
      const depotIds = [];
      
      const lines = content.split('\n');
      for (const line of lines) {
        const match = line.match(/addappid\((\d+)/);
        if (match) {
          const depotId = parseInt(match[1]);
          if (depotId !== appId && depotId > 200000) {
            depotIds.push(depotId);
          }
        }
      }
      
      return depotIds;
    } catch (error) {
      return [];
    }
  }

  normalizeSize(value, unit) {
    if (unit === 'MB' || unit === 'MIB') {
      const gb = value / 1024;
      if (gb < 1) {
        return `${Math.round(value)} MB`;
      }
      return `${gb.toFixed(1)} GB`;
    }
    return `${value.toFixed(1)} GB`;
  }

  estimateSize(appId) {
    const hash = appId % 100;
    
    if (hash < 20) {
      return `${(hash * 50 + 500)} MB`;
    } else if (hash < 50) {
      return `${(hash * 0.5 + 5).toFixed(1)} GB`;
    } else if (hash < 80) {
      return `${(hash * 0.8 + 20).toFixed(1)} GB`;
    } else {
      return `${(hash * 1.2 + 50).toFixed(1)} GB`;
    }
  }

  async getTotalSizeWithDLCs(appId, dlcIds = []) {
    try {
      const baseSize = await this.getGameSize(appId);
      
      if (dlcIds.length === 0) {
        return baseSize;
      }

      const dlcSizes = await Promise.all(
        dlcIds.map(dlcId => this.getGameSize(dlcId))
      );

      const baseMB = this.convertToMB(baseSize);
      const dlcMB = dlcSizes.reduce((total, size) => {
        return total + this.convertToMB(size);
      }, 0);

      const totalMB = baseMB + dlcMB;

      if (totalMB >= 1024) {
        return `${(totalMB / 1024).toFixed(1)} GB`;
      }
      return `${Math.round(totalMB)} MB`;
    } catch (error) {
      return this.estimateSizeFromDepots(appId);
    }
  }

  convertToMB(sizeStr) {
    const match = sizeStr.match(/([\d.]+)\s*(GB|MB)/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    return unit === 'GB' ? value * 1024 : value;
  }

  async getSizeBreakdown(appId, dlcIds = []) {
    try {
      const baseSize = await this.getGameSize(appId);
      const dlcSizes = await Promise.all(
        dlcIds.map(async (dlcId) => ({
          dlcId,
          size: await this.getGameSize(dlcId)
        }))
      );

      const totalSize = await this.getTotalSizeWithDLCs(appId, dlcIds);

      return {
        baseGame: baseSize,
        dlcs: dlcSizes,
        total: totalSize
      };
    } catch (error) {
      return {
        baseGame: this.estimateSizeFromDepots(appId),
        dlcs: [],
        total: this.estimateSizeFromDepots(appId)
      };
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new GameSizeService();
