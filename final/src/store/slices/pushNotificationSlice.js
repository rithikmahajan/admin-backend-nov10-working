import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { pushNotificationAPI } from '../../api/endpoints';
import { apiCall } from '../../api/utils';

// Initial state for push notifications
const initialState = {
  // Notification form state
  currentNotification: {
    title: '',
    body: '',
    imageUrl: null,
    deepLink: '',
    targetPlatform: 'both', // 'android', 'ios', 'both'
    image: null, // File object for upload
  },
  
  // Scheduled/Stacked notifications
  stackedNotifications: [],
  
  // Notification history
  sentNotifications: [],
  
  // UI state
  isLoading: false,
  isSending: false,
  isUploading: false,
  
  // Error handling
  error: null,
  uploadError: null,
  
  // Success messages
  successMessage: null,
  
  // Filters and pagination
  filters: {
    platform: 'all',
    dateRange: 'all',
    status: 'all',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
};

// Async thunks for push notification actions

// Send push notification immediately
export const sendPushNotification = createAsyncThunk(
  'pushNotification/sendNotification',
  async (notificationData, { rejectWithValue }) => {
    try {
      const response = await apiCall(() => 
        pushNotificationAPI.sendNotification(notificationData)
      );
      
      if (response.success) {
        return {
          notification: notificationData,
          response: response.data || response.response,
          timestamp: new Date().toISOString(),
        };
      } else {
        return rejectWithValue(response.message || 'Failed to send notification');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to send push notification'
      );
    }
  }
);

// Upload notification image
export const uploadNotificationImage = createAsyncThunk(
  'pushNotification/uploadImage',
  async (imageFile, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await apiCall(() => 
        pushNotificationAPI.uploadNotificationImage(formData)
      );
      
      if (response.success) {
        return response.imageUrl;
      } else {
        return rejectWithValue(response.message || 'Failed to upload image');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to upload notification image'
      );
    }
  }
);

// Get notification history
export const fetchNotificationHistory = createAsyncThunk(
  'pushNotification/fetchHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiCall(() => 
        pushNotificationAPI.getNotificationHistory(params)
      );
      
      if (response.success) {
        return response.notifications || response.data || [];
      } else {
        return rejectWithValue(response.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch notification history'
      );
    }
  }
);

// Schedule notification for later
export const scheduleNotification = createAsyncThunk(
  'pushNotification/scheduleNotification',
  async ({ notificationData, scheduleTime }, { rejectWithValue }) => {
    try {
      const response = await apiCall(() => 
        pushNotificationAPI.scheduleNotification({
          ...notificationData,
          scheduleTime,
        })
      );
      
      if (response.success) {
        return {
          ...notificationData,
          scheduleTime,
          id: response.id || Date.now(),
          status: 'scheduled',
        };
      } else {
        return rejectWithValue(response.message || 'Failed to schedule notification');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to schedule notification'
      );
    }
  }
);

// Create push notification slice
const pushNotificationSlice = createSlice({
  name: 'pushNotification',
  initialState,
  reducers: {
    // Update current notification form data
    updateCurrentNotification: (state, action) => {
      state.currentNotification = {
        ...state.currentNotification,
        ...action.payload,
      };
    },
    
    // Reset current notification form
    resetCurrentNotification: (state) => {
      state.currentNotification = initialState.currentNotification;
      state.error = null;
      state.uploadError = null;
      state.successMessage = null;
    },
    
    // Add notification to stack (save for later)
    addToStack: (state, action) => {
      const notification = {
        ...action.payload,
        id: Date.now(),
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
      state.stackedNotifications.push(notification);
    },
    
    // Update stacked notification
    updateStackedNotification: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.stackedNotifications.findIndex(n => n.id === id);
      if (index !== -1) {
        state.stackedNotifications[index] = {
          ...state.stackedNotifications[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    
    // Remove notification from stack
    removeFromStack: (state, action) => {
      const id = action.payload;
      state.stackedNotifications = state.stackedNotifications.filter(n => n.id !== id);
    },
    
    // Clear all stacked notifications
    clearStack: (state) => {
      state.stackedNotifications = [];
    },
    
    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Clear error messages
    clearError: (state) => {
      state.error = null;
      state.uploadError = null;
    },
    
    // Clear success message
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    
    // Set image preview (for UI display)
    setImagePreview: (state, action) => {
      state.currentNotification.image = action.payload;
    },
    
    // Remove image preview
    removeImagePreview: (state) => {
      state.currentNotification.image = null;
      state.currentNotification.imageUrl = null;
    },
  },
  
  extraReducers: (builder) => {
    // Send push notification
    builder
      .addCase(sendPushNotification.pending, (state) => {
        state.isSending = true;
        state.error = null;
      })
      .addCase(sendPushNotification.fulfilled, (state, action) => {
        state.isSending = false;
        state.sentNotifications.unshift(action.payload);
        state.successMessage = 'Notification sent successfully!';
        state.currentNotification = initialState.currentNotification;
      })
      .addCase(sendPushNotification.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload;
      });
    
    // Upload notification image
    builder
      .addCase(uploadNotificationImage.pending, (state) => {
        state.isUploading = true;
        state.uploadError = null;
      })
      .addCase(uploadNotificationImage.fulfilled, (state, action) => {
        state.isUploading = false;
        state.currentNotification.imageUrl = action.payload;
      })
      .addCase(uploadNotificationImage.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadError = action.payload;
      });
    
    // Fetch notification history
    builder
      .addCase(fetchNotificationHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificationHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sentNotifications = action.payload;
      })
      .addCase(fetchNotificationHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // Schedule notification
    builder
      .addCase(scheduleNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(scheduleNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stackedNotifications.push(action.payload);
        state.successMessage = 'Notification scheduled successfully!';
      })
      .addCase(scheduleNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  updateCurrentNotification,
  resetCurrentNotification,
  addToStack,
  updateStackedNotification,
  removeFromStack,
  clearStack,
  setFilters,
  setPagination,
  clearError,
  clearSuccess,
  setImagePreview,
  removeImagePreview,
} = pushNotificationSlice.actions;

// Selectors
export const selectPushNotification = (state) => state.pushNotification;
export const selectCurrentNotification = (state) => state.pushNotification.currentNotification;
export const selectStackedNotifications = (state) => state.pushNotification.stackedNotifications;
export const selectSentNotifications = (state) => state.pushNotification.sentNotifications;
export const selectNotificationLoading = (state) => state.pushNotification.isLoading;
export const selectNotificationSending = (state) => state.pushNotification.isSending;
export const selectNotificationUploading = (state) => state.pushNotification.isUploading;
export const selectNotificationError = (state) => state.pushNotification.error;
export const selectUploadError = (state) => state.pushNotification.uploadError;
export const selectSuccessMessage = (state) => state.pushNotification.successMessage;

export default pushNotificationSlice.reducer;
