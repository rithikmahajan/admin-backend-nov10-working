import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Async thunks for API calls
export const fetchAbandonedCarts = createAsyncThunk(
  'cartAbandonment/fetchAbandonedCarts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_BASE_URL}/cart-abandonment/abandoned-carts?${queryParams}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch abandoned carts');
    }
  }
);

export const fetchStatistics = createAsyncThunk(
  'cartAbandonment/fetchStatistics',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axios.get(`${API_BASE_URL}/cart-abandonment/statistics?${queryParams}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

export const syncFirebaseUsers = createAsyncThunk(
  'cartAbandonment/syncFirebaseUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/cart-abandonment/sync-firebase-users`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to sync Firebase users');
    }
  }
);

export const exportData = createAsyncThunk(
  'cartAbandonment/exportData',
  async ({ format, filters }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({ format, ...filters }).toString();
      const response = await axios.get(`${API_BASE_URL}/cart-abandonment/export?${queryParams}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `abandoned-carts-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { message: 'Export successful' };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to export data');
    }
  }
);

export const sendEmailToUser = createAsyncThunk(
  'cartAbandonment/sendEmailToUser',
  async ({ userId, emailData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/cart-abandonment/send-email/${userId}`, emailData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send email');
    }
  }
);

export const sendBulkEmails = createAsyncThunk(
  'cartAbandonment/sendBulkEmails',
  async (emailData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/cart-abandonment/send-bulk-emails`, emailData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send bulk emails');
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'cartAbandonment/fetchUserProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cart-abandonment/user-profile/${userId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'cartAbandonment/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/cart-abandonment/delete-user/${userId}`);
      return { userId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

export const fetchFilterOptions = createAsyncThunk(
  'cartAbandonment/fetchFilterOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cart-abandonment/filter-options`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch filter options');
    }
  }
);

const initialState = {
  // Data
  abandonedCarts: [],
  statistics: {
    emptyCartStatus: 0,
    registeredUsers: 0,
    guests: 0,
    avgVisitTime: '0 min',
    avgCartValue: 0
  },
  filterOptions: {
    dateRange: [
      { value: 'last 7 days', label: 'Last 7 days' },
      { value: 'last 30 days', label: 'Last 30 days' },
      { value: 'last 90 days', label: 'Last 90 days' }
    ],
    userType: [
      { value: 'all', label: 'All' },
      { value: 'registered', label: 'Registered' },
      { value: 'guest', label: 'Guest' }
    ],
    countryRegion: [
      { value: 'all', label: 'All' }
    ],
    sortBy: [
      { value: 'last active', label: 'Last Active' },
      { value: 'name', label: 'Name' },
      { value: 'email', label: 'Email' },
      { value: 'cart value', label: 'Cart Value' }
    ]
  },
  userProfile: null,
  
  // Pagination
  pagination: {
    current: 1,
    total: 0,
    count: 0,
    limit: 50
  },
  
  // Filters
  filters: {
    dateRange: 'last 7 days',
    userType: 'all',
    countryRegion: 'all',
    sortBy: 'last active'
  },
  
  // Loading states
  loading: {
    abandonedCarts: false,
    statistics: false,
    sync: false,
    export: false,
    email: false,
    bulkEmail: false,
    userProfile: false,
    delete: false,
    filterOptions: false
  },
  
  // Error states
  error: {
    abandonedCarts: null,
    statistics: null,
    sync: null,
    export: null,
    email: null,
    bulkEmail: null,
    userProfile: null,
    delete: null,
    filterOptions: null
  },
  
  // Success messages
  successMessage: null,
  
  // UI state
  selectedUsers: [],
  showBulkActions: false
};

