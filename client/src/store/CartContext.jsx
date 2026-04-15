import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) {
      const localCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      setCartCount(localCart.reduce((sum, item) => sum + item.quantity, 0));
      setCartItems(localCart);
      return;
    }
    try {
      setLoading(true);
      const response = await cartService.getCart();
      const { summary, items } = response.data;
      setCartCount(summary.items_count);
      setCartItems(items);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const existing = guestCart.find(item => item.product_id === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        guestCart.push({ product_id: productId, quantity });
      }
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
      setCartCount(guestCart.reduce((sum, item) => sum + item.quantity, 0));
      setCartItems(guestCart);
      return;
    }
    await cartService.addToCart(productId, quantity);
    await fetchCart();
  };

  const updateQuantity = async (productId, quantity) => {
    if (!user) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const index = guestCart.findIndex(item => item.product_id === productId);
      if (index !== -1) {
        if (quantity <= 0) {
          guestCart.splice(index, 1);
        } else {
          guestCart[index].quantity = quantity;
        }
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        setCartCount(guestCart.reduce((sum, item) => sum + item.quantity, 0));
        setCartItems(guestCart);
      }
      return;
    }
    await cartService.updateQuantity(productId, quantity);
    await fetchCart();
  };

  const removeFromCart = async (productId) => {
    if (!user) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const newCart = guestCart.filter(item => item.product_id !== productId);
      localStorage.setItem('guestCart', JSON.stringify(newCart));
      setCartCount(newCart.reduce((sum, item) => sum + item.quantity, 0));
      setCartItems(newCart);
      return;
    }
    await cartService.removeItem(productId);
    await fetchCart();
  };

  const clearCart = async () => {
    if (!user) {
      localStorage.removeItem('guestCart');
      setCartCount(0);
      setCartItems([]);
      return;
    }
    await cartService.clearCart();
    await fetchCart();
  };

  const mergeGuestCart = async () => {
    if (!user) return;
    const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
    if (guestCart.length === 0) return;
    localStorage.removeItem('guestCart');
    await fetchCart();
  };

  return (
    <CartContext.Provider value={{
      cartCount,
      cartItems,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      mergeGuestCart,
      refreshCart: fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};