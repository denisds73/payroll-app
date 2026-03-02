import {
    BadRequestException,
    Body,
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportsService, type ReportType } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('save')
  @UseInterceptors(FileInterceptor('file'))
  saveReport(
    @UploadedFile() file: Express.Multer.File,
    @Body('workerName') workerName: string,
    @Body('reportType') reportType: string,
    @Body('fileName') fileName: string,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }
    if (!workerName) {
      throw new BadRequestException('workerName is required');
    }
    if (!reportType || !['Advance', 'Salary', 'Closure'].includes(reportType)) {
      throw new BadRequestException('reportType must be Advance, Salary, or Closure');
    }
    if (!fileName) {
      throw new BadRequestException('fileName is required');
    }

    const savedPath = this.reportsService.saveReport(
      workerName,
      reportType as ReportType,
      fileName,
      file.buffer,
    );

    return { savedPath };
  }
}
