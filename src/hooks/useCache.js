import { useState, useEffect } from 'react';

// Custom hook for user state management
export function useUserState() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return {
    user,
    setUser: updateUser,
    logout,
    isLoading,
    isAuthenticated: !!user
  };
}

// Custom hook for cache management
export function useCache(key, initialValue = null) {
  const [value, setValue] = useState(() => {
    try {
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : initialValue;
    } catch (error) {
      console.error(`Error loading cache for key ${key}:`, error);
      return initialValue;
    }
  });

  const updateCache = (newValue) => {
    setValue(newValue);
    try {
      if (newValue === null || newValue === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newValue));
      }
    } catch (error) {
      console.error(`Error saving cache for key ${key}:`, error);
    }
  };

  const clearCache = () => {
    setValue(initialValue);
    localStorage.removeItem(key);
  };

  return [value, updateCache, clearCache];
}

// Custom hook for settings management
export function useSettings() {
  const [settings, updateSettings, clearSettings] = useCache('appSettings', {
    theme: 'dark',
    language: 'en',
    autoUpdate: true,
    notifications: true,
    downloadPath: '',
    maxConcurrentDownloads: 3
  });

  const updateSetting = (key, value) => {
    updateSettings({
      ...settings,
      [key]: value
    });
  };

  return {
    settings,
    updateSetting,
    updateSettings,
    clearSettings
  };
}

// Custom hook for game library management
export function useGameLibrary() {
  const [library, updateLibrary, clearLibrary] = useCache('gameLibrary', []);

  const addToLibrary = (game) => {
    const updatedLibrary = [...library];
    const existingIndex = updatedLibrary.findIndex(g => g.id === game.id);
    
    if (existingIndex >= 0) {
      updatedLibrary[existingIndex] = { ...updatedLibrary[existingIndex], ...game };
    } else {
      updatedLibrary.push(game);
    }
    
    updateLibrary(updatedLibrary);
  };

  const removeFromLibrary = (gameId) => {
    const updatedLibrary = library.filter(game => game.id !== gameId);
    updateLibrary(updatedLibrary);
  };

  const isInLibrary = (gameId) => {
    return library.some(game => game.id === gameId);
  };

  return {
    library,
    addToLibrary,
    removeFromLibrary,
    isInLibrary,
    clearLibrary
  };
}