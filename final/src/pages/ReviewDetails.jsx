import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Star, Upload, Edit2, Trash2, X, Check, Plus } from 'lucide-react';
import { 
  fetchItemReviews,
  createAdminReview,
  clearError
} from '../store/slices/reviewSlice';

const ReviewDetails = ({ productName = "Review Details", onGoBack }) => {
  const dispatch = useDispatch();
  
  // Redux state
  const { 
    selectedProductForReview,
    itemReviews,
    loading,
    error
  } = useSelector((state) => state.reviews);
  
  const { token } = useSelector((state) => state.auth);
  
  // Get reviews for the selected product
  const currentProductReviews = selectedProductForReview 
    ? itemReviews[selectedProductForReview._id]?.reviews || []
    : [];

  // Admin review form state
  const [adminReview, setAdminReview] = useState({
    message: '',
    rating: 0,
    sizeRating: 0,
    comfortRating: 0,
    durabilityRating: 0,
    image: null
  });

  const [hoveredStars, setHoveredStars] = useState({
    rating: 0,
    sizeRating: 0,
    comfortRating: 0,
    durabilityRating: 0
  });

  // UI state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch reviews when component mounts or product changes
  useEffect(() => {
    if (selectedProductForReview?._id) {
      dispatch(fetchItemReviews(selectedProductForReview._id));
    }
  }, [dispatch, selectedProductForReview]);

  const handleStarClick = useCallback((type, rating) => {
    setAdminReview(prev => ({
      ...prev,
      [type]: rating
    }));
  }, []);

  const handleStarHover = useCallback((type, rating) => {
    setHoveredStars(prev => ({
      ...prev,
      [type]: rating
    }));
  }, []);

  const handleStarLeave = useCallback((type) => {
    setHoveredStars(prev => ({
      ...prev,
      [type]: 0
    }));
  }, []);

  const renderStars = useCallback((type, currentRating) => {
    const hovered = hoveredStars[type];
    const activeRating = hovered || currentRating;
    
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-6 h-6 cursor-pointer transition-colors ${
          index < activeRating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300 hover:text-yellow-200'
        }`}
        onClick={() => handleStarClick(type, index + 1)}
        onMouseEnter={() => handleStarHover(type, index + 1)}
        onMouseLeave={() => handleStarLeave(type)}
      />
    ));
  }, [hoveredStars, handleStarClick, handleStarHover, handleStarLeave]);

  const renderDisplayStars = useCallback((rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  }, []);

  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAdminReview(prev => ({
          ...prev,
          image: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSubmitAdminReview = useCallback(async () => {
    if (!selectedProductForReview || !token || adminReview.rating === 0) {
      setSuccessMessage('Please provide at least a rating for the review.');
      setShowSuccessModal(true);
      return;
    }

    try {
      const adminUserId = "507f1f77bcf86cd799439011";
      
      const reviewData = {
        rating: adminReview.rating,
        reviewText: adminReview.message || `Admin review for ${productName}`,
        userId: adminUserId
      };

      await dispatch(createAdminReview({
        itemId: selectedProductForReview._id,
        reviewData,
        token
      })).unwrap();

      setAdminReview({
        message: '',
        rating: 0,
        sizeRating: 0,
        comfortRating: 0,
        durabilityRating: 0,
        image: null
      });

      setSuccessMessage('Admin review posted successfully!');
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Error posting admin review:', error);
      setSuccessMessage('Error posting review: ' + error);
      setShowSuccessModal(true);
    }
  }, [selectedProductForReview, token, adminReview, productName, dispatch]);

  const handleDeleteReview = useCallback((reviewId) => {
    setReviewToDelete(reviewId);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (reviewToDelete) {
      setSuccessMessage('Review deleted successfully!');
      setShowSuccessModal(true);
      setShowDeleteModal(false);
      setReviewToDelete(null);
    }
  }, [reviewToDelete]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const getUserName = (review) => {
    if (review.user && typeof review.user === 'object') {
      return review.user.name || review.user.email || 'Anonymous';
    }
    return 'Anonymous';
  };

  if (loading.reviews) {
    return (
      <div className="bg-white min-h-screen p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={onGoBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back to Reviews
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Reviews for {productName}</h1>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Customer Reviews Section */}
          <div className="bg-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Customer Reviews ({currentProductReviews.length})
              </h2>
            </div>

            <div className="space-y-6">
              {currentProductReviews.length > 0 ? (
                currentProductReviews.map((review) => (
                  <div key={review._id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center mb-2">
                          <div className="flex space-x-1">
                            {renderDisplayStars(review.rating)}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {review.rating}/5 stars
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          By {getUserName(review)} • {formatDate(review.createdAt)}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit review"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {review.reviewText && (
                      <p className="text-gray-700 mb-4">{review.reviewText}</p>
                    )}

                    {review.image && (
                      <div className="mb-4">
                        <img
                          src={review.image}
                          alt="Review"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border border-gray-200 rounded-lg">
                  <p className="text-gray-500 text-lg">No customer reviews yet.</p>
                  <p className="text-gray-400 text-sm mt-2">Be the first to add an admin review!</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Review Form Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add Admin Review</h2>
            
            <div className="space-y-6">
              {/* Overall Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating *
                </label>
                <div className="flex items-center space-x-1">
                  {renderStars('rating', adminReview.rating)}
                  <span className="ml-2 text-sm text-gray-600">
                    {adminReview.rating > 0 ? `${adminReview.rating}/5 stars` : 'Click to rate'}
                  </span>
                </div>
              </div>

              {/* Review Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Message (Optional)
                </label>
                <textarea
                  value={adminReview.message}
                  onChange={(e) => setAdminReview(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Write your review here..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600">Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {adminReview.image && (
                    <img
                      src={adminReview.image}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3">
                <button
                  onClick={handleSubmitAdminReview}
                  disabled={loading.creatingReview || adminReview.rating === 0}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading.creatingReview ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Post Admin Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-96 max-w-md text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-600">{successMessage}</p>
            </div>
            
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-96 max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Delete Review</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewDetails;
