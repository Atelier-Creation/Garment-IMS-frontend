import api from './api';

export const purchaseOrderInwardService = {
  // Get purchase orders ready for inward
  getInwardReadyOrders: async (params = {}) => {
    const response = await api.get('/purchase-order-inward/ready', { params });
    return response.data;
  },

  // Get specific purchase order for inward
  getOrderForInward: async (id) => {
    const response = await api.get(`/purchase-order-inward/${id}`);
    return response.data;
  },

  // Process inward for purchase order
  processInward: async (id, inwardData) => {
    const response = await api.post(`/purchase-order-inward/${id}/process`, inwardData);
    return response.data;
  },

  // Get inward history for purchase order
  getInwardHistory: async (id) => {
    const response = await api.get(`/purchase-order-inward/${id}/history`);
    return response.data;
  },

  // Get inward summary/dashboard
  getInwardSummary: async (params = {}) => {
    const response = await api.get('/purchase-order-inward/summary', { params });
    return response.data;
  }
};

export default purchaseOrderInwardService;