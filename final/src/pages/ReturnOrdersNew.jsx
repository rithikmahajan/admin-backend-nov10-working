import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useOrderManagement } from "../hooks/useOrderManagement";
import {
  ArrowLeft,
  Package,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
  User,
  Truck,
  DollarSign,
  RotateCcw,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  Edit,
  Save,
  X,
  Check,
  Ban,
  AlertTriangle,
  Plus,
  Star,
  TrendingUp,
  Zap,
  Shield,
  ExternalLink,
  Printer,
  Send,
  Upload,
  ChevronDown,
  Camera,
  Tag,
  Users
} from "lucide-react";

/**
 * Enhanced ReturnOrders Component with Redux Integration
 * 
 * Features:
 * - Real-time return data from Redux store
 * - Advanced filtering and sorting
 * - Bulk operations for returns
 * - Return approval/rejection workflow
 * - Statistics dashboard
 * - Return reason analysis
 * - Export functionality
 * - Responsive design
 */
const ReturnOrdersNew = () => {
  const dispatch = useDispatch();
  
  // Local state for UI interactions
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedReturns, setSelectedReturns] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Redux integration
  const {
    getAllReturns,
    processReturn,
    bulkProcessReturns,
    getReturnStats,
    updateReturnStatus,
    loading,
    error
  } = useOrderManagement();

  const { returns, returnStats } = useSelector(state => state.orderManagement);

  // Initialize component data
  useEffect(() => {
    getAllReturns();
    getReturnStats();
  }, [getAllReturns, getReturnStats]);

  // Filter and sort returns
  const filteredReturns = useMemo(() => {
    let filtered = returns || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(returnItem => 
        returnItem.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        returnItem.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        returnItem.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(returnItem => returnItem.status === statusFilter);
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
        filtered = filtered.filter(returnItem => 
          new Date(returnItem.createdAt) >= filterDate
        );
      }
    }

    // Reason filter
    if (reasonFilter !== 'all') {
      filtered = filtered.filter(returnItem => returnItem.reason === reasonFilter);
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
  }, [returns, searchTerm, statusFilter, dateFilter, reasonFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const paginatedReturns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReturns.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReturns, currentPage, itemsPerPage]);

  // Return reasons options
  const returnReasons = useMemo(() => [
    'Size/fit issue',
    'Product not as expected',
    'Wrong item received',
    'Damaged/defective product',
    'Late delivery',
    'Quality not as expected',
    'Changed mind',
    'Better price elsewhere'
  ], []);

  // Status options with colors
  const statusOptions = useMemo(() => [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800' }
  ], []);

  // Event handlers
  const handleReturnAction = useCallback(async (returnId, action, reason = '') => {
    try {
      await processReturn(returnId, action, reason);
    } catch (error) {
      console.error('Failed to process return:', error);
    }
  }, [processReturn]);

  const handleBulkAction = useCallback(async () => {
    if (!bulkAction || selectedReturns.size === 0) return;

    try {
      await bulkProcessReturns(Array.from(selectedReturns), bulkAction);
      setSelectedReturns(new Set());
      setBulkAction('');
    } catch (error) {
      console.error('Failed to process bulk action:', error);
    }
  }, [bulkAction, selectedReturns, bulkProcessReturns]);

  const handleSelectReturn = useCallback((returnId) => {
    const newSelected = new Set(selectedReturns);
    if (newSelected.has(returnId)) {
      newSelected.delete(returnId);
    } else {
      newSelected.add(returnId);
    }
    setSelectedReturns(newSelected);
  }, [selectedReturns]);

  const handleSelectAll = useCallback(() => {
    if (selectedReturns.size === paginatedReturns.length) {
      setSelectedReturns(new Set());
    } else {
      setSelectedReturns(new Set(paginatedReturns.map(returnItem => returnItem._id)));
    }
  }, [selectedReturns, paginatedReturns]);

  const getStatusColor = useCallback((status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : 'bg-gray-100 text-gray-800';
  }, [statusOptions]);

  // Statistics Dashboard Component
  const StatisticsDashboard = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Pending Returns</p>
            <p className="text-2xl font-bold text-gray-900">
              {returnStats?.pending || 0}
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
            <p className="text-sm font-medium text-gray-600">Approved Returns</p>
            <p className="text-2xl font-bold text-gray-900">
              {returnStats?.approved || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="p-2 bg-red-100 rounded-lg">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Rejected Returns</p>
            <p className="text-2xl font-bold text-gray-900">
              {returnStats?.rejected || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Return Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {returnStats?.returnRate || '0'}%
            </p>
          </div>
        </div>
      </div>
    </div>
  ), [returnStats]);

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
            <label className="block text-sm font-medium text-gray-700 mb-2">Return Reason</label>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Reasons</option>
              {returnReasons.map(reason => (
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
                <option value="amount">Amount</option>
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
  ), [showFilters, statusFilter, dateFilter, reasonFilter, sortBy, sortOrder, statusOptions, returnReasons]);

  // Return Row Component
  const ReturnRow = useCallback(({ returnItem }) => (
    <tr key={returnItem._id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selectedReturns.has(returnItem._id)}
          onChange={() => handleSelectReturn(returnItem._id)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img
            src={returnItem.productImage || '/api/placeholder/40/40'}
            alt={returnItem.productName}
            className="h-10 w-10 rounded-lg object-cover"
          />
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {returnItem.orderNumber}
            </div>
            <div className="text-sm text-gray-500">
              {returnItem.productName}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <User className="h-4 w-4 text-gray-400 mr-2" />
          <div>
            <div className="text-sm text-gray-900">{returnItem.customerName}</div>
            <div className="text-sm text-gray-500">{returnItem.customerEmail}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(returnItem.status)}`}>
          {returnItem.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {returnItem.reason}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ₹{returnItem.amount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          {new Date(returnItem.createdAt).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedReturn(returnItem);
              setShowReturnModal(true);
            }}
            className="text-blue-600 hover:text-blue-900"
          >
            <Eye className="h-4 w-4" />
          </button>
          {returnItem.status === 'pending' && (
            <>
              <button
                onClick={() => handleReturnAction(returnItem._id, 'approve')}
                className="text-green-600 hover:text-green-900"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleReturnAction(returnItem._id, 'reject')}
                className="text-red-600 hover:text-red-900"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  ), [selectedReturns, handleSelectReturn, getStatusColor, handleReturnAction, setSelectedReturn, setShowReturnModal]);

  // Loading state
  if (loading && !returns) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading returns...</p>
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
          <p className="text-red-600 mb-4">Failed to load returns</p>
          <button 
            onClick={() => getAllReturns()}
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
              <h1 className="text-2xl font-bold text-gray-900">Return Management</h1>
              <p className="text-gray-600">Manage product returns and refunds</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => getAllReturns()}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        {StatisticsDashboard}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search returns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {viewMode === 'table' ? 'Card View' : 'Table View'}
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {FiltersComponent}

        {/* Bulk Actions */}
        {selectedReturns.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-blue-700">
                  {selectedReturns.size} return{selectedReturns.size !== 1 ? 's' : ''} selected
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
                  onClick={() => setSelectedReturns(new Set())}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Returns Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="min-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedReturns.size === paginatedReturns.length && paginatedReturns.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
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
                    Amount
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
                {paginatedReturns.map(returnItem => (
                  <ReturnRow key={returnItem._id} returnItem={returnItem} />
                ))}
              </tbody>
            </table>

            {paginatedReturns.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No returns found</p>
                <p className="text-sm text-gray-400">
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || reasonFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Returns will appear here when customers request them'
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
                        {Math.min(currentPage * itemsPerPage, filteredReturns.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredReturns.length}</span> results
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

        {/* Return Details Modal */}
        {showReturnModal && selectedReturn && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Return Details</h3>
                  <button
                    onClick={() => setShowReturnModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Order Number</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedReturn.orderNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedReturn.status)}`}>
                        {selectedReturn.status}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Return Reason</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedReturn.reason}</p>
                  </div>
                  
                  {selectedReturn.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedReturn.description}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    {selectedReturn.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            handleReturnAction(selectedReturn._id, 'approve');
                            setShowReturnModal(false);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Approve Return
                        </button>
                        <button
                          onClick={() => {
                            handleReturnAction(selectedReturn._id, 'reject');
                            setShowReturnModal(false);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Reject Return
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowReturnModal(false)}
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
      </div>
    </div>
  );
};

export default ReturnOrdersNew;
