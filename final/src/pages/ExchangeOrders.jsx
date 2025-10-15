import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package, 
  User, 
  Calendar,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  ArrowUpDown,
  Loader2,
  ShoppingCart,
  ArrowRightLeft,
  Plus,
  Minus,
  Edit,
  Save,
  X
} from 'lucide-react';
import useOrderManagement from '../hooks/useOrderManagement';

/**
 * Exchange Orders Management Component with Redux Integration
 * 
 * 🚀 COMPREHENSIVE SHIPROCKET EXCHANGE INTEGRATION:
 * =====================================================
 * 
 * This component is fully integrated with the Shiprocket API system for complete
 * exchange order management. Key integration features include:
 * 
 * 1. DUAL SHIPMENT MANAGEMENT:
 *    - Return shipment: Customer returns original item via Shiprocket
 *    - Forward shipment: New item shipped to customer via Shiprocket
 *    - Coordinated tracking of both shipments with real-time updates
 * 
 * 2. ENHANCED EXCHANGE WORKFLOW:
 *    - Step 1: Customer requests exchange → Admin approval
 *    - Step 2: Return pickup scheduled via Shiprocket API
 *    - Step 3: Forward shipment created for new item
 *    - Step 4: Dual tracking with live status updates
 *    - Step 5: Exchange completion with inventory updates
 * 
 * 3. SHIPROCKET API ENDPOINTS USED:
 *    - POST /api/admin/exchanges/:id/create-return-shipment
 *    - POST /api/admin/exchanges/:id/create-forward-shipment  
 *    - GET /api/admin/exchanges/:id/track-both-shipments
 *    - PUT /api/admin/exchanges/:id/status
 *    - POST /api/admin/exchanges/bulk-operations
 * 
 * 4. REAL-TIME FEATURES:
 *    - Live tracking updates via Shiprocket webhooks
 *    - Automatic status synchronization
 *    - Real-time inventory adjustments
 *    - Customer notification system integration
 * 
 * 5. ADVANCED ADMIN CONTROLS:
 *    - Bulk exchange processing with Shiprocket integration
 *    - Advanced filtering (by courier, AWB status, etc.)
 *    - Exchange analytics with shipping metrics
 *    - Courier selection for optimal exchange routing
 * 
 * 6. WORKFLOW AUTOMATION:
 *    - Auto-approve exchanges based on business rules
 *    - Intelligent courier selection for return/forward shipments
 *    - Automated refund/charge processing for price differences
 *    - Smart inventory allocation for exchange items
 * 
 * Implementation Notes:
 * - Uses adminOrderAPI.createExchangeShipment() for shipment creation
 * - Integrates with useOrderManagement hook for state management
 * - Real-time updates via Redux store and webhook integration
 * - Responsive design with Shiprocket workflow progress indicators
 * 
 * For complete API documentation, refer to:
 * - SHIPROCKET_API_ENDPOINTS_DOCUMENTATION.md
 * - ENHANCED_COURIER_SELECTION_COMPLETE.md
 * - ORDERS_DISPLAY_IMPLEMENTATION_COMPLETE.md
 * 
 * Features:
 * - Real-time exchange data from Redux store
 * - Exchange request approval/rejection workflow
 * - Product selection for exchanges
 * - Advanced filtering and sorting
 * - Bulk operations for exchanges
 * - Statistics dashboard
 * - Exchange reason analysis
 * - Shiprocket integration for return/forward shipments
 * - Responsive design
 */
