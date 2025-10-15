import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { saveForLaterAPI } from '../../api/endpoints';
import { apiCall } from '../../api/utils';

// Async thunks for save for later operations
export const fetchSaveForLater = createAsyncThunk(
  'saveForLater/fetchSaveForLater',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        // Return local save for later list if not authenticated
        const localSaveForLater = JSON.parse(localStorage.getItem('saveForLaterData') || '[]');
        return { items: localSaveForLater, isLocal: true };
      }
      
      const result = await apiCall(saveForLaterAPI.getSaveForLater);
      if (result.success) {
        return { items: result.data.items || [], isLocal: false };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch save for later items');
    }
  }
);

export const addToSaveForLaterAPI = createAsyncThunk(
  'saveForLater/addToSaveForLaterAPI',
  async (item, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        // Handle local save for later addition
        return { item, isLocal: true };
      }
      
      const result = await apiCall(saveForLaterAPI.addToSaveForLater, item.id);
      if (result.success) {
        return { item, isLocal: false };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add item to save for later');
    }
  }
);

export const removeFromSaveForLaterAPI = createAsyncThunk(
  'saveForLater/removeFromSaveForLaterAPI',
  async (itemId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        // Handle local save for later removal
        return { itemId, isLocal: true };
      }
      
      const result = await apiCall(saveForLaterAPI.removeFromSaveForLater, itemId);
      if (result.success) {
        return { itemId, isLocal: false };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to remove item from save for later');
    }
  }
);

export const clearSaveForLaterAPI = createAsyncThunk(
  'saveForLater/clearSaveForLaterAPI',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        // Handle local save for later clearing
        return { isLocal: true };
      }
      
      const result = await apiCall(saveForLaterAPI.clearSaveForLater);
      if (result.success) {
        return { isLocal: false };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to clear save for later');
    }
  }
);

export const moveToCartFromSaveForLater = createAsyncThunk(
  'saveForLater/moveToCartFromSaveForLater',
  async ({ itemId, cartData }, { rejectWithValue, getState, dispatch }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        // Handle local transfer
        return { itemId, isLocal: true };
      }
      
      const result = await apiCall(saveForLaterAPI.moveToCart, { itemId, ...cartData });
      if (result.success) {
        // Also remove from save for later after successful move
        await dispatch(removeFromSaveForLaterAPI(itemId));
        return { itemId, isLocal: false };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to move item to cart');
    }
  }
);

export const moveToWishlistFromSaveForLater = createAsyncThunk(
  'saveForLater/moveToWishlistFromSaveForLater',
  async (itemId, { rejectWithValue, getState, dispatch }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        // Handle local transfer
        return { itemId, isLocal: true };
      }
      
      const result = await apiCall(saveForLaterAPI.moveToWishlist, itemId);
      if (result.success) {
        // Also remove from save for later after successful move
        await dispatch(removeFromSaveForLaterAPI(itemId));
        return { itemId, isLocal: false };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to move item to wishlist');
    }
  }
);

// Helper functions
const saveSaveForLaterToStorage = (items) => {
  localStorage.setItem('saveForLaterData', JSON.stringify(items));
};

// Initial state
const initialState = {
  items: [],
  count: 0,
  isLoading: false,
  error: null,
  isLocal: true, // Track if save for later is local or synced with server
  lastUpdated: null,
  sortBy: 'dateAdded', // Default sorting
  filters: {
    category: null,
    priceRange: { min: 0, max: 10000 },
  },
};

