import API from './axiosConfig';

// Auth API endpoints
export const authAPI = {
  // User authentication
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  logout: () => API.get('/auth/logout'),
  refreshToken: () => API.post('/auth/refresh-token'),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => API.post('/auth/reset-password', { token, password }),
  
  // OTP Authentication
  generateOTP: (phoneNumber) => API.post('/auth/generate-otp', { phoneNumber }),
  verifyOTP: (otpData) => API.post('/auth/verifyOtp', otpData),
  resendOTP: (phoneNumber) => API.post('/auth/resend-otp', { phoneNumber }),
  
  // Firebase Authentication
  verifyFirebaseOTP: (firebaseData) => API.post('/auth/verifyFirebaseOtp', { 
    idToken: firebaseData.idToken, 
    phoneNumber: firebaseData.phoneNumber 
  }),
  signupFirebase: (idToken) => API.post('/auth/signup/firebase', { idToken }),
  loginFirebase: (idToken) => API.post('/auth/login/firebase', { idToken }),
};

// User profile API endpoints
export const userAPI = {
  getProfile: () => API.get('/user/profile'),
  updateProfile: (userData) => API.put('/user/profile', userData),
  deleteAccount: () => API.delete('/user/profile'),
  getUserById: (userId) => API.get(`/user/${userId}`),
  
  // Location preference management
  getLocationPreference: () => API.get('/users/location-preference'),
  setLocationPreference: (data) => API.post('/users/location-preference', data),
};

// Firebase Admin API endpoints
export const firebaseAPI = {
  getAllUsers: () => API.get('/firebase/users'),
  getUserById: (uid) => API.get(`/firebase/users/${uid}`),
  blockUser: (uid, reason) => API.post(`/firebase/users/${uid}/block`, { reason }),
  unblockUser: (uid) => API.post(`/firebase/users/${uid}/unblock`),
  deleteUser: (uid) => API.delete(`/firebase/users/${uid}`),
};

