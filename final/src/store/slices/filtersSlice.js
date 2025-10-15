import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { filterAPI } from '../../api/endpoints';
import { monitoredRequest } from '../../utils/errorMonitor.js';

// Async thunks for filter operations
export const fetchFilters = createAsyncThunk(
  'filters/fetchFilters',
  async (_, { rejectWithValue, getState }) => {
    try {
      const requestKey = 'fetchFilters';
      
      return await monitoredRequest(requestKey, async () => {
        // Check if we already have filters in state
        const currentState = getState();
        if (currentState.filters?.items?.length > 0) {
          console.log('🔄 Using cached filters data');
          return currentState.filters.items;
        }
        
        console.log('🔍 Making fresh API call for filters');
        const response = await filterAPI.getAllFilters();
        return response.data;
      }, {
        method: 'GET',
        url: '/filters'
      });
    } catch (error) {
      return rejectWithValue(
        error.userMessage || error.response?.data?.message || 'Failed to fetch filters'
      );
    }
  }
);

export const createFilter = createAsyncThunk(
  'filters/createFilter',
  async (filterData, { rejectWithValue }) => {
    try {
      console.log('Creating filter with data:', filterData);
      console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
      const response = await filterAPI.createFilter(filterData);
      console.log('Filter created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Filter creation error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Request config:', error.config);
      return rejectWithValue(
        error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create filter'
      );
    }
  }
);

export const updateFilter = createAsyncThunk(
  'filters/updateFilter',
  async ({ filterId, filterData }, { rejectWithValue }) => {
    try {
      const response = await filterAPI.updateFilter(filterId, filterData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update filter'
      );
    }
  }
);

export const deleteFilter = createAsyncThunk(
  'filters/deleteFilter',
  async (filterId, { rejectWithValue }) => {
    try {
      await filterAPI.deleteFilter(filterId);
      return filterId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete filter'
      );
    }
  }
);

export const applyFilters = createAsyncThunk(
  'filters/applyFilters',
  async (filterCriteria, { rejectWithValue }) => {
    try {
      const response = await filterAPI.applyFilters(filterCriteria);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to apply filters'
      );
    }
  }
);

