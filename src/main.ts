import { app, BrowserWindow, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as pty from 'node-pty';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Terminal PTY instance
let ptyProcess: pty.IPty | null = null;

const createWindow = (): void => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
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

// Terminal IPC Handlers
ipcMain.handle('terminal:start', async () => {
  // Kill existing terminal if it exists
  if (ptyProcess) {
    ptyProcess.kill();
  }

  // Determine shell based on platform
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  
  // Create new PTY process
  ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.cwd(),
    env: process.env,
  });

  // Send all terminal output to renderer
  ptyProcess.onData((data) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('terminal:data', data);
    });
  });

  // Handle terminal exit
  ptyProcess.onExit(({ exitCode }) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('terminal:exit', exitCode);
    });
    ptyProcess = null;
  });

  console.log('Terminal started');
});

ipcMain.handle('terminal:write', async (_, data: string) => {
  if (ptyProcess) {
    ptyProcess.write(data);
  }
});

ipcMain.handle('terminal:kill', async () => {
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcess = null;
  }
});

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