import { useState, useEffect } from 'react';

export default function DownloadManager() {
  const [downloads, setDownloads] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for download events
    const handleDownloadStart = (event) => {
      const { gameId, gameName } = event.detail;
      setDownloads(prev => [...prev, {
        id: gameId,
        name: gameName,
        progress: 0,
        status: 'downloading',
        startTime: new Date()
      }]);
      setIsVisible(true);
    };

    const handleDownloadProgress = (event) => {
      const { gameId, progress } = event.detail;
      setDownloads(prev => prev.map(download => 
        download.id === gameId 
          ? { ...download, progress }
          : download
      ));
    };

    const handleDownloadComplete = (event) => {
      const { gameId } = event.detail;
      setDownloads(prev => prev.map(download => 
        download.id === gameId 
          ? { ...download, status: 'completed', progress: 100 }
          : download
      ));
    };

    window.addEventListener('downloadStart', handleDownloadStart);
    window.addEventListener('downloadProgress', handleDownloadProgress);
    window.addEventListener('downloadComplete', handleDownloadComplete);

    return () => {
      window.removeEventListener('downloadStart', handleDownloadStart);
      window.removeEventListener('downloadProgress', handleDownloadProgress);
      window.removeEventListener('downloadComplete', handleDownloadComplete);
    };
  }, []);

  if (!isVisible || downloads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-sm w-full shadow-lg z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">Downloads</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-2">
        {downloads.map(download => (
          <div key={download.id} className="bg-gray-800 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white truncate">{download.name}</span>
              <span className="text-xs text-gray-400">{download.progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${download.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">
                {download.status === 'completed' ? 'Completed' : 'Downloading...'}
              </span>
              {download.status === 'downloading' && (
                <button className="text-xs text-red-400 hover:text-red-300">
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}