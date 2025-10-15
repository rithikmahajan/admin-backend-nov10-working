import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Filter,
  Calendar,
  ChevronDown,
  RotateCw,
  Eye,
  Edit,
  Download,
  MoreHorizontal,
  X,
  Printer,
  Scan,
  Share2,
  Check,
  AlertCircle,
  Package,
  Truck,
  User,
  FileText,
  ArrowLeft,
  Search,
  CheckSquare,
  Square,
  Users,
  TrendingUp,
  Clock,
  ShoppingBag,
  DollarSign,
  Plus,
  ExternalLink
} from "lucide-react";
import useOrderManagement from "../hooks/useOrderManagement";

/**
 * Statistics Dashboard Component
 */
const StatisticsDashboard = React.memo(({ statistics, loading }) => {
  const statsData = [
    {
      title: "Total Orders",
      value: statistics.totalOrders || 0,
      icon: ShoppingBag,
      color: "bg-blue-500",
      textColor: "text-blue-600"
    },
    {
      title: "Pending Orders",
      value: statistics.pendingOrders || 0,
      icon: Clock,
      color: "bg-yellow-500",
      textColor: "text-yellow-600"
    },
    {
      title: "Delivered Orders",
      value: statistics.deliveredOrders || 0,
      icon: Check,
      color: "bg-green-500",
      textColor: "text-green-600"
    },
    {
      title: "Total Revenue",
      value: `₹${(statistics.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "bg-purple-500",
      textColor: "text-purple-600"
    }
  ];

  if (loading.statistics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`${stat.color} p-3 rounded-full`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

/**
 * Filters Component
 */
const OrderFilters = React.memo(({ filters, onFiltersChange, onReset, loading }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const paymentStatusOptions = [
    { value: '', label: 'All Payment Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ];

  const courierStatusOptions = [
    { value: '', label: 'All Courier Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search orders..."
            value={filters.searchQuery || ''}
            onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status || ''}
          onChange={(e) => onFiltersChange({ status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Date Range From */}
        <input
          type="date"
          value={filters.dateRange?.from || ''}
          onChange={(e) => onFiltersChange({ 
            dateRange: { ...filters.dateRange, from: e.target.value }
          })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {/* Date Range To */}
        <input
          type="date"
          value={filters.dateRange?.to || ''}
          onChange={(e) => onFiltersChange({ 
            dateRange: { ...filters.dateRange, to: e.target.value }
          })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {/* Advanced Filters */}
        {showAdvanced && (
          <>
            <select
              value={filters.paymentStatus || ''}
              onChange={(e) => onFiltersChange({ paymentStatus: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {paymentStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filters.courierStatus || ''}
              onChange={(e) => onFiltersChange({ courierStatus: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {courierStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filters.vendorAssigned || ''}
              onChange={(e) => onFiltersChange({ vendorAssigned: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Vendor Status</option>
              <option value="true">Vendor Assigned</option>
              <option value="false">No Vendor</option>
            </select>
          </>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Reset Filters
        </button>
        
        <div className="text-sm text-gray-500">
          {loading.orders ? 'Loading...' : 'Filters applied'}
        </div>
      </div>
    </div>
  );
});

/**
 * Order Row Component
 */
const OrderRow = React.memo(({ 
  order, 
  isSelected, 
  onSelect, 
  onViewDetails, 
  onUpdateStatus, 
  onAccept, 
  onReject, 
  onAllotVendor,
  vendors,
  getStatusColor,
  getCourierStatusColor,
  formatDate
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showVendorMenu, setShowVendorMenu] = useState(false);

  const statusOptions = [
    'pending', 'accepted', 'rejected', 'processing', 'shipped', 'delivered', 'cancelled'
  ];

  return (
    <tr className="hover:bg-gray-50 border-b border-gray-200">
      <td className="px-6 py-4">
        <button
          onClick={() => onSelect(order._id)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-blue-600" />
          ) : (
            <Square className="h-5 w-5" />
          )}
        </button>
      </td>
      
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          {order.razorpay_order_id || order._id}
        </div>
        <div className="text-sm text-gray-500">
          {formatDate(order.createdAt)}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center">
          {order.cart?.[0]?.itemId?.image && (
            <img
              src={order.cart[0].itemId.image}
              alt="Product"
              className="h-10 w-10 rounded-full object-cover mr-3"
            />
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">
              {order.user?.displayName || 'N/A'}
            </div>
            <div className="text-sm text-gray-500">
              {order.user?.email}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.order_status)}`}>
          {order.order_status || 'Pending'}
        </span>
      </td>

      <td className="px-6 py-4">
        <span className={`text-sm font-medium ${getCourierStatusColor(order.shipping_status)}`}>
          {order.shipping_status || 'Pending'}
        </span>
      </td>

      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          order.vendorAllotted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {order.vendorAllotted ? 'Assigned' : 'Not Assigned'}
        </span>
      </td>

      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
        ₹{(order.totalAmount || 0).toLocaleString()}
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          {/* View Details */}
          <button
            onClick={() => onViewDetails(order._id)}
            className="text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Accept Order */}
          {order.order_status === 'pending' && (
            <button
              onClick={() => onAccept(order._id)}
              className="text-green-600 hover:text-green-800"
              title="Accept Order"
            >
              <Check className="h-4 w-4" />
            </button>
          )}

          {/* Reject Order */}
          {(order.order_status === 'pending' || order.order_status === 'accepted') && (
            <button
              onClick={() => onReject(order._id)}
              className="text-red-600 hover:text-red-800"
              title="Reject Order"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Allot Vendor */}
          {order.order_status === 'accepted' && !order.vendorAllotted && (
            <div className="relative">
              <button
                onClick={() => setShowVendorMenu(!showVendorMenu)}
                className="text-purple-600 hover:text-purple-800"
                title="Allot Vendor"
              >
                <Users className="h-4 w-4" />
              </button>
              
              {showVendorMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <div className="py-1">
                    {vendors.map(vendor => (
                      <button
                        key={vendor._id}
                        onClick={() => {
                          onAllotVendor(order._id, vendor._id);
                          setShowVendorMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {vendor.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Update */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="text-gray-600 hover:text-gray-800"
              title="Update Status"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            {showStatusMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border">
                <div className="py-1">
                  {statusOptions.map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        onUpdateStatus(order._id, status);
                        setShowStatusMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 capitalize"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
});

/**
 * Bulk Actions Component
 */
const BulkActions = React.memo(({ selectedOrders, onBulkAction, vendors, onClose }) => {
  const [action, setAction] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [status, setStatus] = useState('');

  const handleBulkAction = () => {
    if (!action) return;
    
    const data = {};
    if (action === 'allotVendor' && vendorId) {
      data.vendorId = vendorId;
    }
    if (action === 'updateStatus' && status) {
      data.status = status;
    }
    
    onBulkAction(selectedOrders, action, data);
    onClose();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Bulk Actions ({selectedOrders.length} orders)</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select Action</option>
          <option value="accept">Accept Orders</option>
          <option value="reject">Reject Orders</option>
          <option value="updateStatus">Update Status</option>
          <option value="allotVendor">Allot Vendor</option>
        </select>

        {action === 'updateStatus' && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select Status</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}

        {action === 'allotVendor' && (
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select Vendor</option>
            {vendors.map(vendor => (
              <option key={vendor._id} value={vendor._id}>
                {vendor.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handleBulkAction}
          disabled={!action || (action === 'updateStatus' && !status) || (action === 'allotVendor' && !vendorId)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
    </div>
  );
});

/**
 * Pagination Component
 */
const Pagination = React.memo(({ pagination, onPageChange }) => {
  const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;
  
  const pages = [];
  const maxVisiblePages = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between bg-white px-6 py-3 border-t">
      <div className="text-sm text-gray-500">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 text-sm border rounded ${
              page === currentPage
                ? 'bg-blue-600 text-white border-blue-600'
                : 'hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
});

/**
 * Main Orders Component
 */
const Orders = () => {
  const navigate = useNavigate();
  const {
    // State
    orders,
    orderDetails,
    returnRequests,
    exchangeRequests,
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
    
    // Actions
    actions,
    
    // API calls
    api,
    
    // Helpers
    helpers
  } = useOrderManagement();

  // Local state
  const [showReturnWindow, setShowReturnWindow] = useState(false);
  const [showExchangeWindow, setShowExchangeWindow] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Initialize data on component mount
  useEffect(() => {
    api.fetchAllOrders();
    api.fetchOrderStatistics();
    api.fetchAvailableVendors();
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    actions.updateFilters(newFilters);
    // Fetch orders with new filters
    api.fetchAllOrders({
      ...filters,
      ...newFilters,
      page: 1,
      limit: pagination.itemsPerPage,
      sortBy: sorting.field,
      sortOrder: sorting.order
    });
  }, [actions, api, filters, pagination.itemsPerPage, sorting]);

  // Handle filter reset
  const handleResetFilters = useCallback(() => {
    actions.resetFilters();
    api.fetchAllOrders({
      page: 1,
      limit: pagination.itemsPerPage,
      sortBy: sorting.field,
      sortOrder: sorting.order
    });
  }, [actions, api, pagination.itemsPerPage, sorting]);

  // Handle order actions
  const handleViewDetails = useCallback((orderId) => {
    // Navigate to the dedicated OrderDetails page
    navigate(`/order-details/${orderId}`);
  }, [navigate]);

  const handleAcceptOrder = useCallback(async (orderId) => {
    try {
      await api.acceptOrder(orderId, 'Order accepted by admin');
      // Refresh orders
      api.fetchAllOrders();
      api.fetchOrderStatistics();
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  }, [api]);

  const handleRejectOrder = useCallback(async (orderId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        await api.rejectOrder(orderId, reason, 'Order rejected by admin');
        // Refresh orders
        api.fetchAllOrders();
        api.fetchOrderStatistics();
      } catch (error) {
        console.error('Error rejecting order:', error);
      }
    }
  }, [api]);

  const handleAllotVendor = useCallback(async (orderId, vendorId) => {
    try {
      await api.allotVendor(orderId, vendorId, 'Vendor assigned by admin');
      // Refresh orders
      api.fetchAllOrders();
    } catch (error) {
      console.error('Error allotting vendor:', error);
    }
  }, [api]);

  const handleUpdateStatus = useCallback(async (orderId, status) => {
    try {
      await api.updateOrderStatus(orderId, status, `Status updated to ${status}`);
      // Refresh orders
      api.fetchAllOrders();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }, [api]);

  const handleBulkAction = useCallback(async (orderIds, action, data) => {
    try {
      await api.bulkUpdateOrders(orderIds, action, data);
      actions.deselectAllOrders();
      setShowBulkActions(false);
      // Refresh orders
      api.fetchAllOrders();
      api.fetchOrderStatistics();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  }, [api, actions]);

  const handlePageChange = useCallback((page) => {
    actions.updatePagination({ currentPage: page });
    api.fetchAllOrders({
      ...filters,
      page,
      limit: pagination.itemsPerPage,
      sortBy: sorting.field,
      sortOrder: sorting.order
    });
  }, [actions, api, filters, pagination.itemsPerPage, sorting]);

  const handleTabChange = useCallback((tab) => {
    actions.setActiveTab(tab);
    switch (tab) {
      case 'returns':
        api.fetchReturnRequests();
        break;
      case 'exchanges':
        api.fetchExchangeRequests();
        break;
      default:
        api.fetchAllOrders();
    }
  }, [actions, api]);

  // Get filtered orders
  const filteredOrders = useMemo(() => {
    return helpers.getFilteredOrders();
  }, [helpers]);

  // OrderDetails navigation is now handled by router - removed inline rendering

  if (showReturnWindow) {
    return <ReturnOrders onBack={() => setShowReturnWindow(false)} />;
  }

  if (showExchangeWindow) {
    return <ExchangeOrders onBack={() => setShowExchangeWindow(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600">Manage all your orders, returns, and exchanges</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => actions.toggleRealTimeUpdates()}
              className={`px-4 py-2 rounded-lg font-medium ${
                realTimeUpdates
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              <RotateCw className={`h-4 w-4 inline mr-2 ${realTimeUpdates ? 'animate-spin' : ''}`} />
              Real-time: {realTimeUpdates ? 'ON' : 'OFF'}
            </button>
            
            <button
              onClick={() => api.fetchAllOrders()}
              disabled={loading.orders}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RotateCw className={`h-4 w-4 inline mr-2 ${loading.orders ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <StatisticsDashboard statistics={statistics} loading={loading} />

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'orders', label: 'Orders', count: statistics.totalOrders },
                { id: 'returns', label: 'Returns', count: statistics.returnRequests },
                { id: 'exchanges', label: 'Exchanges', count: statistics.exchangeRequests }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-900 rounded-full px-2 py-1 text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Filters */}
        {activeTab === 'orders' && (
          <OrderFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
            loading={loading}
          />
        )}

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && !showBulkActions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">
                {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowBulkActions(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Bulk Actions
                </button>
                <button
                  onClick={() => actions.deselectAllOrders()}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {showBulkActions && (
          <div className="mb-6">
            <BulkActions
              selectedOrders={selectedOrders}
              onBulkAction={handleBulkAction}
              vendors={vendors}
              onClose={() => setShowBulkActions(false)}
            />
          </div>
        )}

        {/* Error Display */}
        {errors.orders && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{errors.orders}</span>
              <button
                onClick={() => actions.clearErrors('orders')}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Orders Table */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => selectedOrders.length === orders.length 
                          ? actions.deselectAllOrders() 
                          : actions.selectAllOrders()
                        }
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {selectedOrders.length === orders.length ? (
                          <CheckSquare className="h-5 w-5" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Courier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading.orders ? (
                    // Loading rows
                    [...Array(5)].map((_, index) => (
                      <tr key={index} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-4"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </td>
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No orders found</p>
                        <p className="text-sm">Try adjusting your search or filter criteria</p>
                      </td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <OrderRow
                        key={order._id}
                        order={order}
                        isSelected={helpers.isOrderSelected(order._id)}
                        onSelect={actions.toggleOrderSelection}
                        onViewDetails={handleViewDetails}
                        onUpdateStatus={handleUpdateStatus}
                        onAccept={handleAcceptOrder}
                        onReject={handleRejectOrder}
                        onAllotVendor={handleAllotVendor}
                        vendors={vendors}
                        getStatusColor={helpers.getStatusColor}
                        getCourierStatusColor={helpers.getCourierStatusColor}
                        formatDate={helpers.formatDate}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading.orders && orders.length > 0 && (
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}

        {/* Return Requests Table */}
        {activeTab === 'returns' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Return Requests</h3>
            {loading.returnRequests ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading return requests...</p>
              </div>
            ) : returnRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No return requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {returnRequests.map(returnReq => (
                  <div key={returnReq._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Order #{returnReq.razorpay_order_id}</h4>
                        <p className="text-sm text-gray-500">
                          Return Status: {returnReq.refund?.status || 'Pending'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => api.processReturnRequest(returnReq._id, returnReq._id, 'accept')}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => api.processReturnRequest(returnReq._id, returnReq._id, 'reject')}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Exchange Requests Table */}
        {activeTab === 'exchanges' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Exchange Requests</h3>
            {loading.exchangeRequests ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading exchange requests...</p>
              </div>
            ) : exchangeRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No exchange requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exchangeRequests.map(exchangeReq => (
                  <div key={exchangeReq._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Order #{exchangeReq.razorpay_order_id}</h4>
                        <p className="text-sm text-gray-500">
                          Exchange Status: {exchangeReq.exchange?.status || 'Pending'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => api.processExchangeRequest(exchangeReq._id, exchangeReq._id, 'accept')}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => api.processExchangeRequest(exchangeReq._id, exchangeReq._id, 'reject')}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Import OrderDetails and other components (these would be separate files)
const OrderDetails = ({ orderId, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Orders
        </button>
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Order Details</h1>
          <p>Order ID: {orderId}</p>
          {/* Add comprehensive order details here */}
        </div>
      </div>
    </div>
  );
};

const ReturnOrders = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Orders
        </button>
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Return Orders</h1>
          {/* Add return orders functionality here */}
        </div>
      </div>
    </div>
  );
};

const ExchangeOrders = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Orders
        </button>
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Exchange Orders</h1>
          {/* Add exchange orders functionality here */}
        </div>
      </div>
    </div>
  );
};

export default Orders;
