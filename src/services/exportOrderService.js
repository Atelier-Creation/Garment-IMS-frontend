import api from './api';

export const exportOrderService = {
  getExportOrders: async (params = {}) => {
    const response = await api.get('/export-orders', { params });
    return response.data;
  },

  getExportOrderById: async (id) => {
    const response = await api.get(`/export-orders/${id}`);
    return response.data;
  },

  createExportOrder: async (data) => {
    const response = await api.post('/export-orders', data);
    return response.data;
  },

  updateExportOrder: async (id, data) => {
    const response = await api.put(`/export-orders/${id}`, data);
    return response.data;
  },

  updateExportOrderStatus: async (id, status) => {
    const response = await api.put(`/export-orders/${id}/status`, { status });
    return response.data;
  },

  deleteExportOrder: async (id) => {
    const response = await api.delete(`/export-orders/${id}`);
    return response.data;
  }
};
