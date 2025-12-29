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
  ) => api.put(`/workers/${id}`, data),

  delete: (id: string) => api.delete(`/workers/${id}`),
};

export default api;
