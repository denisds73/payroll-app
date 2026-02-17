import { Controller, Post, Get, Body } from '@nestjs/common';
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
