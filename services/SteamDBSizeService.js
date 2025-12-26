const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

class SteamDBSizeService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 86400000; // 24 hours
    this.browser = null;
    this.luaPath = path.join(__dirname, '../lua_files');
    
    // Known sizes fallback
    this.knownSizes = {
      2358720: '139.6 GB',
      1245620: '60.0 GB',
      1091500: '150.0 GB',
      1174180: '125.0 GB',
      271590: '175.0 GB',
    };
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
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
      // Check known sizes first
      if (this.knownSizes[appId]) {
        return this.knownSizes[appId];
      }

      // Scrape from SteamDB with puppeteer
      const size = await this.scrapeFromSteamDB(appId);
      
      if (size) {
        this.cache.set(cacheKey, { data: size, timestamp: Date.now() });
        return size;
      }

      // Fallback to estimation
      return this.estimateSizeFromDepots(appId);

    } catch (error) {
      console.error(`Failed to get size for ${appId}:`, error.message);
      return this.estimateSizeFromDepots(appId);
    }
  }

  async scrapeFromSteamDB(appId) {
    let page;
    try {
      console.log(`🔍 Scraping SteamDB for ${appId}...`);
      
      const browser = await this.initBrowser();
      page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await page.goto(`https://steamdb.info/app/${appId}/depots/`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Extract size from page
      const size = await page.evaluate(() => {
        // Method 1: Look for "Total size on disk"
        const bodyText = document.body.innerText;
        const diskMatch = bodyText.match(/Total size on disk is ([\d,]+\.?\d*)\s*(GiB|MiB)/i);
        
        if (diskMatch) {
          const value = parseFloat(diskMatch[1].replace(/,/g, ''));
          const unit = diskMatch[2];
          return { value, unit };
        }

        // Method 2: Parse depot table
        const rows = document.querySelectorAll('table tbody tr');
        let maxSize = 0;
        
        for (const row of rows) {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            const config = cells[1].innerText;
            const sizeText = cells[3].innerText;
            
            if (config.includes('Windows') && config.includes('64-bit')) {
              const match = sizeText.match(/([\d,]+\.?\d*)\s*(GiB|MiB)/i);
              if (match) {
                const value = parseFloat(match[1].replace(/,/g, ''));
                const unit = match[2];
                const gb = unit === 'MiB' ? value / 1024 : value;
                if (gb > maxSize) {
                  maxSize = gb;
                }
              }
            }
          }
        }
        
        if (maxSize > 0) {
          return { value: maxSize, unit: 'GiB' };
        }
        
        return null;
      });

      await page.close();

      if (size) {
        console.log(`✅ Found size: ${size.value} ${size.unit}`);
        return this.normalizeSize(size.value, size.unit);
      }

      return null;

    } catch (error) {
      console.error(`❌ SteamDB scrape failed for ${appId}:`, error.message);
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
        estimatedGB = depotCount * 5 + 10;
      } else if (depotCount <= 5) {
        estimatedGB = depotCount * 10 + 20;
      } else if (depotCount <= 10) {
        estimatedGB = depotCount * 12 + 30;
      } else {
        estimatedGB = Math.min(depotCount * 15, 200);
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
    if (unit === 'MiB' || unit === 'MB') {
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

module.exports = new SteamDBSizeService();
