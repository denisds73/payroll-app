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
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
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

// Existing worker and attendance APIs...

// Advances API
export const advancesAPI = {
  // Get advances for a worker
  getByWorker: (workerId: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ workerId: workerId.toString() });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/advances?${params.toString()}`);
  },

  // Get total advances for a worker in a period
  getWorkerTotal: (workerId: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/advances/worker/${workerId}/total?${params.toString()}`);
  },

  // Create advance
  create: (data: {
    workerId: number;
    date: string;
    amount: number;
    reason: string;
  }) => api.post('/advances', data),

  // Update advance
  update: (id: number, data: Partial<{
    amount: number;
    date: string;
    reason: string;
  }>) => api.patch(`/advances/${id}`, data),

  // Delete advance
  delete: (id: number) => api.delete(`/advances/${id}`),
};

// Salaries API
export const salariesAPI = {
  // Calculate salary (preview without creating)
  calculate: (workerId: number) => api.get(`/salaries/calculate/${workerId}`),

  // Create salary record
  create: (workerId: number) => api.post(`/salaries/${workerId}`),

  // Get worker salaries
  getByWorker: (workerId: number, params?: {
    startDate?: string;
    endDate?: string;
    status?: 'PENDING' | 'PARTIAL' | 'PAID';
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.status) searchParams.append('status', params.status);
    return api.get(`/salaries/worker/${workerId}?${searchParams.toString()}`);
  },

  // Get all pending salaries
  getPending: () => api.get('/salaries/pending'),

  // Issue salary (pay full or partial)
  issue: (salaryId: number, data: {
    amount: number;
    paymentProof?: string;
  }) => api.post(`/salaries/${salaryId}/issue`, data),
};

// Expenses API
export const expensesAPI = {
  // Get expenses for a worker
  getByWorker: (workerId: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ workerId: workerId.toString() });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/expenses?${params.toString()}`);
  },

  // Create expense
  create: (data: {
    workerId: number;
    date: string;
    amount: number;
    typeId: number;
    note?: string;
  }) => api.post('/expenses', data),

  // Update expense
  update: (id: number, data: Partial<{
    amount: number;
    date: string;
    typeId: number;
    note: string;
  }>) => api.patch(`/expenses/${id}`, data),

  // Delete expense
  delete: (id: number) => api.delete(`/expenses/${id}`),
};
