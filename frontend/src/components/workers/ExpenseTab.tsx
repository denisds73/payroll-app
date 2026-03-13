import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { expensesAPI, expenseTypesAPI } from '../../services/api';
import { useSalaryLockStore } from '../../store/useSalaryLockStore';
import { useWorkerStatusStore } from '../../store/useWorkerStatusStore';
import type { ExpenseRowData } from '../ui/ExpenseRow';
import ExpenseTable from '../ui/ExpenseTable';

interface ExpenseTabProps {
  workerId: number;
  workerName: string;
  joinedAt: string;
  onExpenseChange: () => void;
}

interface ExpenseType {
  id: number;
  name: string;
}

interface Expense {
  id: number | string;
  workerId: number;
  amount: number;
  date: string;
  note: string;
  typeId: number;
}

export default function ExpenseTab({
  workerId,
  joinedAt,
  onExpenseChange,
}: ExpenseTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = useMemo(() => new Date(), []);

  const selectedMonth = useMemo(() => Number(searchParams.get('expMonth')) || today.getMonth() + 1, [searchParams, today]);
  const selectedYear = useMemo(() => Number(searchParams.get('expYear')) || today.getFullYear(), [searchParams, today]);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const isInitialMount = useRef(true);
  const prevMonthRef = useRef(selectedMonth);
  const prevYearRef = useRef(selectedYear);

  const lockDataByWorker = useSalaryLockStore((state) => state.lockDataByWorker);
  const fetchPaidPeriods = useSalaryLockStore((state) => state.fetchPaidPeriods);
  const isDateLocked = useSalaryLockStore((state) => state.isDateLocked);
  const lockLoading = useSalaryLockStore((state) => state.loading);
  const lockErrors = useSalaryLockStore((state) => state.errors);

  const statusDataByWorker = useWorkerStatusStore((state) => state.statusDataByWorker);
  const fetchInactivePeriods = useWorkerStatusStore((state) => state.fetchInactivePeriods);
  const isDateInactive = useWorkerStatusStore((state) => state.isDateInactive);
  const statusLoading = useWorkerStatusStore((state) => state.loading);
  const statusErrors = useWorkerStatusStore((state) => state.errors);

  const lockError = lockErrors[workerId];
  const statusError = statusErrors[workerId];

  useEffect(() => {
    fetchPaidPeriods(workerId);
    fetchInactivePeriods(workerId);
  }, [workerId, fetchPaidPeriods, fetchInactivePeriods]);

  useEffect(() => {
    fetchExpenseTypes();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [workerId, selectedMonth, selectedYear]);

  useEffect(() => {
    const currentMonth = Number(searchParams.get('expMonth'));
    const currentYear = Number(searchParams.get('expYear'));

    if (currentMonth && (currentMonth < 1 || currentMonth > 12)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('expMonth', String(today.getMonth() + 1));
      setSearchParams(newParams);
    }

    if (currentYear && (currentYear < 2000 || currentYear > 2100)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('expYear', String(today.getFullYear()));
      setSearchParams(newParams);
    }
  }, [searchParams, setSearchParams, today]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevMonthRef.current = selectedMonth;
      prevYearRef.current = selectedYear;
      return;
    }

    if (prevMonthRef.current !== selectedMonth || prevYearRef.current !== selectedYear) {
      const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', {
        month: 'long',
      });
      toast.success(`Viewing ${monthName} ${selectedYear}`);

      prevMonthRef.current = selectedMonth;
      prevYearRef.current = selectedYear;
    }
  }, [selectedMonth, selectedYear]);

  const fetchExpenseTypes = async () => {
    try {
      const response = await expenseTypesAPI.getAll();

      const preferredOrder = ['Expenses', 'Food', 'Site', 'Other'];

      const sortedTypes = response.data.sort((a: ExpenseType, b: ExpenseType) => {
        const indexA = preferredOrder.indexOf(a.name);
        const indexB = preferredOrder.indexOf(b.name);

        const orderA = indexA === -1 ? preferredOrder.length : indexA;
        const orderB = indexB === -1 ? preferredOrder.length : indexB;

        return orderA - orderB;
      });

      setExpenseTypes(sortedTypes);
    } catch (err) {
      console.error('Failed to fetch expense types:', err);
      setError('Failed to load expense types');
    }
  };

  const fetchExpenses = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      const response = await expensesAPI.getByWorker(workerId, { month: monthStr });
      setExpenses(response.data);
    } catch (err: unknown) {
      console.error('Failed to fetch expenses:', err);
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(errorMessage || 'Failed to load expenses');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  /**
   * Save handler for the new multi-type row format.
   * For each expense type with a non-zero amount, create or update the expense record.
   * For expense types with zero amount that previously had a record, delete them.
   */
  const handleSaveExpense = async (date: string, data: ExpenseRowData): Promise<void> => {
    try {
      const promises: Promise<unknown>[] = [];

      // Collect the first non-empty note to use across all expenses
      const note = data.note || '';

      for (const type of expenseTypes) {
        const amount = data.amounts[type.id] || 0;
        const existingId = data.existingIds[type.id];

        if (amount > 0) {
          if (existingId && !(typeof existingId === 'string' && String(existingId).startsWith('temp-'))) {
            // Update existing record
            promises.push(
              expensesAPI.update(existingId as number, {
                amount,
                typeId: type.id,
                note,
              }),
            );
          } else {
            // Create new record
            promises.push(
              expensesAPI.create({
                workerId,
                amount,
                typeId: type.id,
                date,
                note,
              }),
            );
          }
        } else if (existingId && !(typeof existingId === 'string' && String(existingId).startsWith('temp-'))) {
          // Amount is 0 but there was an existing record — delete it
          promises.push(expensesAPI.delete(existingId as number));
        }
      }

      await Promise.all(promises);

      onExpenseChange();
      toast.success('Expenses saved successfully');

      // Refresh to get updated IDs in background
      fetchExpenses(true);
    } catch (err: unknown) {
      console.error('Save failed:', err);
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;

      if (
        errorMessage?.toLowerCase().includes('locked') ||
        errorMessage?.toLowerCase().includes('salary') ||
        errorMessage?.toLowerCase().includes('paid')
      ) {
        toast.error('Cannot edit - salary has been paid for this period');
        fetchPaidPeriods(workerId, true);
      } else {
        toast.error(errorMessage || 'Failed to save expenses');
      }

      fetchExpenses(true);
    }
  };

  /**
   * Delete handler: deletes all existing expense records for this date row.
   */
  const handleDeleteExpense = async (_date: string, data: ExpenseRowData): Promise<void> => {
    try {
      const promises: Promise<unknown>[] = [];

      for (const [, id] of Object.entries(data.existingIds)) {
        if (id && !(typeof id === 'string' && String(id).startsWith('temp-'))) {
          promises.push(expensesAPI.delete(id as number));
        }
      }

      await Promise.all(promises);

      onExpenseChange();
      toast.success('Expenses deleted successfully');

      fetchExpenses(true);
    } catch (err: unknown) {
      console.error('Delete failed:', err);
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;

      if (
        errorMessage?.toLowerCase().includes('locked') ||
        errorMessage?.toLowerCase().includes('salary') ||
        errorMessage?.toLowerCase().includes('paid')
      ) {
        toast.error('Cannot delete - salary has been paid for this period');
        fetchPaidPeriods(workerId, true);
      } else {
        toast.error(errorMessage || 'Failed to delete expenses');
      }

      fetchExpenses(true);
    }
  };

  const handleMonthYearChange = (newMonth: number, newYear: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('expMonth', String(newMonth));
    newParams.set('expYear', String(newYear));
    // Clean up legacy params
    newParams.delete('month');
    newParams.delete('year');
    setSearchParams(newParams);
  };

  const getAllDaysInMonth = (month: number, year: number): string[] => {
    const days: string[] = [];
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      days.push(`${y}-${m}-${d}`);
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const lockedDates = useMemo(() => {
    const locked = new Map<string, string[]>();
    const dates = getAllDaysInMonth(selectedMonth, selectedYear);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    dates.forEach((date) => {
      const reasons: string[] = [];

      if (isDateLocked(workerId, date)) {
        reasons.push('Salary paid for this period');
      }

      if (isDateInactive(workerId, date)) {
        reasons.push('Worker was inactive on this date');
      }

      if (date < joinedAt.split('T')[0]) {
        reasons.push('Worker not yet joined');
      }

      if (date > todayStr) {
        reasons.push('Cannot add expenses for future dates');
      }

      if (reasons.length > 0) {
        locked.set(date, reasons);
      }
    });
    return locked;
  }, [
    lockDataByWorker,
    statusDataByWorker,
    workerId,
    selectedMonth,
    selectedYear,
    isDateLocked,
    isDateInactive,
    joinedAt,
  ]);

  const lockedPeriods = useMemo(() => {
    const workerData = lockDataByWorker[workerId];
    const statusData = statusDataByWorker[workerId];

    const periods = [];

    if (workerData) {
      periods.push(
        ...workerData.periods
          .filter((p) => p.isPaid)
          .map((p) => ({
            startDate: p.startDate,
            endDate: p.endDate,
            reason: 'Salary paid for this period',
            type: 'salary' as const,
          })),
      );
    }

    if (statusData) {
      periods.push(
        ...statusData.periods.map((p) => ({
          startDate: p.startDate,
          endDate: p.endDate,
          reason: p.reason || 'Worker was inactive during this period',
          type: 'inactive' as const,
        })),
      );
    }

    return periods;
  }, [lockDataByWorker, statusDataByWorker, workerId]);

  const isLoading = loading || lockLoading[workerId] || statusLoading[workerId];
  const combinedError = error || lockError || statusError || undefined;

  const expenseMap: Record<string, Expense[]> = {};
  for (const exp of expenses) {
    const dateKey = exp.date.split('T')[0];
    if (!expenseMap[dateKey]) {
      expenseMap[dateKey] = [];
    }
    expenseMap[dateKey].push({
      id: exp.id,
      workerId: exp.workerId,
      typeId: exp.typeId,
      amount: exp.amount,
      date: exp.date,
      note: exp.note || '',
    });
  }

  return (
    <ExpenseTable
      month={selectedMonth}
      year={selectedYear}
      expenseTypes={expenseTypes}
      expenseMap={expenseMap}
      loading={isLoading}
      error={combinedError}
      onMonthYearChange={handleMonthYearChange}
      onSaveExpense={handleSaveExpense}
      onDeleteExpense={handleDeleteExpense}
      lockedDates={lockedDates}
      lockedPeriods={lockedPeriods}
    />
  );
}
