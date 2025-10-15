/**
 * ProductBundling Component
 * 
 * Simple bundling interface for creating product bundles:
 * - 1 Main product (category → subcategory → item)
 * - 2 Bundle items (category → subcategory → item each)
 * - Save and manage bundles
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDown, Plus, Edit, Trash2, RefreshCw, X, Check } from "lucide-react";

// Redux actions
import {
  getAllProductBundles,
  createProductBundle,
  updateProductBundle,
  deleteProductBundle,
  getItemsForBundling,
  getCategoriesForBundling,
  clearError,
} from "../store/slices/productBundleSlice";

const ProductBundling = () => {
  // Redux setup
  const dispatch = useDispatch();
  const {
    bundles,
    availableItems,
    categories,
    subcategories,
    loading,
    bundlesLoading,
    itemsLoading,
    categoriesLoading,
    error,
  } = useSelector((state) => state.productBundle);

  const { user } = useSelector((state) => state.auth);

  // Local state
  const [bundleName, setBundleName] = useState("");
  const [bundleDescription, setBundleDescription] = useState("");
  
  // Main product state
  const [mainProduct, setMainProduct] = useState({
    categoryId: "",
    subCategoryId: "",
    itemId: "",
    productData: null,
  });

  // Bundle items state (2 items)
  const [bundleItems, setBundleItems] = useState([
    { categoryId: "", subCategoryId: "", itemId: "", productData: null },
    { categoryId: "", subCategoryId: "", itemId: "", productData: null },
  ]);

  const [showBundleList, setShowBundleList] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Initialize data
  useEffect(() => {
    dispatch(getCategoriesForBundling());
    dispatch(getAllProductBundles({ page: 1, limit: 10 }));
    dispatch(getItemsForBundling({ page: 1, limit: 100 }));
  }, [dispatch]);

  // Helper functions
  const getCategoryOptions = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];
    return categories.map(cat => ({
      value: cat._id,
      label: cat.name,
    }));
  }, [categories]);

  const getSubcategoryOptions = useCallback((categoryId) => {
    if (!categoryId || !subcategories || !Array.isArray(subcategories)) return [];
    return subcategories
      .filter(sub => sub.categoryId && sub.categoryId._id === categoryId)
      .map(sub => ({
        value: sub._id,
        label: sub.name,
      }));
  }, [subcategories]);

  const getItemOptions = useCallback((categoryId, subCategoryId) => {
    if (!availableItems || !Array.isArray(availableItems)) return [];
    
    return availableItems
      .filter(item => {
        const matchesCategory = !categoryId || 
          (item.categoryId && (item.categoryId._id === categoryId || item.categoryId === categoryId));
        const matchesSubCategory = !subCategoryId || 
          (item.subCategoryId && (item.subCategoryId._id === subCategoryId || item.subCategoryId === subCategoryId));
        return matchesCategory && matchesSubCategory;
      })
      .map(item => ({
        value: item._id,
        label: `${item.productName} - ₹${item.price || item.regularPrice || 0}`,
        data: item,
      }));
  }, [availableItems]);

  // Event handlers
  const handleMainProductChange = useCallback((field, value) => {
    setMainProduct(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field === 'categoryId') {
        updated.subCategoryId = '';
        updated.itemId = '';
        updated.productData = null;
      } else if (field === 'subCategoryId') {
        updated.itemId = '';
        updated.productData = null;
      } else if (field === 'itemId') {
        const selectedItem = availableItems?.find(item => item._id === value);
        updated.productData = selectedItem || null;
      }
      
      return updated;
    });
  }, [availableItems]);

  const handleBundleItemChange = useCallback((itemIndex, field, value) => {
    setBundleItems(prev => prev.map((item, index) => {
      if (index !== itemIndex) return item;
      
      const updated = { ...item, [field]: value };
      
      if (field === 'categoryId') {
        updated.subCategoryId = '';
        updated.itemId = '';
        updated.productData = null;
      } else if (field === 'subCategoryId') {
        updated.itemId = '';
        updated.productData = null;
      } else if (field === 'itemId') {
        const selectedItem = availableItems?.find(item => item._id === value);
        updated.productData = selectedItem || null;
      }
      
      return updated;
    }));
  }, [availableItems]);

  const handleCreateBundle = useCallback(async () => {
    // Validation
    if (!bundleName.trim()) {
      alert('Please enter a bundle name');
      return;
    }
    
    if (!mainProduct.itemId || !mainProduct.productData) {
      alert('Please select a main product');
      return;
    }
    
    const validBundleItems = bundleItems.filter(item => item.itemId && item.productData);
    if (validBundleItems.length === 0) {
      alert('Please select at least one bundle item');
      return;
    }

    // Calculate pricing
    const mainPrice = mainProduct.productData.price || mainProduct.productData.regularPrice || 0;
    const bundleItemsPrice = validBundleItems.reduce((total, item) => {
      return total + (item.productData.price || item.productData.regularPrice || 0);
    }, 0);
    
    const totalOriginalPrice = mainPrice + bundleItemsPrice;
    const discountPercentage = 10; // 10% discount
    const bundlePrice = totalOriginalPrice * (1 - discountPercentage / 100);

    // Prepare bundle data
    const bundleData = {
      bundleName,
      description: bundleDescription,
      mainProduct: {
        itemId: mainProduct.productData._id,
        productName: mainProduct.productData.productName,
        categoryId: mainProduct.categoryId,
        subCategoryId: mainProduct.subCategoryId,
        categoryName: categories?.find(cat => cat._id === mainProduct.categoryId)?.name || '',
        subCategoryName: subcategories?.find(sub => sub._id === mainProduct.subCategoryId)?.name || '',
        image: mainProduct.productData.image || mainProduct.productData.images?.[0] || '',
        price: mainPrice
      },
      bundleItems: validBundleItems.map((item, index) => ({
        itemId: item.productData._id,
        productName: item.productData.productName,
        categoryId: item.categoryId,
        subCategoryId: item.subCategoryId,
        categoryName: categories?.find(cat => cat._id === item.categoryId)?.name || '',
        subCategoryName: subcategories?.find(sub => sub._id === item.subCategoryId)?.name || '',
        image: item.productData.image || item.productData.images?.[0] || '',
        price: item.productData.price || item.productData.regularPrice || 0,
        discountPrice: 0,
        position: index
      })),
      totalOriginalPrice,
      bundlePrice,
      discountAmount: totalOriginalPrice - bundlePrice,
      discountPercentage,
      isActive: true,
      priority: 1,
      createdBy: user?.name || user?.email || 'admin'
    };

    try {
      await dispatch(createProductBundle(bundleData)).unwrap();
      setSuccessMessage('Bundle created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reset form
      setBundleName('');
      setBundleDescription('');
      setMainProduct({
        categoryId: "",
        subCategoryId: "",
        itemId: "",
        productData: null,
      });
      setBundleItems([
        { categoryId: "", subCategoryId: "", itemId: "", productData: null },
        { categoryId: "", subCategoryId: "", itemId: "", productData: null },
      ]);
      
      // Refresh bundles list
      dispatch(getAllProductBundles({ page: 1, limit: 10 }));
    } catch (error) {
      alert('Failed to create bundle: ' + (error.message || error));
    }
  }, [bundleName, bundleDescription, mainProduct, bundleItems, categories, subcategories, user, dispatch]);

  const handleDeleteBundle = useCallback(async (bundleId) => {
    if (!window.confirm('Are you sure you want to delete this bundle?')) {
      return;
    }

    try {
      await dispatch(deleteProductBundle(bundleId)).unwrap();
      setSuccessMessage('Bundle deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      dispatch(getAllProductBundles({ page: 1, limit: 10 }));
    } catch (error) {
      alert('Failed to delete bundle: ' + (error.message || error));
    }
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(getCategoriesForBundling());
    dispatch(getAllProductBundles({ page: 1, limit: 10 }));
    dispatch(getItemsForBundling({ page: 1, limit: 100 }));
  }, [dispatch]);

  // Render product selector component
  const ProductSelector = ({ title, product, onProductChange, itemIndex = null }) => (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
      
      {/* Category Selection */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={product.categoryId || ''}
          onChange={(e) => itemIndex !== null 
            ? handleBundleItemChange(itemIndex, 'categoryId', e.target.value)
            : onProductChange('categoryId', e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Category</option>
          {getCategoryOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Subcategory Selection */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
        <select
          value={product.subCategoryId || ''}
          onChange={(e) => itemIndex !== null 
            ? handleBundleItemChange(itemIndex, 'subCategoryId', e.target.value)
            : onProductChange('subCategoryId', e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!product.categoryId}
        >
          <option value="">Select Subcategory</option>
          {getSubcategoryOptions(product.categoryId).map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Item Selection */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
        <select
          value={product.itemId || ''}
          onChange={(e) => itemIndex !== null 
            ? handleBundleItemChange(itemIndex, 'itemId', e.target.value)
            : onProductChange('itemId', e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!product.subCategoryId}
        >
          <option value="">Select Product</option>
          {getItemOptions(product.categoryId, product.subCategoryId).map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Selected Product Preview */}
      {product.productData && (
        <div className="bg-white p-3 rounded border border-gray-200">
          <h5 className="font-medium text-gray-900">{product.productData.productName}</h5>
          <p className="text-sm text-gray-600">
            Price: ₹{product.productData.price || product.productData.regularPrice || 0}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Bundling</h1>
              <p className="text-gray-600 mt-1">Create and manage product bundles to increase sales</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={() => setShowBundleList(!showBundleList)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {showBundleList ? 'Show Bundle List' : 'Hide Bundle List'}
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bundle Creation Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Bundle</h2>
            
            {/* Bundle Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bundle Name *
              </label>
              <input
                type="text"
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bundle name"
              />
            </div>

            {/* Bundle Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={bundleDescription}
                onChange={(e) => setBundleDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bundle description"
              />
            </div>

            {/* Main Product */}
            <div className="mb-6">
              <ProductSelector
                title="Main Product *"
                product={mainProduct}
                onProductChange={handleMainProductChange}
              />
            </div>

            {/* Bundle Items */}
            <div className="space-y-4 mb-6">
              {bundleItems.map((item, index) => (
                <ProductSelector
                  key={`bundle-item-${index}`}
                  title={`Bundle Item ${index + 1}`}
                  product={item}
                  onProductChange={null}
                  itemIndex={index}
                />
              ))}
            </div>

            {/* Create Bundle Button */}
            <button
              onClick={handleCreateBundle}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Bundle...' : 'Create Bundle'}
            </button>
          </div>

          {/* Bundle List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Bundles</h2>
            
            {bundlesLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading bundles...</p>
              </div>
            ) : bundles && bundles.length > 0 ? (
              <div className="space-y-3">
                {bundles.map((bundle) => (
                  <div key={bundle._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{bundle.bundleName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Main: {bundle.mainProduct?.productName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Items: {bundle.bundleItems?.length || 0}
                        </p>
                        <p className="text-sm text-gray-600">
                          Price: ₹{bundle.bundlePrice?.toFixed(2) || 0}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteBundle(bundle._id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete Bundle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No bundles created yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductBundling;
