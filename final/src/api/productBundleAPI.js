// API Configuration for Product Bundling
import axios from 'axios';

// Create an axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', error.response.data);
      
      // Handle specific error cases
      if (error.response.status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Product Bundle API endpoints
export const productBundleAPI = {
  // Get all bundles with filtering and pagination
  getAllBundles: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    return apiClient.get(`/items/bundles?${queryParams}`);
  },

  // Create a new bundle
  createBundle: (bundleData) => {
    return apiClient.post('/items/bundles', bundleData);
  },

  // Get bundle by ID
  getBundleById: (bundleId) => {
    return apiClient.get(`/items/bundles/${bundleId}`);
  },

  // Update bundle
  updateBundle: (bundleId, bundleData) => {
    return apiClient.put(`/items/bundles/${bundleId}`, bundleData);
  },

  // Delete bundle
  deleteBundle: (bundleId) => {
    return apiClient.delete(`/items/bundles/${bundleId}`);
  },

  // Toggle bundle status
  toggleBundleStatus: (bundleId, updatedBy) => {
    return apiClient.patch(`/items/bundles/${bundleId}/toggle-status`, { updatedBy });
  },

  // Update bundle items order
  updateBundleOrder: (bundleId, bundleItems, updatedBy) => {
    return apiClient.put(`/items/bundles/${bundleId}/reorder`, { bundleItems, updatedBy });
  },

  // Get items for bundling
  getItemsForBundling: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    return apiClient.get(`/items/bundles/items?${queryParams}`);
  },

  // Get categories for bundling
  getCategoriesForBundling: () => {
    return apiClient.get('/items/bundles/categories');
  },

  // Get bundles for a specific product (public route)
  getBundlesForProduct: (itemId) => {
    return apiClient.get(`/items/${itemId}/bundles`);
  },
};

export default apiClient;
