const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class SteamAPISizeService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 86400000; // 24 hours
    this.luaPath = path.join(__dirname, '../lua_files');
  }

  async getGameSize(appId) {
    const cacheKey = `size_${appId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const size = await this.fetchFromSteamAPI(appId);
      
      if (size) {
        this.cache.set(cacheKey, { data: size, timestamp: Date.now() });
        return size;
      }

      // Fallback to smart estimate
      return this.smartEstimate(appId);

    } catch (error) {
      console.error(`Failed to get size for ${appId}:`, error.message);
      return this.smartEstimate(appId);
    }
  }

  async fetchFromSteamAPI(appId) {
    try {
      const response = await axios.get(
        `https://store.steampowered.com/api/appdetails`,
        {
          params: {
            appids: appId,
            cc: 'us',
            l: 'english'
          },
          timeout: 10000
        }
      );

      const gameData = response.data?.[appId];
      
      if (!gameData || !gameData.success) {
        return null;
      }

      const data = gameData.data;
      
      // Parse PC requirements
      const pcReq = data.pc_requirements;
      
      if (!pcReq || !pcReq.minimum) {
        return null;
      }

      // Parse HTML string
      const $ = cheerio.load(pcReq.minimum);
      const text = $.text();
      
      // Look for storage/disk space patterns
      const patterns = [
        /(?:Storage|Hard Drive|Disk Space|Available space)[:\s]+(\d+(?:\.\d+)?)\s*(GB|MB)/i,
        /(\d+(?:\.\d+)?)\s*(GB|MB)\s+(?:available|free|required)/i,
        /(\d+(?:\.\d+)?)\s*(GB|MB)\s+(?:of\s+)?(?:available|free)\s+space/i
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          return this.normalizeSize(value, unit);
        }
      }

      // Also check recommended requirements
      if (pcReq.recommended) {
        const $rec = cheerio.load(pcReq.recommended);
        const recText = $rec.text();
        
        for (const pattern of patterns) {
          const match = recText.match(pattern);
          if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            return this.normalizeSize(value, unit);
          }
        }
      }

      return null;

    } catch (error) {
      if (error.response?.status === 429) {
        console.log('⚠️  Rate limited, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      return null;
    }
  }

  smartEstimate(appId) {
    const depotIds = this.getDepotIdsFromLua(appId);
    
    if (depotIds.length === 0) {
      return this.basicEstimate(appId);
    }

    const analysis = this.analyzeDepots(depotIds);
    let estimatedGB;
    
    if (analysis.hasLanguagePacks) {
      estimatedGB = analysis.mainDepotCount * 20 + analysis.languagePackCount * 5;
    } else if (analysis.hasDLC) {
      estimatedGB = analysis.mainDepotCount * 15 + analysis.dlcCount * 10;
    } else {
      if (analysis.totalDepots <= 2) {
        estimatedGB = 5 + analysis.totalDepots * 3;
      } else if (analysis.totalDepots <= 5) {
        estimatedGB = 15 + analysis.totalDepots * 8;
      } else if (analysis.totalDepots <= 10) {
        estimatedGB = 30 + analysis.totalDepots * 10;
      } else {
        estimatedGB = 50 + analysis.totalDepots * 12;
      }
    }

    estimatedGB = Math.min(Math.max(estimatedGB, 1), 250);
    return `${estimatedGB.toFixed(1)} GB`;
  }

  analyzeDepots(depotIds) {
    let mainDepotCount = 0;
    let languagePackCount = 0;
    let dlcCount = 0;
    
    for (const depotId of depotIds) {
      const idStr = depotId.toString();
      
      if (idStr.endsWith('1') || idStr.endsWith('2') || idStr.endsWith('3')) {
        languagePackCount++;
      } else if (depotId > 3000000) {
        dlcCount++;
      } else {
        mainDepotCount++;
      }
    }

    return {
      totalDepots: depotIds.length,
      mainDepotCount: Math.max(mainDepotCount, 1),
      languagePackCount,
      dlcCount,
      hasLanguagePacks: languagePackCount > 0,
      hasDLC: dlcCount > 0
    };
  }

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
    if (unit === 'MB') {
      const gb = value / 1024;
      if (gb < 1) {
        return `${Math.round(value)} MB`;
      }
      return `${gb.toFixed(1)} GB`;
    }
    return `${value.toFixed(1)} GB`;
  }

  basicEstimate(appId) {
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
  }

  convertToMB(sizeStr) {
    const match = sizeStr.match(/([\d.]+)\s*(GB|MB)/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    return unit === 'GB' ? value * 1024 : value;
  }

  async getSizeBreakdown(appId, dlcIds = []) {
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
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new SteamAPISizeService();
