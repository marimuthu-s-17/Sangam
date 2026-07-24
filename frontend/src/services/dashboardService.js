import api from './api';

const dashboardService = {
  getSummary: () => api.get('/api/dashboard'),
  search: (q) => api.get('/api/dashboard/search', { params: { q } }),
};

export default dashboardService;
