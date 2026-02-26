import { execFile, spawn } from 'child_process';
import { app, BrowserWindow } from 'electron/main';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let backendProcess = null;
let isQuitting = false;

const isDev = process.env.NODE_ENV === 'development';

// ---------------------------------------------------------------------------
// Database Initialization
// ---------------------------------------------------------------------------

/**
 * In production, the database lives in the user's AppData directory.
 * On first launch the folder won't exist yet, so we run Prisma migrations
 * to create the SQLite database and apply the schema.
 */
function getProductionDbPath() {
  const appName = 'payroll-app';
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, appName, 'database', 'database.db');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', appName, 'database', 'database.db');
  }
  return path.join(os.homedir(), `.${appName}`, 'database', 'database.db');
}

function ensureDatabase() {
  if (isDev) return Promise.resolve();

  const dbPath = getProductionDbPath();
  if (fs.existsSync(dbPath)) return Promise.resolve();

  // Ensure the database directory exists
  const dbDir = path.dirname(dbPath);
  fs.mkdirSync(dbDir, { recursive: true });

  console.log('[Electron] First launch — running Prisma migrations to create database...');

  return new Promise((resolve, reject) => {
    const prismaSchemaDir = getPrismaDir();

    // Use Prisma's JS entry point directly instead of .bin shortcut
    // (.bin uses .cmd wrappers on Windows which don't work with ELECTRON_RUN_AS_NODE)
    const prismaCli = path.join(getBackendModulesPath(), 'prisma', 'build', 'index.js');

    const migrateProcess = execFile(
      process.execPath,
      [
        prismaCli,
        'migrate',
        'deploy',
        '--schema',
        path.join(prismaSchemaDir, 'schema.prisma'),
      ],
      {
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1',
          DATABASE_URL: `file:${dbPath}`,
        },
        cwd: getBackendDir(),
      },
      (error, stdout, stderr) => {
        if (stdout) console.log('[Prisma Migrate]:', stdout);
        if (stderr) console.error('[Prisma Migrate Err]:', stderr);
        if (error) {
          console.error('[Prisma Migrate Error]:', error);
          reject(error);
        } else {
          console.log('[Electron] Database created successfully.');
          resolve();
        }
      },
    );
  });
}

// ---------------------------------------------------------------------------
// Path Helpers
// ---------------------------------------------------------------------------

function getBackendDir() {
  if (isDev) {
    return path.join(__dirname, '../backend');
  }
  // In production, backend is in app.asar.unpacked
  return path.join(path.dirname(app.getAppPath()), 'app.asar.unpacked', 'backend');
}

function getBackendEntryPoint() {
  if (isDev) {
    return path.join(__dirname, '../backend/src/main.ts');
  }
  return path.join(getBackendDir(), 'dist', 'main.js');
}

function getPrismaDir() {
  return path.join(getBackendDir(), 'prisma');
}

function getBackendModulesPath() {
  return path.join(getBackendDir(), 'node_modules');
}

// ---------------------------------------------------------------------------
// Backend Process
// ---------------------------------------------------------------------------

function startBackend() {
  const backendEntry = getBackendEntryPoint();
  const backendDir = getBackendDir();

  if (isDev) {
    backendProcess = spawn('ts-node', ['-r', 'tsconfig-paths/register', backendEntry], {
      cwd: backendDir,
      env: {
        ...process.env,
        PORT: '3001',
        NODE_ENV: 'development',
      },
    });
  } else {
    // In production, use Electron's built-in Node.js via ELECTRON_RUN_AS_NODE
    backendProcess = spawn(process.execPath, [backendEntry], {
      cwd: backendDir,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        PORT: '3001',
        NODE_ENV: 'production',
      },
    });
  }

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

// ---------------------------------------------------------------------------
// Auto-Updater
// ---------------------------------------------------------------------------

async function loadAutoUpdater() {
  try {
    const updaterModule = await import('electron-updater');
    return updaterModule.autoUpdater ?? updaterModule.default?.autoUpdater ?? null;
  } catch (error) {
    console.warn('[Updater] electron-updater is unavailable. Auto-updates are disabled.', error);
    return null;
  }
}

async function setupAutoUpdater() {
  if (isDev) return; // Skip in development

  const autoUpdater = await loadAutoUpdater();
  if (!autoUpdater) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available:', info.version);
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[Updater] App is up to date.');
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[Updater] Download: ${Math.round(progress.percent)}%`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Update downloaded. Will install on next restart:', info.version);
  });

  autoUpdater.on('error', (err) => {
    console.error('[Updater] Error:', err);
  });

  try {
    autoUpdater.checkForUpdatesAndNotify();
  } catch (err) {
    console.error('[Updater] Failed to start update check:', err);
  }
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

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

  const loadDevServer = () => {
    win.loadURL('http://localhost:5173').catch((error) => {
      console.log('[Electron] Vite server not ready yet, retrying in 500ms...');
      setTimeout(loadDevServer, 500);
    });
  };

  if (isDev) {
    loadDevServer();
  } else {
    win.loadFile(path.join(app.getAppPath(), 'frontend', 'dist', 'index.html')).catch((error) => {
      console.error('Failed to load app:', error);
    });
  }
};

// ---------------------------------------------------------------------------
// App Lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(async () => {
  try {
    await ensureDatabase();
  } catch (err) {
    console.error('[Electron] Failed to initialise database:', err);
  }

  startBackend();
  createWindow();
  void setupAutoUpdater();

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
