import api from './api';

const billingService = {
  getBillings: async (params) => {
    const response = await api.get('/billing', { params });
    return response.data;
  },
  getBillingById: async (id) => {
    const response = await api.get(`/billing/${id}`);
    return response.data;
  },
  createBilling: async (data) => {
    const response = await api.post('/billing', data);
    return response.data;
  },
  getBillingSummary: async () => {
    const response = await api.get('/billing/summary');
    return response.data;
  }
};

export default billingService;
