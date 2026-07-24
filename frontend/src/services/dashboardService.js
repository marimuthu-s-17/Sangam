import api from './api';

const dashboardService = {
  getSummary: () => api.get('/api/v1/dashboard'),
  search: (q) => api.get('/api/v1/dashboard/search', { params: { q } }),
};

export default dashboardService;
