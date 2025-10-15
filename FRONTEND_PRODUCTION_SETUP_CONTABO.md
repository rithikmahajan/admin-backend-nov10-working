# 🚀 Frontend Production Setup - Contabo Server

## 📋 Overview

This guide will help you configure your frontend application to connect to the production backend deployed on Contabo server.

---

## 🌐 Production Server Details

| Item | Value |
|------|-------|
| **Server IP** | `185.193.19.244` |
| **Port** | `8080` |
| **Protocol** | `HTTP` (HTTPS setup optional) |
| **Environment** | `Production` |

---

## 🔗 API Endpoints

### Base URL
```
http://185.193.19.244:8080/api
```

### Key Endpoints

| Endpoint | URL | Description |
|----------|-----|-------------|
| **Health Check** | `http://185.193.19.244:8080/health` | Server health status |
| **API Base** | `http://185.193.19.244:8080/api` | All API endpoints |
| **Authentication** | `http://185.193.19.244:8080/api/auth/*` | Login, Register, OTP |
| **Products** | `http://185.193.19.244:8080/api/products` | Product catalog |
| **Categories** | `http://185.193.19.244:8080/api/categories` | Product categories |
| **Cart** | `http://185.193.19.244:8080/api/cart` | Shopping cart |
| **Orders** | `http://185.193.19.244:8080/api/orders` | Order management |
| **Profile** | `http://185.193.19.244:8080/api/profile` | User profile |
| **Razorpay** | `http://185.193.19.244:8080/api/razorpay/*` | Payment processing |

---

## 🛠️ Configuration Setup

### 1️⃣ React Native / Expo

#### Option A: Environment Variables (Recommended)

Create or update `.env.production`:

```env
# Production API Configuration
API_BASE_URL=http://185.193.19.244:8080/api
API_TIMEOUT=30000
ENVIRONMENT=production
```

#### Option B: Config File

Create `config/api.config.js`:

```javascript
const ENV = {
  development: {
    apiUrl: 'http://localhost:8080/api',
    timeout: 30000,
  },
  production: {
    apiUrl: 'http://185.193.19.244:8080/api',
    timeout: 30000,
  },
};

const getEnvVars = (env = 'development') => {
  if (env === 'production') {
    return ENV.production;
  }
  return ENV.development;
};

export default getEnvVars(__DEV__ ? 'development' : 'production');
```

#### Usage in API Service

```javascript
import Config from './config/api.config';
// or
import { API_BASE_URL } from '@env';

const api = axios.create({
  baseURL: Config.apiUrl, // or API_BASE_URL
  timeout: Config.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = getAuthToken(); // Your token retrieval logic
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

### 2️⃣ Flutter / Dart

#### Environment Configuration

Create `lib/config/api_config.dart`:

```dart
class ApiConfig {
  // Production Configuration
  static const String baseUrl = 'http://185.193.19.244:8080/api';
  static const int timeout = 30000; // 30 seconds
  static const String environment = 'production';

  // API Endpoints
  static const String health = '/health';
  static const String auth = '/auth';
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String verifyOtp = '/auth/verify-otp';
  static const String products = '/products';
  static const String categories = '/categories';
  static const String cart = '/cart';
  static const String orders = '/orders';
  static const String profile = '/profile';
  static const String razorpay = '/razorpay';
  
  // Full URLs
  static String get healthUrl => 'http://185.193.19.244:8080$health';
  static String get authUrl => '$baseUrl$auth';
  static String get loginUrl => '$baseUrl$login';
  static String get registerUrl => '$baseUrl$register';
  static String get productsUrl => '$baseUrl$products';
  static String get categoriesUrl => '$baseUrl$categories';
  static String get cartUrl => '$baseUrl$cart';
  static String get ordersUrl => '$baseUrl$orders';
  static String get profileUrl => '$baseUrl$profile';
}
```

#### API Service Implementation

```dart
import 'package:dio/dio.dart';
import 'api_config.dart';