const cartAbandonmentSlice = createSlice({
  name: 'cartAbandonment',
  initialState,
  reducers: {
    // Filter actions
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // UI actions
    toggleUserSelection: (state, action) => {
      const userId = action.payload;
      const index = state.selectedUsers.indexOf(userId);
      if (index > -1) {
        state.selectedUsers.splice(index, 1);
      } else {
        state.selectedUsers.push(userId);
      }
    },
    
    selectAllUsers: (state) => {
      state.selectedUsers = state.abandonedCarts.map(user => user._id);
    },
    
    deselectAllUsers: (state) => {
      state.selectedUsers = [];
    },
    
    toggleBulkActions: (state) => {
      state.showBulkActions = !state.showBulkActions;
    },
    
    // Clear states
    clearError: (state, action) => {
      const errorType = action.payload;
      if (errorType) {
        state.error[errorType] = null;
      } else {
        // Clear all errors
        Object.keys(state.error).forEach(key => {
          state.error[key] = null;
        });
      }
    },
    
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    
    clearUserProfile: (state) => {
      state.userProfile = null;
    }
  },
  
  extraReducers: (builder) => {
    // Fetch abandoned carts
    builder
      .addCase(fetchAbandonedCarts.pending, (state) => {
        state.loading.abandonedCarts = true;
        state.error.abandonedCarts = null;
      })
      .addCase(fetchAbandonedCarts.fulfilled, (state, action) => {
        state.loading.abandonedCarts = false;
        state.abandonedCarts = action.payload.abandonedCarts;
        state.pagination = action.payload.pagination;
        state.statistics = action.payload.stats;
      })
      .addCase(fetchAbandonedCarts.rejected, (state, action) => {
        state.loading.abandonedCarts = false;
        state.error.abandonedCarts = action.payload;
      });
    
    // Fetch statistics
    builder
      .addCase(fetchStatistics.pending, (state) => {
        state.loading.statistics = true;
        state.error.statistics = null;
      })
      .addCase(fetchStatistics.fulfilled, (state, action) => {
        state.loading.statistics = false;
        state.statistics = action.payload;
      })
      .addCase(fetchStatistics.rejected, (state, action) => {
        state.loading.statistics = false;
        state.error.statistics = action.payload;
      });
    
    // Sync Firebase users
    builder
      .addCase(syncFirebaseUsers.pending, (state) => {
        state.loading.sync = true;
        state.error.sync = null;
      })
      .addCase(syncFirebaseUsers.fulfilled, (state, action) => {
        state.loading.sync = false;
        state.successMessage = `Synced ${action.payload.abandonedCartsProcessed} abandoned carts from ${action.payload.totalFirebaseUsers} Firebase users`;
      })
      .addCase(syncFirebaseUsers.rejected, (state, action) => {
        state.loading.sync = false;
        state.error.sync = action.payload;
      });
    
    // Export data
    builder
      .addCase(exportData.pending, (state) => {
        state.loading.export = true;
        state.error.export = null;
      })
      .addCase(exportData.fulfilled, (state, action) => {
        state.loading.export = false;
        state.successMessage = action.payload.message;
      })
      .addCase(exportData.rejected, (state, action) => {
        state.loading.export = false;
        state.error.export = action.payload;
      });
    
    // Send email to user
    builder
      .addCase(sendEmailToUser.pending, (state) => {
        state.loading.email = true;
        state.error.email = null;
      })
      .addCase(sendEmailToUser.fulfilled, (state, action) => {
        state.loading.email = false;
        state.successMessage = action.payload.message;
      })
      .addCase(sendEmailToUser.rejected, (state, action) => {
        state.loading.email = false;
        state.error.email = action.payload;
      });
    
    // Send bulk emails
    builder
      .addCase(sendBulkEmails.pending, (state) => {
        state.loading.bulkEmail = true;
        state.error.bulkEmail = null;
      })
      .addCase(sendBulkEmails.fulfilled, (state, action) => {
        state.loading.bulkEmail = false;
        state.successMessage = `Sent emails to ${action.payload.successful} out of ${action.payload.total} users`;
      })
      .addCase(sendBulkEmails.rejected, (state, action) => {
        state.loading.bulkEmail = false;
        state.error.bulkEmail = action.payload;
      });
    
    // Fetch user profile
    builder  
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading.userProfile = true;
        state.error.userProfile = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading.userProfile = false;
        state.userProfile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading.userProfile = false;
        state.error.userProfile = action.payload;
      });
    
    // Delete user
    builder
      .addCase(deleteUser.pending, (state) => {
        state.loading.delete = true;
        state.error.delete = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.abandonedCarts = state.abandonedCarts.filter(user => user._id !== action.payload.userId);
        state.selectedUsers = state.selectedUsers.filter(id => id !== action.payload.userId);
        state.successMessage = action.payload.message;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading.delete = false;
        state.error.delete = action.payload;
      });
    
    // Fetch filter options
    builder
      .addCase(fetchFilterOptions.pending, (state) => {
        state.loading.filterOptions = true;
        state.error.filterOptions = null;
      })
      .addCase(fetchFilterOptions.fulfilled, (state, action) => {
        state.loading.filterOptions = false;
        state.filterOptions = action.payload;
      })
      .addCase(fetchFilterOptions.rejected, (state, action) => {
        state.loading.filterOptions = false;
        state.error.filterOptions = action.payload;
      });
  }
});

export const {
  updateFilters,
  resetFilters,
  toggleUserSelection,
  selectAllUsers,
  deselectAllUsers,
  toggleBulkActions,
  clearError,
  clearSuccessMessage,
  clearUserProfile
} = cartAbandonmentSlice.actions;

// Selectors
export const selectAbandonedCarts = (state) => state.cartAbandonment.abandonedCarts;
export const selectStatistics = (state) => state.cartAbandonment.statistics;
export const selectFilters = (state) => state.cartAbandonment.filters;
export const selectFilterOptions = (state) => state.cartAbandonment.filterOptions;
export const selectPagination = (state) => state.cartAbandonment.pagination;
export const selectLoading = (state) => state.cartAbandonment.loading;
export const selectError = (state) => state.cartAbandonment.error;
export const selectSuccessMessage = (state) => state.cartAbandonment.successMessage;
export const selectSelectedUsers = (state) => state.cartAbandonment.selectedUsers;
export const selectUserProfile = (state) => state.cartAbandonment.userProfile;

export default cartAbandonmentSlice.reducer;
