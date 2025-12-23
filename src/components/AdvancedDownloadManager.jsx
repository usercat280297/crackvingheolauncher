import React, { useState, useEffect } from 'react';

/**
 * Advanced Download Card Component
 * Shows multi-threaded download progress with detailed statistics
 */
export const AdvancedDownloadCard = ({ download, onPause, onResume, onCancel }) => {
  const [detailedStatus, setDetailedStatus] = useState(null);

  useEffect(() => {
    if (!download.activeStatus) return;

    const interval = setInterval(() => {
      // Fetch detailed status
      fetch(`/api/advanced-downloads/${download._id}/status`)
        .then(res => res.json())
        .then(data => setDetailedStatus(data.activeStatus))
        .catch(err => console.error('Failed to fetch status:', err));
    }, 1000);

    return () => clearInterval(interval);
  }, [download._id]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond) return '0 MB/s';
    const mbps = (bytesPerSecond / (1024 * 1024)).toFixed(2);
    return `${mbps} MB/s`;
  };

  const speedPercentage = detailedStatus?.chunks ? 
    (detailedStatus.chunks.filter(c => c.status === 'completed').length / detailedStatus.chunks.length) * 100 
    : download.progress;

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 mb-4 border border-gray-700 hover:border-cyan-500/50 transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{download.gameTitle}</h3>
          <p className="text-sm text-gray-400">{formatBytes(download.fileSize)} total</p>
        </div>
        <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
          download.status === 'downloading' ? 'bg-cyan-500/20 text-cyan-400' :
          download.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
          download.status === 'completed' ? 'bg-green-500/20 text-green-400' :
          download.status === 'failed' ? 'bg-red-500/20 text-red-400' :
          'bg-gray-700 text-gray-300'
        }`}>
          {download.status.toUpperCase()}
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Overall Progress</span>
          <span className="text-sm font-semibold text-cyan-400">{Math.round(download.progress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-full transition-all duration-300 flex items-center justify-center"
            style={{ width: `${download.progress}%` }}
          >
            {download.progress > 5 && (
              <div className="w-full h-full bg-gradient-to-r from-cyan-600 to-cyan-500 opacity-50 animate-pulse"></div>
            )}
          </div>
        </div>
      </div>

      {/* Speed and ETA */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Download Speed</p>
          <p className="text-lg font-bold text-cyan-400">{formatSpeed(download.speed)}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Downloaded</p>
          <p className="text-lg font-bold text-green-400">{formatBytes(download.downloadedSize)}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Time Remaining</p>
          <p className="text-lg font-bold text-orange-400">{download.eta || '--:--:--'}</p>
        </div>
      </div>

      {/* Chunk Progress (Multi-threading) */}
      {detailedStatus?.chunks && (
        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-2">
            Thread Progress: {detailedStatus.chunks.filter(c => c.status === 'completed').length}/{detailedStatus.chunks.length} chunks
          </p>
          <div className="grid grid-cols-8 gap-1">
            {detailedStatus.chunks.slice(0, 16).map((chunk, idx) => (
              <div 
                key={idx}
                className={`h-8 rounded transition ${
                  chunk.status === 'completed' ? 'bg-green-500' :
                  chunk.status === 'downloading' ? 'bg-cyan-500 animate-pulse' :
                  chunk.status === 'failed' ? 'bg-red-500' :
                  'bg-gray-600'
                }`}
                title={`Chunk ${chunk.id}: ${chunk.status}`}
              >
                <div className="text-xs text-white font-bold h-full flex items-center justify-center">
                  {chunk.status === 'completed' ? '✓' : chunk.status === 'downloading' ? '↓' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-400">
        <div>
          <span className="text-gray-500">Total Chunks:</span> {download.totalChunks || '-'}
        </div>
        <div>
          <span className="text-gray-500">Chunk Size:</span> {formatBytes(download.chunkSize || 0)}
        </div>
        <div>
          <span className="text-gray-500">Started:</span> {download.startedAt ? new Date(download.startedAt).toLocaleString() : '-'}
        </div>
        <div>
          <span className="text-gray-500">Retries:</span> {download.retries}/{download.maxRetries}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {download.status === 'downloading' && (
          <button
            onClick={() => onPause(download._id)}
            className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-lg font-semibold transition"
          >
            ⏸ Pause
          </button>
        )}
        {download.status === 'paused' && (
          <button
            onClick={() => onResume(download._id)}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg font-semibold transition"
          >
            ▶ Resume
          </button>
        )}
        <button
          onClick={() => onCancel(download._id)}
          className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-semibold transition"
        >
          ✕ Cancel
        </button>
      </div>

      {/* Error Message */}
      {download.status === 'failed' && download.error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-xs text-red-400">{download.error}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Advanced Download Manager Page
 */
export const AdvancedDownloadManager = () => {
  const [downloads, setDownloads] = useState([]);
  const [stats, setStats] = useState({
    activeDownloads: 0,
    totalDownloaded: 0,
    averageSpeed: 0,
    completedToday: 0
  });

  useEffect(() => {
    // Fetch downloads
    const interval = setInterval(() => {
      fetch('/api/advanced-downloads')
        .then(res => res.json())
        .then(data => {
          setDownloads(data);

          // Calculate stats
          const active = data.filter(d => d.status === 'downloading').length;
          const totalDownloaded = data.reduce((sum, d) => sum + d.downloadedSize, 0);
          const avgSpeed = Math.round(
            data.filter(d => d.status === 'downloading')
              .reduce((sum, d) => sum + (d.speed || 0), 0) / 
            Math.max(data.filter(d => d.status === 'downloading').length, 1)
          );

          setStats({
            activeDownloads: active,
            totalDownloaded,
            averageSpeed: avgSpeed,
            completedToday: data.filter(d => 
              d.status === 'completed' && 
              new Date(d.completedAt).toDateString() === new Date().toDateString()
            ).length
          });
        })
        .catch(err => console.error('Failed to fetch downloads:', err));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePause = (downloadId) => {
    fetch(`/api/advanced-downloads/${downloadId}/pause`, { method: 'POST' })
      .then(res => res.json())
      .then(() => {
        setDownloads(prev => prev.map(d => 
          d._id === downloadId ? { ...d, status: 'paused' } : d
        ));
      })
      .catch(err => console.error('Failed to pause:', err));
  };

  const handleResume = (downloadId) => {
    fetch(`/api/advanced-downloads/${downloadId}/resume`, { method: 'POST' })
      .then(res => res.json())
      .then(() => {
        setDownloads(prev => prev.map(d => 
          d._id === downloadId ? { ...d, status: 'downloading' } : d
        ));
      })
      .catch(err => console.error('Failed to resume:', err));
  };

  const handleCancel = (downloadId) => {
    fetch(`/api/advanced-downloads/${downloadId}/cancel`, { method: 'POST' })
      .then(res => res.json())
      .then(() => {
        setDownloads(prev => prev.map(d => 
          d._id === downloadId ? { ...d, status: 'cancelled' } : d
        ));
      })
      .catch(err => console.error('Failed to cancel:', err));
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond) return '0 MB/s';
    const mbps = (bytesPerSecond / (1024 * 1024)).toFixed(2);
    return `${mbps} MB/s`;
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-black">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-cyan-900 to-cyan-800 rounded-lg p-4 border border-cyan-700">
          <p className="text-cyan-200 text-sm mb-1">Active Downloads</p>
          <p className="text-3xl font-bold text-cyan-400">{stats.activeDownloads}</p>
        </div>
        <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-4 border border-green-700">
          <p className="text-green-200 text-sm mb-1">Total Downloaded</p>
          <p className="text-2xl font-bold text-green-400">{formatBytes(stats.totalDownloaded)}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-900 to-orange-800 rounded-lg p-4 border border-orange-700">
          <p className="text-orange-200 text-sm mb-1">Avg Speed</p>
          <p className="text-2xl font-bold text-orange-400">{formatSpeed(stats.averageSpeed)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg p-4 border border-purple-700">
          <p className="text-purple-200 text-sm mb-1">Completed Today</p>
          <p className="text-3xl font-bold text-purple-400">{stats.completedToday}</p>
        </div>
      </div>

      {/* Downloads List */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Downloads</h2>
        {downloads.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No downloads yet</p>
          </div>
        ) : (
          downloads.map(download => (
            <AdvancedDownloadCard
              key={download._id}
              download={download}
              onPause={handlePause}
              onResume={handleResume}
              onCancel={handleCancel}
            />
          ))
        )}
      </div>
    </main>
  );
};

export default AdvancedDownloadManager;
