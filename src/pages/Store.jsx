import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import SteamNameService from '../services/steamNames';
import { DownloadContext } from '../context/DownloadContext';
import LastUpdated from '../components/LastUpdated';
import { openExternal } from '../utils/openExternal';

export default function Store() {
  const { t } = useLanguage();
  const { startDownload } = useContext(DownloadContext);
  const [games, setGames] = useState([]);
  const [featuredGames, setFeaturedGames] = useState([]);
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
  const [downloadPopup, setDownloadPopup] = useState(null);
  const [animatingGame, setAnimatingGame] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showGridMenu, setShowGridMenu] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalGames: 0,
    hasNext: false
  });

  const [popularSlide, setPopularSlide] = useState(0);
  
  // Get display title - use database title first
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
  
  // Auto-scroll popular games every 5 seconds
  useEffect(() => {
    if (games.length === 0) return;
    const timer = setInterval(() => {
      setPopularSlide((prev) => (prev + 1) % Math.min(games.length, 7));
    }, 5000);
    return () => clearInterval(timer);
  }, [games.length]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [randomGames, setRandomGames] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowSortMenu(false);
      setShowGridMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
      
      // Transform games to add cover field
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
      const response = await fetch('http://localhost:3000/api/games?limit=12');
      const data = await response.json();
      const shuffled = data.games.sort(() => 0.5 - Math.random());
      setRandomGames(shuffled.slice(0, 6));
    } catch (error) {
      console.error('Error fetching random games:', error);
    }
  };

  const fetchFeaturedGames = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/games/featured');
      const data = await response.json();
      setFeaturedGames(data);
    } catch (error) {
      console.error('Error fetching featured games:', error);
    }
  };

  const fetchEpicSales = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/sales/epic/free');
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setEpicSales(data.data.slice(0, 6));
        setEpicLastUpdated(data.lastUpdated);
      } else {
        // Fallback to mock data if API fails or no data
        setEpicSales([
          { id: 1, title: 'Control', image: 'https://cdn1.epicgames.com/offer/9bcf5a4dc1d54cb6ab1a42f3a70c5cf4/EGS_Control_RemedyEntertainment_S1_2560x1440-c7c10b0ac2d6fc1e3b5e5a8e8e8e8e8e', discount: 'FREE', originalPrice: '$29.99', discountPrice: 'FREE', url: 'https://store.epicgames.com/en-US/p/control' },
          { id: 2, title: 'Fallout 3', image: 'https://cdn1.epicgames.com/offer/ac2c3883be2542b98a0268d9d80d50f2/EGS_Fallout3GameoftheYearEdition_BethesdaGameStudios_S1_2560x1440-c7c10b0ac2d6fc1e3b5e5a8e8e8e8e8e', discount: 'FREE', originalPrice: '$19.99', discountPrice: 'FREE', url: 'https://store.epicgames.com/en-US/p/fallout-3-game-of-the-year-edition' },
          { id: 3, title: 'Metro: Last Light Redux', image: 'https://cdn1.epicgames.com/offer/424c217bce8c4cd2a1fcaab9aca2972f/EGS_MetroLastLightRedux_4AGames_S1_2560x1440-c7c10b0ac2d6fc1e3b5e5a8e8e8e8e8e', discount: 'FREE', originalPrice: '$19.99', discountPrice: 'FREE', url: 'https://store.epicgames.com/en-US/p/metro-last-light-redux' },
          { id: 4, title: 'Borderlands 3', image: 'https://cdn1.epicgames.com/offer/9773aa1aa54f4f7b80e44bef04986cea/EGS_Borderlands3_GearboxSoftware_S1_2560x1440-c7c10b0ac2d6fc1e3b5e5a8e8e8e8e8e', discount: '75%', originalPrice: '$59.99', discountPrice: '$14.99', url: 'https://store.epicgames.com/en-US/p/borderlands-3' },
          { id: 5, title: 'Assassins Creed Valhalla', image: 'https://cdn1.epicgames.com/offer/9bcf5a4dc1d54cb6ab1a42f3a70c5cf4/EGS_AssassinsCreedValhalla_Ubisoft_S1_2560x1440-c7c10b0ac2d6fc1e3b5e5a8e8e8e8e8e', discount: '60%', originalPrice: '$59.99', discountPrice: '$23.99', url: 'https://store.epicgames.com/en-US/p/assassins-creed-valhalla' },
          { id: 6, title: 'Grand Theft Auto V', image: 'https://cdn1.epicgames.com/0584d2013f0149a791e7b9bad0eec102/offer/GTAV_EGS_Artwork_1200x1600_Portrait%20Store%20Banner-1200x1600-382243057711adf80322ed2aeea42191.jpg', discount: 'FREE', originalPrice: '$29.99', discountPrice: 'FREE', url: 'https://store.epicgames.com/en-US/p/grand-theft-auto-v' }
        ]);
        setEpicLastUpdated(null);
      }
    } catch (error) {
      console.error('Error fetching Epic sales:', error);
      setEpicSales([]);
      setEpicLastUpdated(null);
    }
  };

  const fetchSteamSales = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/sales/steam/featured');
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setSteamSales(data.data.slice(0, 6));
        setSteamLastUpdated(data.lastUpdated);
      } else {
        // Fallback to mock data if API fails or no data
        setSteamSales([
          { id: 1, title: 'Cyberpunk 2077', image: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg', discount: '50%', originalPrice: '$59.99', discountPrice: '$29.99', url: 'https://store.steampowered.com/app/1091500/Cyberpunk_2077/' },
          { id: 2, title: 'The Witcher 3', image: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg', discount: '70%', originalPrice: '$39.99', discountPrice: '$11.99', url: 'https://store.steampowered.com/app/292030/The_Witcher_3_Wild_Hunt/' },
          { id: 3, title: 'Red Dead Redemption 2', image: 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg', discount: '60%', originalPrice: '$59.99', discountPrice: '$23.99', url: 'https://store.steampowered.com/app/1174180/Red_Dead_Redemption_2/' },
          { id: 4, title: 'Elden Ring', image: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg', discount: '30%', originalPrice: '$59.99', discountPrice: '$41.99', url: 'https://store.steampowered.com/app/1245620/ELDEN_RING/' },
          { id: 5, title: 'God of War', image: 'https://cdn.akamai.steamstatic.com/steam/apps/1593500/header.jpg', discount: '50%', originalPrice: '$49.99', discountPrice: '$24.99', url: 'https://store.steampowered.com/app/1593500/God_of_War/' },
          { id: 6, title: 'Horizon Zero Dawn', image: 'https://cdn.akamai.steamstatic.com/steam/apps/1151640/header.jpg', discount: '60%', originalPrice: '$49.99', discountPrice: '$19.99', url: 'https://store.steampowered.com/app/1151640/Horizon_Zero_Dawn_Complete_Edition/' }
        ]);
        setSteamLastUpdated(null);
      }
    } catch (error) {
      console.error('Error fetching Steam sales:', error);
      setSteamSales([]);
      setSteamLastUpdated(null);
    }
  };

  const fetchTopSellers = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/top-games/top-sellers?limit=5');
      const data = await response.json();
      if (data.success) {
        setTopSellers(data.data);
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

  const loadMoreGames = () => {
    if (pagination.hasNext && !loadingMore) {
      fetchGames(pagination.currentPage + 1, true);
    }
  };

  const refreshSalesData = async () => {
    setRefreshingSales(true);
    try {
      // Force refresh sales data
      await fetch('http://localhost:3000/api/sales/refresh', { method: 'POST' });
      // Refetch the data
      await Promise.all([fetchEpicSales(), fetchSteamSales()]);
    } catch (error) {
      console.error('Error refreshing sales data:', error);
    } finally {
      setRefreshingSales(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
    window.dispatchEvent(new Event('sidebarToggle'));
  }, [sidebarCollapsed]);

  useEffect(() => {
    fetchFeaturedGames();
    fetchGames();
    fetchRandomGames();
    fetchPopularSearches();
    fetchEpicSales();
    fetchSteamSales();
    fetchTopSellers();
    fetchMostPlayed();
    fetchTopUpcoming();
    
    // Auto-refresh sales data every 30 minutes
    const salesInterval = setInterval(() => {
      fetchEpicSales();
      fetchSteamSales();
    }, 30 * 60 * 1000);
    
    return () => clearInterval(salesInterval);
  }, [fetchGames]);

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

  const performSearch = async (searchQuery) => {
    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:3000/api/search/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      const data = await response.json();
      
      // Transform search results
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

  const handleSuggestionClick = (suggestion) => {
    setSearch(suggestion.name);
    setShowSuggestions(false);
    performSearch(suggestion.name);
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

  useEffect(() => {
    if (featuredGames.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredGames.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredGames.length]);

  const categories = ['All', 'Action', 'RPG', 'Adventure', 'Shooter', 'Strategy', 'Horror', 'Racing', 'Stealth'];

  const handleDownloadClick = (game, event) => {
    event.preventDefault();
    event.stopPropagation();
    // Ensure game has required fields for download
    const gameForDownload = {
      id: game.id || game.appId,
      title: game.title || game.name,
      cover: game.cover || `http://localhost:3000/api/steam/image/${game.id || game.appId}/header`,
      developer: game.developer || 'Unknown',
      size: game.size || '50 GB'
    };
    startDownload(gameForDownload);
  };

  return (
    <div className="min-h-screen relative animate-fadeInSlow" style={{ paddingTop: '104px' }}>
      {/* Search Mode Overlay */}
      {isSearchMode && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] overflow-y-auto transition-all duration-700 ease-out" onClick={handleOverlayClick}>
          {/* Search Bar */}
          <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-gray-800/50 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <button onClick={handleClearSearch} className="text-gray-400 hover:text-white transition-colors p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
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

              {/* Suggestions - bỏ dropdown suggestions */}
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
                {searchResults.map((game, index) => (
                  <Link 
                    key={game.appId} 
                    to={`/game/${game.appId}`}
                    className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-900 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
                  >
                    <img 
                      src={`http://localhost:3000/api/steam/image/${game.appId}/header`}
                      alt={game.name}
                      className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-110"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/460x215/1f1f2e/888888?text=Game+Cover';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                      <span className={`${getMatchTypeColor(game.matchType)}`}>{game.score}%</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="font-bold text-white text-lg mb-2 line-clamp-2">{game.name}</h3>
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

      {/* Auto-Scroll Popular Games Carousel - TV Showroom Style */}
      {!isSearchMode && games.length > 0 && (
        <div className="px-6 md:px-8 py-8 max-w-7xl mx-auto">
          <div className="relative h-96 overflow-hidden rounded-2xl mb-12">
          {/* Auto-scrolling carousel */}
          <div className="flex transition-transform duration-1000 ease-out" 
            style={{ transform: `translateX(-${popularSlide * 100}%)` }}>
            {games.slice(0, 7).map((game, idx) => (
              <Link
                key={game.id}
                to={`/game/${game.id}`}
                className="relative min-w-full h-96 flex-shrink-0 group cursor-pointer"
              >
                <img
                  src={game.cover || `http://localhost:3000/api/steam/image/${game.id}/header`}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => e.target.src = 'https://via.placeholder.com/1600x400/1f1f2e/888888?text=Game+Cover'}
                />
                {/* Professional gradient overlay - bottom to top */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:via-black/30 transition-all duration-300" />
                
                {/* Game info overlay - positioned at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-12 pb-16">
                  <h3 className="text-5xl font-bold text-white mb-3 drop-shadow-lg line-clamp-2">{game.title}</h3>
                  <p className="text-gray-200 mb-6 line-clamp-2 max-w-3xl text-lg">{game.size}</p>
                </div>
                
                {/* Slide indicator */}
                {idx === popularSlide && (
                  <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg text-white font-bold text-sm">
                    {idx + 1} / 7
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* Navigation dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {games.slice(0, 7).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setPopularSlide(i); }}
                className={`transition-all duration-300 rounded-full ${
                  i === popularSlide 
                    ? 'w-10 h-2 bg-cyan-500 shadow-lg shadow-cyan-500/50' 
                    : 'w-2 h-2 bg-gray-500 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
        </div>
      )}

      {/* Featured Games Carousel */}
      {featuredGames.length > 0 && (
        <div className="relative h-[700px] overflow-hidden rounded-2xl">
          {/* Background blur layers */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black pointer-events-none z-10" />
          
          {featuredGames.map((game, index) => (
            <div
              key={game.id}
              className={`absolute inset-0 transition-all duration-1000 ease-out ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
            >
              <Link to={`/game/${game.id}`} className="absolute inset-0 cursor-pointer group">
                <img
                  src={game.cover}
                  alt={game.title}
                  className={`w-full h-full object-cover transition-all duration-1000 ${index === currentSlide ? 'scale-100' : 'scale-110'} group-hover:scale-105`}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent group-hover:via-black/40 transition-all duration-500" />
                
                {/* Featured Badge */}
                {index === currentSlide && (
                  <div className="absolute top-8 left-8 z-20 animate-slideRight">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 rounded-full shadow-lg">
                      <span className="text-xl">⭐</span>
                      <span className="text-sm font-bold uppercase tracking-widest">Featured</span>
                    </div>
                  </div>
                )}
                
                <div className="absolute inset-0 flex items-end p-12 md:p-16 z-10">
                  <div className={`max-w-4xl w-full transition-all duration-1000 ${index === currentSlide ? 'translate-x-0 opacity-100 delay-300' : '-translate-x-20 opacity-0'}`}>
                    <h2 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-lg">{game.title}</h2>
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <span className="px-4 py-2 bg-yellow-500/30 text-yellow-300 rounded-lg font-bold backdrop-blur-sm border border-yellow-500/20">⭐ {game.rating}</span>
                      <span className="px-4 py-2 bg-blue-500/30 text-blue-300 rounded-lg backdrop-blur-sm border border-blue-500/20 text-sm font-medium">{game.developer}</span>
                      <span className="px-4 py-2 bg-gray-700/50 text-gray-200 rounded-lg text-sm">{game.size}</span>
                    </div>
                    <p className="text-xl text-gray-200 mb-6 line-clamp-3 max-w-2xl leading-relaxed">{game.description}</p>
                    
                    {/* CTA Buttons */}
                    <div className="flex gap-4 flex-wrap">
                      <button className="px-8 py-4 bg-gradient-to-r from-white to-gray-100 text-black rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-white/20 transition-all duration-300 hover:scale-105 flex items-center gap-2 group/btn">
                        <span className="group-hover/btn:scale-110 transition-transform">▶</span>
                        View Details
                      </button>
                      <button className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2">
                        <span>⬇</span>
                        Download
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
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentSlide(i); }}
                className={`transition-all duration-300 rounded-full ${
                  i === currentSlide 
                    ? 'w-12 h-3 bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/50' 
                    : 'w-3 h-3 bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
          
          {/* Navigation Arrows */}
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentSlide(currentSlide === 0 ? featuredGames.length - 1 : currentSlide - 1); }}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/20 hover:border-cyan-500/60 text-white rounded-full transition-all duration-300 z-20 flex items-center justify-center group shadow-lg"
          >
            <svg className="w-6 h-6 group-hover:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentSlide(currentSlide === featuredGames.length - 1 ? 0 : currentSlide + 1); }}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/20 hover:border-cyan-500/60 text-white rounded-full transition-all duration-300 z-20 flex items-center justify-center group shadow-lg"
          >
            <svg className="w-6 h-6 group-hover:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {/* Trending/Featured Games - Epic Games Style */}
      {!isSearchMode && games.length > 0 && (
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 px-6 md:px-8">⚡ Trending Now</h2>
          <div className="px-6 md:px-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {games.slice(0, 12).map((game) => (
              <Link 
                key={game.id} 
                to={`/game/${game.id}`}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-900 transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-cyan-500/40 hover:z-20"
              >
                <img 
                  src={game.cover || `http://localhost:3000/api/steam/image/${game.id}/header`}
                  alt={game.title}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-130"
                  onError={(e) => e.target.src = 'https://via.placeholder.com/300x400/1f1f2e/888888?text=Game'}
                />
                {/* Epic-style overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Rating badge */}
                {game.rating && (
                  <div className="absolute top-3 right-3 bg-yellow-500/90 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    ⭐ {game.rating}
                  </div>
                )}
                
                {/* Game title on hover - bottom positioned */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-all duration-300 opacity-0 group-hover:opacity-100">
                  <h3 className="font-bold text-white text-sm line-clamp-2">{game.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Compact Top Header */}
      {!isSearchMode && (
      <div className="fixed top-8 left-0 right-0 z-[60] bg-black/95 backdrop-blur-xl border-b border-gray-800 shadow-lg">
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Left: Logo Toggle */}
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
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">crackvìnghèo</h1>
            <span className="px-2 py-1 bg-gray-800 rounded-full text-xs">{pagination.totalGames}</span>
          </button>
          
          {/* Center: Compact Search */}
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
          
          {/* Right: Auth & Controls */}
          <div className="flex items-center gap-2">
            {/* Discord Link */}
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-1.5 rounded transition ${viewMode === 'list' ? 'bg-cyan-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                title="List view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
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

      <div className="p-8">
        {/* Top Sellers, Most Played, Top Upcoming */}
        {!loading && games.length > 0 && (
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Top Sellers</h2>
                <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <div className="space-y-4">
                {games.slice(0, 5).map((game) => (
                  <Link key={game.id} to={`/game/${game.id}`} className="flex gap-4 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-all duration-300 group">
                    <img src={game.cover} alt={game.title} className="w-20 h-28 object-cover rounded" onError={(e) => e.target.src = 'https://via.placeholder.com/80x112/1f1f2e/888888?text=Game'} />
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
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Most Played</h2>
                <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <div className="space-y-4">
                {games.slice(5, 10).map((game) => (
                  <Link key={game.id} to={`/game/${game.id}`} className="flex gap-4 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-all duration-300 group">
                    <img src={game.cover} alt={game.title} className="w-20 h-28 object-cover rounded" onError={(e) => e.target.src = 'https://via.placeholder.com/80x112/1f1f2e/888888?text=Game'} />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm mb-1 group-hover:text-cyan-400 transition-colors line-clamp-2">{getDisplayTitle(game)}</h3>
                        <div className="text-xs text-gray-400">Free</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Top Upcoming</h2>
                <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <div className="space-y-4">
                {games.slice(10, 15).map((game) => (
                  <Link key={game.id} to={`/game/${game.id}`} className="flex gap-4 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-all duration-300 group">
                    <img src={game.cover} alt={game.title} className="w-20 h-28 object-cover rounded" onError={(e) => e.target.src = 'https://via.placeholder.com/80x112/1f1f2e/888888?text=Game'} />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm mb-1 group-hover:text-cyan-400 transition-colors line-clamp-2">{getDisplayTitle(game)}</h3>
                        <div className="text-xs text-gray-400">Coming Soon</div>
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

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              <span className="text-lg">Loading games...</span>
            </div>
          </div>
        )}

        {/* Epic Games Sale Section */}
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {epicSales.length > 0 ? epicSales.map((game, index) => (
              <div key={index} className="flex-shrink-0 w-48 group cursor-pointer" onClick={(e) => {
                e.preventDefault();
                openExternal.epic(game.url);
              }}>
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-gray-800">
                  <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => e.target.src = 'https://via.placeholder.com/300x400/1f1f2e/888888?text=Epic+Game'} />
                  {game.discount !== "0%" && (
                    <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
                      {game.discount}
                    </div>
                  )}
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

        {/* Steam Sale Section */}
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {steamSales.length > 0 ? steamSales.map((game, index) => (
              <div key={index} className="flex-shrink-0 w-48 group cursor-pointer" onClick={(e) => {
                e.preventDefault();
                openExternal.steam(game.id);
              }}>
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-gray-800">
                  <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => e.target.src = 'https://via.placeholder.com/300x400/1f1f2e/888888?text=Steam+Game'} />
                  {game.discount && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                      {game.discount}
                    </div>
                  )}
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

        {/* On Sale Section */}
        {!loading && games.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold">🔥 On Sale</h2>
            <span className="px-3 py-1 bg-red-600 rounded-full text-sm font-bold">Limited Time</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {games.filter(g => g.onSale).slice(0, 8).map(game => (
              <Link key={game.id} to={`/game/${game.id}`} className="flex-shrink-0 w-48 group">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
                  <img src={game.cover} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                    -{game.discount}%
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-cyan-400 transition-colors">{game.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 line-through text-xs">{game.originalPrice}</span>
                  <span className="text-green-400 font-bold text-sm">{game.salePrice}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        )}



        {/* Browse by Tags */}
        {!loading && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🏷️ Browse by Tags</h2>
            <Link to="/tags" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
              See All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {['Action', 'RPG', 'Adventure', 'Shooter', 'Strategy', 'Horror', 'Racing', 'Stealth', 'Puzzle', 'Sports'].map(tag => (
              <Link key={tag} to={`/tags?tag=${tag}`} className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-cyan-600 hover:to-cyan-500 rounded-lg font-medium transition-all duration-300 hover:scale-105 whitespace-nowrap">
                {tag}
              </Link>
            ))}
          </div>
        </div>
        )}

        {/* Games Grid */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5' : 'flex flex-col gap-4'}>
          {games.map(game => {
            const displayTitle = getDisplayTitle(game);
            return (
              <div key={game.id} className="group relative">
                {viewMode === 'grid' ? (
                  <Link to={`/game/${game.id}`} className="block relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-900 transition-all duration-500 hover:scale-105 hover:z-10 hover:shadow-2xl hover:shadow-cyan-500/50">
                  <img 
                    src={game.cover}
                    alt={displayTitle}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/460x215/1f1f2e/888888?text=Game+Cover';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 ring-0 group-hover:ring-2 ring-cyan-500/40 rounded-xl transition-all duration-500" />
                  {/* Title only shows on hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-1 group-hover:translate-y-0 transition-all duration-300 opacity-0 group-hover:opacity-100">
                    <h3 className="font-bold text-white text-sm line-clamp-2 mb-2">{displayTitle}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      {game.rating && <span className="px-2 py-0.5 bg-yellow-500/80 text-white rounded font-bold">⭐ {game.rating}</span>}
                      <span className="text-gray-300">{game.size}</span>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link to={`/game/${game.id}`} className="flex gap-4 p-4 bg-gray-900/50 rounded-xl hover:bg-gray-800/70 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-500">
                  <img src={game.cover} alt={displayTitle} className="w-32 h-44 object-cover rounded-lg transition-transform duration-500 hover:scale-105" />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-400 transition-colors duration-300">{displayTitle}</h3>
                      <p className="text-sm text-gray-400 mb-2">{game.developer}</p>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{game.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm font-bold">⭐ {game.rating}</span>
                        <span className="text-sm text-gray-400">{game.genres}</span>
                        <span className="text-sm text-gray-500">{game.size}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {pagination.hasNext && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMoreGames}
              disabled={loadingMore}
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 rounded-lg font-medium transition flex items-center gap-2"
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
    </div>
  );
}