class ApiService {
  late Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: Duration(milliseconds: ApiConfig.timeout),
      receiveTimeout: Duration(milliseconds: ApiConfig.timeout),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    // Add interceptors
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add auth token
        final token = await getAuthToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        print('API Error: ${error.message}');
        return handler.next(error);
      },
    ));
  }

  Dio get dio => _dio;

  Future<String?> getAuthToken() async {
    // Your token retrieval logic
    return null;
  }
}
```

---

### 3️⃣ Web Frontend (React/Vue/Angular)

#### Create `.env.production`:

```env
REACT_APP_API_URL=http://185.193.19.244:8080/api
REACT_APP_TIMEOUT=30000
REACT_APP_ENV=production
```

Or for Vue:
```env
VUE_APP_API_URL=http://185.193.19.244:8080/api
VUE_APP_TIMEOUT=30000
VUE_APP_ENV=production
```

#### API Service (React/Axios):

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://185.193.19.244:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: parseInt(process.env.REACT_APP_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🧪 Testing the Connection

### Quick Health Check

Before deploying, verify the backend is accessible:

```bash
# Terminal/Command Prompt
curl http://185.193.19.244:8080/health
```

Expected Response:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-10-15T12:00:00.000Z",
  "memory": {
    "rss": 234696704,
    "heapTotal": 160522240,
    "heapUsed": 130832416,
    "external": 24905518,
    "arrayBuffers": 21977118
  }
}
```

### Test API Endpoint

```bash
# Get all categories
curl http://185.193.19.244:8080/api/categories

# Get all products
curl http://185.193.19.244:8080/api/products
```

---

## 📱 Mobile App Testing

### In Your App Code

Add a connection test function:

```javascript
// React Native
const testConnection = async () => {
  try {
    const response = await fetch('http://185.193.19.244:8080/health');
    const data = await response.json();
    console.log('✅ Backend Connected:', data);
    alert('Backend connection successful!');
  } catch (error) {
    console.error('❌ Connection failed:', error);
    alert('Backend connection failed! Check your internet.');
  }
};
```

```dart
// Flutter
Future<void> testConnection() async {
  try {
    final response = await dio.get('http://185.193.19.244:8080/health');
    print('✅ Backend Connected: ${response.data}');
    // Show success message
  } catch (e) {
    print('❌ Connection failed: $e');
    // Show error message
  }
}
```

---

## 🔐 Authentication Flow

### Login Example

```javascript
// React Native / JavaScript
const login = async (phone, password) => {
  try {
    const response = await api.post('/auth/login', {
      phone: phone,
      password: password,
    });
    
    if (response.data.success) {
      const token = response.data.token;
      // Store token
      await AsyncStorage.setItem('authToken', token);
      return response.data;
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

```dart
// Flutter
Future<Map<String, dynamic>> login(String phone, String password) async {
  try {
    final response = await _dio.post('/auth/login', data: {
      'phone': phone,
      'password': password,
    });
    
    if (response.data['success']) {
      final token = response.data['token'];
      // Store token
      await secureStorage.write(key: 'authToken', value: token);
      return response.data;
    }
    throw Exception('Login failed');
  } catch (e) {
    print('Login error: $e');
    rethrow;
  }
}
```

---

## 📦 Common API Patterns

### Get Products

```javascript
// GET /api/products
const getProducts = async () => {
  const response = await api.get('/products');
  return response.data;
};
```

### Create Order

```javascript
// POST /api/orders/create
const createOrder = async (orderData) => {
  const response = await api.post('/orders/create', {
    items: orderData.items,
    shippingAddress: orderData.address,
    paymentMethod: 'razorpay',
  });
  return response.data;
};
```

### Update Profile

```javascript
// PUT /api/profile
const updateProfile = async (profileData) => {
  const response = await api.put('/profile', profileData);
  return response.data;
};
```

---

## 🚨 Important Notes

### ⚠️ HTTP vs HTTPS

- Current setup uses **HTTP** (not HTTPS)
- For production apps on app stores, consider setting up HTTPS with SSL certificate
- iOS may require additional configuration for HTTP in Info.plist:

```xml
<!-- iOS: Allow HTTP in Info.plist -->
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSExceptionDomains</key>
  <dict>
    <key>185.193.19.244</key>
    <dict>
      <key>NSExceptionAllowsInsecureHTTPLoads</key>
      <true/>
      <key>NSIncludesSubdomains</key>
      <true/>
    </dict>
  </dict>
