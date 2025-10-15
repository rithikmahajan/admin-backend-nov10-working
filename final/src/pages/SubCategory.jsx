import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Edit2, Trash2, ChevronDown, X, Upload, Image as ImageIcon, Plus } from 'lucide-react';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

// Import subcategory actions
import {
  fetchSubCategories,
  fetchCategoriesForSubCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  setSearchTerm,
  setSelectedCategory,
  clearFilters,
  clearSuccessMessage,
  clearError,
  selectFilteredSubCategories,
  selectSubCategoriesLoading,
  selectCategoriesForSubCategory,
  selectCategoriesLoading,
  selectCreateLoading,
  selectUpdateLoading,
  selectDeleteLoading,
  selectSuccessMessage,
  selectError,
  selectSearchTerm,
  selectSelectedCategory
} from '../store/slices/subCategoriesSlice';

const SubCategory = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  // Redux selectors
  const subCategories = useSelector(selectFilteredSubCategories);
  const subCategoriesLoading = useSelector(selectSubCategoriesLoading);
  const categories = useSelector(selectCategoriesForSubCategory);
  const categoriesLoading = useSelector(selectCategoriesLoading);
  const createLoading = useSelector(selectCreateLoading);
  const updateLoading = useSelector(selectUpdateLoading);
  const deleteLoading = useSelector(selectDeleteLoading);
  const successMessage = useSelector(selectSuccessMessage);
  const error = useSelector(selectError);
  const searchTerm = useSelector(selectSearchTerm);
  const selectedCategory = useSelector(selectSelectedCategory);

  // Modal states
  const [modals, setModals] = useState({
    add: false,
    edit: false,
    success: false,
    deleteSuccess: false
  });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    image: null,
    imagePreview: null
  });

  // SubCategory states
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Effects
  useEffect(() => {
    dispatch(fetchSubCategories());
    dispatch(fetchCategoriesForSubCategory());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      setModals(prev => ({ ...prev, success: true }));
      setTimeout(() => {
        dispatch(clearSuccessMessage());
        setModals(prev => ({ ...prev, success: false }));
      }, 3000);
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        dispatch(clearError());
      }, 5000);
    }
  }, [error, dispatch]);

  // Utility functions
  const openModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  };

  const closeAllModals = () => {
    setModals({
      add: false,
      edit: false,
      success: false,
      deleteSuccess: false
    });
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      image: null,
      imagePreview: null
    });
    setEditingSubCategory(null);
    setDeleteConfirmation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Event handlers
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null,
      imagePreview: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Search and filter handlers
  const handleSearchChange = (event) => {
    dispatch(setSearchTerm(event.target.value));
  };

  const handleCategoryFilter = (categoryId) => {
    dispatch(setSelectedCategory(categoryId === selectedCategory ? null : categoryId));
    setDropdownOpen(false);
  };

  const clearAllFilters = () => {
    dispatch(clearFilters());
    setDropdownOpen(false);
  };

  // SubCategory management handlers
  const handleAddNewSubCategory = () => {
    resetFormData();
    openModal('add');
  };

  const handleSaveNewSubCategory = async () => {
    if (!formData.name.trim() || !formData.categoryId) {
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name.trim());
    formDataToSend.append('description', formData.description.trim());
    formDataToSend.append('categoryId', formData.categoryId);
    
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      await dispatch(createSubCategory(formDataToSend)).unwrap();
      closeModal('add');
      resetFormData();
    } catch (error) {
      console.error('Error creating subcategory:', error);
    }
  };

  const handleEdit = (subCategory) => {
    setEditingSubCategory(subCategory);
    setFormData({
      name: subCategory.name,
      description: subCategory.description || '',
      categoryId: subCategory.categoryId,
      image: null,
      imagePreview: subCategory.imageUrl || null
    });
    openModal('edit');
  };

  const handleSaveEdit = async () => {
    if (!formData.name.trim() || !formData.categoryId || !editingSubCategory) {
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name.trim());
    formDataToSend.append('description', formData.description.trim());
    formDataToSend.append('categoryId', formData.categoryId);
    
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      await dispatch(updateSubCategory({
        subCategoryId: editingSubCategory._id,
        subCategoryData: formDataToSend
      })).unwrap();
      closeModal('edit');
      resetFormData();
    } catch (error) {
      console.error('Error updating subcategory:', error);
    }
  };

  const handleDelete = (subCategory) => {
    setDeleteConfirmation(subCategory);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      await dispatch(deleteSubCategory(deleteConfirmation._id)).unwrap();
      setDeleteConfirmation(null);
      openModal('deleteSuccess');
      setTimeout(() => {
        closeModal('deleteSuccess');
      }, 2000);
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      setDeleteConfirmation(null);
    }
  };

  const handleCloseWithReset = (modalName) => {
    closeModal(modalName);
    resetFormData();
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  // Component renderers
  const renderImageUploadSection = (title = "Upload image") => (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
        {formData.imagePreview ? (
          <div className="space-y-4">
            <img
              src={formData.imagePreview}
              alt="SubCategory"
              className="mx-auto w-32 h-32 object-cover rounded-lg"
            />
            <button
              onClick={handleRemoveImage}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Remove image
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Drop your image</p>
              <p className="text-xs text-gray-500">here PNG, JPEG allowed</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <label className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload image
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </label>
      </div>
    </div>
  );

  const renderSubCategoryForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">SubCategory Details</h3>
        
        <div className="space-y-4">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            placeholder="Enter subcategory name"
          />
          
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
            placeholder="Enter subcategory description (optional)"
            rows={3}
          />
          
          <select
            value={formData.categoryId}
            onChange={(e) => updateFormData('categoryId', e.target.value)}
            className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderModalActions = (onSave, onCancel, saveText = "Save", cancelText = "Cancel", loading = false) => (
    <div className="flex justify-center gap-4 mt-12">
      <button
        onClick={onSave}
        disabled={loading}
        className="bg-black hover:bg-gray-800 text-white font-medium py-3 px-12 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : saveText}
      </button>
      <button
        onClick={onCancel}
        disabled={loading}
        className="text-gray-600 hover:text-gray-800 border-2 border-black rounded-xl font-medium py-3 px-12 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cancelText}
      </button>
    </div>
  );

  const renderSuccessModal = (message, onClose) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 leading-tight">
              {message}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  if (subCategoriesLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subcategories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Error message */}
      {error && (
        <div className="mx-6 mb-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => dispatch(clearError())}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="mx-6 bg-white">
        
        {/* Header */}
        <div className="py-8 px-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Manage Subcategories</h1>
          
          {/* Controls Section */}
          <div className="flex items-center gap-6 justify-between">
            
            {/* Left side controls */}
            <div className="flex items-center gap-6">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search subcategories..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="block w-80 pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48 text-left flex items-center justify-between"
                >
                  <span>
                    {selectedCategory 
                      ? getCategoryName(selectedCategory)
                      : 'All Categories'
                    }
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => handleCategoryFilter(null)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg"
                    >
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category._id}
                        onClick={() => handleCategoryFilter(category._id)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 last:rounded-b-lg"
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              {(searchTerm || selectedCategory) && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Add SubCategory Button */}
            <button 
              onClick={handleAddNewSubCategory}
              className="bg-black hover:bg-gray-800 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add subcategory
            </button>
          </div>
        </div>

        {/* SubCategories Grid */}
        <div className="px-6 pb-6">
          
          {/* Table Header */}
          <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-6 p-4 bg-gray-50 border-b border-gray-200 rounded-t-lg">
              <div className="col-span-3">
                <h3 className="text-sm font-semibold text-gray-800">Image</h3>
              </div>
              <div className="col-span-3">
                <h3 className="text-sm font-semibold text-gray-800">Category</h3>
              </div>
              <div className="col-span-3">
                <h3 className="text-sm font-semibold text-gray-800">SubCategory</h3>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-semibold text-gray-800">Description</h3>
              </div>
              <div className="col-span-1">
                <h3 className="text-sm font-semibold text-gray-800">Actions</h3>
              </div>
            </div>

            {/* SubCategory Rows */}
            <div className="divide-y divide-gray-200">
              {subCategories.map((subCategory) => (
                <div key={subCategory._id} className="grid grid-cols-12 gap-6 p-4 items-center hover:bg-gray-50 transition-colors duration-150">
                  
                  {/* Image Column */}
                  <div className="col-span-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                      {subCategory.imageUrl ? (
                        <img
                          src={subCategory.imageUrl}
                          alt={subCategory.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category Column */}
                  <div className="col-span-3">
                    <p className="text-base font-medium text-gray-900">
                      {getCategoryName(subCategory.categoryId)}
                    </p>
                  </div>

                  {/* SubCategory Column */}
                  <div className="col-span-3">
                    <p className="text-base font-medium text-gray-900">
                      {subCategory.name}
                    </p>
                  </div>

                  {/* Description Column */}
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">
                      {subCategory.description || 'No description'}
                    </p>
                  </div>

                  {/* Action Column */}
                  <div className="col-span-1">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(subCategory)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                        title="Edit SubCategory"
                        disabled={updateLoading}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(subCategory)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                        title="Delete SubCategory"
                        disabled={deleteLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {subCategories.length === 0 && !subCategoriesLoading && (
              <div className="p-12 text-center text-gray-500">
                <p className="text-lg">No subcategories found.</p>
                <p className="text-sm mt-2">
                  {searchTerm || selectedCategory 
                    ? 'Try adjusting your search terms or filters.'
                    : 'Get started by adding your first subcategory.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add SubCategory Modal */}
      {modals.add && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="relative p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 text-center">
                Add SubCategory
              </h2>
              <button
                onClick={() => handleCloseWithReset('add')}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                disabled={createLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="grid grid-cols-2 gap-12">
                {renderImageUploadSection("Upload SubCategory Image")}
                {renderSubCategoryForm()}
              </div>
              {renderModalActions(
                handleSaveNewSubCategory,
                () => handleCloseWithReset('add'),
                "Create SubCategory",
                "Cancel",
                createLoading
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit SubCategory Modal */}
      {modals.edit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="relative p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 text-center">
                Edit SubCategory
              </h2>
              <button
                onClick={() => handleCloseWithReset('edit')}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                disabled={updateLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="grid grid-cols-2 gap-12">
                {renderImageUploadSection("Update SubCategory Image")}
                {renderSubCategoryForm()}
              </div>
              {renderModalActions(
                handleSaveEdit,
                () => handleCloseWithReset('edit'),
                "Update SubCategory",
                "Cancel",
                updateLoading
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {modals.success && renderSuccessModal(
        successMessage || "Operation completed successfully!",
        () => closeModal('success')
      )}

      {/* Delete Success Modal */}
      {modals.deleteSuccess && renderSuccessModal(
        "SubCategory deleted successfully!",
        () => closeModal('deleteSuccess')
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={confirmDelete}
        title={`Are you sure you want to delete "${deleteConfirmation?.name}" subcategory?`}
        message="This action cannot be undone. All items associated with this subcategory will also be affected."
        loading={deleteLoading}
      />
    </div>
  );
};

export default SubCategory;
