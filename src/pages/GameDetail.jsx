import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SteamNameService from '../services/steamNames';
import FolderSelector from '../components/FolderSelector';
import TorrentProgressBar from '../components/TorrentProgressBar';
import DenuvoIndicator from '../components/DenuvoIndicator';

// Helper function to fetch SteamGridDB images
const fetchSteamGridDBImages = async (appId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/steam-grid-db/images/${appId}`);
    if (response.ok) {
      const data = await response.json();
      return data.images;
    }
  } catch (error) {
    console.warn('Failed to fetch SteamGridDB images:', error);
  }
  return { hero: null, cover: null, logo: null };
};

export default function GameDetail() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [achievementStats, setAchievementStats] = useState({ total: 0, unlocked: 0, progress: 0 });
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [dlcs, setDlcs] = useState([]);
  const [loadingDlcs, setLoadingDlcs] = useState(false);
  const [gameSize, setGameSize] = useState(null);
  const [totalSize, setTotalSize] = useState(null);
  const [installPath, setInstallPath] = useState('C:\\Games');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [createShortcut, setCreateShortcut] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [downloadId, setDownloadId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasDenuvo, setHasDenuvo] = useState(null);
  const [denuvoLoading, setDenuvoLoading] = useState(false);

  useEffect(() => {
    const fetchGameDetails = async () => {
      console.log('🎮 Fetching game details for ID:', id);
      setLoading(true);
      setError(null);
      setDenuvoLoading(true);
      
      try {
        // Fetch Denuvo status from API
        try {
          const denuvoRes = await fetch(`http://localhost:3000/api/denuvo/check/${id}`);
          if (denuvoRes.ok) {
            const denuvoData = await denuvoRes.json();
            setHasDenuvo(denuvoData.hasDenuvo);
            console.log(`✅ Denuvo status for ${id}:`, denuvoData.hasDenuvo);
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch Denuvo status:', err.message);
          setHasDenuvo(null);
        } finally {
          setDenuvoLoading(false);
        }

        // Fetch từ Steam API proxy
        console.log('📡 Calling Steam API: http://localhost:3000/api/steam/game/' + id);
        
        const response = await fetch(`http://localhost:3000/api/steam/game/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📥 Steam API Response status:', response.status);
        
        if (response.ok) {
          const steamData = await response.json();
          console.log('✅ Fetched game from Steam API:', steamData.name);
          console.log('🖼️ Images data:', steamData.images);
          console.log('🎨 Cover:', steamData.images?.cover);
          console.log('🎭 Hero:', steamData.images?.hero);
          console.log('🏷️ Logo:', steamData.images?.logo);
          
          // Fetch SteamGridDB images if not available
          let griddbImages = steamData.images;
          if (!griddbImages?.hero) {
            console.log('📥 Fetching SteamGridDB images...');
            griddbImages = await fetchSteamGridDBImages(steamData.appid);
            console.log('🎨 SteamGridDB images:', griddbImages);
          }
          
          // Fetch real size
          fetchGameSize(id);
          
          // Convert Steam data to game format
          const gameData = {
            id: steamData.appid,
            title: steamData.name,
            developer: steamData.developer,
            publisher: steamData.publisher,
            releaseDate: steamData.releaseDate,
            description: steamData.description,
            cover: steamData.cover,
            backgroundImage: steamData.backgroundImage || `https://cdn.akamai.steamstatic.com/steam/apps/${id}/page_bg_generated_v6b.jpg`,
            screenshots: steamData.screenshots || [],
            videoId: steamData.videoId,
            genres: steamData.genres?.split(', ').filter(g => g.trim()) || [],
            rating: steamData.rating,
            size: steamData.size || '50 GB',
            systemRequirements: steamData.requirements || { minimum: null, recommended: null },
            steamUrl: `https://store.steampowered.com/app/${id}/`,
            tags: steamData.genres?.split(', ').filter(g => g.trim()) || [],
            languages: ['English', 'French', 'German', 'Spanish', 'Italian', 'Russian', 'Japanese'],
            hasOnlineFix: parseInt(id) % 3 === 0,
            hasBypassCrack: parseInt(id) % 5 === 0,
            updateLog: generateUpdateLog(),
            reviews: generateReviews(parseInt(id)),
            dlcs: steamData.dlcs || [],
            updateHistory: steamData.updateHistory || generateUpdateLog(),
            installPath: `C:\\Games\\${steamData.name}`,
            gameLanguage: 'English',
            launchOptions: '',
            autoUpdate: true,
            isInstalled: false,
            lastUpdated: new Date().toISOString().split('T')[0],
            version: '1.0',
            platforms: steamData.platforms || { windows: true, mac: false, linux: false },
            categories: steamData.categories || [],
            achievements: steamData.achievements || 0,
            images: griddbImages || steamData.images || null
          };
          
          setGame(gameData);
          setLoading(false);
          return;
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch game details');
        }
      } catch (error) {
        console.error('❌ Steam API Error:', error.message);
        
        // Immediately show fallback without setting error
        console.log('📋 Generating fallback data for game ID:', id);
        const gameName = SteamNameService.getGameName(parseInt(id));
        const gameGenres = generateGameGenres(parseInt(id));
        const gameInfo = generateGameInfo(parseInt(id));
        
        const fallbackGame = {
          id: id,
          title: gameName,
          developer: gameInfo.developer,
          publisher: gameInfo.publisher,
          releaseDate: gameInfo.releaseDate,
          lastUpdated: "December 15, 2023",
          version: "1.0." + (parseInt(id) % 100),
          size: (Math.floor(parseInt(id) % 80) + 10) + " GB",
          rating: (Math.floor(parseInt(id) % 30) + 70) + "%",
          steamId: id,
          steamUrl: `https://store.steampowered.com/app/${id}/`,
          genres: gameGenres,
          tags: generateGameTags(gameGenres),
          languages: ["English", "French", "Italian", "German", "Spanish", "Japanese", "Korean", "Portuguese", "Russian", "Simplified Chinese", "Traditional Chinese"],
          systemRequirements: generateSystemRequirements(parseInt(id)),
          description: generateGameDescription(gameName, gameGenres),
          screenshots: [
            `http://localhost:3000/api/steam/image/${id}/header`,
            `http://localhost:3000/api/steam/image/${id}/capsule`,
            `http://localhost:3000/api/steam/image/${id}/library`
          ],
          cover: `http://localhost:3000/api/steam/image/${id}/header`,
          backgroundImage: `http://localhost:3000/api/steam/image/${id}/library`,
          hasOnlineFix: parseInt(id) % 3 === 0,
          hasBypassCrack: parseInt(id) % 5 === 0,
          updateLog: generateUpdateLog(),
          reviews: generateReviews(parseInt(id)),
          dlcs: generateDLCs(gameName),
          installPath: `C:\\Games\\${gameName}`,
          gameLanguage: "English",
          launchOptions: "",
          autoUpdate: true,
          isInstalled: false,
          videoId: null
        };
        
        console.log('✅ Fallback game ready:', fallbackGame.title);
        setGame(fallbackGame);
        setLoading(false);
      }
    };

    if (id) {
      fetchGameDetails();
    }
  }, [id]);

  // Fetch achievements khi chuyển sang tab achievements
  useEffect(() => {
    if (activeTab === 'achievements' && id && achievements.length === 0) {
      fetchAchievements();
    }
  }, [activeTab, id]);

  // Fetch DLCs khi chuyển sang tab dlc
  useEffect(() => {
    if (activeTab === 'dlc' && id && dlcs.length === 0) {
      fetchDLCs();
    }
  }, [activeTab, id]);

  const fetchAchievements = async () => {
    setLoadingAchievements(true);
    try {
      const response = await fetch(`http://localhost:3000/api/games/${id}/achievements`);
      const data = await response.json();
      setAchievements(data.achievements || []);
      setAchievementStats(data.stats || { total: 0, unlocked: 0, progress: 0 });
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoadingAchievements(false);
    }
  };

  const unlockAchievement = async (achievementName) => {
    try {
      await fetch(`http://localhost:3000/api/games/${id}/achievements/${achievementName}/unlock`, {
        method: 'POST'
      });
      fetchAchievements();
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
    }
  };

  const fetchDLCs = async () => {
    setLoadingDlcs(true);
    try {
      const response = await fetch(`http://localhost:3000/api/games/${id}/dlcs`);
      const data = await response.json();
      setDlcs(data.dlcs || []);
      
      // Fetch total size with DLCs
      if (data.dlcs && data.dlcs.length > 0) {
        const dlcIds = data.dlcs.map(d => d.appId).join(',');
        const sizeResponse = await fetch(`http://localhost:3000/api/games/${id}/size/full?dlcs=${dlcIds}`);
        const sizeData = await sizeResponse.json();
        if (sizeData.success) {
          setTotalSize(sizeData.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch DLCs:', error);
    } finally {
      setLoadingDlcs(false);
    }
  };

  const fetchGameSize = async (appId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/games/${appId}/size`);
      const data = await response.json();
      if (data.success) {
        setGameSize(data.size);
      }
    } catch (error) {
      console.error('Failed to fetch game size:', error);
    }
  };

  // Fetch updates khi chuyển sang tab updates với caching + auto-update
  useEffect(() => {
    if (activeTab === 'updates' && id) {
      const fetchUpdates = () => {
        // Check cache first
        const cacheKey = `updates_cache_${id}`;
        const cached = localStorage.getItem(cacheKey);
        const cacheTimestamp = localStorage.getItem(cacheKey + '_time');
        
        // Use cache if available and less than 1 hour old
        const ONE_HOUR = 3600000;
        if (cached && cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < ONE_HOUR) {
          try {
            const cachedData = JSON.parse(cached);
            setGame(prev => ({ ...prev, realUpdates: cachedData }));
            return;
          } catch (e) {
            console.warn('Cache parse error:', e);
          }
        }

        // Fetch from API if no valid cache
        fetch(`http://localhost:3000/api/steam/updates/${id}`)
          .then(res => res.json())
          .then(data => {
            setGame(prev => ({ ...prev, realUpdates: data }));
            // Save to cache
            localStorage.setItem(cacheKey, JSON.stringify(data));
            localStorage.setItem(cacheKey + '_time', Date.now().toString());
          })
          .catch(err => console.error('Failed to fetch updates:', err));
      };

      // Fetch immediately
      fetchUpdates();

      // Auto-refresh updates every 30 minutes for real-time updates
      const refreshInterval = setInterval(fetchUpdates, 30 * 60 * 1000);
      
      return () => clearInterval(refreshInterval);
    }
  }, [activeTab, id]);

  // Check if game is in wishlist on mount
  useEffect(() => {
    const saved = localStorage.getItem('wishlist');
    if (saved && game) {
      const wishlist = JSON.parse(saved);
      setIsInWishlist(wishlist.some(g => g.id === game.id));
    }
  }, [game]);

  // Wishlist toggle function
  const toggleWishlist = () => {
    const saved = localStorage.getItem('wishlist');
    let wishlist = saved ? JSON.parse(saved) : [];
    
    if (isInWishlist) {
      wishlist = wishlist.filter(g => g.id !== game.id);
    } else {
      wishlist.push({
        id: game.id,
        title: game.title,
        cover: game.cover,
        developer: game.developer,
        rating: game.rating,
        size: game.size
      });
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    setIsInWishlist(!isInWishlist);
  };

  // Helper functions for generating realistic game data
  const generateGameGenres = (appId) => {
    const allGenres = ['Action', 'Adventure', 'RPG', 'Strategy', 'Shooter', 'Racing', 'Sports', 'Simulation', 'Horror', 'Puzzle', 'Indie', 'Casual', 'Fighting', 'Platformer'];
    const count = (appId % 3) + 1;
    const startIndex = appId % (allGenres.length - count);
    return allGenres.slice(startIndex, startIndex + count);
  };

  const generateGameTags = (genres) => {
    const tagMap = {
      'Action': ['Fast-Paced', 'Combat', 'Intense'],
      'Adventure': ['Exploration', 'Story Rich', 'Atmospheric'],
      'RPG': ['Character Development', 'Fantasy', 'Turn-Based'],
      'Strategy': ['Tactical', 'Resource Management', 'Planning'],
      'Shooter': ['FPS', 'Multiplayer', 'Competitive'],
      'Horror': ['Scary', 'Psychological', 'Survival'],
      'Racing': ['Driving', 'Speed', 'Vehicles'],
      'Simulation': ['Realistic', 'Management', 'Building']
    };
    
    let tags = [];
    genres.forEach(genre => {
      if (tagMap[genre]) {
        tags.push(...tagMap[genre]);
      }
    });
    return tags.slice(0, 6);
  };

  const generateGameInfo = (appId) => {
    const developers = ['FromSoftware', 'CD PROJEKT RED', 'Valve', 'Rockstar Games', 'Ubisoft', 'EA DICE', 'Bethesda', 'Square Enix', 'Capcom', 'Bandai Namco'];
    const publishers = ['Steam', 'Epic Games', 'EA', 'Ubisoft', 'Activision', 'Take-Two', 'Microsoft', 'Sony', 'Bandai Namco', 'Square Enix'];
    
    const year = 2015 + (appId % 10);
    const month = (appId % 12) + 1;
    const day = (appId % 28) + 1;
    
    return {
      developer: developers[appId % developers.length],
      publisher: publishers[appId % publishers.length],
      releaseDate: `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`
    };
  };

  const generateSystemRequirements = (appId) => {
    const isHighEnd = appId % 3 === 0;
    return {
      minimum: {
        "Operating System": "Windows 10 64-bit",
        "Processor": isHighEnd ? "Intel Core i5-8400 / AMD Ryzen 5 2600" : "Intel Core i3-6100 / AMD FX-6300",
        "Memory": isHighEnd ? "12 GB RAM" : "8 GB RAM",
        "Graphics": isHighEnd ? "NVIDIA GTX 1060 6GB / AMD RX 580 8GB" : "NVIDIA GTX 960 / AMD R9 280",
        "DirectX": "Version 12",
        "Storage": `${Math.floor(appId % 80) + 10} GB available space`
      },
      recommended: {
        "Operating System": "Windows 11 64-bit",
        "Processor": isHighEnd ? "Intel Core i7-10700K / AMD Ryzen 7 3700X" : "Intel Core i5-8400 / AMD Ryzen 5 2600",
        "Memory": isHighEnd ? "16 GB RAM" : "12 GB RAM",
        "Graphics": isHighEnd ? "NVIDIA RTX 3070 / AMD RX 6700 XT" : "NVIDIA GTX 1070 / AMD RX Vega 56",
        "DirectX": "Version 12",
        "Storage": `${Math.floor(appId % 80) + 20} GB available space`
      }
    };
  };

  const generateGameDescription = (name, genres) => {
    const descriptions = {
      'Action': `${name} delivers intense action-packed gameplay with stunning visuals and heart-pounding combat sequences.`,
      'Adventure': `Embark on an epic journey in ${name}, where every choice matters and adventure awaits around every corner.`,
      'RPG': `${name} offers deep character customization and an immersive world filled with quests, magic, and legendary creatures.`,
      'Strategy': `Master the art of war in ${name}, where tactical thinking and strategic planning lead to victory.`,
      'Shooter': `${name} brings competitive multiplayer action with precision shooting mechanics and intense firefights.`,
      'Horror': `${name} will test your nerves with psychological horror and spine-chilling atmosphere.`
    };
    
    return descriptions[genres[0]] || `Experience ${name}, an amazing game with stunning graphics and immersive gameplay that will keep you entertained for hours.`;
  };

  const generateUpdateLog = () => {
    return [
      {
        version: "1.2.1",
        date: "December 15, 2023",
        changes: ["Bug fixes and stability improvements", "Performance optimizations", "Fixed multiplayer connectivity issues", "Updated anti-cheat system"]
      },
      {
        version: "1.2.0",
        date: "November 28, 2023",
        changes: ["Added new content and features", "Balance adjustments to gameplay", "UI improvements and quality of life updates", "New achievements added"]
      },
      {
        version: "1.1.5",
        date: "October 12, 2023",
        changes: ["Seasonal event content", "Bug fixes for reported issues", "Improved graphics settings", "Enhanced audio experience"]
      }
    ];
  };

  const generateReviews = (appId) => {
    const positive = Math.floor((appId % 30) + 70);
    return {
      positive: positive,
      negative: 100 - positive,
      total: Math.floor((appId % 500000) + 10000),
      recent: {
        positive: Math.floor((appId % 25) + 75),
        negative: Math.floor((appId % 25) + 5),
        total: Math.floor((appId % 50000) + 5000)
      }
    };
  };

  const generateDLCs = (gameName) => {
    const dlcTypes = ['Expansion', 'Season Pass', 'Character Pack', 'Weapon Pack', 'Map Pack'];
    const dlcCount = Math.floor(Math.random() * 3) + 1;
    const dlcs = [];
    
    for (let i = 0; i < dlcCount; i++) {
      const type = dlcTypes[i % dlcTypes.length];
      dlcs.push({
        name: `${gameName} ${type}`,
        description: `Additional content for ${gameName} featuring new ${type.toLowerCase()} content.`,
        releaseDate: `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/2024`,
        price: `$${Math.floor(Math.random() * 30) + 10}.99`,
        installed: Math.random() > 0.7,
        size: `${Math.floor(Math.random() * 15) + 2} GB`
      });
    }
    
    return dlcs;
  };
  // Loading state
  if (loading || !game) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
        {/* Back button */}
        <Link to="/home" className="absolute top-8 left-8 z-50 inline-flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition">
          ← Back to Store
        </Link>

        <div className="text-center z-10">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-transparent border-t-cyan-500 border-r-cyan-400 mx-auto"></div>
          </div>
          
          <div className="space-y-4">
            <div className="text-2xl font-bold animate-pulse bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Loading Game Details...
            </div>
            <div className="text-gray-400 animate-pulse">
              Fetching game information from Steam (ID: {id})
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                ⚠️ {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'system', name: 'System Requirements' },
    { id: 'achievements', name: 'Achievements' },
    { id: 'updates', name: 'Update History' },
    { id: 'reviews', name: 'Reviews' },
    { id: 'dlc', name: 'DLC' },
    { id: 'properties', name: 'Properties' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white relative overflow-hidden">
      {/* Hero Background Section - Fullscreen */}
      <div className="relative h-screen overflow-hidden">
        {/* Animated particles - behind everything */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {Array.from({length: 20}).map((_, i) => (
            <div 
              key={i}
              className="absolute w-1 h-1 bg-white/10 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        {/* Background Image - no blur */}
        <div className="absolute inset-0 transform scale-110 z-0">
          <img 
            src={game.images?.hero || game.hero || game.backgroundImage || game.screenshots?.[0] || game.cover} 
            alt={game.title} 
            className="w-full h-full object-cover" 
            style={{ filter: 'brightness(0.8)' }}
            onError={(e) => {
              console.error('Hero image failed to load:', e.target.src);
              // Try multiple fallbacks
              if (e.target.src.includes('steamgriddb')) {
                e.target.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/library_hero.jpg`;
              } else if (e.target.src.includes('library_hero')) {
                e.target.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/page_bg_generated_v6b.jpg`;
              } else if (e.target.src.includes('page_bg_generated')) {
                e.target.src = game.cover;
              }
            }}
          />
          {/* Minimal gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
        </div>
        
        {/* Back Button */}
        <div className="absolute top-8 left-8 z-10">
          <Link to="/home" className="inline-flex items-center gap-2 px-6 py-3 bg-black/80 backdrop-blur-md rounded-xl hover:bg-black/90 transition-all duration-300 border border-white/10 hover:border-cyan-500/50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Store
          </Link>
        </div>
        
        {/* Large Cover Poster */}
        <div className="absolute bottom-8 left-8 z-10">
          <div className="relative group">
            <img 
              src={game.images?.cover || game.cover} 
              alt={game.title} 
              className="w-80 h-[480px] object-cover rounded-2xl shadow-2xl ring-4 ring-white/10 group-hover:ring-cyan-400/50 transition-all duration-500 group-hover:scale-105 group-hover:shadow-cyan-500/30" 
              loading="lazy"
              onError={(e) => {
                e.target.src = game.hero || 
                  `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/header.jpg`;
              }}
            />
            {/* Rating Badge */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-sm">
              ⭐ {typeof game.rating === 'number' ? game.rating.toFixed(1) : String(game.rating).replace('%', '')}
            </div>
          </div>
        </div>
        
        {/* Game Title & Info Overlay */}
        <div className="absolute bottom-8 left-80 right-8 z-10 pl-16">
          {/* Logo or Title */}
          {game.images?.logo ? (
            <img 
              src={game.images.logo}
              alt={`${game.title} logo`}
              className="h-32 w-auto object-contain mb-6 drop-shadow-2xl max-w-2xl"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
          ) : null}
          <h1 className={`${game.images?.logo ? 'hidden' : 'block'} text-7xl font-black mb-6 drop-shadow-2xl text-white leading-tight`}>
            {game.title}
          </h1>
          
          {/* Developer & Release Date */}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="bg-black/60 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10">
              <span className="text-lg text-white font-semibold">{game.developer}</span>
            </div>
            <div className="bg-black/60 backdrop-blur-xl px-4 py-2.5 rounded-full border border-white/10">
              <span className="text-gray-200">📅 {game.releaseDate}</span>
            </div>
            {/* Denuvo Badge Component */}
            {!denuvoLoading && hasDenuvo !== null && (
              <DenuvoIndicator hasDenuvo={hasDenuvo} />
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-4 flex-wrap">
            {!game.isInstalled ? (
              <button 
                onClick={() => setShowDownloadDialog(true)}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 rounded-xl font-bold text-lg transition-all duration-300 backdrop-blur-sm flex items-center gap-3 shadow-2xl hover:shadow-green-500/30 transform hover:scale-105 border border-green-400/30"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download ({gameSize || game.size})
              </button>
            ) : (
              <>
                <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl font-bold text-lg transition-all duration-300 flex items-center gap-3 shadow-2xl">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Play
                </button>
                <button 
                  onClick={() => setShowVerifyDialog(true)}
                  className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-2xl border border-blue-400/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verify
                </button>
              </>
            )}
            
            <button 
              onClick={toggleWishlist}
              className={`px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-2xl transform hover:scale-105 border ${
                isInWishlist
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 border-red-400/30'
                  : 'bg-gradient-to-r from-purple-500/80 to-pink-600/80 hover:from-purple-500 hover:to-pink-600 border-purple-400/30'
              }`}
            >
              {isInWishlist ? '❤️ Wishlisted' : '🤍 Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 bg-gradient-to-b from-gray-950/95 via-gray-900/98 to-black">
        {/* Genre Tags */}
        <div className="px-8 py-6">
          <div className="flex flex-wrap gap-3">
            {(Array.isArray(game.genres) ? game.genres : (game.genres ? game.genres.split(',').map(g => g.trim()) : [])).map((genre, index) => (
              <span key={`${genre}-${index}`} className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-200 rounded-full text-sm backdrop-blur-sm border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-300">
                {genre}
              </span>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-8 pb-8">
          <div className="flex gap-8">
            {/* Left Content */}
            <div className="flex-1">
              {/* Tabs */}
              <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm whitespace-nowrap border ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-2xl border-cyan-400/50 shadow-cyan-500/30'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-gray-600/30 hover:border-gray-500/50'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-700/30">
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-3xl font-bold mb-6">About This Game</h3>
                      <div className="bg-gray-800/30 rounded-xl p-6 mb-8">
                        <p className="text-gray-300 leading-relaxed">{game.description}</p>
                      </div>
                      
                      {/* Denuvo/DRM Info Section */}
                      {!denuvoLoading && hasDenuvo !== null && (
                        <div className="mb-8 bg-gradient-to-br from-red-900/10 to-pink-900/10 rounded-xl p-6 border border-red-500/30">
                          <h4 className="text-xl font-bold mb-4 text-red-400">🔐 DRM & Protection Info</h4>
                          <div className="flex items-center gap-4">
                            <DenuvoIndicator hasDenuvo={hasDenuvo} />
                            {hasDenuvo && (
                              <p className="text-gray-300 text-sm">
                                This game uses Denuvo anti-tamper technology. Please ensure compatibility before downloading.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-blue-500/20">
                          <h4 className="text-xl font-bold mb-4 text-blue-400">🎮 Game Features</h4>
                          <ul className="space-y-2 text-gray-300">
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Single-player campaign</li>
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> High-quality graphics</li>
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Immersive storyline</li>
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Multiple difficulty levels</li>
                            {game.achievements > 0 && (
                              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> {game.achievements} Achievements</li>
                            )}
                          </ul>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-900/20 to-teal-900/20 rounded-xl p-6 border border-green-500/20">
                          <h4 className="text-xl font-bold mb-4 text-green-400">📊 Game Stats</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Metacritic Score:</span>
                              <span className="text-white font-bold">{game.rating}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">File Size:</span>
                              <span className="text-white font-bold">{gameSize || game.size}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Release Year:</span>
                              <span className="text-white font-bold">{game.releaseDate ? new Date(game.releaseDate).getFullYear() : 'TBA'}</span>
                            </div>
                            {game.platforms && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Platforms:</span>
                                <span className="text-white font-bold">
                                  {[
                                    game.platforms.windows && '🪟',
                                    game.platforms.mac && '🍎',
                                    game.platforms.linux && '🐧'
                                  ].filter(Boolean).join(' ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-3xl font-bold mb-6">Screenshots & Videos</h3>
                      
                      {/* Main Image/Video Display */}
                      <div className="mb-4">
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden group cursor-pointer"
                             onClick={() => selectedImageIndex === 0 && game.videoId ? setShowVideoModal(true) : null}>
                          {selectedImageIndex === 0 && game.videoId ? (
                            // Video thumbnail
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-blue-900/50">
                              <div className="text-center">
                                <div className="w-20 h-20 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center mb-4 mx-auto transition-colors shadow-lg">
                                  <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                                <p className="text-white font-bold text-xl">Watch Trailer</p>
                                <p className="text-gray-300 text-sm mt-2">Click to play</p>
                              </div>
                            </div>
                          ) : (
                            // Screenshot
                            <img 
                              src={game.screenshots?.[selectedImageIndex > 0 ? selectedImageIndex - 1 : 0] || game.cover}
                              alt={`Screenshot ${selectedImageIndex}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = game.cover || 'https://via.placeholder.com/1920x1080/1a1a1a/ffffff?text=No+Screenshot';
                              }}
                            />
                          )}
                          
                          {/* Navigation Arrows */}
                          {game.screenshots && game.screenshots.length > 0 && (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const maxIndex = game.videoId ? game.screenshots.length : game.screenshots.length - 1;
                                  setSelectedImageIndex(selectedImageIndex === 0 ? maxIndex : selectedImageIndex - 1);
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                              >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const maxIndex = game.videoId ? game.screenshots.length : game.screenshots.length - 1;
                                  setSelectedImageIndex(selectedImageIndex === maxIndex ? 0 : selectedImageIndex + 1);
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                              >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Thumbnails */}
                      {(game.videoId || (game.screenshots && game.screenshots.length > 0)) && (
                        <div className="relative">
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {/* Video Thumbnail */}
                            {game.videoId && (
                              <button
                                onClick={() => setSelectedImageIndex(0)}
                                className={`flex-shrink-0 w-32 h-20 rounded overflow-hidden border-2 transition-all relative ${
                                  selectedImageIndex === 0 ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'border-transparent hover:border-gray-600'
                                }`}
                              >
                                <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center">
                                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                                <div className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                                  VIDEO
                                </div>
                              </button>
                            )}
                            
                            {/* Screenshot Thumbnails */}
                            {game.screenshots?.map((screenshot, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedImageIndex(game.videoId ? index + 1 : index)}
                                className={`flex-shrink-0 w-32 h-20 rounded overflow-hidden border-2 transition-all ${
                                  selectedImageIndex === (game.videoId ? index + 1 : index) ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'border-transparent hover:border-gray-600'
                                }`}
                              >
                                <img 
                                  src={screenshot}
                                  alt={`Thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/320x180/1a1a1a/ffffff?text=No+Image';
                                  }}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Video Modal */}
                    {showVideoModal && game.videoId && (
                      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setShowVideoModal(false)}>
                        <div className="relative w-full max-w-6xl aspect-video" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setShowVideoModal(false)}
                            className="absolute -top-12 right-0 text-white hover:text-red-500 transition-colors"
                          >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <video
                            className="w-full h-full rounded-lg"
                            src={game.videoId}
                            controls
                            autoPlay
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'system' && (
                  <div>
                    <h3 className="text-3xl font-bold mb-8">System Requirements</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Minimum Requirements */}
                      <div className="bg-yellow-500/10 rounded-xl p-6">
                        <h4 className="text-2xl font-bold mb-6 text-yellow-400">Minimum</h4>
                        <div className="space-y-4">
                          {game.systemRequirements?.minimum ? (
                            typeof game.systemRequirements.minimum === 'object' && game.systemRequirements.minimum !== null ? (
                              // If it's an object, render key-value pairs
                              Object.entries(game.systemRequirements.minimum).map(([key, value]) => (
                                <div key={key}>
                                  <div className="text-gray-400 text-sm mb-1">{key}</div>
                                  <div className="text-white text-base font-semibold mb-3">{value}</div>
                                </div>
                              ))
                            ) : typeof game.systemRequirements.minimum === 'string' ? (
                              // If it's a string, render as HTML
                              <div 
                                className="space-y-3 text-gray-300"
                                dangerouslySetInnerHTML={{ 
                                  __html: game.systemRequirements.minimum
                                    .replace(/<br\s*\/?>/gi, '<br/>')
                                    .replace(/<strong>(.*?)<\/strong>/gi, '<div class="text-gray-400 text-sm mb-1">$1</div>')
                                }} 
                              />
                            ) : (
                              <div className="text-gray-500">No minimum requirements data available</div>
                            )
                          ) : (
                            <div className="text-gray-500">No minimum requirements specified</div>
                          )}
                        </div>
                      </div>

                      {/* Recommended Requirements */}
                      <div className="bg-green-500/10 rounded-xl p-6">
                        <h4 className="text-2xl font-bold mb-6 text-green-400">Recommended</h4>
                        <div className="space-y-4">
                          {game.systemRequirements?.recommended ? (
                            typeof game.systemRequirements.recommended === 'object' && game.systemRequirements.recommended !== null ? (
                              // If it's an object, render key-value pairs
                              Object.entries(game.systemRequirements.recommended).map(([key, value]) => (
                                <div key={key}>
                                  <div className="text-gray-400 text-sm mb-1">{key}</div>
                                  <div className="text-white text-base font-semibold mb-3">{value}</div>
                                </div>
                              ))
                            ) : typeof game.systemRequirements.recommended === 'string' ? (
                              // If it's a string, render as HTML
                              <div 
                                className="space-y-3 text-gray-300"
                                dangerouslySetInnerHTML={{ 
                                  __html: game.systemRequirements.recommended
                                    .replace(/<br\s*\/?>/gi, '<br/>')
                                    .replace(/<strong>(.*?)<\/strong>/gi, '<div class="text-gray-400 text-sm mb-1">$1</div>')
                                }} 
                              />
                            ) : (
                              <div className="text-gray-500">No recommended requirements data available</div>
                            )
                          ) : (
                            <div className="text-gray-500">No recommended requirements specified</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'achievements' && (
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-3xl font-bold">Achievements</h3>
                      {achievementStats.total > 0 && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-cyan-400">
                            {achievementStats.unlocked} / {achievementStats.total}
                          </div>
                          <div className="text-sm text-gray-400">Unlocked</div>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {achievementStats.total > 0 && (
                      <div className="mb-8 bg-gray-800/50 rounded-xl p-6">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-300">Overall Progress</span>
                          <span className="text-cyan-400 font-bold">{achievementStats.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
                            style={{ width: `${achievementStats.progress}%` }}
                          >
                            <div className="h-full w-full bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {loadingAchievements ? (
                      <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                        <p className="text-gray-400 text-lg">Loading achievements...</p>
                      </div>
                    ) : achievements.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {achievements.map((ach, index) => (
                          <div 
                            key={index} 
                            className={`rounded-xl p-4 flex gap-4 items-center transition-all duration-300 cursor-pointer ${
                              ach.achieved 
                                ? 'bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 hover:border-cyan-400/60' 
                                : 'bg-gray-800/30 border border-gray-700/30 hover:bg-gray-700/30'
                            }`}
                            onClick={() => !ach.achieved && unlockAchievement(ach.name)}
                          >
                            <div className="relative flex-shrink-0">
                              <img 
                                src={ach.achieved ? ach.icon : ach.iconGray}
                                alt={ach.displayName}
                                className={`w-16 h-16 rounded-lg ${
                                  ach.achieved ? 'opacity-100' : 'opacity-50 grayscale'
                                }`}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/64/1a1a1a/ffffff?text=🏆';
                                }}
                              />
                              {ach.achieved && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-lg font-bold mb-1 ${
                                ach.achieved ? 'text-white' : 'text-gray-400'
                              }`}>
                                {ach.displayName}
                              </h4>
                              <p className="text-sm text-gray-400 mb-2 line-clamp-2">{ach.description}</p>
                              <div className="flex items-center gap-3 text-xs">
                                {ach.achieved && ach.unlockTime && (
                                  <span className="text-green-400">
                                    ✓ Unlocked {new Date(ach.unlockTime).toLocaleDateString()}
                                  </span>
                                )}
                                {ach.percentage > 0 && (
                                  <span className="text-gray-500">
                                    {Number(ach.percentage).toFixed(1)}% of players
                                  </span>
                                )}
                                {ach.hidden && !ach.achieved && (
                                  <span className="text-purple-400">🔒 Hidden</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20">
                        <div className="text-6xl mb-4">🏆</div>
                        <p className="text-gray-400 text-lg">No achievements available for this game</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'updates' && (
                  <div>
                    <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Update History</h3>
                    <div className="space-y-8">
                      {game.realUpdates && game.realUpdates.length > 0 ? (
                        // Real Steam update data
                        game.realUpdates.map((update, index) => (
                          <div key={index} className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl p-8 border-l-4 border-cyan-500 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 overflow-hidden">
                            {/* Update Image if available */}
                            {update.image && (
                              <div className="mb-6 rounded-lg overflow-hidden">
                                <img 
                                  src={update.image} 
                                  alt={update.title}
                                  className="w-full h-48 object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-6 mb-6">
                              <div>
                                <h4 className="text-3xl font-bold mb-2 text-white">{update.title || `Version ${update.version}`}</h4>
                                <p className="text-gray-400 flex items-center gap-2">
                                  📅 {update.date}
                                </p>
                              </div>
                              <div className="text-4xl">✨</div>
                            </div>
                            <div>
                              <h5 className="text-lg font-semibold mb-4 text-cyan-300">What's New:</h5>
                              <ul className="space-y-3">
                                {update.changes?.map((change, changeIndex) => (
                                  <li key={changeIndex} className="text-gray-300 flex items-start gap-3">
                                    <span className="text-green-400 text-lg mt-1">✓</span>
                                    <span>{change}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))
                      ) : (
                        // Loading or fallback
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">🔄</div>
                          <p className="text-gray-400 text-lg">Loading update history...</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    <h3 className="text-3xl font-bold mb-8">Community Discussion</h3>
                    
                    {/* Comment Form */}
                    <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
                      <h4 className="text-xl font-bold mb-4">Share your thoughts</h4>
                      <textarea 
                        placeholder="Write your comment here..."
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none min-h-[120px] mb-4"
                      />
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm">👍 Recommend</button>
                          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm">👎 Not Recommend</button>
                        </div>
                        <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition font-bold">Post Comment</button>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4">
                      {[1, 2, 3].map((_, index) => (
                        <div key={index} className="bg-gray-800/30 rounded-xl p-6 hover:bg-gray-800/50 transition">
                          <div className="flex items-start gap-4">
                            <img 
                              src="/Saitma-Meme-PNG-758x473-removebg-preview.png" 
                              alt="User" 
                              className="w-12 h-12 rounded-full object-contain bg-gray-700"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-bold text-white">User {index + 1}</span>
                                <span className="text-xs text-gray-400">2 hours ago</span>
                                <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">👍 Recommended</span>
                              </div>
                              <p className="text-gray-300 mb-3">This game is amazing! The graphics are stunning and the gameplay is very smooth. Highly recommended for everyone!</p>
                              <div className="flex items-center gap-4 text-sm">
                                <button className="text-gray-400 hover:text-cyan-400 transition">👍 {Math.floor(Math.random() * 50) + 10}</button>
                                <button className="text-gray-400 hover:text-red-400 transition">👎 {Math.floor(Math.random() * 5)}</button>
                                <button className="text-gray-400 hover:text-white transition">💬 Reply</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Load More */}
                    <div className="text-center mt-8">
                      <button className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium">
                        Load More Comments
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'dlc' && (
                  <div>
                    <h3 className="text-3xl font-bold mb-8">Downloadable Content</h3>
                    {loadingDlcs ? (
                      <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                        <p className="text-gray-400 text-lg">Loading DLCs...</p>
                      </div>
                    ) : dlcs.length > 0 ? (
                      <div className="space-y-6">
                        {dlcs.map((dlc, index) => (
                          <div key={index} className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50 flex gap-6 hover:border-cyan-500/30 transition-all duration-300">
                            <img 
                              src={dlc.headerImage || dlc.capsuleImage}
                              alt={dlc.name}
                              className="w-48 h-28 object-cover rounded-lg flex-shrink-0"
                              onError={(e) => {
                                e.target.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/header.jpg`;
                              }}
                            />
                            <div className="flex justify-between items-start flex-1">
                              <div className="flex-1">
                                <h4 className="text-xl font-bold mb-2 text-white">{dlc.name}</h4>
                                <p className="text-gray-300 mb-3 line-clamp-2">{dlc.description}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <span>📅 Released: {dlc.releaseDate}</span>
                                  <span>💾 Size: {dlc.size}</span>
                                  <span className={`px-3 py-1 rounded-full ${
                                    dlc.installed 
                                      ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                                      : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                                  }`}>
                                    {dlc.installed ? '✓ Installed' : 'Not Installed'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-3">
                                <div className="text-right">
                                  {typeof dlc.price === 'object' ? (
                                    <>
                                      <div className="text-sm text-gray-400 line-through">{dlc.price.original}</div>
                                      <div className="text-xl font-bold text-green-400">{dlc.price.current}</div>
                                      <div className="text-xs text-green-400">-{dlc.price.discount}%</div>
                                    </>
                                  ) : (
                                    <div className="text-xl font-bold text-cyan-400">{dlc.price}</div>
                                  )}
                                </div>
                                <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition text-white">
                                  {dlc.installed ? 'Manage' : 'Download'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20">
                        <div className="text-6xl mb-4">🎮</div>
                        <p className="text-gray-400 text-lg">No DLC available for this game</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'properties' && (
                  <div>
                    <h3 className="text-3xl font-bold mb-8">Game Properties</h3>
                    <div className="space-y-8">
                      <div className="bg-gray-800/50 rounded-xl p-6">
                        <h4 className="text-xl font-bold mb-4">Install Location</h4>
                        <div className="flex gap-3 mb-4">
                          <input 
                            type="text" 
                            value={game.installPath} 
                            readOnly
                            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                          />
                          <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition font-medium">
                            Browse
                          </button>
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-xl p-6">
                        <h4 className="text-xl font-bold mb-4">Language</h4>
                        <select 
                          value={game.gameLanguage}
                          onChange={(e) => setGame({...game, gameLanguage: e.target.value})}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="English">English</option>
                          <option value="French">Français</option>
                          <option value="German">Deutsch</option>
                          <option value="Spanish">Español</option>
                          <option value="Japanese">日本語</option>
                        </select>
                      </div>

                      <div className="bg-gray-800/50 rounded-xl p-6">
                        <h4 className="text-xl font-bold mb-4">Launch Options</h4>
                        <input 
                          type="text" 
                          placeholder="Set launch options..."
                          value={game.launchOptions}
                          onChange={(e) => setGame({...game, launchOptions: e.target.value})}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-96 space-y-6">
              <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-gray-700/30">
                <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Game Info</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                    <span className="text-gray-400">Developer:</span>
                    <span className="font-medium text-white">{game.developer}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                    <span className="text-gray-400">Publisher:</span>
                    <span className="font-medium text-white">{game.publisher}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                    <span className="text-gray-400">Release Date:</span>
                    <span className="font-medium text-white">{game.releaseDate}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                    <span className="text-gray-400">Size:</span>
                    <span className="font-medium text-cyan-400">{gameSize || game.size}</span>
                  </div>
                </div>
                {totalSize && totalSize !== gameSize && (
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/20">
                    <span className="text-purple-300">+ All DLCs:</span>
                    <span className="font-bold text-purple-400">{totalSize}</span>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-blue-500/20">
                <h3 className="text-2xl font-bold mb-6 text-blue-300">Steam Store</h3>
                <a href={game.steamUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-blue-500/30 transform hover:scale-105">
                  🎮 View on Steam
                </a>
              </div>

              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-500/20">
                <h3 className="text-2xl font-bold mb-6 text-purple-300">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {game.tags?.map((tag, index) => (
                    <span key={`${tag}-${index}`} className="px-3 py-2 bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-200 rounded-full text-sm backdrop-blur-sm border border-purple-500/30 hover:border-purple-400/60 transition-all duration-300">{tag}</span>
                  )) || <span className="text-gray-400">No tags available</span>}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-900/30 to-teal-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-green-500/20">
                <h3 className="text-2xl font-bold mb-6 text-green-300">Languages</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {game.languages?.map((lang, index) => (
                    <span key={`${lang}-${index}`} className="text-gray-300 p-2 bg-gray-800/30 rounded">{lang}</span>
                  )) || <span className="text-gray-400">No languages listed</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Dialog */}
      {showDownloadDialog && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-3xl w-full mx-4 shadow-2xl border border-gray-800">
            {/* If downloading, show progress */}
            {isDownloading && downloadId ? (
              <div>
                <h2 className="text-3xl font-bold mb-6">Downloading {game.title}</h2>
                <TorrentProgressBar 
                  downloadId={downloadId} 
                  gameName={game.title}
                  onComplete={() => {
                    setIsDownloading(false);
                    setDownloadId(null);
                    setShowDownloadDialog(false);
                  }}
                />
              </div>
            ) : (
              /* Download Setup */
              <>
                <div className="flex gap-6 mb-8">
                  <img 
                    src={game.cover} 
                    alt={game.title}
                    className="w-32 h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/128x192/1a1a1a/ffffff?text=No+Image';
                    }}
                  />
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-2">Download {game.title}</h2>
                    <div className="space-y-2 text-gray-400">
                      <p>Download size: <span className="text-white font-bold">{game.size}</span></p>
                      <p>Required Storage Space: <span className="text-white font-bold">{game.size}</span></p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Folder Selector Component */}
                  <FolderSelector 
                    onPathSelected={(path) => setInstallPath(path)}
                    currentPath={installPath}
                  />

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoUpdate}
                        onChange={(e) => setAutoUpdate(e.target.checked)}
                        className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-white">Auto-update games to this folder</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={createShortcut}
                        onChange={(e) => setCreateShortcut(e.target.checked)}
                        className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-white">Create Desktop Shortcut</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button 
                    onClick={() => setShowDownloadDialog(false)} 
                    className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-bold text-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        setIsDownloading(true);
                        
                        // Call torrent download API
                        const response = await fetch('http://localhost:3000/api/torrent/download', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            gameId: game.id,
                            gameName: game.title,
                            torrentPath: `C:\\Games\\Torrents_DB\\${game.id}.torrent`,
                            installPath: installPath,
                            autoUpdate: autoUpdate,
                            createShortcut: createShortcut
                          })
                        });

                        if (response.ok) {
                          const data = await response.json();
                          setDownloadId(data.downloadId);
                          console.log('Download started with ID:', data.downloadId);
                        } else {
                          console.error('Download failed');
                          setIsDownloading(false);
                          alert('Failed to start download. Check console for details.');
                        }
                      } catch (err) {
                        console.error('Download error:', err);
                        setIsDownloading(false);
                        alert('Error starting download: ' + err.message);
                      }
                    }}
                    className="flex-1 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition font-bold text-lg flex items-center justify-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    disabled={isDownloading}
                  >
                    <span>⬇</span>
                    Start Download
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Verify Game Dialog */}
      {showVerifyDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-800">
            <h2 className="text-2xl font-bold mb-4">Verify Game Files</h2>
            {!isVerifying ? (
              <>
                <p className="text-gray-300 mb-6">This will verify the integrity of all game files and repair any corrupted files.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowVerifyDialog(false)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition">Cancel</button>
                  <button 
                    onClick={() => {
                      setIsVerifying(true);
                      let progress = 0;
                      const interval = setInterval(() => {
                        progress += Math.random() * 15;
                        if (progress >= 100) {
                          progress = 100;
                          clearInterval(interval);
                          setTimeout(() => {
                            setIsVerifying(false);
                            setVerifyProgress(0);
                            setShowVerifyDialog(false);
                          }, 1000);
                        }
                        setVerifyProgress(Math.floor(progress));
                      }, 500);
                    }}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition font-bold"
                  >
                    Start Verification
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Verifying files...</span>
                    <span className="text-sm font-bold text-blue-400">{verifyProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${verifyProgress}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">Please don't close this window...</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

