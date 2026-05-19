import apiClient from './api/client';

export const categoriesService = {
  getAllCategories: () => apiClient.get('/categories'),
  getCategoryById: (id) => apiClient.get(`/categories/${id}`),
  getSubcategories: (parentId) => apiClient.get(`/categories/${parentId}/subcategories`),
  createCategory: (data) => apiClient.post('/categories', data),
  updateCategory: (id, data) => apiClient.put(`/categories/${id}`, data),
  deleteCategory: (id) => apiClient.delete(`/categories/${id}`),
};