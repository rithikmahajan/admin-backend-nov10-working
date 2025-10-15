import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { settingsAPI } from '../../api/endpoints';

// Async thunks for API calls
export const fetchUserSettings = createAsyncThunk(
  'settings/fetchUserSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.getAllSettings();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch settings'
      );
    }
  }
);

export const updateUserSettings = createAsyncThunk(
  'settings/updateUserSettings',
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.updateSettings(settingsData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update settings'
      );
    }
  }
);

export const fetchSettingCategory = createAsyncThunk(
  'settings/fetchSettingCategory',
  async (category, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.getSettingCategory(category);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch setting category'
      );
    }
  }
);

export const updateSettingCategory = createAsyncThunk(
  'settings/updateSettingCategory',
  async ({ category, settings }, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.updateSettingCategory(category, settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update setting category'
      );
    }
  }
);

export const toggleSetting = createAsyncThunk(
  'settings/toggleSetting',
  async ({ category, setting }, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.toggleSetting(category, setting, true);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to toggle setting'
      );
    }
  }
);

export const resetSettings = createAsyncThunk(
  'settings/resetSettings',
  async (category = null, { rejectWithValue }) => {
    try {
      const payload = category ? { category } : {};
      const response = await settingsAPI.resetSettings();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to reset settings'
      );
    }
  }
);

export const bulkUpdateSettings = createAsyncThunk(
  'settings/bulkUpdateSettings',
  async (updates, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.bulkUpdateSettings(updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to bulk update settings'
      );
    }
  }
);

export const exportSettings = createAsyncThunk(
  'settings/exportSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.exportSettings();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to export settings'
      );
    }
  }
);

// Communication Preferences specific actions
export const fetchCommunicationPreferences = createAsyncThunk(
  'settings/fetchCommunicationPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.getCommunicationPreferences();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch communication preferences'
      );
    }
  }
);

export const updateCommunicationPreferences = createAsyncThunk(
  'settings/updateCommunicationPreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.updateCommunicationPreferences(preferences);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update communication preferences'
      );
    }
  }
);

export const toggleCommunicationSetting = createAsyncThunk(
  'settings/toggleCommunicationSetting',
  async ({ settingKey, enabled, requiresAuth = false, authData = null }, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.toggleCommunicationSetting(settingKey, enabled);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to toggle communication setting'
      );
    }
  }
);

// Webhook-specific async thunks
export const fetchWebhookSettings = createAsyncThunk(
  'settings/fetchWebhookSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.getWebhookSettings();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch webhook settings'
      );
    }
  }
);

export const updateWebhookSettings = createAsyncThunk(
  'settings/updateWebhookSettings',
  async (webhookData, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.updateWebhookSettings(webhookData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update webhook settings'
      );
    }
  }
);

export const createWebhook = createAsyncThunk(
  'settings/createWebhook',
  async (webhookData, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.createWebhook(webhookData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create webhook'
      );
    }
  }
);

export const updateWebhook = createAsyncThunk(
  'settings/updateWebhook',
  async ({ webhookId, webhookData }, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.updateWebhook(webhookId, webhookData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update webhook'
      );
    }
  }
);

export const deleteWebhook = createAsyncThunk(
  'settings/deleteWebhook',
  async (webhookId, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.deleteWebhook(webhookId);
      return { webhookId, data: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete webhook'
      );
    }
  }
);

export const toggleWebhook = createAsyncThunk(
  'settings/toggleWebhook',
  async (webhookId, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.toggleWebhook(webhookId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to toggle webhook'
      );
    }
  }
);

export const testWebhook = createAsyncThunk(
  'settings/testWebhook',
  async ({ webhookId, testData }, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.testWebhook(webhookId, testData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to test webhook'
      );
    }
  }
);

export const fetchWebhookLogs = createAsyncThunk(
  'settings/fetchWebhookLogs',
  async ({ webhookId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.getWebhookLogs(webhookId, { page, limit });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch webhook logs'
      );
    }
  }
);

// Shipping charges async thunks
export const fetchShippingCharges = createAsyncThunk(
  'settings/fetchShippingCharges',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.getShippingCharges(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch shipping charges'
      );
    }
  }
);

