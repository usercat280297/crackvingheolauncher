import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function SteamSale() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSteamSales();
  }, []);

  const fetchSteamSales = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/sales/steam/deals');
      const data = await response.json();
      if (data.success) setGames(data.games);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mb-8">
        <Link to="/" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Store
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold">Steam Sale</h1>
            <p className="text-gray-400">Weekend deals and special offers</p>
          </div>
          <span className="px-4 py-2 bg-blue-600 rounded-full text-sm font-bold ml-auto">Weekend Deal</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {games.map((game, index) => (
            <div key={index} className="group cursor-pointer" onClick={() => window.open(game.url, '_blank')}>
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-3 bg-gray-800">
                <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => e.target.src = 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Steam+Game'} />
                {game.discount && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold">
                    {game.discount}
                  </div>
                )}
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">{game.title}</h3>
              <div className="flex items-center gap-2">
                {game.originalPrice && (
                  <span className="text-gray-400 line-through text-sm">{game.originalPrice}</span>
                )}
                <span className="text-blue-400 font-bold">{game.discountPrice}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
