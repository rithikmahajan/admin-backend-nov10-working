import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import environmentConfig from '../../config/environment';

// Backend API endpoints
console.log('🔧 Environment check:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_ADMIN_TOKEN: import.meta.env.VITE_ADMIN_TOKEN,
  NODE_ENV: import.meta.env.NODE_ENV
});

// Use environment configuration instead of hardcoded URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || environmentConfig.apiUrl;
console.log('🔧 Final API_BASE_URL:', API_BASE_URL);

// Get Firebase admin token (different from user JWT tokens)
const getAdminToken = () => {
  // Always use the Firebase admin token from environment or hardcoded fallback
  // Don't use localStorage adminToken as it contains JWT tokens, not the Firebase admin token
  return import.meta.env.VITE_ADMIN_TOKEN || 'admin-token-2024';
};

// Create axios instance with default config
const finalBaseURL = `${API_BASE_URL}/admin/firebase`;
const apiClient = axios.create({
  baseURL: finalBaseURL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('🔧 Final baseURL:', finalBaseURL);

// Add interceptor to include admin token
apiClient.interceptors.request.use((config) => {
  config.headers['x-admin-token'] = getAdminToken();
  return config;
});

// Async thunk to fetch all Firebase users from backend
export const fetchAllUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching Firebase users from backend API...');
      console.log('🔧 Full URL will be:', `${finalBaseURL}/users`);
      console.log('🔑 Admin token:', getAdminToken());
      
      const response = await apiClient.get('/users');
      
      if (response.data.success) {
        console.log(`✅ Successfully fetched ${response.data.count} Firebase users`);
        return response.data.users;
      } else {
        throw new Error(response.data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('❌ Failed to fetch Firebase users:', error);
      
      if (error.response?.status === 403) {
        return rejectWithValue('Admin access required');
      } else if (error.response?.status === 500) {
        return rejectWithValue('Server error - please try again later');
      }
      
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk to block/unblock user
export const updateUserStatus = createAsyncThunk(
  'users/updateStatus',
  async ({ uid, disabled }, { rejectWithValue }) => {
    try {
      console.log(`🔄 ${disabled ? 'Blocking' : 'Unblocking'} user: ${uid}`);
      
      const response = await apiClient.patch(`/users/${uid}/status`, { disabled });
      
      if (response.data.success) {
        console.log(`✅ User ${disabled ? 'blocked' : 'unblocked'} successfully`);
        return { uid, disabled };
      } else {
        throw new Error(response.data.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('❌ Failed to update user status:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk to delete user
export const deleteUser = createAsyncThunk(
  'users/delete',
  async (uid, { rejectWithValue }) => {
    try {
      console.log(`🗑️ Deleting user: ${uid}`);
      
      const response = await apiClient.delete(`/users/${uid}`);
      
      if (response.data.success) {
        console.log(`✅ User deleted successfully`);
        return uid;
      } else {
        throw new Error(response.data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('❌ Failed to delete user:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk to create user
export const createUser = createAsyncThunk(
  'users/create',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('🔄 Creating new user:', userData.email);
      
      const response = await apiClient.post('/users', userData);
      
      if (response.data.success) {
        console.log(`✅ User created successfully`);
        return response.data.user;
      } else {
        throw new Error(response.data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('❌ Failed to create user:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Initial state
const initialState = {
  users: [],
  loading: false,
  error: null,
  totalUsers: 0,
  blockedUsers: 0,
  recentUsers: [],
  userStats: {
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    newUsersThisMonth: 0,
  }
};

// Create the slice
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all users
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        state.totalUsers = action.payload.length;
        state.blockedUsers = action.payload.filter(user => user.disabled).length;
        
        // Calculate stats
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        state.userStats = {
          totalUsers: action.payload.length,
          activeUsers: action.payload.filter(user => !user.disabled).length,
          blockedUsers: action.payload.filter(user => user.disabled).length,
          newUsersThisMonth: action.payload.filter(user => 
            new Date(user.creationTime) >= thisMonth
          ).length,
        };
        
        // Set recent users (last 10)
        state.recentUsers = action.payload
          .sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime))
          .slice(0, 10);
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update user status
      .addCase(updateUserStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.loading = false;
        const { uid, disabled } = action.payload;
        
        // Update user in the array
        const userIndex = state.users.findIndex(user => user.uid === uid);
        if (userIndex !== -1) {
          state.users[userIndex].disabled = disabled;
        }
        
        // Update stats
        state.blockedUsers = state.users.filter(user => user.disabled).length;
        state.userStats.activeUsers = state.users.filter(user => !user.disabled).length;
        state.userStats.blockedUsers = state.blockedUsers;
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        const uid = action.payload;
        
        // Remove user from array
        state.users = state.users.filter(user => user.uid !== uid);
        state.totalUsers = state.users.length;
        
        // Update stats
        state.userStats.totalUsers = state.users.length;
        state.userStats.activeUsers = state.users.filter(user => !user.disabled).length;
        state.userStats.blockedUsers = state.users.filter(user => user.disabled).length;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create user
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        
        // Add new user to array
        const newUser = {
          ...action.payload,
          creationTime: new Date().toISOString(),
          lastSignInTime: null,
          disabled: false
        };
        
        state.users.unshift(newUser);
        state.totalUsers = state.users.length;
        
        // Update stats
        state.userStats.totalUsers = state.users.length;
        state.userStats.activeUsers = state.users.filter(user => !user.disabled).length;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Export actions
export const { clearError, setLoading } = usersSlice.actions;

// Export selectors
export const selectUsers = (state) => state.firebaseUsers.users;
export const selectUsersLoading = (state) => state.firebaseUsers.loading;
export const selectUsersError = (state) => state.firebaseUsers.error;
export const selectUserStats = (state) => state.firebaseUsers.userStats;
export const selectRecentUsers = (state) => state.firebaseUsers.recentUsers;

// Export reducer
export default usersSlice.reducer;
