import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Cart Abandonment API Service
 */
export const cartAbandonmentAPI = {
  // Get abandoned carts with filters
  getAbandonedCarts: (params = {}) => {
    return apiClient.get('/cart-abandonment/abandoned-carts', { params });
  },

  // Get statistics
  getStatistics: (filters = {}) => {
    return apiClient.get('/cart-abandonment/statistics', { params: filters });
  },

  // Sync Firebase users
  syncFirebaseUsers: () => {
    return apiClient.post('/cart-abandonment/sync-firebase-users');
  },

  // Export data
  exportData: (format, filters = {}) => {
    return apiClient.get('/cart-abandonment/export', {
      params: { format, ...filters },
      responseType: 'blob'
    });
  },

  // Send email to specific user
  sendEmailToUser: (userId, emailData) => {
    return apiClient.post(`/cart-abandonment/send-email/${userId}`, emailData);
  },

  // Send bulk emails
  sendBulkEmails: (emailData) => {
    return apiClient.post('/cart-abandonment/send-bulk-emails', emailData);
  },

  // Get user profile
  getUserProfile: (userId) => {
    return apiClient.get(`/cart-abandonment/user-profile/${userId}`);
  },

  // Delete user
  deleteUser: (userId) => {
    return apiClient.delete(`/cart-abandonment/delete-user/${userId}`);
  },

  // Get filter options
  getFilterOptions: () => {
    return apiClient.get('/cart-abandonment/filter-options');
  },
};

export default cartAbandonmentAPI;