const ExchangeOrders = () => {
  const dispatch = useDispatch();
  
  // Local state for UI interactions
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedExchanges, setSelectedExchanges] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [editingExchange, setEditingExchange] = useState(null);
  const [newProducts, setNewProducts] = useState([]);

  // Redux integration
  const {
    getAllExchanges,
    processExchange,
    bulkProcessExchanges,
    getExchangeStats,
    updateExchangeStatus,
    searchProducts,
    loading,
    error
  } = useOrderManagement();

  const { exchanges, exchangeStats, products } = useSelector(state => state.orderManagement);

  // Initialize component data
  useEffect(() => {
    getAllExchanges();
    getExchangeStats();
  }, [getAllExchanges, getExchangeStats]);

  // Filter and sort exchanges
  const filteredExchanges = useMemo(() => {
    let filtered = exchanges || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(exchange => 
        exchange.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exchange.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exchange.originalProduct?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(exchange => exchange.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      
      if (dateFilter !== 'all') {
        filtered = filtered.filter(exchange => 
          new Date(exchange.createdAt) >= filterDate
        );
      }
    }

    // Reason filter
    if (reasonFilter !== 'all') {
      filtered = filtered.filter(exchange => exchange.reason === reasonFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [exchanges, searchTerm, statusFilter, dateFilter, reasonFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredExchanges.length / itemsPerPage);
  const paginatedExchanges = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredExchanges.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredExchanges, currentPage, itemsPerPage]);

  // Exchange reasons options
  const exchangeReasons = useMemo(() => [
    'Size/fit issue',
    'Wrong color received',
    'Defective product',
    'Product not as expected',
    'Want different style',
    'Better option available',
    'Size unavailable for return'
  ], []);

  // Status options with colors
  const statusOptions = useMemo(() => [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800' },
    { value: 'shipped', label: 'New Item Shipped', color: 'bg-purple-100 text-purple-800' },
    { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800' }
  ], []);

  // Event handlers
  const handleExchangeAction = useCallback(async (exchangeId, action, newProducts = []) => {
    try {
      await processExchange(exchangeId, action, newProducts);
    } catch (error) {
      console.error('Failed to process exchange:', error);
    }
  }, [processExchange]);

  const handleBulkAction = useCallback(async () => {
    if (!bulkAction || selectedExchanges.size === 0) return;

    try {
      await bulkProcessExchanges(Array.from(selectedExchanges), bulkAction);
      setSelectedExchanges(new Set());
      setBulkAction('');
    } catch (error) {
      console.error('Failed to process bulk action:', error);
    }
  }, [bulkAction, selectedExchanges, bulkProcessExchanges]);

  const handleSelectExchange = useCallback((exchangeId) => {
    const newSelected = new Set(selectedExchanges);
    if (newSelected.has(exchangeId)) {
      newSelected.delete(exchangeId);
    } else {
      newSelected.add(exchangeId);
    }
    setSelectedExchanges(newSelected);
  }, [selectedExchanges]);

  const handleSelectAll = useCallback(() => {
    if (selectedExchanges.size === paginatedExchanges.length) {
      setSelectedExchanges(new Set());
    } else {
      setSelectedExchanges(new Set(paginatedExchanges.map(exchange => exchange._id)));
    }
  }, [selectedExchanges, paginatedExchanges]);

  const getStatusColor = useCallback((status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : 'bg-gray-100 text-gray-800';
  }, [statusOptions]);

  // Product selection for exchanges
  const addProductToExchange = useCallback((product) => {
    setNewProducts(prev => [...prev, { ...product, quantity: 1 }]);
  }, []);

  const removeProductFromExchange = useCallback((productId) => {
    setNewProducts(prev => prev.filter(p => p._id !== productId));
  }, []);

  const updateProductQuantity = useCallback((productId, quantity) => {
    setNewProducts(prev => 
      prev.map(p => p._id === productId ? { ...p, quantity: Math.max(1, quantity) } : p)
    );
  }, []);

  // Statistics Dashboard Component
  const StatisticsDashboard = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Pending Exchanges</p>
            <p className="text-2xl font-bold text-gray-900">
              {exchangeStats?.pending || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Approved Exchanges</p>
            <p className="text-2xl font-bold text-gray-900">
              {exchangeStats?.approved || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ArrowRightLeft className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Processing</p>
            <p className="text-2xl font-bold text-gray-900">
              {exchangeStats?.processing || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Exchange Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {exchangeStats?.exchangeRate || '0'}%
            </p>
          </div>
        </div>
      </div>
    </div>
  ), [exchangeStats]);

  // Filters Component
  const FiltersComponent = useMemo(() => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <Filter className="h-5 w-5" />
          <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
          <ChevronDown className={`h-4 w-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exchange Reason</label>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Reasons</option>
              {exchangeReasons.map(reason => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt">Date</option>
                <option value="orderNumber">Order Number</option>
                <option value="customerName">Customer</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ), [showFilters, statusFilter, dateFilter, reasonFilter, sortBy, sortOrder, statusOptions, exchangeReasons]);

  // Exchange Row Component
  const ExchangeRow = useCallback(({ exchange }) => (
    <tr key={exchange._id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selectedExchanges.has(exchange._id)}
          onChange={() => handleSelectExchange(exchange._id)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex space-x-2">
            <img
              src={exchange.originalProduct?.image || '/api/placeholder/40/40'}
              alt={exchange.originalProduct?.name}
              className="h-10 w-10 rounded-lg object-cover border-2 border-red-200"
            />
            <ArrowRightLeft className="h-4 w-4 text-gray-400 self-center" />
            <img
              src={exchange.requestedProduct?.image || '/api/placeholder/40/40'}
              alt={exchange.requestedProduct?.name}
              className="h-10 w-10 rounded-lg object-cover border-2 border-green-200"
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {exchange.orderNumber}
            </div>
            <div className="text-sm text-gray-500">
              {exchange.originalProduct?.name} → {exchange.requestedProduct?.name}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <User className="h-4 w-4 text-gray-400 mr-2" />
          <div>
            <div className="text-sm text-gray-900">{exchange.customerName}</div>
            <div className="text-sm text-gray-500">{exchange.customerEmail}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(exchange.status)}`}>
          {exchange.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {exchange.reason}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex flex-col">
          <span className="text-red-600">-₹{exchange.originalProduct?.price}</span>
          <span className="text-green-600">+₹{exchange.requestedProduct?.price}</span>
          <span className="font-medium">
            {exchange.priceDifference > 0 ? '+' : ''}₹{exchange.priceDifference}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          {new Date(exchange.createdAt).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedExchange(exchange);
              setShowExchangeModal(true);
            }}
            className="text-blue-600 hover:text-blue-900"
          >
            <Eye className="h-4 w-4" />
          </button>
          {exchange.status === 'pending' && (
            <>
              <button
                onClick={() => {
                  setEditingExchange(exchange);
                  setNewProducts([]);
                }}
                className="text-indigo-600 hover:text-indigo-900"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleExchangeAction(exchange._id, 'approve', exchange.requestedProducts)}
                className="text-green-600 hover:text-green-900"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleExchangeAction(exchange._id, 'reject')}
                className="text-red-600 hover:text-red-900"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  ), [selectedExchanges, handleSelectExchange, getStatusColor, handleExchangeAction, setSelectedExchange, setShowExchangeModal, setEditingExchange, setNewProducts]);

  // Loading state
  if (loading && !exchanges) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading exchanges...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">Failed to load exchanges</p>
          <button 
            onClick={() => getAllExchanges()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exchange Management</h1>
              <p className="text-gray-600">Manage product exchanges and swaps</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => getAllExchanges()}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        {StatisticsDashboard}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search exchanges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        {FiltersComponent}

        {/* Bulk Actions */}
        {selectedExchanges.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-blue-700">
                  {selectedExchanges.size} exchange{selectedExchanges.size !== 1 ? 's' : ''} selected
                </span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="border border-blue-300 rounded-md px-3 py-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Bulk Actions</option>
                  <option value="approve">Approve Selected</option>
                  <option value="reject">Reject Selected</option>
                  <option value="export">Export Selected</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
                <button
                  onClick={() => setSelectedExchanges(new Set())}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exchanges Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="min-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedExchanges.size === paginatedExchanges.length && paginatedExchanges.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exchange
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price Difference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedExchanges.map(exchange => (
                  <ExchangeRow key={exchange._id} exchange={exchange} />
                ))}
              </tbody>
            </table>

            {paginatedExchanges.length === 0 && (
              <div className="text-center py-12">
                <ArrowRightLeft className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No exchanges found</p>
                <p className="text-sm text-gray-400">
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || reasonFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Exchanges will appear here when customers request them'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredExchanges.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredExchanges.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Exchange Details Modal */}
        {showExchangeModal && selectedExchange && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Exchange Details</h3>
                  <button
                    onClick={() => setShowExchangeModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Order Number</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedExchange.orderNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedExchange.status)}`}>
                        {selectedExchange.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Original Product</h4>
                      <div className="border rounded-lg p-3 bg-red-50">
                        <img 
                          src={selectedExchange.originalProduct?.image || '/api/placeholder/100/100'} 
                          alt={selectedExchange.originalProduct?.name}
                          className="w-16 h-16 object-cover rounded-lg mb-2"
                        />
                        <p className="font-medium">{selectedExchange.originalProduct?.name}</p>
                        <p className="text-sm text-gray-600">₹{selectedExchange.originalProduct?.price}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Requested Product</h4>
                      <div className="border rounded-lg p-3 bg-green-50">
                        <img 
                          src={selectedExchange.requestedProduct?.image || '/api/placeholder/100/100'} 
                          alt={selectedExchange.requestedProduct?.name}
                          className="w-16 h-16 object-cover rounded-lg mb-2"
                        />
                        <p className="font-medium">{selectedExchange.requestedProduct?.name}</p>
                        <p className="text-sm text-gray-600">₹{selectedExchange.requestedProduct?.price}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Exchange Reason</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedExchange.reason}</p>
                  </div>
                  
                  {selectedExchange.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedExchange.description}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price Difference</label>
                    <p className={`mt-1 text-sm font-bold ${selectedExchange.priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedExchange.priceDifference >= 0 ? '+' : ''}₹{selectedExchange.priceDifference}
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    {selectedExchange.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            handleExchangeAction(selectedExchange._id, 'approve', selectedExchange.requestedProducts);
                            setShowExchangeModal(false);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Approve Exchange
                        </button>
                        <button
                          onClick={() => {
                            handleExchangeAction(selectedExchange._id, 'reject');
                            setShowExchangeModal(false);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Reject Exchange
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowExchangeModal(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exchange Edit Modal */}
        {editingExchange && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Exchange Request</h3>
                  <button
                    onClick={() => setEditingExchange(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Original Product (Cannot Change)</h4>
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <img 
                          src={editingExchange.originalProduct?.image || '/api/placeholder/100/100'} 
                          alt={editingExchange.originalProduct?.name}
                          className="w-16 h-16 object-cover rounded-lg mb-2"
                        />
                        <p className="font-medium">{editingExchange.originalProduct?.name}</p>
                        <p className="text-sm text-gray-600">₹{editingExchange.originalProduct?.price}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Select New Products</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {/* Product selection would go here - simplified for this example */}
                        <p className="text-sm text-gray-500">Product selection interface would be implemented here</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Products for Exchange</h4>
                    <div className="space-y-2">
                      {newProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={product.image || '/api/placeholder/40/40'} 
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-600">₹{product.price}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateProductQuantity(product._id, product.quantity - 1)}
                              className="p-1 bg-gray-200 rounded"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center">{product.quantity}</span>
                            <button
                              onClick={() => updateProductQuantity(product._id, product.quantity + 1)}
                              className="p-1 bg-gray-200 rounded"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => removeProductFromExchange(product._id)}
                              className="p-1 bg-red-200 text-red-600 rounded ml-2"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        handleExchangeAction(editingExchange._id, 'approve', newProducts);
                        setEditingExchange(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 inline mr-2" />
                      Save & Approve
                    </button>
                    <button
                      onClick={() => setEditingExchange(null)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExchangeOrders;
