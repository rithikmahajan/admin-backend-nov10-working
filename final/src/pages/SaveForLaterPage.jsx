import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Bookmark, 
  BookmarkCheck, 
  ShoppingCart, 
  Heart, 
  Eye, 
  Trash2, 
  Grid3X3, 
  List, 
  Filter,
  SortAsc,
  SortDesc,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import {
  selectSaveForLaterItems,
  selectSaveForLaterCount,
  selectSaveForLaterLoading,
  selectSaveForLaterError,
  fetchSaveForLater,
  removeFromSaveForLaterAPI,
  moveToCartFromSaveForLater,
  moveToWishlistFromSaveForLater,
  clearSaveForLaterAPI,
  removeFromSaveForLater,
} from '../store/slices/saveForLaterSlice';
import { addToCart } from '../store/slices/cartSlice';
import { addToWishlist } from '../store/slices/wishlistSlice';

const SaveForLaterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux state
  const items = useSelector(selectSaveForLaterItems);
  const count = useSelector(selectSaveForLaterCount);
  const loading = useSelector(selectSaveForLaterLoading);
  const error = useSelector(selectSaveForLaterError);
  
  // Local state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('dateAdded'); // 'dateAdded', 'name', 'price'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    dispatch(fetchSaveForLater());
  }, [dispatch]);

  // Filter and sort items
  const getFilteredAndSortedItems = () => {
    let filteredItems = [...items];
    
    // Apply price filter
    if (priceRange.min || priceRange.max) {
      filteredItems = filteredItems.filter(item => {
        const price = item.salePrice || item.regularPrice || 0;
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }
    
    // Apply category filter
    if (categoryFilter) {
      filteredItems = filteredItems.filter(item => 
        item.categoryId?.name?.toLowerCase().includes(categoryFilter.toLowerCase()) ||
        item.subCategoryId?.name?.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }
    
    // Apply sorting
    filteredItems.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'name':
          aVal = a.productName?.toLowerCase() || '';
          bVal = b.productName?.toLowerCase() || '';
          break;
        case 'price':
          aVal = a.salePrice || a.regularPrice || 0;
          bVal = b.salePrice || b.regularPrice || 0;
          break;
        case 'dateAdded':
        default:
          aVal = new Date(a.dateAdded || 0);
          bVal = new Date(b.dateAdded || 0);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filteredItems;
  };

  const filteredItems = getFilteredAndSortedItems();

  const handleMoveToCart = async (item) => {
    try {
      const cartData = {
        itemId: item.id || item._id,
        quantity: 1,
        size: 'M',
        color: 'Default',
      };
      
      await dispatch(moveToCartFromSaveForLater({ itemId: item.id || item._id, cartData }));
      dispatch(addToCart({
        ...item,
        quantity: 1,
        selectedSize: 'M',
        selectedColor: 'Default',
      }));
    } catch (error) {
      console.error('Error moving to cart:', error);
    }
  };

  const handleMoveToWishlist = async (item) => {
    try {
      await dispatch(moveToWishlistFromSaveForLater(item.id || item._id));
      dispatch(addToWishlist(item));
    } catch (error) {
      console.error('Error moving to wishlist:', error);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await dispatch(removeFromSaveForLaterAPI(itemId));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id || item._id)));
    }
  };

  const handleBulkRemove = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      // Remove items one by one since bulkRemoveFromSaveForLater doesn't exist
      const itemsToRemove = Array.from(selectedItems);
      await Promise.all(
        itemsToRemove.map(itemId => dispatch(removeFromSaveForLaterAPI(itemId)))
      );
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Error removing selected items:', error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all saved items?')) {
      try {
        await dispatch(clearSaveForLaterAPI());
        setSelectedItems(new Set());
      } catch (error) {
        console.error('Error clearing all items:', error);
      }
    }
  };

  const handleViewProduct = (item) => {
    navigate(`/product/${item.id || item._id}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading && count === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-sm">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">
              <X className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Saved Items</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => dispatch(fetchSaveForLater())}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Bookmark className="h-8 w-8 mr-3 text-blue-600" />
                Save For Later
              </h1>
              <p className="text-gray-600 mt-1">
                {count === 0 ? 'No items saved' : `${count} ${count === 1 ? 'item' : 'items'} saved`}
              </p>
            </div>
            
            {count > 0 && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </button>
                
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          {showFilters && count > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="dateAdded">Date Added</option>
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="desc">High to Low</option>
                    <option value="asc">Low to High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    placeholder="Filter by category"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {count > 0 && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  {selectedItems.size === filteredItems.length ? (
                    <CheckSquare className="h-4 w-4 mr-2" />
                  ) : (
                    <Square className="h-4 w-4 mr-2" />
                  )}
                  Select All ({filteredItems.length})
                </button>
                
                {selectedItems.size > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedItems.size} selected
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {selectedItems.size > 0 && (
                  <button
                    onClick={handleBulkRemove}
                    className="flex items-center px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Selected
                  </button>
                )}
                
                <button
                  onClick={handleClearAll}
                  className="flex items-center px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {count === 0 && !loading && (
          <div className="text-center py-16">
            <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items saved for later</h3>
            <p className="text-gray-600 mb-6">
              Items you save for later will appear here. Start browsing to find items you'd like to save!
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </button>
          </div>
        )}

        {/* Items Grid/List */}
        {filteredItems.length > 0 && (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
              : 'space-y-4'
          }>
            {filteredItems.map((item) => (
              <div
                key={item.id || item._id}
                className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'flex items-center p-4' : 'overflow-hidden'
                }`}
              >
                {/* Selection Checkbox */}
                <div className={`${viewMode === 'list' ? 'mr-4' : 'absolute top-2 left-2 z-10'}`}>
                  <button
                    onClick={() => handleSelectItem(item.id || item._id)}
                    className="p-1 rounded bg-white shadow-sm border"
                  >
                    {selectedItems.has(item.id || item._id) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Product Image */}
                <div className={viewMode === 'list' ? 'w-24 h-24 flex-shrink-0 mr-4' : 'relative'}>
                  <img
                    src={item.images?.[0] || '/api/placeholder/300/300'}
                    alt={item.productName}
                    className={`object-cover ${
                      viewMode === 'list' ? 'w-full h-full rounded-md' : 'w-full h-48'
                    }`}
                  />
                </div>

                {/* Product Details */}
                <div className={viewMode === 'list' ? 'flex-grow' : 'p-4'}>
                  <div className={viewMode === 'list' ? 'flex justify-between items-start' : ''}>
                    <div className={viewMode === 'list' ? 'flex-grow pr-4' : ''}>
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                        {item.productName}
                      </h3>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {item.categoryId?.name && (
                          <span>{item.categoryId.name}</span>
                        )}
                        {item.subCategoryId?.name && (
                          <span> • {item.subCategoryId.name}</span>
                        )}
                        {item.brand && (
                          <span> • {item.brand}</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mb-3">
                        {item.salePrice && item.salePrice < item.regularPrice ? (
                          <>
                            <span className="text-lg font-semibold text-gray-900">
                              {formatPrice(item.salePrice)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(item.regularPrice)}
                            </span>
                            <span className="text-sm text-green-600 font-medium">
                              {Math.round(((item.regularPrice - item.salePrice) / item.regularPrice) * 100)}% off
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-semibold text-gray-900">
                            {formatPrice(item.regularPrice || item.salePrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={`flex ${viewMode === 'list' ? 'flex-col space-y-2' : 'flex-wrap gap-2'}`}>
                      <button
                        onClick={() => handleMoveToCart(item)}
                        className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add to Cart
                      </button>
                      
                      <button
                        onClick={() => handleMoveToWishlist(item)}
                        className="flex items-center justify-center px-3 py-2 bg-pink-100 text-pink-600 text-sm rounded-md hover:bg-pink-200 transition-colors"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        Wishlist
                      </button>
                      
                      <button
                        onClick={() => handleViewProduct(item)}
                        className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      
                      <button
                        onClick={() => handleRemoveItem(item.id || item._id)}
                        className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-600 text-sm rounded-md hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredItems.length === 0 && count > 0 && (
          <div className="text-center py-16">
            <Filter className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items match your filters</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters to see more results.
            </p>
            <button
              onClick={() => {
                setPriceRange({ min: '', max: '' });
                setCategoryFilter('');
                setSortBy('dateAdded');
                setSortOrder('desc');
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaveForLaterPage;
