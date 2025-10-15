import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bookmark, BookmarkCheck, ShoppingCart, Heart, Eye, Trash2 } from 'lucide-react';
import {
  selectSaveForLaterItems,
  selectSaveForLaterCount,
  selectSaveForLaterLoading,
  fetchSaveForLater,
  removeFromSaveForLaterAPI,
  moveToCartFromSaveForLater,
  moveToWishlistFromSaveForLater,
} from '../store/slices/saveForLaterSlice';
import { addToCart } from '../store/slices/cartSlice';
import { addToWishlist } from '../store/slices/wishlistSlice';

const SaveForLaterWidget = ({ 
  maxItems = 3, 
  showInSidebar = false, 
  className = '' 
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const items = useSelector(selectSaveForLaterItems);
  const count = useSelector(selectSaveForLaterCount);
  const loading = useSelector(selectSaveForLaterLoading);
  
  useEffect(() => {
    if (count === 0 && !loading) {
      dispatch(fetchSaveForLater());
    }
  }, [dispatch, count, loading]);
  
  const displayItems = items.slice(0, maxItems);
  
  const handleMoveToCart = async (item) => {
    try {
      const cartData = {
        itemId: item.id,
        quantity: 1,
        size: 'M',
        color: 'Default',
      };
      
      await dispatch(moveToCartFromSaveForLater({ itemId: item.id, cartData }));
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
      await dispatch(moveToWishlistFromSaveForLater(item.id));
      dispatch(addToWishlist(item));
    } catch (error) {
      console.error('Error moving to wishlist:', error);
    }
  };
  
  const handleRemoveItem = async (itemId) => {
    try {
      await dispatch(removeFromSaveForLaterAPI(itemId));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };
  
  const handleViewAll = () => {
    navigate('/save-for-later');
  };
  
  if (loading && count === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex space-x-3">
                  <div className="h-12 w-12 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (count === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
        <div className="p-4 text-center">
          <Bookmark className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No items saved for later</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Save for Later</h3>
            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
              {count}
            </span>
          </div>
          {count > maxItems && (
            <button
              onClick={handleViewAll}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              View all
            </button>
          )}
        </div>
      </div>
      
      {/* Items List */}
      <div className="p-4 space-y-4">
        {displayItems.map((item) => (
          <div key={item.id} className="flex items-center space-x-3 group">
            {/* Item Image */}
            <div className="flex-shrink-0">
              <img
                src={item.image || '/api/placeholder/50/50'}
                alt={item.name}
                className="w-12 h-12 object-cover rounded border"
              />
            </div>
            
            {/* Item Details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-600 font-semibold">
                  ₹{item.price}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(item.savedAt).toLocaleDateString()}
                </p>
              </div>
              {item.note && (
                <p className="text-xs text-gray-400 italic truncate mt-1">
                  "{item.note}"
                </p>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleMoveToCart(item)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                  title="Add to Cart"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveToWishlist(item)}
                  className="p-1.5 text-pink-600 hover:bg-pink-50 rounded"
                  title="Move to Wishlist"
                >
                  <Heart className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer Actions */}
      {count > 0 && (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={handleViewAll}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              View All ({count})
            </button>
            <button
              onClick={() => {
                // Move all visible items to cart
                displayItems.forEach(item => handleMoveToCart(item));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              title="Add all visible items to cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Quick Save For Later Button for product cards/lists
export const QuickSaveForLaterButton = ({ item, className = '' }) => {
  const dispatch = useDispatch();
  const isInSaveForLater = useSelector(state => 
    state.saveForLater.items.some(savedItem => savedItem.id === (item._id || item.id))
  );
  
  const handleQuickSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const itemData = {
      id: item._id || item.id,
      name: item.productName || item.name || item.title,
      price: item.regularPrice || item.price || item.salePrice || 0,
      image: item.images?.[0] || item.image,
      category: item.categoryId?.name || item.category,
      subcategory: item.subCategoryId?.name || item.subcategory,
      brand: item.brand,
      description: item.description,
      sku: item.productId || item.sku,
    };
    
    if (isInSaveForLater) {
      dispatch({ type: 'saveForLater/removeFromSaveForLater', payload: itemData.id });
    } else {
      dispatch({ type: 'saveForLater/addToSaveForLater', payload: itemData });
    }
  };
  
  return (
    <button
      onClick={handleQuickSave}
      className={`p-2 rounded-full transition-all duration-200 ${
        isInSaveForLater
          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
      } ${className}`}
      title={isInSaveForLater ? 'Remove from Save for Later' : 'Save for Later'}
    >
      {isInSaveForLater ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
    </button>
  );
};

export default SaveForLaterWidget;
