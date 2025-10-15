import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../../api/endpoints';
import { apiCall } from '../../api/utils';

// Async thunks for cart operations
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        // Return local cart if not authenticated
        const localCart = JSON.parse(localStorage.getItem('cartData') || '[]');
        return { items: localCart, isLocal: true };
      }
      
      const result = await apiCall(cartAPI.getCart);
      if (result.success) {
        return { items: result.data.items || [], isLocal: false };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch cart');
    }
  }
);

export const addToCartAPI = createAsyncThunk(
  'cart/addToCartAPI',
  async (itemData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        // Handle local cart addition
        return { item: itemData, isLocal: true };
      }
      
      const result = await apiCall(cartAPI.addToCart, itemData);
      if (result.success) {
        return { item: result.data, isLocal: false };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add item to cart');
    }
  }
);

export const updateCartItemAPI = createAsyncThunk(
  'cart/updateCartItemAPI',
  async ({ itemId, quantity }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        // Handle local cart update
        return { itemId, quantity, isLocal: true };
      }
      
      const result = await apiCall(cartAPI.updateCartItem, itemId, quantity);
      if (result.success) {
        return { itemId, quantity, isLocal: false };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update cart item');
    }
  }
);

export const removeFromCartAPI = createAsyncThunk(
  'cart/removeFromCartAPI',
  async (itemId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        // Handle local cart removal
        return { itemId, isLocal: true };
      }
      
      const result = await apiCall(cartAPI.removeFromCart, itemId);
      if (result.success) {
        return { itemId, isLocal: false };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to remove item from cart');
    }
  }
);

export const clearCartAPI = createAsyncThunk(
  'cart/clearCartAPI',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        // Handle local cart clearing
        return { isLocal: true };
      }
      
      const result = await apiCall(cartAPI.clearCart);
      if (result.success) {
        return { isLocal: false };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to clear cart');
    }
  }
);

// Helper functions
const calculateCartTotals = (items) => {
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 500 ? 0 : 50; // Free shipping above $500
  const total = subtotal + tax + shipping;
  
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    shipping: parseFloat(shipping.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    count
  };
};

const saveCartToStorage = (items) => {
  localStorage.setItem('cartData', JSON.stringify(items));
};

// Initial state
const initialState = {
  items: [],
  subtotal: 0,
  tax: 0,
  shipping: 0,
  total: 0,
  count: 0,
  isLoading: false,
  error: null,
  isLocal: true, // Track if cart is local or synced with server
  lastUpdated: null,
};

