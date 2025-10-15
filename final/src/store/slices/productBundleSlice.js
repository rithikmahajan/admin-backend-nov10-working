import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axiosConfig';

// ==============================
// ASYNC THUNKS (API CALLS)
// ==============================

// Get all product bundles with filtering and pagination
export const getAllProductBundles = createAsyncThunk(
  'productBundle/getAllProductBundles',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/items/bundles', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch product bundles'
      );
    }
  }
);

// Create a new product bundle
export const createProductBundle = createAsyncThunk(
  'productBundle/createProductBundle',
  async (bundleData, { rejectWithValue }) => {
    try {
      const response = await API.post('/items/bundles', bundleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create product bundle'
      );
    }
  }
);

// Get a specific product bundle by ID
export const getProductBundleById = createAsyncThunk(
  'productBundle/getProductBundleById',
  async (bundleId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/items/bundles/${bundleId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch product bundle'
      );
    }
  }
);

// Update a product bundle
export const updateProductBundle = createAsyncThunk(
  'productBundle/updateProductBundle',
  async ({ bundleId, bundleData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/items/bundles/${bundleId}`, bundleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update product bundle'
      );
    }
  }
);

// Delete a product bundle
export const deleteProductBundle = createAsyncThunk(
  'productBundle/deleteProductBundle',
  async (bundleId, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/items/bundles/${bundleId}`);
      return { bundleId, response: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete product bundle'
      );
    }
  }
);

// Toggle bundle active status
export const toggleBundleStatus = createAsyncThunk(
  'productBundle/toggleBundleStatus',
  async ({ bundleId, updatedBy }, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/items/bundles/${bundleId}/toggle-status`, { updatedBy });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to toggle bundle status'
      );
    }
  }
);

// Update bundle items order (drag & drop)
export const updateBundleItemsOrder = createAsyncThunk(
  'productBundle/updateBundleItemsOrder',
  async ({ bundleId, bundleItems, updatedBy }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/items/bundles/${bundleId}/reorder`, { bundleItems, updatedBy });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update bundle items order'
      );
    }
  }
);

// Get items available for bundling (legacy - keeping for compatibility)
export const getItemsForBundling = createAsyncThunk(
  'productBundle/getItemsForBundling',
  async (params = {}, { rejectWithValue }) => {
    try {
      console.log('🔍 getItemsForBundling called with params:', params);
      const response = await API.get('/items/bundles/items', { params });
      console.log('🔍 getItemsForBundling response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getItemsForBundling error:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch items for bundling'
      );
    }
  }
);

// Get subcategories by category ID
export const getSubCategoriesByCategory = createAsyncThunk(
  'productBundle/getSubCategoriesByCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/subcategories/category/${categoryId}`);
      return { categoryId, data: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch subcategories'
      );
    }
  }
);

// Get items by subcategory ID  
export const getItemsBySubCategory = createAsyncThunk(
  'productBundle/getItemsBySubCategory',
  async (subCategoryId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/items/subcategory/${subCategoryId}`);
      return { subCategoryId, data: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch items'
      );
    }
  }
);

// Get categories and subcategories for bundling
export const getCategoriesForBundling = createAsyncThunk(
  'productBundle/getCategoriesForBundling',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/items/bundles/categories');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch categories for bundling'
      );
    }
  }
);

// Get bundles for a specific product (public route)
export const getBundlesForProduct = createAsyncThunk(
  'productBundle/getBundlesForProduct',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/items/${itemId}/bundles`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch bundles for product'
      );
    }
  }
);

// ==============================
// INITIAL STATE
// ==============================

const initialState = {
  // Bundle lists
  bundles: [],
  currentBundle: null,
  bundlesForProduct: [],
  
  // Items and categories for bundling
  availableItems: [],
  categories: [],
  subcategories: [],
  
  // Organized data by parent ID for efficient lookups
  subcategoriesByCategory: {}, // categoryId -> subcategories[]
  itemsBySubCategory: {}, // subCategoryId -> items[]
  
  // Pagination
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalBundles: 0,
    hasNextPage: false,
    hasPrevPage: false
  },
  
  itemsPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  },
  
  // Loading states
  loading: false,
  bundlesLoading: false,
  itemsLoading: false,
  categoriesLoading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  
  // Error states
  error: null,
  bundlesError: null,
  itemsError: null,
  categoriesError: null,
  
  // UI states
  selectedItems: [], // Items selected for bundling
  draggedItems: [], // Items being dragged in the bundle preview
  
  // Filters
  filters: {
    isActive: null,
    categoryId: '',
    subCategoryId: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  
  itemFilters: {
    categoryId: '',
    subCategoryId: '',
    search: '',
    excludeItemIds: []
  }
};

// ==============================
// SLICE DEFINITION
// ==============================

const productBundleSlice = createSlice({
  name: 'productBundle',
  initialState,
  reducers: {
    // Clear errors
    clearError: (state) => {
      state.error = null;
      state.bundlesError = null;
      state.itemsError = null;
      state.categoriesError = null;
    },
    
    // Clear current bundle
    clearCurrentBundle: (state) => {
      state.currentBundle = null;
    },
    
    // Update filters
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Update item filters
    updateItemFilters: (state, action) => {
      state.itemFilters = { ...state.itemFilters, ...action.payload };
    },
    
    // Select/deselect items for bundling
    toggleItemSelection: (state, action) => {
      const itemId = action.payload;
      const index = state.selectedItems.findIndex(item => item._id === itemId);
      
      if (index >= 0) {
        state.selectedItems.splice(index, 1);
      } else {
        const item = state.availableItems.find(item => item._id === itemId);
        if (item) {
          state.selectedItems.push(item);
        }
      }
    },
    
    // Clear selected items
    clearSelectedItems: (state) => {
      state.selectedItems = [];
    },
    
    // Update dragged items (for bundle preview)
    updateDraggedItems: (state, action) => {
      state.draggedItems = action.payload;
    },
    
    // Remove item from selection
    removeSelectedItem: (state, action) => {
      const itemId = action.payload;
      state.selectedItems = state.selectedItems.filter(item => item._id !== itemId);
    },
    
    // Update bundle in list (optimistic update)
    updateBundleInList: (state, action) => {
      const updatedBundle = action.payload;
      const index = state.bundles.findIndex(bundle => bundle._id === updatedBundle._id);
      if (index >= 0) {
        state.bundles[index] = updatedBundle;
      }
    },
    
    // Remove bundle from list (optimistic update)
    removeBundleFromList: (state, action) => {
      const bundleId = action.payload;
      state.bundles = state.bundles.filter(bundle => bundle._id !== bundleId);
      state.pagination.totalBundles = Math.max(0, state.pagination.totalBundles - 1);
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Get all product bundles
      .addCase(getAllProductBundles.pending, (state) => {
        state.bundlesLoading = true;
        state.bundlesError = null;
      })
      .addCase(getAllProductBundles.fulfilled, (state, action) => {
        state.bundlesLoading = false;
        if (action.payload.success) {
          state.bundles = action.payload.data.bundles;
          state.pagination = action.payload.data.pagination;
        }
      })
      .addCase(getAllProductBundles.rejected, (state, action) => {
        state.bundlesLoading = false;
        state.bundlesError = action.payload;
      })
      
      // Create product bundle
      .addCase(createProductBundle.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createProductBundle.fulfilled, (state, action) => {
        state.createLoading = false;
        if (action.payload.success) {
          state.bundles.unshift(action.payload.data);
          state.pagination.totalBundles += 1;
        }
      })
      .addCase(createProductBundle.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      
      // Get product bundle by ID
      .addCase(getProductBundleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductBundleById.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.currentBundle = action.payload.data;
        }
      })
      .addCase(getProductBundleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update product bundle
      .addCase(updateProductBundle.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateProductBundle.fulfilled, (state, action) => {
        state.updateLoading = false;
        if (action.payload.success) {
          state.currentBundle = action.payload.data;
          // Update in bundles list if present
          const index = state.bundles.findIndex(bundle => bundle._id === action.payload.data._id);
          if (index >= 0) {
            state.bundles[index] = action.payload.data;
          }
        }
      })
      .addCase(updateProductBundle.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })
      
      // Delete product bundle
      .addCase(deleteProductBundle.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteProductBundle.fulfilled, (state, action) => {
        state.deleteLoading = false;
        if (action.payload.response.success) {
          // Remove from bundles list
          state.bundles = state.bundles.filter(bundle => bundle._id !== action.payload.bundleId);
          state.pagination.totalBundles = Math.max(0, state.pagination.totalBundles - 1);
          // Clear current bundle if it was deleted
          if (state.currentBundle && state.currentBundle._id === action.payload.bundleId) {
            state.currentBundle = null;
          }
        }
      })
      .addCase(deleteProductBundle.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })
      
      // Toggle bundle status
      .addCase(toggleBundleStatus.fulfilled, (state, action) => {
        if (action.payload.success) {
          const updatedBundle = action.payload.data;
          // Update in bundles list
          const index = state.bundles.findIndex(bundle => bundle._id === updatedBundle._id);
          if (index >= 0) {
            state.bundles[index] = updatedBundle;
          }
          // Update current bundle
          if (state.currentBundle && state.currentBundle._id === updatedBundle._id) {
            state.currentBundle = updatedBundle;
          }
        }
      })
      
      // Update bundle items order
      .addCase(updateBundleItemsOrder.fulfilled, (state, action) => {
        if (action.payload.success) {
          const updatedBundle = action.payload.data;
          // Update current bundle
          if (state.currentBundle && state.currentBundle._id === updatedBundle._id) {
            state.currentBundle = updatedBundle;
          }
          // Update in bundles list
          const index = state.bundles.findIndex(bundle => bundle._id === updatedBundle._id);
          if (index >= 0) {
            state.bundles[index] = updatedBundle;
          }
        }
      })
      
      // Get items for bundling
      .addCase(getItemsForBundling.pending, (state) => {
        state.itemsLoading = true;
        state.itemsError = null;
      })
      .addCase(getItemsForBundling.fulfilled, (state, action) => {
        state.itemsLoading = false;
        if (action.payload.success) {
          state.availableItems = action.payload.data.items;
          state.itemsPagination = action.payload.data.pagination;
        }
      })
      .addCase(getItemsForBundling.rejected, (state, action) => {
        state.itemsLoading = false;
        state.itemsError = action.payload;
      })

      // Get subcategories by category
      .addCase(getSubCategoriesByCategory.pending, (state) => {
        state.categoriesLoading = true;
      })
      .addCase(getSubCategoriesByCategory.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        // Store subcategories for the specific category
        state.subcategoriesByCategory = state.subcategoriesByCategory || {};
        state.subcategoriesByCategory[action.payload.categoryId] = action.payload.data.data || [];
      })
      .addCase(getSubCategoriesByCategory.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.payload;
      })

      // Get items by subcategory
      .addCase(getItemsBySubCategory.pending, (state) => {
        state.itemsLoading = true;
      })
      .addCase(getItemsBySubCategory.fulfilled, (state, action) => {
        state.itemsLoading = false;
        // Store items for the specific subcategory
        state.itemsBySubCategory = state.itemsBySubCategory || {};
        state.itemsBySubCategory[action.payload.subCategoryId] = action.payload.data.data || [];
      })
      .addCase(getItemsBySubCategory.rejected, (state, action) => {
        state.itemsLoading = false;
        state.itemsError = action.payload;
      })
      
      // Get categories for bundling
      .addCase(getCategoriesForBundling.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(getCategoriesForBundling.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        if (action.payload.success) {
          state.categories = action.payload.data.categories;
          state.subcategories = action.payload.data.subcategories;
        }
      })
      .addCase(getCategoriesForBundling.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.payload;
      })
      
      // Get bundles for product
      .addCase(getBundlesForProduct.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.bundlesForProduct = action.payload.data;
        }
      });
  }
});

// ==============================
// EXPORT ACTIONS AND REDUCER
// ==============================

export const {
  clearError,
  clearCurrentBundle,
  updateFilters,
  updateItemFilters,
  toggleItemSelection,
  clearSelectedItems,
  updateDraggedItems,
  removeSelectedItem,
  updateBundleInList,
  removeBundleFromList
} = productBundleSlice.actions;

export default productBundleSlice.reducer;
