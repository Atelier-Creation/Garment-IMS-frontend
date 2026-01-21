import api from './api';

export const stockAdjustmentService = {
  // Get all stock adjustments with pagination and filtering
  getStockAdjustments: async (params = {}) => {
    const response = await api.get('/stock-adjustments', { params });
    return response.data;
  },

  // Get stock adjustment by ID
  getStockAdjustmentById: async (id) => {
    const response = await api.get(`/stock-adjustments/${id}`);
    return response.data;
  },

  // Get stock adjustment summary
  getStockAdjustmentSummary: async (params = {}) => {
    const response = await api.get('/stock-adjustments/summary', { params });
    return response.data;
  },

  // Create new stock adjustment
  createStockAdjustment: async (adjustmentData) => {
    const response = await api.post('/stock-adjustments', adjustmentData);
    return response.data;
  },

  // Update stock adjustment
  updateStockAdjustment: async (id, adjustmentData) => {
    const response = await api.put(`/stock-adjustments/${id}`, adjustmentData);
    return response.data;
  },

  // Delete stock adjustment
  deleteStockAdjustment: async (id) => {
    const response = await api.delete(`/stock-adjustments/${id}`);
    return response.data;
  }
};