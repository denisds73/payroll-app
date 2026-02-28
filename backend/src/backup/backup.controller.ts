import { Controller, Post, Get, Body, Query } from '@nestjs/common';
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

  @Post('callback')
  async handleCallback(@Body('code') code: string) {
    return this.backupService.setCredentials(code);
  }

  @Get('callback')
  async handleCallbackGet(@Query('code') code: string) {
    await this.backupService.setCredentials(code);
    return `
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f4f4f5;">
          <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <h1 style="color: #10b981;">Successfully Connected!</h1>
            <p style="color: #71717a;">You can now close this window and return to the application.</p>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #18181b; color: white; border: none; border-radius: 6px; cursor: pointer;">Close Window</button>
          </div>
          <script>
            // Try to notify the opener if possible, though in Electron redirect it might not work
            if (window.opener) {
                window.opener.postMessage('google-drive-connected', '*');
            }
          </script>
        </body>
      </html>
    `;
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
