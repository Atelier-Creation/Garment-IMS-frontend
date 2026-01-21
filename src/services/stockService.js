import api from './api';

export const stockService = {
  // Get all stock with pagination and filtering
  getStock: async (params = {}) => {
    const response = await api.get('/stock', { params });
    return response.data;
  },

  // Get low stock items
  getLowStockItems: async () => {
    const response = await api.get('/stock/low-stock');
    return response.data;
  },

  // Get stock movements
  getStockMovements: async (params = {}) => {
    const response = await api.get('/stock/movements', { params });
    return response.data;
  },

  // Get stock by product
  getStockByProduct: async (productId) => {
    const response = await api.get(`/stock/product/${productId}`);
    return response.data;
  },

  // Get stock by raw material
  getStockByRawMaterial: async (rawMaterialId) => {
    const response = await api.get(`/stock/raw-material/${rawMaterialId}`);
    return response.data;
  },

  // Get stock by ID
  getStockById: async (id) => {
    const response = await api.get(`/stock/${id}`);
    return response.data;
  },

  // Create stock movement
  createStockMovement: async (movementData) => {
    const response = await api.post('/stock/movement', movementData);
    return response.data;
  },

  // Adjust stock
  adjustStock: async (id, adjustmentData) => {
    const response = await api.put(`/stock/${id}/adjust`, adjustmentData);
    return response.data;
  },

  // Transfer stock
  transferStock: async (transferData) => {
    const response = await api.post('/stock/transfer', transferData);
    return response.data;
  }
};