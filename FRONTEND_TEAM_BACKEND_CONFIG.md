# 🎯 Frontend Team - Backend Configuration Guide

## ✅ Production Server Details

Your backend is deployed and running on Contabo. Use these configurations to connect your mobile app.

---

## 🌐 **PRODUCTION API CONFIGURATION**

### **Server Details**
```
Server IP:          185.193.19.244
Port:               8080
Protocol:           HTTP (HTTPS optional - see SSL setup below)
Base URL:           http://185.193.19.244:8080
API Base URL:       http://185.193.19.244:8080/api
Health Check:       http://185.193.19.244:8080/health
Status:             ✅ Live & Running
```

### **Database**
```
Type:               MongoDB Atlas (Cloud)
Status:             ✅ Connected
```

### **Deployment**
```
Platform:           Contabo VPS
Container:          Docker (yoraa-api-prod)
PM2 Process:        yoraa-api-prod
Auto-restart:       Enabled
```

---

## 📱 **MOBILE APP CONFIGURATION**

### **1. Environment Configuration**

Create `src/config/environment.js`:

```javascript
const ENV = {
  development: {
    API_URL: 'http://localhost:8001/api',  // Your local dev server
    BASE_URL: 'http://localhost:8001',
  },
  production: {
    API_URL: 'http://185.193.19.244:8080/api',  // Contabo production server
    BASE_URL: 'http://185.193.19.244:8080',
  },
};

// Auto-detect environment
const getEnvironment = () => {
  if (__DEV__) {
    return ENV.development;
  }
  return ENV.production;
};

export default getEnvironment();
```

### **2. API Service Setup**

Create `src/services/api.js`:

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../config/environment';

// Create axios instance
const api = axios.create({
  baseURL: ENV.API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      await AsyncStorage.removeItem('userToken');
      // Navigate to login screen
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
```

---

## 🔑 **API ENDPOINTS**

### **Health Check**
```javascript
// Check if server is running
GET http://185.193.19.244:8080/health

// Expected Response:
{
  "status": "ok",
  "timestamp": "2025-10-12T12:00:00.000Z"
}
```

### **Authentication**
```javascript
// Login with email/password
POST http://185.193.19.244:8080/api/auth/login
Body: { "email": "user@example.com", "password": "password123" }

// Login with Firebase (Google, Apple, Phone)
POST http://185.193.19.244:8080/api/auth/loginFirebase
Body: { "idToken": "firebase_id_token_here" }

// Signup
POST http://185.193.19.244:8080/api/auth/signup
Body: { "name": "John", "email": "john@example.com", "password": "pass123" }
```

### **User Profile**
```javascript
// Get user profile
GET http://185.193.19.244:8080/api/profile
Headers: { "Authorization": "Bearer <token>" }

// Update profile
PUT http://185.193.19.244:8080/api/profile
Headers: { "Authorization": "Bearer <token>" }
Body: { "name": "New Name", "phoneNumber": "1234567890" }
```

### **FAQs**
```javascript
// Get all FAQs
GET http://185.193.19.244:8080/api/faqs

// Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "question": "Your question here",
      "answer": "Your answer here",
      "category": "general",
      "isActive": true
    }
  ]
}
```

### **Products & Categories**
```javascript
// Get categories
GET http://185.193.19.244:8080/api/categories

// Get products
GET http://185.193.19.244:8080/api/products
Query params: ?category=<id>&sort=price&order=asc

// Get single product
GET http://185.193.19.244:8080/api/products/:id
```

### **Orders**
```javascript
// Create order
POST http://185.193.19.244:8080/api/orders
Headers: { "Authorization": "Bearer <token>" }
Body: { "items": [...], "shippingAddress": {...} }

// Get user orders
GET http://185.193.19.244:8080/api/orders
Headers: { "Authorization": "Bearer <token>" }

// Get order details
GET http://185.193.19.244:8080/api/orders/:id
Headers: { "Authorization": "Bearer <token>" }
```

### **Reviews**
```javascript
// Get product reviews
GET http://185.193.19.244:8080/api/products/:productId/reviews

// Add review
POST http://185.193.19.244:8080/api/products/:productId/reviews
Headers: { "Authorization": "Bearer <token>" }
Body: { "rating": 5, "comment": "Great product!" }
```

---

## 🛠️ **IMPLEMENTATION EXAMPLES**

### **FAQ Service (Fix for your current issue)**

Create `src/services/faqService.js`:

```javascript
import api from './api';

