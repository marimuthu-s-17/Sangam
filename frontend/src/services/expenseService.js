import api from './api';

const expenseService = {
  getAll: (params) => api.get('/api/v1/expenses', { params }),
  getById: (id) => api.get(`/api/v1/expenses/${id}`),
  create: (data) => api.post('/api/v1/expenses', data),
  update: (id, data) => api.put(`/api/v1/expenses/${id}`, data),
  delete: (id) => api.delete(`/api/v1/expenses/${id}`),
  getStats: () => api.get('/api/v1/expenses/stats'),
};

export default expenseService;
