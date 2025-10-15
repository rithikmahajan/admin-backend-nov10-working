import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axiosConfig';

// ============= ASYNC THUNKS =============

// Fetch all orders with filters and pagination
export const fetchAllOrders = createAsyncThunk(
  'orderManagement/fetchAllOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/orders', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

// Fetch order statistics
export const fetchOrderStatistics = createAsyncThunk(
  'orderManagement/fetchOrderStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/orders/statistics');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

// Update order status
export const updateOrderStatus = createAsyncThunk(
  'orderManagement/updateOrderStatus',
  async ({ orderId, status, notes }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/admin/orders/${orderId}/status`, { status, notes });
      return { orderId, status, notes, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
    }
  }
);

// Accept order
export const acceptOrder = createAsyncThunk(
  'orderManagement/acceptOrder',
  async ({ orderId, notes }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/admin/orders/${orderId}/accept`, { notes });
      return { orderId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept order');
    }
  }
);

// Reject order
export const rejectOrder = createAsyncThunk(
  'orderManagement/rejectOrder',
  async ({ orderId, reason, notes }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/admin/orders/${orderId}/reject`, { reason, notes });
      return { orderId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject order');
    }
  }
);

// Allot vendor to order
export const allotVendor = createAsyncThunk(
  'orderManagement/allotVendor',
  async ({ orderId, vendorId, notes }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/admin/orders/${orderId}/vendor`, { vendorId, notes });
      return { orderId, vendorId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to allot vendor');
    }
  }
);

// Update courier status
export const updateCourierStatus = createAsyncThunk(
  'orderManagement/updateCourierStatus',
  async ({ orderId, courierStatus, trackingId }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/admin/orders/${orderId}/courier`, { 
        courierStatus, 
        trackingId 
      });
      return { orderId, courierStatus, trackingId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update courier status');
    }
  }
);

// Process return request
export const processReturnRequest = createAsyncThunk(
  'orderManagement/processReturnRequest',
  async ({ orderId, returnId, action, reason, notes }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/admin/orders/${orderId}/returns/${returnId}`, {
        action, // 'accept' or 'reject'
        reason,
        notes
      });
      return { orderId, returnId, action, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process return request');
    }
  }
);