export const createShippingCharge = createAsyncThunk(
  'settings/createShippingCharge',
  async (chargeData, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.createShippingCharge(chargeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create shipping charge'
      );
    }
  }
);

export const updateShippingCharge = createAsyncThunk(
  'settings/updateShippingCharge',
  async ({ chargeId, chargeData }, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.updateShippingCharge(chargeId, chargeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update shipping charge'
      );
    }
  }
);

export const deleteShippingCharge = createAsyncThunk(
  'settings/deleteShippingCharge',
  async (chargeId, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.deleteShippingCharge(chargeId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete shipping charge'
      );
    }
  }
);

export const updateShippingSettings = createAsyncThunk(
  'settings/updateShippingSettings',
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.updateShippingSettings(settingsData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update shipping settings'
      );
    }
  }
);

export const getShippingChargeByLocation = createAsyncThunk(
  'settings/getShippingChargeByLocation',
  async (locationData, { rejectWithValue }) => {
    try {
      const response = await settingsAPI.getShippingChargeByLocation(locationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get shipping charge for location'
      );
    }
  }
);

// Initial state
const initialState = {
  // Loading states
  loading: false,
  categoryLoading: {},
  
  // Settings data
  settings: {
    communicationPreferences: {
      enabled: false,
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
      orderUpdates: true,
      promotionalOffers: false,
    },
    profileVisibility: {
      enabled: false,
      publicProfile: false,
      showEmail: false,
      showPhone: false,
      showAddress: false,
      showOrderHistory: false,
      showWishlist: false,
    },
    locationData: {
      enabled: false,
      trackLocation: false,
      shareWithPartners: false,
      locationAccuracy: 'medium',
      storeLocationHistory: false,
    },
    autoInvoice: {
      enabled: false,
      autoSend: true,
      includePaymentDetails: true,
      sendCopy: false,
      emailTemplate: 'default',
    },
    huggingFaceApi: {
      enabled: false,
      apiKey: '',
      modelPreference: 'general',
      dataSharing: false,
      autoOptimization: true,
    },
    onlineDiscounts: {
      enabled: false,
      autoApplyBest: true,
      stackDiscounts: false,
      memberDiscounts: true,
      seasonalDiscounts: true,
      maxDiscountPercent: 50,
    },
    shippingCharges: {
      enabled: false,
      freeShippingThreshold: 500,
      expeditedShipping: true,
      internationalShipping: false,
      shippingInsurance: false,
      trackingUpdates: true,
    },
    hsnCodes: {
      enabled: false,
      autoAssign: true,
      validateCodes: true,
      updateNotifications: false,
      defaultHsnCode: '',
    },
    userLimits: {
      enabled: false,
      maxOrdersPerDay: 10,
      maxCartItems: 100,
      maxWishlistItems: 50,
      sessionTimeout: 30,
    },
    languageRegion: {
      enabled: false,
      language: 'en',
      region: 'US',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timezone: 'UTC',
    },
    dynamicPricing: {
      enabled: false,
      priceUpdateFrequency: 'daily',
      maxPriceIncrease: 50,
      maxPriceDecrease: 30,
      considerDemand: true,
      considerInventory: true,
      considerCompetitor: false,
    },
    autoNotifications: {
      enabled: false,
      orderConfirmation: true,
      shipmentUpdates: true,
      deliveryConfirmation: true,
      paymentReminders: true,
      stockAlerts: false,
      priceDropAlerts: false,
    },
    webhooks: {
      enabled: false,
      endpoints: [],
      retryAttempts: 3,
      timeoutSeconds: 30,
      enableSigning: true,
      signingSecret: '',
      logWebhooks: true,
      enableRateLimiting: true,
      rateLimit: 100,
    },
  },
  
  // Webhook-specific state
  webhooks: {
    endpoints: [],
    logs: [],
    testResults: {},
    loading: {
      create: false,
      update: false,
      delete: false,
      toggle: false,
      test: false,
      fetchLogs: false,
    },
    errors: {
      create: null,
      update: null,
      delete: null,
      toggle: null,
      test: null,
      fetchLogs: null,
    },
  },

  // Shipping-specific state
  shipping: {
    charges: [],
    generalSettings: {
      freeShippingThreshold: 500,
      expeditedShipping: true,
      internationalShipping: false,
      shippingInsurance: false,
      trackingUpdates: true,
    },
    loading: {
      fetchCharges: false,
      createCharge: false,
      updateCharge: false,
      deleteCharge: false,
      updateSettings: false,
      fetchByLocation: false,
    },
    errors: {
      fetchCharges: null,
      createCharge: null,
      updateCharge: null,
      deleteCharge: null,
      updateSettings: null,
      fetchByLocation: null,
    },
  },
  
  // Metadata
  summary: {
    total: 0,
    enabled: [],
  },
  
  // Error handling
  error: null,
  categoryErrors: {},
  
  // Success states
  lastUpdated: null,
  version: 1,
  
  // Export data
  exportData: null,
};

