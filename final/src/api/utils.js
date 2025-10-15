// API response handler utility
export const handleApiResponse = (response) => {
  console.log('📦 handleApiResponse - raw response:', response);
  console.log('📦 handleApiResponse - response.data:', response.data);
  
  if (response.data) {
    // Check if backend response has the expected format: { data: {...}, success: true, message: "...", statusCode: 200 }
    if (response.data.success && response.data.data) {
      // Backend's response format - extract the nested data
      const result = {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message || 'Success',
      };
      console.log('📦 handleApiResponse - backend format, returning:', result);
      return result;
    } else {
      // Fallback - treat response.data as the actual data
      const result = {
        success: true,
        data: response.data,
        message: response.data.message || 'Success',
      };
      console.log('📦 handleApiResponse - fallback format, returning:', result);
      return result;
    }
  }
  
  const failResult = {
    success: false,
    data: null,
    message: 'No data received',
  };
  console.log('📦 handleApiResponse - no data, returning:', failResult);
  return failResult;
};

// API error handler utility
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    // Check if backend error response has the expected format: { success: false, message: "...", statusCode: 4xx }
    const errorData = error.response.data;
    const errorMessage = errorData?.message || `Error: ${error.response.status}`;
    
    return {
      success: false,
      data: null,
      message: errorMessage,
      status: error.response.status,
    };
  } else if (error.request) {
    // Request made but no response received
    return {
      success: false,
      data: null,
      message: 'Network error - please check your connection',
      status: null,
    };
  } else {
    // Something else happened
    return {
      success: false,
      data: null,
      message: error.message || 'An unexpected error occurred',
      status: null,
    };
  }
};

// Generic API call wrapper
export const apiCall = async (apiFunction, ...args) => {
  try {
    console.log('🌐 apiCall starting with function:', apiFunction.name, 'args:', args);
    const response = await apiFunction(...args);
    console.log('🌐 apiCall response received:', response);
    const result = handleApiResponse(response);
    console.log('🌐 apiCall processed result:', result);
    return result;
  } catch (error) {
    console.error('🌐 apiCall error:', error);
    return handleApiError(error);
  }
};

// Helper to format form data for file uploads
export const createFormData = (data, fileField = null, fileData = null) => {
  const formData = new FormData();
  
  // Add regular fields
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  
  // Add file if provided
  if (fileField && fileData) {
    formData.append(fileField, fileData);
  }
  
  return formData;
};

// Helper to build query parameters
export const buildQueryParams = (params) => {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });
  
  return queryParams.toString();
};

// Token management utilities
export const tokenUtils = {
  getToken: () => localStorage.getItem('authToken'),
  setToken: (token) => localStorage.setItem('authToken', token),
  removeToken: () => localStorage.removeItem('authToken'),
  isTokenExpired: (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  },
};

// User data utilities
export const userUtils = {
  getUserData: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },
  setUserData: (userData) => localStorage.setItem('userData', JSON.stringify(userData)),
  removeUserData: () => localStorage.removeItem('userData'),
  clearAllUserData: () => {
    tokenUtils.removeToken();
    userUtils.removeUserData();
    localStorage.removeItem('cartData');
    localStorage.removeItem('wishlistData');
  },
};

// Request retry utility
export const retryRequest = async (apiFunction, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await apiFunction();
      return result;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

// Debounce utility for search/filtering
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// File upload utilities
import { imageAPI } from './endpoints';

export const uploadUtils = {
  // Upload a single image file
  uploadImage: async (file, onProgress = null) => {
    try {
      console.log('Starting image upload for file:', file.name);
      const formData = new FormData();
      formData.append('image', file);
      
      // Create a config object for tracking upload progress
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Image upload progress: ${percentCompleted}%`);
          onProgress(percentCompleted);
        };
      }
      
      console.log('Making image upload API call...');
      const response = await imageAPI.uploadSingleImage(formData, config);
      console.log('Image upload API response:', response);
      
      // Extract the URL from the response - backend returns { data: { imageUrl: "..." } }
      const imageUrl = response?.data?.data?.imageUrl || response?.data?.imageUrl || response?.imageUrl;
      
      if (imageUrl) {
        return { data: { imageUrl } }; // Return in expected format matching backend structure
      } else {
        console.error('No URL found in response:', response);
        throw new Error('Upload completed but no URL returned from server');
      }
    } catch (error) {
      console.error('Image upload failed in uploadUtils:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Upload a single video file
  uploadVideo: async (file, onProgress = null) => {
    try {
      console.log('Starting video upload for file:', file.name);
      const formData = new FormData();
      formData.append('video', file);
      
      // Create a config object for tracking upload progress
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Video upload progress: ${percentCompleted}%`);
          onProgress(percentCompleted);
        };
      }
      
      console.log('Making video upload API call...');
      const response = await imageAPI.uploadSingleVideo(formData, config);
      console.log('Video upload API response:', response);
      
      // Extract the URL from the response - backend returns { data: { videoUrl: "..." } }
      const videoUrl = response?.data?.data?.videoUrl || response?.data?.videoUrl || response?.videoUrl;
      
      if (videoUrl) {
        return { data: { videoUrl } }; // Return in expected format matching backend structure
      } else {
        console.error('No URL found in response:', response);
        throw new Error('Upload completed but no URL returned from server');
      }
    } catch (error) {
      console.error('Video upload failed in uploadUtils:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Upload multiple files with progress tracking
  uploadMultipleFiles: async (files, type = 'image', onProgress = null) => {
    const uploadPromises = files.map(async (file, index) => {
      const fileProgressCallback = onProgress ? (progress) => {
        onProgress(index, progress);
      } : null;
      
      if (type === 'image') {
        return await uploadUtils.uploadImage(file, fileProgressCallback);
      } else if (type === 'video') {
        return await uploadUtils.uploadVideo(file, fileProgressCallback);
      }
    });
    
    return await Promise.all(uploadPromises);
  }
};
