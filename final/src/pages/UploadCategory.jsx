import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Edit2, Trash2, ChevronDown, X, Upload, Image as ImageIcon } from 'lucide-react';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { 
  fetchCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  clearErrors,
  clearMessages 
} from '../store/slices/categoriesSlice';

const UploadCategory = () => {
  const dispatch = useDispatch();
  
  // Debug render counter
  const renderCount = useRef(0);
  renderCount.current += 1;
  
  if (renderCount.current > 5 && process.env.NODE_ENV === 'development') {
    console.warn('UploadCategory: High render count detected:', renderCount.current);
  }
  
  // Redux state
  const { 
    categories, 
    categoriesLoading, 
    categoriesError,
    createLoading,
    updateLoading,
    deleteLoading,
    successMessage,
    error 
  } = useSelector(state => state.categories);
  
  // Check authentication
  const { isAuthenticated, user, token } = useSelector(state => state.auth);
  
  // Create stable reference for admin status to prevent infinite loops
  const isAdmin = useMemo(() => user?.isAdmin === true, [user?.isAdmin]);
  
  // Debug authentication state - only log when user ID changes to prevent infinite loops
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('UploadCategory - Auth state:', {
        isAuthenticated,
        userId: user?._id,
        isAdmin: user?.isAdmin,
        hasToken: !!token
      });
    }
  }, [isAuthenticated, user?._id, user?.isAdmin, token]);

  // Modal states
  const [modals, setModals] = useState({
    add: false,
    edit: false,
    success: false,
    delete: false,
    deleteSuccess: false
  });

  // Form states - separated to prevent object recreation issues
  const [selectedCategory, setSelectedCategory] = useState('Category');
  const [searchTerm, setSearchTerm] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Category states
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  // Load categories on component mount - only if not already loaded
  useEffect(() => {
    if (!categories || categories.length === 0) {
      console.log('UploadCategory: Fetching categories...');
      dispatch(fetchCategories())
        .then((result) => console.log('UploadCategory: Fetch result:', result))
        .catch((error) => console.error('UploadCategory: Fetch error:', error));
    } else {
      console.log('UploadCategory: Categories already loaded, skipping fetch');
    }
  }, [dispatch, categories]); // Include categories to check if already loaded

  // Debug: Log categories data structure - only once when categories first load
  useEffect(() => {
    if (categories && categories.length > 0) {
      console.log('UploadCategory: Categories loaded, count:', categories.length);
      
      // Only do detailed logging in development and for the first few items
      if (process.env.NODE_ENV === 'development') {
        console.log('UploadCategory: First category:', categories[0]);
        
        // Check for missing names only in first 10 categories to avoid excessive logging
        categories.slice(0, 10).forEach((category, index) => {
          if (!category.name) {
            console.warn(`UploadCategory: Category at index ${index} has no name property:`, category);
          }
        });
      }
    }
  }, [categories.length]); // Only trigger when the count changes, not the entire array

  // Handle success/error messages
  useEffect(() => {
    if (successMessage) {
      setModals(prev => ({ ...prev, success: true }));
      setTimeout(() => {
        dispatch(clearMessages());
        setModals(prev => ({ ...prev, success: false }));
      }, 2000);
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      console.error('Category operation error:', error);
      setTimeout(() => {
        dispatch(clearErrors());
      }, 3000);
    }
  }, [error, dispatch]);

  // Utility functions - memoized to prevent infinite re-renders
  const openModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals({
      add: false,
      edit: false,
      success: false,
      delete: false,
      deleteSuccess: false
    });
  }, []);

  const resetFormData = useCallback(() => {
    setNewCategoryName('');
    setNewCategoryDescription('');
    setUploadedImage(null);
    setImageFile(null);
    setEditingCategory(null);
    setDeletingCategory(null);
  }, []);

  const updateFormData = useCallback((key, value) => {
    // Only log in development and avoid excessive logging for search terms
    if (process.env.NODE_ENV === 'development' && key !== 'searchTerm') {
      console.log(`updateFormData: ${key} = `, value);
    }
    
    switch(key) {
      case 'selectedCategory': setSelectedCategory(value); break;
      case 'searchTerm': setSearchTerm(value); break;
      case 'newCategoryName': setNewCategoryName(value); break;
      case 'newCategoryDescription': setNewCategoryDescription(value); break;
      case 'uploadedImage': setUploadedImage(value); break;
      case 'imageFile': setImageFile(value); break;
      default: console.warn('Unknown form key:', key);
    }
  }, []);

  // Event handlers
  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      // Store both the file and preview
      updateFormData('imageFile', file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        updateFormData('uploadedImage', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, [updateFormData]);

  const handleRemoveImage = useCallback(() => {
    updateFormData('uploadedImage', null);
    updateFormData('imageFile', null);
  }, [updateFormData]);

  // Input change handlers - memoized to prevent re-renders
  const handleNameChange = useCallback((e) => {
    updateFormData('newCategoryName', e.target.value);
  }, [updateFormData]);

  const handleDescriptionChange = useCallback((e) => {
    updateFormData('newCategoryDescription', e.target.value);
  }, [updateFormData]);

  const handleSearchChange = useCallback((e) => {
    updateFormData('searchTerm', e.target.value);
  }, [updateFormData]);

  const handleCategorySelectChange = useCallback((e) => {
    updateFormData('selectedCategory', e.target.value);
  }, [updateFormData]);

  // Category management handlers
  const handleAddNewCategory = useCallback(() => {
    resetFormData();
    openModal('add');
  }, [resetFormData, openModal]);

  const handleSaveNewCategory = async () => {
    console.log('handleSaveNewCategory: Starting with formData:', formData);
    
    // Debug authentication
    const token = localStorage.getItem('authToken');
    console.log('handleSaveNewCategory: Auth token exists:', !!token);
    console.log('handleSaveNewCategory: Auth token (first 10 chars):', token ? token.substring(0, 10) + '...' : 'null');
    console.log('handleSaveNewCategory: User:', user);
    console.log('handleSaveNewCategory: isAdmin:', isAdmin);
    console.log('handleSaveNewCategory: isAuthenticated:', isAuthenticated);
    
    // Validation checks
    const categoryName = newCategoryName.trim();
    if (!categoryName) {
      alert('Please enter a category name');
      return;
    }

    if (categoryName.length < 2) {
      alert('Category name must be at least 2 characters long');
      return;
    }
    
    if (!imageFile) {
      alert('Please upload an image');
      return;
    }

    // Validate image file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    const maxSizeInMB = 5;
    if (imageFile.size > maxSizeInMB * 1024 * 1024) {
      alert(`Image size must be less than ${maxSizeInMB}MB`);
      return;
    }

    // Check authentication before proceeding
    if (!isAuthenticated) {
      alert('You must be logged in to create categories');
      return;
    }

    if (!isAdmin) {
      alert('You must be an admin to create categories');
      return;
    }

    const categoryData = new FormData();
    categoryData.append('name', newCategoryName.trim());
    categoryData.append('description', newCategoryDescription.trim() || '');
    categoryData.append('image', imageFile);

    // Debug: Log FormData contents
    console.log('handleSaveNewCategory: FormData contents:');
    for (let pair of categoryData.entries()) {
      console.log(pair[0] + ': ', pair[1]);
    }

    // Debug file details
    console.log('handleSaveNewCategory: Image file details:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    });

    try {
      console.log('handleSaveNewCategory: Dispatching createCategory with FormData');
      const result = await dispatch(createCategory(categoryData)).unwrap();
      console.log('handleSaveNewCategory: Success result:', result);
      closeModal('add');
      resetFormData();
      // Remove redundant fetchCategories call - let Redux slice handle state updates
    } catch (error) {
      console.error('Failed to create category - Full error:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      let errorMessage = 'Failed to create category';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleEdit = (categoryId) => {
    const categoryToEdit = (categories || []).find(cat => cat._id === categoryId || cat.id === categoryId);
    if (categoryToEdit) {
      setEditingCategory(categoryToEdit);
      updateFormData('newCategoryName', categoryToEdit.name || '');
      updateFormData('newCategoryDescription', categoryToEdit.description || '');
      updateFormData('uploadedImage', categoryToEdit.imageUrl);
      updateFormData('imageFile', null); // Reset file for editing
      openModal('edit');
    }
  };

  const handleSaveEdit = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    if (!editingCategory) {
      alert('No category selected for editing');
      return;
    }

    const categoryData = new FormData();
    categoryData.append('name', newCategoryName.trim());
    categoryData.append('description', newCategoryDescription.trim() || '');
    
    if (imageFile) {
      categoryData.append('image', imageFile);
    }

    try {
      const categoryId = editingCategory._id || editingCategory.id;
      await dispatch(updateCategory({ categoryId, categoryData })).unwrap();
      closeModal('edit');
      resetFormData();
      // Remove redundant fetchCategories call - let Redux slice handle state updates
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDelete = (categoryId) => {
    const categoryToDelete = (categories || []).find(cat => cat._id === categoryId || cat.id === categoryId);
    if (categoryToDelete) {
      setDeletingCategory(categoryToDelete);
      openModal('delete');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) {
      alert('No category selected for deletion');
      return;
    }

    try {
      const categoryId = deletingCategory._id || deletingCategory.id;
      await dispatch(deleteCategory(categoryId)).unwrap();
      closeModal('delete');
      openModal('deleteSuccess');
      resetFormData();
      // Remove redundant fetchCategories call - let Redux slice handle state updates
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleCloseWithReset = (modalName) => {
    closeModal(modalName);
    resetFormData();
  };

  // Computed values - memoized to prevent infinite re-renders
  const filteredCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];
    
    return categories.filter(category => {
      // Safely handle cases where category.name might be undefined or null
      const categoryName = category?.name || '';
      return categoryName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [categories, searchTerm]);

  // Component renderers
  const renderImageUploadSection = (title = "Upload image") => (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
        {uploadedImage ? (
          <div className="space-y-4">
            <img
              src={uploadedImage}
              alt="Category"
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
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </label>
      </div>
    </div>
  );

  const renderCategoryInput = (title, placeholder = "Enter category name") => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <input
        type="text"
        value={newCategoryName}
        onChange={handleNameChange}
        className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
        placeholder={placeholder}
      />
      
      <textarea
        value={newCategoryDescription}
        onChange={handleDescriptionChange}
        className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
        placeholder="Enter category description (optional)"
        rows={3}
      />
    </div>
  );

  const renderModalActions = (onSave, onCancel, saveText = "save", cancelText = "go back", isLoading = false) => (
    <div className="flex justify-center gap-4 mt-12">
      <button
        onClick={onSave}
        disabled={isLoading}
        className="bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-12 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
      >
        {isLoading && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        )}
        {isLoading ? 'Saving...' : saveText}
      </button>
      <button
        onClick={onCancel}
        disabled={isLoading}
        className="text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed border-2 rounded-xl border-black disabled:border-gray-400 font-medium py-3 px-12 transition-colors focus:outline-none"
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

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the category management.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need admin privileges to access category management.</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Main Content Container */}
      <div className="mx-6 bg-white">
        
        {/* Header */}
        <div className="py-8 px-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">create Category</h1>
          
          {/* Error Display */}
          {(error || categoriesError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">
                    {error || categoriesError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Authentication Warning */}
          {(!isAuthenticated || !isAdmin) && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    Admin authentication required to manage categories
                  </p>
                </div>
              </div>
            </div>
          )}
          
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
                  placeholder="Search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="block w-80 pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={handleCategorySelectChange}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
                >
                  <option value="Category" disabled>Category</option>
                  {(categories || []).map((category) => (
                    <option key={category._id || category.id} value={category?.name || ''}>
                      {category?.name || 'Unnamed Category'}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Add Category Button */}
            <button 
              onClick={handleAddNewCategory}
              className="bg-black hover:bg-gray-800 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
            >
              + Add category
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="px-6 pb-6">
          
          {/* Table Header */}
          <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-6 p-4 bg-gray-50 border-b border-gray-200 rounded-t-lg">
              <div className="col-span-3">
                <h3 className="text-sm font-semibold text-gray-800">Image</h3>
              </div>
              <div className="col-span-6">
                <h3 className="text-sm font-semibold text-gray-800">Category</h3>
              </div>
              <div className="col-span-3">
                <h3 className="text-sm font-semibold text-gray-800">Action</h3>
              </div>
            </div>

            {/* Category Rows */}
            <div className="divide-y divide-gray-200">
              {categoriesLoading ? (
                <div className="p-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 ml-3">Loading categories...</p>
                  </div>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No categories found</p>
                  {searchTerm && (
                    <p className="text-sm text-gray-400 mt-2">
                      Try adjusting your search term
                    </p>
                  )}
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <div key={category._id || category.id} className="grid grid-cols-12 gap-6 p-4 items-center hover:bg-gray-50 transition-colors duration-150">
                    
                    {/* Image Column */}
                    <div className="col-span-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={category.imageUrl || '/api/placeholder/64/64'}
                          alt={category?.name || 'Category Image'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/api/placeholder/64/64';
                          }}
                        />
                      </div>
                    </div>

                    {/* Category Column */}
                    <div className="col-span-6">
                      <p className="text-base font-medium text-gray-900">
                        {category?.name || 'Unnamed Category'}
                      </p>
                    </div>

                    {/* Action Column */}
                    <div className="col-span-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(category._id || category.id)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                          title="Edit Category"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category._id || category.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                          title="Delete Category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Empty State */}
            {filteredCategories.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <p className="text-lg">No categories found matching your search criteria.</p>
                <p className="text-sm mt-2">Try adjusting your search terms or add a new category.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {modals.add && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 overflow-hidden">
            
            {/* Modal Header */}
            <div className="relative p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 text-center">
                Add category
              </h2>
              <button
                onClick={() => handleCloseWithReset('add')}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="grid grid-cols-2 gap-12">
                {renderImageUploadSection()}
                {renderCategoryInput("Type new category")}
              </div>
              {renderModalActions(
                handleSaveNewCategory,
                () => handleCloseWithReset('add'),
                'save',
                'go back',
                createLoading
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {modals.edit && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 overflow-hidden">
            
            {/* Modal Header */}
            <div className="relative p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 text-center">
                Edit Category
              </h2>
              <button
                onClick={() => handleCloseWithReset('edit')}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="grid grid-cols-2 gap-12">
                {renderImageUploadSection()}
                {renderCategoryInput("Edit category name")}
              </div>
              {renderModalActions(
                handleSaveEdit,
                () => handleCloseWithReset('edit'),
                'save',
                'go back',
                updateLoading
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {modals.success && renderSuccessModal(
        "category updated\nsuccessfully!",
        () => handleCloseWithReset('success')
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={modals.delete && deletingCategory}
        onClose={() => {
          closeModal('delete');
          setDeletingCategory(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Are you sure you want to delete this category?"
        isLoading={deleteLoading}
      />

      {/* Delete Success Modal */}
      {modals.deleteSuccess && renderSuccessModal(
        "Category deleted\nsuccessfully!",
        () => handleCloseWithReset('deleteSuccess')
      )}
    </div>
  );
};

export default UploadCategory;
