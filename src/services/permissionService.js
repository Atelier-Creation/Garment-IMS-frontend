import api from './api';

export const permissionService = {
  // Get all permissions with pagination and filtering
  getPermissions: async (params = {}) => {
    const response = await api.get('/permissions', { params });
    return response.data;
  },

  // Get all permissions without pagination (for dropdowns)
  getAllPermissions: async () => {
    const response = await api.get('/permissions/all');
    return response.data;
  },

  // Get permission by ID
  getPermissionById: async (id) => {
    const response = await api.get(`/permissions/${id}`);
    return response.data;
  },

  // Create new permission
  createPermission: async (permissionData) => {
    const response = await api.post('/permissions', permissionData);
    return response.data;
  },

  // Update permission
  updatePermission: async (id, permissionData) => {
    const response = await api.put(`/permissions/${id}`, permissionData);
    return response.data;
  },

  // Delete permission
  deletePermission: async (id) => {
    const response = await api.delete(`/permissions/${id}`);
    return response.data;
  }
};