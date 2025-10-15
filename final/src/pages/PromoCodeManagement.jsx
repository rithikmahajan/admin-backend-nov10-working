import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye,
  EyeOff,
  Copy,
  Download,
  MoreVertical,
  Calendar,
  Percent,
  DollarSign,
  Tag,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  BarChart3,
  TrendingUp,
  Activity,
  Save,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  fetchPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
  bulkTogglePromoCodeStatus,
  bulkDeletePromoCodes,
  getPromoCodeStats,
  clearError,
  updateFilters,
  resetFilters,
  setSelectedPromoCode,
  selectPromoCodes,
  selectPromoCodesLoading,
  selectPromoCodesError,
  selectCreateLoading,
  selectUpdateLoading,
  selectDeleteLoading,
  selectFilteredPromoCodes,
  selectPromoCodeStats,
  selectPromoCodeFilters,
} from "../store/slices/promoCodeSlice";

// Constants
const DISCOUNT_TYPES = [
  { value: "percentage", label: "Percentage", icon: Percent },
  { value: "fixed", label: "Fixed Amount", icon: DollarSign },
  { value: "free_shipping", label: "Free Shipping", icon: Tag },
  { value: "bogo", label: "Buy One Get One", icon: Users },
];

const STATUS_OPTIONS = [
  { value: null, label: "All Status" },
  { value: true, label: "Active" },
  { value: false, label: "Inactive" },
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Created Date" },
  { value: "code", label: "Promo Code" },
  { value: "discountValue", label: "Discount Value" },
  { value: "endDate", label: "End Date" },
  { value: "currentUses", label: "Usage Count" },
];

// Initial form state
const INITIAL_FORM_STATE = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minOrderValue: "",
  startDate: "",
  endDate: "",
  maxUses: "",
  isActive: true,
};

/**
 * PromoCodeManagement Component
 * 
 * Comprehensive promo code management with CRUD operations,
 * filtering, search, and bulk operations using Redux and Axios
 */
