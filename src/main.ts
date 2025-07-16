import { app, BrowserWindow } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createWindow = (): void => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // preload: join(__dirname, 'preload.js') // Uncomment when you add preload
    },
    titleBarStyle: 'hiddenInset', // Better macOS integration
    show: false, // Don't show until ready
  });

  // Load from development server in dev mode, or built files in production
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    win.loadURL('http://localhost:3000');
    // win.webContents.openDevTools(); // Uncomment for debugging
  } else {
    win.loadFile(join(__dirname, '../dist-renderer/index.html'));
  }

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win.show();
  });
};

app.whenReady().then((): void => {
  createWindow();

  app.on('activate', (): void => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', (): void => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 