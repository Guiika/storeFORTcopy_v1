import apiClient from './api/client';

export const productsService = {
  getProducts: (filters) => apiClient.get('/catalog/all', { params: filters }),
  getProductById: (id) => apiClient.get(`/catalog/product/${id}`),
  getNewArrivals: (limit = 8) => apiClient.get('/catalog/home').then(res => res.data.new_arrivals),
  getPopular: (limit = 8) => apiClient.get('/catalog/home').then(res => res.data.popular_products),
  getDiscounted: (limit = 8) => apiClient.get('/catalog/home').then(res => res.data.discounted_products),
  getCategoryPage: (categoryId, filters) => apiClient.get(`/catalog/category/${categoryId}`, { params: filters }),
  quickSearch: (query) => apiClient.get('/catalog/quick-search', { params: { q: query } }),
};