export const faqService = {
  // Get all FAQs - NO CACHING
  getAllFAQs: async () => {
    try {
      const response = await api.get('/faqs', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      throw error;
    }
  },

  // Get FAQs by category
  getFAQsByCategory: async (category) => {
    try {
      const response = await api.get(`/faqs?category=${category}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching FAQs by category:', error);
      throw error;
    }
  }
};
```

### **FAQ Screen Component**

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { faqService } from '../services/faqService';

const FAQScreen = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadFAQs = async () => {
    try {
      setError(null);
      const response = await faqService.getAllFAQs();
      
      if (response.success && response.data) {
        setFaqs(response.data);
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFAQs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadFAQs();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center' }}>
          Error loading FAQs: {error}
        </Text>
        <Text 
          style={{ color: 'blue', marginTop: 10 }} 
          onPress={loadFAQs}
        >
          Retry
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={faqs}
      keyExtractor={(item) => item._id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <View style={{ padding: 15, borderBottomWidth: 1, borderColor: '#eee' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            {item.question}
          </Text>
          <Text style={{ fontSize: 14, color: '#666' }}>
            {item.answer}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text>No FAQs available</Text>
        </View>
      }
    />
  );
};

export default FAQScreen;
```

---

## 🔧 **TROUBLESHOOTING FAQ ISSUE**

### **Problem:** FAQs showing cached/default data instead of server data

### **Solution:**

1. **Clear app cache completely:**
```javascript
// In your app initialization or settings
import AsyncStorage from '@react-native-async-storage/async-storage';

const clearCache = async () => {
  try {
    await AsyncStorage.clear();
    console.log('Cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
```

2. **Remove any static/default FAQ data:**
   - Delete any `defaultFAQs` or `fallbackFAQs` constants
   - Remove any local FAQ JSON files
   - Don't show cached data if API fails - show error instead

3. **Ensure using production URL:**
```javascript
// Make sure you're using:
http://185.193.19.244:8080/api/faqs

// NOT localhost:
http://localhost:8001/api/faqs  // ❌ Only for local dev
```

4. **Add proper error handling:**
```javascript
// Don't fall back to cached data - show error instead
try {
  const data = await faqService.getAllFAQs();
  setFaqs(data.data);
} catch (error) {
  // Show error to user - don't use cached data
  setError('Failed to load FAQs. Please check your internet connection.');
  setFaqs([]); // Clear any old data
}
```

5. **Test the API directly:**
```bash
# From terminal or Postman:
curl http://185.193.19.244:8080/api/faqs

# Should return your dynamic FAQs from backend
```

---

## 🔒 **HTTPS/SSL SETUP (OPTIONAL)**

If you want to use HTTPS (recommended for production):

### **Option 1: Using Domain with Let's Encrypt**

1. Point your domain to `185.193.19.244`
2. Install Certbot on Contabo server
3. Get free SSL certificate
4. Update frontend to use `https://yourdomain.com`

### **Option 2: Using Cloudflare (Easiest)**

1. Add domain to Cloudflare
2. Point A record to `185.193.19.244`
3. Enable Cloudflare proxy (orange cloud)
4. Auto SSL enabled
5. Update frontend to use `https://yourdomain.com`

For now, HTTP is working fine for testing/development.

---

## ✅ **TESTING CHECKLIST**

### **Before Deploying to App Stores:**

- [ ] Test all API endpoints from production URL
- [ ] Verify authentication flow (signup, login, logout)
- [ ] Test profile updates
- [ ] Verify product listing and details
- [ ] Test order creation and tracking
- [ ] Check FAQ loading (no cached data)
- [ ] Test image uploads
- [ ] Verify push notifications (if implemented)
- [ ] Test on both iOS and Android
- [ ] Test on real devices (not just simulators)
- [ ] Test with slow/unstable internet connection
- [ ] Verify error handling for all API failures

---

## 📞 **NEED HELP?**

### **Check Backend Status:**
```bash
curl http://185.193.19.244:8080/health
```

### **Common Issues:**

1. **"Network Error" / Cannot connect:**
   - Check if you're using the correct URL: `http://185.193.19.244:8080`
   - Ensure port 8080 is open on Contabo server
   - Test from browser: `http://185.193.19.244:8080/health`

2. **FAQs showing old/cached data:**
   - Clear AsyncStorage completely
   - Remove any static FAQ data from code
   - Add `Cache-Control: no-cache` headers
   - Don't use fallback data if API fails

3. **401 Unauthorized errors:**
   - Check if auth token is being sent in headers
   - Verify token hasn't expired
   - Test login endpoint first

4. **500 Server errors:**
   - Contact backend team
   - Check server logs on Contabo

---

## 📊 **MONITORING**

### **Server Health:**
- Health Check: `http://185.193.19.244:8080/health`
- Should return `200 OK` with `{ "status": "ok" }`

### **If server is down:**
SSH into Contabo and restart:
```bash
ssh root@185.193.19.244
cd /opt/yoraa-backend
docker compose restart yoraa-backend-prod
```

---

## 🎉 **YOU'RE ALL SET!**

Your backend is live and ready to use at:
```
http://185.193.19.244:8080/api
```

Start integrating these endpoints into your mobile app and remove any cached/static FAQ data.

**Happy Coding! 🚀**
