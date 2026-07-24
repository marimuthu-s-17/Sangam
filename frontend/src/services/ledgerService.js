import api from './api';

const ledgerService = {
  getSummary: () => api.get('/api/v1/ledger/summary'),
  getMemberLedger: (memberId) => api.get(`/api/v1/ledger/member/${memberId}`),
};

export default ledgerService;
