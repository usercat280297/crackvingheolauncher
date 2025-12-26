// IPC Renderer Hook - Safe wrapper for Electron IPC in React
// This provides a unified way to communicate with Electron main process

import { useEffect, useState } from 'react';

let ipcRendererInstance = null;

// Initialize IPC Renderer safely
const initIpcRenderer = () => {
  // Check if we're in Electron environment
  if (typeof window !== 'undefined' && window.require) {
    try {
      return window.require('electron').ipcRenderer;
    } catch (err) {
      console.warn('⚠️ IPC Renderer not available (not in Electron):', err.message);
      return null;
    }
  }
  return null;
};

// Hook to use IPC Renderer safely
export const useIpcRenderer = () => {
  const [ipc, setIpc] = useState(null);

  useEffect(() => {
    if (!ipcRendererInstance) {
      ipcRendererInstance = initIpcRenderer();
    }
    setIpc(ipcRendererInstance);
  }, []);

  return ipc;
};

// Direct function to open directory dialog
export const openDirectoryDialog = async () => {
  try {
    // Try to get IPC Renderer
    let ipc = ipcRendererInstance || initIpcRenderer();
    
    if (!ipc) {
      console.warn('⚠️ IPC Renderer not available - using fallback');
      // Fallback: show file input (web compatibility)
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.onchange = (e) => {
          const files = e.target.files;
          if (files.length > 0) {
            const path = files[0].webkitRelativePath.split('/')[0];
            resolve({ canceled: false, filePaths: [path] });
          } else {
            resolve({ canceled: true, filePaths: [] });
          }
        };
        input.click();
      });
    }

    // Use IPC to open directory dialog
    const result = await ipc.invoke('dialog:openDirectory');
    return result;
  } catch (err) {
    console.error('Error opening directory dialog:', err);
    return { canceled: true, filePaths: [] };
  }
};

// Direct function to open folder in explorer
export const openFolderInExplorer = async (folderPath) => {
  try {
    let ipc = ipcRendererInstance || initIpcRenderer();
    
    if (!ipc) {
      console.warn('⚠️ Cannot open folder (not in Electron)');
      return false;
    }

    await ipc.invoke('shell:openPath', folderPath);
    return true;
  } catch (err) {
    console.error('Error opening folder:', err);
    return false;
  }
};

// Default export with all functions
export default {
  useIpcRenderer,
  openDirectoryDialog,
  openFolderInExplorer
};
