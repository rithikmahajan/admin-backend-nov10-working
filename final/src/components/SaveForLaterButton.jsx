import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bookmark, BookmarkCheck, Loader2, Heart } from 'lucide-react';
import {
  addToSaveForLaterAPI,
  removeFromSaveForLaterAPI,
  selectSaveForLaterItems,
  selectSaveForLaterLoading,
  isInSaveForLater,
  addToSaveForLater,
  removeFromSaveForLater,
  toggleSaveForLaterItem,
} from '../store/slices/saveForLaterSlice';
import { selectIsAuthenticated } from '../store/slices/authSlice';

const SaveForLaterButton = ({
  item,
  size = 'md',
  variant = 'icon',
  className = '',
  showText = true,
  onToggle = null,
}) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const saveForLaterItems = useSelector(selectSaveForLaterItems);
  const globalLoading = useSelector(selectSaveForLaterLoading);
  const itemSaved = useSelector(state => isInSaveForLater(state, item.id || item._id));

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading || globalLoading) return;

    setIsLoading(true);

    try {
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

      if (itemSaved) {
        // Remove from save for later
        if (isAuthenticated) {
          await dispatch(removeFromSaveForLaterAPI(itemData.id)).unwrap();
        } else {
          dispatch(removeFromSaveForLater(itemData.id));
        }
      } else {
        // Add to save for later
        if (isAuthenticated) {
          await dispatch(addToSaveForLaterAPI(itemData)).unwrap();
        } else {
          dispatch(addToSaveForLater(itemData));
        }
      }

      // Call external toggle handler if provided
      if (onToggle) {
        onToggle(itemData, !itemSaved);
      }
    } catch (error) {
      console.error('Error toggling save for later:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'lg':
        return 'w-12 h-12 text-lg';
      default:
        return 'w-10 h-10 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'button':
        return 'px-4 py-2 rounded-lg border transition-all duration-200';
      case 'text':
        return 'text-blue-600 hover:text-blue-800 underline';
      default:
        return 'rounded-full border transition-all duration-200 flex items-center justify-center';
    }
  };

  const getStatusClasses = () => {
    if (itemSaved) {
      return variant === 'icon' 
        ? 'bg-blue-100 border-blue-200 text-blue-600 hover:bg-blue-200'
        : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';
    }
    return variant === 'icon'
      ? 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
  };

  const IconComponent = () => {
    if (isLoading || globalLoading) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    return itemSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />;
  };

  const getButtonText = () => {
    if (isLoading || globalLoading) return 'Processing...';
    return itemSaved ? 'Saved for Later' : 'Save for Later';
  };

  if (variant === 'text') {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading || globalLoading}
        className={`${getVariantClasses()} ${className} ${
          isLoading || globalLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {getButtonText()}
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading || globalLoading}
        className={`${getVariantClasses()} ${getStatusClasses()} ${className} ${
          isLoading || globalLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <IconComponent />
          {showText && (
            <span className="text-sm font-medium">
              {getButtonText()}
            </span>
          )}
        </div>
      </button>
    );
  }

  // Default icon variant
  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || globalLoading}
      className={`${getSizeClasses()} ${getVariantClasses()} ${getStatusClasses()} ${className} ${
        isLoading || globalLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title={itemSaved ? 'Remove from Save for Later' : 'Save for Later'}
    >
      <IconComponent />
    </button>
  );
};

export default SaveForLaterButton;
