import apiClient from './api/client';

export const orderService = {
  createOrder: (data) => apiClient.post('/orders', data),
  getMyOrders: () => apiClient.get('/orders/my'),
  getAllOrders: (status) => apiClient.get('/orders', { params: status ? { status } : {} }),
  updateStatus: (id, status) => apiClient.patch(`/orders/${id}/status`, { status }),
};
