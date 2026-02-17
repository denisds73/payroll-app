import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly dbPath = path.join(process.cwd(), 'database', 'database.db');
  private readonly backupDir = path.join(process.cwd(), 'backups', 'local');

  constructor(private prisma: PrismaService) {
    this.logger.log(`DB path: ${this.dbPath}`);
    this.logger.log(`Backup dir: ${this.backupDir}`);
    this.ensureBackupDir();
  }

  private ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Starting scheduled backup...');
    await this.performBackup();
  }

  async performBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `backup-${timestamp}.db`;
      const backupPath = path.join(this.backupDir, backupFilename);

      await fs.promises.copyFile(this.dbPath, backupPath);
      this.logger.log(`Local backup created at ${backupPath}`);

      const googleDriveId = await this.uploadToGoogleDrive(backupPath, backupFilename);

      return { status: 'success', path: backupPath, timestamp, googleDriveId };
    } catch (error) {
      this.logger.error('Backup failed', error);
      throw error;
    }
  }

  async getAuthUrl() {
    try {
      const credentials = await this.getCredentials();
      if (!credentials) return null;

      if (!credentials.installed && !credentials.web) {
        throw new Error('Invalid credentials. Please upload an OAuth Client ID JSON, not a Service Account key.');
      }

      const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
      
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

      return oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file'],
      });
    } catch (error) {
      this.logger.error('Failed to generate Auth URL', error);
      throw error;
    }
  }

  async setCredentials(code: string) {
    const credentials = await this.getCredentials();
    if (!credentials) throw new Error('No credentials configured');

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const { tokens } = await oAuth2Client.getToken(code);
    
    if (tokens.refresh_token) {
      await this.prisma.systemSetting.upsert({
        where: { key: 'GOOGLE_DRIVE_TOKEN' },
        update: { value: tokens.refresh_token },
        create: { 
          key: 'GOOGLE_DRIVE_TOKEN', 
          value: tokens.refresh_token,
          description: 'Google Drive OAuth Refresh Token'
        },
      });
      return { status: 'success' };
    }
    
    throw new Error('No refresh token received. Please try again.');
  }

  private async getCredentials() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'GOOGLE_DRIVE_CREDENTIALS' },
    });
    return setting ? JSON.parse(setting.value) : null;
  }

  private async uploadToGoogleDrive(filePath: string, filename: string): Promise<string | null> {
    try {
      const credentials = await this.getCredentials();
      const tokenSetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'GOOGLE_DRIVE_TOKEN' },
      });
      const folderIdSetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'BACKUP_FOLDER_ID' },
      });

      if (!credentials || !tokenSetting || !folderIdSetting) {
        this.logger.warn('Google Drive not configured (Missing creds, token, or folder). Skipping upload.');
        return null;
      }

      const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      
      oAuth2Client.setCredentials({ refresh_token: tokenSetting.value });

      const drive = google.drive({ version: 'v3', auth: oAuth2Client });

      const res = await drive.files.create({
        requestBody: {
          name: filename,
          parents: [folderIdSetting.value],
        },
        media: {
          mimeType: 'application/vnd.sqlite3',
          body: fs.createReadStream(filePath),
        },
      });

      this.logger.log(`Uploaded to Google Drive: ${res.data.id}`);
      return res.data.id || null;
    } catch (error) {
      this.logger.error('Failed to upload to Google Drive', error);
      return null;
    }
  }
  async listLocalBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) return [];
      
      const files = await fs.promises.readdir(this.backupDir);
      return files
        .filter(f => f.endsWith('.db') && f.startsWith('backup-'))
        .map(f => {
          const stats = fs.statSync(path.join(this.backupDir, f));
          return {
            filename: f,
            createdAt: stats.birthtime,
            size: stats.size,
            type: 'local'
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      this.logger.error('Failed to list local backups', error);
      return [];
    }
  }

  async listDriveBackups() {
    try {
      const credentials = await this.getCredentials();
      const tokenSetting = await this.prisma.systemSetting.findUnique({ where: { key: 'GOOGLE_DRIVE_TOKEN' } });
      const folderIdSetting = await this.prisma.systemSetting.findUnique({ where: { key: 'BACKUP_FOLDER_ID' } });

      if (!credentials || !tokenSetting || !folderIdSetting) return [];

      const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      oAuth2Client.setCredentials({ refresh_token: tokenSetting.value });

      const drive = google.drive({ version: 'v3', auth: oAuth2Client });
      
      const res = await drive.files.list({
        q: `'${folderIdSetting.value}' in parents and trashed = false`,
        fields: 'files(id, name, createdTime, size)',
        orderBy: 'createdTime desc',
      });

      return (res.data.files || []).map(f => ({
        id: f.id,
        filename: f.name,
        createdAt: f.createdTime,
        size: f.size,
        type: 'drive'
      }));
    } catch (error) {
      this.logger.error('Failed to list Drive backups', error);
      return [];
    }
  }

  async restoreLocal(filename: string) {
    try {
      const backupPath = path.join(this.backupDir, filename);
      if (!fs.existsSync(backupPath)) throw new Error('Backup file not found');

      if (!fs.existsSync(backupPath)) throw new Error('Backup file not found');

      await this.createSafetyBackup();

      await this.prisma.$disconnect();
      
      await fs.promises.copyFile(backupPath, this.dbPath);
      
      await this.prisma.$connect();
      
      this.logger.log(`Database restored from ${filename}`);
      return { status: 'success', message: 'Database restored successfully' };
    } catch (error) {
      this.logger.error('Restore failed', error);
      throw error;
    }
  }

  async restoreDrive(fileId: string) {
    try {
      const credentials = await this.getCredentials();
      const tokenSetting = await this.prisma.systemSetting.findUnique({ where: { key: 'GOOGLE_DRIVE_TOKEN' } });

      if (!credentials || !tokenSetting) throw new Error('Drive not configured');

      const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      oAuth2Client.setCredentials({ refresh_token: tokenSetting.value });

      const drive = google.drive({ version: 'v3', auth: oAuth2Client });

      // 1. Download to temp file
      const tempPath = path.join(this.backupDir, `temp-restore-${Date.now()}.db`);
      const dest = fs.createWriteStream(tempPath);

      const res = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      await new Promise((resolve, reject) => {
        res.data
          .pipe(dest)
          .on('finish', () => resolve(null))
          .on('error', reject);
      });

      const importedFilename = `drive-restore-${Date.now()}.db`;
      const finalPath = path.join(this.backupDir, importedFilename);
      await fs.promises.rename(tempPath, finalPath);

      return this.restoreLocal(importedFilename);

    } catch (error) {
      this.logger.error('Drive restore failed', error);
      throw error;
    }
  }

  private async createSafetyBackup() {
    const safetyDir = path.join(process.cwd(), 'backups', 'safety');
    if (!fs.existsSync(safetyDir)) fs.mkdirSync(safetyDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safetyPath = path.join(safetyDir, `safety-before-restore-${timestamp}.db`);
    
    await fs.promises.copyFile(this.dbPath, safetyPath);
    this.logger.log(`Safety backup created at ${safetyPath}`);
  }
}
