import apiClient from './api/client';

export const cartService = {
  getCart: () => apiClient.get('/cart'),
  addToCart: (productId, quantity = 1, size = null) => apiClient.post(`/cart/${productId}`, { quantity, size }),
  updateQuantity: (productId, quantity, size) => apiClient.put(`/cart/${productId}`, { quantity, size: size || null }),
  removeItem: (productId, size) => apiClient.delete(`/cart/${productId}`, { params: size ? { size } : {} }),
  clearCart: () => apiClient.delete('/cart/clear'),
  getCartSummary: () => apiClient.get('/cart/summary'),
  moveFromWishlist: (productId, quantity = 1) => apiClient.post(`/cart/${productId}/move-from-wishlist`, { quantity }),
  applyPromoCode: (promoCode) => apiClient.post('/cart/apply-promo', { promoCode }),
};