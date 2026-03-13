import React from 'react';
import ExpenseRow, { type ExpenseRowData } from './ExpenseRow';
import Select from './Select';

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
  onSaveExpense: (date: string, data: ExpenseRowData) => void;
  onDeleteExpense: (date: string, data: ExpenseRowData) => void;
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

function buildRowData(
  expenses: ExpenseData[],
  expenseTypes: { id: number; name: string }[],
): ExpenseRowData {
  const amounts: Record<number, number> = {};
  const existingIds: Record<number, number | string> = {};
  let note = '';

  for (const t of expenseTypes) {
    amounts[t.id] = 0;
  }

  for (const exp of expenses) {
    amounts[exp.typeId] = exp.amount;
    if (exp.id) {
      existingIds[exp.typeId] = exp.id;
    }
    if (exp.note) {
      note = exp.note;
    }
  }

  return { amounts, note, existingIds };
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
  lockedDates,
  lockedPeriods = [],
}) => {
  const dates = getAllDaysInMonth(month, year);
  const today = new Date();
  const isNotCurrentPeriod = month !== today.getMonth() + 1 || year !== today.getFullYear();

  const onMonthChange = (newMonth: number) => {
    onMonthYearChange(newMonth + 1, year);
  };

  const onYearChange = (newYear: number) => {
    onMonthYearChange(month, newYear);
  };

  return (
    <div className="w-full">
      {/* 1. Title & Filters Bar (Sticky top-0) */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
          <h3 className="text-sm font-bold text-text-primary tracking-tight">
            Expense Records
          </h3>
          {isNotCurrentPeriod && (
            <div className="ml-4 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1.5 animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Not viewing current month
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Select
            variant="compact"
            value={month - 1}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            options={Array.from({ length: 12 }, (_, i) => ({
              value: i,
              label: new Date(0, i).toLocaleString('default', { month: 'short' }),
            }))}
            className="w-28"
          />
          <Select
            variant="compact"
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            options={Array.from({ length: new Date().getFullYear() - 2025 + 2 }, (_, i) => {
              const y = 2025 + i;
              return { value: y, label: String(y) };
            })}
            className="w-24"
          />
        </div>
      </div>

      {/* 2. Column Headers (Sticky top-[61px]) */}
      <div className="sticky top-[61px] z-20 flex items-center gap-x-4 px-12 py-3 bg-surface/95 backdrop-blur-md border-b border-border">
        <div className="w-36 shrink-0 font-bold text-text-secondary uppercase tracking-widest text-xs">
          Date
        </div>
        {expenseTypes.map((type) => (
          <div
            key={type.id}
            className="w-24 shrink-0 font-bold text-text-secondary uppercase tracking-widest text-xs text-center"
          >
            {type.name}
          </div>
        ))}
        <div className="flex-1 font-bold text-text-secondary uppercase tracking-widest text-xs text-center">
          Notes
        </div>
        <div className="w-32 shrink-0" />
      </div>

      <div className="px-6 py-4 space-y-2">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs font-bold uppercase tracking-wide">
            {error}
          </div>
        )}

        {loading ? (
          Array.from({ length: 5 }, (_, i) => (
            <div
              key={`loading-skeleton-${i + 1}`}
              className="animate-pulse h-14 bg-surface rounded-lg w-full mb-2"
            />
          ))
        ) : (
          <>
            {dates.map((date) => {
              const expensesForDate = expenseMap[date] || [];
              const isLocked = lockedDates.has(date);
              const lockReasons = getLockReasons(date, lockedDates, lockedPeriods);

              const rowData =
                expensesForDate.length > 0
                  ? buildRowData(expensesForDate, expenseTypes)
                  : undefined;

              return (
                <ExpenseRow
                  key={date}
                  date={date}
                  expenseTypes={expenseTypes}
                  initialData={rowData}
                  onSave={(data) => onSaveExpense(date, data)}
                  onDelete={(data) => onDeleteExpense(date, data)}
                  isLocked={isLocked}
                  lockReasons={lockReasons}
                />
              );
            })}
            {dates.every((date) => !expenseMap[date] || expenseMap[date].length === 0) && (
              <div className="mt-8 text-text-secondary text-center text-sm font-medium italic">
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
