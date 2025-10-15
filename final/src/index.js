/**
 * Consolidated Index File
 * 
 * This file consolidates all exports from various index.js files across the application
 * to provide a single entry point for importing components, constants, API functions, and store.
 */

// ========================================
// COMPONENTS EXPORTS
// ========================================
export { default as DeleteConfirmationModal } from './components/DeleteConfirmationModal';
export { default as TwoFactorAuth } from './components/TwoFactorAuth';
export { default as MontserratFontDemo } from './components/MontserratFontDemo';
export { default as SaveArrangementModal } from './components/SaveArrangementModal';
export { default as SaveSuccessModal } from './components/SaveSuccessModal';

// ========================================
// CONSTANTS EXPORTS
// ========================================

// Design System Variables
export * from './constants/designVariables';
export * from './constants/styleUtils';

// Product Management Constants
export const CATEGORY_OPTIONS = [
  'All categories',
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports',
  'Books',
  'Toys'
];

export const SUBCATEGORY_OPTIONS = [
  'All subcategories',
  'Smartphones',
  'Laptops',
  'Cameras',
  'Accessories'
];

export const PRODUCT_STATUSES = {
  LIVE: 'live',
  SCHEDULED: 'Scheduled',
  DRAFT: 'draft'
};

export const STATUS_STYLES = {
  [PRODUCT_STATUSES.LIVE]: 'bg-green-100 text-green-800',
  [PRODUCT_STATUSES.SCHEDULED]: 'bg-yellow-100 text-yellow-800',
  [PRODUCT_STATUSES.DRAFT]: 'bg-gray-100 text-gray-800'
};

// UI Constants
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Form Validation Constants
export const VALIDATION_RULES = {
  PRODUCT_NAME: {
    minLength: 3,
    maxLength: 100,
    required: true
  },
  PRICE: {
    min: 0,
    required: true,
    pattern: /^\d+(\.\d{1,2})?$/
  },
  SKU: {
    minLength: 3,
    maxLength: 50,
    required: true,
    pattern: /^[A-Za-z0-9-_]+$/
  }
};

// File Upload Constants
export const FILE_UPLOAD = {
  IMAGES: {
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 10
  },
  SIZE_CHARTS: {
    maxSize: 2 * 1024 * 1024, // 2MB
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf']
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  PRODUCTS: '/api/items',
  CATEGORIES: '/api/categories',
  UPLOADS: '/api/uploads',
  USERS: '/api/users'
};

// Performance Constants
export const PERFORMANCE = {
  DEBOUNCE_DELAY: 300, // milliseconds
  PAGINATION_SIZE: 20,
  LAZY_LOAD_THRESHOLD: 0.1 // 10% of viewport
};

// Default Values
export const DEFAULT_VARIANT = {
  name: '',
  sameAsFirst: false,
  productName: '',
  title: '',
  description: '',
  manufacturingDetails: '',
  shippingReturns: '',
  regularPrice: '',
  salePrice: '',
  metaTitle: '',
  metaDescription: '',
  slugUrl: '',
  images: [],
  stockSizes: [],
  sizes: [],
  stockSizeOption: 'sizes',
  customSizes: [],
  alsoShowIn: {
    youMightAlsoLike: false,
    similarItems: false,
    otherAlsoBought: false
  },
  filters: {
    color: '',
    size: '',
    material: '',
    gender: '',
    season: ''
  }
};

export const DEFAULT_PRODUCT_DATA = {
  productName: '',
  title: '',
  description: '',
  manufacturingDetails: '',
  shippingReturns: '',
  regularPrice: '',
  salePrice: '',
  returnable: 'yes',
  metaTitle: '',
  metaDescription: '',
  slugUrl: ''
};

// Utility Functions
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(price);
};

export const generateSKU = (productName) => {
  const timestamp = Date.now().toString().slice(-6);
  const nameSlug = productName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8);
  return `${nameSlug}${timestamp}`;
};

export const validateImageFile = (file) => {
  const { maxSize, acceptedTypes } = FILE_UPLOAD.IMAGES;
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }
  
  if (!acceptedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' };
  }
  
  return { valid: true };
};