// Items/Products API endpoints
export const itemAPI = {
  // Get items
  getAllItems: (params = {}) => API.get('/items', { params }),
  getItemById: (itemId) => API.get(`/items/${itemId}`),
  getItemsByCategory: (categoryId) => API.get(`/items/category/${categoryId}`),
  getItemsBySubCategory: (subCategoryId) => API.get(`/items/subcategory/${subCategoryId}`),
  getItemStatistics: () => API.get('/items/statistics'),
  
  // CRUD operations - consistent and authenticated
  createItem: (itemData) => API.post('/items', itemData, {
    timeout: 30000,
  }),
  updateItem: (itemId, itemData) => API.put(`/items/${itemId}`, itemData, {
    timeout: 30000,
  }),
  deleteItem: (itemId) => API.delete(`/items/${itemId}`),
  
  // Media upload endpoints - NEW FILE UPLOAD SYSTEM
  uploadImages: (itemId, formData, config = {}) => API.post(`/item-media/upload-images/${itemId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // 60 second timeout for multiple image uploads
    ...config
  }),
  uploadVideos: (itemId, formData, config = {}) => API.post(`/item-media/upload-videos/${itemId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 2 minute timeout for video uploads
    ...config
  }),
  deleteImage: (itemId, imageIndex) => API.delete(`/item-media/delete-image/${itemId}/${imageIndex}`),
  deleteVideo: (itemId, videoIndex) => API.delete(`/item-media/delete-video/${itemId}/${videoIndex}`),
  
  // Legacy media upload endpoints (deprecated - for backwards compatibility)
  uploadImage: (formData, config = {}) => API.post('/items/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000, // 30 second timeout for uploads
    ...config
  }),
  uploadVideo: (formData, config = {}) => API.post('/items/upload-video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // 60 second timeout for video uploads (larger files)
    ...config
  }),
  
  // Legacy endpoints (kept for compatibility)
  createItemWithAuth: (itemData) => API.post('/items/text-only', itemData), // Use text-only endpoint for authenticated workflow
  
  // NEW FLOW-BASED API ENDPOINTS
  // Phase 1: Create basic product information with sizes
  createBasicProduct: (productData) => API.post('/items/basic-product', productData),
  
  // Phase 2: Update product with draft configuration (images, filters, categories)
  updateDraftConfiguration: (itemId, draftData) => API.put(`/items/${itemId}/draft-configuration`, draftData),
  
  // Phase 3: Add review to product (consumer/admin side)
  addReview: (itemId, reviewData) => API.post(`/items/${itemId}/reviews`, reviewData),
  
  // Phase 4: Update also show in options (draft management)
  updateAlsoShowInOptions: (itemId, optionsData) => API.put(`/items/${itemId}/also-show-options`, optionsData),
  
  // Phase 5: Update product status (draft → schedule → live)
  updateProductStatus: (itemId, statusData) => {
    console.log('🔧 API updateProductStatus called with:', { itemId, statusData });
    
    if (!itemId) {
      console.error('❌ API updateProductStatus: itemId is missing!');
      throw new Error('Item ID is required for status update');
    }
    
    return API.put(`/items/${itemId}/status`, statusData);
  },
  
  // Get scheduled items summary
  getScheduledItemsSummary: () => API.get('/items/scheduled-summary'),
  
  // Utility endpoints for the new flow
  getProductById: (itemId) => API.get(`/items/${itemId}`), // Updated to match backend route
  getProductsByStatus: (status, params = {}) => API.get(`/items/status/${status}`, { params }),
  updateProductSizes: (itemId, sizesData) => API.put(`/items/${itemId}/sizes`, sizesData),
  updateReviewSettings: (itemId, settingsData) => API.put(`/items/${itemId}/review-settings`, settingsData),
  
  // Recommendation Settings
  getRecommendationSettings: (itemId) => API.get(`/items/${itemId}/recommendation-settings`),
  updateRecommendationSettings: (itemId, settingsData) => API.put(`/items/${itemId}/recommendation-settings`, settingsData),
  
  // Product Management Settings
  getProductManagementSettings: (itemId) => API.get(`/items/${itemId}/management-settings`),
  updateProductManagementSettings: (itemId, settingsData) => API.put(`/items/${itemId}/management-settings`, settingsData),
  
  // Bulk operations
  bulkUpdateProductSettings: (itemIds, updateData) => API.put('/items/bulk/management-settings', { itemIds, updateData }),
  
  // Dynamic filters
  fetchDynamicFilters: () => API.get('/filters'),
  
  // Item details
  getItemDetails: (itemId) => API.get(`/item-details/${itemId}`),
  updateItemDetails: (itemId, detailsData) => API.put(`/item-details/${itemId}`, detailsData),
  
  // Arrangement control endpoints
  getCategoriesForArrangement: () => API.get('/items/categories-arrangement'),
  getItemsForArrangement: (params = {}) => API.get('/items/items-arrangement', { params }),
  updateItemsDisplayOrder: (items) => API.put('/items/items-display-order', { items }),
  updateCategoriesDisplayOrder: (categories) => API.put('/items/categories-display-order', { categories }),
  updateSubCategoriesDisplayOrder: (subcategories) => API.put('/items/subcategories-display-order', { subcategories }),
  
  // New Product Management Functions
  fetchProducts: (params = {}) => API.get('/items', { params }),
  fetchProductsByStatus: (status, params = {}) => API.get(`/items/status/${status}`, { params }),
  updateDraftConfiguration: (configData) => API.put('/items/draft-configuration', configData),
  deleteProduct: (productId) => API.delete(`/items/${productId}`),
  
  // Category assignment
  updateItemCategoryAssignment: (itemId, assignmentData) => API.put(`/items/${itemId}/category-assignment`, assignmentData),
  
  uploadProductImages: (productId, images) => {
    const formData = new FormData();
    images.forEach(image => formData.append('images', image));
    return API.post(`/item-media/upload-images/${productId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000 // 60 second timeout for multiple image uploads
    });
  },
  uploadProductVideos: (productId, videos) => {
    const formData = new FormData();
    videos.forEach(video => formData.append('videos', video));
    return API.post(`/item-media/upload-videos/${productId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000 // 2 minute timeout for video uploads
    });
  },
  deleteProductImage: (productId, imageIndex) => API.delete(`/item-media/delete-image/${productId}/${imageIndex}`),
  deleteProductVideo: (productId, videoId) => API.delete(`/item-media/delete-video/${productId}/${videoId}`),
  
  // Size chart image endpoints
  uploadSizeChartImage: (productId, formData) => {
    return API.post(`/item-media/upload-size-chart/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });
  },
  deleteSizeChartImage: (productId) => API.delete(`/item-media/delete-size-chart/${productId}`),
};

// Category API endpoints
export const categoryAPI = {
  getAllCategories: () => API.get('/categories'),
  getCategoryById: (categoryId) => API.get(`/categories/${categoryId}`),
  createCategory: (categoryData) => API.post('/categories', categoryData, {
    timeout: 30000, // 30 second timeout for uploads
  }),
  updateCategory: (categoryId, categoryData) => API.put(`/categories/${categoryId}`, categoryData, {
    timeout: 30000, // 30 second timeout for uploads
  }),
  deleteCategory: (categoryId) => API.delete(`/categories/${categoryId}`),
};

// SubCategory API endpoints
export const subCategoryAPI = {
  getAllSubCategories: () => API.get('/subcategories'),
  getSubCategoryById: (subCategoryId) => API.get(`/subcategories/${subCategoryId}`),
  getSubCategoriesByCategory: (categoryId) => API.get(`/subcategories/category/${categoryId}`),
  createSubCategory: (subCategoryData) => API.post('/subcategories', subCategoryData),
  updateSubCategory: (subCategoryId, subCategoryData) => API.put(`/subcategories/${subCategoryId}`, subCategoryData),
  deleteSubCategory: (subCategoryId) => API.delete(`/subcategories/${subCategoryId}`),
};

// Cart API endpoints
export const cartAPI = {
  getCart: () => API.get('/cart'),
  addToCart: (itemData) => API.post('/cart/add', itemData),
  updateCartItem: (itemId, quantity) => API.put(`/cart/update/${itemId}`, { quantity }),
  removeFromCart: (itemId) => API.delete(`/cart/remove/${itemId}`),
  clearCart: () => API.delete('/cart/clear'),
};

// Wishlist API endpoints
export const wishlistAPI = {
  getWishlist: () => API.get('/wishlist'),
  addToWishlist: (itemId) => API.post('/wishlist/add', { itemId }),
  removeFromWishlist: (itemId) => API.delete(`/wishlist/remove/${itemId}`),
  clearWishlist: () => API.delete('/wishlist/clear'),
};

// Save For Later API endpoints
export const saveForLaterAPI = {
  getSaveForLater: () => API.get('/save-for-later'),
  addToSaveForLater: (data) => API.post('/save-for-later/add', data),
  removeFromSaveForLater: (itemId) => API.delete(`/save-for-later/remove/${itemId}`),
  clearSaveForLater: () => API.delete('/save-for-later/clear'),
  moveToCart: (data) => API.post('/save-for-later/move-to-cart', data),
  moveToWishlist: (data) => API.post('/save-for-later/move-to-wishlist', data),
  updateNote: (itemId, data) => API.put(`/save-for-later/update-note/${itemId}`, data)
};

// Promo Code API endpoints
export const promoCodeAPI = {
  // Get all promo codes with filtering and pagination
  getAllPromoCodes: (params = {}) => API.get('/promoCode/admin/promo-codes', { params }),
  
  // Get promo code by ID
  getPromoCodeById: (id) => API.get(`/promoCode/admin/promo-codes/${id}`),
  
  // Create new promo code
  createPromoCode: (promoCodeData) => API.post('/promoCode/admin/promo-codes', promoCodeData),
  
  // Update promo code
  updatePromoCode: (id, promoCodeData) => API.put(`/promoCode/admin/promo-codes/${id}`, promoCodeData),
  
  // Delete promo code
  deletePromoCode: (id) => API.delete(`/promoCode/admin/promo-codes/${id}`),
  
  // Validate promo code (public endpoint)
  validatePromoCode: (data) => API.post('/promoCode/promo-codes/validate', data),
  
  // Bulk operations
  bulkToggleStatus: (data) => API.post('/promoCode/admin/promo-codes/bulk/toggle-status', data),
  bulkDelete: (data) => API.post('/promoCode/admin/promo-codes/bulk/delete', data),
  
  // Get statistics
  getPromoCodeStats: () => API.get('/promoCode/admin/promo-codes/stats'),
  
  // Search promo codes
  searchPromoCodes: (query) => API.get(`/promoCode/admin/promo-codes/search?q=${encodeURIComponent(query)}`),
  
  // Get promo codes by status
  getPromoCodesByStatus: (isActive) => API.get(`/promoCode/admin/promo-codes/status/${isActive}`),
  
  // Get expired promo codes
  getExpiredPromoCodes: () => API.get('/promoCode/admin/promo-codes/expired'),
  
  // Clone promo code
  clonePromoCode: (id) => API.post(`/promoCode/admin/promo-codes/${id}/clone`),
};

// Order API endpoints
export const orderAPI = {
  getAllOrders: (params = {}) => API.get('/orders', { params }),
  getOrderById: (orderId) => API.get(`/orders/${orderId}`),
  createOrder: (orderData) => API.post('/orders', orderData),
  updateOrderStatus: (orderId, status) => API.put(`/orders/${orderId}/status`, { status }),
  cancelOrder: (orderId) => API.put(`/orders/${orderId}/cancel`),
  getUserOrders: () => API.get('/orders/user'),
  
  // Currency and delivery options
  getDeliveryOptions: (params = {}) => API.get('/orders/delivery-options', { params }),
  convertPrices: (data) => API.post('/orders/convert-prices', data),
};

// Admin Order Management API endpoints
export const adminOrderAPI = {
  // Order management
  getAllOrders: (params = {}) => API.get('/admin/orders', { params }),
  getOrderById: (orderId) => API.get(`/admin/orders/${orderId}`),
  getOrderStatistics: () => API.get('/admin/orders/statistics'),
  
  // Enhanced order management endpoints
  getAllOrdersEnhanced: (params = {}) => API.get('/admin/orders/enhanced', { params }),
  getOrderByIdEnhanced: (orderId) => API.get(`/admin/orders/${orderId}/enhanced`),
  
  // Order status management
  updateOrderStatus: (orderId, data) => API.put(`/admin/orders/${orderId}/status`, data),
  acceptOrder: (orderId, data) => API.put(`/admin/orders/${orderId}/accept`, data),
  rejectOrder: (orderId, data) => API.put(`/admin/orders/${orderId}/reject`, data),
  
  // Vendor management
  allotVendor: (orderId, data) => API.put(`/admin/orders/${orderId}/vendor`, data),
  getAvailableVendors: () => API.get('/admin/vendors'),
  
  // Courier management
  updateCourierStatus: (orderId, data) => API.put(`/admin/orders/${orderId}/courier`, data),
  
  // Return management
  getReturnRequests: (params = {}) => API.get('/admin/returns', { params }),
  processReturnRequest: (orderId, returnId, data) => API.put(`/admin/orders/${orderId}/returns/${returnId}`, data),
  
  // Exchange management
  getExchangeRequests: (params = {}) => API.get('/admin/exchanges', { params }),
  processExchangeRequest: (orderId, exchangeId, data) => API.put(`/admin/orders/${orderId}/exchanges/${exchangeId}`, data),
  
  // Bulk operations
  bulkUpdateOrders: (data) => API.put('/admin/orders/bulk', data),
  
  // Shiprocket integration - Complete API coverage
  createShiprocketOrder: (orderId, data) => API.post(`/admin/orders/${orderId}/create-shiprocket-order`, data),
  createShipment: (orderId, data) => API.post(`/admin/orders/${orderId}/shipment`, data),
  trackShipment: (orderId) => API.get(`/admin/orders/${orderId}/track`),
  generateAWB: (orderId, data) => API.post(`/admin/orders/${orderId}/awb`, data),
  getShippingLabel: (orderId) => API.get(`/admin/orders/${orderId}/label`),
  getAvailableCouriers: (orderId) => API.get(`/admin/orders/${orderId}/couriers`),
  getShippingRates: (orderId) => API.get(`/admin/orders/${orderId}/rates`),
  getPickupLocations: () => API.get('/admin/pickup-locations'),
  assignCourier: (orderId, data) => API.post(`/admin/orders/${orderId}/assign-courier`, data),
  cancelShipment: (orderId) => API.post(`/admin/orders/${orderId}/cancel-shipment`),
  bulkCreateShipments: (orderIds) => API.post('/admin/orders/bulk-create-shipments', { orderIds }),
  
  // Enhanced Shiprocket features
  refreshTracking: (orderId) => API.post(`/admin/orders/${orderId}/refresh-tracking`),
  schedulePickup: (orderId, data) => API.post(`/admin/orders/${orderId}/schedule-pickup`, data),
  getShiprocketOrderDetails: (orderId) => API.get(`/admin/orders/${orderId}/shiprocket-details`),
  getRealTimeUpdates: () => API.get('/admin/orders/real-time-updates'),
  
  // Shiprocket authentication and wallet
  testShiprocketConnection: () => API.get('/admin/shiprocket/test-connection'),
  getShiprocketWalletBalance: () => API.get('/admin/shiprocket/wallet-balance'),
  
  // Bulk operations
  bulkGenerateAWB: (orderIds) => API.post('/admin/orders/bulk-generate-awb', { orderIds }),
  bulkPrintLabels: (orderIds) => API.post('/admin/orders/bulk-print-labels', { orderIds }),
  bulkSchedulePickup: (orderIds, data) => API.post('/admin/orders/bulk-schedule-pickup', { orderIds, ...data }),
};

// Address API endpoints
export const addressAPI = {
  getAllAddresses: () => API.get('/addresses'),
  getAddressById: (addressId) => API.get(`/addresses/${addressId}`),
  createAddress: (addressData) => API.post('/addresses', addressData),
  updateAddress: (addressId, addressData) => API.put(`/addresses/${addressId}`, addressData),
  deleteAddress: (addressId) => API.delete(`/addresses/${addressId}`),
  setDefaultAddress: (addressId) => API.put(`/addresses/${addressId}/default`),
};

// Payment API endpoints
export const paymentAPI = {
  createPaymentIntent: (orderData) => API.post('/payment/create-intent', orderData),
  verifyPayment: (paymentData) => API.post('/payment/verify', paymentData),
  getPaymentHistory: () => API.get('/payment/history'),
};

// Review API endpoints
export const reviewAPI = {
  // User review endpoints
  createReview: (itemId, reviewData) => API.post(`/reviews/user/${itemId}/reviews`, reviewData),
  getReviews: (itemId) => API.get(`/reviews/user/${itemId}/reviews`),
  updateReview: (itemId, reviewId, reviewData) => API.put(`/reviews/user/${itemId}/reviews/${reviewId}`, reviewData),
  deleteReview: (itemId, reviewId) => API.delete(`/reviews/user/${itemId}/reviews/${reviewId}`),
  getAverageRating: (itemId) => API.get(`/reviews/user/${itemId}/average-rating`),
  
  // Public review endpoints
  getPublicReviews: (itemId) => API.get(`/reviews/public/${itemId}/reviews`),
  getPublicAverageRating: (itemId) => API.get(`/reviews/public/${itemId}/average-rating`),
  
  // Admin review endpoints
  getAdminReviews: (itemId) => API.get(`/reviews/admin/${itemId}/reviews`),
  createFakeReview: (itemId, reviewData) => API.post(`/reviews/admin/${itemId}/reviews`, reviewData),
  updateReviewSettings: (itemId, settings) => API.put(`/reviews/admin/${itemId}/review-settings`, settings),
  
  // Legacy endpoints (kept for backward compatibility)
  getItemReviews: (itemId) => API.get(`/reviews/item/${itemId}`),
  createReviewLegacy: (reviewData) => API.post('/reviews', reviewData),
  updateReviewLegacy: (reviewId, reviewData) => API.put(`/reviews/${reviewId}`, reviewData),
  deleteReviewLegacy: (reviewId) => API.delete(`/reviews/${reviewId}`),
  getUserReviews: () => API.get('/reviews/user'),
};

// Legacy Promo Code endpoints (kept for backward compatibility)
export const legacyPromoAPI = {
  validatePromoCode: (code) => API.post('/promo/validate', { code }),
  applyPromoCode: (code, orderData) => API.post('/promo/apply', { code, ...orderData }),
  getUserPromoCodes: () => API.get('/promo/user'),
};

// Filter API endpoints
export const filterAPI = {
  // Get all available filters
  getAllFilters: () => API.get('/filters'),
  getFilterById: (filterId) => API.get(`/filters/${filterId}`),
  getFiltersByKey: (key) => API.get(`/filters/key/${key}`),
  
  // Filter CRUD operations (admin)
  createFilter: (filterData) => API.post('/filters', filterData),
  updateFilter: (filterId, filterData) => API.put(`/filters/${filterId}`, filterData),
  deleteFilter: (filterId) => API.delete(`/filters/${filterId}`),
  updateFilterPriority: (filterId, priority) => API.patch(`/filters/${filterId}/priority`, { priority }),
  
  // Filter application and search
  applyFilters: (filterCriteria) => API.post('/filters/apply', filterCriteria),
  searchWithFilters: (searchParams) => API.post('/filters/search', searchParams),
  
  // Filter analytics and suggestions
  getFilterAnalytics: () => API.get('/filters/analytics'),
  getPopularFilters: () => API.get('/filters/popular'),
  getSuggestedFilters: (productId) => API.get(`/filters/suggestions/${productId}`),
  
  // Filter presets and management
  saveFilterPreset: (presetData) => API.post('/filters/presets', presetData),
  getFilterPresets: () => API.get('/filters/presets'),
  deleteFilterPreset: (presetId) => API.delete(`/filters/presets/${presetId}`),
  
  // Price range and dynamic filters
  getPriceRange: (categoryId) => API.get(`/filters/price-range/${categoryId || 'all'}`),
  getAvailableSizes: (categoryId) => API.get(`/filters/sizes/${categoryId || 'all'}`),
  getAvailableColors: (categoryId) => API.get(`/filters/colors/${categoryId || 'all'}`),
  getBrands: (categoryId) => API.get(`/filters/brands/${categoryId || 'all'}`),
  
  // Filter validation and compatibility
  validateFilters: (filterData) => API.post('/filters/validate', filterData),
  getCompatibleFilters: (selectedFilters) => API.post('/filters/compatible', selectedFilters),
  
  // Legacy compatibility
  getFilters: () => API.get('/filters'), // Backward compatibility
};

// Notification API endpoints
export const notificationAPI = {
  getAllNotifications: () => API.get('/notifications/notifications'),
  markAsRead: (notificationId) => API.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => API.put('/notifications/read-all'),
  deleteNotification: (notificationId) => API.delete(`/notifications/${notificationId}`),
};

// Push Notification API endpoints
export const pushNotificationAPI = {
  sendNotification: (notificationData) => API.post('/notifications/send-notification', notificationData),
  uploadNotificationImage: (formData) => API.post('/notifications/upload-notification-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getNotificationHistory: () => API.get('/notifications/notifications'),
  scheduleNotification: (notificationData) => API.post('/notifications/schedule-notification', notificationData),
  cancelScheduledNotification: (notificationId) => API.delete(`/notifications/schedule/${notificationId}`),
};

// Bulk Upload API endpoints (admin)
export const bulkUploadAPI = {
  uploadItems: (formData) => API.post('/bulk-upload/items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getUploadHistory: () => API.get('/bulk-upload/history'),
  downloadTemplate: () => API.get('/bulk-upload/template', { responseType: 'blob' }),
};

// Image Upload API endpoints
export const imageAPI = {
  uploadImage: (formData, config = {}) => API.post('/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config
  }),
  uploadSingleImage: (formData, config = {}) => API.post('/items/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config
  }),
  uploadSingleVideo: (formData, config = {}) => API.post('/items/upload-video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config
  }),
  deleteImage: (imageId) => API.delete(`/images/${imageId}`),
  getSignedUrl: (fileName) => API.post('/images/signed-url', { fileName }),
};

// Product API endpoints (for managing products saved from SingleProductUpload)
export const productAPI = {
  getAllProducts: (params = {}) => API.get('/items', { params }),
  getProductById: (productId) => API.get(`/items/${productId}`),
  createProduct: (productData) => API.post('/items', productData),
  updateProduct: (productId, productData) => API.patch(`/items/${productId}`, productData),
  deleteProduct: (productId) => API.delete(`/items/${productId}`),
  // Additional methods for lifecycle management
  publishProduct: (productId) => API.patch(`/items/publish/${productId}`),
  scheduleProduct: (productId, scheduleData) => API.patch(`/items/schedule/${productId}`, scheduleData),
  cancelSchedule: (productId) => API.patch(`/items/cancel-schedule/${productId}`),
};// Privacy Policy API endpoints
export const privacyAPI = {
  getPrivacyPolicy: () => API.get('/privacy-policy'),
  updatePrivacyPolicy: (policyData) => API.put('/privacy-policy', policyData),
};

// Partner Management API endpoints
export const partnerAPI = {
  // Admin endpoints for partner management
  createPartner: (partnerData) => API.post('/partners', partnerData),
  getAllPartners: (params = {}) => API.get('/partners', { params }),
  getPartnerById: (partnerId) => API.get(`/partners/${partnerId}`),
  updatePartner: (partnerId, updates) => API.put(`/partners/${partnerId}`, updates),
  updatePartnerPassword: (partnerId, passwordData) => API.put(`/partners/${partnerId}/password`, passwordData),
  togglePartnerStatus: (partnerId, statusData) => API.patch(`/partners/${partnerId}/toggle-status`, statusData),
  deletePartner: (partnerId) => API.delete(`/partners/${partnerId}`),
  getPartnerStatistics: () => API.get('/partners/statistics'),
  
  // Partner authentication endpoints
  partnerLogin: (credentials) => API.post('/partners/auth/login', credentials),
};

// Points System API endpoints
export const pointsAPI = {
  // System configuration
  getSystemConfig: () => API.get('/points/config'),
  updateSystemConfig: (configData) => API.put('/points/config', configData),
  
  // Users with points
  getAllUsersWithPoints: (params = {}) => API.get('/points/users', { params }),
  getUserPoints: (userId) => API.get(`/points/user/${userId}`),
  getUserPointsHistory: (userId, params = {}) => API.get(`/points/user/${userId}/history`, { params }),
  
  // Points operations
  allocatePoints: (userId, pointsData) => API.post(`/points/user/${userId}/allocate`, pointsData),
  redeemPoints: (userId, pointsData) => API.post(`/points/user/${userId}/redeem`, pointsData),
  updateUserPoints: (userId, pointsData) => API.put(`/points/user/${userId}`, pointsData),
  deleteUserPoints: (userId) => API.delete(`/points/user/${userId}`),
  
  // Summary and statistics
  getPointsSummary: () => API.get('/points/summary'),
};

// Invite Friend API endpoints
export const inviteFriendAPI = {
  // Admin endpoints
  getAllInviteCodes: (params = {}) => API.get('/invite-friend/admin/all', { params }),
  getInviteCodeById: (id) => API.get(`/invite-friend/admin/${id}`),
  createInviteCode: (inviteCodeData) => API.post('/invite-friend/admin/create', inviteCodeData),
  updateInviteCode: (id, inviteCodeData) => API.put(`/invite-friend/admin/${id}`, inviteCodeData),
  deleteInviteCode: (id) => API.delete(`/invite-friend/admin/${id}`),
  toggleStatus: (id) => API.patch(`/invite-friend/admin/${id}/toggle-status`),
  generateCode: (options = {}) => API.post('/invite-friend/admin/generate-code', options),
  getDetailedStats: () => API.get('/invite-friend/admin/detailed-stats'),
  bulkDelete: (data) => API.delete('/invite-friend/admin/bulk-delete', { data }),
  bulkUpdateStatus: (data) => API.patch('/invite-friend/admin/bulk-status', data),
  exportCodes: () => API.get('/invite-friend/admin/export'),
  getRedemptionAnalytics: (params = {}) => API.get('/invite-friend/admin/analytics/redemptions', { params }),
  getPerformanceAnalytics: () => API.get('/invite-friend/admin/analytics/performance'),
  
  // Public endpoints
  validateCode: (code) => API.get(`/invite-friend/validate/${code}`),
  getStats: () => API.get('/invite-friend/stats'),
  
  // User endpoints
  redeemCode: (codeData) => API.post('/invite-friend/redeem', codeData),
  getUserRedeemed: () => API.get('/invite-friend/my-redeemed')
};

// Inbox/Messaging API endpoints
export const inboxAPI = {
  // User endpoints
  getFolderCounts: () => API.get('/inbox/user/counts'),
  getMessages: (folder) => API.get(`/inbox/user/${folder}`),
  getMessage: (messageId) => API.get(`/inbox/user/message/${messageId}`),
  sendMessage: (messageData) => API.post('/inbox/user/send', messageData),
  replyToMessage: (messageId) => API.post(`/inbox/user/reply/${messageId}`),
  updateMessageStatus: (messageId) => API.patch(`/inbox/user/message/${messageId}`),
  bulkUpdateMessages: (data) => API.patch('/inbox/user/bulk-update', data),
  deleteMessage: (messageId) => API.delete(`/inbox/user/message/${messageId}`),
  getThreadMessages: (threadId) => API.get(`/inbox/user/thread/${threadId}`),
  
  // External endpoints
  createExternalMessage: (data) => API.post('/inbox/external/create', data),
  
  // Admin endpoints
  getAllMessages: (params) => API.get('/inbox/admin/all', { params }),
  getUserMessages: (userId, folder) => API.get(`/inbox/admin/user/${userId}/${folder}`),
  adminReply: (messageId, data) => API.post(`/inbox/admin/reply/${messageId}`, data),
  adminUpdateMessage: (messageId, data) => API.patch(`/inbox/admin/message/${messageId}`, data),
  adminDeleteMessage: (messageId) => API.delete(`/inbox/admin/message/${messageId}`),
  getAdminStats: () => API.get('/inbox/admin/stats'),
};

// Create endpoints object for easier access
export const endpoints = {
  inviteFriend: {
    // Admin endpoints
    getAllInviteCodes: '/invite-friend/admin/all',
    getInviteCodeById: (id) => `/invite-friend/admin/${id}`,
    createInviteCode: '/invite-friend/admin/create',
    updateInviteCode: (id) => `/invite-friend/admin/${id}`,
    deleteInviteCode: (id) => `/invite-friend/admin/${id}`,
    toggleStatus: (id) => `/invite-friend/admin/${id}/toggle-status`,
    generateCode: '/invite-friend/admin/generate-code',
    getDetailedStats: '/invite-friend/admin/detailed-stats',
    bulkDelete: '/invite-friend/admin/bulk-delete',
    bulkUpdateStatus: '/invite-friend/admin/bulk-status',
    exportCodes: '/invite-friend/admin/export',
    getRedemptionAnalytics: '/invite-friend/admin/analytics/redemptions',
    getPerformanceAnalytics: '/invite-friend/admin/analytics/performance',
    
    // Public endpoints
    validateCode: (code) => `/invite-friend/validate/${code}`,
    getStats: '/invite-friend/stats',
    
    // User endpoints
    redeemCode: '/invite-friend/redeem',
    getUserRedeemed: '/invite-friend/my-redeemed'
  }
};

// Google Analytics API endpoints
export const googleAnalyticsAPI = {
  // Real-time data
  getRealTimeData: (params = {}) => API.get('/analytics/realtime', { params }),
  
  // Audience data
  getAudienceData: (params = {}) => API.get('/analytics/audience', { params }),
  getUsersByDate: (params = {}) => API.get('/analytics/audience/users-by-date', { params }),
  getSessionData: (params = {}) => API.get('/analytics/audience/sessions', { params }),
  
  // Acquisition data (traffic sources)
  getAcquisitionData: (params = {}) => API.get('/analytics/acquisition', { params }),
  getTrafficSources: (params = {}) => API.get('/analytics/acquisition/sources', { params }),
  getCampaignData: (params = {}) => API.get('/analytics/acquisition/campaigns', { params }),
  
  // Behavior data
  getBehaviorData: (params = {}) => API.get('/analytics/behavior', { params }),
  getPageViews: (params = {}) => API.get('/analytics/behavior/pageviews', { params }),
  getTopPages: (params = {}) => API.get('/analytics/behavior/top-pages', { params }),
  getUserFlow: (params = {}) => API.get('/analytics/behavior/user-flow', { params }),
  
  // Conversion data (e-commerce)
  getConversionData: (params = {}) => API.get('/analytics/conversions', { params }),
  getEcommerceData: (params = {}) => API.get('/analytics/ecommerce', { params }),
  getGoalData: (params = {}) => API.get('/analytics/goals', { params }),
  getFunnelData: (params = {}) => API.get('/analytics/funnel', { params }),
  
  // Demographics
  getDemographics: (params = {}) => API.get('/analytics/demographics', { params }),
  getAgeGroups: (params = {}) => API.get('/analytics/demographics/age', { params }),
  getGenderBreakdown: (params = {}) => API.get('/analytics/demographics/gender', { params }),
  getInterests: (params = {}) => API.get('/analytics/demographics/interests', { params }),
  
  // Technology data
  getTechnologyData: (params = {}) => API.get('/analytics/technology', { params }),
  getBrowserData: (params = {}) => API.get('/analytics/technology/browsers', { params }),
  getDeviceData: (params = {}) => API.get('/analytics/technology/devices', { params }),
  getOperatingSystemData: (params = {}) => API.get('/analytics/technology/os', { params }),
  
  // Custom events
  getCustomEvents: (params = {}) => API.get('/analytics/events', { params }),
  getEventsByName: (eventName, params = {}) => API.get(`/analytics/events/${eventName}`, { params }),
  getTopEvents: (params = {}) => API.get('/analytics/events/top', { params }),
  
  // Geographic data
  getGeographicData: (params = {}) => API.get('/analytics/geography', { params }),
  getCountryData: (params = {}) => API.get('/analytics/geography/countries', { params }),
  getCityData: (params = {}) => API.get('/analytics/geography/cities', { params }),
  
  // Custom reports
  createCustomReport: (reportConfig) => API.post('/analytics/custom-reports', reportConfig),
  getCustomReport: (reportId, params = {}) => API.get(`/analytics/custom-reports/${reportId}`, { params }),
  
  // Configuration
  getConfiguration: () => API.get('/analytics/config'),
  updateConfiguration: (config) => API.put('/analytics/config', config),
  testConnection: () => API.get('/analytics/test-connection'),
};

// Settings API endpoints
export const settingsAPI = {
  // Get all user settings
  getAllSettings: () => API.get('/settings'),
  
  // Get specific setting category
  getSettingCategory: (category) => API.get(`/settings/category/${category}`),
  
  // Update specific setting category
  updateSettingCategory: (category, settingsData) => API.put(`/settings/category/${category}`, settingsData),
  
  // Update full settings
  updateSettings: (settingsData) => API.put('/settings', settingsData),
  
  // Toggle specific setting
  toggleSetting: (category, settingKey, value) => API.patch('/settings/toggle', { category, settingKey, value }),
  
  // Reset settings to default
  resetSettings: () => API.post('/settings/reset'),
  
  // Get settings history
  getSettingsHistory: () => API.get('/settings/history'),
  
  // Export settings
  exportSettings: () => API.get('/settings/export'),
  
  // Bulk update settings
  bulkUpdateSettings: (updates) => API.put('/settings/bulk', { updates }),
  
  // Communication preferences specific endpoints
  getCommunicationPreferences: () => API.get('/settings/category/communicationPreferences'),
  updateCommunicationPreferences: (preferences) => API.put('/settings/category/communicationPreferences', preferences),
  toggleCommunicationSetting: (settingKey, enabled) => API.patch('/settings/toggle', { 
    category: 'communicationPreferences', 
    settingKey, 
    value: enabled 
  }),

  // Webhook-specific endpoints
  getWebhookSettings: () => API.get('/settings/category/webhooks'),
  updateWebhookSettings: (webhookSettings) => API.put('/settings/category/webhooks', webhookSettings),
  
  // Individual webhook management
  getWebhooks: (params = {}) => API.get('/settings/webhooks', { params }),
  createWebhook: (webhookData) => API.post('/settings/webhooks/create', webhookData),
  getWebhookById: (webhookId) => API.get(`/settings/webhooks/${webhookId}`),
  updateWebhook: (webhookId, webhookData) => API.put(`/settings/webhooks/${webhookId}`, webhookData),
  deleteWebhook: (webhookId) => API.delete(`/settings/webhooks/${webhookId}`),
  toggleWebhook: (webhookId) => API.patch(`/settings/webhooks/${webhookId}/toggle`),
  testWebhook: (webhookId, testData = {}) => API.post(`/settings/webhooks/${webhookId}/test`, testData),
  getWebhookLogs: (webhookId, params = {}) => API.get(`/settings/webhooks/${webhookId}/logs`, { params }),
  getWebhookStats: (webhookId) => API.get(`/settings/webhooks/${webhookId}/stats`),

  // Shipping-specific endpoints
  getShippingCharges: (params = {}) => API.get('/settings/shipping/charges', { params }),
  createShippingCharge: (chargeData) => API.post('/settings/shipping/charges', chargeData),
  getShippingChargeById: (chargeId) => API.get(`/settings/shipping/charges/${chargeId}`),
  updateShippingCharge: (chargeId, chargeData) => API.put(`/settings/shipping/charges/${chargeId}`, chargeData),
  deleteShippingCharge: (chargeId) => API.delete(`/settings/shipping/charges/${chargeId}`),
  updateShippingSettings: (shippingSettings) => API.put('/settings/shipping/general', shippingSettings),
  getShippingChargeByLocation: (locationData) => API.post('/settings/shipping/charges/lookup', locationData),
};

// FAQ API endpoints
export const faqAPI = {
  // Get all FAQs with optional pagination and search
  getAllFaqs: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const queryString = queryParams.toString();
    return API.get(`/faqs${queryString ? `?${queryString}` : ''}`);
  },

  // Get FAQ by ID
  getFaqById: (id) => API.get(`/faqs/${id}`),

  // Create new FAQ
  createFaq: (faqData) => API.post('/faqs', faqData),

  // Update FAQ
  updateFaq: (id, faqData) => API.put(`/faqs/${id}`, faqData),

  // Delete FAQ
  deleteFaq: (id) => API.delete(`/faqs/${id}`),

  // Toggle FAQ active status
  toggleFaqStatus: (id, isActive) => API.patch(`/faqs/${id}/status`, { isActive }),

  // Get FAQ categories
  getCategories: () => API.get('/faqs/categories'),

  // Bulk operations
  bulkDeleteFaqs: (ids) => API.delete('/faqs/bulk', { data: { ids } }),
  bulkUpdateStatus: (ids, isActive) => API.patch('/faqs/bulk/status', { ids, isActive }),

  // FAQ statistics
  getStats: () => API.get('/faqs/stats'),

  // Search FAQs
  searchFaqs: (query) => API.get(`/faqs/search?q=${encodeURIComponent(query)}`),
};

export default API;
