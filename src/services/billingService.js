import api from './api';

const billingService = {
  getBillings: (params) => api.get('/billing', { params }),
  getBillingById: (id) => api.get(`/billing/${id}`),
  createBilling: (data) => api.post('/billing', data),
  getBillingSummary: () => api.get('/billing/summary')
};

export default billingService;
