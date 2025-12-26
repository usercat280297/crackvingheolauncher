/**
 * ============================================
 * ENHANCED CAROUSEL COMPONENT
 * Beautiful game names from SteamGridDB
 * ============================================
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const EnhancedCarousel = ({ games = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [gameAssets, setGameAssets] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (games.length === 0) return;

    // Fetch SteamGridDB data for all games
    const fetchGameAssets = async () => {
      try {
        setLoading(true);
        const appIds = games.map(g => g.id).filter(id => id);
        
        const response = await fetch('http://localhost:3000/api/steamgriddb/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ steamIds: appIds }),
        });

        const data = await response.json();
        if (data.success && data.data) {
          setGameAssets(data.data);
        }
      } catch (error) {
        console.warn('Failed to fetch SteamGridDB assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameAssets();

    // Auto-rotate carousel
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % Math.max(games.length, 1));
    }, 6000); // Change slide every 6 seconds

    return () => clearInterval(interval);
  }, [games]);

  if (games.length === 0) {
    return <div className="carousel-empty">No games available</div>;
  }

  const game = games[currentSlide];
  const asset = gameAssets[game?.id];

  return (
    <div className="carousel-container">
      {/* Auto-scrolling carousel */}
      <div className="carousel-wrapper">
        <div 
          className="carousel-slides"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {games.map((g, idx) => {
            const assetData = gameAssets[g.id];
            
            return (
              <Link
                key={`${g.id}-${idx}`}
                to={`/game/${g.id}`}
                className="carousel-slide group relative min-w-full h-96 flex-shrink-0 cursor-pointer"
              >
                {/* Hero background image */}
                <img
                  src={assetData?.hero || g.cover || `https://via.placeholder.com/1600x400/1f1f2e/888888`}
                  alt={assetData?.name || g.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/1600x400/1f1f2e/888888`;
                  }}
                />

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent opacity-70 group-hover:opacity-60 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                {/* Game info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                  {/* Beautiful game name (from SteamGridDB) */}
                  <div className="mb-3">
                    {assetData?.logo ? (
                      <img
                        src={assetData.logoThumb || assetData.logo}
                        alt={assetData.name}
                        className="h-16 object-contain mb-2"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <h2 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">
                        {assetData?.name || g.title}
                      </h2>
                    )}
                  </div>

                  {/* Game metadata */}
                  <div className="flex flex-wrap gap-3">
                    {g.developer && (
                      <span className="text-sm bg-black bg-opacity-50 px-3 py-1 rounded backdrop-blur-sm">
                        👨‍💻 {g.developer}
                      </span>
                    )}
                    {g.releaseDate && (
                      <span className="text-sm bg-black bg-opacity-50 px-3 py-1 rounded backdrop-blur-sm">
                        📅 {new Date(g.releaseDate).getFullYear()}
                      </span>
                    )}
                    {g.genres && g.genres[0] && (
                      <span className="text-sm bg-black bg-opacity-50 px-3 py-1 rounded backdrop-blur-sm">
                        🎮 {g.genres[0]}
                      </span>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg font-semibold transition-all transform group-hover:translate-x-1">
                    View Details →
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Navigation controls */}
      <div className="carousel-controls flex items-center justify-between absolute bottom-6 left-6 right-6 z-20">
        {/* Previous button */}
        <button
          onClick={() => setCurrentSlide(prev => (prev - 1 + games.length) % games.length)}
          className="w-12 h-12 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white flex items-center justify-center transition-all hover:scale-110"
        >
          ◀
        </button>

        {/* Slide indicators */}
        <div className="flex gap-2">
          {games.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide 
                  ? 'w-8 bg-cyan-500' 
                  : 'w-2 bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
            />
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => setCurrentSlide(prev => (prev + 1) % games.length)}
          className="w-12 h-12 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white flex items-center justify-center transition-all hover:scale-110"
        >
          ▶
        </button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-30">
          <div className="w-8 h-8 border-4 border-cyan-500 border-opacity-30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default EnhancedCarousel;
