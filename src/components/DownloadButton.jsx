import { useState } from 'react';

export default function DownloadButton({ game, className = "" }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const startDownload = async () => {
    if (!window.electron?.downloads) {
      alert('Download system not available');
      return;
    }

    setIsDownloading(true);
    
    try {
      const result = await window.electron.downloads.start({
        id: game.id,
        title: game.title,
        cover: game.cover,
        size: game.size,
        developer: game.developer,
        genres: game.genres
      });

      if (result.success) {
        // Show success message
        if (Notification.permission === 'granted') {
          new Notification('Download Started', {
            body: `${game.title} download has started`,
            icon: game.cover
          });
        }
      } else {
        alert('Failed to start download: ' + result.error);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to start download');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={startDownload}
      disabled={isDownloading}
      className={`flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 hover:scale-105 border border-cyan-500/30 ${className}`}
    >
      {isDownloading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Starting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download
        </>
      )}
    </button>
  );
}