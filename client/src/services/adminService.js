import apiClient from './api/client';

export const adminService = {
  getDashboard: () => apiClient.get('/admin/dashboard'),
  exportProducts: () => apiClient.get('/admin/products/export', { responseType: 'blob' }),
  getUsers: (limit = 100) => apiClient.get('/admin/users', { params: { limit } }),
  updateUser: (id, data) => apiClient.put(`/admin/users/${id}`, data),
  updateUserRole: (id, role) => apiClient.put(`/admin/users/${id}/role`, { role }),
  toggleUserStatus: (id, is_active) => apiClient.put(`/admin/users/${id}/status`, { is_active }),
  bulkUpdatePrices: (products) => apiClient.post('/admin/products/bulk-update-prices', { products }),
};
