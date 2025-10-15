// API service for cart abandonment recovery
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/cart-abandonment`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
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

export const cartAbandonmentAPI = {
  // Get all abandoned carts with filters
  getAbandonedCarts: (params = {}) => {
    return apiClient.get('/abandoned-carts', { params });
  },

  // Get statistics
  getStatistics: (filters = {}) => {
    return apiClient.get('/statistics', { params: filters });
  },

  // Sync Firebase users
  syncFirebaseUsers: () => {
    return apiClient.post('/sync-firebase-users');
  },

  // Export data
  exportData: (format, filters) => {
    return apiClient.get('/export', {
      params: { format, ...filters },
      responseType: 'blob'
    });
  },

  // Send email to specific user
  sendEmailToUser: (userId, emailData) => {
    return apiClient.post(`/send-email/${userId}`, emailData);
  },

  // Send bulk emails
  sendBulkEmails: (emailData) => {
    return apiClient.post('/send-bulk-emails', emailData);
  },

  // Get user profile
  getUserProfile: (userId) => {
    return apiClient.get(`/user-profile/${userId}`);
  },

  // Delete user
  deleteUser: (userId) => {
    return apiClient.delete(`/delete-user/${userId}`);
  },

  // Get filter options
  getFilterOptions: () => {
    return apiClient.get('/filter-options');
  }
};

export default cartAbandonmentAPI;
