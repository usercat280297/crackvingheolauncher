import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import PageHeader from '../components/PageHeader';

export default function Wishlist() {
  const { t } = useLanguage();
  const [wishlist, setWishlist] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    // Load wishlist from localStorage
    const saved = localStorage.getItem('wishlist');
    if (saved) {
      setWishlist(JSON.parse(saved));
    }
  }, []);

  const removeFromWishlist = (gameId) => {
    const updated = wishlist.filter(g => g.id !== gameId);
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  };

  const clearWishlist = () => {
    if (confirm('Are you sure you want to clear your entire wishlist?')) {
      setWishlist([]);
      localStorage.removeItem('wishlist');
    }
  };

  const handleSort = (sortType) => {
    let sorted = [...wishlist];
    switch (sortType) {
      case 'name':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'rating':
        sorted.sort((a, b) => {
          const ratingA = typeof a.rating === 'number' ? a.rating : parseFloat(a.rating) || 0;
          const ratingB = typeof b.rating === 'number' ? b.rating : parseFloat(b.rating) || 0;
          return ratingB - ratingA;
        });
        break;
      case 'date':
      default:
        sorted = [...wishlist];
    }
    setWishlist(sorted);
    setSortBy(sortType);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black" style={{ paddingTop: '104px' }}>
      <PageHeader title={`${wishlist.length} games`}>
        {wishlist.length > 0 && (
          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className="px-4 py-2 bg-gray-800/60 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition"
            >
              <option value="date">Recently Added</option>
              <option value="name">Name A-Z</option>
              <option value="rating">Highest Rated</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            <button
              onClick={clearWishlist}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-lg transition"
            >
              Clear All
            </button>
          </div>
        )}
      </PageHeader>
      
      {/* Header */}
      <div className="px-8 pt-6 pb-4">
        <h1 className="text-4xl font-bold text-white">♥ My Wishlist</h1>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 mb-6 bg-gray-800/50 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Your Wishlist is Empty</h3>
            <p className="text-gray-400 mb-6">Start adding games to your wishlist to keep track of games you want!</p>
            <Link
              to="/"
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-medium rounded-lg transition shadow-lg shadow-cyan-500/20"
            >
              Explore Games
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {wishlist.map((game) => (
              <div key={game.id} className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/30 hover:border-cyan-500/50 transition">
                <Link to={`/game/${game.id}`} className="block">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={game.cover || `http://localhost:3000/api/steam/image/${game.id}/header`}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/300x400/1f1f2e/888888?text=Game')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </Link>
                
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-white line-clamp-2 mb-2">{game.title}</h3>
                  {game.rating && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-xs text-yellow-400">⭐ {typeof game.rating === 'number' ? game.rating.toFixed(1) : game.rating}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeFromWishlist(game.id)}
                  className="absolute top-2 right-2 p-2 bg-red-600/80 hover:bg-red-600 rounded-lg transition opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {wishlist.map((game) => (
              <Link
                key={game.id}
                to={`/game/${game.id}`}
                className="group flex items-center gap-4 p-4 bg-gray-800/30 border border-gray-700/30 rounded-xl hover:bg-gray-800/50 hover:border-cyan-500/30 transition"
              >
                <img
                  src={game.cover || `http://localhost:3000/api/steam/image/${game.id}/header`}
                  alt={game.title}
                  className="w-24 h-32 object-cover rounded-lg group-hover:scale-105 transition"
                  onError={(e) => (e.target.src = 'https://via.placeholder.com/100x130/1f1f2e/888888?text=Game')}
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition">{game.title}</h3>
                  {game.developer && <p className="text-sm text-gray-400 mb-2">{game.developer}</p>}
                  <div className="flex items-center gap-4">
                    {game.rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-sm text-gray-300">{typeof game.rating === 'number' ? game.rating.toFixed(1) : game.rating}</span>
                      </div>
                    )}
                    {game.size && <span className="text-sm text-gray-400">{game.size}</span>}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeFromWishlist(game.id);
                  }}
                  className="p-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 rounded-lg transition"
                >
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
