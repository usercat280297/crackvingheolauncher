const { contextBridge, ipcRenderer } = require('electron');

// Check if running in Electron
const isElectron = typeof process !== 'undefined' && process.versions && process.versions.electron;

contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close: () => ipcRenderer.send('close'),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  openOAuth: (provider) => ipcRenderer.invoke('open-oauth', provider),
  onOAuthCallback: (callback) => {
    ipcRenderer.on('oauth-callback', (event, data) => callback(data));
  },
  on: (channel, func) => {
    const validChannels = ['fullscreen-change', 'oauth-callback'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  removeAllListeners: (channel) => {
    const validChannels = ['fullscreen-change', 'oauth-callback'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  }
});
