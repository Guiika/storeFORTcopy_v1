import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistService } from '../services/wishlistService';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistItems, setWishlistItems] = useState([]);
  const { user } = useAuth();

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      const localWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
      setWishlistCount(localWishlist.length);
      setWishlistItems(localWishlist);
      return;
    }
    try {
      const response = await wishlistService.getWishlist();
      setWishlistCount(response.data.count);
      setWishlistItems(response.data.wishlist);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (productId) => {
    if (!user) {
      const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
      if (!guestWishlist.includes(productId)) {
        guestWishlist.push(productId);
        localStorage.setItem('guestWishlist', JSON.stringify(guestWishlist));
        setWishlistCount(guestWishlist.length);
        setWishlistItems(guestWishlist);
      }
      return;
    }
    await wishlistService.addToWishlist(productId);
    await fetchWishlist();
  };

  const removeFromWishlist = async (productId) => {
    if (!user) {
      const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
      const newList = guestWishlist.filter(id => id !== productId);
      localStorage.setItem('guestWishlist', JSON.stringify(newList));
      setWishlistCount(newList.length);
      setWishlistItems(newList);
      return;
    }
    await wishlistService.removeFromWishlist(productId);
    await fetchWishlist();
  };

  const isInWishlist = (productId) => {
    if (!user) {
      const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
      return guestWishlist.includes(productId);
    }
    return wishlistItems.some(item => item.id === productId || item.product_id === productId);
  };

  return (
    <WishlistContext.Provider value={{
      wishlistCount,
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      refreshWishlist: fetchWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};