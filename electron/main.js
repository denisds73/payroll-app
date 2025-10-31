import { spawn } from 'child_process';
import { app, BrowserWindow } from 'electron/main';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Backend process reference
let backendProcess = null;

const isDev = process.env.NODE_ENV === 'development';

function startBackend() {
  const backendPath = isDev
    ? path.join(__dirname, '../backend/src/main.ts')
    : path.join(__dirname, '../backend/dist/main.js');

  const command = isDev ? 'ts-node' : 'node';
  const args = isDev ? ['-r', 'tsconfig-paths/register', backendPath] : [backendPath];

  backendProcess = spawn(command, args, {
    cwd: path.join(__dirname, '../backend'),
    env: {
      ...process.env,
      PORT: '3001',
      NODE_ENV: process.env.NODE_ENV,
    },
  });

  backendProcess.stdout.on('data', (data) => {
    console.log('[Backend]:', data.toString());
  });

  backendProcess.stderr.on('data', (data) => {
    console.error('[Backend Error]:', data.toString());
  });

  backendProcess.on('error', (error) => {
    console.error('[Backend Process Error]:', error);
  });
}

const createWindow = () => {
  const win = new BrowserWindow({
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Maximize the window
  win.maximize();

  // Show window when ready to avoid flashing
  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    // Load from Vite dev server in development
    win.loadURL('http://localhost:5173').catch((error) => {
      console.error('Failed to load app:', error);
    });
  } else {
    // Load the built files in production
    win.loadFile(path.join(__dirname, '../frontend/dist/index.html')).catch((error) => {
      console.error('Failed to load app:', error);
    });
  }
};

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup backend process on app quit
app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});
