import React, { createContext, useContext, useState, useCallback } from 'react';
import { libraryAPI, downloadsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [library, setLibrary] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [libraryStats, setLibraryStats] = useState(null);
  const [downloadStats, setDownloadStats] = useState(null);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [loadingDownloads, setLoadingDownloads] = useState(false);

  // Load library
  const loadLibrary = useCallback(async (sort = 'addedAt', search = '') => {
    if (!isLoggedIn) return;
    try {
      setLoadingLibrary(true);
      const response = await libraryAPI.getLibrary(sort, '-1', search);
      setLibrary(response.data.games);
    } catch (err) {
      console.error('Error loading library:', err);
    } finally {
      setLoadingLibrary(false);
    }
  }, [isLoggedIn]);

  // Load downloads
  const loadDownloads = useCallback(async (status = 'all') => {
    if (!isLoggedIn) return;
    try {
      setLoadingDownloads(true);
      const response = await downloadsAPI.getDownloads(status);
      setDownloads(response.data.downloads);
    } catch (err) {
      console.error('Error loading downloads:', err);
    } finally {
      setLoadingDownloads(false);
    }
  }, [isLoggedIn]);

  // Add game to library
  const addToLibrary = async (appId, title, thumbnail) => {
    try {
      const response = await libraryAPI.addGame(appId, title, thumbnail);
      setLibrary([...library, response.data.game]);
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add game';
      return { success: false, error: errorMsg };
    }
  };

  // Remove from library
  const removeFromLibrary = async (appId) => {
    try {
      await libraryAPI.removeGame(appId);
      setLibrary(library.filter(g => g.appId !== appId));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to remove game' };
    }
  };

  // Toggle favorite
  const toggleFavorite = async (appId) => {
    try {
      const response = await libraryAPI.toggleFavorite(appId);
      setLibrary(
        library.map(g =>
          g.appId === appId ? { ...g, isFavorite: response.data.game.isFavorite } : g
        )
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to toggle favorite' };
    }
  };

  // Start download
  const startDownload = async (appId, title, totalSize, downloadPath) => {
    try {
      const response = await downloadsAPI.startDownload(appId, title, totalSize, downloadPath);
      setDownloads([...downloads, response.data.download]);
      return { success: true, download: response.data.download };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to start download';
      return { success: false, error: errorMsg };
    }
  };

  // Update download progress
  const updateDownloadProgress = async (downloadId, progress, downloadedSize, speed, estimatedTime) => {
    try {
      const response = await downloadsAPI.updateProgress(downloadId, progress, downloadedSize, speed, estimatedTime);
      setDownloads(
        downloads.map(d =>
          d._id === downloadId ? response.data.download : d
        )
      );
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  // Pause download
  const pauseDownload = async (downloadId) => {
    try {
      const response = await downloadsAPI.pauseDownload(downloadId);
      setDownloads(
        downloads.map(d =>
          d._id === downloadId ? response.data.download : d
        )
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to pause download' };
    }
  };

  // Resume download
  const resumeDownload = async (downloadId) => {
    try {
      const response = await downloadsAPI.resumeDownload(downloadId);
      setDownloads(
        downloads.map(d =>
          d._id === downloadId ? response.data.download : d
        )
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to resume download' };
    }
  };

  // Complete download
  const completeDownload = async (downloadId) => {
    try {
      const response = await downloadsAPI.completeDownload(downloadId);
      setDownloads(
        downloads.map(d =>
          d._id === downloadId ? response.data.download : d
        )
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to complete download' };
    }
  };

  // Cancel download
  const cancelDownload = async (downloadId) => {
    try {
      await downloadsAPI.cancelDownload(downloadId);
      setDownloads(downloads.filter(d => d._id !== downloadId));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to cancel download' };
    }
  };

  // Load stats
  const loadStats = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const [libStatsRes, dlStatsRes] = await Promise.all([
        libraryAPI.getStats(),
        downloadsAPI.getStats()
      ]);
      setLibraryStats(libStatsRes.data.stats);
      setDownloadStats(dlStatsRes.data.stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [isLoggedIn]);

  const value = {
    // Library
    library,
    loadLibrary,
    addToLibrary,
    removeFromLibrary,
    toggleFavorite,
    loadingLibrary,
    libraryStats,
    
    // Downloads
    downloads,
    loadDownloads,
    startDownload,
    updateDownloadProgress,
    pauseDownload,
    resumeDownload,
    completeDownload,
    cancelDownload,
    loadingDownloads,
    downloadStats,
    
    // Stats
    loadStats
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
