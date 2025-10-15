import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '../../services/notificationService';

// Async thunks for notification operations
export const uploadNotificationImage = createAsyncThunk(
  'notifications/uploadImage',
  async (imageFile, { rejectWithValue }) => {
    try {
      const result = await notificationService.uploadNotificationImage(imageFile);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendPushNotification = createAsyncThunk(
  'notifications/sendNotification',
  async (notificationData, { rejectWithValue }) => {
    try {
      const result = await notificationService.sendPushNotification(notificationData);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const result = await notificationService.getAllNotifications();
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchNotificationStats = createAsyncThunk(
  'notifications/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const result = await notificationService.getNotificationStats();
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createTestUsers = createAsyncThunk(
  'notifications/createTestUsers',
  async (_, { rejectWithValue }) => {
    try {
      const result = await notificationService.createTestUsers();
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  // Current notification being created
  currentNotification: {
    title: '',
    body: '',
    imageUrl: '',
    deepLink: '',
    platforms: [],
  },
  
  // All notifications
  notifications: [],
  
  // Statistics
  stats: {
    totalSent: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    platformBreakdown: {
      android: 0,
      ios: 0,
      both: 0,
    },
  },
  
  // Loading states
  loading: {
    sending: false,
    uploading: false,
    fetching: false,
    fetchingStats: false,
    creatingTestUsers: false,
  },
  
  // Error states
  errors: {
    sending: null,
    uploading: null,
    fetching: null,
    fetchingStats: null,
    creatingTestUsers: null,
  },
  
  // Success messages
  successMessages: {
    sent: null,
    uploaded: null,
  },
};

// Notification slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Update current notification
    updateCurrentNotification: (state, action) => {
      state.currentNotification = {
        ...state.currentNotification,
        ...action.payload,
      };
    },
    
    // Reset current notification
    resetCurrentNotification: (state) => {
      state.currentNotification = initialState.currentNotification;
    },
    
    // Clear errors
    clearErrors: (state) => {
      state.errors = initialState.errors;
    },
    
    // Clear success messages
    clearSuccessMessages: (state) => {
      state.successMessages = initialState.successMessages;
    },
    
    // Update platform selection
    updatePlatforms: (state, action) => {
      const platform = action.payload;
      const platforms = state.currentNotification.platforms;
      
      if (platforms.includes(platform)) {
        state.currentNotification.platforms = platforms.filter(p => p !== platform);
      } else {
        state.currentNotification.platforms = [...platforms, platform];
      }
    },
    
    // Set image URL
    setImageUrl: (state, action) => {
      state.currentNotification.imageUrl = action.payload;
    },
  },
  
  extraReducers: (builder) => {
    // Upload image
    builder
      .addCase(uploadNotificationImage.pending, (state) => {
        state.loading.uploading = true;
        state.errors.uploading = null;
      })
      .addCase(uploadNotificationImage.fulfilled, (state, action) => {
        state.loading.uploading = false;
        state.currentNotification.imageUrl = action.payload.imageUrl;
        state.successMessages.uploaded = 'Image uploaded successfully';
      })
      .addCase(uploadNotificationImage.rejected, (state, action) => {
        state.loading.uploading = false;
        state.errors.uploading = action.payload;
      });
    
    // Send notification
    builder
      .addCase(sendPushNotification.pending, (state) => {
        state.loading.sending = true;
        state.errors.sending = null;
      })
      .addCase(sendPushNotification.fulfilled, (state, action) => {
        state.loading.sending = false;
        state.successMessages.sent = action.payload.message;
        // Reset current notification after successful send
        state.currentNotification = initialState.currentNotification;
      })
      .addCase(sendPushNotification.rejected, (state, action) => {
        state.loading.sending = false;
        state.errors.sending = action.payload;
      });
    
    // Fetch all notifications
    builder
      .addCase(fetchAllNotifications.pending, (state) => {
        state.loading.fetching = true;
        state.errors.fetching = null;
      })
      .addCase(fetchAllNotifications.fulfilled, (state, action) => {
        state.loading.fetching = false;
        state.notifications = action.payload.notifications;
      })
      .addCase(fetchAllNotifications.rejected, (state, action) => {
        state.loading.fetching = false;
        state.errors.fetching = action.payload;
      });
    
    // Fetch notification stats
    builder
      .addCase(fetchNotificationStats.pending, (state) => {
        state.loading.fetchingStats = true;
        state.errors.fetchingStats = null;
      })
      .addCase(fetchNotificationStats.fulfilled, (state, action) => {
        state.loading.fetchingStats = false;
        state.stats = action.payload.stats;
      })
      .addCase(fetchNotificationStats.rejected, (state, action) => {
        state.loading.fetchingStats = false;
        state.errors.fetchingStats = action.payload;
      });
    
    // Create test users
    builder
      .addCase(createTestUsers.pending, (state) => {
        state.loading.creatingTestUsers = true;
        state.errors.creatingTestUsers = null;
      })
      .addCase(createTestUsers.fulfilled, (state, action) => {
        state.loading.creatingTestUsers = false;
        state.successMessages.sent = action.payload.message;
      })
      .addCase(createTestUsers.rejected, (state, action) => {
        state.loading.creatingTestUsers = false;
        state.errors.creatingTestUsers = action.payload;
      });
  },
});

// Export actions
export const {
  updateCurrentNotification,
  resetCurrentNotification,
  clearErrors,
  clearSuccessMessages,
  updatePlatforms,
  setImageUrl,
} = notificationSlice.actions;

// Export selectors
export const selectCurrentNotification = (state) => state.notifications.currentNotification;
export const selectNotifications = (state) => state.notifications.notifications;
export const selectNotificationStats = (state) => state.notifications.stats;
export const selectLoading = (state) => state.notifications.loading;
export const selectErrors = (state) => state.notifications.errors;
export const selectSuccessMessages = (state) => state.notifications.successMessages;

// Export reducer
export default notificationSlice.reducer;