</dict>
```

### 📱 Android Network Security Config

For Android 9+, add to `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">185.193.19.244</domain>
    </domain-config>
</network-security-config>
```

And in `AndroidManifest.xml`:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

---

## 🐛 Troubleshooting

### Issue: Cannot Connect to API

**Solutions:**
1. Check if backend is running: `curl http://185.193.19.244:8080/health`
2. Verify your device/emulator has internet connection
3. Check firewall/network settings
4. Ensure the API URL is correct (no trailing slashes, correct port)

### Issue: Timeout Errors

**Solutions:**
1. Increase timeout value (currently 30 seconds)
2. Check server logs for slow queries
3. Verify network stability

### Issue: 401 Unauthorized

**Solutions:**
1. Check if auth token is being sent correctly
2. Verify token hasn't expired
3. Re-login to get fresh token

### Issue: CORS Errors (Web Only)

**Solutions:**
1. Backend already has CORS enabled
2. If issues persist, contact backend team
3. Verify request headers

---

## 📞 Support & Contact

### Backend Team Contact
- **Server IP:** 185.193.19.244
- **Deploy Path:** /opt/yoraa-backend
- **Container:** yoraa-api-prod

### Check Backend Status

```bash
# Quick health check
curl http://185.193.19.244:8080/health

# Detailed status
curl -X GET http://185.193.19.244:8080/api/health
```

### Backend Logs (For Backend Team)

```bash
ssh root@185.193.19.244 'cd /opt/yoraa-backend && docker compose logs -f'
```

---

## ✅ Pre-Launch Checklist

- [ ] Updated API base URL to production
- [ ] Tested health endpoint connectivity
- [ ] Verified authentication flow
- [ ] Tested key features (login, products, cart, checkout)
- [ ] Configured network security (Android/iOS)
- [ ] Added proper error handling
- [ ] Implemented token refresh logic
- [ ] Added loading states and user feedback
- [ ] Tested on physical devices
- [ ] Tested with slow/poor network conditions
- [ ] Implemented offline handling (if applicable)
- [ ] Added analytics/error tracking

---

## 🎯 Quick Reference

```javascript
// COPY THIS - Ready to use configuration
export const API_CONFIG = {
  BASE_URL: 'http://185.193.19.244:8080/api',
  HEALTH_URL: 'http://185.193.19.244:8080/health',
  TIMEOUT: 30000,
  ENVIRONMENT: 'production',
  SERVER_IP: '185.193.19.244',
  PORT: 8080,
};
```

```dart
// COPY THIS - Flutter configuration
class ApiConfig {
  static const String baseUrl = 'http://185.193.19.244:8080/api';
  static const String healthUrl = 'http://185.193.19.244:8080/health';
  static const int timeout = 30000;
  static const String environment = 'production';
  static const String serverIp = '185.193.19.244';
  static const int port = 8080;
}
```

---

## 📚 Additional Resources

- **Backend Documentation:** See `BACKEND_API_DOCUMENTATION_INDEX.md`
- **Authentication Guide:** See `AUTH_VERIFICATION_GUIDE.md`
- **Payment Integration:** See `PAYMENT_TO_SHIPROCKET_FLOW.md`
- **FCM Setup:** See `FCM_IMPLEMENTATION_SUMMARY.md`

---

**Last Updated:** October 15, 2025  
**Backend Version:** Production (Docker)  
**Deployment:** Contabo Server

---

## 🚀 Ready to Deploy?

Once you've configured everything:

1. ✅ Update your API configuration
2. ✅ Test the connection
3. ✅ Build your production app
4. ✅ Deploy to app stores

**Your backend is live and ready to serve your app!** 🎉
