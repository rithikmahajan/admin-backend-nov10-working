import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { itemAPI } from '../../api/endpoints';

// Async thunks for API calls
export const fetchProducts = createAsyncThunk(
  'newProduct/fetchProducts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await itemAPI.fetchProducts(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchProductsByStatus = createAsyncThunk(
  'newProduct/fetchProductsByStatus',
  async ({ status, params }, { rejectWithValue }) => {
    try {
      const response = await itemAPI.fetchProductsByStatus(status, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products by status');
    }
  }
);

export const updateProductStatus = createAsyncThunk(
  'newProduct/updateProductStatus',
  async ({ productId, status }, { rejectWithValue }) => {
    try {
      console.log('🔄 Redux updateProductStatus called with:', { productId, status });
      
      if (!productId) {
        throw new Error('Product ID is required');
      }
      
      // Pass status wrapped in an object as the endpoint expects
      const response = await itemAPI.updateProductStatus(productId, { status });
      return response.data;
    } catch (error) {
      console.error('❌ Redux updateProductStatus error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update product status');
    }
  }
);

export const updateDraftConfiguration = createAsyncThunk(
  'newProduct/updateDraftConfiguration',
  async (configData, { rejectWithValue }) => {
    try {
      const response = await itemAPI.updateDraftConfiguration(configData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update draft configuration');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'newProduct/deleteProduct',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await itemAPI.deleteProduct(productId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
    }
  }
);

export const updateItemCategoryAssignment = createAsyncThunk(
  'newProduct/updateItemCategoryAssignment',
  async ({ itemId, categoryId, subCategoryId }, { rejectWithValue }) => {
    try {
      const response = await itemAPI.updateItemCategoryAssignment(itemId, { categoryId, subCategoryId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update category assignment');
    }
  }
);

export const uploadProductImages = createAsyncThunk(
  'newProduct/uploadProductImages',
  async ({ productId, images }, { rejectWithValue }) => {
    try {
      const response = await itemAPI.uploadProductImages(productId, images);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload images');
    }
  }
);

export const uploadProductVideos = createAsyncThunk(
  'newProduct/uploadProductVideos',
  async ({ productId, videos }, { rejectWithValue }) => {
    try {
      const response = await itemAPI.uploadProductVideos(productId, videos);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload videos');
    }
  }
);

export const deleteProductImage = createAsyncThunk(
  'newProduct/deleteProductImage',
  async ({ productId, imageIndex }, { rejectWithValue }) => {
    try {
      const response = await itemAPI.deleteProductImage(productId, imageIndex);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete image');
    }
  }
);

export const deleteProductVideo = createAsyncThunk(
  'newProduct/deleteProductVideo',
  async ({ productId, videoId }, { rejectWithValue }) => {
    try {
      const response = await itemAPI.deleteProductVideo(productId, videoId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete video');
    }
  }
);

export const uploadSizeChartImage = createAsyncThunk(
  'newProduct/uploadSizeChartImage',
  async ({ productId, imageFile }, { rejectWithValue }) => {
    try {
      console.log('🔄 Size chart upload starting:', { productId, fileName: imageFile?.name, fileSize: imageFile?.size });
      
      const formData = new FormData();
      formData.append('sizeChart', imageFile);
      
      console.log('🔑 Auth token from localStorage:', localStorage.getItem('authToken'));
      
      const response = await itemAPI.uploadSizeChartImage(productId, formData);
      console.log('✅ Size chart upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Size chart upload error:', error);
      console.error('❌ Error response:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to upload size chart image');
    }
  }
);

export const deleteSizeChartImage = createAsyncThunk(
  'newProduct/deleteSizeChartImage',
  async ({ productId }, { rejectWithValue }) => {
    try {
      const response = await itemAPI.deleteSizeChartImage(productId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete size chart image');
    }
  }
);

export const updateRecommendationSettings = createAsyncThunk(
  'newProduct/updateRecommendationSettings',
  async ({ productId, settings }, { rejectWithValue }) => {
    try {
      const response = await itemAPI.updateRecommendationSettings(productId, settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update recommendation settings');
    }
  }
);

export const bulkUpdateProductSettings = createAsyncThunk(
  'newProduct/bulkUpdateProductSettings',
  async (updateData, { rejectWithValue }) => {
    try {
      const response = await itemAPI.bulkUpdateProductSettings(updateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to bulk update product settings');
    }
  }
);

export const fetchDynamicFilters = createAsyncThunk(
  'newProduct/fetchDynamicFilters',
  async (_, { rejectWithValue }) => {
    try {
      const response = await itemAPI.fetchDynamicFilters();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dynamic filters');
    }
  }
);

// Initial state
const initialState = {
  products: [],
  loading: false,
  error: null,
  success: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  },
  filters: {
    status: 'all',
    search: '',
    category: '',
    dateRange: null
  },
  dynamicFilters: []
};

// Create slice
const newProductSlice = createSlice({
  name: 'newProduct',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    // Fetch Products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns { data: { items: [...], pagination: {...} } }
        state.products = action.payload.data?.items || [];
        state.pagination = action.payload.data?.pagination || initialState.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Fetch Products by Status
      .addCase(fetchProductsByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns { data: { items: [...], pagination: {...} } }
        state.products = action.payload.data?.items || [];
        state.pagination = action.payload.data?.pagination || initialState.pagination;
      })
      .addCase(fetchProductsByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Update Product Status
      .addCase(updateProductStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProductStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message || 'Product status updated successfully';
        // Update the product in the products array
        const productIndex = state.products.findIndex(p => p._id === action.payload.data._id);
        if (productIndex !== -1) {
          state.products[productIndex] = action.payload.data;
        }
      })
      .addCase(updateProductStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Update Item Category Assignment
      .addCase(updateItemCategoryAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateItemCategoryAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message || 'Category assignment updated successfully';
        // Update the product in the products array
        const productIndex = state.products.findIndex(p => p._id === action.payload.data._id);
        if (productIndex !== -1) {
          state.products[productIndex] = action.payload.data;
        }
      })
      .addCase(updateItemCategoryAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Upload Product Images
      .addCase(uploadProductImages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadProductImages.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message || 'Images uploaded successfully';
        // Update the product in the products array
        const productIndex = state.products.findIndex(p => p._id === action.payload.data._id);
        if (productIndex !== -1) {
          state.products[productIndex] = action.payload.data;
        }
      })
      .addCase(uploadProductImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Upload Product Videos
      .addCase(uploadProductVideos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadProductVideos.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message || 'Videos uploaded successfully';
        // Update the product in the products array
        const productIndex = state.products.findIndex(p => p._id === action.payload.data._id);
        if (productIndex !== -1) {
          state.products[productIndex] = action.payload.data;
        }
      })
      .addCase(uploadProductVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Delete Product Image
      .addCase(deleteProductImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProductImage.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message || 'Image deleted successfully';
        // Update the product in the products array
        if (action.payload.data.item) {
          const productIndex = state.products.findIndex(p => p._id === action.payload.data.item._id);
          if (productIndex !== -1) {
            state.products[productIndex] = action.payload.data.item;
          }
        }
      })
      .addCase(deleteProductImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Delete Product Video
      .addCase(deleteProductVideo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProductVideo.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message || 'Video deleted successfully';
        // Update the product in the products array
        const productIndex = state.products.findIndex(p => p._id === action.payload.data._id);
        if (productIndex !== -1) {
          state.products[productIndex] = action.payload.data;
        }
      })
      .addCase(deleteProductVideo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Size Chart Image Upload
      .addCase(uploadSizeChartImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadSizeChartImage.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message || 'Size chart image uploaded successfully';
        // Update the product in the products array
        if (action.payload.data.item) {
          const productIndex = state.products.findIndex(p => p._id === action.payload.data.item._id);
          if (productIndex !== -1) {
            state.products[productIndex] = action.payload.data.item;
          }
        }
      })
      .addCase(uploadSizeChartImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Size Chart Image Delete
      .addCase(deleteSizeChartImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSizeChartImage.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message || 'Size chart image deleted successfully';
        // Update the product in the products array
        if (action.payload.data.item) {
          const productIndex = state.products.findIndex(p => p._id === action.payload.data.item._id);
          if (productIndex !== -1) {
            state.products[productIndex] = action.payload.data.item;
          }
        }
      })
      .addCase(deleteSizeChartImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Update Recommendation Settings
      .addCase(updateRecommendationSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRecommendationSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message || 'Recommendation settings updated successfully';
        // Update the product in the products array
        const productIndex = state.products.findIndex(p => p._id === action.payload.data._id);
        if (productIndex !== -1) {
          state.products[productIndex] = action.payload.data;
        }
      })
      .addCase(updateRecommendationSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Bulk Update Product Settings
      .addCase(bulkUpdateProductSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkUpdateProductSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message || 'Product settings updated successfully';
        // Update multiple products in the products array
        if (action.payload.data && Array.isArray(action.payload.data)) {
          action.payload.data.forEach(updatedProduct => {
            const productIndex = state.products.findIndex(p => p._id === updatedProduct._id);
            if (productIndex !== -1) {
              state.products[productIndex] = updatedProduct;
            }
          });
        }
      })
      .addCase(bulkUpdateProductSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Fetch Dynamic Filters
      .addCase(fetchDynamicFilters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDynamicFilters.fulfilled, (state, action) => {
        state.loading = false;
        state.dynamicFilters = action.payload.data || [];
      })
      .addCase(fetchDynamicFilters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message || 'Product deleted successfully';
        // Remove the product from the products array
        state.products = state.products.filter(p => p._id !== action.payload.deletedId);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Export actions
export const { clearError, clearSuccess, setFilters } = newProductSlice.actions;

// Selectors - Fixed to use 'products' key as registered in store with safe defaults
export const selectProducts = (state) => state.products?.products || [];
export const selectProductsLoading = (state) => state.products?.loading || false;
export const selectProductsError = (state) => state.products?.error || null;
export const selectProductsSuccess = (state) => state.products?.success || null;
export const selectProductsPagination = (state) => state.products?.pagination || {
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  hasNextPage: false,
  hasPreviousPage: false
};
export const selectProductsFilters = (state) => state.products?.filters || {
  status: 'all',
  search: '',
  category: '',
  dateRange: null
};
export const selectDynamicFilters = (state) => state.products?.dynamicFilters || [];

// Export reducer
export default newProductSlice.reducer;
