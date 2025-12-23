// SearchOverlay.jsx - Epic Games style search with suggestions
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export function SearchOverlay({ isOpen, onClose, search, setSearch, suggestions, isSearching }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div ref={overlayRef} className="w-full max-w-3xl mx-4">
        {/* Search Input */}
        <div className="relative mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the Epic Games Store..."
            className="w-full bg-gray-900 border-2 border-blue-500 rounded-xl px-6 py-4 text-lg text-white placeholder-gray-400 focus:outline-none"
            autoFocus
          />
          <svg className="w-6 h-6 absolute right-6 top-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Search Results */}
        <div className="bg-gray-900 rounded-xl overflow-hidden max-h-[70vh] overflow-y-auto">
          {isSearching ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Searching...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {suggestions.map((game) => (
                <Link
                  key={game.id}
                  to={`/game/${game.id}`}
                  onClick={onClose}
                  className="flex items-center gap-4 p-4 hover:bg-gray-800 transition"
                >
                  <img
                    src={game.cover || game.headerImage}
                    alt={game.title}
                    className="w-20 h-28 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold mb-1">{game.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{game.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{game.price || 'Free'}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : search ? (
            <div className="p-8 text-center text-gray-400">
              No results found for "{search}"
            </div>
          ) : (
            <div className="p-8">
              <h3 className="font-bold mb-4">Popular Searches</h3>
              <div className="flex flex-wrap gap-2">
                {['Fortnite', 'GTA V', 'Rocket League', 'Fall Guys', 'Cyberpunk 2077', 'The Witcher 3'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setSearch(term)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// LibraryView.jsx - Epic Games Library style view
export function LibraryView({ games, onDownload }) {
  const [view, setView] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('recent');
  const [filter, setFilter] = useState('all'); // 'all', 'installed', 'notInstalled'

  const sortedGames = [...games].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      case 'recent':
        return new Date(b.addedDate || 0) - new Date(a.addedDate || 0);
      case 'size':
        return (b.size || 0) - (a.size || 0);
      default:
        return 0;
    }
  });

  const filteredGames = sortedGames.filter((game) => {
    if (filter === 'installed') return game.installed;
    if (filter === 'notInstalled') return !game.installed;
    return true;
  });

  return (
    <div className="bg-[#0f1014] min-h-screen">
      {/* Library Header */}
      <div className="sticky top-0 z-40 bg-[#0f1014] border-b border-gray-800">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold">Library</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg transition ${
                    filter === 'all' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('installed')}
                  className={`px-4 py-2 rounded-lg transition ${
                    filter === 'installed' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Installed
                </button>
                <button
                  onClick={() => setFilter('notInstalled')}
                  className={`px-4 py-2 rounded-lg transition ${
                    filter === 'notInstalled' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Not Installed
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Recently Added</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="size">Size</option>
              </select>

              {/* View Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 rounded-lg transition ${
                    view === 'grid' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-2 rounded-lg transition ${
                    view === 'list' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Games Display */}
      <div className="max-w-[1920px] mx-auto px-6 py-8">
        {filteredGames.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-xl font-bold mb-2">No games found</h3>
            <p className="text-gray-400">Try adjusting your filters</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {filteredGames.map((game) => (
              <div key={game.id} className="group">
                <div className="relative rounded-lg overflow-hidden bg-gray-900 mb-3 aspect-[3/4]">
                  <img
                    src={game.cover}
                    alt={game.title}
                    className="w-full h-full object-cover"
                  />
                  {game.installed && (
                    <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                      Installed
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={() => onDownload(game)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition"
                    >
                      {game.installed ? 'Play' : 'Install'}
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-sm line-clamp-2">{game.title}</h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGames.map((game) => (
              <div key={game.id} className="flex items-center gap-6 p-4 bg-gray-900/50 rounded-xl hover:bg-gray-800/70 transition-all">
                <img
                  src={game.cover}
                  alt={game.title}
                  className="w-32 h-44 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{game.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Size: {game.size || 'Unknown'}</span>
                    {game.installed && <span className="text-green-400">● Installed</span>}
                  </div>
                </div>
                <button
                  onClick={() => onDownload(game)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition"
                >
                  {game.installed ? 'Play' : 'Install'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// DownloadProgress.jsx - Download manager component
export function DownloadProgress({ downloads, onPause, onResume, onCancel }) {
  return (
    <div className="fixed bottom-6 right-6 w-96 bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden z-50">
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold">Downloads</h3>
        <span className="text-sm text-gray-400">{downloads.length} active</span>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {downloads.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <p className="text-sm">No active downloads</p>
          </div>
        ) : (
          downloads.map((download) => (
            <div key={download.id} className="p-4 border-b border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={download.cover}
                  alt={download.title}
                  className="w-12 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{download.title}</h4>
                  <div className="text-xs text-gray-400">
                    {download.progress}% • {download.speed} • {download.timeRemaining}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${download.progress}%` }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {download.status === 'downloading' ? (
                  <button
                    onClick={() => onPause(download.id)}
                    className="flex-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs font-medium transition"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => onResume(download.id)}
                    className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition"
                  >
                    Resume
                  </button>
                )}
                <button
                  onClick={() => onCancel(download.id)}
                  className="flex-1 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// UserMenu.jsx - User profile dropdown
export function UserMenu({ user, onSignOut }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-bold hover:scale-110 transition-transform"
      >
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span>{user?.name?.[0] || 'U'}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden z-50">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-blue-600">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{user?.name?.[0] || 'U'}</span>
                )}
              </div>
              <div>
                <div className="font-bold">{user?.name || 'Guest'}</div>
                <div className="text-xs text-blue-100">{user?.email || 'guest@epic.com'}</div>
              </div>
            </div>
          </div>

          <div className="py-2">
            <Link to="/account" className="block px-4 py-2 hover:bg-gray-800 transition">
              Account Settings
            </Link>
            <Link to="/purchases" className="block px-4 py-2 hover:bg-gray-800 transition">
              Purchase History
            </Link>
            <Link to="/wishlist" className="block px-4 py-2 hover:bg-gray-800 transition">
              Wishlist
            </Link>
            <Link to="/friends" className="block px-4 py-2 hover:bg-gray-800 transition">
              Friends
            </Link>
            <hr className="my-2 border-gray-800" />
            <button
              onClick={onSignOut}
              className="w-full px-4 py-2 text-left hover:bg-gray-800 text-red-400 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default { SearchOverlay, LibraryView, DownloadProgress, UserMenu };
