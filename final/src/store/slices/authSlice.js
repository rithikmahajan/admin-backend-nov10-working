import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { authAPI } from '../../api/endpoints';
import { apiCall } from '../../api/utils';

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const result = await apiCall(authAPI.login, credentials);
      if (result.success) {
        // Store token in localStorage
        console.log('🔐 loginUser - Storing tokens and user data');
        console.log('🔐 loginUser - User data:', { ...result.data.user, password: '[HIDDEN]' });
        
        localStorage.setItem('authToken', result.data.token);
        
        // For admin users, also store as adminToken for compatibility
        if (result.data.user && result.data.user.isAdmin) {
          console.log('👑 loginUser - Admin user detected, storing admin tokens');
          localStorage.setItem('adminToken', result.data.token);
          localStorage.setItem('token', result.data.token); // fallback
        }
        
        localStorage.setItem('userData', JSON.stringify(result.data.user));
        console.log('✅ loginUser - All data stored successfully');
        return result.data;
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const result = await apiCall(authAPI.register, userData);
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await apiCall(authAPI.logout);
      // Clear localStorage - all token variants
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      localStorage.removeItem('cartData');
      localStorage.removeItem('wishlistData');
      return true;
    } catch (error) {
      // Even if API call fails, clear local data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('cartData');
      localStorage.removeItem('wishlistData');
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async (otpData, { rejectWithValue }) => {
    try {
      const result = await apiCall(authAPI.verifyOTP, otpData);
      if (result.success) {
        if (result.data.token) {
          localStorage.setItem('authToken', result.data.token);
          localStorage.setItem('userData', JSON.stringify(result.data.user));
        }
        return result.data;
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'OTP verification failed');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const result = await apiCall(authAPI.forgotPassword, email);
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Password reset failed');
    }
  }
);

export const resendOTP = createAsyncThunk(
  'auth/resendOTP',
  async (phoneNumber, { rejectWithValue }) => {
    try {
      const result = await apiCall(authAPI.resendOTP, phoneNumber);
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Resend OTP failed');
    }
  }
);

// Generate OTP for phone number
export const generateOTP = createAsyncThunk(
  'auth/generateOTP',
  async (phoneNumber, { rejectWithValue }) => {
    try {
      const result = await apiCall(authAPI.generateOTP, phoneNumber);
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to generate OTP');
    }
  }
);

// Login with phone and OTP
export const loginWithOTP = createAsyncThunk(
  'auth/loginWithOTP',
  async ({ phoneNumber, otp }, { rejectWithValue }) => {
    try {
      const result = await apiCall(authAPI.verifyOTP, { phoneNumber, otp });
      if (result.success) {
        // Store token and user data
        localStorage.setItem('authToken', result.data.token);
        
        // For admin users, also store as adminToken for compatibility
        if (result.data.user && result.data.user.isAdmin) {
          localStorage.setItem('adminToken', result.data.token);
          localStorage.setItem('token', result.data.token); // fallback
        }
        
        localStorage.setItem('userData', JSON.stringify(result.data.user));
        return result.data;
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'OTP login failed');
    }
  }
);

// Firebase OTP verification
export const verifyFirebaseOTP = createAsyncThunk(
  'auth/verifyFirebaseOTP',
  async ({ idToken, phoneNumber }, { rejectWithValue }) => {
    try {
      const result = await apiCall(authAPI.verifyFirebaseOTP, { idToken, phoneNumber });
      if (result.success) {
        localStorage.setItem('authToken', result.data.token);
        localStorage.setItem('userData', JSON.stringify(result.data.user));
        return result.data;
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Firebase OTP verification failed');
    }
  }
);

// Dynamic token verification using backend endpoint
export const verifyTokenAndFetchUser = createAsyncThunk(
  'auth/verifyTokenAndFetchUser',
  async (token, { rejectWithValue }) => {
    try {
      console.log('🔍 Verifying token dynamically...');
      
      // Set up axios instance with the token
      const axiosInstance = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Use an authenticated endpoint to verify token validity
      // This endpoint requires valid JWT token with user info
      const response = await axiosInstance.get('/auth/totalUsersCount');
      
      if (response.data && response.data.success) {
        console.log('✅ Token verification successful');
        
        // Since the token is valid, we can decode it to get user info
        // JWT tokens contain user data in their payload
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('🔍 Decoded token payload:', payload);
            
            return {
              user: {
                _id: payload._id,
                name: payload.name || 'Admin User',
                phNo: payload.phNo,
                isAdmin: payload.isAdmin || false,
                email: payload.email || 'admin@yoraa.com',
                isVerified: payload.isVerified || true
              },
              token: token,
              isAuthenticated: true,
              userType: payload.isAdmin ? 'admin' : 'user'
            };
          }
        } catch (decodeError) {
          console.error('❌ Error decoding token:', decodeError);
        }
        
        // Fallback if token decode fails but verification succeeded
        return {
          user: {
            _id: 'admin',
            name: 'Admin User',
            phNo: '7006114695',
            isAdmin: true,
            email: 'admin@yoraa.com',
            isVerified: true
          },
          token: token,
          isAuthenticated: true,
          userType: 'admin'
        };
      }
      
      throw new Error('Token verification failed');
      
    } catch (error) {
      console.error('❌ Token verification error:', error);
      return rejectWithValue(error.response?.data?.message || 'Token verification failed');
    }
  }
);

