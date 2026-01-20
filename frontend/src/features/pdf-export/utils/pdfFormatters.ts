import type { FormattingOptions } from '../types/pdf.types';

export function formatCurrency(amount: number, options?: FormattingOptions): string {
  const locale = options?.locale || 'en-IN';
  const currency = options?.currency || '₹';
  const formatted = amount.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${currency}${formatted}`;
}

export function formatDate(
  dateString: string,
  format: 'short' | 'long' | 'full' = 'short',
): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    year: 'numeric',
  };
  switch (format) {
    case 'short':
      options.month = 'short';
      break;
    case 'long':
      options.month = 'long';
      break;
    case 'full':
      options.weekday = 'long';
      options.month = 'long';
      break;
  }
  return date.toLocaleDateString('en-IN', options);
}

export function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  const dateStr = formatDate(timestamp, 'short');
  const timeStr = date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} at ${timeStr}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-IN');
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Invalid Date Range';
  }
  const startDay = start.getDate().toString().padStart(2, '0');
  const startMonth = start.toLocaleDateString('en-IN', { month: 'short' });
  const endDay = end.getDate().toString().padStart(2, '0');
  const endMonth = end.toLocaleDateString('en-IN', { month: 'short' });
  const endYear = end.getFullYear();
  if (start.getMonth() === end.getMonth()) {
    return `${startDay} - ${endDay} ${endMonth} ${endYear}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}