import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const params = config.params ? `?${new URLSearchParams(config.params).toString()}` : '';
    console.log('API Request:', config.method?.toUpperCase(), config.url + params);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    const params = response.config.params
      ? `?${new URLSearchParams(response.config.params).toString()}`
      : '';
    console.log('API Response:', response.status, response.config.url + params);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  },
);

export const workerAPI = {
  create: (data: {
    name: string;
    wage: number;
    phone?: string;
    otRate?: number;
    joinedAt?: string;
    isActive?: boolean;
  }) => api.post('/workers', data),

  getAll: () => api.get('/workers'),

  getById: (id: string) => api.get(`/workers/${id}`),

  update: (
    id: string,
    data: Partial<{
      name: string;
      wage: number;
      phone?: string;
      otRate?: number;
      joinedAt?: string;
      isActive?: boolean;
    }>,
  ) => api.patch(`/workers/${id}`, data),

  delete: (id: string) => api.delete(`/workers/${id}`),
};

export default api;

export const attendanceAPI = {
  getByWorkerAndMonth: (workerId: number, month: number, year: number) => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    return api.get(`/attendance?workerId=${workerId}&month=${monthStr}`);
  },

  create: (data: {
    workerId: number;
    date: string;
    status: string;
    otUnits: number;
    note?: string;
  }) => api.post('/attendance', data),

  update: (id: number, data: any) => api.patch(`/attendance/${id}`, data),

  delete: (id: number) => api.delete(`/attendance/${id}`),
};

export const advancesAPI = {
  create: (data: { workerId: number; date: string; amount: number; reason?: string }) =>
    api.post('/advances', data),

  getByWorker: (
    workerId: number,
    params?: { month?: string; startDate?: string; endDate?: string },
  ) => api.get('/advances', { params: { workerId, ...params } }),

  update: (id: number, data: { amount?: number; date?: string; reason?: string }) =>
    api.patch(`/advances/${id}`, data),

  delete: (id: number) => api.delete(`/advances/${id}`),
};

export const expensesAPI = {
  create: (data: {
    workerId: number;
    date: string;
    amount: number;
    typeId: number;
    note?: string;
  }) => api.post('/expenses', data),

  getByWorker: (
    workerId: number,
    params?: { month?: string; startDate?: string; endDate?: string },
  ) => api.get('/expenses', { params: { workerId, ...params } }),

  update: (id: number, data: { amount?: number; date?: string; typeId?: number; note?: string }) =>
    api.patch(`/expenses/${id}`, data),

  delete: (id: number) => api.delete(`/expenses/${id}`),
};

export const expenseTypesAPI = {
  getAll: () => api.get('/expense-types'),
  create: (data: { name: string }) => api.post('/expense-types', data),
};

export const workersAPI = {
  getAll: () => api.get('/workers'),

  create: (data: { name: string; phone?: string; wage: number; otRate: number }) =>
    api.post('/workers', data),

  update: (
    id: number,
    data: { name?: string; phone?: string; wage?: number; otRate?: number; isActive?: boolean },
  ) => api.patch(`/workers/${id}`, data),

  delete: (id: number) => api.delete(`/workers/${id}`),

  getInactivePeriods: (workerId: number) => api.get(`/workers/${workerId}/inactive-periods`),

  disable: (workerId: number, effectiveFrom: string) =>
    api.post(`/workers/${workerId}/disable`, { effectiveFrom }),

  activate: (workerId: number, effectiveFrom: string) =>
    api.post(`/workers/${workerId}/activate`, { effectiveFrom }),

  getBlockedDates: (workerId: number) => api.get(`/workers/${workerId}/blocked-dates`),
};

export const salariesAPI = {
  calculate: (workerId: number, payDate?: string) => {
    console.log('🔍 salariesAPI.calculate called:', { workerId, payDate });
    return api.get(
      `/salaries/calculate/${workerId}`,
      payDate ? { params: { payDate } } : undefined,
    );
  },

  create: (workerId: number, payDate?: string) => {
    console.log('🔍 salariesAPI.create called:', { workerId, payDate });
    return api.post(`/salaries/${workerId}`, {}, payDate ? { params: { payDate } } : undefined);
  },

  getByWorker: (
    workerId: number,
    params?: {
      startDate?: string;
      endDate?: string;
      status?: 'PENDING' | 'PARTIAL' | 'PAID';
    },
  ) => api.get(`/salaries/worker/${workerId}`, { params }),

  getPending: () => api.get('/salaries/pending'),

  issue: (salaryId: number, data: { amount: number; paymentProof?: string }) =>
    api.post(`/salaries/${salaryId}/issue`, data),

  getPaidPeriods: (workerId: number) => {
    console.log('🔍 salariesAPI.getPaidPeriods called:', { workerId });
    return api.get('/salaries/paid-periods', { params: { workerId } });
  },
};
