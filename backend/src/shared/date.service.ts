import { Injectable } from '@nestjs/common';

@Injectable()
export class DateService {
  // Returns start of today in UTC
  startOfToday(): Date {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
    );
  }

  startOfDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
    );
  }

  endOfDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
    );
  }

  startOfMonth(year: number, month: number): Date {
    return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  }

  endOfMonth(year: number, month: number): Date {
    return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  }

  parseDate(dateString: string): Date {
    return new Date(`${dateString}T00:00:00Z`);
  }
}