// Create the slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Local state actions (optimistic updates)
    setLocalSetting: (state, action) => {
      const { category, setting, value } = action.payload;
      if (state.settings[category]) {
        state.settings[category][setting] = value;
      }
    },
    
    setLocalCategorySettings: (state, action) => {
      const { category, settings } = action.payload;
      if (state.settings[category]) {
        state.settings[category] = { ...state.settings[category], ...settings };
      }
    },
    
    toggleLocalSetting: (state, action) => {
      const { category, setting } = action.payload;
      if (state.settings[category] && state.settings[category][setting] !== undefined) {
        state.settings[category][setting] = !state.settings[category][setting];
      }
    },
    
    // Initialize shipping state safely
    initializeShipping: (state) => {
      if (!state.shipping) {
        state.shipping = {
          charges: [],
          generalSettings: {
            freeShippingThreshold: 500,
            expeditedShipping: true,
            internationalShipping: false,
            shippingInsurance: false,
            trackingUpdates: true,
          },
          loading: {
            fetchCharges: false,
            createCharge: false,
            updateCharge: false,
            deleteCharge: false,
            updateSettings: false,
            fetchByLocation: false,
          },
          errors: {
            fetchCharges: null,
            createCharge: null,
            updateCharge: null,
            deleteCharge: null,
            updateSettings: null,
            fetchByLocation: null,
          },
        };
      }
      if (!Array.isArray(state.shipping.charges)) {
        state.shipping.charges = [];
      }
    },

    clearError: (state, action) => {
      if (action.payload) {
        // Clear specific category error
        delete state.categoryErrors[action.payload];
      } else {
        // Clear general error
        state.error = null;
      }
    },
    
    clearAllErrors: (state) => {
      state.error = null;
      state.categoryErrors = {};
    },
    
    clearShippingErrors: (state) => {
      if (state.shipping && state.shipping.errors) {
        state.shipping.errors = {
          fetchCharges: null,
          createCharge: null,
          updateCharge: null,
          deleteCharge: null,
          updateSettings: null,
          fetchByLocation: null,
        };
      }
    },
    
    setCategoryLoading: (state, action) => {
      const { category, loading } = action.payload;
      state.categoryLoading[category] = loading;
    },
    
    clearExportData: (state) => {
      state.exportData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user settings
      .addCase(fetchUserSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserSettings.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.settings = action.payload.data;
          state.summary = action.payload.summary || state.summary;
          state.version = action.payload.data.version || state.version;
          state.lastUpdated = action.payload.data.lastUpdated;
        }
      })
      .addCase(fetchUserSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update user settings
      .addCase(updateUserSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserSettings.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.settings = action.payload.data;
          state.summary = action.payload.summary || state.summary;
          state.version = action.payload.data.version || state.version;
          state.lastUpdated = action.payload.data.lastUpdated;
        }
      })
      .addCase(updateUserSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch setting category
      .addCase(fetchSettingCategory.pending, (state, action) => {
        const category = action.meta.arg;
        state.categoryLoading[category] = true;
        delete state.categoryErrors[category];
      })
      .addCase(fetchSettingCategory.fulfilled, (state, action) => {
        const { category, settings } = action.payload.data;
        state.categoryLoading[category] = false;
        if (state.settings[category]) {
          state.settings[category] = settings;
        }
      })
      .addCase(fetchSettingCategory.rejected, (state, action) => {
        const category = action.meta.arg;
        state.categoryLoading[category] = false;
        state.categoryErrors[category] = action.payload;
      })
      
      // Update setting category
      .addCase(updateSettingCategory.pending, (state, action) => {
        const { category } = action.meta.arg;
        state.categoryLoading[category] = true;
        delete state.categoryErrors[category];
      })
      .addCase(updateSettingCategory.fulfilled, (state, action) => {
        const { category, settings, summary } = action.payload.data;
        state.categoryLoading[category] = false;
        if (state.settings[category]) {
          state.settings[category] = settings;
        }
        if (summary) {
          state.summary = summary;
        }
      })
      .addCase(updateSettingCategory.rejected, (state, action) => {
        const { category } = action.meta.arg;
        state.categoryLoading[category] = false;
        state.categoryErrors[category] = action.payload;
      })
      
      // Toggle setting
      .addCase(toggleSetting.pending, (state, action) => {
        const { category } = action.meta.arg;
        state.categoryLoading[category] = true;
        delete state.categoryErrors[category];
      })
      .addCase(toggleSetting.fulfilled, (state, action) => {
        const { category, setting, newValue, categorySettings } = action.payload.data;
        state.categoryLoading[category] = false;
        if (state.settings[category]) {
          state.settings[category] = categorySettings;
        }
      })
      .addCase(toggleSetting.rejected, (state, action) => {
        const { category } = action.meta.arg;
        state.categoryLoading[category] = false;
        state.categoryErrors[category] = action.payload;
      })
      
      // Reset settings
      .addCase(resetSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetSettings.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          const data = action.payload.data;
          // If resetting all settings
          if (typeof data === 'object' && data.communicationPreferences) {
            state.settings = data;
          } else {
            // If resetting specific category
            Object.keys(data).forEach(category => {
              if (state.settings[category]) {
                state.settings[category] = data[category];
              }
            });
          }
        }
      })
      .addCase(resetSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Bulk update settings
      .addCase(bulkUpdateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkUpdateSettings.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.settings = action.payload.data;
          state.summary = action.payload.summary || state.summary;
          state.version = action.payload.data.version || state.version;
          state.lastUpdated = action.payload.data.lastUpdated;
        }
      })
      .addCase(bulkUpdateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Export settings
      .addCase(exportSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.exportData = action.payload.data;
      })
      .addCase(exportSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Communication Preferences - Fetch
      .addCase(fetchCommunicationPreferences.pending, (state) => {
        state.categoryLoading.communicationPreferences = true;
        state.categoryErrors.communicationPreferences = null;
      })
      .addCase(fetchCommunicationPreferences.fulfilled, (state, action) => {
        state.categoryLoading.communicationPreferences = false;
        if (action.payload.data) {
          state.settings.communicationPreferences = action.payload.data;
        }
      })
      .addCase(fetchCommunicationPreferences.rejected, (state, action) => {
        state.categoryLoading.communicationPreferences = false;
        state.categoryErrors.communicationPreferences = action.payload;
      })
      
      // Communication Preferences - Update
      .addCase(updateCommunicationPreferences.pending, (state) => {
        state.categoryLoading.communicationPreferences = true;
        state.categoryErrors.communicationPreferences = null;
      })
      .addCase(updateCommunicationPreferences.fulfilled, (state, action) => {
        state.categoryLoading.communicationPreferences = false;
        if (action.payload.data) {
          state.settings.communicationPreferences = action.payload.data;
          state.lastUpdated = new Date().toISOString();
        }
      })
      .addCase(updateCommunicationPreferences.rejected, (state, action) => {
        state.categoryLoading.communicationPreferences = false;
        state.categoryErrors.communicationPreferences = action.payload;
      })
      
      // Communication Setting Toggle
      .addCase(toggleCommunicationSetting.pending, (state) => {
        state.categoryLoading.communicationPreferences = true;
        state.categoryErrors.communicationPreferences = null;
      })
      .addCase(toggleCommunicationSetting.fulfilled, (state, action) => {
        state.categoryLoading.communicationPreferences = false;
        const { settingKey, enabled } = action.payload;
        if (state.settings.communicationPreferences) {
          state.settings.communicationPreferences[settingKey] = enabled;
          state.lastUpdated = new Date().toISOString();
        }
      })
      .addCase(toggleCommunicationSetting.rejected, (state, action) => {
        state.categoryLoading.communicationPreferences = false;
        state.categoryErrors.communicationPreferences = action.payload;
      })

      // Webhook Settings
      .addCase(fetchWebhookSettings.pending, (state) => {
        state.categoryLoading.webhooks = true;
        state.categoryErrors.webhooks = null;
      })
      .addCase(fetchWebhookSettings.fulfilled, (state, action) => {
        state.categoryLoading.webhooks = false;
        if (action.payload.data) {
          state.settings.webhooks = action.payload.data;
          state.webhooks.endpoints = action.payload.data.endpoints || [];
        }
      })
      .addCase(fetchWebhookSettings.rejected, (state, action) => {
        state.categoryLoading.webhooks = false;
        state.categoryErrors.webhooks = action.payload;
      })

      // Update Webhook Settings
      .addCase(updateWebhookSettings.pending, (state) => {
        state.categoryLoading.webhooks = true;
        state.categoryErrors.webhooks = null;
      })
      .addCase(updateWebhookSettings.fulfilled, (state, action) => {
        state.categoryLoading.webhooks = false;
        if (action.payload.data) {
          state.settings.webhooks = action.payload.data;
        }
      })
      .addCase(updateWebhookSettings.rejected, (state, action) => {
        state.categoryLoading.webhooks = false;
        state.categoryErrors.webhooks = action.payload;
      })

      // Create Webhook
      .addCase(createWebhook.pending, (state) => {
        state.webhooks.loading.create = true;
        state.webhooks.errors.create = null;
      })
      .addCase(createWebhook.fulfilled, (state, action) => {
        state.webhooks.loading.create = false;
        if (action.payload.data) {
          state.webhooks.endpoints.push(action.payload.data);
          // Also update the settings.webhooks.endpoints
          state.settings.webhooks.endpoints = state.webhooks.endpoints;
        }
      })
      .addCase(createWebhook.rejected, (state, action) => {
        state.webhooks.loading.create = false;
        state.webhooks.errors.create = action.payload;
      })

      // Update Webhook
      .addCase(updateWebhook.pending, (state) => {
        state.webhooks.loading.update = true;
        state.webhooks.errors.update = null;
      })
      .addCase(updateWebhook.fulfilled, (state, action) => {
        state.webhooks.loading.update = false;
        if (action.payload.data) {
          const index = state.webhooks.endpoints.findIndex(
            webhook => webhook._id === action.payload.data._id
          );
          if (index !== -1) {
            state.webhooks.endpoints[index] = action.payload.data;
            state.settings.webhooks.endpoints = state.webhooks.endpoints;
          }
        }
      })
      .addCase(updateWebhook.rejected, (state, action) => {
        state.webhooks.loading.update = false;
        state.webhooks.errors.update = action.payload;
      })

      // Delete Webhook
      .addCase(deleteWebhook.pending, (state) => {
        state.webhooks.loading.delete = true;
        state.webhooks.errors.delete = null;
      })
      .addCase(deleteWebhook.fulfilled, (state, action) => {
        state.webhooks.loading.delete = false;
        const { webhookId } = action.payload;
        state.webhooks.endpoints = state.webhooks.endpoints.filter(
          webhook => webhook._id !== webhookId
        );
        state.settings.webhooks.endpoints = state.webhooks.endpoints;
      })
      .addCase(deleteWebhook.rejected, (state, action) => {
        state.webhooks.loading.delete = false;
        state.webhooks.errors.delete = action.payload;
      })

      // Toggle Webhook
      .addCase(toggleWebhook.pending, (state) => {
        state.webhooks.loading.toggle = true;
        state.webhooks.errors.toggle = null;
      })
      .addCase(toggleWebhook.fulfilled, (state, action) => {
        state.webhooks.loading.toggle = false;
        if (action.payload.data) {
          const index = state.webhooks.endpoints.findIndex(
            webhook => webhook._id === action.payload.data._id
          );
          if (index !== -1) {
            state.webhooks.endpoints[index] = action.payload.data;
            state.settings.webhooks.endpoints = state.webhooks.endpoints;
          }
        }
      })
      .addCase(toggleWebhook.rejected, (state, action) => {
        state.webhooks.loading.toggle = false;
        state.webhooks.errors.toggle = action.payload;
      })

      // Test Webhook
      .addCase(testWebhook.pending, (state) => {
        state.webhooks.loading.test = true;
        state.webhooks.errors.test = null;
      })
      .addCase(testWebhook.fulfilled, (state, action) => {
        state.webhooks.loading.test = false;
        if (action.payload.data && action.meta.arg.webhookId) {
          state.webhooks.testResults[action.meta.arg.webhookId] = action.payload.data;
        }
      })
      .addCase(testWebhook.rejected, (state, action) => {
        state.webhooks.loading.test = false;
        state.webhooks.errors.test = action.payload;
      })

      // Fetch Webhook Logs
      .addCase(fetchWebhookLogs.pending, (state) => {
        state.webhooks.loading.fetchLogs = true;
        state.webhooks.errors.fetchLogs = null;
      })
      .addCase(fetchWebhookLogs.fulfilled, (state, action) => {
        state.webhooks.loading.fetchLogs = false;
        if (action.payload.data) {
          state.webhooks.logs = action.payload.data;
        }
      })
      .addCase(fetchWebhookLogs.rejected, (state, action) => {
        state.webhooks.loading.fetchLogs = false;
        state.webhooks.errors.fetchLogs = action.payload;
      })

      // Fetch shipping charges
      .addCase(fetchShippingCharges.pending, (state) => {
        state.shipping.loading.fetchCharges = true;
        state.shipping.errors.fetchCharges = null;
      })
      .addCase(fetchShippingCharges.fulfilled, (state, action) => {
        state.shipping.loading.fetchCharges = false;
        if (action.payload.data) {
          state.shipping.charges = Array.isArray(action.payload.data) ? action.payload.data : [];
        }
      })
      .addCase(fetchShippingCharges.rejected, (state, action) => {
        state.shipping.loading.fetchCharges = false;
        state.shipping.errors.fetchCharges = action.payload;
      })

      // Create shipping charge
      .addCase(createShippingCharge.pending, (state) => {
        state.shipping.loading.createCharge = true;
        state.shipping.errors.createCharge = null;
      })
      .addCase(createShippingCharge.fulfilled, (state, action) => {
        state.shipping.loading.createCharge = false;
        if (action.payload.data) {
          // Ensure charges is initialized as array
          if (!Array.isArray(state.shipping.charges)) {
            state.shipping.charges = [];
          }
          state.shipping.charges.push(action.payload.data);
        }
      })
      .addCase(createShippingCharge.rejected, (state, action) => {
        state.shipping.loading.createCharge = false;
        state.shipping.errors.createCharge = action.payload;
      })

      // Update shipping charge
      .addCase(updateShippingCharge.pending, (state) => {
        state.shipping.loading.updateCharge = true;
        state.shipping.errors.updateCharge = null;
      })
      .addCase(updateShippingCharge.fulfilled, (state, action) => {
        state.shipping.loading.updateCharge = false;
        if (action.payload.data && Array.isArray(state.shipping.charges)) {
          const index = state.shipping.charges.findIndex(
            charge => charge._id === action.payload.data._id
          );
          if (index !== -1) {
            state.shipping.charges[index] = action.payload.data;
          }
        }
      })
      .addCase(updateShippingCharge.rejected, (state, action) => {
        state.shipping.loading.updateCharge = false;
        state.shipping.errors.updateCharge = action.payload;
      })

      // Delete shipping charge
      .addCase(deleteShippingCharge.pending, (state) => {
        state.shipping.loading.deleteCharge = true;
        state.shipping.errors.deleteCharge = null;
      })
      .addCase(deleteShippingCharge.fulfilled, (state, action) => {
        state.shipping.loading.deleteCharge = false;
        if (action.meta.arg && Array.isArray(state.shipping.charges)) { // chargeId from the request
          state.shipping.charges = state.shipping.charges.filter(
            charge => charge._id !== action.meta.arg
          );
        }
      })
      .addCase(deleteShippingCharge.rejected, (state, action) => {
        state.shipping.loading.deleteCharge = false;
        state.shipping.errors.deleteCharge = action.payload;
      })

      // Update shipping settings
      .addCase(updateShippingSettings.pending, (state) => {
        state.shipping.loading.updateSettings = true;
        state.shipping.errors.updateSettings = null;
      })
      .addCase(updateShippingSettings.fulfilled, (state, action) => {
        state.shipping.loading.updateSettings = false;
        if (action.payload.data) {
          state.shipping.generalSettings = { ...state.shipping.generalSettings, ...action.payload.data };
        }
      })
      .addCase(updateShippingSettings.rejected, (state, action) => {
        state.shipping.loading.updateSettings = false;
        state.shipping.errors.updateSettings = action.payload;
      })

      // Get shipping charge by location
      .addCase(getShippingChargeByLocation.pending, (state) => {
        state.shipping.loading.fetchByLocation = true;
        state.shipping.errors.fetchByLocation = null;
      })
      .addCase(getShippingChargeByLocation.fulfilled, (state, action) => {
        state.shipping.loading.fetchByLocation = false;
        // This doesn't update the state directly as it's meant for lookup
      })
      .addCase(getShippingChargeByLocation.rejected, (state, action) => {
        state.shipping.loading.fetchByLocation = false;
        state.shipping.errors.fetchByLocation = action.payload;
      });
  },
});

