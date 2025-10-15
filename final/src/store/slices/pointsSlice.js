import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { pointsAPI } from '../../api/endpoints';

// Async thunks for API calls
export const fetchPointsSummary = createAsyncThunk(
  'points/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await pointsAPI.getPointsSummary();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch points summary');
    }
  }
);

export const fetchSystemConfig = createAsyncThunk(
  'points/fetchSystemConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await pointsAPI.getSystemConfig();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch system config');
    }
  }
);

export const updateSystemConfig = createAsyncThunk(
  'points/updateSystemConfig',
  async (configData, { rejectWithValue }) => {
    try {
      const response = await pointsAPI.updateSystemConfig(configData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update system config');
    }
  }
);

export const fetchUsersWithPoints = createAsyncThunk(
  'points/fetchUsersWithPoints',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await pointsAPI.getAllUsersWithPoints(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users with points');
    }
  }
);

export const fetchUserPoints = createAsyncThunk(
  'points/fetchUserPoints',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await pointsAPI.getUserPoints(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user points');
    }
  }
);

export const allocatePoints = createAsyncThunk(
  'points/allocatePoints',
  async ({ userId, pointsData }, { rejectWithValue }) => {
    try {
      const response = await pointsAPI.allocatePoints(userId, pointsData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to allocate points');
    }
  }
);

export const redeemPoints = createAsyncThunk(
  'points/redeemPoints',
  async ({ userId, pointsData }, { rejectWithValue }) => {
    try {
      const response = await pointsAPI.redeemPoints(userId, pointsData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to redeem points');
    }
  }
);

export const updateUserPoints = createAsyncThunk(
  'points/updateUserPoints',
  async ({ userId, pointsData }, { rejectWithValue }) => {
    try {
      const response = await pointsAPI.updateUserPoints(userId, pointsData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user points');
    }
  }
);

export const deleteUserPoints = createAsyncThunk(
  'points/deleteUserPoints',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await pointsAPI.deleteUserPoints(userId);
      return { userId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user points');
    }
  }
);

export const fetchUserPointsHistory = createAsyncThunk(
  'points/fetchUserPointsHistory',
  async ({ userId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await pointsAPI.getUserPointsHistory(userId, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user points history');
    }
  }
);

// Initial state
const initialState = {
  // Summary data
  summary: {
    totalPointsAllocated: 0,
    totalPointsRedeemed: 0,
    totalPointsBalance: 0,
    totalUsersWithPoints: 0
  },
  
  // System configuration
  systemConfig: {
    isEnabled: false,
    pointsPerRupee: 1
  },
  
  // Users with points
  users: [],
  currentUser: null,
  userPointsHistory: [],
  
  // Pagination
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10
  },
  
  // Loading states
  isLoading: {
    summary: false,
    systemConfig: false,
    users: false,
    userPoints: false,
    allocating: false,
    redeeming: false,
    updating: false,
    deleting: false,
    history: false
  },
  
  // Error states
  errors: {
    summary: null,
    systemConfig: null,
    users: null,
    userPoints: null,
    allocating: null,
    redeeming: null,
    updating: null,
    deleting: null,
    history: null
  },
  
  // Success messages
  successMessages: {
    allocating: null,
    redeeming: null,
    updating: null,
    deleting: null,
    systemConfig: null
  }
};

// Points slice
const pointsSlice = createSlice({
  name: 'points',
  initialState,
  reducers: {
    // Clear errors
    clearError: (state, action) => {
      const errorType = action.payload;
      if (errorType) {
        state.errors[errorType] = null;
      } else {
        // Clear all errors
        Object.keys(state.errors).forEach(key => {
          state.errors[key] = null;
        });
      }
    },
    
    // Clear success messages
    clearSuccessMessage: (state, action) => {
      const messageType = action.payload;
      if (messageType) {
        state.successMessages[messageType] = null;
      } else {
        // Clear all success messages
        Object.keys(state.successMessages).forEach(key => {
          state.successMessages[key] = null;
        });
      }
    },
    
    // Set current user
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    
    // Update pagination
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Reset state
    resetPointsState: () => initialState
  },
  
  extraReducers: (builder) => {
    // Fetch Points Summary
    builder
      .addCase(fetchPointsSummary.pending, (state) => {
        state.isLoading.summary = true;
        state.errors.summary = null;
      })
      .addCase(fetchPointsSummary.fulfilled, (state, action) => {
        state.isLoading.summary = false;
        if (action.payload.success && action.payload.data?.summary) {
          state.summary = action.payload.data.summary;
        }
      })
      .addCase(fetchPointsSummary.rejected, (state, action) => {
        state.isLoading.summary = false;
        state.errors.summary = action.payload;
      });
    
    // Fetch System Config
    builder
      .addCase(fetchSystemConfig.pending, (state) => {
        state.isLoading.systemConfig = true;
        state.errors.systemConfig = null;
      })
      .addCase(fetchSystemConfig.fulfilled, (state, action) => {
        state.isLoading.systemConfig = false;
        if (action.payload.success && action.payload.data) {
          state.systemConfig = action.payload.data;
        }
      })
      .addCase(fetchSystemConfig.rejected, (state, action) => {
        state.isLoading.systemConfig = false;
        state.errors.systemConfig = action.payload;
      });
    
    // Update System Config
    builder
      .addCase(updateSystemConfig.pending, (state) => {
        state.isLoading.systemConfig = true;
        state.errors.systemConfig = null;
        state.successMessages.systemConfig = null;
      })
      .addCase(updateSystemConfig.fulfilled, (state, action) => {
        state.isLoading.systemConfig = false;
        if (action.payload.success && action.payload.data) {
          state.systemConfig = action.payload.data;
          state.successMessages.systemConfig = action.payload.message || 'System configuration updated successfully';
        }
      })
      .addCase(updateSystemConfig.rejected, (state, action) => {
        state.isLoading.systemConfig = false;
        state.errors.systemConfig = action.payload;
      });
    
    // Fetch Users with Points
    builder
      .addCase(fetchUsersWithPoints.pending, (state) => {
        state.isLoading.users = true;
        state.errors.users = null;
      })
      .addCase(fetchUsersWithPoints.fulfilled, (state, action) => {
        state.isLoading.users = false;
        if (action.payload.success && action.payload.data) {
          state.users = action.payload.data.users || [];
          state.pagination = {
            ...state.pagination,
            currentPage: action.payload.data.currentPage || 1,
            totalPages: action.payload.data.totalPages || 1,
            totalUsers: action.payload.data.totalUsers || 0
          };
        }
      })
      .addCase(fetchUsersWithPoints.rejected, (state, action) => {
        state.isLoading.users = false;
        state.errors.users = action.payload;
      });
    
    // Fetch User Points
    builder
      .addCase(fetchUserPoints.pending, (state) => {
        state.isLoading.userPoints = true;
        state.errors.userPoints = null;
      })
      .addCase(fetchUserPoints.fulfilled, (state, action) => {
        state.isLoading.userPoints = false;
        if (action.payload.success && action.payload.data) {
          state.currentUser = action.payload.data;
        }
      })
      .addCase(fetchUserPoints.rejected, (state, action) => {
        state.isLoading.userPoints = false;
        state.errors.userPoints = action.payload;
      });
    
    // Allocate Points
    builder
      .addCase(allocatePoints.pending, (state) => {
        state.isLoading.allocating = true;
        state.errors.allocating = null;
        state.successMessages.allocating = null;
      })
      .addCase(allocatePoints.fulfilled, (state, action) => {
        state.isLoading.allocating = false;
        if (action.payload.success) {
          state.successMessages.allocating = action.payload.message || 'Points allocated successfully';
        }
      })
      .addCase(allocatePoints.rejected, (state, action) => {
        state.isLoading.allocating = false;
        state.errors.allocating = action.payload;
      });
    
    // Redeem Points
    builder
      .addCase(redeemPoints.pending, (state) => {
        state.isLoading.redeeming = true;
        state.errors.redeeming = null;
        state.successMessages.redeeming = null;
      })
      .addCase(redeemPoints.fulfilled, (state, action) => {
        state.isLoading.redeeming = false;
        if (action.payload.success) {
          state.successMessages.redeeming = action.payload.message || 'Points redeemed successfully';
        }
      })
      .addCase(redeemPoints.rejected, (state, action) => {
        state.isLoading.redeeming = false;
        state.errors.redeeming = action.payload;
      });
    
    // Update User Points
    builder
      .addCase(updateUserPoints.pending, (state) => {
        state.isLoading.updating = true;
        state.errors.updating = null;
        state.successMessages.updating = null;
      })
      .addCase(updateUserPoints.fulfilled, (state, action) => {
        state.isLoading.updating = false;
        if (action.payload.success) {
          state.successMessages.updating = action.payload.message || 'User points updated successfully';
          // Update the user in the users array
          const updatedUser = action.payload.data;
          const userIndex = state.users.findIndex(user => user._id === updatedUser._id);
          if (userIndex !== -1) {
            state.users[userIndex] = updatedUser;
          }
        }
      })
      .addCase(updateUserPoints.rejected, (state, action) => {
        state.isLoading.updating = false;
        state.errors.updating = action.payload;
      });
    
    // Delete User Points
    builder
      .addCase(deleteUserPoints.pending, (state) => {
        state.isLoading.deleting = true;
        state.errors.deleting = null;
        state.successMessages.deleting = null;
      })
      .addCase(deleteUserPoints.fulfilled, (state, action) => {
        state.isLoading.deleting = false;
        if (action.payload.data.success) {
          state.successMessages.deleting = action.payload.data.message || 'User points deleted successfully';
          // Remove the user from the users array
          state.users = state.users.filter(user => user._id !== action.payload.userId);
        }
      })
      .addCase(deleteUserPoints.rejected, (state, action) => {
        state.isLoading.deleting = false;
        state.errors.deleting = action.payload;
      });
    
    // Fetch User Points History
    builder
      .addCase(fetchUserPointsHistory.pending, (state) => {
        state.isLoading.history = true;
        state.errors.history = null;
      })
      .addCase(fetchUserPointsHistory.fulfilled, (state, action) => {
        state.isLoading.history = false;
        if (action.payload.success && action.payload.data) {
          state.userPointsHistory = action.payload.data.transactions || [];
        }
      })
      .addCase(fetchUserPointsHistory.rejected, (state, action) => {
        state.isLoading.history = false;
        state.errors.history = action.payload;
      });
  }
});

// Export actions
export const {
  clearError,
  clearSuccessMessage,
  setCurrentUser,
  updatePagination,
  resetPointsState
} = pointsSlice.actions;

// Selectors
export const selectPointsSummary = (state) => state.points.summary;
export const selectSystemConfig = (state) => state.points.systemConfig;
export const selectUsersWithPoints = (state) => state.points.users;
export const selectCurrentUser = (state) => state.points.currentUser;
export const selectUserPointsHistory = (state) => state.points.userPointsHistory;
export const selectPagination = (state) => state.points.pagination;
export const selectPointsLoading = (state) => state.points.isLoading;
export const selectPointsErrors = (state) => state.points.errors;
export const selectPointsSuccessMessages = (state) => state.points.successMessages;

// Export reducer
export default pointsSlice.reducer;
