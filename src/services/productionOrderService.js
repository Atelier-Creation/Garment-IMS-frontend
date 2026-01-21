import api from './api';

export const productionOrderService = {
  getProductionOrders: async (params = {}) => {
    const response = await api.get('/production-orders', { params });
    return response.data;
  },

  getProductionOrderById: async (id) => {
    const response = await api.get(`/production-orders/${id}`);
    return response.data;
  },

  createProductionOrder: async (data) => {
    const response = await api.post('/production-orders', data);
    return response.data;
  },

  updateProductionOrder: async (id, data) => {
    const response = await api.put(`/production-orders/${id}`, data);
    return response.data;
  },

  startProductionOrder: async (id) => {
    const response = await api.put(`/production-orders/${id}/start`);
    return response.data;
  },

  completeProductionOrder: async (id, data) => {
    const response = await api.put(`/production-orders/${id}/complete`, data);
    return response.data;
  },

  deleteProductionOrder: async (id) => {
    const response = await api.delete(`/production-orders/${id}`);
    return response.data;
  }
};
