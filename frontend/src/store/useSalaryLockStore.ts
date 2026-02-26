import { create } from 'zustand';
import { salariesAPI } from '../services/api';

interface PaidPeriod {
  id: number;
  startDate: string;
  endDate: string;
  isPaid: boolean;
}

interface WorkerLockData {
  workerId: number;
  workerName: string;
  periods: PaidPeriod[];
  fetchedAt: number;
}

interface SalaryLockStore {
  lockDataByWorker: Record<number, WorkerLockData>;
  loading: Record<number, boolean>;
  errors: Record<number, string | null>;

  fetchPaidPeriods: (workerId: number, force?: boolean) => Promise<void>;
  isDateLocked: (workerId: number, date: string, type?: 'advance' | 'other') => boolean;
  markSalaryAsPaid: (
    workerId: number,
    salaryId: number,
    cycleStart: string,
    cycleEnd: string,
  ) => void;
}

const CACHE_DURATION = 5 * 60 * 1000;

export const useSalaryLockStore = create<SalaryLockStore>((set, get) => ({
  lockDataByWorker: {},
  loading: {},
  errors: {},

  fetchPaidPeriods: async (workerId: number, force: boolean = false) => {
    const state = get();
    const existingData = state.lockDataByWorker[workerId];

    if (existingData && !force) {
      const age = Date.now() - existingData.fetchedAt;
      if (age < CACHE_DURATION) {
        console.log(`📦 Using cached lock data for worker ${workerId}`);
        return;
      }
    }

    set((state) => ({
      loading: { ...state.loading, [workerId]: true },
      errors: { ...state.errors, [workerId]: null },
    }));

    try {
      const response = await salariesAPI.getPaidPeriods(workerId);
      const periods = response.data?.periods || [];

      console.log('📅 Fetched paid periods:', {
        workerId,
        count: periods.length,
        periods: periods.map((p: any) => ({
          id: p.id,
          start: p.startDate,
          end: p.endDate,
          paid: p.isPaid,
        })),
      });

      set((state) => ({
        lockDataByWorker: {
          ...state.lockDataByWorker,
          [workerId]: {
            workerId,
            workerName: response.data?.workerName || '',
            periods,
            fetchedAt: Date.now(),
          },
        },
        loading: { ...state.loading, [workerId]: false },
      }));
    } catch (err: unknown) {
      console.error('❌ Failed to fetch paid periods:', err);
      set((state) => ({
        errors: { ...state.errors, [workerId]: 'Failed to load salary lock data' },
        loading: { ...state.loading, [workerId]: false },
      }));
    }
  },

  markSalaryAsPaid: (workerId: number, salaryId: number, cycleStart: string, cycleEnd: string) => {
    console.log('⚡ [OPTIMISTIC] Marking salary as paid:', {
      workerId,
      salaryId,
      cycleStart,
      cycleEnd,
    });

    set((state) => {
      const existingData = state.lockDataByWorker[workerId];

      const newPeriod: PaidPeriod = {
        id: salaryId,
        startDate: cycleStart,
        endDate: cycleEnd,
        isPaid: true,
      };

      console.log('📊 [OPTIMISTIC] Current state before update:', {
        hasExistingData: !!existingData,
        existingPeriods: existingData?.periods.length || 0,
        newPeriod,
      });

      if (!existingData) {
        console.log('✨ [OPTIMISTIC] Creating new worker data');
        return {
          lockDataByWorker: {
            ...state.lockDataByWorker,
            [workerId]: {
              workerId,
              workerName: '',
              periods: [newPeriod],
              fetchedAt: Date.now(),
            },
          },
        };
      }

      const existingPeriods = existingData.periods.filter((p) => p.id !== salaryId);
      const updatedPeriods = [...existingPeriods, newPeriod];

      console.log('🔄 [OPTIMISTIC] Updating existing data:', {
        beforeCount: existingPeriods.length,
        afterCount: updatedPeriods.length,
        updatedPeriods: updatedPeriods.map((p) => ({
          id: p.id,
          start: p.startDate,
          end: p.endDate,
        })),
      });

      return {
        lockDataByWorker: {
          ...state.lockDataByWorker,
          [workerId]: {
            ...existingData,
            periods: updatedPeriods,
            fetchedAt: Date.now(),
          },
        },
      };
    });

    console.log('✅ [OPTIMISTIC] Update complete, verifying...');
    const updatedState = get();
    console.log('🔍 [OPTIMISTIC] New state:', {
      workerId,
      periodsCount: updatedState.lockDataByWorker[workerId]?.periods.length || 0,
      periods: updatedState.lockDataByWorker[workerId]?.periods || [],
    });

    setTimeout(() => {
      console.log('🔄 [BACKGROUND] Starting background verification...');
      get().fetchPaidPeriods(workerId, true);
    }, 1000);
  },

  isDateLocked: (workerId: number, date: string, type: 'advance' | 'other' = 'other'): boolean => {
    const state = get();
    const workerData = state.lockDataByWorker[workerId];

    if (!workerData || !date) {
      console.log('🔓 [LOCK CHECK] Not locked (no data):', {
        workerId,
        date,
        hasWorkerData: !!workerData,
      });
      return false;
    }

    const dateOnly = date.split('T')[0];

    const isLocked = workerData.periods.some((period) => {
      if (!period.isPaid) return false;
      const startDate = period.startDate.split('T')[0];
      const endDate = period.endDate.split('T')[0];
      
      const inRange = 
        type === 'advance' 
          ? dateOnly >= startDate && dateOnly < endDate
          : dateOnly >= startDate && dateOnly <= endDate;

      if (inRange) {
        console.log('🔒 [LOCK CHECK] Date IS locked:', {
          date: dateOnly,
          periodStart: startDate,
          periodEnd: endDate,
          salaryId: period.id,
        });
      }

      return inRange;
    });

    if (!isLocked) {
      console.log('🔓 [LOCK CHECK] Date NOT locked:', {
        date: dateOnly,
        periodsChecked: workerData.periods.length,
      });
    }

    return isLocked;
  },
}));
