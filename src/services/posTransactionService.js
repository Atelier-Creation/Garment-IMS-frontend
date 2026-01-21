import api from './api';

export const posTransactionService = {
  // Get all POS transactions with pagination and filtering
  getPosTransactions: async (params = {}) => {
    const response = await api.get('/pos-transactions', { params });
    return response.data;
  },

  // Get POS transaction by ID
  getPosTransactionById: async (id) => {
    const response = await api.get(`/pos-transactions/${id}`);
    return response.data;
  },

  // Get payment summary for sales order
  getPaymentSummary: async (salesOrderId) => {
    const response = await api.get(`/pos-transactions/payment-summary/${salesOrderId}`);
    return response.data;
  },

  // Get payment method statistics
  getPaymentMethodStats: async (params = {}) => {
    const response = await api.get('/pos-transactions/stats/payment-methods', { params });
    return response.data;
  },

  // Create new POS transaction
  createPosTransaction: async (transactionData) => {
    const response = await api.post('/pos-transactions', transactionData);
    return response.data;
  },

  // Update POS transaction
  updatePosTransaction: async (id, transactionData) => {
    const response = await api.put(`/pos-transactions/${id}`, transactionData);
    return response.data;
  },

  // Delete POS transaction
  deletePosTransaction: async (id) => {
    const response = await api.delete(`/pos-transactions/${id}`);
    return response.data;
  }
};