import api from './api';

const reportService = {
  getPreview: (reportType, params) => api.get(`/api/v1/reports/${reportType}`, { params }),
  getExportUrl: (reportType, format, params) => {
    // Determine the base URL from the api client or environment
    const baseURL = api.defaults.baseURL || import.meta.env.VITE_API_URL || '';
    const query = new URLSearchParams({ format, ...params }).toString();
    // Safely construct the URL to avoid duplicate prefixes
    const basePath = baseURL.endsWith('/api/v1') ? baseURL : `${baseURL.replace(/\/$/, '')}/api/v1`;
    return `${basePath}/reports/${reportType}/export?${query}`;
  }
};

export default reportService;