// Initial state
const initialState = {
  // Available filters from backend
  availableFilters: [],
  
  // Currently applied filters
  appliedFilters: {
    color: [],
    size: [],
    price: { min: 0, max: 100000 },
    category: [],
    subcategory: [],
    sortBy: 'newest', // newest, price-asc, price-desc, popularity
    inStock: true
  },
  
  // Filter UI state
  activeFilterPanel: null, // 'color', 'size', 'price', etc.
  priceRange: { min: 0, max: 100000 },
  
  // Loading and error states
  loading: false,
  error: null,
  
  // Filter results
  filteredProducts: [],
  totalResults: 0,
  
  // Zara-style filter management
  filterHistory: [],
  recentFilters: [],
  savedFilterSets: [],
  
  // Quick filters
  quickFilters: [
    { id: 'new-arrivals', label: 'New Arrivals', active: false },
    { id: 'sale', label: 'Sale', active: false },
    { id: 'trending', label: 'Trending', active: false },
    { id: 'bestsellers', label: 'Bestsellers', active: false }
  ]
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    // Filter application actions
    setColorFilter: (state, action) => {
      const color = action.payload;
      if (state.appliedFilters.color.includes(color)) {
        state.appliedFilters.color = state.appliedFilters.color.filter(c => c !== color);
      } else {
        state.appliedFilters.color.push(color);
      }
    },
    
    setSizeFilter: (state, action) => {
      const size = action.payload;
      if (state.appliedFilters.size.includes(size)) {
        state.appliedFilters.size = state.appliedFilters.size.filter(s => s !== size);
      } else {
        state.appliedFilters.size.push(size);
      }
    },
    
    setBrandFilter: (state, action) => {
      const brand = action.payload;
      if (state.appliedFilters.brand.includes(brand)) {
        state.appliedFilters.brand = state.appliedFilters.brand.filter(b => b !== brand);
      } else {
        state.appliedFilters.brand.push(brand);
      }
    },
    
    setPriceRange: (state, action) => {
      state.appliedFilters.price = action.payload;
    },
    
    setSortBy: (state, action) => {
      state.appliedFilters.sortBy = action.payload;
    },
    
    setCategoryFilter: (state, action) => {
      state.appliedFilters.category = [action.payload];
      // Clear subcategory when category changes
      state.appliedFilters.subcategory = [];
    },
    
    setSubcategoryFilter: (state, action) => {
      state.appliedFilters.subcategory = [action.payload];
    },
    
    // UI state actions
    setActiveFilterPanel: (state, action) => {
      state.activeFilterPanel = action.payload;
    },
    
    toggleQuickFilter: (state, action) => {
      const filterId = action.payload;
      const filter = state.quickFilters.find(f => f.id === filterId);
      if (filter) {
        filter.active = !filter.active;
      }
    },
    
    // Clear actions
    clearAllFilters: (state) => {
      state.appliedFilters = {
        color: [],
        size: [],
        price: { min: 0, max: 100000 },
        category: [],
        subcategory: [],
        sortBy: 'newest',
        inStock: true
      };
      state.quickFilters.forEach(filter => {
        filter.active = false;
      });
    },
    
    clearColorFilters: (state) => {
      state.appliedFilters.color = [];
    },
    
    clearSizeFilters: (state) => {
      state.appliedFilters.size = [];
    },
    
    clearBrandFilters: (state) => {
      state.appliedFilters.brand = [];
    },
    
    // Filter history and management
    addToFilterHistory: (state, action) => {
      state.filterHistory.push({
        timestamp: Date.now(),
        filters: { ...state.appliedFilters }
      });
      // Keep only last 10 entries
      if (state.filterHistory.length > 10) {
        state.filterHistory.shift();
      }
    },
    
    saveFilterSet: (state, action) => {
      const { name, filters } = action.payload;
      state.savedFilterSets.push({
        id: Date.now(),
        name,
        filters: { ...filters }
      });
    },
    
    loadFilterSet: (state, action) => {
      const filterSet = state.savedFilterSets.find(set => set.id === action.payload);
      if (filterSet) {
        state.appliedFilters = { ...filterSet.filters };
      }
    },
    
    removeFilterSet: (state, action) => {
      state.savedFilterSets = state.savedFilterSets.filter(set => set.id !== action.payload);
    },
    
    // Error handling
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    // Fetch filters
    builder
      .addCase(fetchFilters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFilters.fulfilled, (state, action) => {
        state.loading = false;
        state.availableFilters = action.payload;
        // Set price range based on available data
        const priceFilter = action.payload.find(f => f.key === 'price');
        if (priceFilter && priceFilter.values.length > 0) {
          const prices = priceFilter.values.map(v => parseFloat(v.name));
          state.priceRange = {
            min: Math.min(...prices),
            max: Math.max(...prices)
          };
        }
      })
      .addCase(fetchFilters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    
    // Create filter
    builder
      .addCase(createFilter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFilter.fulfilled, (state, action) => {
        state.loading = false;
        state.availableFilters.push(action.payload);
      })
      .addCase(createFilter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    
    // Update filter
    builder
      .addCase(updateFilter.fulfilled, (state, action) => {
        const index = state.availableFilters.findIndex(f => f._id === action.payload._id);
        if (index !== -1) {
          state.availableFilters[index] = action.payload;
        }
      });
    
    // Delete filter
    builder
      .addCase(deleteFilter.fulfilled, (state, action) => {
        state.availableFilters = state.availableFilters.filter(f => f._id !== action.payload);
      });
    
    // Apply filters
    builder
      .addCase(applyFilters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyFilters.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredProducts = action.payload.products || [];
        state.totalResults = action.payload.total || 0;
      })
      .addCase(applyFilters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
  setColorFilter,
  setSizeFilter,
  setBrandFilter,
  setPriceRange,
  setSortBy,
  setCategoryFilter,
  setSubcategoryFilter,
  setActiveFilterPanel,
  toggleQuickFilter,
  clearAllFilters,
  clearColorFilters,
  clearSizeFilters,
  clearBrandFilters,
  addToFilterHistory,
  saveFilterSet,
  loadFilterSet,
  removeFilterSet,
  clearError
} = filtersSlice.actions;

// Selectors
export const selectFilters = (state) => state.filters;
export const selectAppliedFilters = (state) => state.filters.appliedFilters;
export const selectAvailableFilters = (state) => state.filters.availableFilters;
export const selectFilterLoading = (state) => state.filters.loading;
export const selectFilterError = (state) => state.filters.error;
export const selectFilteredProducts = (state) => state.filters.filteredProducts;
export const selectTotalResults = (state) => state.filters.totalResults;
export const selectQuickFilters = (state) => state.filters.quickFilters;
export const selectSavedFilterSets = (state) => state.filters.savedFilterSets;

// Complex selectors
export const selectActiveFiltersCount = (state) => {
  const filters = state.filters.appliedFilters;
  let count = 0;
  
  count += filters.color.length;
  count += filters.size.length;
  count += filters.brand.length;
  count += filters.category.length;
  count += filters.subcategory.length;
  
  // Count price filter if not default range
  if (filters.price.min > 0 || filters.price.max < 100000) {
    count += 1;
  }
  
  // Count quick filters
  count += state.filters.quickFilters.filter(f => f.active).length;
  
  return count;
};

export const selectFiltersByKey = (state, key) => {
  return state.filters.availableFilters.find(f => f.key === key);
};

export default filtersSlice.reducer;
