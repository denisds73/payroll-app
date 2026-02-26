import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private getLogFilePath(): string {
    const isProd = process.env.NODE_ENV === 'production';
    const appName = 'payroll-app';
    let baseDir: string;

    if (!isProd) {
      baseDir = process.cwd();
    } else if (process.platform === 'win32') {
      baseDir = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), appName);
    } else if (process.platform === 'darwin') {
      baseDir = path.join(os.homedir(), 'Library', 'Application Support', appName);
    } else {
      baseDir = path.join(os.homedir(), `.${appName}`);
    }

    const logDir = path.join(baseDir, 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    return path.join(logDir, 'backend.log');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof Error ? exception.message : 'Internal Server Error';
    const stack = exception instanceof Error ? exception.stack : 'No stack trace';

    const logMessage = `[${new Date().toISOString()}] [500 Error] ${request.method} ${request.url}\nMessage: ${message}\nStack: ${stack}\n\n`;

    try {
      fs.appendFileSync(this.getLogFilePath(), logMessage);
    } catch (err) {
      console.error('Failed to write to log file', err);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}
