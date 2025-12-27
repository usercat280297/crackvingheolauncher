import { useState, useEffect } from 'react';

export default function DownloadManagerUI() {
  const [activeDownloads, setActiveDownloads] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    loadDownloads();
    
    // Poll for updates every 500ms
    const interval = setInterval(loadDownloads, 500);
    setPollingInterval(interval);

    return () => clearInterval(interval);
  }, []);

  const loadDownloads = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/downloads-api/active');
      const data = await response.json();
      
      if (data.success) {
        setActiveDownloads(data.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load downloads:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/downloads-api/history?limit=20');
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handlePause = async (gameId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/downloads-api/${gameId}/pause`, {
        method: 'PUT'
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('Download paused');
        loadDownloads();
      }
    } catch (error) {
      console.error('Failed to pause download', error);
    }
  };

  const handleResume = async (gameId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/downloads-api/${gameId}/resume`, {
        method: 'PUT'
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('Download resumed');
        loadDownloads();
      }
    } catch (error) {
      console.error('Failed to resume download', error);
    }
  };

  const handleCancel = async (gameId) => {
    if (window.confirm('Cancel this download?')) {
      try {
        const response = await fetch(`http://localhost:3000/api/downloads-api/${gameId}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
          console.log('Download cancelled');
          loadDownloads();
        }
      } catch (error) {
        console.error('Failed to cancel download', error);
      }
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatTime = (ms) => {
    if (!ms || ms === Infinity) return 'Calculating...';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading && activeDownloads.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-4 text-center text-gray-400">
        Loading downloads...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          📥 Downloads
        </h2>
        <button
          onClick={() => {
            setShowHistory(!showHistory);
            if (!showHistory) loadHistory();
          }}
          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition"
        >
          {showHistory ? '✕ Hide History' : '📋 Show History'}
        </button>
      </div>

      {/* Active Downloads */}
      {activeDownloads.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-xl p-12 text-center border border-gray-700/30">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-400 text-lg mb-2">No active downloads</p>
          <p className="text-gray-500 text-sm">Start downloading a game to see it here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeDownloads.map((download) => (
            <div
              key={download.gameId}
              className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-cyan-500/30 transition"
            >
              {/* Game Name */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{download.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="text-cyan-400">⬇️</span>
                      {formatBytes(download.downloaded)} / {formatBytes(download.total)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-green-400">📊</span>
                      {(download.ratio * 100).toFixed(0)}% ratio
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  download.status === 'downloading' ? 'bg-cyan-600/30 text-cyan-400' :
                  download.status === 'paused' ? 'bg-yellow-600/30 text-yellow-400' :
                  'bg-green-600/30 text-green-400'
                }`}>
                  {download.status === 'downloading' ? '⬇️ Downloading' :
                   download.status === 'paused' ? '⏸️ Paused' :
                   '✅ Completed'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Progress</span>
                  <span className="text-sm font-bold text-cyan-400">{download.progress}%</span>
                </div>
                <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600/30">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${download.progress}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Download Speed</p>
                  <p className="text-sm font-bold text-green-400">
                    {formatBytes(download.downloadSpeed || 0)}/s
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Upload Speed</p>
                  <p className="text-sm font-bold text-blue-400">
                    {formatBytes(download.uploadSpeed || 0)}/s
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Time Remaining</p>
                  <p className="text-sm font-bold text-purple-400">
                    {formatTime(download.timeRemaining)}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Peers</p>
                  <p className="text-sm font-bold text-orange-400">
                    {download.numPeers || 0} peers
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                {download.status === 'downloading' ? (
                  <button
                    onClick={() => handlePause(download.gameId)}
                    className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition"
                  >
                    ⏸️ Pause
                  </button>
                ) : download.status === 'paused' ? (
                  <button
                    onClick={() => handleResume(download.gameId)}
                    className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition"
                  >
                    ▶️ Resume
                  </button>
                ) : null}

                {download.status !== 'completed' && (
                  <button
                    onClick={() => handleCancel(download.gameId)}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                  >
                    ❌ Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Download History */}
      {showHistory && (
        <div className="mt-8 pt-8 border-t border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4">📜 Download History</h3>
          
          {history.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No download history</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30 flex items-center justify-between text-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.gameName}</p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(item.totalSize)} • {
                        item.status === 'completed' ? '✅ Completed' :
                        item.status === 'cancelled' ? '❌ Cancelled' :
                        '⚠️ ' + item.status
                      }
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.status === 'completed' ? 'bg-green-600/30 text-green-400' :
                    'bg-red-600/30 text-red-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
