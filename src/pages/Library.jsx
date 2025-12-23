import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function Library() {
  const [installedGames, setInstalledGames] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const filteredGames = installedGames.filter(g => 
    g.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 to-black" style={{ paddingTop: '104px' }}>
      <PageHeader title="Library">
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search library..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-80 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {viewMode === 'grid' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              )}
            </svg>
          </button>
        </div>
      </PageHeader>
      
      {/* Header */}
      <div className="px-8 pt-6 pb-4">
        <h1 className="text-4xl font-bold">My Library</h1>
      </div>

      {/* Games Grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-24 h-24 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-xl mb-2">No games installed yet</p>
            <p className="text-gray-600">Download games from the Store to see them here</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filteredGames.map(game => (
              <Link
                key={game.id}
                to={`/game/${game.id}`}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-900 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 hover:scale-105"
              >
                <img
                  src={game.cover}
                  alt={game.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-bold text-white mb-1">{game.title}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">⭐ {game.rating}</span>
                      <span className="text-gray-300">{game.size}</span>
                    </div>
                    <button className="mt-3 w-full py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold text-sm transition">
                      PLAY
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGames.map(game => (
              <Link
                key={game.id}
                to={`/game/${game.id}`}
                className="flex gap-4 p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl transition-all duration-300 group"
              >
                <img
                  src={game.cover}
                  alt={game.title}
                  className="w-24 h-32 object-cover rounded-lg"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1 group-hover:text-cyan-400 transition">{game.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">{game.developer}</p>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm font-bold">⭐ {game.rating}</span>
                      <span className="text-sm text-gray-400">{game.genres}</span>
                      <span className="text-sm text-gray-500">{game.size}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold text-sm transition">
                      PLAY
                    </button>
                    <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
