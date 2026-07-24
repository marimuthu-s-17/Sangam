import api from './api';

const reportService = {
  getPreview: (reportType, params) => api.get(`/api/v1/reports/${reportType}`, { params }),
  getExportUrl: (reportType, format, params) => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const query = new URLSearchParams({ format, ...params }).toString();
    return `${baseURL}/api/v1/reports/${reportType}/export?${query}`;
  }
};

export default reportService;
