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
