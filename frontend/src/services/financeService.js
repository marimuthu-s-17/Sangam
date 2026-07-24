import api from './api';

const financeService = {
  getAll: (params) => api.get('/api/finance', { params }),
  getById: (id) => api.get(`/api/finance/${id}`),
  create: (data) => api.post('/api/finance', data),
  update: (id, data) => api.put(`/api/finance/${id}`, data),
  delete: (id) => api.delete(`/api/finance/${id}`),
};

export default financeService;
