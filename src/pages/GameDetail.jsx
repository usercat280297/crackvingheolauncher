import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SteamNameService from '../services/steamNames';

export default function GameDetail() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showOnlineFixDialog, setShowOnlineFixDialog] = useState(false);
  const [showBypassDialog, setShowBypassDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [installPath, setInstallPath] = useState('C:\\Games');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [createShortcut, setCreateShortcut] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    const fetchGameDetails = async () => {
      console.log('🎮 Fetching game details for ID:', id);
      setLoading(true);
      
      try {
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
          
          // Convert Steam data to game format
          const gameData = {
            id: steamData.appid,
            title: steamData.name,
            developer: steamData.developer,
            publisher: steamData.publisher,
            releaseDate: steamData.releaseDate,
            description: steamData.description,
            cover: steamData.cover,
            backgroundImage: steamData.cover,
            screenshots: steamData.screenshots,
            genres: steamData.genres.split(', ').filter(g => g.trim()),
            rating: steamData.rating,
            size: steamData.size || '50 GB', // Use actual size from Steam
            systemRequirements: steamData.requirements,
            steamUrl: `https://store.steampowered.com/app/${id}/`,
            tags: steamData.genres.split(', ').filter(g => g.trim()),
            languages: ['English', 'French', 'German', 'Spanish', 'Italian', 'Russian', 'Japanese'],
            hasOnlineFix: parseInt(id) % 3 === 0,
            hasBypassCrack: parseInt(id) % 5 === 0,
            updateLog: generateUpdateLog(),
            reviews: generateReviews(parseInt(id)),
            dlcs: generateDLCs(steamData.name),
            installPath: `C:\\Games\\${steamData.name}`,
            gameLanguage: 'English',
            launchOptions: '',
            autoUpdate: true,
            isInstalled: false,
            lastUpdated: new Date().toISOString().split('T')[0],
            version: '1.0'
          };
          
          setGame(gameData);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('❌ Steam API Error:', error.message);
      }
      
      // Always use fallback if API fails
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
        isInstalled: false
      };
      
      console.log('✅ Fallback game ready:', fallbackGame.title);
      setGame(fallbackGame);
      setLoading(false);
    };

    if (id) {
      fetchGameDetails();
    }
  }, [id]);

  // Fetch achievements khi chuyển sang tab achievements
  useEffect(() => {
    if (activeTab === 'achievements' && id && achievements.length === 0) {
      fetch(`http://localhost:3000/api/steam/achievements/${id}`)
        .then(res => res.json())
        .then(data => setAchievements(data))
        .catch(err => console.error('Failed to fetch achievements:', err));
    }
  }, [activeTab, id, achievements.length]);

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
      // Add to wishlist
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
        <Link to="/" className="absolute top-8 left-8 z-50 inline-flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition">
          ←
          Back to Store
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
              Fetching game information (ID: {id})
            </div>
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
      {/* Hero Background Section - TV Style */}
      <div className="relative h-[60vh] overflow-hidden">
        <img 
          src={game.backgroundImage || game.screenshots?.[0] || game.cover} 
          alt={game.title} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
        
        {/* Back Button Overlay */}
        <div className="absolute top-8 left-8 z-10">
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-lg hover:bg-black/90 transition">
            ←
            Back to Store
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 -mt-32 bg-gradient-to-b from-gray-950/80 via-gray-900/90 to-black">
        {/* Header with Cover */}
        <div className="px-8 pb-8">
          <div className="flex gap-8 mb-8">
            {/* Cover Image - Elegant & Optimized */}
            <div className="relative group flex-shrink-0">
              <img 
                src={game.cover} 
                alt={game.title} 
                className="w-48 h-[18rem] object-cover rounded-xl shadow-2xl ring-2 ring-cyan-500/30 group-hover:ring-cyan-400/60 transition-all duration-300 group-hover:shadow-cyan-500/20" 
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/192x288/1f1f2e/888888?text=Game+Cover';
                }} 
              />
              {game.lastUpdated && (
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-3 py-1 rounded text-xs text-gray-300 whitespace-nowrap">
                  Updated: {new Date(game.lastUpdated).toLocaleDateString()}
                </div>
              )}
              {/* Rating badge on cover */}
              <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-sm">
                ⭐ {typeof game.rating === 'number' ? game.rating.toFixed(1) : String(game.rating).replace('%', '')}
              </div>
            </div>
            
            {/* Game Info */}
            <div className="flex-1 pt-2">
              <h1 className="text-5xl font-bold mb-2 drop-shadow-lg">{game.title}</h1>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-lg text-gray-300 font-semibold">{game.developer}</span>
                <span className="text-sm text-gray-400">• {game.releaseDate}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {(Array.isArray(game.genres) ? game.genres : (game.genres ? game.genres.split(',').map(g => g.trim()) : [])).map(genre => (
                  <span key={genre} className="px-3 py-1 bg-gradient-to-r from-blue-600/40 to-cyan-600/40 text-blue-200 rounded-full text-sm backdrop-blur-sm">{genre}</span>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {!game.isInstalled ? (
                  <button 
                    onClick={() => setShowDownloadDialog(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-bold transition backdrop-blur-sm flex items-center gap-2 shadow-lg hover:shadow-green-500/30 transform hover:scale-105"
                  >
                    ⬇ Download ({game.size})
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        console.log('🎮 Launching game:', game.title);
                        alert(`🎮 Launching ${game.title}...`);
                      }}
                      className="px-6 py-3 bg-green-600/90 hover:bg-green-500 rounded-lg font-bold transition backdrop-blur-sm flex items-center gap-2 shadow-lg"
                    >
                      ▶ Play
                    </button>
                    <button 
                      onClick={() => {
                        const confirmed = confirm(`Uninstall ${game.title}?`);
                        if (confirmed) {
                          alert(`${game.title} has been uninstalled`);
                        }
                      }}
                      className="px-6 py-3 bg-red-600/90 hover:bg-red-500 rounded-lg font-bold transition backdrop-blur-sm flex items-center gap-2 shadow-lg"
                    >
                      🗑 Uninstall
                    </button>
                  </>
                )}
                
                {/* Wishlist Button */}
                <button 
                  onClick={toggleWishlist}
                  className={`px-6 py-3 rounded-lg font-bold transition backdrop-blur-sm flex items-center gap-2 shadow-lg transform hover:scale-105 ${
                    isInWishlist
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white'
                      : 'bg-gradient-to-r from-purple-600/60 to-pink-600/60 hover:from-purple-600 hover:to-pink-600 text-white'
                  }`}
                >
                  {isInWishlist ? '❤ Wishlisted' : '♡ Add to Wishlist'}
                </button>

                <button 
                  onClick={() => game.hasOnlineFix ? setShowOnlineFixDialog(true) : null}
                  className={`px-6 py-4 rounded-xl font-bold transition backdrop-blur-sm flex items-center gap-2 shadow-lg ${
                    game.hasOnlineFix 
                      ? 'bg-purple-600/90 hover:bg-purple-500 text-white' 
                      : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!game.hasOnlineFix}
                >
                  ⚡
                  Online Fix
                </button>
                <button 
                  onClick={() => game.hasBypassCrack ? setShowBypassDialog(true) : null}
                  className={`px-6 py-3 rounded-lg font-bold transition backdrop-blur-sm flex items-center gap-2 shadow-lg ${
                    game.hasBypassCrack 
                      ? 'bg-orange-600/90 hover:bg-orange-500 text-white' 
                      : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!game.hasBypassCrack}
                >
                  🔑 Bypass Crack
                </button>
                {game.isInstalled && (
                  <button 
                    onClick={() => setShowVerifyDialog(true)}
                    className="px-6 py-3 bg-blue-600/90 hover:bg-blue-500 rounded-lg font-bold transition backdrop-blur-sm flex items-center gap-2 shadow-lg text-white"
                  >
                    ✓ Verify
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-8 pb-8">
          <div className="flex gap-8">
            {/* Left Content */}
            <div className="flex-1">
              {/* Tabs */}
              <div className="flex gap-2 mb-8">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 rounded-xl font-medium transition backdrop-blur-sm ${
                      activeTab === tab.id
                        ? 'bg-cyan-600/90 text-white shadow-lg'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-3xl font-bold mb-6">About This Game</h3>
                      <div className="bg-gray-800/30 rounded-xl p-6 mb-8">
                        <p className="text-gray-300 leading-relaxed">{game.description}</p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-blue-500/20">
                          <h4 className="text-xl font-bold mb-4 text-blue-400">🎮 Game Features</h4>
                          <ul className="space-y-2 text-gray-300">
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Single-player campaign</li>
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> High-quality graphics</li>
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Immersive storyline</li>
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Multiple difficulty levels</li>
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
                              <span className="text-white font-bold">{game.size}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Release Year:</span>
                              <span className="text-white font-bold">{new Date(game.releaseDate).getFullYear()}</span>
                            </div>
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
                          {selectedImageIndex === 0 ? (
                            // Video thumbnail
                            game.videoId ? (
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
                              <img 
                                src={game.screenshots?.[0] || game.cover}
                                alt="Screenshot 1"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/1920x1080/1a1a1a/ffffff?text=No+Screenshot';
                                }}
                              />
                            )
                          ) : (
                            // Screenshot
                            <img 
                              src={game.screenshots?.[selectedImageIndex - 1] || game.cover}
                              alt={`Screenshot ${selectedImageIndex}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/1920x1080/1a1a1a/ffffff?text=No+Screenshot';
                              }}
                            />
                          )}
                          
                          {/* Navigation Arrows */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImageIndex(selectedImageIndex === 0 ? (game.screenshots?.length || 0) : selectedImageIndex - 1);
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
                              setSelectedImageIndex(selectedImageIndex === (game.screenshots?.length || 0) ? 0 : selectedImageIndex + 1);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Thumbnails */}
                      <div className="relative">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {/* Video Thumbnail - chỉ hiển thị nếu có video */}
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
                              onClick={() => setSelectedImageIndex(index + 1)}
                              className={`flex-shrink-0 w-32 h-20 rounded overflow-hidden border-2 transition-all ${
                                selectedImageIndex === index + 1 ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'border-transparent hover:border-gray-600'
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
                    </div>

                    {/* Video Modal */}
                    {showVideoModal && (
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
                          <iframe
                            className="w-full h-full rounded-lg"
                            src={game.videoId || `https://www.youtube.com/embed/dQw4w9WgXcQ`}
                            title="Game Trailer"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'system' && (
                  <div>
                    <h3 className="text-3xl font-bold mb-8">System Requirements</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Minimum */}
                      <div className="bg-yellow-500/10 rounded-xl p-6">
                        <h4 className="text-2xl font-bold mb-6 text-yellow-400">Minimum</h4>
                        <div className="space-y-6" dangerouslySetInnerHTML={{ 
                          __html: game.systemRequirements?.minimum?.replace(/<br\s*\/?>/gi, '<br/>').replace(/<strong>(.*?)<\/strong>/gi, '<div class="text-gray-400 text-sm mb-2">$1</div>').replace(/:\s*/g, '</div><div class="text-white text-xl font-bold mb-6">') || '<div class="text-gray-500">No data</div>'
                        }} />
                      </div>

                      {/* Recommended */}
                      <div className="bg-green-500/10 rounded-xl p-6">
                        <h4 className="text-2xl font-bold mb-6 text-green-400">Recommended</h4>
                        <div className="space-y-6" dangerouslySetInnerHTML={{ 
                          __html: game.systemRequirements?.recommended?.replace(/<br\s*\/?>/gi, '<br/>').replace(/<strong>(.*?)<\/strong>/gi, '<div class="text-gray-400 text-sm mb-2">$1</div>').replace(/:\s*/g, '</div><div class="text-white text-xl font-bold mb-6">') || '<div class="text-gray-500">No data</div>'
                        }} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'achievements' && (
                  <div>
                    <h3 className="text-3xl font-bold mb-8">Achievements</h3>
                    {achievements.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {achievements.map((ach, index) => (
                          <div key={index} className="bg-gray-800/50 rounded-xl p-4 flex gap-4 items-center hover:bg-gray-700/50 transition">
                            <img 
                              src={ach.icon} 
                              alt={ach.displayName}
                              className="w-16 h-16 rounded-lg"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/64/1a1a1a/ffffff?text=?';
                              }}
                            />
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-white mb-1">{ach.displayName}</h4>
                              <p className="text-sm text-gray-400">{ach.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🏆</div>
                        <p className="text-gray-400 text-lg">Loading achievements...</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'updates' && (
                  <div>
                    <h3 className="text-3xl font-bold mb-8">Update History</h3>
                    <div className="space-y-8">
                      {game.updateLog?.map((update, index) => (
                        <div key={index} className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-8 border-l-4 border-cyan-500 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between gap-6 mb-6">
                            <div>
                              <h4 className="text-3xl font-bold mb-2">Version {update.version}</h4>
                              <p className="text-gray-400 flex items-center gap-2">
                                📅 {update.date}
                              </p>
                            </div>
                            <div className="text-4xl">✨</div>
                          </div>
                          
                          {/* Update image/thumbnail */}
                          <div className="mb-6 rounded-lg overflow-hidden max-h-64">
                            <img 
                              src={`http://localhost:3000/api/steam/image/${id}/library?v=${index}`}
                              alt={`Update ${update.version}`}
                              className="w-full h-auto object-cover hover:scale-105 transition-transform"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                          
                          <div>
                            <h5 className="text-lg font-semibold mb-4 text-cyan-300">What's New:</h5>
                            <ul className="space-y-3">
                              {update.changes?.map((change, changeIndex) => (
                                <li key={changeIndex} className="text-gray-300 flex items-start gap-3">
                                  <span className="text-green-400 text-lg mt-1">✓</span>
                                  <span>{change}</span>
                                </li>
                              )) || <li className="text-gray-400">No changes listed</li>}
                            </ul>
                          </div>
                        </div>
                      )) || <p className="text-gray-400 text-lg">No update history available</p>}
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    <h3 className="text-3xl font-bold mb-8">User Reviews</h3>
                    <div className="grid md:grid-cols-2 gap-12">
                      <div className="bg-green-500/10 rounded-xl p-6">
                        <h4 className="text-2xl font-semibold mb-6">Overall Reviews</h4>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-48 bg-gray-700 rounded-full h-6 overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${game.reviews?.positive || 0}%` }}></div>
                            </div>
                            <span className="text-green-400 text-xl font-bold">{game.reviews?.positive || 0}% Positive</span>
                          </div>
                          <p className="text-gray-400 text-lg">{game.reviews?.total?.toLocaleString() || 0} total reviews</p>
                        </div>
                      </div>
                      <div className="bg-blue-500/10 rounded-xl p-6">
                        <h4 className="text-2xl font-semibold mb-6">Recent Reviews</h4>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-48 bg-gray-700 rounded-full h-6 overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${game.reviews?.recent?.positive || 0}%` }}></div>
                            </div>
                            <span className="text-green-400 text-xl font-bold">{game.reviews?.recent?.positive || 0}% Positive</span>
                          </div>
                          <p className="text-gray-400 text-lg">{game.reviews?.recent?.total?.toLocaleString() || 0} recent reviews</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'dlc' && (
                  <div>
                    <h3 className="text-3xl font-bold mb-8">Downloadable Content</h3>
                    <div className="space-y-6">
                      {game.dlcs?.map((dlc, index) => (
                        <div key={index} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 flex gap-4">
                          <img 
                            src={`http://localhost:3000/api/steam/image/${game.id}/capsule`}
                            alt={dlc.name}
                            className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="flex justify-between items-start flex-1">
                            <div className="flex-1">
                              <h4 className="text-xl font-bold mb-2">{dlc.name}</h4>
                              <p className="text-gray-300 mb-3">{dlc.description}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>Released: {dlc.releaseDate}</span>
                                <span>Size: {dlc.size}</span>
                                <span className={`px-2 py-1 rounded ${dlc.installed ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}>
                                  {dlc.installed ? 'Installed' : 'Not Installed'}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-lg font-bold text-cyan-400">{dlc.price}</span>
                              <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition text-white">
                                Manage DLC
                              </button>
                            </div>
                          </div>
                        </div>
                      )) || <p className="text-gray-400">No DLC available</p>}
                    </div>
                  </div>
                )}

                {activeTab === 'properties' && (
                  <div>
                    <h3 className="text-3xl font-bold mb-8">Game Properties</h3>
                    <div className="space-y-8">
                      {/* Install Location */}
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
                        <div className="flex gap-3">
                          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm">
                            Open Folder
                          </button>
                          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm">
                            Move Install Folder
                          </button>
                        </div>
                      </div>

                      {/* Language Settings */}
                      <div className="bg-gray-800/50 rounded-xl p-6">
                        <h4 className="text-xl font-bold mb-4">Language</h4>
                        <select 
                          value={game.gameLanguage}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="English">English</option>
                          <option value="French">Français</option>
                          <option value="German">Deutsch</option>
                          <option value="Spanish">Español</option>
                          <option value="Japanese">日本語</option>
                          <option value="Korean">한국어</option>
                          <option value="Chinese">中文</option>
                        </select>
                      </div>

                      {/* Launch Options */}
                      <div className="bg-gray-800/50 rounded-xl p-6">
                        <h4 className="text-xl font-bold mb-4">Launch Options</h4>
                        <input 
                          type="text" 
                          placeholder="Set launch options..."
                          value={game.launchOptions}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                        />
                        <p className="text-sm text-gray-400 mt-2">Advanced users can set command line arguments here</p>
                      </div>

                      {/* Auto-Update */}
                      <div className="bg-gray-800/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xl font-bold mb-2">Automatic Updates</h4>
                            <p className="text-gray-400">Keep this game up to date automatically</p>
                          </div>
                          <button className={`relative w-16 h-8 rounded-full transition-colors ${
                            game.autoUpdate ? 'bg-cyan-600' : 'bg-gray-600'
                          }`}>
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                              game.autoUpdate ? 'translate-x-9' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      </div>

                      {/* Backup & Restore */}
                      <div className="bg-gray-800/50 rounded-xl p-6">
                        <h4 className="text-xl font-bold mb-4">Backup & Restore</h4>
                        <div className="flex gap-3">
                          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition font-medium">
                            Create Backup
                          </button>
                          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium">
                            Restore from Backup
                          </button>
                        </div>
                      </div>

                      {/* File Integrity */}
                      <div className="bg-gray-800/50 rounded-xl p-6">
                        <h4 className="text-xl font-bold mb-4">File Integrity</h4>
                        <div className="flex gap-3">
                          <button className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg transition font-medium">
                            Verify Game Files
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-96 space-y-6">
              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6">Game Info</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Developer:</span>
                    <span className="font-medium">{game.developer}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Publisher:</span>
                    <span className="font-medium">{game.publisher}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Release Date:</span>
                    <span className="font-medium">{game.releaseDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Last Updated:</span>
                    <span className="font-medium">{game.lastUpdated}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Version:</span>
                    <span className="font-medium">{game.version}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Size:</span>
                    <span className="font-medium">{game.size}</span>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6">Steam Store</h3>
                <a href={game.steamUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 bg-blue-600/90 hover:bg-blue-500 rounded-xl transition backdrop-blur-sm shadow-lg">
                  🎮
                  View on Steam
                </a>
              </div>

              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {game.tags?.map(tag => (
                    <span key={tag} className="px-3 py-2 bg-gray-700/50 text-gray-300 rounded-full text-sm backdrop-blur-sm">{tag}</span>
                  )) || <span className="text-gray-400">No tags available</span>}
                </div>
              </div>

              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6">Languages</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {game.languages?.map(lang => (
                    <span key={lang} className="text-gray-300">{lang}</span>
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Install Location</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={installPath}
                    onChange={(e) => setInstallPath(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <button 
                    onClick={() => {
                      if (window.electron?.selectFolder) {
                        window.electron.selectFolder().then(path => {
                          if (path) setInstallPath(path);
                        });
                      }
                    }}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium"
                  >
                    Browse
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">Path: {installPath}\{game.title}</p>
              </div>

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
                onClick={() => {
                  // Start download
                  fetch('http://localhost:3000/api/downloads/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      gameId: game.id,
                      title: game.title,
                      cover: game.cover,
                      totalSize: game.size
                    })
                  })
                  .then(res => res.json())
                  .then(data => {
                    console.log('Download started:', data);
                    setShowDownloadDialog(false);
                  })
                  .catch(err => {
                    console.error('Download error:', err);
                  });
                }}
                className="flex-1 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition font-bold text-lg flex items-center justify-center gap-2"
              >
                <span>⬇</span>
                Start Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Online Fix Dialog */}
      {showOnlineFixDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-800">
            <h2 className="text-2xl font-bold mb-4">⚡ Online Fix</h2>
            <p className="text-gray-300 mb-6">This online fix allows {game.title} to connect to multiplayer servers.</p>
            <div className="space-y-3 mb-6 text-sm text-gray-400">
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Enables multiplayer connectivity</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Bypasses DRM restrictions</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Automatically applied on launch</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowOnlineFixDialog(false)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition">Cancel</button>
              <button 
                onClick={() => {
                  alert(`✓ Online fix downloaded and installed for ${game.title}`);
                  setShowOnlineFixDialog(false);
                }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg transition font-bold"
              >
                Download & Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bypass Dialog */}
      {showBypassDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-800">
            <h2 className="text-2xl font-bold mb-4">🔑 Crack Bypass</h2>
            <p className="text-gray-300 mb-6">This bypass will allow {game.title} to run without the original disc or DRM verification.</p>
            <div className="space-y-3 mb-6 text-sm text-gray-400">
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Removes DRM check requirement</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Allows offline play</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-orange-400 mt-1">⚠</span>
                <span>May require Steam running in background</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBypassDialog(false)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition">Cancel</button>
              <button 
                onClick={() => {
                  alert(`✓ Crack bypass installed for ${game.title}`);
                  setShowBypassDialog(false);
                }}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg transition font-bold"
              >
                Install
              </button>
            </div>
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
                      // Simulate verification process
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