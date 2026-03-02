import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { getReportsBasePath, sanitizeForWindows } from 'src/utils/path.util';

export type ReportType = 'Advance' | 'Salary' | 'Closure';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  /**
   * Save a PDF report into the structured folder hierarchy:
   *   <reportsBase>/<WorkerName>/<ReportType>/<fileName>.pdf
   *
   * Creates directories dynamically if they don't exist.
   * Handles duplicate file names by appending a timestamp.
   *
   * @returns The absolute path where the file was saved.
   */
  saveReport(
    workerName: string,
    reportType: ReportType,
    fileName: string,
    pdfBuffer: Buffer,
  ): string {
    const basePath = getReportsBasePath();
    const sanitizedWorker = sanitizeForWindows(workerName, 'Unknown_Worker');
    const folderPath = path.join(basePath, sanitizedWorker, reportType);

    // Ensure the directory tree exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      this.logger.log(`Created directory: ${folderPath}`);
    }

    // Sanitize the file name itself
    let safeName = sanitizeForWindows(fileName, 'Report');

    // Ensure it ends with .pdf
    if (!safeName.toLowerCase().endsWith('.pdf')) {
      safeName = `${safeName}.pdf`;
    }

    let filePath = path.join(folderPath, safeName);

    // Handle duplicates by appending a timestamp before the extension
    if (fs.existsSync(filePath)) {
      const ext = path.extname(safeName);
      const base = safeName.slice(0, -ext.length);
      const timestamp = Date.now();
      safeName = `${base}_${timestamp}${ext}`;
      filePath = path.join(folderPath, safeName);
    }

    fs.writeFileSync(filePath, pdfBuffer);
    this.logger.log(`Saved report: ${filePath}`);

    return filePath;
  }
}
