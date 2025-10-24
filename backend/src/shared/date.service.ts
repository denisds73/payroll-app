import { Injectable } from '@nestjs/common';

@Injectable()
export class DateService {
  startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  startOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  endOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  }

  startOfMonth(year: number, month: number): Date {
    return new Date(year, month - 1, 1, 0, 0, 0, 0);
  }

  endOfMonth(year: number, month: number): Date {
    return new Date(year, month, 0, 23, 59, 59, 999);
  }

  parseDate(dateString: string): Date {
    return new Date(`${dateString}T00:00:00Z`);
  }
}
