import api from './api';

const settingService = {
  getSettings: () => api.get('/api/v1/settings'),
  updateSettings: (data) => api.put('/api/v1/settings', data),
  getBackup: () => api.get('/api/v1/settings/backup'),
  restoreBackup: (formData) => api.post('/api/v1/settings/restore', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getAuditLogs: (params) => api.get('/api/v1/settings/audit-logs', { params }),
};

export default settingService;