// Process exchange request
export const processExchangeRequest = createAsyncThunk(
  'orderManagement/processExchangeRequest',
  async ({ orderId, exchangeId, action, reason, notes }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/admin/orders/${orderId}/exchanges/${exchangeId}`, {
        action, // 'accept' or 'reject'
        reason,
        notes
      });
      return { orderId, exchangeId, action, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process exchange request');
    }
  }
);

// Fetch return requests
export const fetchReturnRequests = createAsyncThunk(
  'orderManagement/fetchReturnRequests',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/returns', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch return requests');
    }
  }
);

// Fetch exchange requests
export const fetchExchangeRequests = createAsyncThunk(
  'orderManagement/fetchExchangeRequests',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/exchanges', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch exchange requests');
    }
  }
);

// Fetch return stats
export const fetchReturnStats = createAsyncThunk(
  'orderManagement/fetchReturnStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/returns/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch return stats');
    }
  }
);

// Fetch exchange stats
export const fetchExchangeStats = createAsyncThunk(
  'orderManagement/fetchExchangeStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/exchanges/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch exchange stats');
    }
  }
);

// Fetch available vendors
export const fetchAvailableVendors = createAsyncThunk(
  'orderManagement/fetchAvailableVendors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/vendors');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vendors');
    }
  }
);

// Get order details by ID
export const fetchOrderDetails = createAsyncThunk(
  'orderManagement/fetchOrderDetails',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/admin/orders/${orderId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order details');
    }
  }
);

// Bulk operations
export const bulkUpdateOrders = createAsyncThunk(
  'orderManagement/bulkUpdateOrders',
  async ({ orderIds, action, data }, { rejectWithValue }) => {
    try {
      const response = await API.put('/admin/orders/bulk', {
        orderIds,
        action,
        ...data
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to perform bulk operation');
    }
  }
);

// ============= INITIAL STATE =============
const initialState = {
  // Orders data
  orders: [],
  orderDetails: null,
  returnRequests: [],
  returns: [], // Alias for returnRequests
  exchangeRequests: [],
  exchanges: [], // Alias for exchangeRequests
  vendors: [],
  
  // Statistics
  statistics: {
    totalOrders: 0,
    pendingOrders: 0,
    acceptedOrders: 0,
    rejectedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    returnRequests: 0,
    exchangeRequests: 0,
    revenue: 0
  },
  
  // Return and Exchange Statistics
  returnStats: {
    totalReturns: 0,
    pendingReturns: 0,
    approvedReturns: 0,
    rejectedReturns: 0,
    processedReturns: 0
  },
  
  exchangeStats: {
    totalExchanges: 0,
    pendingExchanges: 0,
    approvedExchanges: 0,
    rejectedExchanges: 0,
    processedExchanges: 0
  },
  
  // Filters and pagination
  filters: {
    status: '',
    dateRange: { from: '', to: '' },
    paymentStatus: '',
    vendorAssigned: '',
    courierStatus: '',
    searchQuery: ''
  },
  
  sortBy: {
    field: 'createdAt',
    order: 'desc'
  },
  
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  
  // Loading states
  loading: {
    orders: false,
    orderDetails: false,
    statistics: false,
    returnRequests: false,
    returnStats: false,
    exchangeRequests: false,
    exchangeStats: false,
    vendors: false,
    updating: false,
    accepting: false,
    rejecting: false,
    allottingVendor: false,
    updatingCourier: false,
    processingReturn: false,
    processingExchange: false,
    bulkOperation: false
  },
  
  // Error states
  error: {
    orders: null,
    orderDetails: null,
    statistics: null,
    returnRequests: null,
    returnStats: null,
    exchangeRequests: null,
    exchangeStats: null,
    vendors: null,
    updating: null,
    accepting: null,
    rejecting: null,
    allottingVendor: null,
    updatingCourier: null,
    processingReturn: null,
    processingExchange: null,
    bulkOperation: null
  },
  
  // UI states
  selectedOrders: [],
  showBulkActions: false,
  activeTab: 'orders', // 'orders', 'returns', 'exchanges'
  realTimeUpdates: true,
  lastUpdated: null
};

// ============= SLICE =============
const orderManagementSlice = createSlice({
  name: 'orderManagement',
  initialState,
  reducers: {
    // Filter actions
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1; // Reset to first page when filters change
    },
    
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.currentPage = 1;
    },
    
    // Sorting actions
    updateSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    
    // Pagination actions
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Selection actions
    toggleOrderSelection: (state, action) => {
      const orderId = action.payload;
      const index = state.selectedOrders.indexOf(orderId);
      if (index > -1) {
        state.selectedOrders.splice(index, 1);
      } else {
        state.selectedOrders.push(orderId);
      }
    },
    
    selectAllOrders: (state) => {
      state.selectedOrders = state.orders.map(order => order._id);
    },
    
    deselectAllOrders: (state) => {
      state.selectedOrders = [];
    },
    
    toggleBulkActions: (state) => {
      state.showBulkActions = !state.showBulkActions;
    },
    
    // Tab management
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
      state.selectedOrders = []; // Clear selections when switching tabs
    },
    
    // Real-time updates
    toggleRealTimeUpdates: (state) => {
      state.realTimeUpdates = !state.realTimeUpdates;
    },
    
    // Clear states
    clearOrderDetails: (state) => {
      state.orderDetails = null;
    },
    
    clearErrors: (state, action) => {
      const errorType = action.payload;
      if (errorType) {
        state.error[errorType] = null;
      } else {
        state.error = initialState.error;
      }
    },
    
    // Real-time order update (for websocket integration)
    updateOrderRealTime: (state, action) => {
      const updatedOrder = action.payload;
      const index = state.orders.findIndex(order => order._id === updatedOrder._id);
      if (index > -1) {
        state.orders[index] = { ...state.orders[index], ...updatedOrder };
      }
      state.lastUpdated = new Date().toISOString();
    },
    
    // Add new order in real-time
    addOrderRealTime: (state, action) => {
      const newOrder = action.payload;
      state.orders.unshift(newOrder);
      state.statistics.totalOrders += 1;
      state.statistics.pendingOrders += 1;
      state.lastUpdated = new Date().toISOString();
    }
  },
  
  extraReducers: (builder) => {
    // Fetch all orders
    builder
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading.orders = true;
        state.error.orders = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        console.log('🔍 fetchAllOrders.fulfilled - Full payload:', action.payload);
        console.log('🔍 fetchAllOrders.fulfilled - Payload keys:', Object.keys(action.payload));
        console.log('🔍 fetchAllOrders.fulfilled - Data array:', action.payload.data);
        console.log('🔍 fetchAllOrders.fulfilled - Orders array:', action.payload.orders);
        
        state.loading.orders = false;
        // Fix: Use data instead of orders since backend returns { success: true, data: [...] }
        state.orders = action.payload.data || action.payload.orders || [];
        state.pagination = action.payload.pagination || state.pagination;
        state.lastUpdated = new Date().toISOString();
        
        console.log('🔍 State updated - Orders count:', state.orders.length);
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.payload;
      });

    // Fetch order statistics
    builder
      .addCase(fetchOrderStatistics.pending, (state) => {
        state.loading.statistics = true;
        state.error.statistics = null;
      })
      .addCase(fetchOrderStatistics.fulfilled, (state, action) => {
        state.loading.statistics = false;
        state.statistics = action.payload;
      })
      .addCase(fetchOrderStatistics.rejected, (state, action) => {
        state.loading.statistics = false;
        state.error.statistics = action.payload;
      });

    // Update order status
    builder
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading.updating = true;
        state.error.updating = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading.updating = false;
        const { orderId, status } = action.payload;
        const orderIndex = state.orders.findIndex(order => order._id === orderId);
        if (orderIndex > -1) {
          state.orders[orderIndex].status = status;
          state.orders[orderIndex].lastUpdated = new Date().toISOString();
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading.updating = false;
        state.error.updating = action.payload;
      });

    // Accept order
    builder
      .addCase(acceptOrder.pending, (state) => {
        state.loading.accepting = true;
        state.error.accepting = null;
      })
      .addCase(acceptOrder.fulfilled, (state, action) => {
        state.loading.accepting = false;
        const { orderId } = action.payload;
        const orderIndex = state.orders.findIndex(order => order._id === orderId);
        if (orderIndex > -1) {
          state.orders[orderIndex].status = 'accepted';
          state.orders[orderIndex].acceptedAt = new Date().toISOString();
        }
      })
      .addCase(acceptOrder.rejected, (state, action) => {
        state.loading.accepting = false;
        state.error.accepting = action.payload;
      });

    // Reject order
    builder
      .addCase(rejectOrder.pending, (state) => {
        state.loading.rejecting = true;
        state.error.rejecting = null;
      })
      .addCase(rejectOrder.fulfilled, (state, action) => {
        state.loading.rejecting = false;
        const { orderId } = action.payload;
        const orderIndex = state.orders.findIndex(order => order._id === orderId);
        if (orderIndex > -1) {
          state.orders[orderIndex].status = 'rejected';
          state.orders[orderIndex].rejectedAt = new Date().toISOString();
        }
      })
      .addCase(rejectOrder.rejected, (state, action) => {
        state.loading.rejecting = false;
        state.error.rejecting = action.payload;
      });

    // Allot vendor
    builder
      .addCase(allotVendor.pending, (state) => {
        state.loading.allottingVendor = true;
        state.error.allottingVendor = null;
      })
      .addCase(allotVendor.fulfilled, (state, action) => {
        state.loading.allottingVendor = false;
        const { orderId, vendorId } = action.payload;
        const orderIndex = state.orders.findIndex(order => order._id === orderId);
        if (orderIndex > -1) {
          state.orders[orderIndex].vendorId = vendorId;
          state.orders[orderIndex].vendorAllotted = true;
          state.orders[orderIndex].vendorAllottedAt = new Date().toISOString();
        }
      })
      .addCase(allotVendor.rejected, (state, action) => {
        state.loading.allottingVendor = false;
        state.error.allottingVendor = action.payload;
      });

    // Update courier status
    builder
      .addCase(updateCourierStatus.pending, (state) => {
        state.loading.updatingCourier = true;
        state.error.updatingCourier = null;
      })
      .addCase(updateCourierStatus.fulfilled, (state, action) => {
        state.loading.updatingCourier = false;
        const { orderId, courierStatus, trackingId } = action.payload;
        const orderIndex = state.orders.findIndex(order => order._id === orderId);
        if (orderIndex > -1) {
          state.orders[orderIndex].courierStatus = courierStatus;
          state.orders[orderIndex].trackingId = trackingId;
        }
      })
      .addCase(updateCourierStatus.rejected, (state, action) => {
        state.loading.updatingCourier = false;
        state.error.updatingCourier = action.payload;
      });

    // Fetch return requests
    builder
      .addCase(fetchReturnRequests.pending, (state) => {
        state.loading.returnRequests = true;
        state.error.returnRequests = null;
      })
      .addCase(fetchReturnRequests.fulfilled, (state, action) => {
        state.loading.returnRequests = false;
        state.returnRequests = action.payload.returns || [];
        state.returns = action.payload.returns || []; // Alias for compatibility
      })
      .addCase(fetchReturnRequests.rejected, (state, action) => {
        state.loading.returnRequests = false;
        state.error.returnRequests = action.payload;
      });

    // Fetch exchange requests
    builder
      .addCase(fetchExchangeRequests.pending, (state) => {
        state.loading.exchangeRequests = true;
        state.error.exchangeRequests = null;
      })
      .addCase(fetchExchangeRequests.fulfilled, (state, action) => {
        state.loading.exchangeRequests = false;
        state.exchangeRequests = action.payload.exchanges || [];
        state.exchanges = action.payload.exchanges || []; // Alias for compatibility
      })
      .addCase(fetchExchangeRequests.rejected, (state, action) => {
        state.loading.exchangeRequests = false;
        state.error.exchangeRequests = action.payload;
      });

    // Fetch return stats
    builder
      .addCase(fetchReturnStats.pending, (state) => {
        state.loading.returnStats = true;
        state.error.returnStats = null;
      })
      .addCase(fetchReturnStats.fulfilled, (state, action) => {
        state.loading.returnStats = false;
        state.returnStats = action.payload.stats || {};
      })
      .addCase(fetchReturnStats.rejected, (state, action) => {
        state.loading.returnStats = false;
        state.error.returnStats = action.payload;
      });

    // Fetch exchange stats
    builder
      .addCase(fetchExchangeStats.pending, (state) => {
        state.loading.exchangeStats = true;
        state.error.exchangeStats = null;
      })
      .addCase(fetchExchangeStats.fulfilled, (state, action) => {
        state.loading.exchangeStats = false;
        state.exchangeStats = action.payload.stats || {};
      })
      .addCase(fetchExchangeStats.rejected, (state, action) => {
        state.loading.exchangeStats = false;
        state.error.exchangeStats = action.payload;
      });

    // Fetch available vendors
    builder
      .addCase(fetchAvailableVendors.pending, (state) => {
        state.loading.vendors = true;
        state.error.vendors = null;
      })
      .addCase(fetchAvailableVendors.fulfilled, (state, action) => {
        state.loading.vendors = false;
        state.vendors = action.payload.vendors || [];
      })
      .addCase(fetchAvailableVendors.rejected, (state, action) => {
        state.loading.vendors = false;
        state.error.vendors = action.payload;
      });

    // Fetch order details
    builder
      .addCase(fetchOrderDetails.pending, (state) => {
        state.loading.orderDetails = true;
        state.error.orderDetails = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.loading.orderDetails = false;
        state.orderDetails = action.payload;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.loading.orderDetails = false;
        state.error.orderDetails = action.payload;
      });

    // Process return request
    builder
      .addCase(processReturnRequest.pending, (state) => {
        state.loading.processingReturn = true;
        state.error.processingReturn = null;
      })
      .addCase(processReturnRequest.fulfilled, (state, action) => {
        state.loading.processingReturn = false;
        const { returnId, action: returnAction } = action.payload;
        const returnIndex = state.returnRequests.findIndex(req => req._id === returnId);
        if (returnIndex > -1) {
          state.returnRequests[returnIndex].status = returnAction;
          state.returnRequests[returnIndex].processedAt = new Date().toISOString();
        }
      })
      .addCase(processReturnRequest.rejected, (state, action) => {
        state.loading.processingReturn = false;
        state.error.processingReturn = action.payload;
      });

    // Process exchange request
    builder
      .addCase(processExchangeRequest.pending, (state) => {
        state.loading.processingExchange = true;
        state.error.processingExchange = null;
      })
      .addCase(processExchangeRequest.fulfilled, (state, action) => {
        state.loading.processingExchange = false;
        const { exchangeId, action: exchangeAction } = action.payload;
        const exchangeIndex = state.exchangeRequests.findIndex(req => req._id === exchangeId);
        if (exchangeIndex > -1) {
          state.exchangeRequests[exchangeIndex].status = exchangeAction;
          state.exchangeRequests[exchangeIndex].processedAt = new Date().toISOString();
        }
      })
      .addCase(processExchangeRequest.rejected, (state, action) => {
        state.loading.processingExchange = false;
        state.error.processingExchange = action.payload;
      });

    // Bulk operations
    builder
      .addCase(bulkUpdateOrders.pending, (state) => {
        state.loading.bulkOperation = true;
        state.error.bulkOperation = null;
      })
      .addCase(bulkUpdateOrders.fulfilled, (state, action) => {
        state.loading.bulkOperation = false;
        // Refresh orders after bulk operation
        state.selectedOrders = [];
      })
      .addCase(bulkUpdateOrders.rejected, (state, action) => {
        state.loading.bulkOperation = false;
        state.error.bulkOperation = action.payload;
      });
  }
});

// Export actions
export const {
  updateFilters,
  resetFilters,
  updateSortBy,
  updatePagination,
  toggleOrderSelection,
  selectAllOrders,
  deselectAllOrders,
  toggleBulkActions,
  setActiveTab,
  toggleRealTimeUpdates,
  clearOrderDetails,
  clearErrors,
  updateOrderRealTime,
  addOrderRealTime
} = orderManagementSlice.actions;

// Selectors
export const selectOrderManagement = (state) => state.orderManagement;
export const selectOrders = (state) => state.orderManagement.orders;
export const selectOrderDetails = (state) => state.orderManagement.orderDetails;
export const selectReturnRequests = (state) => state.orderManagement.returnRequests;
export const selectExchangeRequests = (state) => state.orderManagement.exchangeRequests;
export const selectVendors = (state) => state.orderManagement.vendors;
export const selectOrderStatistics = (state) => state.orderManagement.statistics;
export const selectOrderFilters = (state) => state.orderManagement.filters;
export const selectOrderSorting = (state) => state.orderManagement.sortBy;
export const selectOrderPagination = (state) => state.orderManagement.pagination;
export const selectOrderLoading = (state) => state.orderManagement.loading;
export const selectOrderErrors = (state) => state.orderManagement.error;
export const selectSelectedOrders = (state) => state.orderManagement.selectedOrders;
export const selectActiveTab = (state) => state.orderManagement.activeTab;
export const selectRealTimeUpdates = (state) => state.orderManagement.realTimeUpdates;

export default orderManagementSlice.reducer;