export const {
  setLocalSetting,
  setLocalCategorySettings,
  toggleLocalSetting,
  initializeShipping,
  clearError,
  clearAllErrors,
  clearShippingErrors,
  setCategoryLoading,
  clearExportData,
} = settingsSlice.actions;

export default settingsSlice.reducer;

// Selectors
export const selectSettings = (state) => state.settings.settings;
export const selectSettingsLoading = (state) => state.settings.loading;
export const selectSettingsError = (state) => state.settings.error;
export const selectSettingsSummary = (state) => state.settings.summary;
export const selectSettingCategory = (category) => (state) => 
  state.settings.settings[category];
export const selectCategoryLoading = (category) => (state) => 
  state.settings.categoryLoading[category] || false;
export const selectCategoryError = (category) => (state) => 
  state.settings.categoryErrors[category];
export const selectExportData = (state) => state.settings.exportData;

// Communication Preferences specific selectors
export const selectCommunicationPreferences = (state) => 
  state.settings.settings.communicationPreferences;
export const selectCommunicationPreferencesLoading = (state) => 
  state.settings.categoryLoading.communicationPreferences || false;

// Webhook specific selectors
export const selectWebhookSettings = (state) => 
  state.settings.settings.webhooks;
export const selectWebhookEndpoints = (state) => 
  state.settings.webhooks.endpoints;
