import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axiosConfig';

// Google Analytics Configuration
const GA_CONFIG = {
  measurementId: 'G-WDLT9BQG8X',
  propertyId: '462361715',
  streamName: 'yoraa',
  streamUrl: 'https://yoraa.in',
  streamId: '1220088647'
};

// ============= ASYNC THUNKS =============

// Fetch real-time analytics data
export const fetchRealTimeAnalytics = createAsyncThunk(
  'googleAnalytics/fetchRealTimeAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/analytics/realtime', {
        params: {
          measurementId: GA_CONFIG.measurementId,
          propertyId: GA_CONFIG.propertyId
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch real-time analytics');
    }
  }
);

// Fetch audience analytics
export const fetchAudienceAnalytics = createAsyncThunk(
  'googleAnalytics/fetchAudienceAnalytics',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await API.get('/analytics/audience', {
        params: {
          measurementId: GA_CONFIG.measurementId,
          propertyId: GA_CONFIG.propertyId,
          startDate,
          endDate
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch audience analytics');
    }
  }
);

// Fetch acquisition analytics (traffic sources)
export const fetchAcquisitionAnalytics = createAsyncThunk(
  'googleAnalytics/fetchAcquisitionAnalytics',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await API.get('/analytics/acquisition', {
        params: {
          measurementId: GA_CONFIG.measurementId,
          propertyId: GA_CONFIG.propertyId,
          startDate,
          endDate
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch acquisition analytics');
    }
  }
);

// Fetch behavior analytics (page views, events)
export const fetchBehaviorAnalytics = createAsyncThunk(
  'googleAnalytics/fetchBehaviorAnalytics',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await API.get('/analytics/behavior', {
        params: {
          measurementId: GA_CONFIG.measurementId,
          propertyId: GA_CONFIG.propertyId,
          startDate,
          endDate
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch behavior analytics');
    }
  }
);

// Fetch conversion analytics (e-commerce data)
export const fetchConversionAnalytics = createAsyncThunk(
  'googleAnalytics/fetchConversionAnalytics',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await API.get('/analytics/conversions', {
        params: {
          measurementId: GA_CONFIG.measurementId,
          propertyId: GA_CONFIG.propertyId,
          startDate,
          endDate
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversion analytics');
    }
  }
);

// Fetch demographics data
export const fetchDemographics = createAsyncThunk(
  'googleAnalytics/fetchDemographics',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await API.get('/analytics/demographics', {
        params: {
          measurementId: GA_CONFIG.measurementId,
          propertyId: GA_CONFIG.propertyId,
          startDate,
          endDate
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch demographics');
    }
  }
);

// Fetch technology data (devices, browsers, OS)
export const fetchTechnologyAnalytics = createAsyncThunk(
  'googleAnalytics/fetchTechnologyAnalytics',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await API.get('/analytics/technology', {
        params: {
          measurementId: GA_CONFIG.measurementId,
          propertyId: GA_CONFIG.propertyId,
          startDate,
          endDate
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch technology analytics');
    }
  }
);

// Fetch custom events and goals
export const fetchCustomEvents = createAsyncThunk(
  'googleAnalytics/fetchCustomEvents',
  async ({ startDate, endDate, eventName }, { rejectWithValue }) => {
    try {
      const response = await API.get('/analytics/events', {
        params: {
          measurementId: GA_CONFIG.measurementId,
          propertyId: GA_CONFIG.propertyId,
          startDate,
          endDate,
          eventName
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch custom events');
    }
  }
);

// Initial state
const initialState = {
  // Configuration
  config: GA_CONFIG,
  
  // Real-time data
  realTimeData: {
    activeUsers: 0,
    pageViews: 0,
    sessions: 0,
    topPages: [],
    topCountries: [],
    topSources: [],
    loading: false,
    error: null,
    lastUpdated: null
  },

  // Audience data
  audienceData: {
    totalUsers: 0,
    newUsers: 0,
    returningUsers: 0,
    sessions: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    pageViewsPerSession: 0,
    usersByDate: [],
    loading: false,
    error: null,
    lastUpdated: null
  },

  // Acquisition data (traffic sources)
  acquisitionData: {
    organicSearch: 0,
    direct: 0,
    socialMedia: 0,
    referral: 0,
    email: 0,
    paidSearch: 0,
    sources: [],
    mediums: [],
    campaigns: [],
    loading: false,
    error: null,
    lastUpdated: null
  },

  // Behavior data
  behaviorData: {
    pageViews: 0,
    uniquePageViews: 0,
    avgTimeOnPage: 0,
    entrances: 0,
    exitRate: 0,
    topPages: [],
    topLandingPages: [],
    topExitPages: [],
    loading: false,
    error: null,
    lastUpdated: null
  },

  // Conversion data (e-commerce)
  conversionData: {
    transactions: 0,
    revenue: 0,
    conversionRate: 0,
    avgOrderValue: 0,
    productRevenue: [],
    topSellingProducts: [],
    goalCompletions: [],
    loading: false,
    error: null,
    lastUpdated: null
  },

  // Demographics
  demographics: {
    ageGroups: [],
    genderBreakdown: [],
    interests: [],
    loading: false,
    error: null,
    lastUpdated: null
  },

  // Technology data
  technologyData: {
    browsers: [],
    operatingSystems: [],
    deviceTypes: [],
    screenResolutions: [],
    mobileDevices: [],
    loading: false,
    error: null,
    lastUpdated: null
  },

  // Custom events
  customEvents: {
    events: [],
    topEvents: [],
    eventsByDate: [],
    loading: false,
    error: null,
    lastUpdated: null
  },

  // Global loading and error states
  loading: false,
  error: null,
  lastFullUpdate: null,
  autoRefresh: false,
  refreshInterval: 30000, // 30 seconds
};

// Google Analytics slice
const googleAnalyticsSlice = createSlice({
  name: 'googleAnalytics',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
      state.realTimeData.error = null;
      state.audienceData.error = null;
      state.acquisitionData.error = null;
      state.behaviorData.error = null;
      state.conversionData.error = null;
      state.demographics.error = null;
      state.technologyData.error = null;
      state.customEvents.error = null;
    },
    
    setAutoRefresh: (state, action) => {
      state.autoRefresh = action.payload;
    },
    
    setRefreshInterval: (state, action) => {
      state.refreshInterval = action.payload;
    },
    
    updateConfig: (state, action) => {
      state.config = { ...state.config, ...action.payload };
    },
    
    resetAnalyticsData: (state) => {
      return { ...initialState, config: state.config };
    }
  },
  extraReducers: (builder) => {
    builder
      // Real-time analytics cases
      .addCase(fetchRealTimeAnalytics.pending, (state) => {
        state.realTimeData.loading = true;
        state.realTimeData.error = null;
      })
      .addCase(fetchRealTimeAnalytics.fulfilled, (state, action) => {
        state.realTimeData.loading = false;
        state.realTimeData = {
          ...state.realTimeData,
          ...action.payload,
          lastUpdated: new Date().toISOString()
        };
      })
      .addCase(fetchRealTimeAnalytics.rejected, (state, action) => {
        state.realTimeData.loading = false;
        state.realTimeData.error = action.payload;
      })
      
      // Audience analytics cases
      .addCase(fetchAudienceAnalytics.pending, (state) => {
        state.audienceData.loading = true;
        state.audienceData.error = null;
      })
      .addCase(fetchAudienceAnalytics.fulfilled, (state, action) => {
        state.audienceData.loading = false;
        state.audienceData = {
          ...state.audienceData,
          ...action.payload,
          lastUpdated: new Date().toISOString()
        };
      })
      .addCase(fetchAudienceAnalytics.rejected, (state, action) => {
        state.audienceData.loading = false;
        state.audienceData.error = action.payload;
      })
      
      // Acquisition analytics cases
      .addCase(fetchAcquisitionAnalytics.pending, (state) => {
        state.acquisitionData.loading = true;
        state.acquisitionData.error = null;
      })
      .addCase(fetchAcquisitionAnalytics.fulfilled, (state, action) => {
        state.acquisitionData.loading = false;
        state.acquisitionData = {
          ...state.acquisitionData,
          ...action.payload,
          lastUpdated: new Date().toISOString()
        };
      })
      .addCase(fetchAcquisitionAnalytics.rejected, (state, action) => {
        state.acquisitionData.loading = false;
        state.acquisitionData.error = action.payload;
      })
      
      // Behavior analytics cases
      .addCase(fetchBehaviorAnalytics.pending, (state) => {
        state.behaviorData.loading = true;
        state.behaviorData.error = null;
      })
      .addCase(fetchBehaviorAnalytics.fulfilled, (state, action) => {
        state.behaviorData.loading = false;
        state.behaviorData = {
          ...state.behaviorData,
          ...action.payload,
          lastUpdated: new Date().toISOString()
        };
      })
      .addCase(fetchBehaviorAnalytics.rejected, (state, action) => {
        state.behaviorData.loading = false;
        state.behaviorData.error = action.payload;
      })
      
      // Conversion analytics cases
      .addCase(fetchConversionAnalytics.pending, (state) => {
        state.conversionData.loading = true;
        state.conversionData.error = null;
      })
      .addCase(fetchConversionAnalytics.fulfilled, (state, action) => {
        state.conversionData.loading = false;
        state.conversionData = {
          ...state.conversionData,
          ...action.payload,
          lastUpdated: new Date().toISOString()
        };
      })
      .addCase(fetchConversionAnalytics.rejected, (state, action) => {
        state.conversionData.loading = false;
        state.conversionData.error = action.payload;
      })
      
      // Demographics cases
      .addCase(fetchDemographics.pending, (state) => {
        state.demographics.loading = true;
        state.demographics.error = null;
      })
      .addCase(fetchDemographics.fulfilled, (state, action) => {
        state.demographics.loading = false;
        state.demographics = {
          ...state.demographics,
          ...action.payload,
          lastUpdated: new Date().toISOString()
        };
      })
      .addCase(fetchDemographics.rejected, (state, action) => {
        state.demographics.loading = false;
        state.demographics.error = action.payload;
      })
      
      // Technology analytics cases
      .addCase(fetchTechnologyAnalytics.pending, (state) => {
        state.technologyData.loading = true;
        state.technologyData.error = null;
      })
      .addCase(fetchTechnologyAnalytics.fulfilled, (state, action) => {
        state.technologyData.loading = false;
        state.technologyData = {
          ...state.technologyData,
          ...action.payload,
          lastUpdated: new Date().toISOString()
        };
      })
      .addCase(fetchTechnologyAnalytics.rejected, (state, action) => {
        state.technologyData.loading = false;
        state.technologyData.error = action.payload;
      })
      
      // Custom events cases
      .addCase(fetchCustomEvents.pending, (state) => {
        state.customEvents.loading = true;
        state.customEvents.error = null;
      })
      .addCase(fetchCustomEvents.fulfilled, (state, action) => {
        state.customEvents.loading = false;
        state.customEvents = {
          ...state.customEvents,
          ...action.payload,
          lastUpdated: new Date().toISOString()
        };
      })
      .addCase(fetchCustomEvents.rejected, (state, action) => {
        state.customEvents.loading = false;
        state.customEvents.error = action.payload;
      });
  },
});

// Export actions
export const {
  clearErrors,
  setAutoRefresh,
  setRefreshInterval,
  updateConfig,
  resetAnalyticsData
} = googleAnalyticsSlice.actions;

// Selectors
export const selectGoogleAnalytics = (state) => state.googleAnalytics;
export const selectRealTimeData = (state) => state.googleAnalytics.realTimeData;
export const selectAudienceData = (state) => state.googleAnalytics.audienceData;
export const selectAcquisitionData = (state) => state.googleAnalytics.acquisitionData;
export const selectBehaviorData = (state) => state.googleAnalytics.behaviorData;
export const selectConversionData = (state) => state.googleAnalytics.conversionData;
export const selectDemographics = (state) => state.googleAnalytics.demographics;
export const selectTechnologyData = (state) => state.googleAnalytics.technologyData;
export const selectCustomEvents = (state) => state.googleAnalytics.customEvents;
export const selectAnalyticsConfig = (state) => state.googleAnalytics.config;
export const selectAnalyticsLoading = (state) => state.googleAnalytics.loading;
export const selectAnalyticsError = (state) => state.googleAnalytics.error;

// Export reducer
export default googleAnalyticsSlice.reducer;
