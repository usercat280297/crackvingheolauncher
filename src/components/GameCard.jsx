import React, { useState } from 'react';
import { Play, Trash2, Settings, Clock, HardDrive, Calendar } from 'lucide-react';

const GameCard = ({ game, onLaunch, onUninstall, onProperties }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLaunch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/library/${game.id}/launch`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        onLaunch?.(game);
      } else {
        alert('Error launching game: ' + data.error);
      }
    } catch (error) {
      console.error('Launch error:', error);
      alert('Failed to launch game');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUninstall = async () => {
    if (!window.confirm(`Are you sure you want to uninstall "${game.name}"?`)) return;

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/library/${game.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepSaves: false })
      });
      const data = await response.json();
      if (data.success) {
        onUninstall?.(game);
      } else {
        alert('Error uninstalling: ' + data.error);
      }
    } catch (error) {
      console.error('Uninstall error:', error);
      alert('Failed to uninstall game');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPlayTime = (hours) => {
    if (hours < 1) return 'Never played';
    if (hours === 1) return '1 hour';
    return `${hours} hours`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className={`relative group rounded-lg overflow-hidden bg-gray-900 border border-gray-800 transition-all duration-300 ${
        isHovered ? 'border-purple-600 shadow-lg shadow-purple-500/20' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cover Image */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-950">
        <img
          src={game.cover}
          alt={game.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x400?text=No+Cover';
          }}
        />

        {/* Playing Badge */}
        {game.playing && (
          <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            Playing
          </div>
        )}

        {/* Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3 transition-all duration-300">
            <button
              onClick={handleLaunch}
              disabled={isLoading}
              className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110 disabled:opacity-50"
              title="Launch Game"
            >
              <Play className="w-5 h-5 fill-white" />
            </button>
            <button
              onClick={onProperties}
              disabled={isLoading}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-all duration-200 transform hover:scale-110 disabled:opacity-50"
              title="Properties"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleUninstall}
              disabled={isLoading}
              className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-all duration-200 transform hover:scale-110 disabled:opacity-50"
              title="Uninstall"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 bg-gray-950">
        <h3 className="font-semibold text-white mb-3 line-clamp-2 text-sm">
          {game.name}
        </h3>

        {/* Stats Grid */}
        <div className="space-y-2 text-xs text-gray-400">
          {/* Size */}
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-purple-500" />
            <span>{game.sizeFormatted || 'Unknown'}</span>
          </div>

          {/* Play Time */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>{formatPlayTime(game.totalPlayTime || 0)}</span>
          </div>

          {/* Install Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-500" />
            <span>{formatDate(game.installDate)}</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default GameCard;
