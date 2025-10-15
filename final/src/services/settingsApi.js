import axios from 'axios';

// Create axios instance for settings API
const settingsApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/settings',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
settingsApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
settingsApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const settingsApiService = {
  // Get all user settings
  getAllSettings: () => settingsApi.get('/'),
  
  // Update all user settings
  updateAllSettings: (settings) => settingsApi.put('/', settings),
  
  // Get specific setting category
  getSettingCategory: (category) => settingsApi.get(`/category/${category}`),
  
  // Update specific setting category
  updateSettingCategory: (category, settings) => 
    settingsApi.put(`/category/${category}`, settings),
  
  // Toggle specific setting
  toggleSetting: (category, setting) => 
    settingsApi.patch(`/toggle/${category}/${setting}`),
  
  // Reset settings
  resetSettings: (category = null) => 
    settingsApi.post('/reset', category ? { category } : {}),
  
  // Get settings history
  getSettingsHistory: () => settingsApi.get('/history'),
  
  // Export settings
  exportSettings: () => settingsApi.get('/export'),
  
  // Bulk update settings
  bulkUpdateSettings: (updates) => settingsApi.put('/bulk', { updates }),
};

export default settingsApi;