const PromoCodeManagement = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const promoCodes = useSelector(selectFilteredPromoCodes);
  const loading = useSelector(selectPromoCodesLoading);
  const error = useSelector(selectPromoCodesError);
  const createLoading = useSelector(selectCreateLoading);
  const updateLoading = useSelector(selectUpdateLoading);
  const deleteLoading = useSelector(selectDeleteLoading);
  const stats = useSelector(selectPromoCodeStats);
  const filters = useSelector(selectPromoCodeFilters);
  
  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [editingPromo, setEditingPromo] = useState(null);
  const [deletingPromo, setDeletingPromo] = useState(null);
  const [selectedPromoCodes, setSelectedPromoCodes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [bulkAction, setBulkAction] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  
  // Effects
  useEffect(() => {
    dispatch(fetchPromoCodes());
    dispatch(getPromoCodeStats());
  }, [dispatch]);
  
  useEffect(() => {
    if (searchQuery) {
      dispatch(updateFilters({ search: searchQuery }));
    }
  }, [searchQuery, dispatch]);
  
  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);
  
  // Clear copy success message
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);
  
  // Handlers
  const handleCreatePromoCode = useCallback(async (e) => {
    e.preventDefault();
    try {
      await dispatch(createPromoCode(formData)).unwrap();
      setShowCreateModal(false);
      setFormData(INITIAL_FORM_STATE);
      dispatch(fetchPromoCodes()); // Refresh list
    } catch (error) {
      console.error("Create promo code error:", error);
    }
  }, [dispatch, formData]);
  
  const handleEditPromoCode = useCallback(async (e) => {
    e.preventDefault();
    if (!editingPromo) return;
    
    try {
      await dispatch(updatePromoCode({ 
        id: editingPromo._id, 
        promoCodeData: formData 
      })).unwrap();
      setShowEditModal(false);
      setEditingPromo(null);
      setFormData(INITIAL_FORM_STATE);
      dispatch(fetchPromoCodes()); // Refresh list
    } catch (error) {
      console.error("Update promo code error:", error);
    }
  }, [dispatch, formData, editingPromo]);
  
  const handleDeletePromoCode = useCallback(async () => {
    if (!deletingPromo) return;
    
    try {
      await dispatch(deletePromoCode(deletingPromo._id)).unwrap();
      setShowDeleteModal(false);
      setDeletingPromo(null);
      dispatch(fetchPromoCodes()); // Refresh list
    } catch (error) {
      console.error("Delete promo code error:", error);
    }
  }, [dispatch, deletingPromo]);
  
  const handleBulkAction = useCallback(async () => {
    if (selectedPromoCodes.length === 0) return;
    
    try {
      if (bulkAction === "activate") {
        await dispatch(bulkTogglePromoCodeStatus({ 
          ids: selectedPromoCodes, 
          isActive: true 
        })).unwrap();
      } else if (bulkAction === "deactivate") {
        await dispatch(bulkTogglePromoCodeStatus({ 
          ids: selectedPromoCodes, 
          isActive: false 
        })).unwrap();
      } else if (bulkAction === "delete") {
        await dispatch(bulkDeletePromoCodes(selectedPromoCodes)).unwrap();
      }
      
      setShowBulkModal(false);
      setSelectedPromoCodes([]);
      setBulkAction("");
      dispatch(fetchPromoCodes()); // Refresh list
    } catch (error) {
      console.error("Bulk action error:", error);
    }
  }, [dispatch, selectedPromoCodes, bulkAction]);
  
  const handleToggleStatus = useCallback(async (promoCode) => {
    try {
      await dispatch(updatePromoCode({
        id: promoCode._id,
        promoCodeData: { isActive: !promoCode.isActive }
      })).unwrap();
      dispatch(fetchPromoCodes()); // Refresh list
    } catch (error) {
      console.error("Toggle status error:", error);
    }
  }, [dispatch]);
  
  const handleCopyCode = useCallback(async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(code);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }, []);
  
  const openEditModal = useCallback((promoCode) => {
    setEditingPromo(promoCode);
    setFormData({
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue.toString(),
      minOrderValue: promoCode.minOrderValue?.toString() || "",
      startDate: new Date(promoCode.startDate).toISOString().split('T')[0],
      endDate: new Date(promoCode.endDate).toISOString().split('T')[0],
      maxUses: promoCode.maxUses?.toString() || "",
      isActive: promoCode.isActive,
    });
    setShowEditModal(true);
  }, []);
  
  const openDeleteModal = useCallback((promoCode) => {
    setDeletingPromo(promoCode);
    setShowDeleteModal(true);
  }, []);
  
  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedPromoCodes(promoCodes.map(promo => promo._id));
    } else {
      setSelectedPromoCodes([]);
    }
  }, [promoCodes]);
  
  const handleSelectPromo = useCallback((promoId, checked) => {
    if (checked) {
      setSelectedPromoCodes(prev => [...prev, promoId]);
    } else {
      setSelectedPromoCodes(prev => prev.filter(id => id !== promoId));
    }
  }, []);
  
  const handleFilterChange = useCallback((filterUpdates) => {
    dispatch(updateFilters(filterUpdates));
  }, [dispatch]);
  
  const resetAllFilters = useCallback(() => {
    dispatch(resetFilters());
    setSearchQuery("");
  }, [dispatch]);
  
  const refreshPromoCodes = useCallback(() => {
    dispatch(fetchPromoCodes());
    dispatch(getPromoCodeStats());
  }, [dispatch]);
  
  // Computed values
  const allSelected = useMemo(() => 
    promoCodes.length > 0 && selectedPromoCodes.length === promoCodes.length,
    [promoCodes.length, selectedPromoCodes.length]
  );
  
  const someSelected = useMemo(() => 
    selectedPromoCodes.length > 0 && selectedPromoCodes.length < promoCodes.length,
    [promoCodes.length, selectedPromoCodes.length]
  );
  
  const isFormValid = useMemo(() => {
    return formData.code && 
           formData.discountType && 
           formData.discountValue && 
           formData.startDate && 
           formData.endDate;
  }, [formData]);
  
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }, []);
  
  const formatDate = useCallback((date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);
  
  const getStatusColor = useCallback((promoCode) => {
    if (!promoCode.isActive) return "text-red-600 bg-red-100";
    
    const now = new Date();
    const endDate = new Date(promoCode.endDate);
    
    if (endDate < now) return "text-orange-600 bg-orange-100";
    if (promoCode.maxUses > 0 && promoCode.currentUses >= promoCode.maxUses) {
      return "text-orange-600 bg-orange-100";
    }
    
    return "text-green-600 bg-green-100";
  }, []);
  
  const getStatusText = useCallback((promoCode) => {
    if (!promoCode.isActive) return "Inactive";
    
    const now = new Date();
    const endDate = new Date(promoCode.endDate);
    
    if (endDate < now) return "Expired";
    if (promoCode.maxUses > 0 && promoCode.currentUses >= promoCode.maxUses) {
      return "Limit Reached";
    }
    
    return "Active";
  }, []);
  
  // Error notification component
  const ErrorNotification = () => {
    if (!error) return null;
    
    return (
      <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        <span>{error}</span>
        <button 
          onClick={() => dispatch(clearError())}
          className="ml-2 text-red-600 hover:text-red-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };
  
  // Success notification component
  const SuccessNotification = () => {
    if (!copySuccess) return null;
    
    return (
      <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center">
        <CheckCircle className="w-5 h-5 mr-2" />
        <span>Copied "{copySuccess}" to clipboard</span>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Promo Code Management
              </h1>
              <p className="text-gray-600">
                Create and manage discount codes for your store
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <button
                onClick={refreshPromoCodes}
                disabled={loading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowStatsModal(true)}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Stats
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Promo Code
              </button>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Codes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.expired}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search promo codes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {showFilters ? (
                  <ChevronUp className="w-4 h-4 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-2" />
                )}
              </button>
            </div>
            
            {/* Bulk Actions */}
            {selectedPromoCodes.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {selectedPromoCodes.length} selected
                </span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose Action</option>
                  <option value="activate">Activate</option>
                  <option value="deactivate">Deactivate</option>
                  <option value="delete">Delete</option>
                </select>
                <button
                  onClick={() => setShowBulkModal(true)}
                  disabled={!bulkAction}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
          
          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.isActive === null ? "" : filters.isActive}
                    onChange={(e) => handleFilterChange({ 
                      isActive: e.target.value === "" ? null : e.target.value === "true" 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Type
                  </label>
                  <select
                    value={filters.discountType || ""}
                    onChange={(e) => handleFilterChange({ 
                      discountType: e.target.value || null 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    {DISCOUNT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange({ sortOrder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={resetAllFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Promo Codes Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                        <span className="text-gray-500">Loading promo codes...</span>
                      </div>
                    </td>
                  </tr>
                ) : promoCodes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">No promo codes found</p>
                        <p className="text-sm">Create your first promo code to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  promoCodes.map((promoCode) => (
                    <tr key={promoCode._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPromoCodes.includes(promoCode._id)}
                          onChange={(e) => handleSelectPromo(promoCode._id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 font-mono">
                              {promoCode.code}
                            </div>
                            <div className="text-sm text-gray-500">
                              Created {formatDate(promoCode.createdAt)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopyCode(promoCode.code)}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {DISCOUNT_TYPES.find(type => type.value === promoCode.discountType)?.icon && (
                            React.createElement(
                              DISCOUNT_TYPES.find(type => type.value === promoCode.discountType).icon,
                              { className: "w-4 h-4 mr-2 text-gray-500" }
                            )
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {promoCode.discountType === 'percentage' 
                                ? `${promoCode.discountValue}%` 
                                : promoCode.discountType === 'fixed'
                                ? formatCurrency(promoCode.discountValue)
                                : DISCOUNT_TYPES.find(type => type.value === promoCode.discountType)?.label
                              }
                            </div>
                            <div className="text-sm text-gray-500">
                              {promoCode.minOrderValue > 0 && 
                                `Min. ${formatCurrency(promoCode.minOrderValue)}`
                              }
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(promoCode.startDate)} - {formatDate(promoCode.endDate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.ceil((new Date(promoCode.endDate) - new Date()) / (1000 * 60 * 60 * 24))} days left
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {promoCode.currentUses} / {promoCode.maxUses || '∞'}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: promoCode.maxUses 
                                ? `${Math.min((promoCode.currentUses / promoCode.maxUses) * 100, 100)}%`
                                : '0%'
                            }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(promoCode)}`}>
                          {getStatusText(promoCode)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleStatus(promoCode)}
                            className={`p-2 rounded-lg transition-colors ${
                              promoCode.isActive
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            title={promoCode.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {promoCode.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => openEditModal(promoCode)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(promoCode)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <form onSubmit={handleCreatePromoCode}>
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Create Promo Code</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData(INITIAL_FORM_STATE);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., SAVE20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
                
                {/* Discount Type and Value */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Type *
                    </label>
                    <select
                      required
                      value={formData.discountType}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {DISCOUNT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step={formData.discountType === 'percentage' ? '0.01' : '1'}
                      max={formData.discountType === 'percentage' ? '100' : undefined}
                      value={formData.discountValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                      placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Limits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Order Value
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minOrderValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, minOrderValue: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Uses
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxUses}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                      placeholder="0 (unlimited)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Status */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Activate immediately
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData(INITIAL_FORM_STATE);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || createLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {createLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Create Promo Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && editingPromo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <form onSubmit={handleEditPromoCode}>
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Edit Promo Code</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPromo(null);
                      setFormData(INITIAL_FORM_STATE);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                {/* Same form fields as create modal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Type *
                    </label>
                    <select
                      required
                      value={formData.discountType}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {DISCOUNT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step={formData.discountType === 'percentage' ? '0.01' : '1'}
                      max={formData.discountType === 'percentage' ? '100' : undefined}
                      value={formData.discountValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Order Value
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minOrderValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, minOrderValue: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Uses
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxUses}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Active
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPromo(null);
                    setFormData(INITIAL_FORM_STATE);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || updateLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {updateLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Update Promo Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingPromo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Delete Promo Code</h2>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the promo code{" "}
                <span className="font-mono font-semibold">{deletingPromo.code}</span>?
              </p>
              <p className="text-sm text-gray-500">
                This action cannot be undone. All statistics for this promo code will be lost.
              </p>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingPromo(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePromoCode}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {deleteLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk Action Confirmation Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Confirm Bulk Action</h2>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4">
                Are you sure you want to{" "}
                <span className="font-semibold">
                  {bulkAction === "activate" ? "activate" : 
                   bulkAction === "deactivate" ? "deactivate" : "delete"}
                </span>{" "}
                {selectedPromoCodes.length} selected promo code(s)?
              </p>
              {bulkAction === "delete" && (
                <p className="text-sm text-red-600">
                  This action cannot be undone.
                </p>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkAction("");
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAction}
                className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center ${
                  bulkAction === "delete" 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error and Success Notifications */}
      <ErrorNotification />
      <SuccessNotification />
    </div>
  );
};

export default PromoCodeManagement;
