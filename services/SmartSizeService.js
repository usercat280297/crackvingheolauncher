const fs = require('fs');
const path = require('path');

class SmartSizeService {
  constructor() {
    this.cache = new Map();
    this.luaPath = path.join(__dirname, '../lua_files');
    
    // Manual database cho top 100 games phổ biến (lấy từ SteamDB manual)
    this.manualSizes = {
      // AAA Games
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
      2239550: '70.0 GB',  // Mortal Kombat 1
      1938090: '100.0 GB', // Call of Duty MW3
      1938090: '149.0 GB', // Call of Duty: Modern Warfare II
      1938090: '235.0 GB', // Call of Duty: Warzone
      2239550: '100.0 GB', // Mortal Kombat 1
      1938090: '100.0 GB', // MW3
      // Popular games
      570: '15.0 GB',      // Dota 2
      730: '30.0 GB',      // CS:GO
      440: '20.0 GB',      // Team Fortress 2
      578080: '30.0 GB',   // PUBG
      1203220: '30.0 GB',  // Naraka: Bladepoint
      1599340: '50.0 GB',  // Elden Ring
      // Add more as needed
    };
  }

  getGameSize(appId) {
    const cacheKey = `size_${appId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let size;

    // Check manual database first
    if (this.manualSizes[appId]) {
      size = this.manualSizes[appId];
    } else {
      // Smart estimate based on depot analysis
      size = this.smartEstimate(appId);
    }

    this.cache.set(cacheKey, size);
    return size;
  }

  smartEstimate(appId) {
    const depotIds = this.getDepotIdsFromLua(appId);
    
    if (depotIds.length === 0) {
      return this.basicEstimate(appId);
    }

    // Analyze depot structure
    const analysis = this.analyzeDepots(depotIds);
    
    // Calculate size based on depot analysis
    let estimatedGB;
    
    if (analysis.hasLanguagePacks) {
      // Games with language packs are usually larger
      estimatedGB = analysis.mainDepotCount * 20 + analysis.languagePackCount * 5;
    } else if (analysis.hasDLC) {
      // Games with DLC depots
      estimatedGB = analysis.mainDepotCount * 15 + analysis.dlcCount * 10;
    } else {
      // Simple games
      if (analysis.totalDepots <= 2) {
        estimatedGB = 5 + analysis.totalDepots * 3; // 8-11 GB
      } else if (analysis.totalDepots <= 5) {
        estimatedGB = 15 + analysis.totalDepots * 8; // 23-55 GB
      } else if (analysis.totalDepots <= 10) {
        estimatedGB = 30 + analysis.totalDepots * 10; // 40-130 GB
      } else {
        estimatedGB = 50 + analysis.totalDepots * 12; // 62-194 GB
      }
    }

    // Cap at reasonable limits
    estimatedGB = Math.min(Math.max(estimatedGB, 1), 250);
    
    return `${estimatedGB.toFixed(1)} GB`;
  }

  analyzeDepots(depotIds) {
    let mainDepotCount = 0;
    let languagePackCount = 0;
    let dlcCount = 0;
    
    for (const depotId of depotIds) {
      const idStr = depotId.toString();
      
      // Language packs usually have specific patterns
      if (idStr.endsWith('1') || idStr.endsWith('2') || idStr.endsWith('3')) {
        languagePackCount++;
      }
      // DLC depots are usually much higher numbers
      else if (depotId > 3000000) {
        dlcCount++;
      }
      // Main game depots
      else {
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
    const baseSize = this.getGameSize(appId);
    
    if (dlcIds.length === 0) {
      return baseSize;
    }

    const dlcSizes = dlcIds.map(dlcId => this.getGameSize(dlcId));

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
    const baseSize = this.getGameSize(appId);
    const dlcSizes = dlcIds.map(dlcId => ({
      dlcId,
      size: this.getGameSize(dlcId)
    }));

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

module.exports = new SmartSizeService();
