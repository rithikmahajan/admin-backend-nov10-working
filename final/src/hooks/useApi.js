import { useState, useEffect, useCallback } from 'react';
import { apiCall, handleApiError } from '../api/utils';

// Custom hook for API calls with loading and error states
export const useApi = (apiFunction, dependencies = [], immediate = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall(apiFunction, ...args);
      
      if (result.success) {
        setData(result.data);
        return result;
      } else {
        setError(result.message);
        return result;
      }
    } catch (err) {
      const errorResult = handleApiError(err);
      setError(errorResult.message);
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    execute,
    setData,
    setError,
  };
};

// Hook for authentication state management
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('cartData');
    localStorage.removeItem('wishlistData');
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    setUser,
  };
};

// Hook for cart management
export const useCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const savedCart = localStorage.getItem('cartData');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      setCartItems(cart);
      setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
    }
  }, []);

  const updateCart = (newCartItems) => {
    setCartItems(newCartItems);
    setCartCount(newCartItems.reduce((total, item) => total + item.quantity, 0));
    localStorage.setItem('cartData', JSON.stringify(newCartItems));
  };

  const addToCart = (item) => {
    const existingItemIndex = cartItems.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingItemIndex >= 0) {
      const updatedCart = [...cartItems];
      updatedCart[existingItemIndex].quantity += 1;
      updateCart(updatedCart);
    } else {
      updateCart([...cartItems, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    updateCart(updatedCart);
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const updatedCart = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    updateCart(updatedCart);
  };

  const clearCart = () => {
    updateCart([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return {
    cartItems,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
  };
};

// Hook for wishlist management
export const useWishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlistData');
    if (savedWishlist) {
      setWishlistItems(JSON.parse(savedWishlist));
    }
  }, []);

  const updateWishlist = (newWishlistItems) => {
    setWishlistItems(newWishlistItems);
    localStorage.setItem('wishlistData', JSON.stringify(newWishlistItems));
  };

  const addToWishlist = (item) => {
    if (!isInWishlist(item.id)) {
      updateWishlist([...wishlistItems, item]);
    }
  };

  const removeFromWishlist = (itemId) => {
    const updatedWishlist = wishlistItems.filter(item => item.id !== itemId);
    updateWishlist(updatedWishlist);
  };

  const isInWishlist = (itemId) => {
    return wishlistItems.some(item => item.id === itemId);
  };

  const clearWishlist = () => {
    updateWishlist([]);
  };

  return {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    wishlistCount: wishlistItems.length,
  };
};

// Hook for debounced search
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for pagination
export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const updatePagination = (total, itemsPerPage = limit) => {
    setTotalItems(total);
    setTotalPages(Math.ceil(total / itemsPerPage));
  };

  return {
    currentPage,
    limit,
    totalPages,
    totalItems,
    goToPage,
    nextPage,
    prevPage,
    setLimit,
    updatePagination,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};
