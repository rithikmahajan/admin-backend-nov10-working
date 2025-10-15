import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect } from 'react';
import {
  // Selectors
  selectOrderManagement,
  selectOrders,
  selectOrderDetails,
  selectReturnRequests,
  selectExchangeRequests,
  selectVendors,
  selectOrderStatistics,
  selectOrderFilters,
  selectOrderSorting,
  selectOrderPagination,
  selectOrderLoading,
  selectOrderErrors,
  selectSelectedOrders,
  selectActiveTab,
  selectRealTimeUpdates,
  
  // Actions
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
  addOrderRealTime,
  
    // Async thunks
  fetchAllOrders,
  fetchOrderStatistics,
  updateOrderStatus,
  acceptOrder,
  rejectOrder,
  allotVendor,
  updateCourierStatus,
  processReturnRequest,
  processExchangeRequest,
  fetchOrderDetails,
  bulkUpdateOrders,
  fetchReturnRequests,
  fetchExchangeRequests,
  fetchReturnStats,
  fetchExchangeStats,
  fetchAvailableVendors
} from '../store/slices/orderManagementSlice';

/**
 * Custom hook for order management functionality
 * Provides comprehensive order management capabilities with real-time updates
 */
export const useOrderManagement = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const orderManagement = useSelector(selectOrderManagement);
  const orders = useSelector(selectOrders);
  const orderDetails = useSelector(selectOrderDetails);
  const returnRequests = useSelector(selectReturnRequests);
  const exchangeRequests = useSelector(selectExchangeRequests);
  const vendors = useSelector(selectVendors);
  const statistics = useSelector(selectOrderStatistics);
  const filters = useSelector(selectOrderFilters);
  const sorting = useSelector(selectOrderSorting);
  const pagination = useSelector(selectOrderPagination);
  const loading = useSelector(selectOrderLoading);
  const errors = useSelector(selectOrderErrors);
  const selectedOrders = useSelector(selectSelectedOrders);
  const activeTab = useSelector(selectActiveTab);
  const realTimeUpdates = useSelector(selectRealTimeUpdates);

  // Actions
  const actions = {
    // Filter management
    updateFilters: useCallback((newFilters) => {
      dispatch(updateFilters(newFilters));
    }, [dispatch]),
    
    resetFilters: useCallback(() => {
      dispatch(resetFilters());
    }, [dispatch]),
    
    // Sorting
    updateSortBy: useCallback((sortData) => {
      dispatch(updateSortBy(sortData));
    }, [dispatch]),
    
    // Pagination
    updatePagination: useCallback((paginationData) => {
      dispatch(updatePagination(paginationData));
    }, [dispatch]),
    
    // Selection management
    toggleOrderSelection: useCallback((orderId) => {
      dispatch(toggleOrderSelection(orderId));
    }, [dispatch]),
    
    selectAllOrders: useCallback(() => {
      dispatch(selectAllOrders());
    }, [dispatch]),
    
    deselectAllOrders: useCallback(() => {
      dispatch(deselectAllOrders());
    }, [dispatch]),
    
    toggleBulkActions: useCallback(() => {
      dispatch(toggleBulkActions());
    }, [dispatch]),
    
    // Tab management
    setActiveTab: useCallback((tab) => {
      dispatch(setActiveTab(tab));
    }, [dispatch]),
    
    // Real-time updates
    toggleRealTimeUpdates: useCallback(() => {
      dispatch(toggleRealTimeUpdates());
    }, [dispatch]),
    
    // Clear states
    clearOrderDetails: useCallback(() => {
      dispatch(clearOrderDetails());
    }, [dispatch]),
    
    clearErrors: useCallback((errorType = null) => {
      dispatch(clearErrors(errorType));
    }, [dispatch]),
    
    // Real-time updates
    updateOrderRealTime: useCallback((orderData) => {
      dispatch(updateOrderRealTime(orderData));
    }, [dispatch]),
    
    addOrderRealTime: useCallback((orderData) => {
      dispatch(addOrderRealTime(orderData));
    }, [dispatch])
  };

  // API calls
  const api = {
    // Fetch operations
    fetchAllOrders: useCallback((params = {}) => {
      return dispatch(fetchAllOrders(params));
    }, [dispatch]),
    
    fetchOrderStatistics: useCallback(() => {
      return dispatch(fetchOrderStatistics());
    }, [dispatch]),
    
    fetchOrderDetails: useCallback((orderId) => {
      return dispatch(fetchOrderDetails(orderId));
    }, [dispatch]),
    
    fetchReturnRequests: useCallback((params = {}) => {
      return dispatch(fetchReturnRequests(params));
    }, [dispatch]),
    
    fetchExchangeRequests: useCallback((params = {}) => {
      return dispatch(fetchExchangeRequests(params));
    }, [dispatch]),
    
    fetchAvailableVendors: useCallback(() => {
      return dispatch(fetchAvailableVendors());
    }, [dispatch]),
    
    fetchReturnStats: useCallback(() => {
      return dispatch(fetchReturnStats());
    }, [dispatch]),
    
    fetchExchangeStats: useCallback(() => {
      return dispatch(fetchExchangeStats());
    }, [dispatch]),
    
    // Order management operations
    updateOrderStatus: useCallback((orderId, status, notes = '') => {
      return dispatch(updateOrderStatus({ orderId, status, notes }));
    }, [dispatch]),
    
    acceptOrder: useCallback((orderId, notes = '') => {
      return dispatch(acceptOrder({ orderId, notes }));
    }, [dispatch]),
    
    rejectOrder: useCallback((orderId, reason, notes = '') => {
      return dispatch(rejectOrder({ orderId, reason, notes }));
    }, [dispatch]),
    
    allotVendor: useCallback((orderId, vendorId, notes = '') => {
      return dispatch(allotVendor({ orderId, vendorId, notes }));
    }, [dispatch]),
    
    updateCourierStatus: useCallback((orderId, courierStatus, trackingId = '') => {
      return dispatch(updateCourierStatus({ orderId, courierStatus, trackingId }));
    }, [dispatch]),
    
    // Return and exchange operations
    processReturnRequest: useCallback((orderId, returnId, action, reason = '', notes = '') => {
      return dispatch(processReturnRequest({ orderId, returnId, action, reason, notes }));
    }, [dispatch]),
    
    processExchangeRequest: useCallback((orderId, exchangeId, action, reason = '', notes = '') => {
      return dispatch(processExchangeRequest({ orderId, exchangeId, action, reason, notes }));
    }, [dispatch]),
    
    // Bulk operations
    bulkUpdateOrders: useCallback((orderIds, action, data = {}) => {
      return dispatch(bulkUpdateOrders({ orderIds, action, data }));
    }, [dispatch]),

    // Shiprocket API operations
    createShipment: useCallback(async (orderId) => {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}/shipment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
      } catch (error) {
        throw error;
      }
    }, []),

    trackShipment: useCallback(async (orderId) => {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}/track`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
      } catch (error) {
        throw error;
      }
    }, []),

    generateAWB: useCallback(async (orderId) => {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}/awb`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
      } catch (error) {
        throw error;
      }
    }, []),

    getShippingLabel: useCallback(async (orderId) => {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}/label`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
      } catch (error) {
        throw error;
      }
    }, []),

    // Get available status options from backend
    getStatusOptions: useCallback(async () => {
      try {
        const response = await fetch('/api/admin/orders/status-options', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.statusOptions || ['pending', 'accepted', 'rejected', 'processing', 'shipped', 'delivered', 'cancelled'];
      } catch (error) {
        // Return default options if API fails
        return ['pending', 'accepted', 'rejected', 'processing', 'shipped', 'delivered', 'cancelled'];
      }
    }, []),

    // Get available shipping status options from backend
    getShippingStatusOptions: useCallback(async () => {
      try {
        const response = await fetch('/api/admin/orders/shipping-status-options', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.shippingStatusOptions || ['PENDING', 'PROCESSING', 'SHIPPED', 'RETRYING', 'FAILED', 'AWB_FAILED', 'In Transit', 'Delivered', 'Cancelled'];
      } catch (error) {
        // Return default options if API fails
        return ['PENDING', 'PROCESSING', 'SHIPPED', 'RETRYING', 'FAILED', 'AWB_FAILED', 'In Transit', 'Delivered', 'Cancelled'];
      }
    }, [])
  };

  // Helper functions
  const helpers = {
    // Get order by ID
    getOrderById: useCallback((orderId) => {
      return orders.find(order => order._id === orderId);
    }, [orders]),
    
    // Get orders by status
    getOrdersByStatus: useCallback((status) => {
      return orders.filter(order => order.status === status);
    }, [orders]),
    
    // Get filtered orders
    getFilteredOrders: useCallback(() => {
      let filteredOrders = [...orders];
      
      // Apply filters
      if (filters.status) {
        filteredOrders = filteredOrders.filter(order => order.status === filters.status);
      }
      
      if (filters.paymentStatus) {
        filteredOrders = filteredOrders.filter(order => order.paymentStatus === filters.paymentStatus);
      }
      
      if (filters.vendorAssigned !== '') {
        const hasVendor = filters.vendorAssigned === 'true';
        filteredOrders = filteredOrders.filter(order => 
          hasVendor ? order.vendorAllotted : !order.vendorAllotted
        );
      }
      
      if (filters.courierStatus) {
        filteredOrders = filteredOrders.filter(order => order.courierStatus === filters.courierStatus);
      }
      
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredOrders = filteredOrders.filter(order => 
          order.orderId?.toLowerCase().includes(query) ||
          order.customerName?.toLowerCase().includes(query) ||
          order.customerEmail?.toLowerCase().includes(query)
        );
      }
      
      if (filters.dateRange.from && filters.dateRange.to) {
        const fromDate = new Date(filters.dateRange.from);
        const toDate = new Date(filters.dateRange.to);
        filteredOrders = filteredOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= fromDate && orderDate <= toDate;
        });
      }
      
      // Apply sorting
      filteredOrders.sort((a, b) => {
        const aValue = a[sorting.field];
        const bValue = b[sorting.field];
        
        if (sorting.order === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      return filteredOrders;
    }, [orders, filters, sorting]),
    
    // Check if order is selected
    isOrderSelected: useCallback((orderId) => {
      return selectedOrders.includes(orderId);
    }, [selectedOrders]),
    
    // Get status color
    getStatusColor: useCallback((status) => {
      const statusColors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'accepted': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800',
        'processing': 'bg-blue-100 text-blue-800',
        'shipped': 'bg-purple-100 text-purple-800',
        'delivered': 'bg-green-500 text-white',
        'cancelled': 'bg-gray-100 text-gray-800',
        'returned': 'bg-orange-100 text-orange-800'
      };
      return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
    }, []),
    
    // Get courier status color
    getCourierStatusColor: useCallback((status) => {
      const courierColors = {
        'pending': 'text-yellow-600',
        'assigned': 'text-blue-600',
        'picked_up': 'text-purple-600',
        'in_transit': 'text-blue-600',
        'out_for_delivery': 'text-orange-600',
        'delivered': 'text-green-600',
        'returned': 'text-red-600',
        'cancelled': 'text-gray-600'
      };
      return courierColors[status?.toLowerCase()] || 'text-gray-600';
    }, []),
    
    // Format date
    formatDate: useCallback((dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }, []),
    
    // Calculate order total
    calculateOrderTotal: useCallback((order) => {
      if (!order || !order.items) return 0;
      return order.items.reduce((total, item) => {
        return total + (item.salePrice * item.quantity);
      }, 0);
    }, [])
  };

  // Auto-refresh when real-time updates are enabled
  useEffect(() => {
    if (realTimeUpdates) {
      const interval = setInterval(() => {
        dispatch(fetchAllOrders({
          page: pagination.currentPage,
          limit: pagination.itemsPerPage,
          ...filters,
          sortBy: sorting.field,
          sortOrder: sorting.order
        }));
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [realTimeUpdates, pagination.currentPage, pagination.itemsPerPage, filters, sorting.field, sorting.order, dispatch]);

  return {
    // State
    orderManagement,
    orders,
    orderDetails,
    returnRequests,
    returns: returnRequests, // Alias for compatibility
    exchangeRequests,
    exchanges: exchangeRequests, // Alias for compatibility
    vendors,
    statistics,
    filters,
    sorting,
    pagination,
    loading,
    errors,
    selectedOrders,
    activeTab,
    realTimeUpdates,
    
    // Direct function exports for component compatibility
    getAllReturns: api.fetchReturnRequests,
    getReturnStats: api.fetchReturnStats,
    getAllExchanges: api.fetchExchangeRequests,
    getExchangeStats: api.fetchExchangeStats,
    updateReturnStatus: api.processReturnRequest,
    updateExchangeStatus: api.processExchangeRequest,
    
    // Actions
    actions,
    
    // API calls
    api,
    
    // Helpers
    helpers
  };
};

export default useOrderManagement;
