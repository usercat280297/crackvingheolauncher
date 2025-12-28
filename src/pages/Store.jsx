

// ============================================
// COMPLETE STORE.jsx - FULL VERSION (FIXED)
// ============================================

import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import SteamNameService from '../services/steamNames';
import { DownloadContext } from '../context/DownloadContext';
import LastUpdated from '../components/LastUpdated';
import FeaturedPopularGames from '../components/FeaturedPopularGames';
import { openExternal } from '../utils/openExternal';
import DenuvoIndicator from '../components/DenuvoIndicator';

// ============================================
// DANH SÁCH GAME IDs CÓ DENUVO (Cập nhật 2024)
// ============================================
const DENUVO_GAMES_LIST = [
  { id: 801800, name: "Atomfall" },
  { id: 668580, name: "Atomic Heart" },
  { id: 2358720, name: "Black Myth: Wukong" },
  { id: 1285190, name: "Borderlands 4" },
  { id: 1295660, name: "Civilization VII" },
  { id: 1273400, name: "Construction Simulator" },
  { id: 1693980, name: "Dead Space Remake" },
  { id: 1490890, name: "Demon Slayer -Kimetsu no Yaiba- The Hinokami Chronicles" },
  { id: 2928600, name: "Demon Slayer -Kimetsu no Yaiba- The Hinokami Chronicles 2" },
  { id: 1984270, name: "Digimon Story Time Stranger" },
  { id: 1038250, name: "Dirt 5" },
  { id: 3017860, name: "DOOM: The Dark Ages" },
  { id: 2893570, name: "Dragon Quest I & II HD-2D Remake" },
  { id: 1570010, name: "FAR: Changing Tides" },
  { id: 637650, name: "Final Fantasy XV" },
  { id: 2515020, name: "Final Fantasy XVI" },
  { id: 1004640, name: "FINAL FANTASY TACTICS - The Ivalice Chronicles" },
  { id: 2591280, name: "F1 Manager 2024" },
  { id: 3551340, name: "Football Manager 26" },
  { id: 1761390, name: "Hatsune Miku: Project DIVA Mega Mix+" },
  { id: 2495100, name: "Hello Kitty Island Adventures" },
  { id: 1817230, name: "Hi-Fi Rush" },
  { id: 990080, name: "Hogwarts Legacy" },
  { id: 1244460, name: "Jurassic World Evolution 2" },
  { id: 2958130, name: "Jurassic World Evolution 3" },
  { id: 2375550, name: "Like A Dragon: Gaiden" },
  { id: 2072450, name: "Like A Dragon: Infinite Wealth" },
  { id: 1805480, name: "Like A Dragon: Ishin" },
  { id: 3061810, name: "Like A Dragon: Pirate Yakuza In Hawaii" },
  { id: 2058190, name: "Lost Judgement" },
  { id: 1941540, name: "Mafia: The Old Country" },
  { id: 368260, name: "Marvel's Midnight Suns" },
  { id: 2679460, name: "Metaphor: ReFantazio" },
  { id: 2246340, name: "Monster Hunter: Wilds" },
  { id: 1971870, name: "Mortal Kombat 1" },
  { id: 2161700, name: "Persona 3 Reload" },
  { id: 2878980, name: "NBA 2K25" },
  { id: 3472040, name: "NBA 2K26" },
  { id: 1809700, name: "Persona 3 Portable" },
  { id: 1602010, name: "Persona 4 Arena Ultimax" },
  { id: 1113000, name: "Persona 4 Golden" },
  { id: 1687950, name: "Persona 5 Royal" },
  { id: 1382330, name: "Persona 5 Strikers" },
  { id: 2254740, name: "Persona 5 Tactica" },
  { id: 2688950, name: "Planet Coaster 2" },
  { id: 703080, name: "Planet Zoo" },
  { id: 2288350, name: "RAIDOU Remastered" },
  { id: 2050650, name: "Resident Evil 4 + Separate Ways" },
  { id: 1875830, name: "Shin Megami Tensei V: Vengeance" },
  { id: 2361770, name: "SHINOBI: Art Of Vengeance" },
  { id: 1029690, name: "Sniper Elite 5" },
  { id: 2169200, name: "Sniper Elite: Resistance" },
  { id: 752480, name: "Sniper Elite VR" },
  { id: 2055290, name: "Sonic Colors: Ultimate" },
  { id: 1237320, name: "Sonic Frontiers" },
  { id: 1794960, name: "Sonic Origins" },
  { id: 2486820, name: "Sonic Racing: CrossWorlds" },
  { id: 2022670, name: "Sonic Superstars" },
  { id: 2513280, name: "Sonic X Shadow Generations" },
  { id: 1777620, name: "Soul Hackers 2" },
  { id: 3489700, name: "Stellar Blade" },
  { id: 1364780, name: "Street Fighter 6" },
  { id: 1909950, name: "Super Robot Wars Y" },
  { id: 491540, name: "The Bus" },
  { id: 2680010, name: "The First Berserker: Khazan" },
  { id: 2951630, name: "Total War: PHARAOH DYNASTIES" },
  { id: 1142710, name: "Total War: WARHAMMER III" },
  { id: 1649080, name: "Two Point Campus" },
  { id: 2185060, name: "Two Point Museum" },
  { id: 1451190, name: "Undisputed" },
  { id: 1611910, name: "Warhammer 40,000: Chaos Gate - Daemonhunters" },
  { id: 1844380, name: "Warhammer Age Of Sigmar: Realms of Ruin" },
  { id: 3274580, name: "Anno 117: Pax Romana" },
  { id: 916440, name: "Anno 1800" },
  { id: 3035570, name: "Assassin's Creed Mirage" },
  { id: 3159330, name: "Assassin's Creed Shadows" },
  { id: 2840770, name: "Avatar: Frontiers Of Pandora" },
  { id: 2751000, name: "Prince Of Persia: The Lost Crown" },
  { id: 2842040, name: "Star Wars Outlaws" },
  { id: 2195250, name: "EA Sports FC 24" },
  { id: 2669320, name: "EA Sports FC 25" },
  { id: 3405690, name: "EA Sports FC 26" },
  { id: 3230400, name: "EA Sports Madden 26" },
  { id: 1677350, name: "EA Sports PGA TOUR" },
  { id: 1849250, name: "EA Sports WRC" },
  { id: 2488620, name: "F1 24" },
  { id: 3059520, name: "F1 25" },
  { id: 1307710, name: "Grid Legends" },
  { id: 1462570, name: "Lost In Random" },
  { id: 1846380, name: "Need For Speed Unbound" },
  { id: 2124490, name: "Silent Hill 2 Remake" },
  { id: 2058180, name: "Judgment" },
  { id: 3595270, name: "Call of Duty: Modern Warfare III" },
  { id: 2853730, name: "Skull and Bones" },
  { id: 1774580, name: "STAR WARS Jedi: Survivor" },
  { id: 1551360, name: "Forza Horizon 5" },
  { id: 1716740, name: "Starfield" },
  { id: 1845910, name: "Dragon Age: The Veilguard" },
  { id: 1903340, name: "Clair Obscur: Expedition 33" },
  { id: 2527390, name: "Dead Rising Deluxe Remaster" },
  { id: 1874000, name: "Life is Strange: Double Exposure" },
  { id: 1477940, name: "Unknown 9: Awakening" },
  { id: 2561580, name: "Horizon Zero Dawn Remastered" },
  { id: 2638890, name: "Onimusha: Way of the Sword" },
  { id: 3046600, name: "Onimusha 2: Samurai's Destiny" },
  { id: 1785650, name: "TopSpin 2K25" }
];

