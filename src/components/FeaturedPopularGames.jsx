import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DenuvoIndicator from './DenuvoIndicator';

// Fetch hero image and game name from Steam API
const fetchGameHeroImage = async (appId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/steam/game/${appId}`);
    if (response.ok) {
      const data = await response.json();
      return {
        name: data.name,
        heroImage: data.images?.hero || data.images?.headerImage || `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
        description: data.shortDescription || data.description
      };
    }
  } catch (error) {
    console.warn('Failed to fetch hero image for appId:', appId, error);
  }
  return {
    name: 'Game',
    heroImage: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
    description: ''
  };
};

// Fetch beautiful game names from SteamGridDB
const fetchBeautifulNames = async (appIds) => {
  try {
    if (!appIds || appIds.length === 0) return {};
    const response = await fetch(`http://localhost:3000/api/beautiful-game-names/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appIds })
    });
    if (response.ok) {
      const data = await response.json();
      return data.names || {};
    }
  } catch (error) {
    console.warn('Failed to fetch beautiful names:', error);
  }
  return {};
};

// Fetch Denuvo status for multiple games from API (accurate, not cached)
const fetchDenuvoStatuses = async (appIds) => {
  try {
    if (!appIds || appIds.length === 0) return {};
    const statuses = {};
    for (const appId of appIds) {
      try {
        const response = await fetch(`http://localhost:3000/api/denuvo/check/${appId}`);
        if (response.ok) {
          const data = await response.json();
          statuses[appId] = data.hasDenuvo || false;
        }
      } catch (e) {
        console.warn(`Failed to fetch Denuvo for ${appId}:`, e);
      }
    }
    return statuses;
  } catch (error) {
    console.warn('Failed to fetch Denuvo statuses:', error);
  }
  return {};
};

