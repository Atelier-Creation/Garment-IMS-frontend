import api from './api';

export const subcategoryService = {
  // Get all subcategories
  getSubcategories: async (categoryId = null) => {
    const params = categoryId ? { category_id: categoryId } : {};
    const response = await api.get('/subcategories', { params });
    return response.data;
  },

  // Get subcategory by ID
  getSubcategoryById: async (id) => {
    const response = await api.get(`/subcategories/${id}`);
    return response.data;
  },

  // Create new subcategory
  createSubcategory: async (subcategoryData) => {
    const response = await api.post('/subcategories', subcategoryData);
    return response.data;
  },

  // Update subcategory
  updateSubcategory: async (id, subcategoryData) => {
    const response = await api.put(`/subcategories/${id}`, subcategoryData);
    return response.data;
  },

  // Delete subcategory
  deleteSubcategory: async (id) => {
    const response = await api.delete(`/subcategories/${id}`);
    return response.data;
  }
};