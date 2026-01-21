import api from './api';

export const salesOrderService = {
  getSalesOrders: async (params = {}) => {
    const response = await api.get('/sales-orders', { params });
    return response.data;
  },

  getSalesOrderById: async (id) => {
    const response = await api.get(`/sales-orders/${id}`);
    return response.data;
  },

  createSalesOrder: async (data) => {
    const response = await api.post('/sales-orders', data);
    return response.data;
  },

  confirmSalesOrder: async (id, data) => {
    const response = await api.put(`/sales-orders/${id}/confirm`, data);
    return response.data;
  },

  processSalesOrder: async (id, data) => {
    const response = await api.put(`/sales-orders/${id}/process`, data);
    return response.data;
  },

  completeSalesOrder: async (id, data) => {
    const response = await api.put(`/sales-orders/${id}/complete`, data);
    return response.data;
  },

  cancelSalesOrder: async (id, data) => {
    const response = await api.put(`/sales-orders/${id}/cancel`, data);
    return response.data;
  }
};
