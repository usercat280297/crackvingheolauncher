import { useState, useEffect } from 'react';
import GameCard from '../components/GameCard';
import { Search, Grid3x3, List, RefreshCw } from 'lucide-react';

export default function Library() {
  const [games, setGames] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/library');
      const data = await response.json();
      if (data.success) {
        setGames(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching library:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGames = games
    .filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.installDate) - new Date(a.installDate);
        case 'size':
          return b.size - a.size;
        case 'playtime':
          return (b.totalPlayTime || 0) - (a.totalPlayTime || 0);
        default:
          return 0;
      }
    });

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900/80 to-transparent border-b border-gray-800/50 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <h1 className="text-4xl font-bold mb-6 text-white">My Library</h1>

          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search library..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="size">Sort by Size</option>
              <option value="playtime">Sort by Playtime</option>
            </select>

            {/* View Mode */}
            <div className="flex gap-2 bg-gray-800/50 border border-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchLibrary}
              className="p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-purple-500 transition-colors"
              title="Refresh library"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <div className="w-24 h-24 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16m10-16v16M4 7h16m0 10H4" />
                </svg>
              </div>
              <p className="text-xl font-semibold mb-2">No games found</p>
              <p className="text-gray-600">{games.length === 0 ? 'Your library is empty' : 'No results for your search'}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredGames.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  onLaunch={() => {
                    // Handle launch
                  }}
                  onUninstall={() => {
                    setGames(games.filter(g => g.id !== game.id));
                  }}
                  onProperties={() => {
                    // Handle properties
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGames.map(game => (
                <div
                  key={game.id}
                  className="flex gap-4 p-4 bg-gray-800/20 hover:bg-gray-800/40 border border-gray-800 rounded-lg transition-all duration-300 group"
                >
                  <img
                    src={game.cover}
                    alt={game.name}
                    className="w-20 h-28 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x400?text=No+Cover';
                    }}
                  />
                  <div className="flex-1 flex flex-col justify-between py-2">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition">
                        {game.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span>📦 {game.sizeFormatted}</span>
                        <span>⏱️ {game.totalPlayTime || 0} hours</span>
                        <span>📅 {new Date(game.installDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => {
                        // Launch game
                        fetch(`http://localhost:3000/api/library/${game.id}/launch`, {
                          method: 'POST'
                        });
                      }}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Launch
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Uninstall "${game.name}"?`)) {
                          fetch(`http://localhost:3000/api/library/${game.id}`, {
                            method: 'DELETE'
                          }).then(() => {
                            setGames(games.filter(g => g.id !== game.id));
                          });
                        }
                      }}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                    >
                      Uninstall
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Footer */}
      {games.length > 0 && (
        <div className="bg-gray-900/50 border-t border-gray-800 px-8 py-4">
          <div className="max-w-7xl mx-auto flex gap-8 text-sm text-gray-400">
            <div>📚 {games.length} games</div>
            <div>💾 {(games.reduce((sum, g) => sum + g.size, 0) / (1024 * 1024 * 1024)).toFixed(1)} GB</div>
            <div>⏱️ {games.reduce((sum, g) => sum + (g.totalPlayTime || 0), 0)} hours total</div>
          </div>
        </div>
      )}
    </div>
  );
}
