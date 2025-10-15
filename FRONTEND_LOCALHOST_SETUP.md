# 🚀 Frontend Team - Backend Localhost Connection Guide

## Quick Start

This guide will help you connect your frontend application to the Yoraa backend running on your local machine.

---

## 📋 Prerequisites

Before you start, make sure you have:
- ✅ Node.js (v14 or higher) installed
- ✅ npm or yarn package manager
- ✅ Git (to clone the repository)
- ✅ MongoDB connection (provided by backend team)

---

## 🔧 Backend Setup

### 1. Clone the Repository (If you haven't already)

```bash
git clone <repository-url>
cd oct-7-backend-admin-main
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Backend Server

```bash
npm run dev
```

Or alternatively:

```bash
npm start
```

### 4. Verify Server is Running

You should see:
```
🚀 Yoraa Backend Server LIVE on http://0.0.0.0:8081
```

---

## 🌐 Backend API Base URL

### Local Development

```
http://localhost:8081
```

or

```
http://127.0.0.1:8081
```

---

## 📡 Available API Endpoints

### Authentication Endpoints
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - User login
POST   /api/auth/verify-otp        - Verify OTP
POST   /api/auth/resend-otp        - Resend OTP
POST   /api/auth/forgot-password   - Forgot password
POST   /api/auth/reset-password    - Reset password
POST   /api/auth/logout            - User logout
```

### User Profile Endpoints
```
GET    /api/user/profile           - Get user profile
PUT    /api/user/profile           - Update user profile
GET    /api/users                  - Get all users (Admin)
```

### Product Endpoints
```
GET    /api/items                  - Get all items/products
GET    /api/items/:id              - Get single item by ID
POST   /api/items                  - Create new item (Admin)
PUT    /api/items/:id              - Update item (Admin)
DELETE /api/items/:id              - Delete item (Admin)
```

### Category Endpoints
```
GET    /api/categories             - Get all categories
GET    /api/categories/:id         - Get category by ID
POST   /api/categories             - Create category (Admin)
PUT    /api/categories/:id         - Update category (Admin)
DELETE /api/categories/:id         - Delete category (Admin)
```

### SubCategory Endpoints
```
GET    /api/subcategories          - Get all subcategories
GET    /api/subcategories/:id      - Get subcategory by ID
POST   /api/subcategories          - Create subcategory (Admin)
PUT    /api/subcategories/:id      - Update subcategory (Admin)
DELETE /api/subcategories/:id      - Delete subcategory (Admin)
```

### Cart Endpoints
```
GET    /api/cart                   - Get user cart
POST   /api/cart/add               - Add item to cart
PUT    /api/cart/update            - Update cart item
DELETE /api/cart/remove/:id        - Remove item from cart
DELETE /api/cart/clear              - Clear entire cart
```

### Wishlist Endpoints
```
GET    /api/wishlist               - Get user wishlist
POST   /api/wishlist/add           - Add item to wishlist
DELETE /api/wishlist/remove/:id    - Remove item from wishlist
```

### Order Endpoints
```
GET    /api/orders                 - Get user orders
GET    /api/orders/:id             - Get order by ID
POST   /api/orders                 - Create new order
PUT    /api/orders/:id/cancel      - Cancel order
```

### Address Endpoints
```
GET    /api/addresses              - Get user addresses
POST   /api/addresses              - Add new address
PUT    /api/addresses/:id          - Update address
DELETE /api/addresses/:id          - Delete address
```

### Payment Endpoints
```
POST   /api/payment/create-order   - Create Razorpay order
POST   /api/payment/verify         - Verify payment
```

### Notification Endpoints
```
GET    /api/notifications          - Get notifications
POST   /api/notifications/token    - Save FCM token
PUT    /api/notifications/:id/read - Mark as read
```

### Review Endpoints
```
GET    /api/reviews/:itemId        - Get reviews for item
POST   /api/reviews                - Add review
PUT    /api/reviews/:id            - Update review
DELETE /api/reviews/:id            - Delete review
```

### Promo Code Endpoints
```
GET    /api/promocodes             - Get all promo codes
POST   /api/promocodes/validate    - Validate promo code
POST   /api/promocodes             - Create promo code (Admin)
```

