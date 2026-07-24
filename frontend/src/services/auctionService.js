import api from './api';

const auctionService = {
  getAll: (params) => api.get('/api/v1/auctions', { params }),
  getById: (id) => api.get(`/api/v1/auctions/${id}`),
  create: (data) => api.post('/api/v1/auctions', data),
  update: (id, data) => api.put(`/api/v1/auctions/${id}`, data),
  delete: (id) => api.delete(`/api/v1/auctions/${id}`),
  getStats: () => api.get('/api/v1/auctions/stats'),
  getMembers: (id) => api.get(`/api/v1/auctions/${id}/members`),
  getCurrentMonth: (id) => api.get(`/api/v1/auctions/${id}/current-month`),
  startMonth: (id) => api.post(`/api/v1/auctions/${id}/start-month`),
  completeMonth: (id, data) => api.post(`/api/v1/auctions/${id}/complete-month`, data),
  updateContribution: (id, paid_amount) => api.put(`/api/v1/monthly-contributions/${id}`, { paid_amount }),
  getHistory: (id) => api.get(`/api/v1/auctions/${id}/history`),
};

export default auctionService;
