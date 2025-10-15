import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';

// Async thunks for partner operations

// Create new partner
export const createPartner = createAsyncThunk(
  'partners/createPartner',
  async (partnerData, { rejectWithValue }) => {
    try {
      const response = await api.post('/partners', partnerData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create partner'
      );
    }
  }
);

// Fetch all partners
export const fetchPartners = createAsyncThunk(
  'partners/fetchPartners',
  async (params = {}, { rejectWithValue }) => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });

      if (status) queryParams.append('status', status);
      if (search) queryParams.append('search', search);

      const response = await api.get(`/partners?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch partners'
      );
    }
  }
);

// Fetch partner by ID
export const fetchPartnerById = createAsyncThunk(
  'partners/fetchPartnerById',
  async (partnerId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/partners/${partnerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch partner'
      );
    }
  }
);

// Update partner
export const updatePartner = createAsyncThunk(
  'partners/updatePartner',
  async ({ partnerId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/partners/${partnerId}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update partner'
      );
    }
  }
);

// Update partner password
export const updatePartnerPassword = createAsyncThunk(
  'partners/updatePartnerPassword',
  async ({ partnerId, passwordData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/partners/${partnerId}/password`, passwordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update password'
      );
    }
  }
);

// Toggle partner status (block/unblock)
export const togglePartnerStatus = createAsyncThunk(
  'partners/togglePartnerStatus',
  async ({ partnerId, action, reason }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/partners/${partnerId}/toggle-status`, {
        reason: reason || 'Admin action'
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to toggle partner status'
      );
    }
  }
);

// Delete partner
export const deletePartner = createAsyncThunk(
  'partners/deletePartner',
  async (partnerId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/partners/${partnerId}`);
      return response.data;
      return { partnerId, response: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete partner'
      );
    }
  }
);

// Fetch partner statistics
export const fetchPartnerStatistics = createAsyncThunk(
  'partners/fetchPartnerStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/partners/statistics');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch statistics'
      );
    }
  }
);

// Partner login
export const partnerLogin = createAsyncThunk(
  'partners/partnerLogin',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/partners/auth/login', credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      );
    }
  }
);

// Initial state
const initialState = {
  partners: [],
  currentPartner: null,
  selectedPartner: null,
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  },
  filters: {
    status: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  statistics: {
    totalPartners: 0,
    activePartners: 0,
    blockedPartners: 0,
    pendingPartners: 0,
    avgAcceptanceRate: 0,
    avgCompletionRate: 0,
    totalOrdersAssigned: 0,
    totalOrdersAccepted: 0,
    totalOrdersCompleted: 0
  },
  loading: {
    partners: false,
    create: false,
    update: false,
    delete: false,
    statistics: false,
    login: false
  },
  error: {
    partners: null,
    create: null,
    update: null,
    delete: null,
    statistics: null,
    login: null
  },
  success: {
    create: false,
    update: false,
    delete: false,
    passwordUpdate: false
  }
};

