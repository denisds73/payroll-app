import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { expensesAPI, expenseTypesAPI } from '../../services/api';
import ExpenseTable, { type ExpenseData } from '../ui/ExpenseTable';

interface ExpenseTabProps {
  workerId: number;
  workerName: string;
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

export default function ExpenseTab({ workerId, onExpenseChange }: ExpenseTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = new Date();

  const selectedMonth = Number(searchParams.get('month')) || today.getMonth() + 1;
  const selectedYear = Number(searchParams.get('year')) || today.getFullYear();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const isInitialMount = useRef(true);
  const prevMonthRef = useRef(selectedMonth);
  const prevYearRef = useRef(selectedYear);

  useEffect(() => {
    fetchExpenseTypes();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [workerId, selectedMonth, selectedYear]);

  useEffect(() => {
    const currentMonth = Number(searchParams.get('month'));
    const currentYear = Number(searchParams.get('year'));

    if (currentMonth && (currentMonth < 1 || currentMonth > 12)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('month', String(today.getMonth() + 1));
      setSearchParams(newParams);
    }

    if (currentYear && (currentYear < 2000 || currentYear > 2100)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('year', String(today.getFullYear()));
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

      const preferredOrder = ['Food', 'Drinks', 'Site', 'Other'];

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
    } catch (err: unknown) {
      console.error('Save failed:', err);
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      alert(errorMessage || 'Failed to save expense');
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
    } catch (err: unknown) {
      console.error('Delete failed:', err);
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      alert(errorMessage || 'Failed to delete expense');
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
    newParams.set('month', String(newMonth));
    newParams.set('year', String(newYear));
    setSearchParams(newParams);
  };

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
      loading={loading}
      error={error}
      onMonthYearChange={handleMonthYearChange}
      onSaveExpense={handleSaveExpense}
      onDeleteExpense={handleDeleteExpense}
      onAddNewExpense={handleAddNewExpense}
    />
  );
}
