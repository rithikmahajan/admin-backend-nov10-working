# Push Notification System - Frontend Implementation Guide

## Overview
This document provides a complete guide for implementing the dynamic push notification system in the Yoraa Admin Panel. The system uses Firebase Cloud Messaging (FCM) to send push notifications to Android and iOS users through a RESTful API.

## 🚀 Features Implemented

### ✅ Core Functionality
- **Dynamic API Integration**: Real-time communication with backend APIs
- **Image Upload**: Support for notification images with AWS S3 integration
- **Platform Targeting**: Send notifications to Android, iOS, or both platforms
- **Deep Link Support**: App navigation through custom URL schemes
- **Form Validation**: Client-side and server-side validation
- **Real-time Preview**: Live preview of notification appearance
- **Notification History**: View previously sent notifications
- **Error Handling**: Comprehensive error messages and user feedback
- **Loading States**: Visual feedback during API operations

### ✅ Redux Integration
- **State Management**: Centralized state for notifications using Redux Toolkit
- **Async Operations**: Thunks for handling API calls
- **Form State**: Persistent form data with validation
- **Success/Error States**: User feedback management

## 📁 File Structure

```
src/
├── api/
│   ├── axiosConfig.js          # HTTP client configuration
│   ├── notificationAPI.js      # Notification API endpoints
│   └── endpoints.js            # API endpoint definitions
├── services/
│   └── notificationService.js  # Business logic and validation
├── store/
│   └── slices/
│       └── notificationSlice.js # Redux slice for notifications
├── pages/
│   └── pushNotification.jsx    # Main notification component
└── config/
    └── environment.js          # Environment configuration
```

## 🔧 Installation & Setup

### 1. Dependencies Required
Ensure these packages are installed in your `package.json`:

```json
{
  "dependencies": {
    "@reduxjs/toolkit": "^1.9.5",
    "react-redux": "^8.1.1",
    "axios": "^1.4.0",
    "lucide-react": "^0.263.1"
  }
}
```

### 2. Environment Variables
Add these environment variables to your `.env` file:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8001/api
# or for production:
# VITE_API_BASE_URL=https://yoraa.in.net/api

# Admin Token for Authentication (if required)
VITE_ADMIN_TOKEN=admin-token-2024

# Firebase Configuration (if needed for client-side)
VITE_FIREBASE_PROJECT_ID=yoraa-android-ios
VITE_FIREBASE_API_KEY=your-firebase-api-key
```

### 3. Redux Store Configuration
Ensure the notification slice is added to your Redux store in `store/store.js`:

```javascript
import notificationSlice from './slices/notificationSlice';

const rootReducer = combineReducers({
  // ... other slices
  notifications: notificationSlice,
});
```

## 🔌 API Endpoints

### Backend API Routes
The following endpoints are available for the notification system:

```
POST /api/notifications/upload-notification-image
POST /api/notifications/send-notification
GET  /api/notifications/notifications
GET  /api/notifications/stats
```

### Request/Response Examples

#### 1. Upload Notification Image
```javascript
// Request
POST /api/notifications/upload-notification-image
Content-Type: multipart/form-data
Authorization: Bearer <your-token>

FormData: {
  image: <file>
}

// Response
{
  "success": true,
  "imageUrl": "https://s3.amazonaws.com/bucket/notifications/unique-id.jpg"
}
```

#### 2. Send Push Notification
```javascript
// Request
POST /api/notifications/send-notification
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "title": "Flash Sale Alert!",
  "body": "Get 50% off on all electronics. Limited time offer!",
  "imageUrl": "https://s3.amazonaws.com/bucket/notifications/image.jpg",
  "deepLink": "app://products/electronics",
  "targetPlatform": "both" // "android", "ios", or "both"
}

// Response
{
  "success": true,
  "message": "Notification sent!",
  "response": {
    "successCount": 150,
    "failureCount": 5
  }
}
```

#### 3. Get All Notifications
```javascript
// Request
GET /api/notifications/notifications
Authorization: Bearer <your-token>

