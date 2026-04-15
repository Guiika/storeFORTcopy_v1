import apiClient from './api/client';

export const categoriesService = {
  getAllCategories: () => apiClient.get('/categories'),
  getCategoryById: (id) => apiClient.get(`/categories/${id}`),
  getSubcategories: (parentId) => apiClient.get(`/categories/${parentId}/subcategories`),
};