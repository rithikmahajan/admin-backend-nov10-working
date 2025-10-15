import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { promoCodeAPI } from '../../api/endpoints';

// Initial state
const initialState = {
  promoCodes: [],
  loading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  selectedPromoCode: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },
  filters: {
    isActive: null,
    discountType: null,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  stats: {
    total: 0,
    active: 0,
    inactive: 0,
    expired: 0,
  },
};

// Async thunks for API calls

// Fetch all promo codes
export const fetchPromoCodes = createAsyncThunk(
  'promoCodes/fetchPromoCodes',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await promoCodeAPI.getAllPromoCodes(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch promo codes'
      );
    }
  }
);

// Create new promo code
export const createPromoCode = createAsyncThunk(
  'promoCodes/createPromoCode',
  async (promoCodeData, { rejectWithValue }) => {
    try {
      const response = await promoCodeAPI.createPromoCode(promoCodeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create promo code'
      );
    }
  }
);

// Update promo code
export const updatePromoCode = createAsyncThunk(
  'promoCodes/updatePromoCode',
  async ({ id, promoCodeData }, { rejectWithValue }) => {
    try {
      const response = await promoCodeAPI.updatePromoCode(id, promoCodeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update promo code'
      );
    }
  }
);

// Delete promo code
export const deletePromoCode = createAsyncThunk(
  'promoCodes/deletePromoCode',
  async (id, { rejectWithValue }) => {
    try {
      const response = await promoCodeAPI.deletePromoCode(id);
      return { id, message: response.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete promo code'
      );
    }
  }
);

// Validate promo code
export const validatePromoCode = createAsyncThunk(
  'promoCodes/validatePromoCode',
  async ({ code, cartTotal }, { rejectWithValue }) => {
    try {
      const response = await promoCodeAPI.validatePromoCode({ code, cartTotal });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to validate promo code'
      );
    }
  }
);

// Get promo code by ID
export const getPromoCodeById = createAsyncThunk(
  'promoCodes/getPromoCodeById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await promoCodeAPI.getPromoCodeById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch promo code'
      );
    }
  }
);

// Bulk operations
export const bulkTogglePromoCodeStatus = createAsyncThunk(
  'promoCodes/bulkToggleStatus',
  async ({ ids, isActive }, { rejectWithValue }) => {
    try {
      const response = await promoCodeAPI.bulkToggleStatus({ ids, isActive });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update promo code status'
      );
    }
  }
);

export const bulkDeletePromoCodes = createAsyncThunk(
  'promoCodes/bulkDelete',
  async (ids, { rejectWithValue }) => {
    try {
      const response = await promoCodeAPI.bulkDelete({ ids });
      return { ids, message: response.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete promo codes'
      );
    }
  }
);

// Get promo code statistics
export const getPromoCodeStats = createAsyncThunk(
  'promoCodes/getStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await promoCodeAPI.getPromoCodeStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch statistics'
      );
    }
  }
);

