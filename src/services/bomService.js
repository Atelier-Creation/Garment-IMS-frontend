import api from './api';

export const bomService = {
  // Get all BOMs with pagination and filtering
  getBOMs: async (params = {}) => {
    const response = await api.get('/boms', { params });
    return response.data;
  },

  // Get BOM by ID
  getBOMById: async (id) => {
    const response = await api.get(`/boms/${id}`);
    return response.data;
  },

  // Get BOMs by product ID
  getBOMsByProduct: async (productId) => {
    const response = await api.get('/boms', { params: { product_id: productId } });
    return response.data;
  },

  // Get BOM cost analysis
  getBOMCostAnalysis: async (id) => {
    const response = await api.get(`/boms/${id}/cost-analysis`);
    return response.data;
  },

  // Create new BOM
  createBOM: async (bomData) => {
    const response = await api.post('/boms', bomData);
    return response.data;
  },

  // Update BOM
  updateBOM: async (id, bomData) => {
    const response = await api.put(`/boms/${id}`, bomData);
    return response.data;
  },

  // Approve BOM
  approveBOM: async (id) => {
    const response = await api.put(`/boms/${id}/approve`);
    return response.data;
  },

  // Delete BOM
  deleteBOM: async (id) => {
    const response = await api.delete(`/boms/${id}`);
    return response.data;
  }
};