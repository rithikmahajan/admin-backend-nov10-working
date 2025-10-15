/**
 * Item Arrangement Control Component
 */

import React, { memo, useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import {
  ArrowUpDown,
  Eye,
  Grid,
  List,
  RotateCcw,
  Save,
  ShoppingBag,
} from "lucide-react";

// Redux imports
import {
  fetchCategoriesForArrangement,
  fetchSubCategoriesForArrangement,
  fetchItemsForArrangement,
  updateItemsDisplayOrder,
  updateCategoriesDisplayOrder,
  updateSubCategoriesDisplayOrder,
  updateItemsOrderLocally,
  updateCategoriesOrderLocally,
  updateSubCategoriesOrderLocally,
  resetItemsOrder,
  resetSubCategoriesOrder,
  setSelectedCategory,
  setSelectedSubCategory,
  setViewMode,
  setArrangementType,
  clearSuccess,
} from "../store/slices/arrangementSlice";

import {
  selectCategories,
  selectSubCategories,
  selectItems,
  selectSelectedCategory,
  selectSelectedSubCategory,
  selectArrangementType,
  selectViewMode,
  selectArrangementLoading,
  selectArrangementError,
  selectArrangementSuccess,
} from "../store/slices/arrangementSlice";

// Reusable Components
const CategoryDropdown = memo(({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  loading 
}) => {
  const selectedCategoryObj = categories.find(cat => cat._id === selectedCategory);
  
  return (
    <div className="relative">
      <select
        value={selectedCategory || ""}
        onChange={(e) => onCategoryChange(e.target.value)}
        disabled={loading}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm appearance-none cursor-pointer disabled:opacity-50"
      >
        <option value="">Select Category</option>
        {categories.map((category) => (
          <option key={category._id} value={category.name}>
            {category.name}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      {selectedCategoryObj && (
        <div className="mt-2 text-xs text-gray-500">
          {selectedCategoryObj.subcategories?.length || 0} subcategories
        </div>
      )}
    </div>
  );
});

CategoryDropdown.displayName = "CategoryDropdown";
CategoryDropdown.propTypes = {
  categories: PropTypes.array.isRequired,
  selectedCategory: PropTypes.string,
  onCategoryChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

const SubCategoryDropdown = memo(({ 
  subcategories, 
  selectedSubCategory, 
  onSubCategoryChange, 
  loading 
}) => {
  const selectedSubCategoryObj = subcategories.find(sub => sub._id === selectedSubCategory);
  
  return (
    <div className="relative">
      <select
        value={selectedSubCategory || ""}
        onChange={(e) => onSubCategoryChange(e.target.value)}
        disabled={loading}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm appearance-none cursor-pointer disabled:opacity-50"
      >
        <option value="">All Subcategories</option>
        {subcategories.map((subcategory) => (
          <option key={subcategory._id} value={subcategory._id}>
            {subcategory.name}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      {selectedSubCategoryObj && (
        <div className="mt-2 text-xs text-gray-500">
          Selected: {selectedSubCategoryObj.name}
        </div>
      )}
    </div>
  );
});

SubCategoryDropdown.displayName = "SubCategoryDropdown";
SubCategoryDropdown.propTypes = {
  subcategories: PropTypes.array.isRequired,
  selectedSubCategory: PropTypes.string,
  onSubCategoryChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

const ArrangementTypeToggle = memo(({ arrangementType, onArrangementTypeChange }) => (
  <div className="flex bg-gray-100 rounded-lg p-1">
    <button
      onClick={() => onArrangementTypeChange("categories")}
      className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
        arrangementType === "categories"
          ? "bg-white text-black shadow-sm"
          : "text-gray-600 hover:text-black"
      }`}
    >
      <Grid className="h-3 w-3" />
      <span>Categories</span>
    </button>
    <button
      onClick={() => onArrangementTypeChange("subcategories")}
      className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
        arrangementType === "subcategories"
          ? "bg-white text-black shadow-sm"
          : "text-gray-600 hover:text-black"
      }`}
    >
      <List className="h-3 w-3" />
      <span>Subcategories</span>
    </button>
    <button
      onClick={() => onArrangementTypeChange("items")}
      className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
        arrangementType === "items"
          ? "bg-white text-black shadow-sm"
          : "text-gray-600 hover:text-black"
      }`}
    >
      <ShoppingBag className="h-3 w-3" />
      <span>Items</span>
    </button>
  </div>
));

const ViewModeToggle = memo(({ viewMode, onViewModeChange }) => (
  <div className="flex bg-gray-100 rounded-lg p-1">
    <button
      onClick={() => onViewModeChange("arrangement")}
      className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
        viewMode === "arrangement"
          ? "bg-white text-black shadow-sm"
          : "text-gray-600 hover:text-black"
      }`}
    >
      <ArrowUpDown className="h-3 w-3" />
      <span>Arrange</span>
    </button>
    <button
      onClick={() => onViewModeChange("preview")}
      className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
        viewMode === "preview"
          ? "bg-white text-black shadow-sm"
          : "text-gray-600 hover:text-black"
      }`}
    >
      <Eye className="h-3 w-3" />
      <span>Preview</span>
    </button>
  </div>
));

ArrangementTypeToggle.displayName = "ArrangementTypeToggle";
ArrangementTypeToggle.propTypes = {
  arrangementType: PropTypes.string.isRequired,
  onArrangementTypeChange: PropTypes.func.isRequired,
};

ViewModeToggle.displayName = "ViewModeToggle";
ViewModeToggle.propTypes = {
  viewMode: PropTypes.string.isRequired,
  onViewModeChange: PropTypes.func.isRequired,
};

const DraggableItem = memo(({
  item,
  index,
  draggedItem,
  dragOverIndex,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
}) => {
  const isDragging = draggedItem?.index === index;
  const isDropTarget = dragOverIndex === index;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item, index)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 cursor-move group hover:shadow-md ${
        isDragging
          ? "border-black shadow-lg scale-105 opacity-80"
          : isDropTarget
          ? "border-dashed border-gray-400 bg-gray-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="absolute top-2 right-2">
        <ArrowUpDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
      
      <div className="p-4">
        <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
          {item.images && item.images.length > 0 ? (
            <img 
              src={item.images[0]} 
              alt={item.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <ShoppingBag className="h-8 w-8 text-gray-400" />
          )}
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">
            {item.name}
          </h4>
          <p className="text-xs text-gray-500 truncate">
            ₹{item.price || '0'}
          </p>
        </div>
      </div>
      
      {isDragging && (
        <div className="absolute inset-0 bg-black bg-opacity-10 rounded-xl flex items-center justify-center">
          <div className="text-black font-semibold text-sm">Moving...</div>
        </div>
      )}
    </div>
  );
});

const DraggableCategory = memo(({
  category,
  index,
  draggedItem,
  dragOverIndex,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
}) => {
  const isDragging = draggedItem?.index === index;
  const isDropTarget = dragOverIndex === index;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, category, index)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 cursor-move group hover:shadow-md ${
        isDragging
          ? "border-black shadow-lg scale-105 opacity-80"
          : isDropTarget
          ? "border-dashed border-gray-400 bg-gray-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="absolute top-3 right-3">
        <ArrowUpDown className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
      
      <div className="p-6">
        <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
          {category.image ? (
            <img 
              src={category.image} 
              alt={category.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-center">
              <Grid className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <span className="text-gray-500 text-sm font-medium">{category.name}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-end p-3">
            <div className="text-white font-semibold text-lg">{category.name}</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 text-lg">
              {category.name}
            </h4>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Order: {category.displayOrder || index + 1}
            </span>
          </div>
          {category.description && (
            <p className="text-sm text-gray-600 overflow-hidden" style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {category.description}
            </p>
          )}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>
              {category.subcategories?.length || 0} subcategories
            </span>
            <span>•</span>
            <span>
              {category.itemCount || 0} items
            </span>
          </div>
        </div>
      </div>
      
      {isDragging && (
        <div className="absolute inset-0 bg-black bg-opacity-10 rounded-xl flex items-center justify-center">
          <div className="text-black font-semibold text-sm">Moving Category...</div>
        </div>
      )}
    </div>
  );
});

DraggableItem.displayName = "DraggableItem";
DraggableItem.propTypes = {
  item: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  draggedItem: PropTypes.object,
  dragOverIndex: PropTypes.number,
  onDragStart: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragEnter: PropTypes.func.isRequired,
  onDragLeave: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
};

DraggableCategory.displayName = "DraggableCategory";
DraggableCategory.propTypes = {
  category: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  draggedItem: PropTypes.object,
  dragOverIndex: PropTypes.number,
  onDragStart: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragEnter: PropTypes.func.isRequired,
  onDragLeave: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
};

const DraggableSubCategory = memo(({
  subcategory,
  index,
  draggedItem,
  dragOverIndex,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
}) => {
  const isDragging = draggedItem?.index === index;
  const isDropTarget = dragOverIndex === index;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, subcategory, index)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 cursor-move group hover:shadow-md ${
        isDragging
          ? "border-black shadow-lg scale-105 opacity-80"
          : isDropTarget
          ? "border-dashed border-gray-400 bg-gray-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="absolute top-3 right-3">
        <ArrowUpDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
      
      <div className="p-5">
        <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
          {subcategory.image ? (
            <img 
              src={subcategory.image} 
              alt={subcategory.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-center">
              <List className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <span className="text-blue-600 text-xs font-medium">{subcategory.name}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 text-base">
              {subcategory.name}
            </h4>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Order: {subcategory.displayOrder || index + 1}
            </span>
          </div>
          {subcategory.description && (
            <p className="text-sm text-gray-600 overflow-hidden" style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {subcategory.description}
            </p>
          )}
        </div>
      </div>
      
      {isDragging && (
        <div className="absolute inset-0 bg-black bg-opacity-10 rounded-xl flex items-center justify-center">
          <div className="text-black font-semibold text-sm">Moving Subcategory...</div>
        </div>
      )}
    </div>
  );
});

DraggableSubCategory.displayName = "DraggableSubCategory";
DraggableSubCategory.propTypes = {
  subcategory: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  draggedItem: PropTypes.object,
  dragOverIndex: PropTypes.number,
  onDragStart: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragEnter: PropTypes.func.isRequired,
  onDragLeave: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
};

const ArrangementControl = memo(() => {
  const dispatch = useDispatch();
  
  // Redux selectors
  const categories = useSelector(selectCategories);
  const subcategories = useSelector(selectSubCategories);
  const items = useSelector(selectItems);
  const selectedCategory = useSelector(selectSelectedCategory);
  const selectedSubCategory = useSelector(selectSelectedSubCategory);
  const arrangementType = useSelector(selectArrangementType);
  const viewMode = useSelector(selectViewMode);
  const loading = useSelector(selectArrangementLoading);
  const error = useSelector(selectArrangementError);
  const success = useSelector(selectArrangementSuccess);

  // Local state
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, item, index) => {
    setDraggedItem({ item, index });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.outerHTML);
    e.target.style.opacity = "0.5";
  }, []);

  const handleDragEnd = useCallback((e) => {
    e.target.style.opacity = "1";
    setDraggedItem(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragEnter = useCallback((e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e, targetIndex) => {
      e.preventDefault();

      if (!draggedItem || draggedItem.index === targetIndex) {
        setDragOverIndex(null);
        return;
      }

      if (arrangementType === 'categories') {
        const newCategories = [...categories];
        const draggedCategoryData = newCategories[draggedItem.index];

        newCategories.splice(draggedItem.index, 1);
        newCategories.splice(targetIndex, 0, draggedCategoryData);

        dispatch(updateCategoriesOrderLocally(newCategories));
      } else if (arrangementType === 'subcategories') {
        console.log('🔍 Dropping subcategory - draggedItem.index:', draggedItem.index, 'targetIndex:', targetIndex);
        console.log('🔍 Original subcategories:', subcategories.map((sub, i) => `${i}: ${sub.name}`));
        
        const newSubCategories = [...subcategories];
        const draggedSubCategoryData = newSubCategories[draggedItem.index];
        
        console.log('🔍 Dragged subcategory:', draggedSubCategoryData?.name);

        newSubCategories.splice(draggedItem.index, 1);
        newSubCategories.splice(targetIndex, 0, draggedSubCategoryData);
        
        console.log('🔍 New subcategories order:', newSubCategories.map((sub, i) => `${i}: ${sub.name}`));

        dispatch(updateSubCategoriesOrderLocally({ 
          categoryId: selectedCategory, 
          subcategories: newSubCategories 
        }));
      } else {
        const newItems = [...items];
        const draggedItemData = newItems[draggedItem.index];

        newItems.splice(draggedItem.index, 1);
        newItems.splice(targetIndex, 0, draggedItemData);

        dispatch(updateItemsOrderLocally(newItems));
      }

      setDraggedItem(null);
      setDragOverIndex(null);
    },
    [draggedItem, items, categories, subcategories, arrangementType, selectedCategory, dispatch]
  );

  // Load data when component mounts
  useEffect(() => {
    dispatch(fetchCategoriesForArrangement());
  }, [dispatch]);

  // Load data when arrangement type or category changes
  useEffect(() => {
    console.log('🔍 useEffect triggered - arrangementType:', arrangementType, 'selectedCategory:', selectedCategory);
    
    if (arrangementType === 'items' && selectedCategory) {
      console.log('🔍 Fetching items for arrangement');
      dispatch(fetchItemsForArrangement({ 
        categoryId: selectedCategory, 
        subCategoryId: selectedSubCategory 
      }));
    } else if (arrangementType === 'subcategories' && selectedCategory) {
      console.log('🔍 Fetching subcategories for arrangement, categoryId:', selectedCategory);
      dispatch(fetchSubCategoriesForArrangement(selectedCategory));
    }
  }, [selectedCategory, selectedSubCategory, arrangementType, dispatch]);

  // Debug subcategories changes
  useEffect(() => {
    console.log('🔍 Subcategories updated:', subcategories.length, 'items');
    if (subcategories.length > 0) {
      console.log('🔍 First subcategory:', subcategories[0]);
    }
  }, [subcategories]);

  // Category handler
  const handleCategoryChange = useCallback((categoryName) => {
    console.log('🔍 handleCategoryChange called with:', categoryName);
    console.log('🔍 Available categories:', categories.map(cat => ({ id: cat._id, name: cat.name })));
    
    if (!categoryName) {
      console.log('🔍 Empty category name, clearing selection');
      dispatch(setSelectedCategory(null));
      return;
    }
    
    const category = categories.find(cat => cat.name === categoryName);
    console.log('🔍 Found category:', category);
    
    if (category) {
      console.log('🔍 Setting selectedCategory to:', category._id);
      dispatch(setSelectedCategory(category._id));
      
      // If we're in subcategories mode, fetch subcategories for this category
      if (arrangementType === 'subcategories') {
        console.log('🔍 Fetching subcategories for category:', category._id);
        dispatch(fetchSubCategoriesForArrangement(category._id));
      }
    } else {
      console.log('🔍 Category not found for name:', categoryName);
    }
  }, [categories, arrangementType, dispatch]);

  // SubCategory handler
  const handleSubCategoryChange = useCallback((subCategoryId) => {
    dispatch(setSelectedSubCategory(subCategoryId));
  }, [dispatch]);

  // Arrangement type handler
  const handleArrangementTypeChange = useCallback((type) => {
    dispatch(setArrangementType(type));
  }, [dispatch]);

  // Save arrangement
  const saveArrangement = useCallback(() => {
    setShowSaveConfirmModal(true);
  }, []);

  const handleSaveConfirm = useCallback(() => {
    setShowSaveConfirmModal(false);
    
    if (arrangementType === 'categories') {
      // Add display order to categories before saving
      const categoriesWithOrder = categories.map((category, index) => ({
        ...category,
        displayOrder: index + 1
      }));
      dispatch(updateCategoriesDisplayOrder(categoriesWithOrder));
    } else if (arrangementType === 'subcategories') {
      // Add display order to subcategories before saving
      const subcategoriesWithOrder = subcategories.map((subcategory, index) => ({
        ...subcategory,
        displayOrder: index + 1
      }));
      dispatch(updateSubCategoriesDisplayOrder(subcategoriesWithOrder));
    } else if (arrangementType === 'items') {
      // Add display order to items before saving
      const itemsWithOrder = items.map((item, index) => ({
        ...item,
        displayOrder: index + 1
      }));
      dispatch(updateItemsDisplayOrder(itemsWithOrder));
    }
  }, [arrangementType, items, categories, subcategories, dispatch]);

  // Reset arrangement
  const resetArrangement = useCallback(() => {
    if (arrangementType === 'categories') {
      // Reload categories to reset their order
      dispatch(fetchCategoriesForArrangement());
    } else if (arrangementType === 'subcategories') {
      dispatch(resetSubCategoriesOrder());
    } else {
      dispatch(resetItemsOrder());
    }
  }, [arrangementType, dispatch]);

  // Modal handlers
  const handleModalClose = useCallback(() => {
    setShowSaveConfirmModal(false);
    setShowSaveSuccessModal(false);
    dispatch(clearSuccess());
  }, [dispatch]);

  // Show success modal when save is successful
  useEffect(() => {
    if (success.updating) {
      setShowSaveSuccessModal(true);
      setTimeout(() => {
        dispatch(clearSuccess());
      }, 3000);
    }
  }, [success.updating, dispatch]);

  if (loading.categories) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Arrangement Control
            </h1>
            <p className="text-gray-600 text-lg">
              {arrangementType === 'categories' 
                ? 'Drag and drop categories to arrange their display order'
                : arrangementType === 'subcategories'
                ? 'Drag and drop subcategories to arrange their display order'
                : 'Drag and drop items to arrange their display order'
              }
            </p>
          </div>
          
          {/* Control Panel */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <ArrangementTypeToggle
              arrangementType={arrangementType}
              onArrangementTypeChange={handleArrangementTypeChange}
            />
            
            {(arrangementType === 'items' || arrangementType === 'subcategories') && (
              <div className="w-full sm:w-48">
                <CategoryDropdown
                  categories={categories}
                  selectedCategory={categories.find(cat => cat._id === selectedCategory)?.name || ''}
                  onCategoryChange={handleCategoryChange}
                  loading={loading.categories}
                />
              </div>
            )}
            
            {arrangementType === 'items' && subcategories.length > 0 && (
              <div className="w-full sm:w-48">
                <SubCategoryDropdown
                  subcategories={subcategories}
                  selectedSubCategory={selectedSubCategory}
                  onSubCategoryChange={handleSubCategoryChange}
                  loading={loading.subcategories}
                />
              </div>
            )}
            
            <ViewModeToggle
              viewMode={viewMode}
              onViewModeChange={(mode) => dispatch(setViewMode(mode))}
            />
          </div>
        </div>

        {/* Error Display */}
        {error.fetching && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Error: {error.fetching}</p>
          </div>
        )}

        {/* Arrangement Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {arrangementType === 'categories' ? (
                <Grid className="h-5 w-5 text-gray-400" />
              ) : arrangementType === 'subcategories' ? (
                <List className="h-5 w-5 text-gray-400" />
              ) : (
                <ShoppingBag className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">Arrangement Status</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {arrangementType === 'categories' 
                    ? `${categories.length} categories ready for arrangement`
                    : arrangementType === 'subcategories'
                    ? `${subcategories.length} subcategories ready for arrangement`
                    : `${items.length} items ready for arrangement`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <button
                  onClick={saveArrangement}
                  disabled={loading.updating}
                  className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors duration-200 text-sm"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
                
                <button
                  onClick={resetArrangement}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {arrangementType === 'categories' ? (
          // Categories Grid
          categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 relative">
              {categories.map((category, index) => (
                <DraggableCategory
                  key={category._id}
                  category={category}
                  index={index}
                  draggedItem={draggedItem}
                  dragOverIndex={dragOverIndex}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Grid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
              <p className="text-gray-600">Create categories first to arrange them.</p>
            </div>
          )
        ) : arrangementType === 'subcategories' ? (
          // Subcategories Grid
          !selectedCategory ? (
            <div className="text-center py-12">
              <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Category</h3>
              <p className="text-gray-600">Choose a category to arrange its subcategories.</p>
            </div>
          ) : subcategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative">
              {subcategories.map((subcategory, index) => (
                <DraggableSubCategory
                  key={subcategory._id}
                  subcategory={subcategory}
                  index={index}
                  draggedItem={draggedItem}
                  dragOverIndex={dragOverIndex}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Subcategories Found</h3>
              <p className="text-gray-600">Create subcategories for this category to arrange them.</p>
            </div>
          )
        ) : (
          // Items Grid
          items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8 relative">
              {items.map((item, index) => (
                <DraggableItem
                  key={item._id}
                  item={item}
                  index={index}
                  draggedItem={draggedItem}
                  dragOverIndex={dragOverIndex}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          ) : selectedCategory ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Items Found</h3>
              <p className="text-gray-600">No items available for arrangement in this category.</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Category</h3>
              <p className="text-gray-600">Choose a category to start arranging items.</p>
            </div>
          )
        )}

        {/* Success Modal */}
        {showSaveSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Save className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {arrangementType === 'categories' ? 'Category' : arrangementType === 'subcategories' ? 'Subcategory' : 'Item'} Arrangement Saved!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your {arrangementType} arrangement has been saved successfully.
                </p>
                <button
                  onClick={handleModalClose}
                  className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Confirmation Modal */}
        {showSaveConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Save className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Save {arrangementType === 'categories' ? 'Category' : arrangementType === 'subcategories' ? 'Subcategory' : 'Item'} Arrangement?
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to save the current {arrangementType} arrangement?
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSaveConfirmModal(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveConfirm}
                    className="flex-1 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ArrangementControl.displayName = "ArrangementControl";

export default ArrangementControl;