// Response
{
  "success": true,
  "notifications": [
    {
      "_id": "notification-id",
      "title": "Flash Sale Alert!",
      "body": "Get 50% off on all electronics",
      "imageUrl": "https://...",
      "deepLink": "app://products/electronics",
      "platform": "both",
      "sentAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### 4. Get Notification Statistics
```javascript
// Request
GET /api/notifications/stats
Authorization: Bearer <your-token>

// Response
{
  "success": true,
  "stats": {
    "totalSent": 45,
    "successfulDeliveries": 42,
    "failedDeliveries": 3,
    "recentNotifications": 12,
    "todayNotifications": 3,
    "platformBreakdown": {
      "android": 20,
      "ios": 15,
      "both": 10
    }
  }
}
```

## 🎯 Component Usage

### Basic Implementation
```jsx
import { useDispatch, useSelector } from 'react-redux';
import {
  sendPushNotification,
  updateCurrentNotification,
  selectCurrentNotification,
  selectLoading,
  selectErrors
} from '../store/slices/notificationSlice';

function NotificationForm() {
  const dispatch = useDispatch();
  const currentNotification = useSelector(selectCurrentNotification);
  const loading = useSelector(selectLoading);
  const errors = useSelector(selectErrors);

  const handleSendNotification = async () => {
    const notificationData = {
      title: currentNotification.title,
      body: currentNotification.body,
      imageUrl: currentNotification.imageUrl,
      deepLink: currentNotification.deepLink,
      targetPlatform: 'both'
    };

    try {
      await dispatch(sendPushNotification(notificationData)).unwrap();
      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Failed to send:', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={currentNotification.title}
        onChange={(e) => dispatch(updateCurrentNotification({ title: e.target.value }))}
        placeholder="Notification title"
      />
      
      <textarea
        value={currentNotification.body}
        onChange={(e) => dispatch(updateCurrentNotification({ body: e.target.value }))}
        placeholder="Notification message"
      />
      
      <button 
        onClick={handleSendNotification}
        disabled={loading.sending}
      >
        {loading.sending ? 'Sending...' : 'Send Notification'}
      </button>
      
      {errors.sending && (
        <div className="error">{errors.sending}</div>
      )}
    </div>
  );
}
```

## 🔐 Authentication & Security

### Token Management
The system uses JWT tokens for authentication. Tokens are automatically included in API requests through the axios interceptor:

```javascript
// In axiosConfig.js
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken');
  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Error Handling
Comprehensive error handling is implemented at multiple levels:

1. **Service Level**: Input validation and API error handling
2. **Redux Level**: State management for errors
3. **Component Level**: User-friendly error display

## 📊 State Management

### Redux State Structure
```javascript
{
  notifications: {
    currentNotification: {
      title: '',
      body: '',
      imageUrl: '',
      deepLink: '',
      platforms: []
    },
    notifications: [],
    loading: {
      sending: false,
      uploading: false,
      fetching: false
    },
    errors: {
      sending: null,
      uploading: null,
      fetching: null
    },
    successMessages: {
      sent: null,
      uploaded: null
    }
  }
}
```

### Available Actions
```javascript
// Async actions (thunks)
dispatch(uploadNotificationImage(file))
dispatch(sendPushNotification(data))
dispatch(fetchAllNotifications())
dispatch(fetchNotificationStats())

// Synchronous actions
dispatch(updateCurrentNotification({ field: 'value' }))
dispatch(resetCurrentNotification())
dispatch(updatePlatforms('android'))
dispatch(clearErrors())
dispatch(clearSuccessMessages())
```

## 🎨 UI Components

### Form Validation
Client-side validation includes:
- Required fields (title, body)
- Character limits (title: 100, body: 500)
- URL format validation for deep links
- File type and size validation for images

### Loading States
Visual feedback for all async operations:
- Spinner animations during API calls
- Disabled buttons during operations
- Progress indicators for uploads

### Error Display
User-friendly error messages:
- Validation errors in red alert boxes
- API errors with specific messages
- Success confirmations in green

## 🔧 Customization Options

### Validation Rules
Modify validation in `notificationService.js`:

```javascript
validateNotificationData(data) {
  const errors = [];
  
  // Custom validation rules
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (data.title && data.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }
  
  // Add more validation rules as needed
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### Platform Configuration
Customize platform options in the component:

```javascript
const platforms = ['android', 'ios', 'web']; // Add web support

// Or make it dynamic from API
const [availablePlatforms, setAvailablePlatforms] = useState([]);
```

### Image Upload Settings
Configure upload limits in the service:

```javascript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Authentication Errors
**Problem**: 401 Unauthorized responses
**Solution**: Check token presence and validity
```javascript
// Debug token
console.log('Auth token:', localStorage.getItem('authToken'));
```

#### 2. CORS Issues
**Problem**: Cross-origin request blocked
**Solution**: Ensure backend CORS is properly configured
```javascript
// Backend should have:
app.use(cors({
  origin: ['http://localhost:3000', 'https://admin.yoraa.com'],
  credentials: true
}));
```

#### 3. Image Upload Failures
**Problem**: Image upload returns 400/500 errors
**Solution**: Check file size, type, and backend S3 configuration
```javascript
// Validate before upload
if (file.size > MAX_FILE_SIZE) {
  alert('File too large');
  return;
}
```

#### 4. Redux State Not Updating
**Problem**: Component not re-rendering on state changes
**Solution**: Ensure proper useSelector usage
```javascript
// Correct selector usage
const loading = useSelector(state => state.notifications.loading);
```

### Debugging Tips

#### Enable Redux DevTools
```javascript
// In store configuration
devTools: import.meta.env.MODE !== 'production'
```

#### API Request Logging
```javascript
// In axiosConfig.js
API.interceptors.request.use((config) => {
  console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});
```

#### State Logging
```javascript
// In component
useEffect(() => {
  console.log('Notification state:', currentNotification);
}, [currentNotification]);
```

## 📈 Performance Optimization

### Image Optimization
- Implement image compression before upload
- Use WebP format when supported
- Lazy load notification history

### API Optimization
- Implement request debouncing for real-time validation
- Cache notification history
- Paginate large notification lists

### Bundle Optimization
- Code splitting for notification module
- Tree shaking for unused imports
- Minimize Redux bundle size

## 🚀 Deployment

### Environment Configuration
```javascript
// Production environment
const config = {
  apiUrl: 'https://api.yoraa.com/api',
  maxFileSize: 5 * 1024 * 1024,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  timeout: 30000
};
```

### Build Configuration
```javascript
// vite.config.js
export default {
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  build: {
    sourcemap: false,
    minify: 'terser'
  }
};
```

## 📞 Support & Contact

For technical support or questions about implementation:

1. **Backend API Issues**: Check server logs and API documentation
2. **Frontend Issues**: Use browser DevTools and Redux DevTools
3. **Firebase Issues**: Verify FCM configuration and permissions
4. **AWS S3 Issues**: Check bucket permissions and CORS settings

## 🔄 Updates & Changelog

### Version 1.0.0 (Current)
- ✅ Full API integration
- ✅ Redux state management
- ✅ Image upload support
- ✅ Platform targeting
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states
- ✅ Notification history

### Planned Features
- 📅 Scheduled notifications
- 📊 Advanced analytics
- 🎯 User segmentation
- 📱 Rich notification templates
- 🔔 Push notification testing tools

---

## 🎉 Implementation Complete!

The push notification system is now fully functional and ready for production use. All API integrations are dynamic, and the frontend provides a complete user experience for managing push notifications.

**Key Benefits:**
- 🚀 Real-time API communication
- 🎯 Professional UI/UX
- 🔒 Secure authentication
- 📊 Comprehensive error handling
- ⚡ Optimized performance
- 🔧 Easy maintenance and updates

Happy coding! 🚀
