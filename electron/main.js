const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');

let win;

// Register custom protocol
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('gamelauncher', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('gamelauncher');
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Handle OAuth callback from protocol
    const url = commandLine.find(arg => arg.startsWith('gamelauncher://'));
    if (url) {
      handleOAuthCallback(url);
    }
    
    // Focus window
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

// Handle OAuth callback
function handleOAuthCallback(url) {
  const urlObj = new URL(url);
  const token = urlObj.searchParams.get('token');
  const user = urlObj.searchParams.get('user');
  
  if (token && user && win) {
    win.webContents.send('oauth-callback', { token, user: JSON.parse(decodeURIComponent(user)) });
  }
}

// Handle protocol on macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleOAuthCallback(url);
});

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true, // Enable DevTools in development
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Only block DevTools in production
  if (process.env.NODE_ENV === 'production') {
    win.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        event.preventDefault();
      }
      if (input.key === 'F12') {
        event.preventDefault();
      }
      if (input.control && input.shift && input.key.toLowerCase() === 'c') {
        event.preventDefault();
      }
      if (input.control && input.shift && input.key.toLowerCase() === 'j') {
        event.preventDefault();
      }
    });

    win.webContents.on('context-menu', (event) => {
      event.preventDefault();
    });
  }

  // Open external links in browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle OAuth link clicks
  ipcMain.handle('open-oauth', async (event, provider) => {
    const url = `http://localhost:3000/api/auth/${provider}`;
    await shell.openExternal(url);
  });

  ipcMain.on('minimize', () => win.minimize());
  ipcMain.on('maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize());
  ipcMain.on('close', () => win.close());

  // File dialog handler
  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      defaultPath: path.join(require('os').homedir(), 'Downloads')
    });
    return result;
  });

  // Select folder handler
  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      defaultPath: 'C:\\Games'
    });
    if (result.canceled) {
      return null;
    }
    return result.filePaths[0];
  });

  win.on('enter-full-screen', () => win.webContents.send('fullscreen-change', true));
  win.on('leave-full-screen', () => win.webContents.send('fullscreen-change', false));

  // Log when page loads
  win.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully');
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Page failed to load:', errorCode, errorDescription);
  });

  // Open DevTools in development
  // Disabled by user request
  // if (process.env.NODE_ENV !== 'production') {
  //   win.webContents.openDevTools();
  // }

  win.loadURL('http://localhost:5173');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