### Banner Endpoints
```
GET    /api/banners                - Get all banners
POST   /api/banners                - Create banner (Admin)
PUT    /api/banners/:id            - Update banner (Admin)
DELETE /api/banners/:id            - Delete banner (Admin)
```

### FAQ Endpoints
```
GET    /api/faqs                   - Get all FAQs
POST   /api/faqs                   - Create FAQ (Admin)
PUT    /api/faqs/:id               - Update FAQ (Admin)
DELETE /api/faqs/:id               - Delete FAQ (Admin)
```

### Filter Endpoints
```
GET    /api/filters                - Get filter options
POST   /api/filters/apply          - Apply filters to products
```

### Points System Endpoints
```
GET    /api/points                 - Get user points
POST   /api/points/redeem          - Redeem points
```

### Invite Friends Endpoints
```
GET    /api/invite/code            - Get referral code
POST   /api/invite/send            - Send invitation
```

### Chat/Support Endpoints
```
GET    /api/chat                   - Get chat history
POST   /api/chat/send              - Send message
```

### Analytics Endpoints
```
POST   /api/analytics/event        - Track event
GET    /api/analytics/dashboard    - Get analytics (Admin)
```

---

## 🔐 Authentication

### Request Headers

All authenticated requests must include:

```javascript
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

### Getting JWT Token

After successful login, you'll receive a JWT token:

```javascript
// Login Response
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "phone": "1234567890",
    "email": "user@example.com"
  }
}
```

Store this token in:
- LocalStorage (Web)
- AsyncStorage (React Native)
- SecureStore (React Native - Recommended)

---

## 💻 Frontend Integration Examples

### React/React Native (Axios)

```javascript
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8081/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // or AsyncStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Example: Login
const login = async (phone, password) => {
  try {
    const response = await api.post('/auth/login', { phone, password });
    const { token, user } = response.data;
    
    // Save token
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data);
    throw error;
  }
};

// Example: Get Products
const getProducts = async () => {
  try {
    const response = await api.get('/items');
    return response.data;
  } catch (error) {
    console.error('Get products error:', error);
    throw error;
  }
};

// Example: Add to Cart
const addToCart = async (itemId, quantity) => {
  try {
    const response = await api.post('/cart/add', { itemId, quantity });
    return response.data;
  } catch (error) {
    console.error('Add to cart error:', error);
    throw error;
  }
};
```

### React Native (Fetch API)

```javascript
const API_BASE_URL = 'http://localhost:8081/api';

// For Android emulator, use: http://10.0.2.2:8081/api
// For iOS simulator, use: http://localhost:8081/api

const getToken = async () => {
  // Use AsyncStorage or SecureStore
  return await AsyncStorage.getItem('token');
};