export default function FeaturedPopularGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroImages, setHeroImages] = useState({});
  const [beautifulNames, setBeautifulNames] = useState({});
  const [denuvoStatuses, setDenuvoStatuses] = useState({});

  useEffect(() => {
    const fetchPopularGames = async () => {
      try {
        setLoading(true);
        
        // Versioned cache with migration and normalization to avoid stale flags
        const CACHE_VERSION = 'v2';
        const cacheKey = `popular_games_cache_${CACHE_VERSION}`;
        const cacheTimeKey = `popular_games_cache_time_${CACHE_VERSION}`;
        const legacyKey = 'popular_games_cache';

        const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

        // Normalizer - ensure consistent shape for games and denuvo flag
        const normalizeGames = (list) => {
          if (!Array.isArray(list)) return [];
          return list.map(g => ({
            ...g,
            appId: g.appId || g.id || g.appid || null,
            name: g.title || g.name || g.displayTitle || g.name || 'Game',
            hasDenuvo: typeof g.hasDenuvo === 'boolean' ? g.hasDenuvo : (g.isDenuvo === true ? true : (g.hasDenuvo === false ? false : undefined)),
          }));
        };

        // Migrate legacy cache if present
        try {
          const legacy = localStorage.getItem(legacyKey);
          if (legacy && !localStorage.getItem(cacheKey)) {
            const parsed = JSON.parse(legacy);
            const migrated = normalizeGames(parsed);
            localStorage.setItem(cacheKey, JSON.stringify({ version: CACHE_VERSION, games: migrated }));
            localStorage.setItem(cacheTimeKey, Date.now().toString());
          }
        } catch (e) {
          console.warn('Cache migration failed:', e.message);
        }

        // Use cache if available and less than CACHE_DURATION
        const cachedRaw = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(cacheTimeKey);

        if (cachedRaw && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATION) {
          try {
            const container = JSON.parse(cachedRaw);
            const cachedGames = Array.isArray(container?.games) ? container.games : container;
            const normalized = normalizeGames(cachedGames);
            setGames(normalized);
            // Fetch hero images for cached games
            await fetchHeroImagesForGames(normalized);
            setLoading(false);
            return;
          } catch (e) {
            console.warn('Cache parse error:', e);
          }
        }
        
        // Fetch popular games with Denuvo badge
        const response = await fetch('http://localhost:3000/api/most-popular?limit=10', {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const popularGames = data?.data || data?.games || [];
          
          // If no games, use fallback list
          if (popularGames.length === 0) {
            setGames(FALLBACK_POPULAR_GAMES);
            await fetchHeroImagesForGames(FALLBACK_POPULAR_GAMES);
          } else {
            setGames(popularGames);
            // Fetch hero images and beautiful game names
            await fetchHeroImagesForGames(popularGames);
            // Fetch beautiful names from SteamGridDB
            const appIds = popularGames.map(g => g.appId || g.id).filter(Boolean);
            if (appIds.length > 0) {
              const names = await fetchBeautifulNames(appIds);
              setBeautifulNames(names);
              // Fetch accurate Denuvo statuses from API (not cached flags)
              const denuvoStats = await fetchDenuvoStatuses(appIds);
              setDenuvoStatuses(denuvoStats);
            }
            // Save normalized games to versioned cache
            try {
              const normalized = normalizeGames(popularGames);
              localStorage.setItem(cacheKey, JSON.stringify({ version: CACHE_VERSION, games: normalized }));
              localStorage.setItem(cacheTimeKey, Date.now().toString());
            } catch (e) {
              console.warn('Failed to save popular games cache:', e.message);
            }
          }
        } else {
          setGames(FALLBACK_POPULAR_GAMES);
          await fetchHeroImagesForGames(FALLBACK_POPULAR_GAMES);
        }
      } catch (err) {
        console.error('Error fetching popular games:', err);
        setGames(FALLBACK_POPULAR_GAMES);
        await fetchHeroImagesForGames(FALLBACK_POPULAR_GAMES);
      } finally {
        setLoading(false);
      }
    };

    const fetchHeroImagesForGames = async (gameList) => {
      const heroData = {};
      for (const game of gameList) {
        const appId = game.appId || game.id;
        const imageData = await fetchGameHeroImage(appId);
        heroData[appId] = imageData;
      }
      setHeroImages(heroData);
    };

    fetchPopularGames();
  }, []);

  // Auto-rotate slides
  useEffect(() => {
    if (games.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % games.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [games.length]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + games.length) % games.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % games.length);
  };

  if (loading) {
    return (
      <div className="featured-section">
        <div className="featured-placeholder">
          <div className="skeleton-loader"></div>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return null;
  }

  const currentGame = games[currentSlide];

  return (
    <div className="featured-section">
      <style>{`
        .featured-section {
          margin-bottom: 40px;
          position: relative;
        }

        .featured-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          font-size: 26px;
          font-weight: bold;
          color: #fff;
          padding: 0 10px;
        }

        .featured-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: linear-gradient(135deg, rgba(255, 152, 0, 0.9), rgba(255, 193, 7, 0.9));
          border-radius: 20px;
          color: white;
          font-size: 13px;
          font-weight: bold;
          border: 1px solid rgba(255, 193, 7, 0.5);
          margin-left: auto;
          box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
        }

        .featured-carousel {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          aspect-ratio: 21 / 9;
          background: rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(0, 188, 212, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .carousel-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.6s ease-in-out;
        }

        .carousel-slide.active {
          opacity: 1;
        }

        .slide-background {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          filter: brightness(0.6) blur(2px);
        }

        .slide-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.5) 0%,
            rgba(0, 0, 0, 0.2) 50%,
            rgba(0, 0, 0, 0.5) 100%
          );
        }

        .slide-content {
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 30px;
          z-index: 2;
        }

        .slide-image {
          width: 220px;
          height: 310px;
          border-radius: 12px;
          overflow: hidden;
          border: 4px solid rgba(0, 188, 212, 0.6);
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 188, 212, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .carousel-slide.active .slide-image {
          transform: scale(1.05);
          box-shadow: 0 16px 56px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 188, 212, 0.3);
        }

        .slide-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .slide-info {
          flex: 1;
          margin-left: 50px;
          color: white;
        }

        .slide-title {
          font-size: 38px;
          font-weight: bold;
          margin-bottom: 14px;
          text-shadow: 3px 3px 12px rgba(0, 0, 0, 0.9);
          line-height: 1.2;
        }

        .slide-badges {
          display: flex;
          gap: 12px;
          margin-bottom: 18px;
          flex-wrap: wrap;
          align-items: center;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: bold;
          background: rgba(0, 188, 212, 0.3);
          border: 1px solid rgba(0, 188, 212, 0.5);
          color: #00bcd4;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        }

        .badge.denuvo {
          background: rgba(255, 107, 107, 0.3);
          border-color: rgba(255, 107, 107, 0.5);
          color: #ff6b6b;
        }

        .badge.drm-free {
          background: rgba(76, 175, 80, 0.3);
          border-color: rgba(76, 175, 80, 0.5);
          color: #4caf50;
          font-weight: bold;
        }

        .badge.excellent {
          background: rgba(255, 193, 7, 0.3);
          border-color: rgba(255, 193, 7, 0.5);
          color: #ffc107;
          font-weight: bold;
        }

        .badge.trending {
          background: rgba(255, 152, 0, 0.3);
          border-color: rgba(255, 152, 0, 0.5);
          color: #ff9800;
        }

        .slide-description {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 20px;
          max-width: 500px;
          line-height: 1.6;
        }

        .slide-stats {
          display: flex;
          gap: 30px;
          margin-bottom: 20px;
        }

        .stat {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 18px;
          font-weight: bold;
          color: #00bcd4;
        }

        .slide-buttons {
          display: flex;
          gap: 15px;
        }

        .btn-featured {
          padding: 12px 28px;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 14px;
        }

        .btn-featured-primary {
          background: linear-gradient(135deg, #00bcd4, #0097a7);
          color: white;
        }

        .btn-featured-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 188, 212, 0.3);
        }

        .btn-featured-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .btn-featured-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .carousel-controls {
          position: absolute;
          bottom: 20px;
          left: 30px;
          display: flex;
          gap: 10px;
          z-index: 10;
        }

        .control-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(0, 188, 212, 0.5);
          color: #00bcd4;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .control-btn:hover {
          background: rgba(0, 188, 212, 0.3);
          border-color: #00bcd4;
        }

        .carousel-indicators {
          position: absolute;
          bottom: 20px;
          right: 30px;
          display: flex;
          gap: 8px;
          z-index: 10;
        }

        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.3s;
          border: 2px solid transparent;
        }

        .indicator.active {
          background: #00bcd4;
          width: 24px;
          border-radius: 4px;
          border-color: #00bcd4;
        }

        .indicator:hover {
          background: rgba(255, 255, 255, 0.6);
        }

        .featured-placeholder {
          aspect-ratio: 21 / 9;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          border: 2px solid rgba(0, 188, 212, 0.3);
          overflow: hidden;
        }

        .skeleton-loader {
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.15) 50%,
            rgba(255, 255, 255, 0.05) 100%
          );
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }

        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 768px) {
          .slide-content {
            flex-direction: column;
            padding: 20px;
          }

          .slide-image {
            width: 150px;
            height: 210px;
          }

          .slide-info {
            margin-left: 0;
            margin-top: 20px;
          }

          .slide-title {
            font-size: 20px;
          }

          .slide-buttons {
            flex-direction: column;
          }

          .btn-featured {
            width: 100%;
          }
        }
      `}</style>

      {/* Title */}
      <div className="featured-title">
      </div>

      {/* Carousel */}
      <div className="featured-carousel">
        {games.map((game, index) => {
          const appId = game.appId || game.id;
          const heroData = heroImages[appId] || {};
          // Prioritize: beautiful name > hero data name > game.name
          const beautifulName = beautifulNames[appId];
          const gameName = beautifulName || heroData.name || game.name || game.title;
          const heroImage = heroData.heroImage || game.headerImage || game.cover_image || `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
          
          return (
          <Link
            key={appId || index}
            to={`/game/${appId}`}
            className={`carousel-slide ${index === currentSlide ? 'active' : ''} cursor-pointer`}
          >
            {/* Background Image (Hero) */}
            <div
              className="slide-background"
              style={{
                backgroundImage: `url(${heroImage})`
              }}
            />
            <div className="slide-overlay" />

            {/* Content */}
            <div className="slide-content">
              {/* Game Image (Cover) */}
              <div className="slide-image">
                <img
                  src={game.cover || game.cover_image || `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`}
                  alt={gameName}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="280" style="background:%23333"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>

              {/* Info */}
              <div className="slide-info">
                <h2 className="slide-title">{gameName}</h2>

                {/* Badges */}
                <div className="slide-badges">
                  {/* Denuvo Badge using API-fetched accurate status */}
                  {denuvoStatuses[appId] === true && (
                    <DenuvoIndicator hasDenuvo={true} />
                  )}
                  {denuvoStatuses[appId] === false && (
                    <DenuvoIndicator hasDenuvo={false} />
                  )}
                  
                  {/* Other badges */}
                  {game.badge && game.badge !== '⚡ Denuvo' && game.badge !== '🚫 Denuvo Protected' && (
                    <span className="badge">{game.badge}</span>
                  )}
                  {game.metacritic?.score && game.metacritic.score >= 85 && (
                    <span className="badge excellent">⭐ Xếp hạng {game.metacritic.score}</span>
                  )}
                  {game.playcount && game.playcount > 500000 && !game.isDenuvo && !game.hasDenuvo && (
                    <span className="badge trending">🏆 Nổi bật</span>
                  )}
                  {game.releaseDate && new Date(game.releaseDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
                    <span className="badge trending">✨ Mới nhất</span>
                  )}
                </div>

                {/* Description */}
                {game.shortDescription && (
                  <p className="slide-description">
                    {game.shortDescription.substring(0, 120)}...
                  </p>
                )}

                {/* Stats - Only show if values exist */}
                <div className="slide-stats">
                  {game.playcount && game.playcount > 0 && (
                    <div className="stat">
                      <span className="stat-label">Người chơi</span>
                      <span className="stat-value">
                        {(game.playcount / 1000).toFixed(0)}K+
                      </span>
                    </div>
                  )}
                  {game.metacritic?.score && game.metacritic.score > 0 && (
                    <div className="stat">
                      <span className="stat-label">Điểm Metacritic</span>
                      <span className="stat-value">{game.metacritic.score}</span>
                    </div>
                  )}
                  {game.priceUSD && game.priceUSD > 0 && (
                    <div className="stat">
                      <span className="stat-label">Giá</span>
                      <span className="stat-value">${game.priceUSD}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
        })}

        {/* Controls */}
        <div className="carousel-controls">
          <button className="control-btn" onClick={handlePrevSlide}>
            ◀
          </button>
          <button className="control-btn" onClick={handleNextSlide}>
            ▶
          </button>
        </div>

        {/* Indicators */}
        <div className="carousel-indicators">
          {games.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Fallback popular games if API fails - ACCURATE Denuvo status
const FALLBACK_POPULAR_GAMES = [
  // ACCURATE: Has Denuvo
  {
    appId: 2358720,
    name: 'Black Myth: Wukong',
    title: 'Black Myth: Wukong',
    hasDenuvo: true,
    playcount: 1200000,
    metacritic: { score: 80 },
    headerImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2358720/header.jpg',
    shortDescription: 'Action RPG inspired by Chinese mythology with stunning visuals'
  },
  // ACCURATE: NO Denuvo
  {
    appId: 1091500,
    name: 'Cyberpunk 2077',
    title: 'Cyberpunk 2077',
    hasDenuvo: false,
    playcount: 500000,
    metacritic: { score: 86 },
    headerImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg',
    shortDescription: 'Open-world RPG set in Night City with branching story'
  },
  // ACCURATE: NO Denuvo
  {
    appId: 1245620,
    name: 'ELDEN RING',
    title: 'ELDEN RING',
    hasDenuvo: false,
    playcount: 600000,
    metacritic: { score: 96 },
    headerImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg',
    shortDescription: 'Open-world action RPG with Souls-like gameplay'
  },
  // ACCURATE: Has Denuvo
  {
    appId: 2054790,
    name: 'Dragon\'s Dogma 2',
    title: 'Dragon\'s Dogma 2',
    hasDenuvo: true,
    playcount: 350000,
    metacritic: { score: 79 },
    headerImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2054790/header.jpg',
    shortDescription: 'Action RPG with dragon-slaying and party combat'
  },
  // ACCURATE: Has Denuvo
  {
    appId: 2515020,
    name: 'FINAL FANTASY XVI',
    title: 'FINAL FANTASY XVI',
    hasDenuvo: true,
    playcount: 450000,
    metacritic: { score: 83 },
    headerImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2515020/header.jpg',
    shortDescription: 'Action-rich fantasy adventure with iconic FF characters'
  },
  // ACCURATE: NO Denuvo
  {
    appId: 1174180,
    name: 'Red Dead Redemption 2',
    title: 'Red Dead Redemption 2',
    hasDenuvo: false,
    playcount: 1000000,
    metacritic: { score: 97 },
    headerImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg',
    shortDescription: 'Epic western action-adventure from Rockstar'
  },
  // ACCURATE: Has Denuvo
  {
    appId: 2124490,
    name: 'SILENT HILL 2',
    title: 'SILENT HILL 2',
    hasDenuvo: true,
    playcount: 280000,
    metacritic: { score: 80 },
    headerImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2124490/header.jpg',
    shortDescription: 'Psychological horror masterpiece with immersive atmosphere'
  },
  // ACCURATE: Has Denuvo
  {
    appId: 1364780,
    name: 'STREET FIGHTER 6',
    title: 'STREET FIGHTER 6',
    hasDenuvo: true,
    playcount: 400000,
    metacritic: { score: 87 },
    headerImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1364780/header.jpg',
    shortDescription: 'Modern fighting game with legendary characters'
  },
  // ACCURATE: Has Denuvo
  {
    appId: 2246340,
    name: 'Monster Hunter: Wilds',
    title: 'Monster Hunter: Wilds',
    hasDenuvo: true,
    playcount: 800000,
    metacritic: { score: 88 },
    headerImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2246340/header.jpg',
    shortDescription: 'Hunt massive monsters in this action-packed adventure'
  },
  // ACCURATE: NO Denuvo
  {
    appId: 271590,
    name: 'Grand Theft Auto V',
    title: 'Grand Theft Auto V',
    hasDenuvo: false,
    playcount: 2000000,
    metacritic: { score: 97 },
    headerImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg',
    shortDescription: 'Open-world action adventure in Los Santos'
  }
];
