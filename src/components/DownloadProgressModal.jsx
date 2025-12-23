import React, { useState, useEffect } from 'react';

export default function DownloadProgressModal({ isOpen, onClose, game }) {
  const [progress, setProgress] = useState({
    status: 'initializing',
    percentage: 0,
    downloadedMB: 0,
    totalMB: 0,
    speed: '0 MB/s',
    eta: '--:--',
    logs: []
  });

  useEffect(() => {
    if (!isOpen || !game) return;

    // WebSocket connection for real-time progress
    const ws = new WebSocket(`ws://localhost:8080`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        downloadId: game.id
      }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(prev => ({
        ...prev,
        ...data,
        logs: [...prev.logs, data.log].slice(-50) // Keep last 50 logs
      }));
    };

    ws.onclose = () => {
      console.log('Download progress WebSocket closed');
    };

    return () => {
      ws.close();
    };
  }, [isOpen, game]);

  const startDownload = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/steam-download/steam/${game.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameId: game.id,
          title: game.title,
          appId: game.steamAppId 
        })
      });
      
      if (!response.ok) throw new Error('Failed to start download');
      
      setProgress(prev => ({ 
        ...prev, 
        status: 'downloading',
        logs: [...prev.logs, `Starting download for ${game.title}...`]
      }));
    } catch (error) {
      setProgress(prev => ({ 
        ...prev, 
        status: 'error',
        logs: [...prev.logs, `Error: ${error.message}`]
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <img src={game?.cover} alt={game?.title} className="w-16 h-16 rounded-lg object-cover" />
            <div>
              <h2 className="text-xl font-bold">{game?.title}</h2>
              <p className="text-gray-400">Downloading via SteamCMD</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Section */}
        <div className="p-6 space-y-6">
          {/* Status & Progress Bar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold capitalize">{progress.status}</span>
              <span className="text-cyan-400 font-bold">{progress.percentage}%</span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-gray-400">Downloaded</div>
                <div className="font-bold">{progress.downloadedMB} MB</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-gray-400">Total Size</div>
                <div className="font-bold">{progress.totalMB} MB</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-gray-400">Speed</div>
                <div className="font-bold text-green-400">{progress.speed}</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-gray-400">ETA</div>
                <div className="font-bold">{progress.eta}</div>
              </div>
            </div>
          </div>

          {/* SteamCMD Console Output */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              SteamCMD Console
            </h3>
            
            <div className="bg-black/80 border border-gray-600 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
              {progress.logs.length === 0 ? (
                <div className="text-gray-500">Waiting for SteamCMD output...</div>
              ) : (
                progress.logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                    <span className="ml-2 text-green-400">{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {progress.status === 'initializing' && (
              <button
                onClick={startDownload}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Start Download
              </button>
            )}
            
            {progress.status === 'downloading' && (
              <>
                <button className="flex-1 bg-yellow-600 hover:bg-yellow-500 px-6 py-3 rounded-lg font-semibold transition-colors">
                  Pause Download
                </button>
                <button className="flex-1 bg-red-600 hover:bg-red-500 px-6 py-3 rounded-lg font-semibold transition-colors">
                  Cancel Download
                </button>
              </>
            )}
            
            {progress.status === 'completed' && (
              <button className="flex-1 bg-green-600 hover:bg-green-500 px-6 py-3 rounded-lg font-semibold transition-colors">
                Open Game Folder
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}