import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wishlistAPI } from '../../api/endpoints';
import { apiCall } from '../../api/utils';

// Async thunks for wishlist operations
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        // Return local wishlist if not authenticated
        const localWishlist = JSON.parse(localStorage.getItem('wishlistData') || '[]');
        return { items: localWishlist, isLocal: true };
      }
      
      const result = await apiCall(wishlistAPI.getWishlist);
      if (result.success) {
        return { items: result.data.items || [], isLocal: false };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch wishlist');
    }
  }
);

export const addToWishlistAPI = createAsyncThunk(
  'wishlist/addToWishlistAPI',
  async (item, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        // Handle local wishlist addition
        return { item, isLocal: true };
      }
      
      const result = await apiCall(wishlistAPI.addToWishlist, item.id);
      if (result.success) {
        return { item, isLocal: false };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add item to wishlist');
    }
  }
);

export const removeFromWishlistAPI = createAsyncThunk(
  'wishlist/removeFromWishlistAPI',
  async (itemId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        // Handle local wishlist removal
        return { itemId, isLocal: true };
      }
      
      const result = await apiCall(wishlistAPI.removeFromWishlist, itemId);
      if (result.success) {
        return { itemId, isLocal: false };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to remove item from wishlist');
    }
  }
);

export const clearWishlistAPI = createAsyncThunk(
  'wishlist/clearWishlistAPI',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        // Handle local wishlist clearing
        return { isLocal: true };
      }
      
      const result = await apiCall(wishlistAPI.clearWishlist);
      if (result.success) {
        return { isLocal: false };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to clear wishlist');
    }
  }
);

// Helper functions
const saveWishlistToStorage = (items) => {
  localStorage.setItem('wishlistData', JSON.stringify(items));
};

// Initial state
const initialState = {
  items: [],
  count: 0,
  isLoading: false,
  error: null,
  isLocal: true, // Track if wishlist is local or synced with server
  lastUpdated: null,
};

// Wishlist slice
const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      const newItem = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.id === newItem.id);
      
      if (existingItemIndex === -1) {
        state.items.push({
          ...newItem,
          addedAt: new Date().toISOString()
        });
        state.count = state.items.length;
        state.lastUpdated = new Date().toISOString();
        
        // Save to localStorage
        if (state.isLocal) {
          saveWishlistToStorage(state.items);
        }
      }
    },
    
    removeFromWishlist: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      state.count = state.items.length;
      state.lastUpdated = new Date().toISOString();
      
      // Save to localStorage
      if (state.isLocal) {
        saveWishlistToStorage(state.items);
      }
    },
    
    clearWishlist: (state) => {
      state.items = [];
      state.count = 0;
      state.lastUpdated = new Date().toISOString();
      
      // Clear localStorage
      if (state.isLocal) {
        localStorage.removeItem('wishlistData');
      }
    },
    
    toggleWishlistItem: (state, action) => {
      const item = action.payload;
      const existingItemIndex = state.items.findIndex(existingItem => existingItem.id === item.id);
      
      if (existingItemIndex >= 0) {
        // Remove from wishlist
        state.items.splice(existingItemIndex, 1);
      } else {
        // Add to wishlist
        state.items.push({
          ...item,
          addedAt: new Date().toISOString()
        });
      }
      
      state.count = state.items.length;
      state.lastUpdated = new Date().toISOString();
      
      // Save to localStorage
      if (state.isLocal) {
        saveWishlistToStorage(state.items);
      }
    },
    
    restoreWishlistFromStorage: (state) => {
      const savedWishlist = localStorage.getItem('wishlistData');
      if (savedWishlist) {
        try {
          const wishlistItems = JSON.parse(savedWishlist);
          state.items = wishlistItems;
          state.count = wishlistItems.length;
          state.isLocal = true;
        } catch (error) {
          console.error('Failed to restore wishlist from storage:', error);
          localStorage.removeItem('wishlistData');
        }
      }
    },
    
    syncWishlistWithServer: (state, action) => {
      const serverWishlist = action.payload;
      state.items = serverWishlist.items || [];
      state.count = state.items.length;
      state.isLocal = false;
      state.lastUpdated = new Date().toISOString();
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    sortWishlist: (state, action) => {
      const sortBy = action.payload; // 'name', 'price', 'dateAdded'
      
      state.items.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'price':
            return a.price - b.price;
          case 'priceDesc':
            return b.price - a.price;
          case 'dateAdded':
            return new Date(b.addedAt) - new Date(a.addedAt);
          case 'dateAddedDesc':
            return new Date(a.addedAt) - new Date(b.addedAt);
          default:
            return 0;
        }
      });
      
      state.lastUpdated = new Date().toISOString();
      
      // Save to localStorage
      if (state.isLocal) {
        saveWishlistToStorage(state.items);
      }
    },
    
    moveToCart: (state, action) => {
      const itemId = action.payload;
      const itemIndex = state.items.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        const item = state.items[itemIndex];
        state.items.splice(itemIndex, 1);
        state.count = state.items.length;
        state.lastUpdated = new Date().toISOString();
        
        // Save to localStorage
        if (state.isLocal) {
          saveWishlistToStorage(state.items);
        }
        
        return item; // Return item to be added to cart
      }
      return null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch wishlist cases
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.count = action.payload.items.length;
        state.isLocal = action.payload.isLocal;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add to wishlist API cases
      .addCase(addToWishlistAPI.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToWishlistAPI.fulfilled, (state, action) => {
        state.isLoading = false;
        wishlistSlice.caseReducers.addToWishlist(state, { payload: action.payload.item });
        state.isLocal = action.payload.isLocal;
      })
      .addCase(addToWishlistAPI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Remove from wishlist API cases
      .addCase(removeFromWishlistAPI.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromWishlistAPI.fulfilled, (state, action) => {
        state.isLoading = false;
        wishlistSlice.caseReducers.removeFromWishlist(state, { payload: action.payload.itemId });
        state.isLocal = action.payload.isLocal;
      })
      .addCase(removeFromWishlistAPI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Clear wishlist API cases
      .addCase(clearWishlistAPI.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearWishlistAPI.fulfilled, (state, action) => {
        state.isLoading = false;
        wishlistSlice.caseReducers.clearWishlist(state);
        state.isLocal = action.payload.isLocal;
      })
      .addCase(clearWishlistAPI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  toggleWishlistItem,
  restoreWishlistFromStorage,
  syncWishlistWithServer,
  clearError,
  sortWishlist,
  moveToCart,
} = wishlistSlice.actions;

// Selectors
export const selectWishlist = (state) => state.wishlist;
export const selectWishlistItems = (state) => state.wishlist.items;
export const selectWishlistCount = (state) => state.wishlist.count;
export const selectWishlistLoading = (state) => state.wishlist.isLoading;
export const selectWishlistError = (state) => state.wishlist.error;
export const selectIsWishlistLocal = (state) => state.wishlist.isLocal;
export const isInWishlist = (state, itemId) => 
  state.wishlist.items.some(item => item.id === itemId);

// Export reducer
export default wishlistSlice.reducer;
