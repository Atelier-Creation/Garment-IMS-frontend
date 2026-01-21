import api from './api';

export const productVariantService = {
  // Get all product variants with pagination and filtering
  getProductVariants: async (params = {}) => {
    const response = await api.get('/product-variants', { params });
    return response.data;
  },

  // Get product variant by ID
  getProductVariantById: async (id) => {
    const response = await api.get(`/product-variants/${id}`);
    return response.data;
  },

  // Get variants by product ID
  getVariantsByProduct: async (productId, params = {}) => {
    const response = await api.get(`/product-variants/product/${productId}`, { params });
    return response.data;
  },

  // Get variant stock summary
  getVariantStockSummary: async (id) => {
    const response = await api.get(`/product-variants/${id}/stock`);
    return response.data;
  },

  // Create new product variant
  createProductVariant: async (variantData) => {
    const response = await api.post('/product-variants', variantData);
    return response.data;
  },

  // Update product variant
  updateProductVariant: async (id, variantData) => {
    const response = await api.put(`/product-variants/${id}`, variantData);
    return response.data;
  },

  // Delete product variant
  deleteProductVariant: async (id) => {
    const response = await api.delete(`/product-variants/${id}`);
    return response.data;
  }
};