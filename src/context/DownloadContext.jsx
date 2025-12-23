import { createContext, useState, useCallback, useEffect } from 'react';

export const DownloadContext = createContext();

export function DownloadProvider({ children }) {
  const [downloads, setDownloads] = useState([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedGameForDownload, setSelectedGameForDownload] = useState(null);
  const [showDonatePopup, setShowDonatePopup] = useState(false);
  const [completedGame, setCompletedGame] = useState(null);

  // Lấy danh sách downloads từ API khi component mount
  useEffect(() => {
    fetchDownloads();
    // Polling để cập nhật progress
    const interval = setInterval(fetchDownloads, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDownloads = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/downloads');
      if (response.ok) {
        const data = await response.json();
        setDownloads(data);
      }
    } catch (error) {
      console.error('Error fetching downloads:', error);
    }
  };

  const startDownload = useCallback((game) => {
    setSelectedGameForDownload(game);
    setShowDownloadModal(true);
  }, []);

  const addDownload = useCallback(async (game, downloadPath) => {
    try {
      const response = await fetch('http://localhost:3000/api/downloads/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          gameTitle: game.title,
          downloadPath,
          fileSize: (parseInt(game.size) || 50) * 1024 * 1024 * 1024 // GB to bytes
        })
      });

      if (response.ok) {
        const data = await response.json();
        const downloadId = data.downloadId;
        
        // Start simulating progress
        startProgressSimulation(downloadId, game, downloadPath);
        
        // Refresh downloads list
        setTimeout(fetchDownloads, 500);
        
        return downloadId;
      }
    } catch (error) {
      console.error('Error starting download:', error);
    }
  }, []);

  const startProgressSimulation = (downloadId, game, downloadPath) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/downloads/simulate-progress/${downloadId}`,
          { method: 'POST' }
        );

        if (response.ok) {
          const data = await response.json();
          const download = data.download;

          // Check if completed
          if (download.status === 'completed') {
            setCompletedGame(game);
            setShowDonatePopup(true);
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Progress simulation error:', error);
      }
    }, 100);
  };

  const pauseDownload = useCallback(async (downloadId) => {
    try {
      await fetch(`http://localhost:3000/api/downloads/${downloadId}/pause`, {
        method: 'POST'
      });
      fetchDownloads();
    } catch (error) {
      console.error('Error pausing download:', error);
    }
  }, []);

  const resumeDownload = useCallback(async (downloadId) => {
    try {
      await fetch(`http://localhost:3000/api/downloads/${downloadId}/resume`, {
        method: 'POST'
      });
      fetchDownloads();
    } catch (error) {
      console.error('Error resuming download:', error);
    }
  }, []);

  const cancelDownload = useCallback(async (downloadId) => {
    try {
      await fetch(`http://localhost:3000/api/downloads/${downloadId}/cancel`, {
        method: 'POST'
      });
      setDownloads(prev => prev.filter(d => d.id !== downloadId));
    } catch (error) {
      console.error('Error cancelling download:', error);
    }
  }, []);

  const retryDownload = useCallback(async (downloadId) => {
    try {
      await fetch(`http://localhost:3000/api/downloads/${downloadId}/retry`, {
        method: 'POST'
      });
      fetchDownloads();
    } catch (error) {
      console.error('Error retrying download:', error);
    }
  }, []);

  const value = {
    downloads,
    showDownloadModal,
    setShowDownloadModal,
    selectedGameForDownload,
    setSelectedGameForDownload,
    showDonatePopup,
    setShowDonatePopup,
    completedGame,
    startDownload,
    addDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    retryDownload,
    fetchDownloads
  };

  return (
    <DownloadContext.Provider value={value}>
      {children}
    </DownloadContext.Provider>
  );
}
