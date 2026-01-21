import api from './api';

export const auditLogService = {
  // Get all audit logs with pagination and filtering
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },

  // Get audit log by ID
  getAuditLogById: async (id) => {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data;
  },

  // Get audit logs by target
  getAuditLogsByTarget: async (targetTable, targetId, params = {}) => {
    const response = await api.get(`/audit-logs/target/${targetTable}/${targetId}`, { params });
    return response.data;
  },

  // Get audit logs by user
  getAuditLogsByUser: async (userId, params = {}) => {
    const response = await api.get(`/audit-logs/user/${userId}`, { params });
    return response.data;
  },

  // Get audit log statistics
  getAuditLogStats: async (params = {}) => {
    const response = await api.get('/audit-logs/stats', { params });
    return response.data;
  },

  // Create new audit log
  createAuditLog: async (auditLogData) => {
    const response = await api.post('/audit-logs', auditLogData);
    return response.data;
  },

  // Delete old audit logs
  deleteOldAuditLogs: async (daysOld = 90) => {
    const response = await api.delete('/audit-logs/cleanup', { data: { daysOld } });
    return response.data;
  }
};