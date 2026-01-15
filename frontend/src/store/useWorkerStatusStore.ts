import { create } from 'zustand';
import { workersAPI } from '../services/api';

interface InactivePeriod {
  startDate: string;
  endDate: string;
  reason: string;
}

interface WorkerStatusData {
  workerId: number;
  workerName: string;
  isActive: boolean;
  periods: InactivePeriod[];
  fetchedAt: number;
}

interface WorkerStatusStore {
  statusDataByWorker: Record<number, WorkerStatusData>;
  loading: Record<number, boolean>;
  errors: Record<number, string | null>;

  // Actions
  fetchInactivePeriods: (workerId: number, force?: boolean) => Promise<void>;
  isDateInactive: (workerId: number, date: string) => boolean;
  markWorkerStatusChanged: (workerId: number) => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useWorkerStatusStore = create<WorkerStatusStore>((set, get) => ({
  statusDataByWorker: {},
  loading: {},
  errors: {},

  fetchInactivePeriods: async (workerId: number, force: boolean = false) => {
    const state = get();
    const existingData = state.statusDataByWorker[workerId];

    // Use cache if available and not forcing refresh
    if (existingData && !force) {
      const age = Date.now() - existingData.fetchedAt;
      if (age < CACHE_DURATION) {
        console.log('🔄 Using cached inactive periods for worker', workerId);
        return;
      }
    }

    set({
      loading: { ...state.loading, [workerId]: true },
      errors: { ...state.errors, [workerId]: null },
    });

    try {
      const response = await workersAPI.getInactivePeriods(workerId);
      const periods = response.data?.periods || [];

      console.log('📅 Fetched inactive periods:', {
        workerId,
        count: periods.length,
        periods: periods.map((p: any) => ({
          start: p.startDate,
          end: p.endDate,
          reason: p.reason,
        })),
      });

      set({
        statusDataByWorker: {
          ...state.statusDataByWorker,
          [workerId]: {
            workerId,
            workerName: response.data?.workerName || '',
            isActive: response.data?.isActive || false,
            periods,
            fetchedAt: Date.now(),
          },
        },
        loading: { ...state.loading, [workerId]: false },
      });
    } catch (err: unknown) {
      console.error('❌ Failed to fetch inactive periods:', err);
      set({
        errors: {
          ...state.errors,
          [workerId]: 'Failed to load worker status data',
        },
        loading: { ...state.loading, [workerId]: false },
      });
    }
  },

  isDateInactive: (workerId: number, date: string): boolean => {
    const state = get();
    const workerData = state.statusDataByWorker[workerId];

    if (!workerData || !date) {
      console.log('🔍 INACTIVE CHECK: No data', { workerId, date, hasWorkerData: !!workerData });
      return false;
    }

    const dateOnly = date.split('T')[0];

    const isInactive = workerData.periods.some((period) => {
      const startDate = period.startDate.split('T')[0];
      const endDate = period.endDate.split('T')[0];
      const inRange = dateOnly >= startDate && dateOnly <= endDate;

      if (inRange) {
        console.log('🔒 INACTIVE CHECK: Date IS in inactive period', {
          date: dateOnly,
          periodStart: startDate,
          periodEnd: endDate,
          reason: period.reason,
        });
      }

      return inRange;
    });

    if (!isInactive) {
      console.log('✅ INACTIVE CHECK: Date NOT in inactive period', {
        date: dateOnly,
        periodsChecked: workerData.periods.length,
      });
    }

    return isInactive;
  },

  markWorkerStatusChanged: (workerId: number) => {
    console.log('🔄 OPTIMISTIC: Worker status changed, will refresh', { workerId });

    // Trigger background refresh
    setTimeout(() => {
      console.log('🔄 BACKGROUND: Refreshing worker status...');
      get().fetchInactivePeriods(workerId, true);
    }, 1000);
  },
}));
