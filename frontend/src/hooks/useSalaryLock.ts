import { useEffect, useState } from 'react';
import { salariesAPI } from '../services/api';

interface PaidPeriod {
  id: number;
  startDate: string;
  endDate: string;
  isPaid: boolean;
}

interface UseSalaryLockReturn {
  isDateLocked: (date: string) => boolean;
  loading: boolean;
  error: string | null;
  paidPeriods: PaidPeriod[];
}

export function useSalaryLock(workerId: number): UseSalaryLockReturn {
  const [paidPeriods, setPaidPeriods] = useState<PaidPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaidPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

  const fetchPaidPeriods = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await salariesAPI.getPaidPeriods(workerId);

      const periods = response.data?.periods || [];

      console.log('📅 Fetched paid periods:', {
        workerId,
        workerName: response.data?.workerName,
        periodCount: periods.length,
        periods,
      });

      setPaidPeriods(periods);
    } catch (err: unknown) {
      console.error('Failed to fetch paid periods:', err);
      setError('Failed to load salary lock data');
      setPaidPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  const isDateLocked = (date: string): boolean => {
    if (!date || paidPeriods.length === 0) {
      return false;
    }

    const dateOnly = date.split('T')[0];

    return paidPeriods.some((period) => {
      if (!period.isPaid) return false;
      const startDate = period.startDate.split('T')[0];
      const endDate = period.endDate.split('T')[0];

      return dateOnly >= startDate && dateOnly <= endDate;
    });
  };

  return {
    isDateLocked,
    loading,
    error,
    paidPeriods,
  };
}
