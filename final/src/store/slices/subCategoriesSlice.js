import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { subCategoryAPI, categoryAPI } from '../../api/endpoints';
import { apiCall } from '../../api/utils';

// Async thunks for subcategory operations
export const fetchSubCategories = createAsyncThunk(
  'subCategories/fetchSubCategories',
  async (_, { rejectWithValue }) => {
    try {
      // Direct API call for better debugging
      const response = await subCategoryAPI.getAllSubCategories();
      console.log('fetchSubCategories response:', response);
      
      const result = response.data;
      console.log('fetchSubCategories result:', result);
      
      if (result.success || response.status === 200) {
        return result.data || result || [];
      } else {
        return rejectWithValue(result.message || 'Failed to fetch subcategories');
      }
    } catch (error) {
      console.error('fetchSubCategories error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch subcategories';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchSubCategoriesByCategory = createAsyncThunk(
  'subCategories/fetchSubCategoriesByCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await subCategoryAPI.getSubCategoriesByCategory(categoryId);
      console.log('fetchSubCategoriesByCategory response:', response);
      
      const result = response.data;
      console.log('fetchSubCategoriesByCategory result:', result);
      
      if (result.success || response.status === 200) {
        return {
          subCategories: result.data || result || [],
          categoryId
        };
      } else {
        return rejectWithValue(result.message || 'Failed to fetch subcategories');
      }
    } catch (error) {
      console.error('fetchSubCategoriesByCategory error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch subcategories';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchSubCategoryById = createAsyncThunk(
  'subCategories/fetchSubCategoryById',
  async (subCategoryId, { rejectWithValue }) => {
    try {
      const response = await subCategoryAPI.getSubCategoryById(subCategoryId);
      console.log('fetchSubCategoryById response:', response);
      
      const result = response.data;
      console.log('fetchSubCategoryById result:', result);
      
      if (result.success || response.status === 200) {
        return result.data || result;
      } else {
        return rejectWithValue(result.message || 'Failed to fetch subcategory');
      }
    } catch (error) {
      console.error('fetchSubCategoryById error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch subcategory';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createSubCategory = createAsyncThunk(
  'subCategories/createSubCategory',
  async (subCategoryData, { rejectWithValue }) => {
    try {
      console.log('createSubCategory called with:', subCategoryData);
      
      // Direct API call without using apiCall wrapper for better debugging
      const response = await subCategoryAPI.createSubCategory(subCategoryData);
      console.log('createSubCategory response:', response);
      
      // Handle response data structure
      const result = response.data;
      console.log('createSubCategory result:', result);
      
      if (result.success || response.status === 200 || response.status === 201) {
        return result.data || result;
      } else {
        return rejectWithValue(result.message || 'Failed to create subcategory');
      }
    } catch (error) {
      console.error('createSubCategory error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create subcategory';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateSubCategory = createAsyncThunk(
  'subCategories/updateSubCategory',
  async ({ subCategoryId, subCategoryData }, { rejectWithValue }) => {
    try {
      console.log('updateSubCategory called with:', { subCategoryId, subCategoryData });
      
      // Direct API call for better debugging
      const response = await subCategoryAPI.updateSubCategory(subCategoryId, subCategoryData);
      console.log('updateSubCategory response:', response);
      
      const result = response.data;
      console.log('updateSubCategory result:', result);
      
      if (result.success || response.status === 200) {
        return result.data || result;
      } else {
        return rejectWithValue(result.message || 'Failed to update subcategory');
      }
    } catch (error) {
      console.error('updateSubCategory error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update subcategory';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteSubCategory = createAsyncThunk(
  'subCategories/deleteSubCategory',
  async (subCategoryId, { rejectWithValue }) => {
    try {
      console.log('deleteSubCategory called with:', subCategoryId);
      
      // Direct API call for better debugging
      const response = await subCategoryAPI.deleteSubCategory(subCategoryId);
      console.log('deleteSubCategory response:', response);
      
      const result = response.data;
      console.log('deleteSubCategory result:', result);
      
      if (result.success || response.status === 200) {
        return subCategoryId;
      } else {
        return rejectWithValue(result.message || 'Failed to delete subcategory');
      }
    } catch (error) {
      console.error('deleteSubCategory error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete subcategory';
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch categories for dropdowns
export const fetchCategoriesForSubCategory = createAsyncThunk(
  'subCategories/fetchCategoriesForSubCategory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await categoryAPI.getAllCategories();
      console.log('fetchCategoriesForSubCategory response:', response);
      
      const result = response.data;
      console.log('fetchCategoriesForSubCategory result:', result);
      
      if (result.success || response.status === 200) {
        return result.data || result || [];
      } else {
        return rejectWithValue(result.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('fetchCategoriesForSubCategory error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch categories';
      return rejectWithValue(errorMessage);
    }
  }
);

// Initial state
const initialState = {
  // SubCategories
  subCategories: [],
  subCategoriesLoading: false,
  subCategoriesError: null,
  
  // SubCategories by category
  subCategoriesByCategory: {},
  subCategoriesByCategoryLoading: false,
  subCategoriesByCategoryError: null,
  
  // Current subcategory
  currentSubCategory: null,
  currentSubCategoryLoading: false,
  currentSubCategoryError: null,
  
  // Categories for dropdowns
  categories: [],
  categoriesLoading: false,
  categoriesError: null,
  
  // CRUD operations
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  
  // Messages
  successMessage: null,
  error: null,
  
  // Filters and search
  searchTerm: '',
  selectedCategory: null,
  filteredSubCategories: [],
  
  lastUpdated: null,
};

// SubCategories slice
const subCategoriesSlice = createSlice({
  name: 'subCategories',
  initialState,
  reducers: {
    setCurrentSubCategory: (state, action) => {
      state.currentSubCategory = action.payload;
    },
    
    clearCurrentSubCategory: (state) => {
      state.currentSubCategory = null;
      state.currentSubCategoryError = null;
    },
    
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
      // Filter subcategories based on search term
      if (action.payload) {
        state.filteredSubCategories = state.subCategories.filter(subCategory =>
          subCategory.name.toLowerCase().includes(action.payload.toLowerCase()) ||
          subCategory.description?.toLowerCase().includes(action.payload.toLowerCase())
        );
      } else {
        state.filteredSubCategories = state.subCategories;
      }
    },
    
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
      // Filter subcategories by category
      if (action.payload) {
        const filtered = state.subCategories.filter(subCategory => 
          subCategory.categoryId === action.payload
        );
        state.filteredSubCategories = state.searchTerm 
          ? filtered.filter(subCategory =>
              subCategory.name.toLowerCase().includes(state.searchTerm.toLowerCase())
            )
          : filtered;
      } else {
        state.filteredSubCategories = state.searchTerm
          ? state.subCategories.filter(subCategory =>
              subCategory.name.toLowerCase().includes(state.searchTerm.toLowerCase())
            )
          : state.subCategories;
      }
    },
    
    clearFilters: (state) => {
      state.searchTerm = '';
      state.selectedCategory = null;
      state.filteredSubCategories = state.subCategories;
    },
    
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    
    clearError: (state) => {
      state.error = null;
      state.subCategoriesError = null;
      state.currentSubCategoryError = null;
      state.subCategoriesByCategoryError = null;
      state.categoriesError = null;
    },
  },
  
  extraReducers: (builder) => {
    // Fetch all subcategories
    builder
      .addCase(fetchSubCategories.pending, (state) => {
        state.subCategoriesLoading = true;
        state.subCategoriesError = null;
      })
      .addCase(fetchSubCategories.fulfilled, (state, action) => {
        state.subCategoriesLoading = false;
        state.subCategories = action.payload;
        state.filteredSubCategories = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchSubCategories.rejected, (state, action) => {
        state.subCategoriesLoading = false;
        state.subCategoriesError = action.payload;
        state.error = action.payload;
      });

    // Fetch subcategories by category
    builder
      .addCase(fetchSubCategoriesByCategory.pending, (state) => {
        state.subCategoriesByCategoryLoading = true;
        state.subCategoriesByCategoryError = null;
      })
      .addCase(fetchSubCategoriesByCategory.fulfilled, (state, action) => {
        state.subCategoriesByCategoryLoading = false;
        const { subCategories, categoryId } = action.payload;
        state.subCategoriesByCategory[categoryId] = subCategories;
      })
      .addCase(fetchSubCategoriesByCategory.rejected, (state, action) => {
        state.subCategoriesByCategoryLoading = false;
        state.subCategoriesByCategoryError = action.payload;
        state.error = action.payload;
      });

    // Fetch subcategory by ID
    builder
      .addCase(fetchSubCategoryById.pending, (state) => {
        state.currentSubCategoryLoading = true;
        state.currentSubCategoryError = null;
      })
      .addCase(fetchSubCategoryById.fulfilled, (state, action) => {
        state.currentSubCategoryLoading = false;
        state.currentSubCategory = action.payload;
      })
      .addCase(fetchSubCategoryById.rejected, (state, action) => {
        state.currentSubCategoryLoading = false;
        state.currentSubCategoryError = action.payload;
        state.error = action.payload;
      });

    // Create subcategory
    builder
      .addCase(createSubCategory.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createSubCategory.fulfilled, (state, action) => {
        state.createLoading = false;
        state.subCategories.unshift(action.payload);
        state.filteredSubCategories = state.subCategories;
        state.successMessage = 'SubCategory created successfully!';
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(createSubCategory.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      });

    // Update subcategory
    builder
      .addCase(updateSubCategory.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateSubCategory.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.subCategories.findIndex(subCategory => subCategory._id === action.payload._id);
        if (index !== -1) {
          state.subCategories[index] = action.payload;
          state.filteredSubCategories = state.subCategories;
        }
        if (state.currentSubCategory && state.currentSubCategory._id === action.payload._id) {
          state.currentSubCategory = action.payload;
        }
        state.successMessage = 'SubCategory updated successfully!';
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateSubCategory.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      });

    // Delete subcategory
    builder
      .addCase(deleteSubCategory.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteSubCategory.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.subCategories = state.subCategories.filter(subCategory => subCategory._id !== action.payload);
        state.filteredSubCategories = state.filteredSubCategories.filter(subCategory => subCategory._id !== action.payload);
        if (state.currentSubCategory && state.currentSubCategory._id === action.payload) {
          state.currentSubCategory = null;
        }
        state.successMessage = 'SubCategory deleted successfully!';
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(deleteSubCategory.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      });

    // Fetch categories for subcategory
    builder
      .addCase(fetchCategoriesForSubCategory.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(fetchCategoriesForSubCategory.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategoriesForSubCategory.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.payload;
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  setCurrentSubCategory,
  clearCurrentSubCategory,
  setSearchTerm,
  setSelectedCategory,
  clearFilters,
  clearSuccessMessage,
  clearError,
} = subCategoriesSlice.actions;

// Selectors
export const selectSubCategories = (state) => state.subCategories.subCategories;
export const selectFilteredSubCategories = (state) => state.subCategories.filteredSubCategories;
export const selectSubCategoriesLoading = (state) => state.subCategories.subCategoriesLoading;
export const selectSubCategoriesError = (state) => state.subCategories.subCategoriesError;
export const selectCurrentSubCategory = (state) => state.subCategories.currentSubCategory;
export const selectCurrentSubCategoryLoading = (state) => state.subCategories.currentSubCategoryLoading;
export const selectCategoriesForSubCategory = (state) => state.subCategories.categories;
export const selectCategoriesLoading = (state) => state.subCategories.categoriesLoading;
export const selectCreateLoading = (state) => state.subCategories.createLoading;
export const selectUpdateLoading = (state) => state.subCategories.updateLoading;
export const selectDeleteLoading = (state) => state.subCategories.deleteLoading;
export const selectSuccessMessage = (state) => state.subCategories.successMessage;
export const selectError = (state) => state.subCategories.error;
export const selectSearchTerm = (state) => state.subCategories.searchTerm;
export const selectSelectedCategory = (state) => state.subCategories.selectedCategory;

export default subCategoriesSlice.reducer;
