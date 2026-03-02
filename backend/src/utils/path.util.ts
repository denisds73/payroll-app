import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

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

export function getReportsBasePath(): string {
  return path.join(getAppStoragePath(), 'reports');
}

/**
 * Sanitize a string for use as a Windows-safe file or folder name.
 * Removes characters that are invalid on Windows: < > : " / \ | ? *
 * Also removes control characters (0x00–0x1F), trims trailing dots/spaces,
 * collapses consecutive underscores, handles Windows reserved device names,
 * and falls back to a default if empty.
 */
export function sanitizeForWindows(name: string, fallback = 'Unknown'): string {
  let sanitized = name
    // Replace Windows-invalid characters with underscore
    .replace(/[<>:"/\\|?*]/g, '_')
    // Remove control characters
    .replace(/[\x00-\x1f]/g, '')
    // Replace whitespace runs with a single underscore
    .replace(/\s+/g, '_')
    // Collapse consecutive underscores
    .replace(/_+/g, '_')
    // Trim leading/trailing underscores, dots, and spaces
    .replace(/^[_.\s]+|[_.\s]+$/g, '');

  if (sanitized.length === 0) {
    return fallback;
  }

  // Windows reserved device names — cannot be used as file/folder names
  const reserved = /^(CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])$/i;
  if (reserved.test(sanitized)) {
    sanitized = `_${sanitized}`;
  }

  return sanitized;
}
