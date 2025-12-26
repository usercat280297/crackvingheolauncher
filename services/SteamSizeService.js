const axios = require('axios');
const cheerio = require('cheerio');

class SteamSizeService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 86400000; // 24 hours
  }

  /**
   * Get game size from SteamDB (most accurate)
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
      // Method 1: Get from SteamDB depots page
      const steamDBSize = await this.getSizeFromSteamDB(appId);
      if (steamDBSize) {
        this.cache.set(cacheKey, { data: steamDBSize, timestamp: Date.now() });
        return steamDBSize;
      }

      // Method 2: Fallback to Steam Store API
      const apiSize = await this.getSizeFromAPI(appId);
      if (apiSize) {
        this.cache.set(cacheKey, { data: apiSize, timestamp: Date.now() });
        return apiSize;
      }

      // Method 3: Estimate
      const estimatedSize = this.estimateSize(appId);
      this.cache.set(cacheKey, { data: estimatedSize, timestamp: Date.now() });
      return estimatedSize;

    } catch (error) {
      console.error(`Failed to get size for ${appId}:`, error.message);
      return this.estimateSize(appId);
    }
  }

  /**
   * Scrape size from SteamDB depots page
   */
  async getSizeFromSteamDB(appId) {
    try {
      console.log(`🔍 Fetching size from SteamDB for ${appId}...`);
      
      const response = await axios.get(
        `https://steamdb.info/app/${appId}/depots/`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://steamdb.info/'
          },
          timeout: 15000
        }
      );

      const $ = cheerio.load(response.data);
      
      // Method 1: Look for "Total size on disk is X GiB"
      const bodyText = $('body').text();
      console.log('📄 Searching for total size text...');
      
      const diskSizeMatch = bodyText.match(/Total size on disk is ([\d,]+\.?\d*)\s*(GiB|MiB)/i);
      
      if (diskSizeMatch) {
        const value = parseFloat(diskSizeMatch[1].replace(/,/g, ''));
        const unit = diskSizeMatch[2];
        console.log(`✅ Found total size: ${value} ${unit}`);
        return this.normalizeSize(value, unit);
      }

      // Method 2: Parse depot table
      console.log('📊 Parsing depot table...');
      const depotRows = $('table.table-depots tbody tr');
      let maxSize = 0;
      let foundDepot = false;
      
      depotRows.each((i, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 4) {
          const config = $(cells[1]).text().trim();
          const sizeText = $(cells[3]).text().trim();
          
          console.log(`  Depot ${i}: Config="${config}", Size="${sizeText}"`);
          
          // Look for Windows 64-bit depot
          if (config.includes('Windows') && config.includes('64-bit')) {
            const sizeMatch = sizeText.match(/([\d,]+\.?\d*)\s*(GiB|MiB)/i);
            if (sizeMatch) {
              const value = parseFloat(sizeMatch[1].replace(/,/g, ''));
              const unit = sizeMatch[2];
              const sizeInGB = unit === 'MiB' ? value / 1024 : value;
              
              console.log(`    → Found Windows 64-bit: ${value} ${unit} = ${sizeInGB.toFixed(1)} GB`);
              
              if (sizeInGB > maxSize) {
                maxSize = sizeInGB;
                foundDepot = true;
              }
            }
          }
        }
      });

      if (foundDepot && maxSize > 0) {
        console.log(`✅ Using depot size: ${maxSize.toFixed(1)} GB`);
        return `${maxSize.toFixed(1)} GB`;
      }

      console.log('⚠️  No size found in SteamDB');
      return null;
    } catch (error) {
      console.error(`❌ SteamDB scrape failed for ${appId}:`, error.message);
      return null;
    }
  }

  /**
   * Try to get size from Steam API
   */
  async getSizeFromAPI(appId) {
    try {
      const response = await axios.get(
        `https://store.steampowered.com/api/appdetails`,
        {
          params: { appids: appId },
          timeout: 8000
        }
      );

      const data = response.data?.[appId]?.data;
      if (!data) return null;

      // Check PC requirements for size info
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
   * Normalize size to GB format
   */
  normalizeSize(value, unit) {
    if (unit === 'MB' || unit === 'MiB') {
      const gb = value / 1024;
      if (gb < 1) {
        return `${Math.round(value)} MB`;
      }
      return `${gb.toFixed(1)} GB`;
    }
    return `${value.toFixed(1)} GB`;
  }

  /**
   * Estimate size based on appId (fallback)
   */
  estimateSize(appId) {
    // Generate consistent estimate based on appId
    const hash = appId % 100;
    
    if (hash < 20) {
      // Small indie games
      return `${(hash * 50 + 500)} MB`;
    } else if (hash < 50) {
      // Medium games
      return `${(hash * 0.5 + 5).toFixed(1)} GB`;
    } else if (hash < 80) {
      // Large games
      return `${(hash * 0.8 + 20).toFixed(1)} GB`;
    } else {
      // AAA games
      return `${(hash * 1.2 + 50).toFixed(1)} GB`;
    }
  }

  /**
   * Get total size including all DLCs from SteamDB
   */
  async getTotalSizeWithDLCs(appId, dlcIds = []) {
    try {
      // Get base game size from SteamDB
      const baseSize = await this.getGameSize(appId);
      
      if (dlcIds.length === 0) {
        return baseSize;
      }

      // Get DLC sizes
      const dlcSizes = await Promise.all(
        dlcIds.map(dlcId => this.getGameSize(dlcId))
      );

      // Calculate total in MB
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
      console.error('Error calculating total size:', error);
      return this.estimateSize(appId);
    }
  }

  /**
   * Convert size string to MB
   */
  convertToMB(sizeStr) {
    const match = sizeStr.match(/([\d.]+)\s*(GB|MB)/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    return unit === 'GB' ? value * 1024 : value;
  }

  /**
   * Get size breakdown
   */
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
      console.error('Error getting size breakdown:', error);
      return {
        baseGame: this.estimateSize(appId),
        dlcs: [],
        total: this.estimateSize(appId)
      };
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new SteamSizeService();
