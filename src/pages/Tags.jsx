import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function Tags() {
  const [games, setGames] = useState([]);
  const [selectedTag, setSelectedTag] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const tags = [
    'All', 'Action', 'Adventure', 'RPG', 'Strategy', 'Shooter', 'Horror', 'Racing', 'Stealth',
    'Simulation', 'Sports', 'Fighting', 'Puzzle', 'Platformer', 'Survival', 'Open World',
    'Multiplayer', 'Co-op', 'Single-player', 'Indie', 'Early Access', 'Free to Play'
  ];

  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'instant' });
    }
    const tag = searchParams.get('tag');
    if (tag) setSelectedTag(tag);
  }, [searchParams]);

  useEffect(() => {
    fetchGames();
  }, [selectedTag]);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: selectedTag === 'All' ? '' : selectedTag,
        limit: '50'
      });
      const response = await fetch(`http://localhost:3000/api/games?${params}`);
      const data = await response.json();
      setGames(data.games || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex animate-fadeInSlow">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900/50 border-r border-gray-800 p-4">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/home" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-xl font-bold">Browse by Tags</h1>
        </div>
        
        <div className="space-y-1">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`w-full text-left px-3 py-2 rounded-lg transition ${
                selectedTag === tag
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold">{selectedTag} Games</h2>
            <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">{games.length}</span>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-cyan-600' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-cyan-600' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6' : 'flex flex-col gap-4'}>
            {games.map(game => (
              <div key={game.id} className="group">
                {viewMode === 'grid' ? (
                  <Link to={`/game/${game.id}`} className="block relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-900 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50">
                    <img 
                      src={game.cover}
                      alt={game.title}
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="font-bold text-white text-lg mb-1">{game.title}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-yellow-500/30 text-yellow-400 rounded font-bold">⭐ {game.rating}</span>
                        <span className="text-gray-300">{game.size}</span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link to={`/game/${game.id}`} className="flex gap-4 p-4 bg-gray-900/50 rounded-xl hover:bg-gray-800/70 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-500">
                    <img src={game.cover} alt={game.title} className="w-32 h-44 object-cover rounded-lg transition-transform duration-500 hover:scale-105" />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-400 transition-colors duration-300">{game.title}</h3>
                        <p className="text-sm text-gray-400 mb-3">{game.genres}</p>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm font-bold">⭐ {game.rating}</span>
                          <span className="text-sm text-gray-500">{game.size}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
