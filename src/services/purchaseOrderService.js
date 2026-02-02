import api from './api';

export const purchaseOrderService = {
  // Get all purchase orders with pagination and filtering
  getPurchaseOrders: async (params = {}) => {
    const response = await api.get('/purchase-orders', { params });
    return response.data;
  },

  // Get purchase orders by supplier
  getPurchaseOrdersBySupplier: async (supplierId, params = {}) => {
    const response = await api.get(`/purchase-orders/supplier/${supplierId}`, { params });
    return response.data;
  },

  // Get purchase order by ID
  getPurchaseOrderById: async (id) => {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data;
  },

  // Create new purchase order
  createPurchaseOrder: async (purchaseOrderData) => {
    const response = await api.post('/purchase-orders', purchaseOrderData);
    return response.data;
  },

  // Update purchase order
  updatePurchaseOrder: async (id, purchaseOrderData) => {
    const response = await api.put(`/purchase-orders/${id}`, purchaseOrderData);
    return response.data;
  },

  // Approve purchase order
  approvePurchaseOrder: async (id) => {
    const response = await api.put(`/purchase-orders/${id}/approve`);
    return response.data;
  },

  // Receive purchase order
  receivePurchaseOrder: async (id, receiveData) => {
    const response = await api.post(`/purchase-orders/${id}/receive`, receiveData);
    return response.data;
  },

  // Delete purchase order
  deletePurchaseOrder: async (id) => {
    const response = await api.delete(`/purchase-orders/${id}`);
    return response.data;
  },

  // Cancel purchase order
  cancelPurchaseOrder: async (id, reason) => {
    const response = await api.put(`/purchase-orders/${id}/cancel`, { reason });
    return response.data;
  }
};