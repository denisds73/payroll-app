import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export function getAppStoragePath(): string {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    // During local development, just use the project root (process.cwd() in backend)
    return process.cwd();
  }

  const appName = 'payroll-app';
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), appName);
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', appName);
  }
  return path.join(os.homedir(), `.${appName}`);
}

export function getDatabasePath(): string {
  const storagePath = getAppStoragePath();
  const dbDir = path.join(storagePath, 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, 'database.db');
}

export function getLocalBackupPath(): string {
  return path.join(getAppStoragePath(), 'backups', 'local');
}

export function getSafetyBackupPath(): string {
  return path.join(getAppStoragePath(), 'backups', 'safety');
}