export const getTailwindClasses = (componentName, variant = 'default') => {
  const classMap = {
    button: {
      default: 'px-4 py-2 rounded-md font-medium transition-colors',
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    },
    input: {
      default: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500',
      error: 'border-red-500 focus:ring-red-500'
    }
  };
  
  return classMap[componentName]?.[variant] || '';
};

// ========================================
// API EXPORTS
// ========================================
export { default as API } from './api/axiosConfig';
export * from './api/endpoints';
export * from './api/utils';

// Main API object for easy importing
export const api = {
  // Import all endpoint functions
  auth: require('./api/endpoints').authAPI,
  user: require('./api/endpoints').userAPI,
  item: require('./api/endpoints').itemAPI,
  category: require('./api/endpoints').categoryAPI,
  subCategory: require('./api/endpoints').subCategoryAPI,
  cart: require('./api/endpoints').cartAPI,
  wishlist: require('./api/endpoints').wishlistAPI,
  saveForLater: require('./api/endpoints').saveForLaterAPI,
  order: require('./api/endpoints').orderAPI,
  address: require('./api/endpoints').addressAPI,
  payment: require('./api/endpoints').paymentAPI,
  review: require('./api/endpoints').reviewAPI,
  promoCode: require('./api/endpoints').promoCodeAPI,
  filter: require('./api/endpoints').filterAPI,
  notification: require('./api/endpoints').notificationAPI,
  pushNotification: require('./api/endpoints').pushNotificationAPI,
  bulkUpload: require('./api/endpoints').bulkUploadAPI,
  image: require('./api/endpoints').imageAPI,
  privacy: require('./api/endpoints').privacyAPI,
};

// ========================================
// STORE EXPORTS
// ========================================
export { default as store } from './store/store';
export { persistor } from './store/store';
export { getRootState, getAppDispatch } from './store/store';

// Redux slices (for direct access if needed)
export { default as authSlice } from './store/slices/authSlice';
export { default as cartSlice } from './store/slices/cartSlice';
export { default as wishlistSlice } from './store/slices/wishlistSlice';
export { default as saveForLaterSlice } from './store/slices/saveForLaterSlice';
export { default as categoriesSlice } from './store/slices/categoriesSlice';
export { default as subCategoriesSlice } from './store/slices/subCategoriesSlice';
export { default as ordersSlice } from './store/slices/ordersSlice';
export { default as userSlice } from './store/slices/userSlice';
export { default as uiSlice } from './store/slices/uiSlice';
export { default as checkoutSlice } from './store/slices/checkoutSlice';
export { default as searchSlice } from './store/slices/searchSlice';
export { default as filtersSlice } from './store/slices/filtersSlice';
export { default as pushNotificationSlice } from './store/slices/pushNotificationSlice';

// ========================================
// COMBINED EXPORTS BY CATEGORY
// ========================================

// All Components
export const Components = {
  DeleteConfirmationModal: require('./components/DeleteConfirmationModal').default,
  TwoFactorAuth: require('./components/TwoFactorAuth').default,
  MontserratFontDemo: require('./components/MontserratFontDemo').default,
  SaveArrangementModal: require('./components/SaveArrangementModal').default,
  SaveSuccessModal: require('./components/SaveSuccessModal').default,
};

// All Constants
export const Constants = {
  CATEGORY_OPTIONS,
  SUBCATEGORY_OPTIONS,
  PRODUCT_STATUSES,
  STATUS_STYLES,
  LOADING_STATES,
  VALIDATION_RULES,
  FILE_UPLOAD,
  API_ENDPOINTS,
  PERFORMANCE,
  DEFAULT_VARIANT,
  DEFAULT_PRODUCT_DATA,
};

// All Utilities
export const Utils = {
  formatPrice,
  generateSKU,
  validateImageFile,
  getTailwindClasses,
};

// ========================================
// DEFAULT EXPORT (Optional - most commonly used items)
// ========================================
export default {
  // Most commonly used components
  DeleteConfirmationModal: require('./components/DeleteConfirmationModal').default,
  TwoFactorAuth: require('./components/TwoFactorAuth').default,
  
  // Most commonly used constants
  PRODUCT_STATUSES,
  LOADING_STATES,
  
  // API and Store
  api,
  store: require('./store/store').default,
  
  // Custom Hooks
  usePushNotifications: require('./hooks/usePushNotifications').default,
  
  // Utilities
  formatPrice,
  validateImageFile,
};
