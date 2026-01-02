import { create } from 'zustand';
import api from '../services/api';

export interface Worker {
  id: number;
  name: string;
  phone: string;
  wage: number;
  otRate: number;
  isActive: boolean;
  balance: number;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkerStore {
  workers: Worker[];
  loading: boolean;
  error: string | null;
  fetchWorkers: () => Promise<void>;
  deleteWorker: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useWorkerStore = create<WorkerStore>((set, get) => ({
  workers: [],
  loading: false,
  error: null,

  fetchWorkers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/workers');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('First worker:', response.data[0]);
      set({
        workers: response.data,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch workers',
        loading: false,
        workers: [],
      });
    }
  },

  deleteWorker: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/workers/${id}`);
      const currentWorkers = get().workers;
      const updatedWorkers = currentWorkers.filter((w) => w.id !== id);

      set({
        workers: updatedWorkers,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete worker',
        loading: false,
      });
    }
  },
  clearError: () => {
    set({ error: null });
  },
}));
