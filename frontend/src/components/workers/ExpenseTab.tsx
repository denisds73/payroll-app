import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { expensesAPI, expenseTypesAPI } from '../../services/api';
import { useSalaryLockStore } from '../../store/useSalaryLockStore';
import { useWorkerStatusStore } from '../../store/useWorkerStatusStore';
import ExpenseTable, { type ExpenseData } from '../ui/ExpenseTable';

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
  const today = new Date();

  const selectedMonth = Number(searchParams.get('expMonth')) || today.getMonth() + 1;
  const selectedYear = Number(searchParams.get('expYear')) || today.getFullYear();

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

      const preferredOrder = ['Food', 'Other'];

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

  const fetchExpenses = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleSaveExpense = (date: string, data: ExpenseData): void => {
    const expenseWithMetadata: Expense = {
      id: data.id || `temp-${Date.now()}`,
      ...data,
      workerId,
      date,
    };
    handleSaveExpenseInternal(date, expenseWithMetadata);
  };

  const handleSaveExpenseInternal = async (date: string, data: Expense) => {
    try {
      const isTempId = typeof data.id === 'string' && data.id.startsWith('temp-');

      if (data.id && !isTempId) {
        await expensesAPI.update(data.id as number, {
          amount: data.amount,
          typeId: data.typeId,
          note: data.note,
        });

        setExpenses((prev) =>
          prev.map((exp) =>
            exp.id === data.id
              ? { ...exp, amount: data.amount, typeId: data.typeId, note: data.note }
              : exp,
          ),
        );
      } else {
        const response = await expensesAPI.create({
          workerId,
          amount: data.amount,
          typeId: data.typeId,
          date,
          note: data.note,
        });

        setExpenses((prev) => {
          const filtered = isTempId ? prev.filter((exp) => exp.id !== data.id) : prev;
          return [...filtered, response.data];
        });
      }

      onExpenseChange();
      toast.success('Expense saved successfully');
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
        toast.error(errorMessage || 'Failed to save expense');
      }

      fetchExpenses();
    }
  };

  const handleDeleteExpense = async (expenseId: number | string) => {
    try {
      if (typeof expenseId === 'string' && expenseId.startsWith('temp-')) {
        setExpenses((prev) => prev.filter((exp) => exp.id !== expenseId));
        return;
      }

      setExpenses((prev) => prev.filter((exp) => exp.id !== expenseId));

      await expensesAPI.delete(expenseId as number);

      onExpenseChange();
      toast.success('Expense deleted successfully');
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
        toast.error(errorMessage || 'Failed to delete expense');
      }

      fetchExpenses();
    }
  };

  const handleAddNewExpense = (date: string) => {
    const tempExpense: Expense = {
      id: `temp-${Date.now()}`,
      workerId,
      amount: 0,
      date,
      note: '',
      typeId: 0,
    };

    setExpenses((prev) => [...prev, tempExpense]);
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
      onAddNewExpense={handleAddNewExpense}
      lockedDates={lockedDates}
      lockedPeriods={lockedPeriods}
    />
  );
}
