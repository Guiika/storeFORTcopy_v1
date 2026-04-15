import apiClient from './api/client';

export const cartService = {
  getCart: () => apiClient.get('/cart'),
  addToCart: (productId, quantity = 1) => apiClient.post(`/cart/${productId}`, { quantity }),
  updateQuantity: (productId, quantity) => apiClient.put(`/cart/${productId}`, { quantity }),
  removeItem: (productId) => apiClient.delete(`/cart/${productId}`),
  clearCart: () => apiClient.delete('/cart/clear'),
  getCartSummary: () => apiClient.get('/cart/summary'),
  moveFromWishlist: (productId, quantity = 1) => apiClient.post(`/cart/${productId}/move-from-wishlist`, { quantity }),
};