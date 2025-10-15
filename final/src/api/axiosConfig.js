import axios from 'axios';
import environmentConfig from '../config/environment';

// Use environment configuration for API URL
const baseURL = import.meta.env.VITE_API_BASE_URL || environmentConfig.apiUrl;

console.log('🔧 Environment:', environmentConfig.environment);
console.log('🔧 API Base URL:', baseURL);

const API = axios.create({
  baseURL: baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // Try multiple token locations for compatibility
    const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken');
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If sending FormData, remove Content-Type header to let axios set it automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    console.error('🚨 API Request Error:', error);
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config?.method?.toUpperCase()} ${response.config?.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Response Error: ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.error('Error details:', error.response?.data);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn('🔒 Authentication failed - token may be expired');
      // Clear invalid token
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default API;
