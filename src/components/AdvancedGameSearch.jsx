import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, GamepadIcon } from 'lucide-react';

const AdvancedGameSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const performSearch = async (searchQuery) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      const data = await response.json();
      
      setResults(data.results || []);
      setSuggestions(data.suggestions || []);
      setShowSuggestions(data.suggestions?.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchFocus = () => {
    setIsSearchMode(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
  };

  const handleSearchBlur = () => {
    if (!query.trim()) {
      setIsSearchMode(false);
      setShowSuggestions(false);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setIsSearchMode(false);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);
    performSearch(suggestion.name);
  };

  const getMatchTypeColor = (matchType) => {
    switch (matchType) {
      case 'exact': return 'text-green-600';
      case 'prefix': return 'text-blue-600';
      case 'contains': return 'text-purple-600';
      case 'keyword': return 'text-orange-600';
      case 'fuzzy': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getMatchTypeLabel = (matchType) => {
    switch (matchType) {
      case 'exact': return 'Exact Match';
      case 'prefix': return 'Starts With';
      case 'contains': return 'Contains';
      case 'keyword': return 'Keyword';
      case 'fuzzy': return 'Similar';
      default: return 'Match';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header - Hidden in search mode */}
      <div className={`transition-all duration-500 ease-in-out ${
        isSearchMode ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'
      }`}>
        <div className="text-center py-20">
          <GamepadIcon className="mx-auto mb-6 text-6xl text-blue-400" />
          <h1 className="text-5xl font-bold text-white mb-4">Game Launcher</h1>
          <p className="text-xl text-gray-300 mb-8">Find your favorite games instantly</p>
        </div>
      </div>

      {/* Search Container */}
      <div className={`transition-all duration-500 ease-in-out ${
        isSearchMode ? 'fixed top-8 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4' : 'max-w-2xl mx-auto px-4'
      }`}>
        
        {/* Search Bar */}
        <div className="relative">
          <div className={`relative bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 transition-all duration-300 ${
            isSearchMode ? 'shadow-2xl' : 'shadow-lg hover:shadow-xl'
          }`}>
            <div className="flex items-center p-4">
              <Search className="text-gray-400 mr-3" size={24} />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                placeholder="Search for games... (e.g., resident, cyberpunk, gta)"
                className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
              />
              
              {/* Loading Spinner */}
              {isSearching && (
                <Loader2 className="text-blue-400 animate-spin mr-3" size={20} />
              )}
              
              {/* Clear Button */}
              {query && (
                <button
                  onClick={handleClearSearch}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
              )}
              
              {/* Search Button */}
              <button
                onClick={() => query.trim() && performSearch(query)}
                className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
              >
                Search
              </button>
            </div>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl z-40 max-h-60 overflow-y-auto">
              <div className="p-2">
                <div className="text-sm text-gray-400 px-3 py-2 font-medium">Did you mean?</div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span className="text-white">{suggestion.name}</span>
                    <span className={`text-xs ${getMatchTypeColor(suggestion.matchType)}`}>
                      {suggestion.score}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {isSearchMode && (
        <div className="mt-24 px-4 pb-8">
          <div className="max-w-6xl mx-auto">
            {/* Results Header */}
            {query && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Search Results for "{query}"
                </h2>
                <p className="text-gray-400">
                  {isSearching ? 'Searching...' : `Found ${results.length} games`}
                </p>
              </div>
            )}

            {/* Results Grid */}
            {results.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.map((game, index) => (
                  <div
                    key={game.appId}
                    className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Image Thumbnail */}
                    <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-500 overflow-hidden">
                      <img 
                        src={`https://cdn2.steamgriddb.com/steam/${game.appId}/600x900.png`}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/header.jpg`;
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded-lg">
                        <div className="text-xs font-semibold text-white">{game.score}%</div>
                        <div className={`text-xs ${getMatchTypeColor(game.matchType)}`}>
                          {getMatchTypeLabel(game.matchType)}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg mb-1 line-clamp-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 font-semibold">
                          {game.name}
                        </span>
                      </h3>
                      <p className="text-gray-400 text-xs mb-3">
                        App ID: {game.appId}
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <a
                          href={`https://store.steampowered.com/app/${game.appId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors text-center"
                        >
                          View on Steam
                        </a>
                        <button 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors"
                          onClick={() => alert(`Download functionality coming soon for ${game.name}`)}
                        >
                          Launch
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {query && !isSearching && results.length === 0 && (
              <div className="text-center py-12">
                <GamepadIcon className="mx-auto mb-4 text-4xl text-gray-500" />
                <h3 className="text-xl font-semibold text-white mb-2">No games found</h3>
                <p className="text-gray-400">
                  Try searching with different keywords or check the spelling
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isSearching && isSearchMode && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 flex items-center space-x-3">
            <Loader2 className="text-blue-400 animate-spin" size={24} />
            <span className="text-white font-medium">Searching games...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedGameSearch;