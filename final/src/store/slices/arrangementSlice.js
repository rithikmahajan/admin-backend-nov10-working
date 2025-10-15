import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiCall } from '../../api/utils';
import API from '../../api/axiosConfig';

// ========================================
// ASYNC THUNKS FOR ARRANGEMENT CONTROL
// ========================================

// Fetch categories with subcategories for arrangement
export const fetchCategoriesForArrangement = createAsyncThunk(
  'arrangement/fetchCategoriesForArrangement',
  async (_, { rejectWithValue }) => {
    try {
      // First get all categories
      const categoriesResponse = await API.get('/categories');
      if (!categoriesResponse.data?.success) {
        return rejectWithValue('Failed to fetch categories');
      }
      
      const categories = categoriesResponse.data.data || [];
      
      // For each category, get its subcategories and items count
      const categoriesWithData = await Promise.all(
        categories.map(async (category) => {
          try {
            // Get subcategories for this category
            const subcategoriesResponse = await API.get(`/subcategories/category/${category._id}`);
            const subcategories = subcategoriesResponse.data?.success ? subcategoriesResponse.data.data : [];
            
            // Get items count for this category (from items that have this categoryId)
            const itemsResponse = await API.get('/items');
            const allItems = itemsResponse.data?.success ? itemsResponse.data.data : [];
            const itemCount = allItems.filter(item => item.categoryId === category._id).length;
            
            return {
              ...category,
              subcategories: subcategories || [],
              itemCount: itemCount || 0
            };
          } catch (error) {
            console.error(`Error fetching data for category ${category.name}:`, error);
            return {
              ...category,
              subcategories: [],
              itemCount: 0
            };
          }
        })
      );
      
      // Sort by displayOrder if available, otherwise by creation date
      const sortedCategories = categoriesWithData.sort((a, b) => {
        if (a.displayOrder && b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      
      return sortedCategories;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch categories');
    }
  }
);

// Fetch items for arrangement by category/subcategory
export const fetchItemsForArrangement = createAsyncThunk(
  'arrangement/fetchItemsForArrangement',
  async ({ categoryId, subCategoryId }, { rejectWithValue }) => {
    try {
      console.log('🔄 fetchItemsForArrangement called with:', { categoryId, subCategoryId });
      
      if (!categoryId || categoryId === 'all') {
        console.log('⚠️ No categoryId provided, returning empty array');
        return {
          items: [],
          categoryId,
          subCategoryId
        };
      }
      
      // Use the new items arrangement API endpoint
      let url = `/items/items-arrangement?categoryId=${categoryId}`;
      if (subCategoryId && subCategoryId !== 'all') {
        url += `&subCategoryId=${subCategoryId}`;
      }
      
      console.log('🔍 Fetching from URL:', url);
      const response = await API.get(url);
      
      console.log('📦 API Response:', response.data);
      
      if (!response.data?.success) {
        console.error('❌ API returned error:', response.data);
        return rejectWithValue(response.data?.message || 'Failed to fetch items');
      }
      
      const items = response.data.data || [];
      console.log(`✅ Retrieved ${items.length} items for arrangement`);
      
      // Items are already sorted by the backend, but let's ensure consistency
      const sortedItems = items.sort((a, b) => {
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
          return a.displayOrder - b.displayOrder;
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      
      return {
        items: sortedItems,
        categoryId,
        subCategoryId
      };
    } catch (error) {
      console.error('❌ Error in fetchItemsForArrangement:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch items');
    }
  }
);

// Update items display order
export const updateItemsDisplayOrder = createAsyncThunk(
  'arrangement/updateItemsDisplayOrder',
  async (items, { rejectWithValue }) => {
    try {
      const response = await API.put('/items/items-display-order', { items });
      if (response.data?.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data?.message || 'Failed to update items order');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update items order');
    }
  }
);

// Update categories display order
export const updateCategoriesDisplayOrder = createAsyncThunk(
  'arrangement/updateCategoriesDisplayOrder',
  async (categories, { rejectWithValue }) => {
    try {
      const response = await API.put('/items/categories-display-order', { categories });
      if (response.data?.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data?.message || 'Failed to update categories order');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update categories order');
    }
  }
);

// Fetch subcategories for arrangement by category
export const fetchSubCategoriesForArrangement = createAsyncThunk(
  'arrangement/fetchSubCategoriesForArrangement',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/subcategories/category/${categoryId}`);
      if (response.data?.success) {
        const subcategories = response.data.data || [];
        
        // Sort by displayOrder if available, otherwise by creation date
        const sortedSubCategories = subcategories.sort((a, b) => {
          if (a.displayOrder && b.displayOrder) {
            return a.displayOrder - b.displayOrder;
          }
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        
        return {
          subcategories: sortedSubCategories,
          categoryId
        };
      } else {
        return rejectWithValue(response.data?.message || 'Failed to fetch subcategories');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch subcategories');
    }
  }
);

// Update subcategories display order
export const updateSubCategoriesDisplayOrder = createAsyncThunk(
  'arrangement/updateSubCategoriesDisplayOrder',
  async (subcategories, { rejectWithValue }) => {
    try {
      const response = await API.put('/items/subcategories-display-order', { subcategories });
      if (response.data?.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data?.message || 'Failed to update subcategories order');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update subcategories order');
    }
  }
);

// ========================================
// ARRANGEMENT SLICE
// ========================================

const initialState = {
  // Categories data
  categories: [],
  selectedCategory: null,
  selectedSubCategory: null,
  
  // Subcategories data
  subcategories: [],
  originalSubCategories: [],
  
  // Items data
  items: [],
  originalItems: [], // Store original order for reset functionality
  
  // UI state
  currentArrangementType: 'items', // 'items', 'categories', 'subcategories'
  viewMode: 'arrangement', // 'arrangement', 'preview'
  
  // Loading states
  loading: {
    categories: false,
    subcategories: false,
    items: false,
    updating: false
  },
  
  // Error states
  error: {
    categories: null,
    subcategories: null,
    items: null,
    updating: null
  },
  
  // Success states
  success: {
    updating: false
  }
};

const arrangementSlice = createSlice({
  name: 'arrangement',
  initialState,
  reducers: {
    // Set selected category and subcategory
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
      state.selectedSubCategory = null; // Reset subcategory when category changes
      state.subcategories = []; // Clear subcategories when category changes
      state.items = []; // Clear items when category changes
    },
    
    setSelectedSubCategory: (state, action) => {
      state.selectedSubCategory = action.payload;
      state.items = []; // Clear items when subcategory changes
    },
    
    // Set arrangement type (items, categories, subcategories)
    setArrangementType: (state, action) => {
      state.currentArrangementType = action.payload;
    },
    
    // Set view mode
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    
    // Update items order locally (for drag and drop preview)
    updateItemsOrderLocally: (state, action) => {
      state.items = action.payload;
    },
    
    // Update categories order locally
    updateCategoriesOrderLocally: (state, action) => {
      state.categories = action.payload;
    },
    
    // Update subcategories order locally for a specific category
    updateSubCategoriesOrderLocally: (state, action) => {
      const { categoryId, subcategories } = action.payload;
      // Update the main subcategories array used for arrangement
      state.subcategories = subcategories;
      
      // Also update the subcategories in the category object for consistency
      const category = state.categories.find(cat => cat._id === categoryId);
      if (category) {
        category.subcategories = subcategories;
      }
    },
    
    // Reset items to original order
    resetItemsOrder: (state) => {
      state.items = [...state.originalItems];
    },
    
    // Reset subcategories to original order
    resetSubCategoriesOrder: (state) => {
      state.subcategories = [...state.originalSubCategories];
    },
    
    // Clear errors
    clearError: (state, action) => {
      const errorType = action.payload;
      if (errorType) {
        state.error[errorType] = null;
      } else {
        state.error = {
          categories: null,
          subcategories: null,
          items: null,
          updating: null
        };
      }
    },
    
    // Clear success states
    clearSuccess: (state) => {
      state.success = {
        updating: false
      };
    }
  },
  
  extraReducers: (builder) => {
    // Fetch categories for arrangement
    builder
      .addCase(fetchCategoriesForArrangement.pending, (state) => {
        state.loading.categories = true;
        state.error.categories = null;
      })
      .addCase(fetchCategoriesForArrangement.fulfilled, (state, action) => {
        state.loading.categories = false;
        state.categories = action.payload;
        state.error.categories = null;
      })
      .addCase(fetchCategoriesForArrangement.rejected, (state, action) => {
        state.loading.categories = false;
        state.error.categories = action.payload;
      });
    
    // Fetch items for arrangement
    builder
      .addCase(fetchItemsForArrangement.pending, (state) => {
        state.loading.items = true;
        state.error.items = null;
      })
      .addCase(fetchItemsForArrangement.fulfilled, (state, action) => {
        state.loading.items = false;
        state.items = action.payload.items;
        state.originalItems = [...action.payload.items]; // Store original order
        state.selectedCategory = action.payload.categoryId;
        state.selectedSubCategory = action.payload.subCategoryId;
        state.error.items = null;
      })
      .addCase(fetchItemsForArrangement.rejected, (state, action) => {
        state.loading.items = false;
        state.error.items = action.payload;
      });
    
    // Update items display order
    builder
      .addCase(updateItemsDisplayOrder.pending, (state) => {
        state.loading.updating = true;
        state.error.updating = null;
        state.success.updating = false;
      })
      .addCase(updateItemsDisplayOrder.fulfilled, (state, action) => {
        state.loading.updating = false;
        state.originalItems = [...state.items]; // Update original items with new order
        state.success.updating = true;
        state.error.updating = null;
      })
      .addCase(updateItemsDisplayOrder.rejected, (state, action) => {
        state.loading.updating = false;
        state.error.updating = action.payload;
        state.success.updating = false;
      });
    
    // Update categories display order
    builder
      .addCase(updateCategoriesDisplayOrder.pending, (state) => {
        state.loading.updating = true;
        state.error.updating = null;
        state.success.updating = false;
      })
      .addCase(updateCategoriesDisplayOrder.fulfilled, (state, action) => {
        state.loading.updating = false;
        state.categories = action.payload;
        state.success.updating = true;
        state.error.updating = null;
      })
      .addCase(updateCategoriesDisplayOrder.rejected, (state, action) => {
        state.loading.updating = false;
        state.error.updating = action.payload;
        state.success.updating = false;
      });
    
    // Update subcategories display order
    builder
      .addCase(updateSubCategoriesDisplayOrder.pending, (state) => {
        state.loading.updating = true;
        state.error.updating = null;
        state.success.updating = false;
      })
      .addCase(updateSubCategoriesDisplayOrder.fulfilled, (state, action) => {
        state.loading.updating = false;
        
        // Update subcategories in their respective categories
        action.payload.forEach(updatedSubCategory => {
          const category = state.categories.find(cat => 
            cat._id === updatedSubCategory.categoryId._id || 
            cat._id === updatedSubCategory.categoryId
          );
          if (category) {
            const subCatIndex = category.subcategories.findIndex(sub => 
              sub._id === updatedSubCategory._id
            );
            if (subCatIndex !== -1) {
              category.subcategories[subCatIndex] = updatedSubCategory;
            }
          }
        });
        
        state.success.updating = true;
        state.error.updating = null;
      })
      .addCase(updateSubCategoriesDisplayOrder.rejected, (state, action) => {
        state.loading.updating = false;
        state.error.updating = action.payload;
        state.success.updating = false;
      });
    
    // Fetch subcategories for arrangement
    builder
      .addCase(fetchSubCategoriesForArrangement.pending, (state) => {
        state.loading.subcategories = true;
        state.error.subcategories = null;
      })
      .addCase(fetchSubCategoriesForArrangement.fulfilled, (state, action) => {
        state.loading.subcategories = false;
        state.subcategories = action.payload.subcategories;
        state.originalSubCategories = [...action.payload.subcategories];
        state.selectedCategory = action.payload.categoryId;
        state.error.subcategories = null;
      })
      .addCase(fetchSubCategoriesForArrangement.rejected, (state, action) => {
        state.loading.subcategories = false;
        state.error.subcategories = action.payload;
      });
  }
});

// Export actions
export const {
  setSelectedCategory,
  setSelectedSubCategory,
  setArrangementType,
  setViewMode,
  updateItemsOrderLocally,
  updateCategoriesOrderLocally,
  updateSubCategoriesOrderLocally,
  resetItemsOrder,
  resetSubCategoriesOrder,
  clearError,
  clearSuccess
} = arrangementSlice.actions;

// Export selectors
export const selectArrangementState = (state) => state.arrangement;
export const selectCategories = (state) => state.arrangement.categories;
export const selectSubCategories = (state) => state.arrangement.subcategories;
export const selectOriginalSubCategories = (state) => state.arrangement.originalSubCategories;
export const selectItems = (state) => state.arrangement.items;
export const selectOriginalItems = (state) => state.arrangement.originalItems;
export const selectSelectedCategory = (state) => state.arrangement.selectedCategory;
export const selectSelectedSubCategory = (state) => state.arrangement.selectedSubCategory;
export const selectArrangementType = (state) => state.arrangement.currentArrangementType;
export const selectViewMode = (state) => state.arrangement.viewMode;
export const selectArrangementLoading = (state) => state.arrangement.loading;
export const selectArrangementError = (state) => state.arrangement.error;
export const selectArrangementSuccess = (state) => state.arrangement.success;

export default arrangementSlice.reducer;
