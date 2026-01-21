import api from './api';

export const reportService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  // Get sales report
  getSalesReport: async (params = {}) => {
    const response = await api.get('/reports/sales', { params });
    return response.data;
  },

  // Get purchase report
  getPurchaseReport: async (params = {}) => {
    const response = await api.get('/reports/purchase', { params });
    return response.data;
  },

  // Get production report
  getProductionReport: async (params = {}) => {
    const response = await api.get('/reports/production', { params });
    return response.data;
  },

  // Get stock report
  getStockReport: async () => {
    const response = await api.get('/reports/stock');
    return response.data;
  },

  // Get financial report
  getFinancialReport: async (params = {}) => {
    const response = await api.get('/reports/financial', { params });
    return response.data;
  },

  // Get custom report
  getCustomReport: async (reportData) => {
    const response = await api.post('/reports/custom', reportData);
    return response.data;
  }
};