import api from './api';

const loanService = {
  getAll: (params) => api.get('/api/v1/loans', { params }),
  getById: (id) => api.get(`/api/v1/loans/${id}`),
  create: (data) => api.post('/api/v1/loans', data),
  update: (id, data) => api.put(`/api/v1/loans/${id}`, data),
  delete: (id) => api.delete(`/api/v1/loans/${id}`),
  recordPayment: (loanId, data) => api.post(`/api/v1/loans/${loanId}/payments`, data),
  getPayments: (loanId) => api.get(`/api/v1/loans/${loanId}/payments`),
  getStats: () => api.get('/api/v1/loans/stats'),
};

export default loanService;
