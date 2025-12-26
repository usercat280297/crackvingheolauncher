/**
 * ============================================
 * DENUVO INDICATOR COMPONENT
 * Show denuvo status on game cards / details
 * ============================================
 */

import React, { useState, useEffect } from 'react';

const DenuvoIndicator = ({ gameId, gameName, hasDenuvo }) => {
  const [denuvoStatus, setDenuvoStatus] = useState(null);
  const [loading, setLoading] = useState(!!gameId); // Only load if gameId provided

  // If hasDenuvo is passed directly, use it
  useEffect(() => {
    if (hasDenuvo !== undefined && hasDenuvo !== null) {
      setDenuvoStatus({ hasDenuvo: hasDenuvo });
      setLoading(false);
      return;
    }

    if (!gameId) return;

    const checkDenuvo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/api/denuvo/check/${gameId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();
        if (data.success) {
          setDenuvoStatus(data.data);
        }
      } catch (error) {
        console.warn(`Failed to check denuvo for ${gameId}:`, error);
      } finally {
        setLoading(false);
      }
    };

    checkDenuvo();
  }, [gameId, hasDenuvo]);

  if (loading) {
    return <span className="text-xs text-gray-400">Checking...</span>;
  }

  if (!denuvoStatus) {
    return null;
  }

  // Denuvo Protected
  if (denuvoStatus.hasDenuvo) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600/80 to-pink-600/80 backdrop-blur-xl rounded-full border border-red-400/50 animate-pulse hover:animate-none transition-all duration-300">
        <span className="text-lg">🚫</span>
        <span className="font-bold text-white">Denuvo Protected</span>
      </div>
    );
  }

  // DRM-Free
  if (denuvoStatus.isDRMFree) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600/80 to-emerald-600/80 backdrop-blur-xl rounded-full border border-green-400/50 transition-all duration-300">
        <span className="text-lg">🆓</span>
        <span className="font-bold text-white">DRM-Free</span>
      </div>
    );
  }

  // Anti-Cheat
  if (denuvoStatus.hasEAC || denuvoStatus.hasBattlEye) {
    const type = denuvoStatus.hasEAC ? 'EAC' : 'BattlEye';
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-600/80 to-amber-600/80 backdrop-blur-xl rounded-full border border-yellow-400/50 transition-all duration-300">
        <span className="text-lg">🛡️</span>
        <span className="font-bold text-white">{type} Anti-Cheat</span>
      </div>
    );
  }

  // Steam DRM
  if (denuvoStatus.hasSteamDRM) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600/80 to-cyan-600/80 backdrop-blur-xl rounded-full border border-blue-400/50 transition-all duration-300">
        <span className="text-lg">🔒</span>
        <span className="font-bold text-white">Steam DRM</span>
      </div>
    );
  }

  return null;
};

export default DenuvoIndicator;
