import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Download,
  Upload,
  RefreshCw,
  Image,
  Video,
  Camera,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Settings,
  Target,
  Users,
  Star,
  TrendingUp,
  Tags,
  X
} from 'lucide-react';

// Import Redux actions
import {
  fetchProducts,
  fetchProductsByStatus,
  updateProductStatus,
  updateDraftConfiguration,
  deleteProduct,
  uploadProductImages,
  uploadProductVideos,
  deleteProductImage,
  deleteProductVideo,
  uploadSizeChartImage,
  deleteSizeChartImage,
  updateRecommendationSettings,
  bulkUpdateProductSettings,
  updateItemCategoryAssignment,
  clearError,
  clearSuccess,
  setFilters,
  selectProducts,
  selectProductsLoading,
  selectProductsError,
  selectProductsSuccess,
  selectProductsPagination,
  selectProductsFilters
} from '../store/slices/newProductSlice';

// Import category and subcategory data
import { categoryAPI, subCategoryAPI } from '../api/endpoints';

const ItemManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state
  const products = useSelector(selectProducts);
  const loading = useSelector(selectProductsLoading);
  const error = useSelector(selectProductsError);
  const success = useSelector(selectProductsSuccess);
  const pagination = useSelector(selectProductsPagination);
  const filters = useSelector(selectProductsFilters);

  // Debug: Log products when they change
  useEffect(() => {
    if (products.length > 0) {
      console.log('Products received:', products);
      console.log('First product images:', products[0]?.images);
    }
  }, [products]);

  // Local state
  const [activeTab, setActiveTab] = useState('draft');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // New modal states
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [showProductManagementModal, setShowProductManagementModal] = useState(false);
  const [showCategoryAssignmentModal, setShowCategoryAssignmentModal] = useState(false);
  const [showSizeChartModal, setShowSizeChartModal] = useState(false);
  
  // Category assignment states
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');

  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : [];

  console.log('🔍 Component render - safeProducts:', safeProducts);
  console.log('🔍 Component render - safeProducts length:', safeProducts.length);
  if (safeProducts.length > 0) {
    console.log('🔍 First product structure:', safeProducts[0]);
  }

  // Load products on component mount and tab change
  useEffect(() => {
    const loadProducts = async () => {
      try {
        let result;
        if (activeTab === 'all') {
          result = await dispatch(fetchProducts({ page: 1, limit: 10, search: searchTerm })).unwrap();
        } else {
          result = await dispatch(fetchProductsByStatus({ 
            status: activeTab, 
            params: { page: 1, limit: 10, search: searchTerm } 
          })).unwrap();
        }
        console.log('🔍 Products loaded:', result);
        console.log('🔍 Products from Redux:', products);
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };

    loadProducts();
  }, [dispatch, activeTab, searchTerm]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'all') {
        dispatch(fetchProducts({ page: 1, limit: 10, search: searchTerm }));
      } else {
        dispatch(fetchProductsByStatus({ 
          status: activeTab, 
          params: { page: 1, limit: 10, search: searchTerm } 
        }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, activeTab, dispatch]);

  // Handle status update
  const handleStatusUpdate = async (productId, newStatus) => {
    try {
      console.log('🔄 Updating product status:', { productId, newStatus });
      
      if (!productId) {
        console.error('❌ Product ID is missing');
        alert('Product ID is missing. Cannot update status.');
        return;
      }

      await dispatch(updateProductStatus({ productId: productId, status: newStatus })).unwrap();
      
      // Refresh the current tab
      if (activeTab === 'all') {
        dispatch(fetchProducts({ page: 1, limit: 10, search: searchTerm }));
      } else {
        dispatch(fetchProductsByStatus({ 
          status: activeTab, 
          params: { page: 1, limit: 10, search: searchTerm } 
        }));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status: ' + (error.message || error));
    }
  };

  // Handle delete product
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await dispatch(deleteProduct(productId)).unwrap();
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  // Handle add images/videos
  const handleAddImages = (product) => {
    setSelectedProduct(product);
    setShowImageModal(true);
  };

  const handleAddVideos = (product) => {
    setSelectedProduct(product);
    setShowVideoModal(true);
  };

  // Handle size chart management
  const handleSizeChart = (product) => {
    setSelectedProduct(product);
    setShowSizeChartModal(true);
  };

  // Handle category assignment
  const handleCategoryAssignment = async (product) => {
    setSelectedProduct(product);
    
    // Pre-fill current category and subcategory if they exist
    if (product.categoryId) {
      setSelectedCategoryId(product.categoryId._id || product.categoryId);
    }
    if (product.subCategoryId) {
      setSelectedSubCategoryId(product.subCategoryId._id || product.subCategoryId);
    }
    
    // Load categories if not already loaded
    if (categories.length === 0) {
      await loadCategories();
    }
    
    // Load subcategories for the current category if one is selected
    if (product.categoryId) {
      await loadSubCategories(product.categoryId._id || product.categoryId);
    }
    
    setShowCategoryAssignmentModal(true);
  };

  // Load categories from API
  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAllCategories();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  // Load subcategories for a specific category
  const loadSubCategories = async (categoryId) => {
    try {
      if (categoryId) {
        const response = await subCategoryAPI.getSubCategoriesByCategory(categoryId);
        setSubCategories(response.data.data || []);
      } else {
        setSubCategories([]);
      }
    } catch (error) {
      console.error('Failed to load subcategories:', error);
      setSubCategories([]);
    }
  };

  // Handle category change
  const handleCategoryChange = async (categoryId) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubCategoryId(''); // Reset subcategory when category changes
    await loadSubCategories(categoryId);
  };

  // Save category assignment
  const saveCategoryAssignment = async () => {
    if (!selectedProduct) return;

    try {
      const productId = selectedProduct._id || selectedProduct.itemId || selectedProduct.id;
      
      await dispatch(updateItemCategoryAssignment({
        itemId: productId,
        categoryId: selectedCategoryId || null,
        subCategoryId: selectedSubCategoryId || null
      })).unwrap();

      // Close modal and reset states
      setShowCategoryAssignmentModal(false);
      setSelectedProduct(null);
      setSelectedCategoryId('');
      setSelectedSubCategoryId('');
      setSubCategories([]);

      // Refresh products
      if (activeTab === 'all') {
        dispatch(fetchProducts({ page: 1, limit: 10, search: searchTerm }));
      } else {
        dispatch(fetchProductsByStatus({ 
          status: activeTab, 
          params: { page: 1, limit: 10, search: searchTerm } 
        }));
      }

    } catch (error) {
      console.error('Failed to update category assignment:', error);
      alert('Failed to update category assignment: ' + (error.message || error));
    }
  };

  // Handle checkbox selection for bulk operations
  const handleProductSelect = (product, isChecked) => {
    const productId = product._id || product.itemId || product.id;
    
    if (isChecked) {
      setSelectedProducts(prev => [...prev, product]);
    } else {
      setSelectedProducts(prev => prev.filter(p => {
        const pId = p._id || p.itemId || p.id;
        return pId !== productId;
      }));
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedProducts(safeProducts);
    } else {
      setSelectedProducts([]);
    }
  };

  // Check if all products are selected
  const isAllSelected = safeProducts.length > 0 && selectedProducts.length === safeProducts.length;

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      draft: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      live: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Calendar },
      inactive: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  // Tab component
  const tabs = [
    { key: 'draft', label: 'Draft', count: safeProducts.filter(p => p.status === 'draft').length },
    { key: 'live', label: 'Live', count: safeProducts.filter(p => p.status === 'live').length },
    { key: 'scheduled', label: 'Scheduled', count: safeProducts.filter(p => p.status === 'scheduled').length },
    { key: 'inactive', label: 'Inactive', count: safeProducts.filter(p => p.status === 'inactive').length },
    { key: 'all', label: 'All', count: safeProducts.length }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Product Management</h1>
              <p className="text-sm text-gray-600">Manage your product inventory and lifecycle</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowRecommendationModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Recommendations
              </button>
              <button
                onClick={() => setShowProductManagementModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Management
              </button>
              <button
                onClick={() => navigate('/single-product-upload-new')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
              <p className="text-green-800">{success}</p>
              <button 
                onClick={() => dispatch(clearSuccess())}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-red-800">{error}</p>
              <button 
                onClick={() => dispatch(clearError())}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Search and Filter Bar */}
          <div className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button 
                onClick={() => {
                  if (activeTab === 'all') {
                    dispatch(fetchProducts({ page: 1, limit: 10, search: searchTerm }));
                  } else {
                    dispatch(fetchProductsByStatus({ 
                      status: activeTab, 
                      params: { page: 1, limit: 10, search: searchTerm } 
                    }));
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Products ({safeProducts.length})
            </h3>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading products...</span>
            </div>
          ) : safeProducts.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'draft' 
                  ? 'No draft products available. Create a new product to get started.' 
                  : `No ${activeTab} products available.`}
              </p>
              {activeTab === 'draft' && (
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/single-product-upload-new')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Product
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Bulk Actions Bar */}
              {selectedProducts.length > 0 && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-blue-900">
                        {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                      </span>
                      <button
                        onClick={() => setSelectedProducts([])}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Clear selection
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowProductManagementModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                      >
                        <Settings className="w-4 h-4" />
                        Bulk Manage
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size Pricing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Media
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {safeProducts.map((item) => {
                    // Get the best available ID
                    const itemId = item._id || item.itemId || item.id;
                    
                    console.log('🔍 Rendering item:', { 
                      _id: item._id, 
                      itemId: item.itemId, 
                      id: item.id,
                      selectedId: itemId,
                      productName: item.productName,
                      status: item.status 
                    });
                    
                    if (!itemId) {
                      console.error('❌ Item missing ID fields:', item);
                      return null; // Skip items without valid IDs
                    }
                    
                    return (
                    <tr key={itemId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.some(p => (p._id || p.itemId || p.id) === itemId)}
                          onChange={(e) => handleProductSelect(item, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {item.images && item.images.length > 0 ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={item.images[0].url || item.images[0]}
                                alt={item.productName}
                                onError={(e) => {
                                  console.log('Image failed to load:', item.images[0]);
                                  e.target.style.display = 'none';
                                }}
                                onLoad={() => {
                                  console.log('Image loaded successfully:', item.images[0]);
                                }}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {item.productName?.charAt(0) || 'P'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.productName || item.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.itemId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.sizes && item.sizes.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-48">
                            {item.sizes.slice(0, 4).map((size, index) => (
                              <div key={index} className="inline-flex items-center bg-green-50 border border-green-200 rounded-lg px-2 py-1">
                                <span className="text-xs font-semibold text-green-700 uppercase mr-1">
                                  {size.size || 'ONE'}
                                </span>
                                <span className="text-xs font-bold text-green-800">
                                  ₹{size.regularPrice?.toLocaleString() || '0'}
                                </span>
                              </div>
                            ))}
                            {item.sizes.length > 4 && (
                              <div className="relative group">
                                <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 cursor-pointer">
                                  <span className="text-xs font-medium text-blue-600">
                                    +{item.sizes.length - 4}
                                  </span>
                                </div>
                                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                                  <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                    <div className="space-y-1">
                                      {item.sizes.slice(4).map((size, index) => (
                                        <div key={index} className="flex justify-between gap-3">
                                          <span className="font-semibold">{size.size || 'ONE'}:</span>
                                          <span>₹{size.regularPrice?.toLocaleString() || '0'}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="absolute top-full left-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center bg-red-50 border border-red-200 rounded-lg px-3 py-1">
                            <span className="text-red-500 text-xs font-medium">No pricing</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.sizes && item.sizes.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-48">
                            {item.sizes.slice(0, 4).map((size, index) => {
                              const quantity = size.quantity || 0;
                              const stockStatus = quantity === 0 ? 'out' : quantity < 10 ? 'low' : 'good';
                              const stockStyles = {
                                out: 'bg-red-50 border-red-200 text-red-700',
                                low: 'bg-orange-50 border-orange-200 text-orange-700', 
                                good: 'bg-blue-50 border-blue-200 text-blue-700'
                              };
                              
                              return (
                                <div key={index} className={`inline-flex items-center border rounded-lg px-2 py-1 ${stockStyles[stockStatus]}`}>
                                  <span className="text-xs font-semibold uppercase mr-1">
                                    {size.size || 'ONE'}
                                  </span>
                                  <span className="text-xs font-bold">
                                    {quantity}
                                  </span>
                                  <div className={`w-1.5 h-1.5 rounded-full ml-1 ${
                                    stockStatus === 'out' ? 'bg-red-400' : 
                                    stockStatus === 'low' ? 'bg-orange-400' : 
                                    'bg-blue-400'
                                  }`}></div>
                                </div>
                              );
                            })}
                            {item.sizes.length > 4 && (
                              <div className="relative group">
                                <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 cursor-pointer">
                                  <span className="text-xs font-medium text-gray-600">
                                    +{item.sizes.length - 4}
                                  </span>
                                </div>
                                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                                  <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                    <div className="space-y-1">
                                      {item.sizes.slice(4).map((size, index) => {
                                        const quantity = size.quantity || 0;
                                        const stockStatus = quantity === 0 ? 'text-red-400' : quantity < 10 ? 'text-orange-400' : 'text-blue-400';
                                        return (
                                          <div key={index} className="flex justify-between items-center gap-3">
                                            <span className="font-semibold">{size.size || 'ONE'}:</span>
                                            <div className="flex items-center gap-1">
                                              <span>{quantity}</span>
                                              <div className={`w-1.5 h-1.5 rounded-full ${stockStatus.replace('text-', 'bg-')}`}></div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="absolute top-full left-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center bg-red-50 border border-red-200 rounded-lg px-3 py-1">
                            <span className="text-red-500 text-xs font-medium">No stock</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status || 'draft'} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Image className="w-3 h-3" />
                            {item.images?.filter(img => img.type === 'image' || !img.type).length || 0}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Video className="w-3 h-3" />
                            {(item.images?.filter(img => img.type === 'video').length || 0) + (item.videos?.length || 0)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {item.status === 'draft' && (
                            <>
                              <button
                                onClick={() => handleAddImages(item)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Add Images"
                              >
                                <Image className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleAddVideos(item)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Add Videos"
                              >
                                <Video className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProduct(item);
                                  setShowRecommendationModal(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Recommendation Settings"
                              >
                                <Target className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  console.log('🚀 Making product live:', { 
                                    item, 
                                    itemId, 
                                    _id: item._id, 
                                    itemIdField: item.itemId,
                                    id: item.id
                                  });
                                  handleStatusUpdate(itemId, 'live');
                                }}
                                className="text-green-600 hover:text-green-900"
                                title="Make Live"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Product"
                            onClick={() => {
                              console.log('✏️ Editing product:', { 
                                item, 
                                itemId, 
                                _id: item._id, 
                                itemIdField: item.itemId,
                                id: item.id
                              });
                              navigate(`/single-product-upload-new/${itemId}`);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCategoryAssignment(item)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Assign Category & Subcategory"
                          >
                            <Tags className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSizeChart(item)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Manage Size Chart"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          {item.status === 'live' && (
                            <button
                              onClick={() => {
                                console.log('🔄 Making product inactive:', { 
                                  item, 
                                  itemId, 
                                  _id: item._id, 
                                  itemIdField: item.itemId,
                                  id: item.id
                                });
                                handleStatusUpdate(itemId, 'inactive');
                              }}
                              className="text-orange-600 hover:text-orange-900"
                              title="Make Inactive"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              console.log('🗑️ Deleting product:', { 
                                item, 
                                itemId, 
                                _id: item._id, 
                                itemIdField: item.itemId,
                                id: item.id
                              });
                              handleDeleteProduct(itemId);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} results
            </div>
            <div className="flex space-x-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    if (activeTab === 'all') {
                      dispatch(fetchProducts({ page, limit: 10, search: searchTerm }));
                    } else {
                      dispatch(fetchProductsByStatus({ 
                        status: activeTab, 
                        params: { page, limit: 10, search: searchTerm } 
                      }));
                    }
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    page === pagination.currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Upload Modal */}
      {showImageModal && selectedProduct && (
        <ImageUploadModal
          product={selectedProduct}
          onClose={() => {
            setShowImageModal(false);
            setSelectedProduct(null);
          }}
          onUpdate={(updatedProduct) => {
            // Refresh products list
            if (activeTab === 'all') {
              dispatch(fetchProducts({ page: 1, limit: 10, search: searchTerm }));
            } else {
              dispatch(fetchProductsByStatus({ 
                status: activeTab, 
                params: { page: 1, limit: 10, search: searchTerm } 
              }));
            }
            setShowImageModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Video Upload Modal */}
      {showVideoModal && selectedProduct && (
        <VideoUploadModal
          product={selectedProduct}
          onClose={() => {
            setShowVideoModal(false);
            setSelectedProduct(null);
          }}
          onUpdate={(updatedProduct) => {
            // Refresh products list
            if (activeTab === 'all') {
              dispatch(fetchProducts({ page: 1, limit: 10, search: searchTerm }));
            } else {
              dispatch(fetchProductsByStatus({ 
                status: activeTab, 
                params: { page: 1, limit: 10, search: searchTerm } 
              }));
            }
            setShowVideoModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Recommendation Settings Modal */}
      {showRecommendationModal && selectedProduct && (
        <RecommendationSettingsModal
          isOpen={showRecommendationModal}
          selectedProduct={selectedProduct}
          onClose={() => {
            setShowRecommendationModal(false);
            setSelectedProduct(null);
          }}
          onSave={async (recommendationSettings) => {
            try {
              await dispatch(updateRecommendationSettings({
                productId: selectedProduct._id || selectedProduct.id,
                settings: recommendationSettings
              })).unwrap();
              
              // Refresh products list
              if (activeTab === 'all') {
                dispatch(fetchProducts({ page: 1, limit: 10, search: searchTerm }));
              } else {
                dispatch(fetchProductsByStatus({ 
                  status: activeTab, 
                  params: { page: 1, limit: 10, search: searchTerm } 
                }));
              }
              
              setShowRecommendationModal(false);
              setSelectedProduct(null);
            } catch (error) {
              console.error('Failed to update recommendation settings:', error);
            }
          }}
        />
      )}

      {/* Product Management Modal */}
      {showProductManagementModal && (
        <ProductManagementModal
          isOpen={showProductManagementModal}
          selectedProducts={selectedProducts.length > 0 ? selectedProducts : []}
          onClose={() => {
            setShowProductManagementModal(false);
            setSelectedProducts([]);
          }}
          onBulkUpdate={async (updateData) => {
            try {
              await dispatch(bulkUpdateProductSettings(updateData)).unwrap();
              
              // Refresh products list
              if (activeTab === 'all') {
                dispatch(fetchProducts({ page: 1, limit: 10, search: searchTerm }));
              } else {
                dispatch(fetchProductsByStatus({ 
                  status: activeTab, 
                  params: { page: 1, limit: 10, search: searchTerm } 
                }));
              }
              
              setShowProductManagementModal(false);
              setSelectedProducts([]);
            } catch (error) {
              console.error('Failed to update product settings:', error);
            }
          }}
        />
      )}

      {/* Category Assignment Modal */}
      {showCategoryAssignmentModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Assign Category & Subcategory
              </h3>
              <button
                onClick={() => {
                  setShowCategoryAssignmentModal(false);
                  setSelectedProduct(null);
                  setSelectedCategoryId('');
                  setSelectedSubCategoryId('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Product: <span className="font-medium">{selectedProduct.name}</span>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    setSelectedSubCategoryId('');
                    if (e.target.value) {
                      loadSubCategories(e.target.value);
                    } else {
                      setSubCategories([]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory
                </label>
                <select
                  value={selectedSubCategoryId}
                  onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!selectedCategoryId}
                >
                  <option value="">Select a subcategory</option>
                  {subCategories.map(subCategory => (
                    <option key={subCategory._id} value={subCategory._id}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
                {!selectedCategoryId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Please select a category first
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowCategoryAssignmentModal(false);
                    setSelectedProduct(null);
                    setSelectedCategoryId('');
                    setSelectedSubCategoryId('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveCategoryAssignment()}
                  disabled={!selectedCategoryId}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Save Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Size Chart Management Modal */}
      {showSizeChartModal && selectedProduct && (
        <SizeChartModal
          product={selectedProduct}
          onClose={() => {
            setShowSizeChartModal(false);
            setSelectedProduct(null);
          }}
          onUpdate={() => {
            // Refresh products list
            if (activeTab === 'all') {
              dispatch(fetchProducts({ page: 1, limit: 10, search: searchTerm }));
            } else {
              dispatch(fetchProductsByStatus({ 
                status: activeTab, 
                params: { page: 1, limit: 10, search: searchTerm } 
              }));
            }
          }}
        />
      )}
    </div>
  );
};

// Size Chart Modal Component
const SizeChartModal = ({ product, onClose, onUpdate }) => {
  const dispatch = useDispatch();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    } else {
      alert('Please select a valid image file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a size chart image');
      return;
    }

    setLoading(true);
    try {
      await dispatch(uploadSizeChartImage({
        productId: product._id,
        imageFile: selectedFile
      })).unwrap();
      
      onUpdate();
      setSelectedFile(null);
      setPreview(null);
      console.log('✅ Size chart uploaded successfully');
    } catch (error) {
      console.error('Failed to upload size chart:', error);
      alert('Failed to upload size chart: ' + (error.message || 'Unknown error'));
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the size chart image?')) {
      return;
    }

    setLoading(true);
    try {
      await dispatch(deleteSizeChartImage({
        productId: product._id
      })).unwrap();
      
      onUpdate();
      console.log('✅ Size chart deleted successfully');
    } catch (error) {
      console.error('Failed to delete size chart:', error);
      alert('Failed to delete size chart: ' + (error.message || 'Unknown error'));
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Size Chart Management
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Product: <span className="font-medium">{product.productName}</span>
          </div>

          {/* Current Size Chart */}
          {product.sizeChartImage && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Current Size Chart</h4>
              <div className="relative">
                <img
                  src={product.sizeChartImage.url}
                  alt="Size Chart"
                  className="w-full h-48 object-contain rounded border"
                />
                <button
                  onClick={handleDelete}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  disabled={loading}
                  title="Delete size chart"
                >
                  {loading ? '...' : '×'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Uploaded: {new Date(product.sizeChartImage.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Upload New Size Chart */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">
              {product.sizeChartImage ? 'Update Size Chart' : 'Upload Size Chart'}
            </h4>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="sizeChartInput"
              />
              <label htmlFor="sizeChartInput" className="cursor-pointer">
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">
                    Click to select size chart image
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </label>
            </div>

            {/* Preview */}
            {preview && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">Preview</h5>
                <img
                  src={preview}
                  alt="Size Chart Preview"
                  className="w-full h-48 object-contain rounded border"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Upload Size Chart'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Image Upload Modal Component
const ImageUploadModal = ({ product, onClose, onUpdate }) => {
  const dispatch = useDispatch();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const newFiles = [...selectedFiles, ...validFiles];
    
    // Limit to 10 images total
    if (newFiles.length > 10) {
      alert('Maximum 10 images allowed');
      return;
    }
    
    setSelectedFiles(newFiles);
    
    // Generate previews
    const newPreviews = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));
    
    setPreviews([...previews, ...newPreviews]);
  };

  const handleFileInput = (e) => {
    handleFileSelect(e.target.files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removePreview = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Cleanup URL object
    URL.revokeObjectURL(previews[index].url);
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const removeExistingImage = async (index) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }
    
    setLoading(true);
    try {
      await dispatch(deleteProductImage({ 
        productId: product._id, 
        imageIndex: index 
      })).unwrap();
      onUpdate();
      console.log('✅ Image deleted successfully');
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image: ' + (error.message || 'Unknown error'));
    }
    setLoading(false);
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one image');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Starting image upload:', { productId: product._id, imageCount: selectedFiles.length });
      
      const result = await dispatch(uploadProductImages({ 
        productId: product._id, 
        images: selectedFiles 
      })).unwrap();
      
      console.log('✅ Image upload successful:', result);
      
      // Cleanup preview URLs
      previews.forEach(preview => URL.revokeObjectURL(preview.url));
      
      // No need to call onUpdate() since Redux state is automatically updated
      onClose();
    } catch (error) {
      console.error('❌ Failed to upload images:', error);
      alert(`Upload failed: ${error.message || error}`);
    }
    setLoading(false);
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Images</h3>
          
          {/* File Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="text-gray-600">
                <Camera className="w-12 h-12 mx-auto mb-2" />
                <p className="text-lg font-medium">Drop images here or click to upload</p>
                <p className="text-sm">PNG, JPG, GIF up to 5MB each (Max 10 images)</p>
              </div>
            </label>
          </div>

          {/* Current Images */}
          {product.images && product.images.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Current Images ({product.images.length})</h4>
              <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {product.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url || image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <button
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      disabled={loading}
                      title="Delete image"
                    >
                      {loading ? '...' : '×'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Image Previews */}
          {previews.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">New Images ({previews.length})</h4>
              <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview.url}
                      alt={preview.name}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <button
                      onClick={() => removePreview(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {(preview.size / 1024 / 1024).toFixed(1)}MB
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            {selectedFiles.length > 0 && (
              <button
                onClick={uploadImages}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? 'Uploading...' : `Upload ${selectedFiles.length} Images`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Video Upload Modal Component
const VideoUploadModal = ({ product, onClose, onUpdate }) => {
  const dispatch = useDispatch();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('video/'));
    const newFiles = [...selectedFiles, ...validFiles];
    
    // Limit to 5 videos total
    if (newFiles.length > 5) {
      alert('Maximum 5 videos allowed');
      return;
    }
    
    setSelectedFiles(newFiles);
    
    // Generate previews
    const newPreviews = validFiles.map(file => ({
      file,
      name: file.name,
      size: file.size
    }));
    
    setPreviews([...previews, ...newPreviews]);
  };

  const handleFileInput = (e) => {
    handleFileSelect(e.target.files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removePreview = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const removeExistingVideo = async (index) => {
    setLoading(true);
    try {
      console.log('🗑️ Deleting video:', { productId: product._id, videoId: index });
      
      await dispatch(deleteProductVideo({ 
        productId: product._id, 
        videoId: index 
      })).unwrap();
      
      console.log('✅ Video deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('❌ Failed to delete video:', error);
      alert(`Failed to delete video: ${error.message || error}`);
    }
    setLoading(false);
  };

  const uploadVideos = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one video');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Starting video upload:', { productId: product._id, videoCount: selectedFiles.length });
      
      const result = await dispatch(uploadProductVideos({ 
        productId: product._id, 
        videos: selectedFiles 
      })).unwrap();
      
      console.log('✅ Video upload successful:', result);
      
      // No need to call onUpdate() since Redux state is automatically updated
      onClose();
    } catch (error) {
      console.error('❌ Failed to upload videos:', error);
      alert(`Video upload failed: ${error.message || error}`);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Videos</h3>
          
          {/* File Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept="video/*"
              onChange={handleFileInput}
              className="hidden"
              id="video-upload"
            />
            <label htmlFor="video-upload" className="cursor-pointer">
              <div className="text-gray-600">
                <Video className="w-12 h-12 mx-auto mb-2" />
                <p className="text-lg font-medium">Drop videos here or click to upload</p>
                <p className="text-sm">MP4, MOV, AVI up to 50MB each (Max 5 videos)</p>
              </div>
            </label>
          </div>

          {/* Current Videos */}
          {product.videos && product.videos.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Current Videos ({product.videos.length})</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {product.videos.map((video, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded group">
                    <Video className="w-10 h-10 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 truncate">
                        {video.originalName || video.url || video}
                      </p>
                      {video.size && (
                        <p className="text-xs text-gray-400">
                          {(video.size / 1024 / 1024).toFixed(1)}MB
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeExistingVideo(index)}
                      className="text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Video Previews */}
          {previews.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">New Videos ({previews.length})</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {previews.map((preview, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded group">
                    <Video className="w-10 h-10 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 truncate">{preview.name}</p>
                      <p className="text-xs text-gray-400">
                        {(preview.size / 1024 / 1024).toFixed(1)}MB
                      </p>
                    </div>
                    <button
                      onClick={() => removePreview(index)}
                      className="text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            {selectedFiles.length > 0 && (
              <button
                onClick={uploadVideos}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? 'Uploading...' : `Upload ${selectedFiles.length} Videos`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Recommendation Settings Modal
const RecommendationSettingsModal = ({ 
  isOpen, 
  onClose, 
  selectedProduct, 
  onSave 
}) => {
  const [settings, setSettings] = useState({
    alsoShowInOptions: {
      similarItems: false,
      othersAlsoBought: false,
      youMightAlsoLike: false,
      customOptions: []
    },
    recommendationPriority: 1,
    showInRecommendations: true,
    customRecommendationText: ''
  });

  const [newCustomOption, setNewCustomOption] = useState('');

  useEffect(() => {
    if (selectedProduct && selectedProduct.recommendationSettings) {
      setSettings(selectedProduct.recommendationSettings);
    }
  }, [selectedProduct]);

  const handleToggleOption = (option) => {
    setSettings(prev => ({
      ...prev,
      alsoShowInOptions: {
        ...prev.alsoShowInOptions,
        [option]: !prev.alsoShowInOptions[option]
      }
    }));
  };

  const handleAddCustomOption = () => {
    if (newCustomOption.trim()) {
      setSettings(prev => ({
        ...prev,
        alsoShowInOptions: {
          ...prev.alsoShowInOptions,
          customOptions: [...prev.alsoShowInOptions.customOptions, newCustomOption.trim()]
        }
      }));
      setNewCustomOption('');
    }
  };

  const handleRemoveCustomOption = (index) => {
    setSettings(prev => ({
      ...prev,
      alsoShowInOptions: {
        ...prev.alsoShowInOptions,
        customOptions: prev.alsoShowInOptions.customOptions.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSave = () => {
    onSave(settings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600" />
              Recommendation Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          {selectedProduct && (
            <p className="text-sm text-gray-600 mt-2">
              Configure recommendations for: <span className="font-medium">{selectedProduct.name}</span>
            </p>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Show in Recommendations Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Show in Recommendations</h3>
              <p className="text-sm text-gray-600">Enable this product to appear in recommendation sections</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showInRecommendations}
                onChange={(e) => setSettings(prev => ({ ...prev, showInRecommendations: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Recommendation Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recommendation Priority (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.recommendationPriority}
              onChange={(e) => setSettings(prev => ({ ...prev, recommendationPriority: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Higher priority items appear first in recommendations</p>
          </div>

          {/* Also Show In Options */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Also Show In Options</h3>
            <div className="space-y-3">
              {[
                { key: 'similarItems', label: 'Similar Items', desc: 'Show in "Similar Items" section' },
                { key: 'othersAlsoBought', label: 'Others Also Bought', desc: 'Show in "Others Also Bought" section' },
                { key: 'youMightAlsoLike', label: 'You Might Also Like', desc: 'Show in "You Might Also Like" section' }
              ].map((option) => (
                <div key={option.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{option.label}</h4>
                    <p className="text-sm text-gray-600">{option.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.alsoShowInOptions[option.key]}
                      onChange={() => handleToggleOption(option.key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Options */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Custom Recommendation Sections</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCustomOption}
                  onChange={(e) => setNewCustomOption(e.target.value)}
                  placeholder="Enter custom section name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomOption()}
                />
                <button
                  onClick={handleAddCustomOption}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              {settings.alsoShowInOptions.customOptions.length > 0 && (
                <div className="space-y-2">
                  {settings.alsoShowInOptions.customOptions.map((option, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{option}</span>
                      <button
                        onClick={() => handleRemoveCustomOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Custom Recommendation Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Recommendation Text (Optional)
            </label>
            <textarea
              value={settings.customRecommendationText}
              onChange={(e) => setSettings(prev => ({ ...prev, customRecommendationText: e.target.value }))}
              placeholder="Add custom text to show with this product in recommendations"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// Product Management Modal
const ProductManagementModal = ({ 
  isOpen, 
  onClose, 
  selectedProducts = [], 
  onBulkUpdate 
}) => {
  const [settings, setSettings] = useState({
    isActive: true,
    displayOrder: 1,
    reviewSettings: {
      allowReviews: true,
      requireModeration: false,
      minRating: 1,
      maxRating: 5
    },
    returnSettings: {
      returnable: true,
      returnWindow: 30,
      returnConditions: 'original_condition'
    },
    visibilitySettings: {
      showInSearch: true,
      showInCategory: true,
      showInRecommendations: true,
      featuredProduct: false
    },
    inventorySettings: {
      trackInventory: true,
      lowStockThreshold: 10,
      allowBackorders: false
    }
  });

  const [bulkOperationType, setBulkOperationType] = useState('update');

  const handleSave = () => {
    const updateData = {
      type: bulkOperationType,
      productIds: selectedProducts.map(p => p._id || p.id),
      settings: settings
    };
    onBulkUpdate(updateData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-green-600" />
              Product Management Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {selectedProducts.length > 0 
              ? `Managing ${selectedProducts.length} selected products`
              : 'Configure product management settings'
            }
          </p>
        </div>

        <div className="p-6">
          {/* Bulk Operation Type */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Operation Type</h3>
            <div className="flex gap-4">
              {[
                { key: 'update', label: 'Update Settings', desc: 'Update selected products with new settings' },
                { key: 'activate', label: 'Activate Products', desc: 'Activate all selected products' },
                { key: 'deactivate', label: 'Deactivate Products', desc: 'Deactivate all selected products' },
                { key: 'feature', label: 'Feature Products', desc: 'Mark products as featured' }
              ].map((type) => (
                <label key={type.key} className="flex-1">
                  <input
                    type="radio"
                    name="operationType"
                    value={type.key}
                    checked={bulkOperationType === type.key}
                    onChange={(e) => setBulkOperationType(e.target.value)}
                    className="sr-only peer"
                  />
                  <div className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-green-500 peer-checked:bg-green-50 hover:border-green-300">
                    <h4 className="font-medium text-gray-900">{type.label}</h4>
                    <p className="text-sm text-gray-600 mt-1">{type.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Settings */}
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">General Settings</h3>
                
                {/* Active Status */}
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">Product Status</h4>
                    <p className="text-sm text-gray-600">Enable or disable product visibility</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.isActive}
                      onChange={(e) => setSettings(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {/* Display Order */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.displayOrder}
                    onChange={(e) => setSettings(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>
              </div>

              {/* Review Settings */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Review Settings</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Allow Reviews</h4>
                      <p className="text-sm text-gray-600">Enable customer reviews</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.reviewSettings.allowReviews}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          reviewSettings: { ...prev.reviewSettings, allowReviews: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Require Moderation</h4>
                      <p className="text-sm text-gray-600">Review before publishing</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.reviewSettings.requireModeration}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          reviewSettings: { ...prev.reviewSettings, requireModeration: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Return & Visibility Settings */}
            <div className="space-y-6">
              {/* Return Settings */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Return Settings</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Returnable</h4>
                      <p className="text-sm text-gray-600">Allow returns for this product</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.returnSettings.returnable}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          returnSettings: { ...prev.returnSettings, returnable: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Window (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={settings.returnSettings.returnWindow}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        returnSettings: { ...prev.returnSettings, returnWindow: parseInt(e.target.value) || 30 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Conditions
                    </label>
                    <select
                      value={settings.returnSettings.returnConditions}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        returnSettings: { ...prev.returnSettings, returnConditions: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="original_condition">Original Condition</option>
                      <option value="unopened_only">Unopened Only</option>
                      <option value="any_condition">Any Condition</option>
                      <option value="custom">Custom Conditions</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Visibility Settings */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Visibility Settings</h3>
                
                <div className="space-y-3">
                  {[
                    { key: 'showInSearch', label: 'Show in Search', desc: 'Include in search results' },
                    { key: 'showInCategory', label: 'Show in Category', desc: 'Display in category pages' },
                    { key: 'showInRecommendations', label: 'Show in Recommendations', desc: 'Include in recommendation sections' },
                    { key: 'featuredProduct', label: 'Featured Product', desc: 'Mark as featured product' }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{setting.label}</h4>
                        <p className="text-sm text-gray-600">{setting.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.visibilitySettings[setting.key]}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            visibilitySettings: { ...prev.visibilitySettings, [setting.key]: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inventory Settings */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Inventory Settings</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Track Inventory</h4>
                      <p className="text-sm text-gray-600">Monitor stock levels</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.inventorySettings.trackInventory}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          inventorySettings: { ...prev.inventorySettings, trackInventory: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.inventorySettings.lowStockThreshold}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        inventorySettings: { ...prev.inventorySettings, lowStockThreshold: parseInt(e.target.value) || 10 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Allow Backorders</h4>
                      <p className="text-sm text-gray-600">Accept orders when out of stock</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.inventorySettings.allowBackorders}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          inventorySettings: { ...prev.inventorySettings, allowBackorders: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemManagement;