const fetchWithAuth = async (endpoint, options = {}) => {
  const token = await getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

// Example usage
const login = async (phone, password) => {
  return fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
};
```

### Next.js (API Route)

```javascript
// pages/api/proxy/[...path].js
export default async function handler(req, res) {
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path;
  
  const url = `http://localhost:8081/api/${apiPath}`;
  
  const options = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...(req.headers.authorization && {
        Authorization: req.headers.authorization,
      }),
    },
  };
  
  if (req.body && Object.keys(req.body).length > 0) {
    options.body = JSON.stringify(req.body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 📱 React Native Specific Configuration

### iOS Simulator
Use: `http://localhost:8081/api`

### Android Emulator
Use: `http://10.0.2.2:8081/api`

### Physical Device (Same Network)
1. Find your computer's local IP address:
   - Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig`
   - Linux: `ip addr show`

2. Use: `http://YOUR_LOCAL_IP:8081/api`
   - Example: `http://192.168.1.100:8081/api`

### Configuration File

```javascript
// config/api.js
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8081/api';
    }
    // For iOS simulator or physical device on same network
    return 'http://localhost:8081/api';
    // Or use your computer's IP: return 'http://192.168.1.100:8081/api';
  }
  // Production mode
  return 'https://api.yoraa.in/api';
};

export const API_BASE_URL = getBaseUrl();
```

---

## 🔍 Testing API Endpoints

### Using cURL

```bash
# Test health check
curl http://localhost:8081/api/health

# Login
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890","password":"password123"}'

# Get products (authenticated)
curl http://localhost:8081/api/items \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman

1. Import the collection files in the root directory:
   - `Account_Linking_Tests.postman_collection.json`
   - `Product_Review_API_Endpoints.postman_collection.json`
   - `POSTMAN_FCM_TEST.json`

2. Set environment variable:
   - Variable: `base_url`
   - Value: `http://localhost:8081`

---

## 🐛 Common Issues & Solutions

### Issue 1: Cannot Connect to Backend

**Error:** `Network request failed` or `ECONNREFUSED`

**Solutions:**
- ✅ Make sure backend server is running (`npm run dev`)
- ✅ Check if port 8081 is not blocked by firewall
- ✅ For React Native Android: Use `http://10.0.2.2:8081`
- ✅ For React Native iOS: Use `http://localhost:8081`
- ✅ For physical device: Use your computer's local IP

### Issue 2: CORS Errors

**Error:** `Access to fetch blocked by CORS policy`

**Solution:**
The backend already has CORS enabled for all origins in development mode. If you still face issues:
- Clear browser cache
- Restart backend server
- Check if request has correct headers

### Issue 3: 401 Unauthorized

**Error:** `Token expired` or `Unauthorized`

**Solutions:**
- ✅ Check if token is properly saved
- ✅ Verify token is included in Authorization header
- ✅ Token may have expired, try logging in again
- ✅ Format: `Bearer YOUR_TOKEN` (with space after Bearer)

### Issue 4: 404 Not Found

**Error:** `Cannot GET /api/endpoint`

**Solutions:**
- ✅ Check endpoint spelling and HTTP method (GET/POST/PUT/DELETE)
- ✅ Verify API is available in the routes list above
- ✅ Check if backend server restarted properly

### Issue 5: Slow Response Times

**Solutions:**
- ✅ Check MongoDB connection
- ✅ Check your internet connection (MongoDB is cloud-hosted)
- ✅ Clear backend node_modules and reinstall: `rm -rf node_modules && npm install`

---

## 🔐 Environment Variables

The backend uses these key environment variables (already configured):

```env
# Server
PORT=8081
HOST=0.0.0.0

# Database
MONGO_URI=mongodb+srv://... (provided by backend team)

# Authentication
SECRET_KEY=... (JWT secret)
LOGIN_TOKEN_EXPIRATION=30d

# OTP
OTP_EXPIRATION_TIME=60000

# Payment
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=yoraa-android-ios
```

---

## 📞 Support & Contact

### Backend Team Contacts
- Email: contact@yoraa.in
- For issues, please check existing documentation files in the repository

### Useful Documentation Files
- `QUICK_START_GUIDE.md` - Backend quick start
- `BACKEND_API_DOCUMENTATION_INDEX.md` - Complete API documentation
- `FRONTEND_HANDOFF.md` - Frontend integration guide
- `AUTH_FLOW_DIAGRAM.md` - Authentication flow
- `FCM_IMPLEMENTATION_SUMMARY.md` - Push notification setup

---

## ✅ Checklist for Frontend Development

- [ ] Backend server is running on `http://localhost:8081`
- [ ] Can access health endpoint: `http://localhost:8081/api/health`
- [ ] Configured correct base URL in frontend app
- [ ] Implemented JWT token storage and retrieval
- [ ] Added Authorization header to authenticated requests
- [ ] Tested login/register flow
- [ ] Tested product fetching
- [ ] Tested cart operations
- [ ] Configured FCM for push notifications (if needed)
- [ ] Handled error responses properly
- [ ] Implemented token refresh logic (if required)

---

## 🚀 Ready to Go!

You're all set! Start making API calls to `http://localhost:8081/api` from your frontend application.

**Example First API Call:**

```javascript
// Test if backend is running
fetch('http://localhost:8081/api/health')
  .then(res => res.json())
  .then(data => console.log('Backend status:', data))
  .catch(err => console.error('Backend not reachable:', err));
```

Happy coding! 🎉