export const selectWebhookLogs = (state) => 
  state.settings.webhooks.logs;
export const selectWebhookTestResults = (state) => 
  state.settings.webhooks.testResults;
export const selectWebhookLoading = (state) => 
  state.settings.webhooks.loading;
export const selectWebhookErrors = (state) => 
  state.settings.webhooks.errors;
export const selectWebhookSettingsLoading = (state) => 
  state.settings.categoryLoading.webhooks || false;
export const selectCommunicationPreferencesError = (state) => 
  state.settings.categoryErrors.communicationPreferences;
export const selectCommunicationPreferencesEnabled = (state) => 
  state.settings.settings.communicationPreferences?.enabled || false;

// Shipping specific selectors
export const selectShippingCharges = (state) => 
  state.settings?.shipping?.charges || [];
export const selectShippingGeneralSettings = (state) => 
  state.settings?.shipping?.generalSettings || {};
export const selectShippingLoading = (state) => 
  state.settings?.shipping?.loading || {};
export const selectShippingErrors = (state) => 
  state.settings?.shipping?.errors || {};
export const selectShippingChargesLoading = (state) => 
  state.settings.shipping.loading.fetchCharges;
export const selectShippingCreateLoading = (state) => 
  state.settings.shipping.loading.createCharge;
export const selectShippingUpdateLoading = (state) => 
  state.settings.shipping.loading.updateCharge;
export const selectShippingDeleteLoading = (state) => 
  state.settings.shipping.loading.deleteCharge;
