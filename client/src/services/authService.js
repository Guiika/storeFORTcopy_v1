import apiClient from './api/client';

export const authService = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  changePassword: (passwords) => apiClient.put('/auth/change-password', passwords),
  validateToken: () => apiClient.get('/auth/validate-token'),
};