// Create slice
const partnerSlice = createSlice({
  name: 'partners',
  initialState,
  reducers: {
    // Clear errors
    clearErrors: (state) => {
      state.error = {
        partners: null,
        create: null,
        update: null,
        delete: null,
        statistics: null,
        login: null
      };
    },

    // Clear success states
    clearSuccess: (state) => {
      state.success = {
        create: false,
        update: false,
        delete: false,
        passwordUpdate: false
      };
    },

    // Update filters
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Reset filters
    resetFilters: (state) => {
      state.filters = {
        status: '',
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
    },

    // Set selected partner
    setSelectedPartner: (state, action) => {
      state.selectedPartner = action.payload;
    },

    // Clear selected partner
    clearSelectedPartner: (state) => {
      state.selectedPartner = null;
    },

    // Update partner in list
    updatePartnerInList: (state, action) => {
      const { partnerId, updates } = action.payload;
      const index = state.partners.findIndex(
        partner => partner._id === partnerId || partner.partnerId === partnerId
      );
      if (index !== -1) {
        state.partners[index] = { ...state.partners[index], ...updates };
      }
    },

    // Remove partner from list
    removePartnerFromList: (state, action) => {
      const partnerId = action.payload;
      state.partners = state.partners.filter(
        partner => partner._id !== partnerId && partner.partnerId !== partnerId
      );
    }
  },

  extraReducers: (builder) => {
    // Create partner
    builder
      .addCase(createPartner.pending, (state) => {
        state.loading.create = true;
        state.error.create = null;
        state.success.create = false;
      })
      .addCase(createPartner.fulfilled, (state, action) => {
        state.loading.create = false;
        state.success.create = true;
        if (action.payload?.success && action.payload?.data?.partner) {
          state.partners.unshift(action.payload.data.partner);
        }
      })
      .addCase(createPartner.rejected, (state, action) => {
        state.loading.create = false;
        state.error.create = action.payload;
        state.success.create = false;
      });

    // Fetch partners
    builder
      .addCase(fetchPartners.pending, (state) => {
        state.loading.partners = true;
        state.error.partners = null;
      })
      .addCase(fetchPartners.fulfilled, (state, action) => {
        state.loading.partners = false;
        if (action.payload?.success && action.payload?.data) {
          state.partners = action.payload.data.partners || [];
          state.pagination = action.payload.data.pagination || state.pagination;
        }
      })
      .addCase(fetchPartners.rejected, (state, action) => {
        state.loading.partners = false;
        state.error.partners = action.payload;
      });

    // Fetch partner by ID
    builder
      .addCase(fetchPartnerById.pending, (state) => {
        state.loading.partners = true;
        state.error.partners = null;
      })
      .addCase(fetchPartnerById.fulfilled, (state, action) => {
        state.loading.partners = false;
        if (action.payload?.success && action.payload?.data) {
          state.selectedPartner = action.payload.data;
        }
      })
      .addCase(fetchPartnerById.rejected, (state, action) => {
        state.loading.partners = false;
        state.error.partners = action.payload;
      });

    // Update partner
    builder
      .addCase(updatePartner.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
        state.success.update = false;
      })
      .addCase(updatePartner.fulfilled, (state, action) => {
        state.loading.update = false;
        state.success.update = true;
        if (action.payload?.success && action.payload?.data) {
          // Update in partners list
          const updatedPartner = action.payload.data;
          const index = state.partners.findIndex(
            partner => partner._id === updatedPartner._id
          );
          if (index !== -1) {
            state.partners[index] = updatedPartner;
          }
          // Update selected partner if it matches
          if (state.selectedPartner && state.selectedPartner._id === updatedPartner._id) {
            state.selectedPartner = updatedPartner;
          }
        }
      })
      .addCase(updatePartner.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload;
        state.success.update = false;
      });

    // Update partner password
    builder
      .addCase(updatePartnerPassword.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
        state.success.passwordUpdate = false;
      })
      .addCase(updatePartnerPassword.fulfilled, (state) => {
        state.loading.update = false;
        state.success.passwordUpdate = true;
      })
      .addCase(updatePartnerPassword.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload;
        state.success.passwordUpdate = false;
      });

    // Toggle partner status
    builder
      .addCase(togglePartnerStatus.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
      })
      .addCase(togglePartnerStatus.fulfilled, (state, action) => {
        state.loading.update = false;
        if (action.payload?.success && action.payload?.data) {
          const updatedPartner = action.payload.data;
          const index = state.partners.findIndex(
            partner => partner._id === updatedPartner._id
          );
          if (index !== -1) {
            state.partners[index] = updatedPartner;
          }
          if (state.selectedPartner && state.selectedPartner._id === updatedPartner._id) {
            state.selectedPartner = updatedPartner;
          }
        }
      })
      .addCase(togglePartnerStatus.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload;
      });

    // Delete partner
    builder
      .addCase(deletePartner.pending, (state) => {
        state.loading.delete = true;
        state.error.delete = null;
        state.success.delete = false;
      })
      .addCase(deletePartner.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.success.delete = true;
        const partnerId = action.payload.partnerId;
        state.partners = state.partners.filter(
          partner => partner._id !== partnerId && partner.partnerId !== partnerId
        );
        if (state.selectedPartner && 
            (state.selectedPartner._id === partnerId || 
             state.selectedPartner.partnerId === partnerId)) {
          state.selectedPartner = null;
        }
      })
      .addCase(deletePartner.rejected, (state, action) => {
        state.loading.delete = false;
        state.error.delete = action.payload;
        state.success.delete = false;
      });

    // Fetch partner statistics
    builder
      .addCase(fetchPartnerStatistics.pending, (state) => {
        state.loading.statistics = true;
        state.error.statistics = null;
      })
      .addCase(fetchPartnerStatistics.fulfilled, (state, action) => {
        state.loading.statistics = false;
        if (action.payload?.success && action.payload?.data) {
          state.statistics = action.payload.data;
        }
      })
      .addCase(fetchPartnerStatistics.rejected, (state, action) => {
        state.loading.statistics = false;
        state.error.statistics = action.payload;
      });

    // Partner login
    builder
      .addCase(partnerLogin.pending, (state) => {
        state.loading.login = true;
        state.error.login = null;
      })
      .addCase(partnerLogin.fulfilled, (state, action) => {
        state.loading.login = false;
        if (action.payload?.success && action.payload?.data) {
          state.currentPartner = action.payload.data.partner;
          // Store token in localStorage
          if (action.payload.data.token) {
            localStorage.setItem('partnerToken', action.payload.data.token);
          }
        }
      })
      .addCase(partnerLogin.rejected, (state, action) => {
        state.loading.login = false;
        state.error.login = action.payload;
        state.currentPartner = null;
      });
  }
});

// Export actions
export const {
  clearErrors,
  clearSuccess,
  updateFilters,
  resetFilters,
  setSelectedPartner,
  clearSelectedPartner,
  updatePartnerInList,
  removePartnerFromList
} = partnerSlice.actions;

// Export selectors
export const selectPartners = (state) => state.partners.partners;
export const selectCurrentPartner = (state) => state.partners.currentPartner;
export const selectSelectedPartner = (state) => state.partners.selectedPartner;
export const selectPartnerPagination = (state) => state.partners.pagination;
export const selectPartnerFilters = (state) => state.partners.filters;
export const selectPartnerStatistics = (state) => state.partners.statistics;
export const selectPartnerLoading = (state) => state.partners.loading;
export const selectPartnerError = (state) => state.partners.error;
export const selectPartnerSuccess = (state) => state.partners.success;

// Export reducer
export default partnerSlice.reducer;
