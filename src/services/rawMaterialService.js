import api from './api';

export const rawMaterialService = {
  // Get all raw materials with pagination and filtering
  getRawMaterials: async (params = {}) => {
    const response = await api.get('/raw-materials', { params });
    return response.data;
  },

  // Search raw materials (for autocomplete)
  searchRawMaterials: async (searchTerm, limit = 20) => {
    const params = {
      search: searchTerm,
      limit: limit
    };
    const response = await api.get('/raw-materials', { params });
    return response.data;
  },

  // Get raw material by ID
  getRawMaterialById: async (id) => {
    const response = await api.get(`/raw-materials/${id}`);
    return response.data;
  },

  // Get raw material stock
  getRawMaterialStock: async (id, params = {}) => {
    const response = await api.get(`/raw-materials/${id}/stock`, { params });
    return response.data;
  },

  // Get raw material batches
  getRawMaterialBatches: async (id, params = {}) => {
    const response = await api.get(`/raw-materials/${id}/batches`, { params });
    return response.data;
  },

  // Create new raw material
  createRawMaterial: async (rawMaterialData) => {
    const response = await api.post('/raw-materials', rawMaterialData);
    return response.data;
  },

  // Update raw material
  updateRawMaterial: async (id, rawMaterialData) => {
    const response = await api.put(`/raw-materials/${id}`, rawMaterialData);
    return response.data;
  },

  // Delete raw material
  deleteRawMaterial: async (id) => {
    const response = await api.delete(`/raw-materials/${id}`);
    return response.data;
  },

  // Adjust raw material stock
  adjustRawMaterialStock: async (id, adjustmentData) => {
    const response = await api.post(`/raw-materials/${id}/adjust-stock`, adjustmentData);
    return response.data;
  }
};