// Promo code slice
const promoCodeSlice = createSlice({
  name: 'promoCodes',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Set selected promo code
    setSelectedPromoCode: (state, action) => {
      state.selectedPromoCode = action.payload;
    },
    
    // Clear selected promo code
    clearSelectedPromoCode: (state) => {
      state.selectedPromoCode = null;
    },
    
    // Update filters
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Reset filters
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Update pagination
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Reset state
    resetPromoCodeState: (state) => {
      Object.assign(state, initialState);
    },
    
    // Optimistic updates for better UX
    optimisticUpdatePromoCode: (state, action) => {
      const { id, updates } = action.payload;
      const promoCodeIndex = state.promoCodes.findIndex(promo => promo._id === id);
      if (promoCodeIndex !== -1) {
        state.promoCodes[promoCodeIndex] = {
          ...state.promoCodes[promoCodeIndex],
          ...updates
        };
      }
    },
    
    optimisticDeletePromoCode: (state, action) => {
      const id = action.payload;
      state.promoCodes = state.promoCodes.filter(promo => promo._id !== id);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch promo codes
      .addCase(fetchPromoCodes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromoCodes.fulfilled, (state, action) => {
        state.loading = false;
        state.promoCodes = action.payload.promoCodes || [];
        state.stats = action.payload.stats || state.stats;
        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination,
        };
      })
      .addCase(fetchPromoCodes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create promo code
      .addCase(createPromoCode.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createPromoCode.fulfilled, (state, action) => {
        state.createLoading = false;
        if (action.payload.promoCode) {
          state.promoCodes.unshift(action.payload.promoCode);
        }
      })
      .addCase(createPromoCode.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      
      // Update promo code
      .addCase(updatePromoCode.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updatePromoCode.fulfilled, (state, action) => {
        state.updateLoading = false;
        if (action.payload.promoCode) {
          const index = state.promoCodes.findIndex(
            promo => promo._id === action.payload.promoCode._id
          );
          if (index !== -1) {
            state.promoCodes[index] = action.payload.promoCode;
          }
        }
      })
      .addCase(updatePromoCode.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })
      
      // Delete promo code
      .addCase(deletePromoCode.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deletePromoCode.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.promoCodes = state.promoCodes.filter(
          promo => promo._id !== action.payload.id
        );
      })
      .addCase(deletePromoCode.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })
      
      // Validate promo code
      .addCase(validatePromoCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validatePromoCode.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(validatePromoCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get promo code by ID
      .addCase(getPromoCodeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPromoCodeById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPromoCode = action.payload.promoCode;
      })
      .addCase(getPromoCodeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Bulk operations
      .addCase(bulkTogglePromoCodeStatus.fulfilled, (state, action) => {
        if (action.payload.promoCodes) {
          action.payload.promoCodes.forEach(updatedPromo => {
            const index = state.promoCodes.findIndex(
              promo => promo._id === updatedPromo._id
            );
            if (index !== -1) {
              state.promoCodes[index] = updatedPromo;
            }
          });
        }
      })
      
      .addCase(bulkDeletePromoCodes.fulfilled, (state, action) => {
        state.promoCodes = state.promoCodes.filter(
          promo => !action.payload.ids.includes(promo._id)
        );
      })
      
      // Get statistics
      .addCase(getPromoCodeStats.fulfilled, (state, action) => {
        state.stats = action.payload.stats;
      });
  },
});

// Export actions
export const {
  clearError,
  setSelectedPromoCode,
  clearSelectedPromoCode,
  updateFilters,
  resetFilters,
  updatePagination,
  resetPromoCodeState,
  optimisticUpdatePromoCode,
  optimisticDeletePromoCode,
} = promoCodeSlice.actions;

// Selectors
export const selectPromoCodes = (state) => state.promoCodes.promoCodes;
export const selectPromoCodesLoading = (state) => state.promoCodes.loading;
export const selectPromoCodesError = (state) => state.promoCodes.error;
export const selectCreateLoading = (state) => state.promoCodes.createLoading;
export const selectUpdateLoading = (state) => state.promoCodes.updateLoading;
export const selectDeleteLoading = (state) => state.promoCodes.deleteLoading;
export const selectSelectedPromoCode = (state) => state.promoCodes.selectedPromoCode;
export const selectPromoCodeFilters = (state) => state.promoCodes.filters;
export const selectPromoCodePagination = (state) => state.promoCodes.pagination;
export const selectPromoCodeStats = (state) => state.promoCodes.stats;

// Complex selectors
export const selectFilteredPromoCodes = (state) => {
  const { promoCodes, filters } = state.promoCodes;
  const { isActive, discountType, search } = filters;
  
  return promoCodes.filter(promo => {
    const matchesActive = isActive === null || promo.isActive === isActive;
    const matchesType = !discountType || promo.discountType === discountType;
    const matchesSearch = !search || 
      promo.code.toLowerCase().includes(search.toLowerCase()) ||
      promo.discountType.toLowerCase().includes(search.toLowerCase());
    
    return matchesActive && matchesType && matchesSearch;
  });
};

export const selectActivePromoCodes = (state) => 
  state.promoCodes.promoCodes.filter(promo => promo.isActive);

export const selectExpiredPromoCodes = (state) => {
  const now = new Date();
  return state.promoCodes.promoCodes.filter(promo => new Date(promo.endDate) < now);
};

export const selectPromoCodeById = (state, id) => 
  state.promoCodes.promoCodes.find(promo => promo._id === id);

// Export reducer
export default promoCodeSlice.reducer;
