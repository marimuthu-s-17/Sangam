import api from './api';

const reminderService = {
  getSettings: (auctionId) => api.get(`/api/v1/reminders/auctions/${auctionId}/settings`),
  updateSettings: (auctionId, data) => api.put(`/api/v1/reminders/auctions/${auctionId}/settings`, data),
  getUnpaidMembers: (auctionId) => api.get(`/api/v1/reminders/auctions/${auctionId}/unpaid`),
  getHistory: (auctionId) => api.get(`/api/v1/reminders/auctions/${auctionId}/history`),
  sendReminders: (auctionId, memberIds = null) => api.post(`/api/v1/reminders/auctions/${auctionId}/send`, { member_ids: memberIds }),
  getGlobalSettings: () => api.get('/api/v1/reminders/global-settings'),
  updateGlobalSettings: (data) => api.put('/api/v1/reminders/global-settings', data),
  getAllHistory: () => api.get('/api/v1/reminders/history-all'),
  triggerSchedulerCheck: () => api.post('/api/v1/reminders/trigger-check'),
};

export default reminderService;
