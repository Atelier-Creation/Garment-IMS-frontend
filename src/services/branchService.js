import api from './api';

export const branchService = {
  // Get all branches with pagination and filtering
  getBranches: async (params = {}) => {
    const response = await api.get('/branches', { params });
    return response.data;
  },

  // Get branch by ID
  getBranchById: async (id) => {
    const response = await api.get(`/branches/${id}`);
    return response.data;
  },

  // Get branch stock
  getBranchStock: async (id, params = {}) => {
    const response = await api.get(`/branches/${id}/stock`, { params });
    return response.data;
  },

  // Get branch users
  getBranchUsers: async (id, params = {}) => {
    const response = await api.get(`/branches/${id}/users`, { params });
    return response.data;
  },

  // Create new branch
  createBranch: async (branchData) => {
    const response = await api.post('/branches', branchData);
    return response.data;
  },

  // Update branch
  updateBranch: async (id, branchData) => {
    const response = await api.put(`/branches/${id}`, branchData);
    return response.data;
  },

  // Delete branch
  deleteBranch: async (id) => {
    const response = await api.delete(`/branches/${id}`);
    return response.data;
  }
};