// Cart slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const newItem = action.payload;
      const existingItemIndex = state.items.findIndex(
        item => item.id === newItem.id && 
                item.size === newItem.size && 
                item.color === newItem.color
      );
      
      if (existingItemIndex >= 0) {
        state.items[existingItemIndex].quantity += newItem.quantity || 1;
      } else {
        state.items.push({
          ...newItem,
          quantity: newItem.quantity || 1,
          addedAt: new Date().toISOString()
        });
      }
      
      const totals = calculateCartTotals(state.items);
      Object.assign(state, totals);
      state.lastUpdated = new Date().toISOString();
      
      // Save to localStorage
      if (state.isLocal) {
        saveCartToStorage(state.items);
      }
    },
    
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      
      const totals = calculateCartTotals(state.items);
      Object.assign(state, totals);
      state.lastUpdated = new Date().toISOString();
      
      // Save to localStorage
      if (state.isLocal) {
        saveCartToStorage(state.items);
      }
    },
    
    updateQuantity: (state, action) => {
      const { itemId, quantity } = action.payload;
      const itemIndex = state.items.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          state.items.splice(itemIndex, 1);
        } else {
          state.items[itemIndex].quantity = quantity;
        }
        
        const totals = calculateCartTotals(state.items);
        Object.assign(state, totals);
        state.lastUpdated = new Date().toISOString();
        
        // Save to localStorage
        if (state.isLocal) {
          saveCartToStorage(state.items);
        }
      }
    },
    
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.tax = 0;
      state.shipping = 0;
      state.total = 0;
      state.count = 0;
      state.lastUpdated = new Date().toISOString();
      
      // Clear localStorage
      if (state.isLocal) {
        localStorage.removeItem('cartData');
      }
    },
    
    restoreCartFromStorage: (state) => {
      const savedCart = localStorage.getItem('cartData');
      if (savedCart) {
        try {
          const cartItems = JSON.parse(savedCart);
          state.items = cartItems;
          const totals = calculateCartTotals(cartItems);
          Object.assign(state, totals);
          state.isLocal = true;
        } catch (error) {
          console.error('Failed to restore cart from storage:', error);
          localStorage.removeItem('cartData');
        }
      }
    },
    
    syncCartWithServer: (state, action) => {
      const serverCart = action.payload;
      state.items = serverCart.items || [];
      const totals = calculateCartTotals(state.items);
      Object.assign(state, totals);
      state.isLocal = false;
      state.lastUpdated = new Date().toISOString();
    },
    
    clearError: (state) => {
      state.error = null;
    },

    applyDiscount: (state, action) => {
      const { discountAmount, discountType } = action.payload;
      let discount = 0;
      
      if (discountType === 'percentage') {
        discount = (state.subtotal * discountAmount) / 100;
      } else {
        discount = discountAmount;
      }
      
      state.discount = discount;
      state.total = state.subtotal + state.tax + state.shipping - discount;
    },
    
    removeDiscount: (state) => {
      state.discount = 0;
      state.total = state.subtotal + state.tax + state.shipping;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch cart cases
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.isLocal = action.payload.isLocal;
        const totals = calculateCartTotals(state.items);
        Object.assign(state, totals);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add to cart API cases
      .addCase(addToCartAPI.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCartAPI.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.isLocal) {
          // Handle local addition
          cartSlice.caseReducers.addToCart(state, { payload: action.payload.item });
        } else {
          // Handle server response
          const newItem = action.payload.item;
          const existingItemIndex = state.items.findIndex(item => item.id === newItem.id);
          
          if (existingItemIndex >= 0) {
            state.items[existingItemIndex] = newItem;
          } else {
            state.items.push(newItem);
          }
          
          const totals = calculateCartTotals(state.items);
          Object.assign(state, totals);
          state.isLocal = false;
        }
      })
      .addCase(addToCartAPI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update cart item API cases
      .addCase(updateCartItemAPI.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCartItemAPI.fulfilled, (state, action) => {
        state.isLoading = false;
        cartSlice.caseReducers.updateQuantity(state, { 
          payload: { 
            itemId: action.payload.itemId, 
            quantity: action.payload.quantity 
          } 
        });
        state.isLocal = action.payload.isLocal;
      })
      .addCase(updateCartItemAPI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Remove from cart API cases
      .addCase(removeFromCartAPI.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromCartAPI.fulfilled, (state, action) => {
        state.isLoading = false;
        cartSlice.caseReducers.removeFromCart(state, { payload: action.payload.itemId });
        state.isLocal = action.payload.isLocal;
      })
      .addCase(removeFromCartAPI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Clear cart API cases
      .addCase(clearCartAPI.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearCartAPI.fulfilled, (state, action) => {
        state.isLoading = false;
        cartSlice.caseReducers.clearCart(state);
        state.isLocal = action.payload.isLocal;
      })
      .addCase(clearCartAPI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  restoreCartFromStorage,
  syncCartWithServer,
  clearError,
  applyDiscount,
  removeDiscount,
} = cartSlice.actions;

// Selectors
export const selectCart = (state) => state.cart;
export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) => state.cart.count;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartSubtotal = (state) => state.cart.subtotal;
export const selectCartLoading = (state) => state.cart.isLoading;
export const selectCartError = (state) => state.cart.error;
export const selectIsCartLocal = (state) => state.cart.isLocal;

// Export reducer
export default cartSlice.reducer;