const DENUVO_GAME_IDS = DENUVO_GAMES_LIST.map(g => g.id);

export default function Store() {
  const { t } = useLanguage();
  const { startDownload } = useContext(DownloadContext);
  
  // ============================================
  // ALL STATES
  // ============================================
  const [games, setGames] = useState([]);
  const [featuredGames, setFeaturedGames] = useState([]);
  const [denuvoGames, setDenuvoGames] = useState([]);
  const [epicSales, setEpicSales] = useState([]);
  const [steamSales, setSteamSales] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [mostPlayed, setMostPlayed] = useState([]);
  const [topUpcoming, setTopUpcoming] = useState([]);
  const [epicLastUpdated, setEpicLastUpdated] = useState(null);
  const [steamLastUpdated, setSteamLastUpdated] = useState(null);
  const [refreshingSales, setRefreshingSales] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('title');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showGridMenu, setShowGridMenu] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalGames: 0,
    hasNext: false
  });

  const [popularSlide, setPopularSlide] = useState(0);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [randomGames, setRandomGames] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);
  
  // Hover Popup State
  const [hoveredGame, setHoveredGame] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const hoverTimeoutRef = useRef(null);

  const handleGameHover = (game, e) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const popupWidth = 320; // Estimated width
    
    let left = rect.right + 20;
    // If not enough space on right, show on left
    if (left + popupWidth > windowWidth) {
      left = rect.left - popupWidth - 20;
    }
    
    setPopupPosition({
      top: rect.top,
      left: left
    });
    setHoveredGame(game);
  };

  const handleGameLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredGame(null);
    }, 100);
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const getDisplayTitle = (g) => {
    if (g?.title && g.title !== 'Unknown Game' && !g.title.startsWith('Unknown Game (')) {
      return g.title;
    }
    if (g?.name && g.name !== 'Unknown Game') {
      return g.name;
    }
    const steamName = SteamNameService.getGameName(parseInt(g?.id || g?.appId || 0));
    return steamName || g?.title || g?.name || 'Unknown Game';
  };

  const getMatchTypeColor = (matchType) => {
    switch (matchType) {
      case 'exact': return 'text-green-600';
      case 'prefix': return 'text-blue-600';
      case 'contains': return 'text-purple-600';
      case 'keyword': return 'text-orange-600';
      case 'fuzzy': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getMatchTypeLabel = (matchType) => {
    switch (matchType) {
      case 'exact': return 'Exact Match';
      case 'prefix': return 'Starts With';
      case 'contains': return 'Contains';
      case 'keyword': return 'Keyword';
      case 'fuzzy': return 'Similar';
      default: return 'Match';
    }
  };

  // ============================================
  // FETCH DENUVO FEATURED GAMES (7 GAMES ONLY)
  // ============================================
  const fetchDenuvoFeaturedGames = useCallback(async (forceRefresh = false) => {
    try {
      const cacheKey = 'denuvo_featured_games_v6'; // Updated version for new logic
      const cacheTimeKey = cacheKey + '_time';
      const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes exact

      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheTimeKey);
      
      const now = Date.now();
      const isCacheValid = cached && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION;

      // Use cache if valid and not forced
      if (isCacheValid && !forceRefresh) {
        try {
          const cachedData = JSON.parse(cached);
          if (cachedData && cachedData.length === 7 && cachedData.every(g => DENUVO_GAME_IDS.includes(parseInt(g.id)))) {
            setDenuvoGames(cachedData);
            setFeaturedGames(cachedData);
            const timeLeft = Math.ceil((CACHE_DURATION - (now - parseInt(cacheTime))) / 60000);
            console.log(`✅ Loaded 7 verified Denuvo games from cache. Next refresh in ~${timeLeft} mins.`);
            return;
          }
        } catch (e) {
          console.error('Cache parse error:', e);
        }
      }

      console.log('🔄 Randomizing 7 Denuvo games (Every 30 mins)...');
      
      // Shuffle and pick 7 random games from DENUVO_GAMES_LIST (using verified list directly)
      // Ensure we use the verified names from DENUVO_GAMES_LIST
      const shuffled = [...DENUVO_GAMES_LIST].sort(() => 0.5 - Math.random());
      const selectedGames = shuffled.slice(0, 7);
      
      console.log('🎲 Selected Denuvo games:', selectedGames.map(g => g.name));
      
      // Fetch game details from backend for these IDs
      try {
        const promises = selectedGames.map(async (baseGame) => {
          const appId = baseGame.id;
          try {
            // Try to get from games collection first for metadata
            const response = await fetch(`http://localhost:3000/api/games/${appId}`);
            if (response.ok) {
              const data = await response.json();
              return {
                id: appId,
                appId: appId,
                title: baseGame.name, // STRICT: Always use verified name from hardcoded list
                name: baseGame.name,  // STRICT: Always use verified name from hardcoded list
                description: data.description || data.short_description || '',
                developer: data.developer || data.developers?.[0] || 'Unknown',
                cover: data.headerImage || `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_hero.jpg`,
                headerImage: data.headerImage || `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
                rating: data.rating || 0,
                size: data.size || '50 GB',
              };
            }
            
            // Fallback: create basic game object
            return {
              id: appId,
              appId: appId,
              title: baseGame.name, // STRICT
              name: baseGame.name,  // STRICT
              cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_hero.jpg`,
              headerImage: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
              developer: 'Unknown',
              description: 'Denuvo protected game',
            };
          } catch (error) {
            console.error(`Error fetching game ${appId}:`, error);
            return {
              id: appId,
              appId: appId,
              title: baseGame.name, // STRICT
              name: baseGame.name,  // STRICT
              cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_hero.jpg`,
              headerImage: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
            };
          }
        });
        
        const gamesWithDetails = await Promise.all(promises);
        
        // Filter out any failed fetches (should be rare with fallbacks)
        const validGames = gamesWithDetails.filter(game => game !== null);
        
        if (validGames.length > 0) {
          // Fetch logos from SteamGridDB for each game
          try {
            const logoPromises = validGames.map(async (game) => {
              try {
                // Try to fetch logo from SteamGridDB
                const logoResponse = await fetch(`http://localhost:3000/api/steamgriddb/logo/${game.id}`);
                if (logoResponse.ok) {
                  const logoData = await logoResponse.json();
                  return {
                    ...game,
                    logo: logoData.logo || null
                  };
                }
                // Fallback to direct SteamGridDB URL if API fails (client-side try)
                return {
                    ...game,
                    logo: `https://cdn2.steamgriddb.com/steam/${game.id}/logo.png`
                };
              } catch (error) {
                console.error(`Error fetching logo for ${game.id}:`, error);
                // Fallback to direct URL
                return {
                    ...game,
                    logo: `https://cdn2.steamgriddb.com/steam/${game.id}/logo.png`
                };
              }
            });
            
            const gamesWithLogos = await Promise.all(logoPromises);
            
            setDenuvoGames(gamesWithLogos);
            setFeaturedGames(gamesWithLogos);
            
            localStorage.setItem(cacheKey, JSON.stringify(gamesWithLogos));
            localStorage.setItem(cacheTimeKey, Date.now().toString());
            
            console.log(`✅ Randomized & Saved 7 Denuvo games with logos. Verified names maintained.`);
          } catch (logoError) {
            console.error('Error fetching logos:', logoError);
            // Use games without logos
            setDenuvoGames(validGames);
            setFeaturedGames(validGames);
            
            localStorage.setItem(cacheKey, JSON.stringify(validGames));
            localStorage.setItem(cacheTimeKey, Date.now().toString());
            
            console.log(`✅ Randomized & Saved 7 Denuvo games (without logos). Verified names maintained.`);
          }
        } else {
          throw new Error('No valid games found');
        }
        
      } catch (error) {
        console.error('Error fetching game details:', error);
        throw error;
      }
      
    } catch (error) {
      console.error('❌ Error in fetchDenuvoFeaturedGames:', error);
      
      // Ultimate fallback: use hardcoded popular games (with verified names manually)
      const fallbackGames = [
        { id: 2358720, title: 'Black Myth: Wukong', name: 'Black Myth: Wukong', cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2358720/library_hero.jpg', developer: 'Game Science' },
        { id: 1285190, title: 'Borderlands 4', name: 'Borderlands 4', cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1285190/library_hero.jpg', developer: 'Gearbox Software' },
        { id: 1091500, title: 'Cyberpunk 2077', name: 'Cyberpunk 2077', cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_hero.jpg', developer: 'CD PROJEKT RED' },
        { id: 1174180, title: 'Red Dead Redemption 2', name: 'Red Dead Redemption 2', cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_hero.jpg', developer: 'Rockstar Games' },
        { id: 1245620, title: 'ELDEN RING', name: 'ELDEN RING', cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_hero.jpg', developer: 'FromSoftware' },
        { id: 1593500, title: 'God of War', name: 'God of War', cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/library_hero.jpg', developer: 'Santa Monica Studio' },
        { id: 1551360, title: 'Forza Horizon 5', name: 'Forza Horizon 5', cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/library_hero.jpg', developer: 'Playground Games' },
      ];
      
      console.log('⚠️ Using hardcoded fallback games due to error');
      setDenuvoGames(fallbackGames);
      setFeaturedGames(fallbackGames);
    }
  }, []);

  // ============================================
  // FETCH GAMES
  // ============================================
  const fetchGames = useCallback(async (page = 1, append = false) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        search,
        category: selectedCategory
      });
      
      const response = await fetch(`http://localhost:3000/api/games?${params}`);
      const data = await response.json();
      
      const transformedGames = data.games.map(game => ({
        ...game,
        cover: game.headerImage || `http://localhost:3000/api/steam/image/${game.appId || game.id}/header`,
        id: game.appId || game.id
      }));
      
      if (append) {
        setGames(prev => [...prev, ...transformedGames]);
      } else {
        setGames(transformedGames);
      }
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, selectedCategory]);

  // ============================================
  // FETCH EPIC SALES
  // ============================================
  const fetchEpicSales = async () => {
    try {
      const cacheKey = 'epic_sales_cache';
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheKey + '_time');
      const CACHE_DURATION = 4 * 60 * 60 * 1000;

      if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATION) {
        const cachedData = JSON.parse(cached);
        setEpicSales(cachedData.sales);
        setEpicLastUpdated(cachedData.lastUpdated);
        return;
      }

      const response = await fetch('http://localhost:3000/api/sales/epic/free');
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        const sliced = data.data.slice(0, 6);
        setEpicSales(sliced);
        setEpicLastUpdated(data.lastUpdated);
        localStorage.setItem(cacheKey, JSON.stringify({ sales: sliced, lastUpdated: data.lastUpdated }));
        localStorage.setItem(cacheKey + '_time', Date.now().toString());
      } else {
        setEpicSales([
          { id: 1, title: 'Control', image: 'https://cdn1.epicgames.com/offer/9bcf5a4dc1d54cb6ab1a42f3a70c5cf4/EGS_Control_RemedyEntertainment_S1_2560x1440-c7c10b0ac2d6fc1e3b5e5a8e8e8e8e8e', discount: 'FREE', originalPrice: '$29.99', discountPrice: 'FREE', url: 'https://store.epicgames.com/en-US/p/control' },
          { id: 2, title: 'Fallout 3', image: 'https://cdn1.epicgames.com/offer/ac2c3883be2542b98a0268d9d80d50f2/EGS_Fallout3GameoftheYearEdition_BethesdaGameStudios_S1_2560x1440-c7c10b0ac2d6fc1e3b5e5a8e8e8e8e8e', discount: 'FREE', originalPrice: '$19.99', discountPrice: 'FREE', url: 'https://store.epicgames.com/en-US/p/fallout-3-game-of-the-year-edition' },
          { id: 3, title: 'Metro: Last Light Redux', image: 'https://cdn1.epicgames.com/offer/424c217bce8c4cd2a1fcaab9aca2972f/EGS_MetroLastLightRedux_4AGames_S1_2560x1440-c7c10b0ac2d6fc1e3b5e5a8e8e8e8e8e', discount: 'FREE', originalPrice: '$19.99', discountPrice: 'FREE', url: 'https://store.epicgames.com/en-US/p/metro-last-light-redux' },
        ]);
        setEpicLastUpdated(null);
      }
    } catch (error) {
      console.error('Error fetching Epic sales:', error);
      setEpicSales([]);
    }
  };

  // ============================================
  // FETCH STEAM SALES
  // ============================================
  const fetchSteamSales = async () => {
    try {
      const cacheKey = 'steam_sales_cache';
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheKey + '_time');
      const CACHE_DURATION = 4 * 60 * 60 * 1000;

      if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATION) {
        const cachedData = JSON.parse(cached);
        setSteamSales(cachedData.sales);
        setSteamLastUpdated(cachedData.lastUpdated);
        return;
      }

      const response = await fetch('http://localhost:3000/api/sales/steam/featured');
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        const sliced = data.data.slice(0, 6);
        setSteamSales(sliced);
        setSteamLastUpdated(data.lastUpdated);
        localStorage.setItem(cacheKey, JSON.stringify({ sales: sliced, lastUpdated: data.lastUpdated }));
        localStorage.setItem(cacheKey + '_time', Date.now().toString());
      } else {
        setSteamSales([
          { id: 1, title: 'Cyberpunk 2077', image: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg', discount: '50%', originalPrice: '$59.99', discountPrice: '$29.99', url: 'https://store.steampowered.com/app/1091500/Cyberpunk_2077/' },
          { id: 2, title: 'The Witcher 3', image: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg', discount: '70%', originalPrice: '$39.99', discountPrice: '$11.99', url: 'https://store.steampowered.com/app/292030/The_Witcher_3_Wild_Hunt/' },
        ]);
        setSteamLastUpdated(null);
      }
    } catch (error) {
      console.error('Error fetching Steam sales:', error);
      setSteamSales([]);
    }
  };

  // ============================================
  // FETCH TOP SELLERS
  // ============================================
  const fetchTopSellers = async () => {
    try {
      const cacheKey = 'top_sellers_cache';
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheKey + '_time');
      const CACHE_DURATION = 12 * 60 * 60 * 1000;

      if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATION) {
        setTopSellers(JSON.parse(cached));
        return;
      }

      const response = await fetch('http://localhost:3000/api/top-games/top-sellers?limit=5');
      const data = await response.json();
      if (data.success) {
        setTopSellers(data.data);
        localStorage.setItem(cacheKey, JSON.stringify(data.data));
        localStorage.setItem(cacheKey + '_time', Date.now().toString());
      }
    } catch (error) {
      console.error('Error fetching top sellers:', error);
    }
  };

  const fetchMostPlayed = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/top-games/most-played?limit=5');
      const data = await response.json();
      if (data.success) {
        setMostPlayed(data.data);
      }
    } catch (error) {
      console.error('Error fetching most played:', error);
    }
  };

  const fetchTopUpcoming = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/top-games/top-upcoming?limit=5');
      const data = await response.json();
      if (data.success) {
        setTopUpcoming(data.data);
      }
    } catch (error) {
      console.error('Error fetching top upcoming:', error);
    }
  };

  const fetchPopularSearches = async () => {
    try {
      const searches = ['Cyberpunk', 'GTA', 'Resident Evil', 'Call of Duty', 'FIFA', 'Assassin\'s Creed', 'The Witcher', 'Red Dead'];
      setPopularSearches(searches);
    } catch (error) {
      console.error('Error fetching popular searches:', error);
    }
  };

  const fetchRandomGames = async () => {
    try {
      const cacheKey = 'random_games_cache';
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheKey + '_time');
      const CACHE_DURATION = 6 * 60 * 60 * 1000;

      if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATION) {
        setRandomGames(JSON.parse(cached));
        return;
      }

      const response = await fetch('http://localhost:3000/api/games?limit=12');
      const data = await response.json();
      const shuffled = data.games.sort(() => 0.5 - Math.random());
      const randomSlice = shuffled.slice(0, 6);
      setRandomGames(randomSlice);
      localStorage.setItem(cacheKey, JSON.stringify(randomSlice));
      localStorage.setItem(cacheKey + '_time', Date.now().toString());
    } catch (error) {
      console.error('Error fetching random games:', error);
    }
  };

  // ============================================
  // SEARCH FUNCTIONS
  // ============================================
  const performSearch = async (searchQuery) => {
    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:3000/api/search/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      const data = await response.json();
      
      const transformedResults = (data.results || []).map(game => ({
        ...game,
        cover: game.headerImage || `http://localhost:3000/api/steam/image/${game.appId}/header`,
        id: game.appId
      }));
      
      setSearchResults(transformedResults);
      setSuggestions(data.suggestions || []);
      setShowSuggestions(data.suggestions?.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchFocus = () => {
    if (!isSearchMode) {
      setIsSearchMode(true);
      setTimeout(() => searchInputRef.current?.focus(), 500);
    }
  };

  const handleSearchBlur = (e) => {
    if (!search.trim() && !e.currentTarget.contains(e.relatedTarget)) {
      setIsSearchMode(false);
      setShowSuggestions(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClearSearch();
    }
  };

  const handleClearSearch = () => {
    setSearch('');
    setSearchResults([]);
    setSuggestions([]);
    setIsSearchMode(false);
    setShowSuggestions(false);
  };

  const handleClearText = () => {
    setSearch('');
    setSearchResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // ============================================
  // OTHER HANDLERS
  // ============================================
  const loadMoreGames = () => {
    if (pagination.hasNext && !loadingMore) {
      fetchGames(pagination.currentPage + 1, true);
    }
  };

  const refreshSalesData = async () => {
    setRefreshingSales(true);
    try {
      await fetch('http://localhost:3000/api/sales/refresh', { method: 'POST' });
      await Promise.all([fetchEpicSales(), fetchSteamSales()]);
    } catch (error) {
      console.error('Error refreshing sales data:', error);
    } finally {
      setRefreshingSales(false);
    }
  };

  const handleDownloadClick = (game, event) => {
    event.preventDefault();
    event.stopPropagation();
    const gameForDownload = {
      id: game.id || game.appId,
      title: game.title || game.name,
      cover: game.cover || `http://localhost:3000/api/steam/image/${game.id || game.appId}/header`,
      developer: game.developer || 'Unknown',
      size: game.size || '50 GB'
    };
    startDownload(gameForDownload);
  };

  // ============================================
  // CAROUSEL NAVIGATION
  // ============================================
  const handlePrevSlide = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentSlide((prev) => prev === 0 ? featuredGames.length - 1 : prev - 1);
  };

  const handleNextSlide = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % featuredGames.length);
  };

  const handleDotClick = (index, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentSlide(index);
  };

  // ============================================
  // USE EFFECTS
  // ============================================
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSortMenu(false);
      setShowGridMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
    window.dispatchEvent(new Event('sidebarToggle'));
  }, [sidebarCollapsed]);

  useEffect(() => {
    fetchDenuvoFeaturedGames();
    fetchGames();
    fetchRandomGames();
    fetchPopularSearches();
    fetchEpicSales();
    fetchSteamSales();
    fetchTopSellers();
    fetchMostPlayed();
    fetchTopUpcoming();
    
    // Auto-refresh Denuvo games every 30 minutes
    const denuvoInterval = setInterval(() => {
        fetchDenuvoFeaturedGames(true); // Force refresh
    }, 30 * 60 * 1000);

    const salesInterval = setInterval(() => {
      fetchEpicSales();
      fetchSteamSales();
    }, 30 * 60 * 1000);
    
    return () => {
        clearInterval(salesInterval);
        clearInterval(denuvoInterval);
    };
  }, [fetchGames, fetchDenuvoFeaturedGames]);

  useEffect(() => {
    if (isSearchMode) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (search.trim().length >= 2) {
        debounceRef.current = setTimeout(() => performSearch(search), 300);
      } else {
        setSearchResults([]);
        setSuggestions([]);
        setShowSuggestions(false);
      }
      return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    } else {
      const delayedSearch = setTimeout(() => fetchGames(1, false), 500);
      return () => clearTimeout(delayedSearch);
    }
  }, [search, selectedCategory, isSearchMode]);

  // Auto-slide carousel
  useEffect(() => {
    if (featuredGames.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredGames.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredGames.length]);

  // Auto-scroll popular games
  useEffect(() => {
    if (games.length === 0) return;
    const timer = setInterval(() => {
      setPopularSlide((prev) => (prev + 1) % Math.min(games.length, 7));
    }, 5000);
    return () => clearInterval(timer);
  }, [games.length]);

  const categories = ['All', 'Action', 'RPG', 'Adventure', 'Shooter', 'Strategy', 'Horror', 'Racing', 'Stealth'];

  // ============================================
  // RENDER JSX
  // ============================================
  
  // DEBUG: Log để kiểm tra
  console.log('🎮 Featured Games:', featuredGames.length, 'games');
  console.log('🔍 Search Mode:', isSearchMode);
  console.log('📊 Featured Games Data:', featuredGames);
  
  return (
    <>
      {/* ============================================ */}
      {/* DENUVO FEATURED GAMES CAROUSEL - 7 GAMES */}
      {/* ============================================ */}
      {featuredGames.length > 0 && !isSearchMode && (
        <div className="relative h-[700px] overflow-hidden mb-8 mt-[104px]">
          {/* Lighter gradient overlay for better visibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40 pointer-events-none z-10" />
          
          {featuredGames.map((game, index) => (
            <div
              key={game.id}
              className={`absolute inset-0 transition-all duration-1000 ease-out ${
                index === currentSlide ? 'opacity-100 scale-100 z-[1]' : 'opacity-0 scale-100 z-0'
              }`}
            >
              <Link to={`/game/${game.id}`} className="absolute inset-0 cursor-pointer group">
                {/* Hero Image with better sizing - use library_hero for quality, object-cover for fit */}
                <img
                  src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/library_hero.jpg`}
                  alt={game.title}
                  className={`w-full h-full object-cover object-center transition-all duration-1000 ${
                    index === currentSlide ? 'scale-100 brightness-110' : 'scale-100 brightness-100'
                  } group-hover:scale-105 group-hover:brightness-125`}
                  onError={(e) => {
                    // Fallback to header if hero fails
                    e.target.src = game.cover || `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/header.jpg`;
                  }}
                />
                {/* Lighter gradient for better visibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent group-hover:via-black/10 transition-all duration-500" />
                
                {index === currentSlide && (
                  <div className="absolute top-8 left-8 z-20 animate-slideInLeft">
                    <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-red-600 via-red-500 to-orange-600 rounded-full shadow-2xl border border-red-400/30 backdrop-blur-sm">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.86-.96-7-5.36-7-9V8.77l7-3.11 7 3.11V11c0 3.64-3.14 8.04-7 9z"/>
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider">Protected by</span>
                        <span className="text-sm font-black">DENUVO</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="absolute inset-0 flex items-end p-12 md:p-16 z-10">
                  <div className={`max-w-4xl w-full transition-all duration-1000 ${
                    index === currentSlide ? 'translate-x-0 opacity-100 delay-300' : '-translate-x-20 opacity-0'
                  }`}>
                    {/* Game Logo from SteamGridDB or Title */}
                    <div className="h-40 mb-6 flex items-end justify-start">
                        {game.logo ? (
                          <img 
                            src={game.logo} 
                            alt={game.title}
                            className="max-w-[400px] max-h-[160px] object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] filter brightness-110 contrast-110"
                            onError={(e) => {
                              // Fallback to text title if logo fails
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'block';
                            }}
                          />
                        ) : (
                             // Attempt to load direct if prop missing (backup)
                             <img 
                                src={`https://cdn2.steamgriddb.com/steam/${game.id}/logo.png`} 
                                alt={game.title}
                                className="max-w-[400px] max-h-[160px] object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] filter brightness-110 contrast-110"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'block';
                                }}
                              />
                        )}
                        {/* Fallback Text Title */}
                        <h2 className={`text-5xl md:text-7xl font-bold drop-shadow-2xl text-white tracking-tight leading-none ${game.logo ? 'hidden' : 'block'}`} style={{ display: 'none' }}>
                          {game.title || game.name}
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <span className="px-4 py-2 bg-red-600/80 backdrop-blur-sm rounded-lg font-bold border border-red-400/30 flex items-center gap-2 shadow-lg">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                        </svg>
                        Denuvo
                      </span>
                      
                      {game.rating && game.rating !== 0 && (
                        <span className="px-4 py-2 bg-yellow-500/30 text-yellow-300 rounded-lg font-bold backdrop-blur-sm border border-yellow-500/20">
                          ⭐ {game.rating}
                        </span>
                      )}
                      
                      {game.developer && (
                        <span className="px-4 py-2 bg-blue-500/30 text-blue-300 rounded-lg backdrop-blur-sm border border-blue-500/20 text-sm font-medium">
                          {game.developer}
                        </span>
                      )}
                      
                      {game.size && (
                        <span className="px-4 py-2 bg-gray-700/50 text-gray-200 rounded-lg text-sm">
                          {game.size}
                        </span>
                      )}
                    </div>
                    
                    {game.description && (
                      <p className="text-xl text-gray-100 mb-6 line-clamp-3 max-w-2xl leading-relaxed drop-shadow-lg">
                        {game.description}
                      </p>
                    )}
                    
                    <div className="flex gap-4 flex-wrap">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/game/${game.id}`;
                        }}
                        className="px-8 py-4 bg-gradient-to-r from-white to-gray-100 text-black rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-white/20 transition-all duration-300 hover:scale-105 flex items-center gap-2 group/btn"
                      >
                        <span className="group-hover/btn:scale-110 transition-transform">▶</span>
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
          
          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {featuredGames.map((_, i) => (
              <button
                key={i}
                onClick={(e) => handleDotClick(i, e)}
                className={`transition-all duration-300 rounded-full ${
                  i === currentSlide 
                    ? 'w-12 h-3 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 shadow-lg shadow-red-500/50' 
                    : 'w-3 h-3 bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          
          {/* Navigation Arrows */}
          <button 
            onClick={handlePrevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/20 hover:border-red-500/60 text-white rounded-full transition-all duration-300 z-20 flex items-center justify-center group shadow-lg"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6 group-hover:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={handleNextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/20 hover:border-red-500/60 text-white rounded-full transition-all duration-300 z-20 flex items-center justify-center group shadow-lg"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6 group-hover:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800/50 z-20">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-red-600 transition-all duration-500 ease-linear shadow-lg shadow-red-500/50"
              style={{ width: `${((currentSlide + 1) / featuredGames.length) * 100}%` }}
            />
          </div>

          {/* Counter */}
          <div className="absolute top-8 right-8 z-20 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
            <span className="text-sm font-bold">
              <span className="text-red-400">{currentSlide + 1}</span>
              <span className="text-gray-400"> / </span>
              <span className="text-white">{featuredGames.length}</span>
            </span>
          </div>
        </div>
      )}
      
      {/* Loading State for Carousel */}
      {!isSearchMode && featuredGames.length === 0 && (
        <div className="h-[700px] flex items-center justify-center bg-gray-900/50 mb-8 mt-[104px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading Denuvo Games...</p>
          </div>
        </div>
      )}

    <div className="min-h-screen relative animate-fadeInSlow" style={{ paddingTop: '0px' }}>
      
      {/* DEBUG INFO */}
      {!isSearchMode && (
        <div className="fixed top-0 left-0 bg-red-500 text-white p-2 z-[999] text-xs">
          DEBUG: Featured={featuredGames.length} | Search={isSearchMode.toString()} | Slide={currentSlide}
        </div>
      )}
      
      {/* ============================================ */}
      {/* SEARCH MODE OVERLAY */}
      {/* ============================================ */}
      {isSearchMode && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] overflow-y-auto transition-all duration-700 ease-out" onClick={handleOverlayClick}>
          <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-gray-800/50 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <button onClick={handleClearSearch} className="text-gray-400 hover:text-white transition-colors p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-xl font-bold text-white">Search Games</h2>
              </div>
              <div className="relative bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-2xl">
                <div className="flex items-center p-4">
                  <svg className="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onBlur={handleSearchBlur}
                    placeholder="Search for games... (e.g., resident, cyberpunk, gta)"
                    className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
                  />
                  {isSearching && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400 mr-3"></div>
                  )}
                  {search && (
                    <button onClick={handleClearText} className="text-gray-400 hover:text-white transition-colors p-1 mr-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button 
                    onClick={() => search.trim() && performSearch(search)} 
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            {search && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Search Results for "{search}"</h2>
                <p className="text-gray-400">{isSearching ? 'Searching...' : `Found ${searchResults.length} games`}</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {searchResults.map((game) => (
                  <Link 
                    key={game.appId} 
                    to={`/game/${game.appId}`}
                    className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-900 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
                  >
                    <img 
                      src={`https://cdn2.steamgriddb.com/steam_grid/${game.appId}.png`}
                      alt={game.name}
                      className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-110"
                      loading="lazy"
                      onError={(e) => {
                        if (e.target.src.includes('steamgriddb')) {
                          e.target.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/library_600x900.jpg`;
                        } else if (e.target.src.includes('library_600x900')) {
                          e.target.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/header.jpg`;
                        } else {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900"><span class="text-gray-500 text-sm text-center px-4">${game.name}</span></div>`;
                        }
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <img 
                        src={`https://cdn2.steamgriddb.com/steam/${game.appId}/logo.png`}
                        alt={`${game.name} logo`}
                        className="max-w-[80%] max-h-[40%] object-contain drop-shadow-2xl"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                      <span className={`${getMatchTypeColor(game.matchType)}`}>{game.score}%</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                          {game.name}
                        </span>
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-300">{getMatchTypeLabel(game.matchType)}</span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDownloadClick(game, e);
                          }}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded text-sm transition-colors font-medium"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {search && !isSearching && searchResults.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No games found</h3>
                <p className="text-gray-400">Try searching with different keywords or check the spelling</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* COMPACT TOP HEADER */}
      {/* ============================================ */}
      {!isSearchMode && (
      <div className="fixed top-8 left-0 right-0 z-[60] bg-black/95 backdrop-blur-xl border-b border-gray-800 shadow-lg">
        <div className="px-6 py-3 flex items-center justify-between">
          <button 
            onClick={() => {
              const newState = !sidebarCollapsed;
              setSidebarCollapsed(newState);
              localStorage.setItem('sidebarCollapsed', newState);
              window.dispatchEvent(new Event('sidebarToggle'));
            }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img src="/Saitma-Meme-PNG-758x473-removebg-preview.png" alt="Logo" className="w-7 h-7 object-contain" />
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">crackvÃ¬nghÃ¨o</h1>
            <span className="px-2 py-1 bg-gray-800 rounded-full text-xs">{pagination.totalGames}</span>
          </button>
          
          <div className="flex-1 max-w-md mx-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search games..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={handleSearchFocus}
                className="w-full bg-gray-900/70 border border-gray-700/50 rounded-lg px-3 py-2 pl-9 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 transition-all duration-300"
              />
              <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a 
              href="https://discord.gg/VxMDfTSq" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                openExternal.discord('VxMDfTSq');
              }}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
              title="Join Discord"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>

            {/* View Controls */}
            <div className="flex gap-1 mr-3">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-1.5 rounded transition ${viewMode === 'grid' ? 'bg-cyan-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                title="Grid view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-1.5 rounded transition ${viewMode === 'list' ? 'bg-cyan-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                title="List view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            {/* Auth Buttons */}
            {localStorage.getItem('user') ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshSalesData}
                  disabled={refreshingSales}
                  className="p-1.5 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 rounded transition-colors"
                  title="Refresh sales data"
                >
                  <svg className={`w-4 h-4 ${refreshingSales ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <Link 
                  to="/profile" 
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 hover:bg-gray-700/80 rounded-lg transition-all duration-300 border border-gray-700/50 hover:border-cyan-500/50"
                >
                  <img 
                    src="/Saitma-Meme-PNG-758x473-removebg-preview.png" 
                    alt="Avatar" 
                    className="w-5 h-5 rounded-full object-contain" 
                  />
                  <span className="text-xs text-white">
                    {JSON.parse(localStorage.getItem('user')).name || 'User'}
                  </span>
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.reload();
                  }}
                  className="px-2 py-1.5 text-gray-400 hover:text-red-400 transition-colors text-xs"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshSalesData}
                  disabled={refreshingSales}
                  className="p-1.5 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 rounded transition-colors"
                  title="Refresh sales data"
                >
                  <svg className={`w-4 h-4 ${refreshingSales ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <Link 
                  to="/login" 
                  className="px-3 py-1.5 text-gray-300 hover:text-white transition-colors text-xs font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 text-xs"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ============================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================ */}
      <div className="p-8">
        {/* Top Sellers, Most Played, Top Upcoming */}
        {!loading && games.length > 0 && (
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Top Sellers */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">🏆 Top Sellers</h2>
                <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                {games.slice(0, 5).map((game, index) => (
                  <Link key={game.id} to={`/game/${game.id}`} className="flex gap-4 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-all duration-300 group">
                    <div className="relative">
                      <img src={game.cover} alt={game.title} className="w-20 h-28 object-cover rounded" onError={(e) => e.target.src = 'https://via.placeholder.com/80x112/1f1f2e/888888?text=Game'} />
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-black shadow-lg">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm mb-1 group-hover:text-cyan-400 transition-colors line-clamp-2">{getDisplayTitle(game)}</h3>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 bg-cyan-600 rounded font-bold">-50%</span>
                          <span className="text-gray-400 line-through">$59.99</span>
                          <span className="text-white font-bold">$29.99</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Most Played */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">🎮 Most Played</h2>
                <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                {games.slice(5, 10).map((game, index) => (
                  <Link key={game.id} to={`/game/${game.id}`} className="flex gap-4 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-all duration-300 group">
                    <div className="relative">
                      <img src={game.cover} alt={game.title} className="w-20 h-28 object-cover rounded" onError={(e) => e.target.src = 'https://via.placeholder.com/80x112/1f1f2e/888888?text=Game'} />
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-xs font-bold text-black shadow-lg">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm mb-1 group-hover:text-cyan-400 transition-colors line-clamp-2">{getDisplayTitle(game)}</h3>
                        <div className="text-xs">
                          <span className="px-2 py-0.5 bg-green-600/30 text-green-300 rounded font-bold">Free</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Top Upcoming */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">🔥 Top Upcoming</h2>
                <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                {games.slice(10, 15).map((game, index) => (
                  <Link key={game.id} to={`/game/${game.id}`} className="flex gap-4 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-all duration-300 group">
                    <div className="relative">
                      <img src={game.cover} alt={game.title} className="w-20 h-28 object-cover rounded" onError={(e) => e.target.src = 'https://via.placeholder.com/80x112/1f1f2e/888888?text=Game'} />
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-black shadow-lg">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm mb-1 group-hover:text-cyan-400 transition-colors line-clamp-2">{getDisplayTitle(game)}</h3>
                        <div className="text-xs text-gray-400 mb-1">Coming Soon</div>
                      </div>
                      <div className="text-sm text-white font-bold">$49.99</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              <span className="text-lg">Loading games...</span>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* EPIC GAMES SALE SECTION */}
        {/* ============================================ */}
        {!loading && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <h2 className="text-2xl font-bold">Epic Games Sale</h2>
              </div>
              <span className="px-3 py-1 bg-purple-600 rounded-full text-sm font-bold">Up to 75% OFF</span>
              <LastUpdated timestamp={epicLastUpdated} />
            </div>
            <a href="https://store.epicgames.com/en-US/free-games" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium">
              See All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {epicSales.length > 0 ? epicSales.map((game, index) => (
              <div key={index} className="flex-shrink-0 w-48 group cursor-pointer" onClick={(e) => {
                e.preventDefault();
                openExternal.epic(game.url);
              }}>
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-gray-800">
                  <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => e.target.src = 'https://via.placeholder.com/300x400/1f1f2e/888888?text=Epic+Game'} />
                  {game.discount !== "0%" && (
                    <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
                      {game.discount}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-purple-400 transition-colors line-clamp-2">{game.title}</h3>
                <div className="flex items-center gap-2">
                  {game.originalPrice !== game.discountPrice && game.originalPrice !== "$0" && (
                    <span className="text-gray-400 line-through text-xs">{game.originalPrice}</span>
                  )}
                  <span className="text-purple-400 font-bold text-sm">{game.discountPrice}</span>
                </div>
              </div>
            )) : (
              <div className="text-gray-400 py-8">Loading Epic sales...</div>
            )}
          </div>
        </div>
        )}

        {/* ============================================ */}
        {/* STEAM SALE SECTION */}
        {/* ============================================ */}
        {!loading && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h2 className="text-2xl font-bold">Steam Sale</h2>
              </div>
              <span className="px-3 py-1 bg-blue-600 rounded-full text-sm font-bold">Weekend Deal</span>
              <LastUpdated timestamp={steamLastUpdated} />
            </div>
            <a href="https://store.steampowered.com/specials" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium">
              See All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {steamSales.length > 0 ? steamSales.map((game, index) => (
              <div key={index} className="flex-shrink-0 w-48 group cursor-pointer" onClick={(e) => {
                e.preventDefault();
                openExternal.steam(game.id);
              }}>
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-gray-800">
                  <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => e.target.src = 'https://via.placeholder.com/300x400/1f1f2e/888888?text=Steam+Game'} />
                  {game.discount && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
                      {game.discount}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-blue-400 transition-colors line-clamp-2">{game.title}</h3>
                <div className="flex items-center gap-2">
                  {game.originalPrice && (
                    <span className="text-gray-400 line-through text-xs">{game.originalPrice}</span>
                  )}
                  <span className="text-blue-400 font-bold text-sm">{game.discountPrice}</span>
                </div>
              </div>
            )) : (
              <div className="text-gray-400 py-8">Loading Steam sales...</div>
            )}
          </div>
        </div>
        )}

        {/* ============================================ */}
        {/* BROWSE BY TAGS */}
        {/* ============================================ */}
        {!loading && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🏷️ Browse by Tags</h2>
            <Link to="/tags" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
              See All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {['Action', 'RPG', 'Adventure', 'Shooter', 'Strategy', 'Horror', 'Racing', 'Stealth', 'Puzzle', 'Sports'].map(tag => (
              <Link 
                key={tag} 
                to={`/tags?tag=${tag}`} 
                className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-cyan-600 hover:to-cyan-500 rounded-lg font-medium transition-all duration-300 hover:scale-105 whitespace-nowrap shadow-lg hover:shadow-cyan-500/20"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
        )}

        {/* ============================================ */}
        {/* GAMES GRID */}
        {/* ============================================ */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5' : 'flex flex-col gap-4'}>
          {games.map(game => {
            const displayTitle = getDisplayTitle(game);
            const isDenuvo = DENUVO_GAME_IDS.includes(parseInt(game.id));
            return (
              <div 
                key={game.id} 
                className="group relative"
                onMouseEnter={(e) => handleGameHover(game, e)}
                onMouseLeave={handleGameLeave}
              >
                {viewMode === 'grid' ? (
                  <Link to={`/game/${game.id}`} className="block relative rounded-xl overflow-hidden bg-gray-900 transition-all duration-500 hover:scale-105 hover:z-10 hover:shadow-2xl hover:shadow-cyan-500/50" style={{ aspectRatio: '2/3' }}>
                    <img 
                      src={`https://cdn2.steamgriddb.com/steam_grid/${game.id}.png`}
                      alt={displayTitle}
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                      onError={(e) => {
                        if (e.target.src.includes('steamgriddb')) {
                          e.target.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/library_600x900.jpg`;
                        } else if (e.target.src.includes('library_600x900')) {
                          e.target.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/header.jpg`;
                        } else {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900"><span class="text-gray-500 text-sm text-center px-4">${displayTitle}</span></div>`;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 ring-0 group-hover:ring-2 ring-cyan-500/40 rounded-xl transition-all duration-500" />
                    
                    {/* Logo overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <img 
                        src={`https://cdn2.steamgriddb.com/steam/${game.id}/logo.png`}
                        alt={`${displayTitle} logo`}
                        className="max-w-[70%] max-h-[30%] object-contain drop-shadow-2xl opacity-0 group-hover:opacity-90 transition-opacity duration-500"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                    
                    {/* Title on hover */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-1 group-hover:translate-y-0 transition-all duration-300 opacity-0 group-hover:opacity-100">
                      <h3 className="font-bold text-sm line-clamp-2 mb-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                          {displayTitle}
                        </span>
                      </h3>
                      <div className="flex items-center gap-2 text-xs">
                        {isDenuvo && (
                          <span className="px-2 py-0.5 bg-red-600/80 text-white rounded font-bold flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                            </svg>
                            D
                          </span>
                        )}
                        {game.rating && <span className="px-2 py-0.5 bg-yellow-500/80 text-white rounded font-bold">â­ {game.rating}</span>}
                        {game.size && <span className="text-gray-300">{game.size}</span>}
                      </div>
                    </div>
                    
                    {/* Denuvo Badge (top-right, always visible) */}
                    {isDenuvo && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="px-2 py-1 bg-red-600/90 backdrop-blur-sm rounded text-xs font-bold flex items-center gap-1 shadow-lg">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                          </svg>
                          D
                        </div>
                      </div>
                    )}
                  </Link>
                ) : (
                  <Link to={`/game/${game.id}`} className="flex gap-4 p-4 bg-gray-900/50 rounded-xl hover:bg-gray-800/70 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-500">
                    <img src={game.cover} alt={displayTitle} className="w-32 h-44 object-cover rounded-lg transition-transform duration-500 hover:scale-105" />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold group-hover:text-cyan-400 transition-colors duration-300">{displayTitle}</h3>
                          {isDenuvo && (
                            <span className="px-2 py-1 bg-red-600/80 text-white rounded text-xs font-bold flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                              </svg>
                              Denuvo
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{game.developer}</p>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{game.description}</p>
                        <div className="flex items-center gap-3">
                          {game.rating && <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm font-bold">â­ {game.rating}</span>}
                          {game.genres && <span className="text-sm text-gray-400">{game.genres}</span>}
                          {game.size && <span className="text-sm text-gray-500">{game.size}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* ============================================ */}
        {/* LOAD MORE BUTTON */}
        {/* ============================================ */}
        {pagination.hasNext && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMoreGames}
              disabled={loadingMore}
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 rounded-lg font-medium transition flex items-center gap-2 shadow-lg hover:shadow-cyan-500/50"
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Loading...
                </>
              ) : (
                <>
                  Load More Games
                  <span className="text-sm opacity-75">({pagination.totalGames - games.length} remaining)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* HOVER POPUP CARD */}
      {/* ============================================ */}
      {hoveredGame && (
        <div 
          className="fixed z-[100] w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 pointer-events-none animate-fadeInSlow"
          style={{ 
            top: Math.min(popupPosition.top, window.innerHeight - 400), // Prevent going off bottom
            left: popupPosition.left
          }}
        >
          <div className="relative h-48">
            <img 
              src={hoveredGame.cover} 
              alt={hoveredGame.title} 
              className="w-full h-full object-cover"
              onError={(e) => e.target.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${hoveredGame.id}/header.jpg`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
            
            {DENUVO_GAME_IDS.includes(parseInt(hoveredGame.id)) && (
              <div className="absolute top-3 right-3 px-2 py-1 bg-red-600/90 backdrop-blur-md rounded-lg text-xs font-bold shadow-lg border border-red-500/30 flex items-center gap-1 text-white">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
                DENUVO
              </div>
            )}
          </div>
          
          <div className="p-5 -mt-10 relative z-10">
            <h3 className="font-bold text-xl text-white mb-2 leading-tight drop-shadow-md">
              {getDisplayTitle(hoveredGame)}
            </h3>
            
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300">
                {hoveredGame.developer || 'Unknown Dev'}
              </span>
              {hoveredGame.rating && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded text-xs font-bold">
                  ★ {hoveredGame.rating}
                </span>
              )}
              <span className="text-xs text-gray-500">{hoveredGame.size}</span>
            </div>
            
            <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
              {hoveredGame.description || 'No description available.'}
            </p>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* CSS ANIMATIONS */}
      {/* ============================================ */}
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInSlow {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.8s ease-out;
        }
        
        .animate-fadeInSlow {
          animation: fadeInSlow 0.5s ease-out;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
    </>
  );
}

// ============================================
// END OF STORE.JSX
// ============================================
