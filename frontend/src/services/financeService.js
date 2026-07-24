import api from './api';

const financeService = {
  getAll: (params) => api.get('/api/v1/finance', { params }),
  getById: (id) => api.get(`/api/v1/finance/${id}`),
  create: (data) => api.post('/api/v1/finance', data),
  update: (id, data) => api.put(`/api/v1/finance/${id}`, data),
  delete: (id) => api.delete(`/api/v1/finance/${id}`),
};

export default financeService;