// Restore authentication from storage with dynamic verification
export const restoreAuthFromStorage = createAsyncThunk(
  'auth/restoreFromStorage',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      console.log('🔍 restoreAuthFromStorage called');
      
      // Check what's available in localStorage
      const adminToken = localStorage.getItem('adminToken');
      const authToken = localStorage.getItem('authToken');
      const tokenFallback = localStorage.getItem('token');
      const userData = localStorage.getItem('userData');
      
      console.log('🔍 Available tokens:', {
        adminToken: !!adminToken,
        authToken: !!authToken,
        tokenFallback: !!tokenFallback
      });
      console.log('🔍 userData exists:', !!userData);

      // Try to get any available token
      const token = adminToken || authToken || tokenFallback;
      
      if (!token) {
        console.log('❌ No token found, user not authenticated');
        return rejectWithValue('No token found');
      }

      // If we have userData in storage, try to use it but verify the token
      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          console.log('📦 Found stored userData, verifying token...');
          
          // Verify the token is still valid
          const verificationResult = await dispatch(verifyTokenAndFetchUser(token));
          
          if (verifyTokenAndFetchUser.fulfilled.match(verificationResult)) {
            console.log('✅ Token verified, using stored userData');
            return verificationResult.payload;
          } else {
            console.log('⚠️ Token verification failed, clearing stored data');
            localStorage.removeItem('userData');
          }
        } catch (parseError) {
          console.error('❌ Error parsing userData:', parseError);
          localStorage.removeItem('userData');
        }
      }
      
      // If no userData or verification failed, fetch user data dynamically
      console.log('🔄 No valid userData found, fetching dynamically...');
      const verificationResult = await dispatch(verifyTokenAndFetchUser(token));
      
      if (verifyTokenAndFetchUser.fulfilled.match(verificationResult)) {
        // Store the fetched userData for future use
        localStorage.setItem('userData', JSON.stringify(verificationResult.payload.user));
        return verificationResult.payload;
      } else {
        // Clear invalid tokens
        localStorage.removeItem('adminToken');
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        return rejectWithValue('Authentication failed');
      }
      
    } catch (error) {
      console.error('❌ Error restoring auth:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  otpSent: false,
  otpVerified: false,
  registrationStep: 'initial', // 'initial', 'otp', 'completed'
  passwordResetSent: false,
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAuthState: (state) => {
      state.error = null;
      state.otpSent = false;
      state.otpVerified = false;
      state.registrationStep = 'initial';
      state.passwordResetSent = false;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('userData', JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.otpSent = true;
        state.registrationStep = 'otp';
        // Don't set user as authenticated until OTP is verified
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
        state.otpSent = false;
        state.otpVerified = false;
        state.registrationStep = 'initial';
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        // Still clear auth state even if logout API fails
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      
      // OTP Verification cases
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpVerified = true;
        state.registrationStep = 'completed';
        
        // If token is provided, user is now authenticated
        if (action.payload.token) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
        }
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Forgot Password cases
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.passwordResetSent = true;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Resend OTP cases
      .addCase(resendOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendOTP.fulfilled, (state) => {
        state.isLoading = false;
        state.otpSent = true;
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Generate OTP cases
      .addCase(generateOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpSent = true;
        state.error = null;
      })
      .addCase(generateOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.otpSent = false;
      })
      
      // Login with OTP cases
      .addCase(loginWithOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.otpVerified = true;
        state.error = null;
      })
      .addCase(loginWithOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Firebase OTP cases
      .addCase(verifyFirebaseOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyFirebaseOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.otpVerified = true;
        state.error = null;
      })
      .addCase(verifyFirebaseOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Token verification cases
      .addCase(verifyTokenAndFetchUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyTokenAndFetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(verifyTokenAndFetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      
      // Restore auth cases
      .addCase(restoreAuthFromStorage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(restoreAuthFromStorage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(restoreAuthFromStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
  },
});

// Export actions
export const {
  clearError,
  resetAuthState,
  setUser,
  updateUser,
} = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectOTPSent = (state) => state.auth.otpSent;
export const selectRegistrationStep = (state) => state.auth.registrationStep;

// Export reducer
export default authSlice.reducer;
