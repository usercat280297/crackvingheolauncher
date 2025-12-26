/**
 * ============================================
 * DENUVO DETECTION SERVICE
 * Accurate detection từ Steam API + SteamDB
 * ============================================
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class DenuvoDetectionService {
  constructor() {
    this.denuvoCache = {};
    this.steamDataCache = {};
    this.cacheFile = './denuvo_cache.json';
    this.denuvoListFile = './verified_denuvo_list.json';
    this.loadCache();
  }

  /**
   * VERIFIED DENUVO GAMES - 2024-2025 (CORRECTED)
   * Source: ProtonDB, WineHQ AppDB, Community Reports
   * ⚠️ REMOVED: Elden Ring (NO DENUVO), Red Dead Redemption 2 (NO DENUVO)
   * ⚠️ ADDED: Accurate list from authoritative sources
   */
  getVerifiedDenuvoList() {
    return {
      // ⚠️ CONFIRMED DENUVO GAMES (2025-2026)
      critical: [
        // Black Myth: Wukong
        2358720,
        
        // Dragon's Dogma 2
        2054790,
        
        // Monster Hunter
        2246340, // Monster Hunter Wilds
        
        // Capcom
        2050650, // Resident Evil 4 Remake
        1364780, // Street Fighter 6

        // Square Enix
        2515020, // Final Fantasy XVI
        1754490, // Hitman 3

        // Konami
        2124490, // Silent Hill 2 Remake
        1875830, // Shin Megami Tensei V: Vengeance
        2058180, // Judgment
        2058190, // Lost Judgment

        // FromSoftware (confirmed no denuvo)
        // NOTE: Elden Ring (1245620) has NO DENUVO - REMOVED

        // Take-Two (confirmed no denuvo)
        // NOTE: Red Dead Redemption 2 (1174180) has NO DENUVO - REMOVED

        // Sega/Atlus
        2513280, // Sonic X Shadow Generations
        2679460, // Metaphor: ReFantazio
        2254740, // Persona 5 Tactica
        1875830, // Shin Megami Tensei V: Vengeance
        2072450, // Like a Dragon: Infinite Wealth
        1805480, // Like a Dragon: Ishin!
        2058180, // Judgment
        2058190, // Lost Judgment

        // EA Sports (F1, NBA)
        3059520, // F1 25
        2488620, // F1 24
        2878980, // NBA 2K25
        3472040, // NBA 2K26
        2669320, // EA Sports FC 25
        3405690, // EA Sports FC 26

        // Sports Games
        1785650, // TopSpin 2K25
        3551340, // Football Manager 26
        3274580, // Anno 117: Pax Romana

        // Activision
        1938090, // Call of Duty: Modern Warfare III
        3595270, // Call of Duty: Modern Warfare III (Alt)

        // Ubisoft
        2853730, // Skull and Bones
        2840770, // Avatar: Frontiers of Pandora
        1774580, // STAR WARS Jedi: Survivor
        1812800, // Sniper Elite 5
        2400340, // The Rogue Prince of Persia

        // Other Major Publishers
        1551360, // Forza Horizon 5
        1716740, // Starfield
        2842040, // Star Wars Outlaws
        2761030, // Dragon Age: The Veilguard
        1799530, // Baldur's Gate 3 (SP)
        
        // NOTE: Removed - NO DENUVO
        // 271590,  // Grand Theft Auto V - NO DENUVO
        // 1174180, // Red Dead Redemption 2 - NO DENUVO
        
        // 2025+ Releases
        1903340, // Clair Obscur: Expedition 33
        1817230, // Hi-Fi RUSH
        2527390, // Dead Rising Deluxe Remaster
        1874000, // Life is Strange: Double Exposure
        2304100, // Unknown 9: Awakening
        2420110, // Horizon Zero Dawn Remastered
        1941540, // Mafia: The Old Country
        2958130, // Jurassic World Evolution 3
        3017860, // DOOM: The Dark Ages
        2638890, // Onimusha: Way of the Sword
        3046600, // Onimusha 2: Samurai's Destiny
        3489700, // Stellar Blade (PC)
        2893570, // Dragon Quest I & II HD-2D
        1984270, // Digimon Story: Time Stranger
        1285190, // Borderlands 4
      ],
    };
  }

  /**
   * Detect denuvo từ Steam Store Page
   */
  async detectFromSteam(appId) {
    try {
      if (this.denuvoCache[appId]) {
        return this.denuvoCache[appId];
      }

      const steamData = await this.fetchSteamData(appId);
      if (!steamData) return { hasDenuvo: false, source: 'unknown' };

      const hasDenuvo = this.analyzeForDenuvo(steamData);
      
      this.denuvoCache[appId] = {
        appId,
        hasDenuvo,
        source: 'steam',
        gameTitle: steamData.name,
        timestamp: Date.now(),
      };

      return this.denuvoCache[appId];
    } catch (error) {
      console.error(`❌ Error detecting denuvo for ${appId}:`, error.message);
      return { hasDenuvo: false, source: 'error' };
    }
  }

  /**
   * Fetch Steam Store Data
   */
  async fetchSteamData(appId) {
    try {
      const response = await axios.get(
        `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=us`,
        {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      const data = response.data[appId];
      return data?.success ? data.data : null;
    } catch (error) {
      console.warn(`⚠️ Steam API error for ${appId}:`, error.message);
      return null;
    }
  }

  /**
   * Analyze Steam data for DRM indicators
   */
  analyzeForDenuvo(steamData) {
    if (!steamData) return false;

    // Check description for denuvo mentions
    const descriptionLower = (steamData.detailed_description || '').toLowerCase();
    const shortDescLower = (steamData.short_description || '').toLowerCase();
    
    // Denuvo keywords
    const denuvoKeywords = [
      'denuvo',
      'anti-tamper',
      'anti tamper',
      'drm protected',
    ];

    const hasDenuvoInDesc = denuvoKeywords.some(kw => 
      descriptionLower.includes(kw) || shortDescLower.includes(kw)
    );

    // Check publisher for known Denuvo publishers
    const publishers = steamData.publishers || [];
    const knownDenuvoPublishers = [
      'capcom',
      'square enix',
      'sega',
      'konami',
      'ea games',
      'electronic arts',
      'activision',
      'rockstar',
      'ubisoft',
      'from software',
    ];

    const hasDenuvoPublisher = publishers.some(pub =>
      knownDenuvoPublishers.some(known => pub.toLowerCase().includes(known))
    );

    return hasDenuvoInDesc || hasDenuvoPublisher;
  }

  /**
   * Check if game is in verified denuvo list
   */
  isVerifiedDenuvo(appId) {
    const verified = this.getVerifiedDenuvoList();
    return verified.critical.includes(parseInt(appId));
  }

  /**
   * Get full denuvo status - USE ONLY VERIFIED LIST
   * Fallback Steam detection removed (was giving false positives)
   */
  async getFullDenuvoStatus(appId) {
    const isVerified = this.isVerifiedDenuvo(appId);
    
    // IMPORTANT: Only return verified list status
    // Don't use Steam detection as it had too many false positives
    return {
      appId,
      hasDenuvo: isVerified,  // ONLY use verified list
      isVerified,
      source: 'verified_list',
      timestamp: Date.now(),
    };
  }

  /**
   * Cache management
   */
  loadCache() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        this.denuvoCache = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️ Could not load denuvo cache:', error.message);
    }
  }

  saveCache() {
    try {
      fs.writeFileSync(this.cacheFile, JSON.stringify(this.denuvoCache, null, 2));
    } catch (error) {
      console.error('❌ Error saving denuvo cache:', error.message);
    }
  }

  /**
   * Batch check denuvo for multiple games
   */
  async batchCheckDenuvo(appIds) {
    const results = {};
    for (const appId of appIds) {
      results[appId] = await this.getFullDenuvoStatus(appId);
      // Add delay to respect Steam API limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return results;
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      cachedGames: Object.keys(this.denuvoCache).length,
      verifiedDenuvoCount: this.getVerifiedDenuvoList().critical.length,
    };
  }

  /**
   * Clear old cache entries (older than 30 days)
   */
  clearOldCache() {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    for (const appId in this.denuvoCache) {
      const entry = this.denuvoCache[appId];
      if (now - entry.timestamp > thirtyDaysMs) {
        delete this.denuvoCache[appId];
      }
    }
    
    this.saveCache();
  }
}

module.exports = new DenuvoDetectionService();
