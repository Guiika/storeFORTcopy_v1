import apiClient from './api/client';

export const wishlistService = {
  getWishlist: () => apiClient.get('/wishlist'),
  addToWishlist: (productId) => apiClient.post(`/wishlist/${productId}`),
  removeFromWishlist: (productId) => apiClient.delete(`/wishlist/${productId}`),
  clearWishlist: () => apiClient.delete('/wishlist/clear'),
  checkInWishlist: (productId) => apiClient.get(`/wishlist/check/${productId}`),
};