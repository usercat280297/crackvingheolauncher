const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

class SteamStoreSizeService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 86400000; // 24 hours
    this.browser = null;
    this.luaPath = path.join(__dirname, '../lua_files');
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
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
      // Method 1: Scrape from Steam Store
      const size = await this.scrapeFromSteamStore(appId);
      
      if (size) {
        this.cache.set(cacheKey, { data: size, timestamp: Date.now() });
        return size;
      }

      // Method 2: Estimate from depot count
      return this.estimateSizeFromDepots(appId);

    } catch (error) {
      console.error(`Failed to get size for ${appId}:`, error.message);
      return this.estimateSizeFromDepots(appId);
    }
  }

  async scrapeFromSteamStore(appId) {
    let page;
    try {
      const browser = await this.initBrowser();
      page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Set cookie to bypass age gate
      await page.setCookie({
        name: 'birthtime',
        value: '568022401',
        domain: '.steampowered.com'
      });
      
      await page.goto(`https://store.steampowered.com/app/${appId}/`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const size = await page.evaluate(() => {
        // Look in system requirements
        const sysReqDivs = document.querySelectorAll('.game_area_sys_req');
        
        for (const div of sysReqDivs) {
          const text = div.innerText;
          
          // Look for "Storage:" or "Hard Drive:"
          const storageMatch = text.match(/(?:Storage|Hard Drive|Disk Space)[:\s]+(\d+(?:\.\d+)?)\s*(GB|MB)/i);
          
          if (storageMatch) {
            return {
              value: parseFloat(storageMatch[1]),
              unit: storageMatch[2]
            };
          }
        }
        
        return null;
      });

      await page.close();

      if (size) {
        return this.normalizeSize(size.value, size.unit);
      }

      return null;

    } catch (error) {
      console.error(`Steam Store scrape failed for ${appId}:`, error.message);
      if (page) await page.close();
      return null;
    }
  }

  estimateSizeFromDepots(appId) {
    try {
      const depotIds = this.getDepotIdsFromLua(appId);
      
      if (depotIds.length === 0) {
        return this.estimateSize(appId);
      }

      const depotCount = depotIds.length;
      let estimatedGB;
      
      if (depotCount <= 2) {
        estimatedGB = depotCount * 8 + 5;
      } else if (depotCount <= 5) {
        estimatedGB = depotCount * 12 + 10;
      } else if (depotCount <= 10) {
        estimatedGB = depotCount * 15 + 20;
      } else {
        estimatedGB = Math.min(depotCount * 18, 180);
      }
      
      return `${estimatedGB.toFixed(1)} GB`;
    } catch (error) {
      return this.estimateSize(appId);
    }
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
    if (unit === 'MB' || unit === 'MiB') {
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

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = new SteamStoreSizeService();
