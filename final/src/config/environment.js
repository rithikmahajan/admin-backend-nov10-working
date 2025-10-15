// Environment Configuration with Multiple API Options
const environments = {
  development: {
    apiUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api',
    baseUrl: import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8001',
    debug: true,
    appName: import.meta.env.VITE_APP_NAME || 'Yoraa Admin Panel (Dev)',
    firebase: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'your-dev-firebase-api-key',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'your-dev-project.firebaseapp.com',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'your-dev-project-id',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'your-dev-project.appspot.com',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'your-dev-sender-id',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || 'your-dev-app-id'
    }
  },
  production: {
    apiUrl: import.meta.env.VITE_API_BASE_URL || 'https://yoraa.in.net/api',
    baseUrl: import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://yoraa.in.net',
    debug: import.meta.env.VITE_DEBUG === 'true' || false,
    appName: import.meta.env.VITE_APP_NAME || 'Yoraa Admin Panel',
    firebase: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCIYkTNzIrk_RugNOybriphlQ8aVTJ-KD8',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'yoraa-android-ios.firebaseapp.com',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'yoraa-android-ios',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'yoraa-android-ios.firebasestorage.app',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '133733122921',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:133733122921:web:2d177abff9fb94ef35b3f8'
    }
  },
  staging: {
    apiUrl: import.meta.env.VITE_API_BASE_URL || 'https://staging-api.yoraa.com/api',
    baseUrl: import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://staging-api.yoraa.com',
    debug: import.meta.env.VITE_DEBUG === 'true' || true,
    appName: import.meta.env.VITE_APP_NAME || 'Yoraa Admin Panel (Staging)',
    firebase: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCIYkTNzIrk_RugNOybriphlQ8aVTJ-KD8',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'yoraa-android-ios.firebaseapp.com',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'yoraa-android-ios',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'yoraa-android-ios.firebasestorage.app',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '133733122921',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:133733122921:web:2d177abff9fb94ef35b3f8'
    }
  }
};

// Predefined API endpoints for easy switching
export const API_ENDPOINTS = {
  LOCAL: 'http://localhost:8001/api',
  PRODUCTION: 'https://yoraa.in.net/api',
  OLD_SERVER: 'http://185.193.19.244:8000/api',
  STAGING: 'https://staging-api.yoraa.com/api'
};

// Get current environment
const environment = import.meta.env?.MODE || import.meta.env?.VITE_NODE_ENV || 'development';
console.log('🔧 Environment detected:', environment);

// Select appropriate config
const selectedConfig = environments[environment] || environments.development;

// Override API URL if VITE_API_OVERRIDE is set
if (import.meta.env.VITE_API_OVERRIDE) {
  const override = import.meta.env.VITE_API_OVERRIDE.toUpperCase();
  if (API_ENDPOINTS[override]) {
    selectedConfig.apiUrl = API_ENDPOINTS[override];
    selectedConfig.baseUrl = API_ENDPOINTS[override].replace('/api', '');
    console.log('🔄 API Override applied:', override, '→', selectedConfig.apiUrl);
  }
}

console.log('🔧 Final API URL:', selectedConfig.apiUrl);

export default {
  ...selectedConfig,
  environment,
  isDevelopment: environment === 'development',
  isProduction: environment === 'production',
  isStaging: environment === 'staging'
};
