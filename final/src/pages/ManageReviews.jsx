import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, ChevronDown, Star, X, Plus } from 'lucide-react';
import ReviewDetails from './ReviewDetails';
import AddReviewModal from '../components/AddReviewModal';
import SafeImage from '../components/SafeImage';
import {
  fetchProductsForReviews,
  fetchCategories,
  fetchSubCategories,
  fetchItemReviews,
  createAdminReview,
  updateReviewSettings,
  setSearchTerm,
  setSelectedCategory,
  setSelectedSubcategory,
  setSelectedProductForReview,
  setShowReviewDetails,
  clearError,
} from '../store/slices/reviewSlice';

// Memoized ProductRow component to prevent unnecessary re-renders
const ProductRow = React.memo(({ 
  product, 
  renderStars, 
  renderRatingScale, 
  handleViewReviews, 
  handleToggleReviews,
  handleAddReview
}) => {
  // Calculate average rating from reviews
  const averageRating = product.averageRating || 0;
  const reviewsCount = product.reviews?.length || 0;
  const isReviewsEnabled = product.isReviewSubmissionEnabled !== false; // Default to true if not set

  // Get category and subcategory names
  const categoryName = typeof product.categoryId === 'object' 
    ? product.categoryId?.name 
    : product.category || 'Unknown';
    
  const subcategoryName = typeof product.subCategoryId === 'object' 
    ? product.subCategoryId?.name 
    : product.subcategory || 'Unknown';

  return (
    <div key={product._id} className="px-6 py-6">
      <div className="grid grid-cols-12 gap-4 items-start">
        {/* Product Image */}
        <div className="col-span-1">
          <SafeImage
            src={product.imageUrl || product.images?.[0]}
            alt={product.name || product.title}
            fallbackType="product"
            className="w-16 h-20 object-cover rounded-md"
          />
        </div>

        {/* Product Name */}
        <div className="col-span-2">
          <h3 className="text-lg font-medium text-gray-900">{product.name || product.title}</h3>
          <p className="text-xs text-gray-500 mt-1">{reviewsCount} review{reviewsCount !== 1 ? 's' : ''}</p>
        </div>

        {/* Rating */}
        <div className="col-span-1">
          <div className="flex space-x-1 mb-1">{renderStars(Math.round(averageRating))}</div>
          <p className="text-xs text-gray-600">{averageRating.toFixed(1)}/5.0</p>
        </div>

        {/* Size and Fit Ratings - Placeholder for now */}
        <div className="col-span-2">
          {renderRatingScale(3, 'size')}
          {renderRatingScale(4, 'comfort')}
          {renderRatingScale(4, 'durability')}
        </div>

        {/* Category */}
        <div className="col-span-1">
          <span className="text-sm text-gray-700">{categoryName}</span>
        </div>

        {/* Subcategory */}
        <div className="col-span-1">
          <span className="text-sm text-gray-700">{subcategoryName}</span>
        </div>

        {/* Action Buttons */}
        <div className="col-span-2">
          <div className="flex space-x-2">
            <button 
              onClick={() => handleViewReviews(product)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View Reviews
            </button>
            <button 
              onClick={() => handleAddReview(product)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Review
            </button>
          </div>
        </div>

        {/* Toggle Reviews */}
        <div className="col-span-2">
          <div className="flex space-x-2">
            <button
              onClick={() => handleToggleReviews(product._id, true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isReviewsEnabled
                  ? 'bg-blue-600 text-white border-black'
                  : 'bg-gray-200 text-black'
              }`}
            >
              On
            </button>
            <button
              onClick={() => handleToggleReviews(product._id, false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !isReviewsEnabled
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-black'
              }`}
            >
              Off
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductRow.displayName = 'ProductRow';

const ManageReviews = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const {
    filteredProducts,
    categories,
    subcategories,
    selectedCategory,
    selectedSubcategory,
    searchTerm,
    loading,
    error,
    selectedProductForReview,
    showReviewDetails
  } = useSelector((state) => state.reviews);
  
  const { token } = useSelector((state) => state.auth);
  
  // Local state
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [subcategoryDropdownOpen, setSubcategoryDropdownOpen] = useState(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [selectedProductForAddReview, setSelectedProductForAddReview] = useState(null);
  
  // Consolidated modal state for better performance
  const [modalState, setModalState] = useState({
    showToggleModal: false,
    showSuccessModal: false,
    successMessage: ''
  });
  
  // Action states
  const [toggleProductId, setToggleProductId] = useState(null);
  const [toggleAction, setToggleAction] = useState('');

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchProductsForReviews());
    
    // Only fetch categories if not already loaded
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories());
    }
    
    // Only fetch subcategories if not already loaded
    if (!subcategories || subcategories.length === 0) {
      dispatch(fetchSubCategories());
    }
  }, [dispatch, categories, subcategories]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'All categories') {
      const selectedCategoryId = categories.find(cat => cat.name === selectedCategory)?._id;
      if (selectedCategoryId && selectedCategoryId !== 'all') {
        dispatch(fetchSubCategories(selectedCategoryId));
      }
    }
  }, [selectedCategory, categories, dispatch]);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleViewReviews = useCallback((product) => {
    dispatch(setSelectedProductForReview(product));
    dispatch(setShowReviewDetails(true));
  }, [dispatch]);

  const handleGoBackFromReviews = useCallback(() => {
    dispatch(setShowReviewDetails(false));
    dispatch(setSelectedProductForReview(null));
  }, [dispatch]);

  const handleAddReview = useCallback((product) => {
    setSelectedProductForAddReview(product);
    setShowAddReviewModal(true);
  }, []);

  const handleSubmitReview = useCallback(async (reviewData) => {
    if (!selectedProductForAddReview || !token) return;

    // For admin reviews, we need a fake userId - using a default admin user ID
    const adminUserId = "507f1f77bcf86cd799439011"; // Default admin user ID
    
    const reviewWithUserId = {
      ...reviewData,
      userId: adminUserId
    };

    try {
      await dispatch(createAdminReview({
        itemId: selectedProductForAddReview._id,
        reviewData: reviewWithUserId,
        token
      })).unwrap();

      setShowAddReviewModal(false);
      setSelectedProductForAddReview(null);
      setModalState(prev => ({
        ...prev,
        showSuccessModal: true,
        successMessage: 'Admin review added successfully!'
      }));
    } catch (error) {
      console.error('Error adding review:', error);
      setModalState(prev => ({
        ...prev,
        showSuccessModal: true,
        successMessage: 'Error adding review: ' + error
      }));
    }
  }, [selectedProductForAddReview, token, dispatch]);

  const handleToggleReviews = useCallback(async (productId, enable) => {
    if (!token) return;
    
    setToggleProductId(productId);
    setToggleAction(enable ? 'on' : 'off');
    setModalState(prev => ({ ...prev, showToggleModal: true }));
  }, [token]);

  const confirmToggle = useCallback(async () => {
    if (!toggleProductId || !token) return;

    try {
      const settings = {
        isReviewSubmissionEnabled: toggleAction === 'on',
        isReviewDisplayEnabled: toggleAction === 'on'
      };

      await dispatch(updateReviewSettings({
        itemId: toggleProductId,
        settings,
        token
      })).unwrap();

      setModalState(prev => ({
        ...prev,
        showToggleModal: false,
        showSuccessModal: true,
        successMessage: `Reviews ${toggleAction === 'on' ? 'enabled' : 'disabled'} successfully!`
      }));
      setToggleProductId(null);
      setToggleAction('');
    } catch (error) {
      console.error('Error updating review settings:', error);
      setModalState(prev => ({
        ...prev,
        showToggleModal: false,
        showSuccessModal: true,
        successMessage: 'Error updating review settings: ' + error
      }));
    }
  }, [toggleProductId, toggleAction, token, dispatch]);

  const closeAllModals = useCallback(() => {
    setModalState({
      showToggleModal: false,
      showSuccessModal: false,
      successMessage: ''
    });
    setToggleProductId(null);
    setToggleAction('');
    setShowAddReviewModal(false);
    setSelectedProductForAddReview(null);
  }, []);

  // Search and filter handlers
  const handleSearchChange = useCallback((e) => {
    dispatch(setSearchTerm(e.target.value));
  }, [dispatch]);

  const handleCategorySelect = useCallback((category) => {
    dispatch(setSelectedCategory(category));
    setCategoryDropdownOpen(false);
  }, [dispatch]);

  const handleSubcategorySelect = useCallback((subcategory) => {
    dispatch(setSelectedSubcategory(subcategory));
    setSubcategoryDropdownOpen(false);
  }, [dispatch]);

  // Memoized render functions to prevent recreation on every render
  const renderStars = useCallback((rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  }, []);

  const renderRatingScale = useCallback((rating, label) => {
    return (
      <div className="flex flex-col items-start space-y-2 mb-4">
        <div className="text-xs font-semibold text-gray-700">
          How was the {label}?
        </div>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <React.Fragment key={value}>
              <div
                className={`w-3 h-3 rounded-full border border-black ${
                  value === rating ? 'bg-black' : 'bg-white'
                }`}
              />
              {value < 5 && <div className="w-4 h-px bg-black" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }, []);

  // Loading state
  if (loading.products && !filteredProducts.length) {
    return (
      <div className="bg-white min-h-screen p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showReviewDetails ? (
        <ReviewDetails 
          productName={selectedProductForReview?.name || selectedProductForReview?.title || "Review Details"}
          onGoBack={handleGoBackFromReviews}
        />
      ) : (
        <div className="bg-white min-h-screen p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage reviews</h1>
            
            {/* Search and Filter Bar */}
            <div className="flex gap-4 mb-6">
              {/* Search Input */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="flex items-center justify-between px-4 py-2.5 border-2 border-black rounded-xl w-40 text-sm font-medium"
                >
                  {selectedCategory}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                {categoryDropdownOpen && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                    {categories.map((category) => (
                      <button
                        key={category._id}
                        onClick={() => handleCategorySelect(category.name)}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Subcategory Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSubcategoryDropdownOpen(!subcategoryDropdownOpen)}
                  className="flex items-center justify-between px-4 py-2.5 border-2 border-black rounded-xl w-40 text-sm font-medium"
                >
                  {selectedSubcategory}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                {subcategoryDropdownOpen && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                    {subcategories.map((subcategory) => (
                      <button
                        key={subcategory._id}
                        onClick={() => handleSubcategorySelect(subcategory.name)}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {subcategory.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1 text-sm font-bold text-gray-900">Image</div>
                <div className="col-span-2 text-sm font-bold text-gray-900">item</div>
                <div className="col-span-1 text-sm font-bold text-gray-900">rating</div>
                <div className="col-span-2 text-sm font-bold text-gray-900">size and fit</div>
                <div className="col-span-1 text-sm font-bold text-gray-900">category</div>
                <div className="col-span-1 text-sm font-bold text-gray-900">subcategory</div>
                <div className="col-span-2 text-sm font-bold text-gray-900">Action</div>
                <div className="col-span-2 text-sm font-bold text-gray-900">Turn review on/off for this item</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <ProductRow
                  key={product._id}
                  product={product}
                  renderStars={renderStars}
                  renderRatingScale={renderRatingScale}
                  handleViewReviews={handleViewReviews}
                  handleToggleReviews={handleToggleReviews}
                  handleAddReview={handleAddReview}
                />
              ))}
            </div>
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && !loading.products && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found matching your search criteria.</p>
            </div>
          )}

          {/* Loading State */}
          {loading.products && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 text-lg mt-4">Loading products...</p>
            </div>
          )}

          {/* Add Review Modal */}
          <AddReviewModal
            isOpen={showAddReviewModal}
            onClose={() => {
              setShowAddReviewModal(false);
              setSelectedProductForAddReview(null);
            }}
            onSubmit={handleSubmitReview}
            productName={selectedProductForAddReview?.name || selectedProductForAddReview?.title}
            loading={loading.creatingReview}
          />

          {/* Toggle Confirmation Modal */}
          {modalState.showToggleModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 w-96 max-w-md">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {toggleAction === 'on' ? 'Enable' : 'Disable'} Reviews
                  </h2>
                  <button
                    onClick={closeAllModals}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to {toggleAction === 'on' ? 'enable' : 'disable'} reviews for this product?
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={confirmToggle}
                    disabled={loading.updatingSettings}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors text-white ${
                      toggleAction === 'on' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    } disabled:bg-gray-400`}
                  >
                    {loading.updatingSettings ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                    ) : (
                      toggleAction === 'on' ? 'Enable' : 'Disable'
                    )}
                  </button>
                  <button
                    onClick={closeAllModals}
                    disabled={loading.updatingSettings}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Modal */}
          {modalState.showSuccessModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 w-96 max-w-md text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Success!</h2>
                  <p className="text-gray-600">{modalState.successMessage}</p>
                </div>
                
                <button
                  onClick={closeAllModals}
                  className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ManageReviews;