// Save For Later slice
const saveForLaterSlice = createSlice({
  name: 'saveForLater',
  initialState,
  reducers: {
    addToSaveForLater: (state, action) => {
      const newItem = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.id === newItem.id);
      
      if (existingItemIndex === -1) {
        state.items.push({
          ...newItem,
          savedAt: new Date().toISOString(),
          note: '', // Users can add notes about why they saved it
        });
        state.count = state.items.length;
        state.lastUpdated = new Date().toISOString();
        
        // Save to localStorage
        if (state.isLocal) {
          saveSaveForLaterToStorage(state.items);
        }
      }
    },
    
    removeFromSaveForLater: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      state.count = state.items.length;
      state.lastUpdated = new Date().toISOString();
      
      // Save to localStorage
      if (state.isLocal) {
        saveSaveForLaterToStorage(state.items);
      }
    },
    
    clearSaveForLater: (state) => {
      state.items = [];
      state.count = 0;
      state.lastUpdated = new Date().toISOString();
      
      // Clear localStorage
      if (state.isLocal) {
        localStorage.removeItem('saveForLaterData');
      }
    },
    
    toggleSaveForLaterItem: (state, action) => {
      const item = action.payload;
      const existingItemIndex = state.items.findIndex(existingItem => existingItem.id === item.id);
      
      if (existingItemIndex >= 0) {
        // Remove from save for later
        state.items.splice(existingItemIndex, 1);
      } else {
        // Add to save for later
        state.items.push({
          ...item,
          savedAt: new Date().toISOString(),
          note: '',
        });
      }
      
      state.count = state.items.length;
      state.lastUpdated = new Date().toISOString();
      
      // Save to localStorage
      if (state.isLocal) {
        saveSaveForLaterToStorage(state.items);
      }
    },
    
    updateSaveForLaterNote: (state, action) => {
      const { itemId, note } = action.payload;
      const itemIndex = state.items.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        state.items[itemIndex].note = note;
        state.lastUpdated = new Date().toISOString();
        
        // Save to localStorage
        if (state.isLocal) {
          saveSaveForLaterToStorage(state.items);
        }
      }
    },
    
    restoreSaveForLaterFromStorage: (state) => {
      const saved = localStorage.getItem('saveForLaterData');
      if (saved) {
        try {
          state.items = JSON.parse(saved);
          state.count = state.items.length;
        } catch (error) {
          console.error('Failed to restore save for later from storage:', error);
          localStorage.removeItem('saveForLaterData');
        }
      }
    },
    
    syncSaveForLaterWithServer: (state, action) => {
      // Sync local save for later with server when user logs in
      state.items = action.payload.items || [];
      state.count = state.items.length;
      state.isLocal = false;
      state.lastUpdated = new Date().toISOString();
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    sortSaveForLater: (state, action) => {
      const sortBy = action.payload;
      state.sortBy = sortBy;
      
      state.items.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'price':
            return a.price - b.price;
          case 'priceDesc':
            return b.price - a.price;
          case 'dateSaved':
            return new Date(b.savedAt) - new Date(a.savedAt);
          case 'dateSavedDesc':
            return new Date(a.savedAt) - new Date(b.savedAt);
          case 'category':
            return a.category.localeCompare(b.category);
          default:
            return 0;
        }
      });
      
      state.lastUpdated = new Date().toISOString();
      
      // Save to localStorage
      if (state.isLocal) {
        saveSaveForLaterToStorage(state.items);
      }
    },
    
    setSaveForLaterFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearSaveForLaterFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    moveFromSaveForLaterToCart: (state, action) => {
      const itemId = action.payload;
      const itemIndex = state.items.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        const item = state.items[itemIndex];
        state.items.splice(itemIndex, 1);
        state.count = state.items.length;
        state.lastUpdated = new Date().toISOString();
        
        // Save to localStorage
        if (state.isLocal) {
          saveSaveForLaterToStorage(state.items);
        }
        
        return item; // Return item to be added to cart
      }
      return null;
    },
    
    moveFromSaveForLaterToWishlist: (state, action) => {
      const itemId = action.payload;
      const itemIndex = state.items.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        const item = state.items[itemIndex];
        state.items.splice(itemIndex, 1);
        state.count = state.items.length;
        state.lastUpdated = new Date().toISOString();
        
        // Save to localStorage
        if (state.isLocal) {
          saveSaveForLaterToStorage(state.items);
        }
        
        return item; // Return item to be added to wishlist
      }
      return null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch save for later cases
      .addCase(fetchSaveForLater.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSaveForLater.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.count = action.payload.items.length;
        state.isLocal = action.payload.isLocal;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchSaveForLater.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add to save for later API cases
      .addCase(addToSaveForLaterAPI.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToSaveForLaterAPI.fulfilled, (state, action) => {
        state.isLoading = false;
        saveForLaterSlice.caseReducers.addToSaveForLater(state, { payload: action.payload.item });
        state.isLocal = action.payload.isLocal;
      })
      .addCase(addToSaveForLaterAPI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Remove from save for later API cases
      .addCase(removeFromSaveForLaterAPI.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromSaveForLaterAPI.fulfilled, (state, action) => {
        state.isLoading = false;
        saveForLaterSlice.caseReducers.removeFromSaveForLater(state, { payload: action.payload.itemId });
        state.isLocal = action.payload.isLocal;
      })
      .addCase(removeFromSaveForLaterAPI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Clear save for later API cases
      .addCase(clearSaveForLaterAPI.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearSaveForLaterAPI.fulfilled, (state, action) => {
        state.isLoading = false;
        saveForLaterSlice.caseReducers.clearSaveForLater(state);
        state.isLocal = action.payload.isLocal;
      })
      .addCase(clearSaveForLaterAPI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Move to cart cases
      .addCase(moveToCartFromSaveForLater.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(moveToCartFromSaveForLater.fulfilled, (state, action) => {
        state.isLoading = false;
        // Item is already removed by the removeFromSaveForLaterAPI call
      })
      .addCase(moveToCartFromSaveForLater.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Move to wishlist cases
      .addCase(moveToWishlistFromSaveForLater.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(moveToWishlistFromSaveForLater.fulfilled, (state, action) => {
        state.isLoading = false;
        // Item is already removed by the removeFromSaveForLaterAPI call
      })
      .addCase(moveToWishlistFromSaveForLater.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  addToSaveForLater,
  removeFromSaveForLater,
  clearSaveForLater,
  toggleSaveForLaterItem,
  updateSaveForLaterNote,
  restoreSaveForLaterFromStorage,
  syncSaveForLaterWithServer,
  clearError,
  sortSaveForLater,
  setSaveForLaterFilters,
  clearSaveForLaterFilters,
  moveFromSaveForLaterToCart,
  moveFromSaveForLaterToWishlist,
} = saveForLaterSlice.actions;

// Selectors
export const selectSaveForLater = (state) => state.saveForLater;
export const selectSaveForLaterItems = (state) => state.saveForLater.items;
export const selectSaveForLaterCount = (state) => state.saveForLater.count;
export const selectSaveForLaterLoading = (state) => state.saveForLater.isLoading;
export const selectSaveForLaterError = (state) => state.saveForLater.error;
export const selectIsSaveForLaterLocal = (state) => state.saveForLater.isLocal;
export const selectSaveForLaterSortBy = (state) => state.saveForLater.sortBy;
export const selectSaveForLaterFilters = (state) => state.saveForLater.filters;
export const isInSaveForLater = (state, itemId) => 
  state.saveForLater.items.some(item => item.id === itemId);

// Filtered and sorted selectors
export const selectFilteredSaveForLaterItems = (state) => {
  const { items, filters } = state.saveForLater;
  
  return items.filter(item => {
    // Category filter
    if (filters.category && item.category !== filters.category) {
      return false;
    }
    
    // Price range filter
    if (item.price < filters.priceRange.min || item.price > filters.priceRange.max) {
      return false;
    }
    
    return true;
  });
};

// Export reducer
export default saveForLaterSlice.reducer;
