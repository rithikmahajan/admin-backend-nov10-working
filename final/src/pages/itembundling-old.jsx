/**
 * ProductBundling Component
 *
 * A comprehensive product bundling management interface that allows users to:
 * - Select and configure main products and bundle items with real-time backend integration
 * - Drag and drop to arrange bundle preview
 * - Create, edit, and delete product bundles with full CRUD operations
 * - Manage bundle lists with Redux state management
 *
 * Features:
 * - Dynamic product selection with real-time category/subcategory filtering
 * - Real-time drag and drop arrangement
 * - Modal-based editing interface
 * - Redux state management with optimized performance
 * - Backend API integration with proper error handling
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDown, Plus, Edit, Trash2, GripVertical, Search, Filter, RefreshCw, X, Check } from "lucide-react";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import SuccessModal from "../components/SuccessModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Redux actions and selectors
import {
  getAllProductBundles,
  createProductBundle,
  updateProductBundle,
  deleteProductBundle,
  toggleBundleStatus,
  updateBundleItemsOrder,
  getItemsForBundling,
  getCategoriesForBundling,
  clearError,
  clearCurrentBundle,
  updateFilters,
  updateItemFilters,
} from "../store/slices/productBundleSlice";

// Constants
const INITIAL_MAIN_PRODUCT = {
  categoryId: "",
  subCategoryId: "",
  itemId: "",
  productData: null,
};

const INITIAL_BUNDLE_ITEMS = [
  { id: "item1", categoryId: "", subCategoryId: "", itemId: "", productData: null },
  { id: "item2", categoryId: "", subCategoryId: "", itemId: "", productData: null },
];

// Sortable Item Component for drag and drop
const SortableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const ProductBundling = () => {
  // Redux setup
  const dispatch = useDispatch();
  const {
    bundles,
    availableItems,
    categories,
    subcategories,
    pagination,
    itemsPagination,
    loading,
    bundlesLoading,
    itemsLoading,
    categoriesLoading,
    createLoading,
    updateLoading,
    deleteLoading,
    error,
    bundlesError,
    itemsError,
    filters,
    itemFilters
  } = useSelector((state) => state.productBundle);

  // Get current user from auth state
  const { user } = useSelector((state) => state.auth);

  // Local state management
  const [mainProduct, setMainProduct] = useState(INITIAL_MAIN_PRODUCT);
  const [bundleItems, setBundleItems] = useState(INITIAL_BUNDLE_ITEMS);
  const [bundleName, setBundleName] = useState("");
  const [bundleDescription, setBundleDescription] = useState("");
  const [showBundleList, setShowBundleList] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [bundleToDelete, setBundleToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize data on component mount
  useEffect(() => {
    dispatch(getCategoriesForBundling());
    dispatch(getAllProductBundles({ page: 1, limit: 10 }));
    dispatch(getItemsForBundling({ page: 1, limit: 50 }));
  }, [dispatch]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Auto-refresh items when needed for item selector
  useEffect(() => {
    if (showItemSelector && currentSelectingFor) {
      // Get the current product being edited
      let currentProduct = null;
      if (currentSelectingFor === "main") {
        currentProduct = mainProduct;
      } else {
        currentProduct = bundleItems.find(item => item.id === currentSelectingFor);
      }

      // If we have category and subcategory, fetch items for that combination
      if (currentProduct && currentProduct.category && currentProduct.subcategory) {
        dispatch(getItemsForBundling({ 
          categoryId: currentProduct.category, 
          subCategoryId: currentProduct.subcategory, 
          page: 1, 
          limit: 100 
        }));
      }
    }
  }, [showItemSelector, currentSelectingFor, mainProduct, bundleItems, dispatch]);

  // Memoized utility functions
  const getCategoryOptions = useMemo(() => {
    if (!categories || !Array.isArray(categories)) {
      return [];
    }
    return categories.map(cat => ({
      value: cat._id,
      label: cat.name,
    }));
  }, [categories]);

  const getSubcategoriesForCategory = useCallback((categoryId) => {
    if (!categoryId || !subcategories || !Array.isArray(subcategories)) return [];
    return subcategories
      .filter(sub => sub.categoryId && sub.categoryId._id === categoryId)
      .map(sub => ({
        value: sub._id,
        label: sub.name,
      }));
  }, [subcategories]);

  // Helper functions
  const getItemsForCategory = useCallback((categoryId, subCategoryId) => {
    if (!availableItems || !Array.isArray(availableItems)) return [];
    
    return availableItems.filter(item => {
      const matchesCategory = !categoryId || item.categoryId?._id === categoryId || item.categoryId === categoryId;
      const matchesSubCategory = !subCategoryId || item.subCategoryId?._id === subCategoryId || item.subCategoryId === subCategoryId;
      return matchesCategory && matchesSubCategory;
    });
  }, [availableItems]);

  const findItemById = useCallback((itemId) => {
    if (!availableItems || !Array.isArray(availableItems)) return null;
    return availableItems.find(item => item._id === itemId);
  }, [availableItems]);

  // Product selection handlers
  const handleMainProductChange = useCallback((field, value) => {
    setMainProduct(prev => {
      const updated = { ...prev, [field]: value };
      
      // Clear dependent fields when parent changes
      if (field === 'categoryId') {
        updated.subCategoryId = '';
        updated.itemId = '';
        updated.productData = null;
      } else if (field === 'subCategoryId') {
        updated.itemId = '';
        updated.productData = null;
      } else if (field === 'itemId') {
        updated.productData = findItemById(value);
      }
      
      return updated;
    });
  }, [findItemById]);

  const handleBundleItemChange = useCallback((itemIndex, field, value) => {
    setBundleItems(prev => prev.map((item, index) => {
      if (index !== itemIndex) return item;
      
      const updated = { ...item, [field]: value };
      
      // Clear dependent fields when parent changes
      if (field === 'categoryId') {
        updated.subCategoryId = '';
        updated.itemId = '';
        updated.productData = null;
      } else if (field === 'subCategoryId') {
        updated.itemId = '';
        updated.productData = null;
      } else if (field === 'itemId') {
        updated.productData = findItemById(value);
      }
      
      return updated;
    }));
  }, [findItemById]);

  // Bundle creation handler
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
    const bundlePrice = totalOriginalPrice * 0.9; // 10% discount as default
    
    // Prepare bundle data
    const bundleData = {
      bundleName,
      description: bundleDescription,
      mainProduct: {
        itemId: mainProduct.productData._id,
        productName: mainProduct.productData.productName,
        categoryId: mainProduct.categoryId,
        subCategoryId: mainProduct.subCategoryId,
        categoryName: categories.find(cat => cat._id === mainProduct.categoryId)?.name || '',
        subCategoryName: subcategories.find(sub => sub._id === mainProduct.subCategoryId)?.name || '',
        image: mainProduct.productData.image || mainProduct.productData.images?.[0] || '',
        price: mainPrice
      },
      bundleItems: validBundleItems.map((item, index) => ({
        itemId: item.productData._id,
        productName: item.productData.productName,
        categoryId: item.categoryId,
        subCategoryId: item.subCategoryId,
        categoryName: categories.find(cat => cat._id === item.categoryId)?.name || '',
        subCategoryName: subcategories.find(sub => sub._id === item.subCategoryId)?.name || '',
        image: item.productData.image || item.productData.images?.[0] || '',
        price: item.productData.price || item.productData.regularPrice || 0,
        discountPrice: 0,
        position: index
      })),
      totalOriginalPrice,
      bundlePrice,
      discountAmount: totalOriginalPrice - bundlePrice,
      discountPercentage: ((totalOriginalPrice - bundlePrice) / totalOriginalPrice) * 100,
      isActive: true,
      priority: 1,
      createdBy: user?.name || user?.email || 'admin'
    };
    
    try {
      await dispatch(createProductBundle(bundleData)).unwrap();
      setShowSuccessModal(true);
      
      // Reset form
      setMainProduct(INITIAL_MAIN_PRODUCT);
      setBundleItems(INITIAL_BUNDLE_ITEMS);
      setBundleName('');
      setBundleDescription('');
      
      // Refresh bundles list
      dispatch(getAllProductBundles({ page: 1, limit: 10 }));
    } catch (error) {
      alert('Failed to create bundle: ' + error);
    }
  }, [bundleName, bundleDescription, mainProduct, bundleItems, categories, subcategories, user, dispatch]);

  const handleSubcategorySelectionForProduct = useCallback((productId, categoryId, subcategoryId) => {
    // Update the product state
    if (productId === "main") {
      setMainProduct(prev => ({ 
        ...prev, 
        subcategory: subcategoryId, 
        item: "", 
        productData: null 
      }));
    } else {
      setBundleItems(prev => 
        prev.map(item => 
          item.id === productId 
            ? { ...item, subcategory: subcategoryId, item: "", productData: null }
            : item
        )
      );
    }

    // Fetch items for this category and subcategory combination
    if (categoryId && subcategoryId) {
      dispatch(getItemsForBundling({ 
        categoryId, 
        subCategoryId: subcategoryId, 
        page: 1, 
        limit: 100 
      }));
    }
  }, [dispatch]);

  // Bundle creation and management handlers
  const handleCreateBundle = useCallback(async () => {
    if (!bundleName || !mainProduct.productData) {
      alert("Please fill in bundle name and select a main product");
      return;
    }

    const validBundleItems = bundleItems.filter(item => item.productData);
    if (validBundleItems.length === 0) {
      alert("Please select at least one bundle item");
      return;
    }

    // Calculate bundle price as sum of all item prices
    const mainPrice = mainProduct.productData.currentPrice || mainProduct.productData.regularPrice || 0;
    const bundleItemsPrice = validBundleItems.reduce((sum, item) => 
      sum + (item.productData.currentPrice || item.productData.regularPrice || 0), 0);
    const calculatedBundlePrice = mainPrice + bundleItemsPrice;

    const bundleData = {
      bundleName,
      description: `Bundle containing ${bundleName}`, // Auto-generated description
      mainProduct: {
        itemId: mainProduct.productData._id,
        price: mainPrice
      },
      bundleItems: validBundleItems.map((item, index) => ({
        itemId: item.productData._id,
        price: item.productData.currentPrice || item.productData.regularPrice || 0,
        position: index
      })),
      bundlePrice: calculatedBundlePrice,
      isActive: true,
      showOnProductPage: true,
      showInRecommendations: true,
      createdBy: user?.email || user?.username || 'admin'
    };

    try {
      const result = await dispatch(createProductBundle(bundleData));
      if (result.type === 'productBundle/createProductBundle/fulfilled') {
        setShowSuccessModal(true);
        // Reset form
        setBundleName("");
        setMainProduct(INITIAL_MAIN_PRODUCT);
        setBundleItems(INITIAL_BUNDLE_ITEMS);
      }
    } catch (error) {
      console.error('Error creating bundle:', error);
    }
  }, [bundleName, mainProduct, bundleItems, user, dispatch]);

  const handleEditBundle = useCallback((bundle) => {
    setEditingBundle(bundle);
    setBundleName(bundle.bundleName);
    
    // Set main product data
    setMainProduct({
      id: "main",
      category: bundle.mainProduct.categoryId,
      subcategory: bundle.mainProduct.subCategoryId,
      item: bundle.mainProduct.itemId,
      productData: {
        ...bundle.mainProduct,
        _id: bundle.mainProduct.itemId,
        productName: bundle.mainProduct.productName,
        categoryId: bundle.mainProduct.categoryId,
        subCategoryId: bundle.mainProduct.subCategoryId,
        categoryName: bundle.mainProduct.categoryName,
        subCategoryName: bundle.mainProduct.subCategoryName,
        currentPrice: bundle.mainProduct.price
      }
    });

    // Set bundle items data
    setBundleItems(bundle.bundleItems.map((item, index) => ({
      id: `item${index + 1}`,
      category: item.categoryId,
      subcategory: item.subCategoryId,
      item: item.itemId,
      productData: {
        ...item,
        _id: item.itemId,
        productName: item.productName,
        categoryId: item.categoryId,
        subCategoryId: item.subCategoryId,
        categoryName: item.categoryName,
        subCategoryName: item.subCategoryName,
        currentPrice: item.price
      }
    })));

    setShowEditModal(true);
  }, []);

  const handleUpdateBundle = useCallback(async () => {
    if (!bundleName || !editingBundle) {
      alert("Please fill in bundle name");
      return;
    }

    const validBundleItems = bundleItems.filter(item => item.productData);
    
    // Calculate bundle price as sum of all item prices
    const mainPrice = mainProduct.productData?.currentPrice || mainProduct.productData?.regularPrice || 0;
    const bundleItemsPrice = validBundleItems.reduce((sum, item) => 
      sum + (item.productData.currentPrice || item.productData.regularPrice || 0), 0);
    const calculatedBundlePrice = mainPrice + bundleItemsPrice;
    
    const bundleData = {
      bundleName,
      description: `Bundle containing ${bundleName}`, // Auto-generated description
      bundleItems: validBundleItems.map((item, index) => ({
        itemId: item.productData._id,
        price: item.productData.currentPrice || item.productData.regularPrice || 0,
        position: index
      })),
      bundlePrice: calculatedBundlePrice,
      updatedBy: user?.email || user?.username || 'admin'
    };

    try {
      const result = await dispatch(updateProductBundle({ 
        bundleId: editingBundle._id, 
        bundleData 
      }));
      if (result.type === 'productBundle/updateProductBundle/fulfilled') {
        setShowEditModal(false);
        setShowSuccessModal(true);
        setEditingBundle(null);
      }
    } catch (error) {
      console.error('Error updating bundle:', error);
    }
  }, [bundleName, bundleItems, mainProduct, editingBundle, user, dispatch]);

  const handleDeleteBundle = useCallback(async (bundleId) => {
    try {
      const result = await dispatch(deleteProductBundle(bundleId));
      if (result.type === 'productBundle/deleteProductBundle/fulfilled') {
        setShowDeleteConfirmModal(false);
        setShowDeleteSuccessModal(true);
        setBundleToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting bundle:', error);
    }
  }, [dispatch]);

  const handleToggleBundleStatus = useCallback(async (bundleId) => {
    try {
      await dispatch(toggleBundleStatus({ 
        bundleId, 
        updatedBy: user?.email || user?.username || 'admin' 
      }));
    } catch (error) {
      console.error('Error toggling bundle status:', error);
    }
  }, [dispatch, user]);

  const handleSelectItem = useCallback((selectedItem) => {
    if (currentSelectingFor === "main") {
      setMainProduct(prev => ({
        ...prev,
        category: selectedItem.categoryId,
        subcategory: selectedItem.subCategoryId,
        item: selectedItem._id,
        productData: selectedItem
      }));
    } else {
      setBundleItems(prev => 
        prev.map(item => 
          item.id === currentSelectingFor
            ? {
                ...item,
                category: selectedItem.categoryId,
                subcategory: selectedItem.subCategoryId,
                item: selectedItem._id,
                productData: selectedItem
              }
            : item
        )
      );
    }
    setShowItemSelector(false);
    setCurrentSelectingFor(null);
  }, [currentSelectingFor]);

  // Product-specific item selection handlers
  const handleProductItemSelect = useCallback((productId, itemId) => {
    const selectedItem = findItemById(itemId);
    if (!selectedItem) return;

    if (productId === "main") {
      setMainProduct(prev => ({
        ...prev,
        item: itemId,
        productData: selectedItem
      }));
    } else {
      setBundleItems(prev => 
        prev.map(item => 
          item.id === productId
            ? {
                ...item,
                item: itemId,
                productData: selectedItem
              }
            : item
        )
      );
    }
  }, [findItemById]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setBundleItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  // Render functions
  const renderDropdown = useCallback((
    options, 
    value, 
    onChange, 
    placeholder, 
    disabled = false
  ) => (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  ), [loading]);

  const renderProductSelector = useCallback((product, onCategoryChange, onSubcategoryChange, onItemSelect, label) => {
    const categoryOptions = getCategoryOptions;
    const subcategoryOptions = getSubcategoriesForCategory(product.category);
    const itemOptions = getAvailableItemsForSelection(product.category, product.subcategory);

    return (
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <h4 className="font-medium text-gray-700">{label}</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Category
            </label>
            {renderDropdown(
              categoryOptions,
              product.category,
              (categoryId) => handleCategorySelectionForProduct(product.id, categoryId),
              "Select Category",
              categoriesLoading
            )}
          </div>

          {/* Subcategory Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Subcategory
            </label>
            {renderDropdown(
              subcategoryOptions,
              product.subcategory,
              (subcategoryId) => handleSubcategorySelectionForProduct(product.id, product.category, subcategoryId),
              "Select Subcategory",
              !product.category || categoriesLoading
            )}
          </div>

          {/* Item Dropdown - Changed from button to dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Product
            </label>
            {product.category && product.subcategory ? (
              renderDropdown(
                itemOptions,
                product.item,
                (itemId) => handleProductItemSelect(product.id, itemId),
                itemOptions.length > 0 ? "Select Product" : "No products available",
                itemsLoading
              )
            ) : (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
                {!product.category ? "Select Category First" : "Select Subcategory First"}
              </div>
            )}
          </div>
        </div>

        {/* Product Preview */}
        {product.productData && (
          <div className="flex items-center space-x-4 p-3 bg-white rounded-md border">
            <img
              src={product.productData.image || "/api/placeholder/60/60"}
              alt={product.productData.productName}
              className="w-12 h-12 object-cover rounded"
            />
            <div className="flex-1">
              <h5 className="font-medium">{product.productData.productName}</h5>
              <p className="text-sm text-gray-600">
                {product.productData.categoryName} - {product.productData.subCategoryName}
              </p>
              <p className="text-sm font-medium text-green-600">
                ₹{product.productData.currentPrice || product.productData.regularPrice || 0}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }, [getCategoryOptions, getSubcategoriesForCategory, getAvailableItemsForSelection, renderDropdown, categoriesLoading, itemsLoading]);

  // Calculate total original price
  const totalOriginalPrice = useMemo(() => {
    let total = mainProduct.productData?.currentPrice || mainProduct.productData?.regularPrice || 0;
    bundleItems.forEach(item => {
      if (item.productData) {
        total += item.productData.currentPrice || item.productData.regularPrice || 0;
      }
    });
    return total;
  }, [mainProduct, bundleItems]);

  // Calculate automatic bundle price and savings
  const calculatedBundlePrice = useMemo(() => {
    const validBundleItems = bundleItems.filter(item => item.productData);
    const mainPrice = mainProduct.productData?.currentPrice || mainProduct.productData?.regularPrice || 0;
    const bundleItemsPrice = validBundleItems.reduce((sum, item) => 
      sum + (item.productData.currentPrice || item.productData.regularPrice || 0), 0);
    return mainPrice + bundleItemsPrice;
  }, [mainProduct, bundleItems]);

  // Calculate savings (no savings since bundle price equals total)
  const savings = useMemo(() => {
    return 0; // Since we're not offering a discount, savings is 0
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Bundling</h1>
            <p className="text-gray-600 mt-2">
              Create and manage product bundles to increase sales
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowBundleList(!showBundleList)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
            >
              <span>{showBundleList ? "Hide" : "Show"} Bundle List</span>
            </button>
            <button
              onClick={() => {
                dispatch(getAllProductBundles({ page: 1, limit: 10 }));
                dispatch(getItemsForBundling({ page: 1, limit: 50 }));
              }}
              disabled={bundlesLoading || itemsLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${(bundlesLoading || itemsLoading) ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {(error || bundlesError || itemsError) && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <div className="flex justify-between items-center">
              <span>{error || bundlesError || itemsError}</span>
              <button
                onClick={() => dispatch(clearError())}
                className="text-red-700 hover:text-red-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Bundle Creation Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">
            {editingBundle ? "Edit Bundle" : "Create New Bundle"}
          </h2>

          {/* Bundle Name */}
          <div className="mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Bundle Name *
              </label>
              <input
                type="text"
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
                placeholder="Enter bundle name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Main Product Selection */}
          {renderProductSelector(
            mainProduct,
            null, // Category change handled by renderProductSelector
            null, // Subcategory change handled by renderProductSelector
            () => {},
            "Main Product *"
          )}

          {/* Bundle Items */}
          <div className="mt-6">
            <h4 className="text-lg font-medium text-gray-800 mb-4">Bundle Items</h4>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={bundleItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {bundleItems.map((item, index) => (
                    <SortableItem key={item.id} id={item.id}>
                      <div className="flex items-center space-x-4">
                        <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                        <div className="flex-1">
                          {renderProductSelector(
                            item,
                            null, // Category change handled by renderProductSelector
                            null, // Subcategory change handled by renderProductSelector
                            () => {},
                            `Bundle Item ${index + 1}`
                          )}
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add Bundle Item Button */}
            <button
              onClick={() => setBundleItems(prev => [
                ...prev,
                { 
                  id: `item${prev.length + 1}`, 
                  category: "", 
                  subcategory: "", 
                  item: "", 
                  productData: null 
                }
              ])}
              className="mt-4 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-md hover:border-blue-500 hover:text-blue-500 flex items-center space-x-2 w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add Bundle Item</span>
            </button>
          </div>

          {/* Pricing Summary */}
          {calculatedBundlePrice > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Bundle Price</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Bundle Price:</span>
                  <span className="font-medium">₹{calculatedBundlePrice.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Price is automatically calculated as the sum of all selected items.
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6">
            {editingBundle ? (
              <>
                <button
                  onClick={handleUpdateBundle}
                  disabled={updateLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
                >
                  {updateLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{updateLoading ? "Updating..." : "Update Bundle"}</span>
                </button>
                <button
                  onClick={() => {
                    setEditingBundle(null);
                    setBundleName("");
                    setMainProduct(INITIAL_MAIN_PRODUCT);
                    setBundleItems(INITIAL_BUNDLE_ITEMS);
                  }}
                  disabled={updateLoading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleCreateBundle}
                disabled={createLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center space-x-2"
              >
                {createLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{createLoading ? "Creating..." : "Create Bundle"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Bundle List */}
        {showBundleList && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Bundle List</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bundles..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filters.isActive || ''}
                  onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? null : e.target.value === 'true')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {bundlesLoading ? (
              <div className="text-center py-8">
                <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-gray-600">Loading bundles...</p>
              </div>
            ) : bundles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No bundles found. Create your first bundle above!</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Bundle Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Main Product</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Items Count</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Bundle Price</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Savings</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {bundles.map((bundle) => (
                        <tr key={bundle._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{bundle.bundleName}</p>
                              {bundle.description && (
                                <p className="text-sm text-gray-500 mt-1">{bundle.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={bundle.mainProduct.image || "/api/placeholder/40/40"}
                                alt={bundle.mainProduct.productName}
                                className="w-10 h-10 object-cover rounded"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{bundle.mainProduct.productName}</p>
                                <p className="text-sm text-gray-500">
                                  {bundle.mainProduct.categoryName} - {bundle.mainProduct.subCategoryName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-600">
                            {bundle.bundleItems.length} items
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-medium text-gray-900">₹{bundle.bundlePrice}</p>
                            <p className="text-sm text-gray-500">₹{bundle.totalOriginalPrice} original</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-green-600">
                              <p className="font-medium">₹{bundle.savings}</p>
                              <p className="text-sm">{bundle.discountPercentage}% off</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              bundle.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {bundle.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditBundle(bundle)}
                                disabled={updateLoading}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-md disabled:opacity-50"
                                title="Edit Bundle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleBundleStatus(bundle._id)}
                                className={`p-2 rounded-md ${
                                  bundle.isActive 
                                    ? 'text-orange-600 hover:bg-orange-100' 
                                    : 'text-green-600 hover:bg-green-100'
                                }`}
                                title={bundle.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {bundle.isActive ? '⏸️' : '▶️'}
                              </button>
                              <button
                                onClick={() => {
                                  setBundleToDelete(bundle);
                                  setShowDeleteConfirmModal(true);
                                }}
                                disabled={deleteLoading}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-md disabled:opacity-50"
                                title="Delete Bundle"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <p className="text-sm text-gray-600">
                      Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalBundles)} of {pagination.totalBundles} bundles
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => dispatch(getAllProductBundles({ ...filters, page: pagination.currentPage - 1 }))}
                        disabled={!pagination.hasPrevPage || bundlesLoading}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-2 text-sm text-gray-600">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => dispatch(getAllProductBundles({ ...filters, page: pagination.currentPage + 1 }))}
                        disabled={!pagination.hasNextPage || bundlesLoading}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Item Selector Modal */}
        {showItemSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-semibold">Select Product</h3>
                <button
                  onClick={() => {
                    setShowItemSelector(false);
                    setCurrentSelectingFor(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Search and Filters */}
                <div className="flex space-x-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={itemFilters.categoryId || ''}
                    onChange={(e) => handleItemFilterChange('categoryId', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories && Array.isArray(categories) && categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  <select
                    value={itemFilters.subCategoryId || ''}
                    onChange={(e) => handleItemFilterChange('subCategoryId', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Subcategories</option>
                    {getSubcategoriesForCategory(itemFilters.categoryId).map(sub => (
                      <option key={sub.value} value={sub.value}>{sub.label}</option>
                    ))}
                  </select>
                </div>

                {/* Items Grid */}
                <div className="max-h-96 overflow-y-auto">
                  {itemsLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-2 text-gray-600">Loading products...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getAvailableItemsForSelection(itemFilters.categoryId, itemFilters.subCategoryId).map((item) => (
                        <div
                          key={item._id}
                          onClick={() => handleSelectItem(item)}
                          className="border rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.image || "/api/placeholder/50/50"}
                              alt={item.productName}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{item.productName}</h5>
                              <p className="text-xs text-gray-600">
                                {item.categoryName} - {item.subCategoryName}
                              </p>
                              <p className="text-sm font-medium text-green-600">
                                ₹{item.currentPrice || item.regularPrice || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!itemsLoading && getAvailableItemsForSelection(itemFilters.categoryId, itemFilters.subCategoryId).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No products found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {showSuccessModal && (
          <SuccessModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            title={editingBundle ? "Bundle updated successfully!" : "Bundle created successfully!"}
          />
        )}

        {showDeleteConfirmModal && bundleToDelete && (
          <DeleteConfirmationModal
            isOpen={showDeleteConfirmModal}
            onClose={() => {
              setShowDeleteConfirmModal(false);
              setBundleToDelete(null);
            }}
            onConfirm={() => handleDeleteBundle(bundleToDelete._id)}
            title="Delete Bundle"
            message={`Are you sure you want to delete "${bundleToDelete.bundleName}"? This action cannot be undone.`}
          />
        )}

        {showDeleteSuccessModal && (
          <SuccessModal
            isOpen={showDeleteSuccessModal}
            onClose={() => setShowDeleteSuccessModal(false)}
            title="Bundle deleted successfully!"
          />
        )}
      </div>
    </div>
  );
};

export default ProductBundling;
