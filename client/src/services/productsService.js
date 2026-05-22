import apiClient from './api/client';

export const productsService = {
  getProducts: (filters) => apiClient.get('/catalog/all', { params: filters }),
  getProductById: (id) => apiClient.get(`/catalog/product/${id}`),
  getNewArrivals: async (limit = 4) => {
    const res = await apiClient.get('/catalog/home');
    const arrivals = res?.data?.new_arrivals || [];
    return arrivals.slice(0, limit);
  },
  getPopular: (limit = 8) => apiClient.get('/catalog/home').then(res => res.data.popular_products),
  getDiscounted: (limit = 8) => apiClient.get('/catalog/home').then(res => res.data.discounted_products),
  getCategoryPage: (categoryId, filters) => apiClient.get(`/catalog/category/${categoryId}`, { params: filters }),
  quickSearch: (query) => apiClient.get('/catalog/quick-search', { params: { q: query } }),
  getProductAdmin: (id) => apiClient.get(`/products/${id}`),
  createProduct: (data) => apiClient.post('/products', data),
  updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),
  getFilters: () => apiClient.get('/catalog/all', { params: { limit: 1 } }),
  getProductImages: (id) => apiClient.get(`/products/${id}/images`),
  uploadProductImage: (id, formData) => apiClient.post(`/products/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProductImage: (imageId) => apiClient.delete(`/products/images/${imageId}`),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),
  getAdminProducts: (filters) => apiClient.get('/products', { params: filters }),
};