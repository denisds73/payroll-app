import { Controller, Post, Get, Body, Query, Header } from '@nestjs/common';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('trigger')
  async triggerBackup() {
    return this.backupService.performBackup();
  }

  @Get('auth-url')
  async getAuthUrl() {
    const url = await this.backupService.getAuthUrl();
    return { url };
  }

  @Get('callback')
  @Header('Content-Type', 'text/html')
  async handleCallbackGet(@Query('code') code: string) {
    try {
      if (!code) throw new Error('No authorization code provided from Google.');
      await this.backupService.setCredentials(code);
      return `
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f4f4f5;">
            <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
              <div style="color: #10b981; font-size: 48px; margin-bottom: 20px;">✓</div>
              <h1 style="color: #18181b; margin: 0 0 10px 0;">Successfully Connected!</h1>
              <p style="color: #71717a; margin-bottom: 30px;">Your Google Drive account is now linked to the application.</p>
              <button onclick="window.close()" style="padding: 10px 24px; background: #18181b; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Back to App</button>
            </div>
            <script>
              if (window.opener) {
                  window.opener.postMessage('google-drive-connected', '*');
              }
            </script>
          </body>
        </html>
      `;
    } catch (error) {
      return `
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fef2f2;">
            <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #fee2e2;">
              <div style="color: #ef4444; font-size: 48px; margin-bottom: 20px;">⚠</div>
              <h1 style="color: #991b1b; margin: 0 0 10px 0;">Connection Failed</h1>
              <p style="color: #b91c1c; margin-bottom: 10px; font-weight: 600;">${error.message}</p>
              <p style="color: #7f1d1d; font-size: 13px; margin-bottom: 30px;">Please check your credentials and try again. Ensure the redirect URI is correctly set.</p>
              <button onclick="window.close()" style="padding: 10px 24px; background: #991b1b; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Close & Retry</button>
            </div>
          </body>
        </html>
      `;
    }
  }

  @Get('list/local')
  async listLocal() {
    return this.backupService.listLocalBackups();
  }

  @Get('list/drive')
  async listDrive() {
    return this.backupService.listDriveBackups();
  }

  @Post('restore/local')
  async restoreLocal(@Body('filename') filename: string) {
    return this.backupService.restoreLocal(filename);
  }

  @Post('restore/drive')
  async restoreDrive(@Body('fileId') fileId: string) {
    return this.backupService.restoreDrive(fileId);
  }
}
