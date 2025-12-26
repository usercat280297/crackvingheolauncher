import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * EnhancedCarousel Component
 * Beautiful game carousel with names from SteamGridDB and hero images
 * 
 * Props:
 *   - games: Array of game objects with appId
 */
const EnhancedCarousel = ({ games = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [gameAssets, setGameAssets] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch beautiful names and images from SteamGridDB
  useEffect(() => {
    if (games.length === 0) return;

    const fetchAssets = async () => {
      try {
        const appIds = games.map(g => g.appId || g.id);
        const response = await axios.post('/api/steamgriddb/batch', { appIds });
        
        if (response.data.success) {
          setGameAssets(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching game assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [games]);

  // Auto-rotate carousel every 6 seconds
  useEffect(() => {
    if (games.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % games.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [games.length]);

  if (games.length === 0) {
    return <div className="carousel-empty">No games to display</div>;
  }

  const currentGame = games[currentSlide];
  const currentAsset = gameAssets[currentGame.appId || currentGame.id] || {};
  const beautifulName = currentAsset.beautifulName || currentGame.name || 'Unknown Game';
  const heroImage = currentAsset.heroImage || currentGame.image || '/placeholder.jpg';
  const logoImage = currentAsset.logoImage;

  const goToSlide = (index) => {
    setCurrentSlide(index % games.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % games.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + games.length) % games.length);
  };

  return (
    <div className="enhanced-carousel">
      <div className="carousel-container">
        {/* Hero Image Background */}
        <div 
          className="carousel-slide"
          style={{
            backgroundImage: `url('${heroImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Gradient Overlay */}
          <div className="carousel-overlay"></div>

          {/* Content */}
          <div className="carousel-content">
            {/* Logo or Beautiful Name */}
            {logoImage ? (
              <img 
                src={logoImage} 
                alt={beautifulName}
                className="carousel-logo"
              />
            ) : (
              <h2 className="carousel-title">{beautifulName}</h2>
            )}

            {/* Play Button */}
            <button className="carousel-play-btn">
              ▶ Play Now
            </button>
          </div>

          {/* Navigation Buttons */}
          <button 
            className="carousel-nav carousel-nav-prev"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            ❮
          </button>

          <button 
            className="carousel-nav carousel-nav-next"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            ❯
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="carousel-indicators">
          {games.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Carousel Info */}
      <div className="carousel-info">
        <p className="carousel-current">
          {currentSlide + 1} / {games.length}
        </p>
      </div>

      <style>{`
        .enhanced-carousel {
          width: 100%;
          margin: 20px 0;
        }

        .carousel-container {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%; /* 16:9 aspect ratio */
          background: #000;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .carousel-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .carousel-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%);
          z-index: 1;
        }

        .carousel-content {
          position: relative;
          z-index: 2;
          text-align: center;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .carousel-logo {
          max-width: 300px;
          max-height: 150px;
          object-fit: contain;
        }

        .carousel-title {
          font-size: 48px;
          font-weight: bold;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        }

        .carousel-play-btn {
          padding: 12px 30px;
          font-size: 18px;
          background: #ff6b6b;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: bold;
        }

        .carousel-play-btn:hover {
          background: #ff5252;
          transform: scale(1.05);
        }

        .carousel-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.3);
          color: white;
          border: none;
          padding: 15px 20px;
          font-size: 24px;
          cursor: pointer;
          z-index: 3;
          transition: all 0.3s ease;
          border-radius: 4px;
        }

        .carousel-nav:hover {
          background: rgba(255, 255, 255, 0.6);
        }

        .carousel-nav-prev {
          left: 20px;
        }

        .carousel-nav-next {
          right: 20px;
        }

        .carousel-indicators {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 3;
        }

        .indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .indicator.active {
          background: white;
          width: 30px;
          border-radius: 6px;
        }

        .carousel-info {
          text-align: right;
          padding: 10px 0;
          color: #666;
          font-size: 14px;
        }

        .carousel-empty {
          padding: 40px;
          text-align: center;
          color: #999;
          background: #f5f5f5;
          border-radius: 8px;
        }

        @media (max-width: 768px) {
          .carousel-title {
            font-size: 32px;
          }

          .carousel-nav {
            padding: 10px 15px;
            font-size: 18px;
          }

          .carousel-logo {
            max-width: 200px;
            max-height: 100px;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedCarousel;
