import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * DenuvoIndicator Component
 * Shows DRM status badge for games
 * 
 * Props:
 *   - gameId: Steam App ID
 *   - gameName: Game name for display
 */
const DenuvoIndicator = ({ gameId, gameName = 'Game' }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gameId) return;

    const fetchStatus = async () => {
      try {
        const response = await axios.get(`/api/denuvo/check/${gameId}`);
        
        if (response.data.success) {
          setStatus(response.data.data);
        } else {
          setError('Could not fetch DRM status');
        }
      } catch (err) {
        console.error('Error fetching DRM status:', err);
        setError('Error loading DRM status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [gameId]);

  const getIndicatorInfo = () => {
    if (loading) {
      return {
        icon: '⏳',
        label: 'Loading...',
        color: '#999',
        bgColor: '#f0f0f0',
      };
    }

    if (error || !status) {
      return {
        icon: '❓',
        label: 'Unknown',
        color: '#999',
        bgColor: '#f0f0f0',
      };
    }

    if (status.hasDenuvo && status.isVerified) {
      return {
        icon: '🚫',
        label: 'Denuvo',
        color: '#fff',
        bgColor: '#ff4444',
        tooltip: 'This game uses Denuvo DRM protection',
      };
    }

    if (status.isDrmFree) {
      return {
        icon: '🆓',
        label: 'DRM-Free',
        color: '#fff',
        bgColor: '#44aa44',
        tooltip: 'This game is DRM-free',
      };
    }

    if (status.hasAntiCheat) {
      return {
        icon: '🛡️',
        label: `Anti-Cheat: ${status.hasAntiCheat}`,
        color: '#000',
        bgColor: '#ffbb33',
        tooltip: `Uses ${status.hasAntiCheat} anti-cheat system`,
      };
    }

    if (status.hasSteamDRM) {
      return {
        icon: '🔒',
        label: 'Steam DRM',
        color: '#fff',
        bgColor: '#4488ff',
        tooltip: 'Protected by Steam DRM',
      };
    }

    return {
      icon: '✓',
      label: 'No DRM',
      color: '#fff',
      bgColor: '#44aa44',
      tooltip: 'No DRM protection',
    };
  };

  const info = getIndicatorInfo();

  return (
    <div className="denuvo-indicator">
      <div
        className="drm-badge"
        style={{
          backgroundColor: info.bgColor,
          color: info.color,
        }}
        title={info.tooltip}
      >
        <span className="drm-icon">{info.icon}</span>
        <span className="drm-label">{info.label}</span>
      </div>

      <style>{`
        .denuvo-indicator {
          display: inline-block;
          margin: 5px 0;
        }

        .drm-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .drm-badge:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        .drm-icon {
          font-size: 16px;
          display: inline-block;
        }

        .drm-label {
          display: inline-block;
        }

        @media (max-width: 640px) {
          .drm-badge {
            font-size: 12px;
            padding: 5px 10px;
          }

          .drm-icon {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default DenuvoIndicator;
