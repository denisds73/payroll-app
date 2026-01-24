import React from 'react';
import ExpenseRow from './ExpenseRow';

export interface ExpenseData {
  id?: number | string;
  typeId: number;
  amount: number;
  note: string;
  workerId?: number;
  date?: string;
}

interface ExpenseTableProps {
  month: number;
  year: number;
  expenseTypes: { id: number; name: string }[];
  expenseMap: Record<string, ExpenseData[]>;
  loading: boolean;
  error?: string;
  onMonthYearChange: (month: number, year: number) => void;
  onSaveExpense: (date: string, data: ExpenseData) => void;
  onDeleteExpense: (expenseId: number | string) => void;
  onAddNewExpense: (date: string) => void;
  lockedDates: Map<string, string[]>;
  lockedPeriods?: Array<{
    startDate: string;
    endDate: string;
    reason: string;
    type: 'salary' | 'inactive';
  }>;
}

function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getAllDaysInMonth(month: number, year: number): string[] {
  const days: string[] = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    days.push(formatDateLocal(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };

  return `${start.toLocaleDateString('en-IN', formatOptions)} - ${end.toLocaleDateString('en-IN', formatOptions)}`;
}

function getLockReasons(
  date: string,
  lockedDates: Map<string, string[]>,
  lockedPeriods?: Array<{
    startDate: string;
    endDate: string;
    reason: string;
    type: 'salary' | 'inactive';
  }>,
): string[] {
  const reasons = lockedDates.get(date) || [];

  if (lockedPeriods && reasons.length > 0) {
    const dateOnly = date.split('T')[0];
    const enhancedReasons: string[] = [];

    for (const period of lockedPeriods) {
      const startDate = period.startDate.split('T')[0];
      const endDate = period.endDate.split('T')[0];

      if (dateOnly >= startDate && dateOnly <= endDate) {
        if (period.type === 'salary') {
          enhancedReasons.push(
            `Salary paid for period ${formatDateRange(period.startDate, period.endDate)}`,
          );
        } else if (period.type === 'inactive') {
          enhancedReasons.push(period.reason);
        }
      }
    }

    return enhancedReasons.length > 0 ? enhancedReasons : reasons;
  }

  return reasons;
}

const ExpenseTable: React.FC<ExpenseTableProps> = ({
  month,
  year,
  expenseTypes,
  expenseMap,
  loading,
  error,
  onMonthYearChange,
  onSaveExpense,
  onDeleteExpense,
  onAddNewExpense,
  lockedDates,
  lockedPeriods = [],
}) => {
  const dates = getAllDaysInMonth(month, year);
  const today = new Date();
  const isNotCurrentPeriod = month !== today.getMonth() + 1 || year !== today.getFullYear();

  return (
    <div className="rounded-xl bg-card shadow-md w-full">
      <div className="flex items-center justify-between px-6 py-3 bg-background border-b border-gray-200 rounded-t-xl shadow-sm">
        <div className="flex gap-x-15 font-semibold text-text-primary text-base w-full items-center">
          <div className="w-8 shrink-0" />
          <div className="w-21 shrink-0 ml-4">Date</div>
          <div className="w-28 shrink-0">Expense Type</div>
          <div className="w-22 shrink-0">Amount</div>
          <div className="w-28 shrink-0">Notes</div>
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 ml-6 shrink-0">
            <select
              className="px-3 py-1 rounded-md border border-gray-200 bg-background text-primary font-medium w-28 focus:ring-2 focus:ring-primary transition-all outline-none"
              value={month}
              onChange={(e) => onMonthYearChange(Number(e.target.value), year)}
              aria-label="Select month"
            >
              {Array.from({ length: 12 }, (_, idx) => {
                const monthValue = idx + 1;
                return (
                  <option key={monthValue} value={monthValue}>
                    {new Date(0, idx).toLocaleString('default', { month: 'short' })}
                  </option>
                );
              })}
            </select>
            <select
              className="px-3 py-1 rounded-md border border-gray-200 bg-background text-primary font-medium w-24 focus:ring-2 focus:ring-primary transition-all outline-none"
              value={year}
              onChange={(e) => onMonthYearChange(month, Number(e.target.value))}
              aria-label="Select year"
            >
              {Array.from({ length: 12 }, (_, idx) => {
                const currentYear = new Date().getFullYear();
                const yearValue = currentYear - 5 + idx;
                return (
                  <option key={yearValue} value={yearValue}>
                    {yearValue}
                  </option>
                );
              })}
            </select>
          </div>
          {isNotCurrentPeriod && (
            <div className="absolute top-full right-0 mt-1 px-2 py-1 bg-amber-100 border border-amber-400 rounded-md shadow-md text-amber-800 text-xs font-medium flex items-center gap-1 whitespace-nowrap z-10 animate-pulse">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Not viewing current month
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 mb-2 p-2 rounded bg-error/10 text-error text-sm font-medium">
          {error}
        </div>
      )}

      <div className="overflow-y-auto max-h-125 rounded-b-xl px-6 py-3 space-y-1">
        {loading ? (
          Array.from({ length: 5 }, (_, i) => (
            <div
              key={`loading-skeleton-${i + 1}`}
              className="animate-pulse h-14 bg-background rounded-lg w-full mb-2"
            />
          ))
        ) : (
          <>
            {dates.map((date) => {
              const expensesForDate = expenseMap[date] || [];
              const isLocked = lockedDates.has(date);
              const lockReasons = getLockReasons(date, lockedDates, lockedPeriods);

              if (expensesForDate.length === 0) {
                return (
                  <ExpenseRow
                    key={`${date}-empty`}
                    date={date}
                    expenseTypes={expenseTypes}
                    onSave={(data) => onSaveExpense(date, data)}
                    showAddButton={false}
                    canDelete={false}
                    isNew={false}
                    isLocked={isLocked}
                    lockReasons={lockReasons}
                  />
                );
              }

              return expensesForDate.map((expense, index) => {
                const isTemp = typeof expense.id === 'string' && expense.id.startsWith('temp-');
                return (
                  <ExpenseRow
                    key={expense.id}
                    date={date}
                    expenseTypes={expenseTypes}
                    initialData={expense}
                    onSave={(data) => onSaveExpense(date, data)}
                    onDelete={onDeleteExpense}
                    showAddButton={index === expensesForDate.length - 1}
                    onAddNew={() => onAddNewExpense(date)}
                    canDelete={true}
                    isNew={isTemp}
                    isLocked={isLocked}
                    lockReasons={lockReasons}
                  />
                );
              });
            })}
            {dates.every((date) => !expenseMap[date] || expenseMap[date].length === 0) && (
              <div className="mt-6 text-text-secondary text-center text-sm">
                No expense records for this month yet.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExpenseTable;
