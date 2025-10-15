# 🚀 Frontend Backend Connection Guide

**Version:** 1.0.0  
**Last Updated:** October 14, 2025  
**Backend Framework:** Node.js + Express + MongoDB

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Backend Base URLs](#backend-base-urls)
3. [Environment Setup](#environment-setup)
4. [Authentication](#authentication)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [Request & Response Format](#request--response-format)
7. [Error Handling](#error-handling)
8. [CORS Configuration](#cors-configuration)
9. [FCM Push Notifications](#fcm-push-notifications)
10. [Payment Integration](#payment-integration)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Quick Start

### Backend Server Status
Check if the backend is running:
```bash
GET /
GET /health
GET /api/health
GET /api/status
```

### Base API URL Format
All API endpoints follow this pattern:
```
{BASE_URL}/api/{resource}
```

---

## 🌐 Backend Base URLs

### Development
```
http://localhost:8081
```

### Production (Deployed)
```
https://your-production-domain.com
```
*Replace with your actual production URL*

### Health Check Endpoints
- **Root:** `GET /` - Basic server status
- **Health:** `GET /health` - Server health metrics
- **API Health:** `GET /api/health` - API operational status
- **API Status:** `GET /api/status` - Detailed system status

**Example Response:**
```json
{
  "status": "success",
  "message": "Yoraa Backend API is running",
  "version": "1.0.0",
  "timestamp": "2025-10-14T10:30:00.000Z",
  "environment": "production"
}
```

---

## ⚙️ Environment Setup

### Frontend Environment Variables

Create a `.env` file in your frontend project:

```env
# Backend API Configuration
REACT_APP_API_BASE_URL=http://localhost:8081/api
# For production, use:
# REACT_APP_API_BASE_URL=https://your-production-domain.com/api

# Optional: API Timeout
REACT_APP_API_TIMEOUT=30000

# Firebase Configuration (for FCM)
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=yoraa-android-ios.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=yoraa-android-ios
REACT_APP_FIREBASE_STORAGE_BUCKET=yoraa-android-ios.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id

# Razorpay Configuration
REACT_APP_RAZORPAY_KEY_ID=rzp_live_VRU7ggfYLI7DWV
```

### React Native Environment Variables

Create a `.env` file:

```env
API_BASE_URL=http://localhost:8081/api
# For production:
# API_BASE_URL=https://your-production-domain.com/api

RAZORPAY_KEY_ID=rzp_live_VRU7ggfYLI7DWV
```

### Axios Configuration (React/React Native)

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // or AsyncStorage for React Native
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
```

---

## 🔐 Authentication

### Authentication Flow

The backend supports **JWT-based authentication** with Firebase integration.

#### 1. **Firebase Authentication (Recommended)**

```javascript
// Sign up with Firebase
POST /api/auth/firebase-signup
```

**Request Body:**
```json
{
  "firebaseToken": "firebase_id_token_here",
  "phoneNumber": "+919876543210",
  "displayName": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "_id": "user_id",
      "phoneNumber": "+919876543210",
      "displayName": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### 2. **Phone Number + OTP Authentication**

**Step 1: Send OTP**
```javascript
POST /api/auth/send-otp
```

**Request Body:**
```json
{
  "phoneNumber": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Step 2: Verify OTP**
```javascript
POST /api/auth/verify-otp
```

**Request Body:**
```json
{
  "phoneNumber": "+919876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "_id": "user_id",
      "phoneNumber": "+919876543210"
    }
  }
}
```

#### 3. **Guest User Authentication**

```javascript
POST /api/auth/guest-login
```

**Response:**
```json
{
  "success": true,
  "message": "Guest session created",
  "data": {
    "token": "guest_jwt_token",
    "user": {
      "_id": "guest_user_id",
      "isGuest": true
    }
  }
}
```

#### 4. **Account Linking (Guest → Registered User)**

```javascript
POST /api/auth/link-account
```

**Request Body:**
```json
{
  "guestToken": "guest_jwt_token",
  "phoneNumber": "+919876543210",
  "firebaseToken": "firebase_id_token"
}
```

### Token Management

- **Store token:** Save JWT token in `localStorage` (web) or `AsyncStorage` (React Native)
- **Token expiration:** 30 days
- **Header format:** `Authorization: Bearer {token}`

---

## 📚 API Endpoints Reference

### **Authentication** (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/send-otp` | Send OTP to phone | No |
| POST | `/api/auth/verify-otp` | Verify OTP and login | No |
| POST | `/api/auth/firebase-signup` | Sign up with Firebase | No |
| POST | `/api/auth/firebase-login` | Login with Firebase | No |
| POST | `/api/auth/guest-login` | Create guest session | No |
| POST | `/api/auth/link-account` | Link guest to registered account | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |
| POST | `/api/auth/refresh-token` | Refresh JWT token | Yes |

---

### **User Management** (`/api/user` or `/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/user/profile` | Get user profile | Yes |
| PUT | `/api/user/profile` | Update user profile | Yes |
| GET | `/api/users/:id` | Get user by ID | Yes |
| DELETE | `/api/user/account` | Delete user account | Yes |

**Example: Update Profile**
```javascript
PUT /api/user/profile
```

**Request Body:**
```json
{
  "displayName": "John Doe Updated",
  "email": "john.updated@example.com",
  "gender": "male",
  "dateOfBirth": "1990-01-01"
}
```

---

### **Products/Items** (`/api/items` or `/api/products`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/items` | Get all products | No |
| GET | `/api/items/:id` | Get product by ID | No |
| GET | `/api/items/category/:categoryId` | Get products by category | No |
| GET | `/api/items/search?q=query` | Search products | No |
| POST | `/api/items` | Create product (Admin) | Yes (Admin) |
| PUT | `/api/items/:id` | Update product (Admin) | Yes (Admin) |
| DELETE | `/api/items/:id` | Delete product (Admin) | Yes (Admin) |

**Example: Get All Products**
```javascript
GET /api/items?page=1&limit=20&sort=-createdAt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "product_id",
        "name": "Product Name",
        "price": 1999,
        "description": "Product description",
        "images": ["url1", "url2"],
        "category": "category_id",
        "stock": 50
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

### **Categories** (`/api/categories`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/categories` | Get all categories | No |
| GET | `/api/categories/:id` | Get category by ID | No |
| POST | `/api/categories` | Create category (Admin) | Yes (Admin) |
| PUT | `/api/categories/:id` | Update category (Admin) | Yes (Admin) |
| DELETE | `/api/categories/:id` | Delete category (Admin) | Yes (Admin) |

---

### **Sub-Categories** (`/api/subcategories`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/subcategories` | Get all sub-categories | No |
| GET | `/api/subcategories/:id` | Get sub-category by ID | No |
| GET | `/api/subcategories/category/:categoryId` | Get sub-categories by category | No |

---

### **Cart** (`/api/cart`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/cart` | Get user cart | Yes |
| POST | `/api/cart/add` | Add item to cart | Yes |
| PUT | `/api/cart/update/:itemId` | Update cart item quantity | Yes |
| DELETE | `/api/cart/remove/:itemId` | Remove item from cart | Yes |
| DELETE | `/api/cart/clear` | Clear entire cart | Yes |

**Example: Add to Cart**
```javascript
POST /api/cart/add
```

**Request Body:**
```json
{
  "productId": "product_id",
  "quantity": 2,
  "variantId": "variant_id_if_applicable"
}
```

---

### **Wishlist** (`/api/wishlist`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/wishlist` | Get user wishlist | Yes |
| POST | `/api/wishlist/add` | Add item to wishlist | Yes |
| DELETE | `/api/wishlist/remove/:itemId` | Remove item from wishlist | Yes |

---

### **Address** (`/api/address`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/address` | Get all user addresses | Yes |
| GET | `/api/address/:id` | Get address by ID | Yes |
| POST | `/api/address` | Add new address | Yes |
| PUT | `/api/address/:id` | Update address | Yes |
| DELETE | `/api/address/:id` | Delete address | Yes |
| PUT | `/api/address/:id/default` | Set default address | Yes |

**Example: Add Address**
```javascript
POST /api/address
```

**Request Body:**
```json
{
  "fullName": "John Doe",
  "phoneNumber": "+919876543210",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apt 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "country": "India",
  "addressType": "home",
  "isDefault": true
}
```

---

### **Orders** (`/api/orders`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/orders` | Get all user orders | Yes |
| GET | `/api/orders/:id` | Get order by ID | Yes |
| POST | `/api/orders/create` | Create new order | Yes |
| PUT | `/api/orders/:id/cancel` | Cancel order | Yes |
| GET | `/api/orders/:id/track` | Track order | Yes |

**Example: Create Order**
```javascript
POST /api/orders/create
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "price": 1999
    }
  ],
  "addressId": "address_id",
  "paymentMethod": "razorpay",
  "totalAmount": 3998,
  "promoCode": "DISCOUNT10"
}
```

---

### **Payment** (`/api/razorpay`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/razorpay/create-order` | Create Razorpay order | Yes |
| POST | `/api/razorpay/verify-payment` | Verify payment signature | Yes |
| POST | `/api/razorpay/refund` | Initiate refund | Yes |

**Example: Create Razorpay Order**
```javascript
POST /api/razorpay/create-order
```

**Request Body:**
```json
{
  "amount": 3998,
  "currency": "INR",
  "orderId": "order_id_from_backend"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "razorpayOrderId": "order_razorpay_id",
    "amount": 399800,
    "currency": "INR",
    "key": "rzp_live_VRU7ggfYLI7DWV"
  }
}
```

---

### **Notifications** (`/api/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notifications` | Get user notifications | Yes |
| PUT | `/api/notifications/:id/read` | Mark notification as read | Yes |
| DELETE | `/api/notifications/:id` | Delete notification | Yes |
| POST | `/api/notifications/fcm-token` | Register FCM token | Yes |

**Example: Register FCM Token**
```javascript
POST /api/notifications/fcm-token
```

**Request Body:**
```json
{
  "fcmToken": "firebase_fcm_token_here",
  "deviceType": "android"
}
```

---

### **Promo Codes** (`/api/promoCode`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/promoCode` | Get all active promo codes | Yes |
| POST | `/api/promoCode/validate` | Validate promo code | Yes |
| POST | `/api/promoCode/apply` | Apply promo code to cart | Yes |

**Example: Validate Promo Code**
```javascript
POST /api/promoCode/validate
```

**Request Body:**
```json
{
  "code": "DISCOUNT10",
  "cartTotal": 3998
}
```

---

### **Reviews** (`/api/reviews`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/reviews/product/:productId` | Get product reviews | No |
| POST | `/api/reviews` | Add product review | Yes |
| PUT | `/api/reviews/:id` | Update review | Yes |
| DELETE | `/api/reviews/:id` | Delete review | Yes |

---

### **Points System** (`/api/points`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/points/balance` | Get user points balance | Yes |
| GET | `/api/points/history` | Get points transaction history | Yes |
| POST | `/api/points/redeem` | Redeem points | Yes |

---

### **Invite a Friend** (`/api/invite-friend`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/invite-friend/code` | Get user referral code | Yes |
| POST | `/api/invite-friend/apply` | Apply referral code | Yes |
| GET | `/api/invite-friend/stats` | Get referral statistics | Yes |

---

### **Banners** (`/api/banners`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/banners` | Get all active banners | No |
| GET | `/api/banners/:id` | Get banner by ID | No |

---

### **FAQs** (`/api/faqs`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/faqs` | Get all FAQs | No |
| GET | `/api/faqs/category/:category` | Get FAQs by category | No |

---

### **Analytics** (`/api/analytics`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/analytics/track-event` | Track user event | Yes |
| POST | `/api/analytics/page-view` | Track page view | Yes |

---

### **Chat Support** (`/api/chat`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/chat/conversations` | Get user conversations | Yes |
| POST | `/api/chat/send` | Send chat message | Yes |
| GET | `/api/chat/messages/:conversationId` | Get conversation messages | Yes |

---

### **Admin Routes** (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/orders` | Get all orders (Admin) | Yes (Admin) |
| PUT | `/api/admin/orders/:id/status` | Update order status | Yes (Admin) |
| GET | `/api/admin/users` | Get all users | Yes (Admin) |
| GET | `/api/admin/analytics` | Get admin analytics | Yes (Admin) |

---

## 📝 Request & Response Format

### Standard Request Format

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Query Parameters (for GET requests):**
```
?page=1&limit=20&sort=-createdAt&filter=active
```

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  },
  "statusCode": 200
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "statusCode": 400
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 500 | Internal Server Error | Server error |

### Common Error Messages

```javascript
// Example error handling
try {
  const response = await API.get('/api/items');
  console.log(response.data);
} catch (error) {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        console.log('Unauthorized - Please login');
        // Redirect to login
        break;
      case 404:
        console.log('Resource not found');
        break;
      case 500:
        console.log('Server error - Please try again later');
        break;
      default:
        console.log(data.message || 'An error occurred');
    }
  } else if (error.request) {
    // Request made but no response
    console.log('Network error - Please check your connection');
  } else {
    console.log('Error:', error.message);
  }
}
```

---

## 🌍 CORS Configuration

The backend is configured to accept requests from:

- **Development:** `http://localhost:3000`, `http://localhost:3001`
- **Production:** Your production domain

**CORS Headers Supported:**
- `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`
- All standard headers
- Credentials enabled

---

## 🔔 FCM Push Notifications

### Setup Steps

1. **Register FCM Token:**
```javascript
POST /api/notifications/fcm-token
```

**Request Body:**
```json
{
  "fcmToken": "your_fcm_token_from_firebase",
  "deviceType": "android" // or "ios" or "web"
}
```

2. **Firebase Configuration:**
- Project ID: `yoraa-android-ios`
- Use your own Firebase credentials in frontend

3. **Notification Types:**
- Order updates
- Promotional offers
- Cart abandonment reminders
- New product alerts

---

## 💳 Payment Integration

### Razorpay Integration

**Live Key:** `rzp_live_VRU7ggfYLI7DWV`

**Integration Flow:**

1. **Create Order:**
```javascript
const response = await API.post('/api/razorpay/create-order', {
  amount: 3998,
  currency: 'INR',
  orderId: 'backend_order_id'
});
```

2. **Open Razorpay Checkout:**
```javascript
const options = {
  key: 'rzp_live_VRU7ggfYLI7DWV',
  amount: response.data.amount,
  currency: response.data.currency,
  order_id: response.data.razorpayOrderId,
  name: 'Yoraa',
  description: 'Order Payment',
  handler: function(response) {
    verifyPayment(response);
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

3. **Verify Payment:**
```javascript
await API.post('/api/razorpay/verify-payment', {
  razorpayOrderId: response.razorpay_order_id,
  razorpayPaymentId: response.razorpay_payment_id,
  razorpaySignature: response.razorpay_signature
});
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **CORS Error**
**Problem:** Browser blocks request due to CORS policy

**Solution:**
- Ensure you're using the correct API base URL
- Check if backend server is running
- Verify CORS is enabled on backend

#### 2. **401 Unauthorized**
**Problem:** Token invalid or expired

**Solution:**
```javascript
// Clear token and redirect to login
localStorage.removeItem('authToken');
window.location.href = '/login';
```

#### 3. **Network Error**
**Problem:** Cannot connect to backend

**Solution:**
- Check if backend is running: Visit `http://localhost:8081/health`
- Verify API base URL in `.env` file
- Check firewall/network settings

#### 4. **Timeout Error**
**Problem:** Request takes too long

**Solution:**
- Increase timeout in axios config
- Check server logs for performance issues
- Optimize large data requests with pagination

---

## 📞 Support & Contact

### Backend Developer Contact
- **Project:** Yoraa Backend API
- **Version:** 1.0.0
- **Node.js:** v16+
- **Database:** MongoDB

### Testing the Backend

**Quick Test:**
```bash
curl http://localhost:8081/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "uptime": 1234.56,
  "timestamp": "2025-10-14T10:30:00.000Z"
}
```

---

## 📦 Additional Resources

- [Authentication Flow Documentation](./AUTH_FLOW_DIAGRAM.md)
- [FCM Implementation Guide](./FCM_IMPLEMENTATION_SUMMARY.md)
- [API User Profile Fix](./API_USER_PROFILE_ENDPOINT_FIX.md)
- [React Native Auth Fix](./REACT_NATIVE_AUTH_FIX.md)

---

## 🎉 Ready to Connect!

You now have all the information needed to connect your frontend to this backend. If you encounter any issues:

1. Check backend health endpoints
2. Verify environment variables
3. Ensure authentication token is included
4. Check browser console for errors
5. Review backend logs

**Happy Coding! 🚀**
