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
   * VERIFIED DENUVO GAMES - 2024-2025 (COMPLETE)
   * Source: Steam Store, SteamDB, Community Reports
   * All App IDs verified from images provided
   */
  getVerifiedDenuvoList() {
    return {
      critical: [
        801800,   // Atomfall ✓
        668580,   // Atomic Heart ✓
        2358720,  // Black Myth: Wukong ✓
        1285190,  // Borderlands 4 ✓
        1295660,  // Civilization VII ✓
        1273400,  // Construction Simulator ✓
        1693980,  // Dead Space Remake ✓
        1490890,  // Demon Slayer The Hinokami Chronicles ✓
        2928600,  // Demon Slayer The Hinokami Chronicles 2 ✓
        1984270,  // Digimon Story Time Stranger ✓
        1038250,  // Dirt 5 ✓
        3017860,  // DOOM: The Dark Ages ✓
        2054790,  // Dragon's Dogma 2 ✓
        2893570,  // Dragon Quest I & II HD-2D Remake ✓
        1570010,  // FAR: Changing Tides ✓
        637650,   // Final Fantasy XV (FINAL FANTASY XV WINDOWS EDITION) ✓
        2515020,  // Final Fantasy XVI ✓
        1004640,  // FINAL FANTASY TACTICS - The Ivalice Chronicles ✓
        2591280,  // F1 Manager 2024 ✓
        3551340,  // Football Manager 26 ✓
        1761390,  // Hatsune Miku: Project DIVA Mega Mix+ ✓
        2495100,  // Hello Kitty Island Adventures ✓
        1817230,  // Hi-Fi Rush ✓
        990080,   // Hogwarts Legacy ✓
        1244460,  // Jurassic World Evolution 2 ✓
        2958130,  // Jurassic World Evolution 3 ✓
        2375550,  // Like A Dragon: Gaiden ✓
        2072450,  // Like A Dragon: Infinite Wealth ✓
        1805480,  // Like A Dragon: Ishin ✓
        3061810,  // Like A Dragon: Pirate Yakuza In Hawaii ✓
        2058190,  // Lost Judgement ✓
        1941540,  // Mafia: The Old Country ✓
        368260,  // Marvel's Midnight Suns ✓
        2679460,  // Metaphor: ReFantazio ✓
        2246340,  // Monster Hunter: Wilds ✓
        1971870,  // Mortal Kombat 1 ✓
        
        // ===== STEAM - GENERAL GAMES (Image 1 - Column 2) =====
        2161700, //Persona 3 Reload
        2878980,  // NBA 2K25 ✓
        3472040,  // NBA 2K26 ✓
        1809700,  // Persona 3 Portable ✓
        1602010,  // Persona 4 Arena Ultimax ✓
        1113000,  // Persona 4 Golden ✓
        1687950,  // Persona 5 Royal ✓
        1382330,  // Persona 5 Strikers ✓
        2254740,  // Persona 5 Tactica ✓
        2688950,  // Planet Coaster 2 ✓
        703080,   // Planet Zoo ✓
        2288350,  // RAIDOU Remastered ✓
        2050650,  // Resident Evil 4 + Separate Ways ✓
        1875830,  // Shin Megami Tensei V: Vengeance ✓
        2361770,  // SHINOBI: Art Of Vengeance ✓
        1029690,  // Sniper Elite 5 ✓
        2169200,  // Sniper Elite: Resistance ✓
        752480,  // Sniper Elite VR ✓
        2055290,  // Sonic Colors: Ultimate ✓
        1237320,  // Sonic Frontiers ✓
        1794960,  // Sonic Origins ✓
        2486820,  // Sonic Racing: CrossWorlds ✓
        2022670,  // Sonic Superstars ✓
        2513280,  // Sonic X Shadow Generations ✓
        1777620,  // Soul Hackers 2 ✓
        3489700,  // Stellar Blade ✓
        1364780,  // Street Fighter 6 ✓
        1909950,  // Super Robot Wars Y ✓
        491540,   // The Bus ✓
        2680010,  // The First Berserker: Khazan ✓
        2951630,  // Total War: PHARAOH DYNASTIES ✓
        1142710,  // Total War: WARHAMMER III ✓
        1649080,  // Two Point Campus ✓
        2185060,  // Two Point Museum ✓
        1451190,  // Undisputed ✓
        1611910,  // Warhammer 40,000: Chaos Gate - Daemonhunters ✓
        1844380,  // Warhammer Age Of Sigmar: Realms of Ruin ✓
        
        // ===== UBISOFT GAMES (Image 2) =====
        3274580,  // Anno 117: Pax Romana ✓
        916440,   // Anno 1800 ✓
        3035570,   // Assassin's Creed Mirage ✓
        3159330,  // Assassin's Creed Shadows ✓
        2840770,  // Avatar: Frontiers Of Pandora ✓
        2751000,  // Prince Of Persia: The Lost Crown ✓
        2842040,  // Star Wars Outlaws ✓
        
        // ===== EA GAMES (Image 3) =====
        2195250,  // EA Sports FC 24 ✓
        2669320,  // EA Sports FC 25 ✓
        3405690,  // EA Sports FC 26 ✓
        3230400,  // EA Sports Madden 26 ✓
        1677350,  // EA Sports PGA TOUR ✓
        1849250,  // EA Sports WRC ✓
        2488620,  // F1 24 ✓
        3059520,  // F1 25 ✓
        1307710,  // Grid Legends ✓
        1462570,  // Lost In Random ✓
        1846380,  // Need For Speed Unbound ✓
        
        // ===== OTHER VERIFIED GAMES (From Original List) =====
        
        2124490,  // Silent Hill 2 Remake ✓
        2058180,  // Judgment ✓
        3595270,  // Call of Duty: Modern Warfare III ✓
        2853730,  // Skull and Bones ✓
        1774580,  // STAR WARS Jedi: Survivor ✓
        1551360,  // Forza Horizon 5 ✓
        1716740,  // Starfield ✓
        1845910,  // Dragon Age: The Veilguard ✓
        1903340,  // Clair Obscur: Expedition 33 ✓
        2527390,  // Dead Rising Deluxe Remaster ✓
        1874000,  // Life is Strange: Double Exposure ✓
        1477940,  // Unknown 9: Awakening ✓
        2561580,  // Horizon Zero Dawn Remastered ✓
        2638890,  // Onimusha: Way of the Sword ✓
        3046600,  // Onimusha 2: Samurai's Destiny ✓
        1785650,  // TopSpin 2K25 ✓
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

// Export the service instance (CORRECT POSITION)
module.exports = new DenuvoDetectionService();