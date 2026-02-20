import { spawn } from 'child_process';
import { app, BrowserWindow } from 'electron/main';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let backendProcess = null;
let isQuitting = false;

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
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.maximize();

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('close', async (e) => {
    if (!isQuitting) {
      e.preventDefault();
      console.log('[Electron] Shutting down: triggering pre-quit backup...');
      
      try {
         win.webContents.send('app-closing');
         // We execute the backup and a 3 second timer simultaneously
         // This guarantees the frontend "Backing up..." overlay is visible for at least 3 seconds UX-wise
         await Promise.all([
             fetch('http://localhost:3001/backup/trigger', { method: 'POST' }),
             new Promise(resolve => setTimeout(resolve, 3000))
         ]);
         
         win.webContents.send('app-backup-complete');
         console.log('[Electron] Pre-quit backup complete. Exiting in 1.5s.');
         
         // Wait 1.5 seconds to show the completion animation tick icon
         await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (err) {
         console.error('[Electron] Failed to trigger backup on close:', err);
      } finally {
         isQuitting = true;
         app.quit();
      }
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:5173').catch((error) => {
      console.error('Failed to load app:', error);
    });
  } else {
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

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});
