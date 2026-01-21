import api from './api';

export const shipmentService = {
  // Get all shipments with pagination and filtering
  getShipments: async (params = {}) => {
    const response = await api.get('/shipments', { params });
    return response.data;
  },

  // Get shipment by ID
  getShipmentById: async (id) => {
    const response = await api.get(`/shipments/${id}`);
    return response.data;
  },

  // Track shipment by tracking number
  trackShipment: async (trackingNumber) => {
    const response = await api.get(`/shipments/track/${trackingNumber}`);
    return response.data;
  },

  // Create new shipment
  createShipment: async (shipmentData) => {
    const response = await api.post('/shipments', shipmentData);
    return response.data;
  },

  // Update shipment
  updateShipment: async (id, shipmentData) => {
    const response = await api.put(`/shipments/${id}`, shipmentData);
    return response.data;
  },

  // Update shipment status
  updateShipmentStatus: async (id, status) => {
    const response = await api.put(`/shipments/${id}/status`, { status });
    return response.data;
  },

  // Delete shipment
  deleteShipment: async (id) => {
    const response = await api.delete(`/shipments/${id}`);
    return response.data;
  }
};