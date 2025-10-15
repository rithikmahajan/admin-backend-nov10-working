# 🎉 Backend Production Deployment - Frontend Configuration Guide

## ✅ Deployment Status: **LIVE & HEALTHY**

Your Yoraa backend is now successfully deployed on Contabo using Docker and is ready for frontend/mobile app integration!

---

## 🌐 Production API Details

### **Base Configuration**
```
Server IP:        185.193.19.244
Port:             8080
Protocol:         HTTP (HTTPS setup guide included below)
Status:           ✅ Healthy & Running
Database:         MongoDB Atlas (Cloud)
Container:        Docker (yoraa-api-prod)
```

### **API Endpoints**
```
Health Check:     http://185.193.19.244:8080/health
API Base URL:     http://185.193.19.244:8080/api
```

---

## 📱 Frontend Integration Guide

### **React Native / Expo**

#### 1. Create/Update API Configuration File
Create `src/config/api.config.js`:

```javascript
// API Configuration
const ENV = {
  dev: {
    apiUrl: 'http://localhost:8080/api',
    wsUrl: 'ws://localhost:8080',
  },
  staging: {
    apiUrl: 'http://185.193.19.244:8080/api',
    wsUrl: 'ws://185.193.19.244:8080',
  },
  production: {
    apiUrl: 'http://185.193.19.244:8080/api',
    wsUrl: 'ws://185.193.19.244:8080',
  }
};

const getEnvVars = () => {
  // You can use react-native-dotenv or environment variables
  if (__DEV__) {
    return ENV.dev;
  }
  return ENV.production;
};

export default getEnvVars();
```

#### 2. Update API Service
```javascript
// src/services/api.service.js
import axios from 'axios';
import config from '../config/api.config';

// Create axios instance with production config
const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear auth and redirect to login
      AsyncStorage.removeItem('@auth_token');
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### 3. Example API Calls
```javascript
// src/services/auth.service.js
import api from './api.service';

export const authService = {
  // Login with email/password
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Firebase login (Google, Apple, Phone)
  loginWithFirebase: async (idToken) => {
    const response = await api.post('/auth/loginFirebase', { idToken });
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData);
    return response.data;
  },
};

// src/services/product.service.js
export const productService = {
  // Get all categories
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Get products
  getProducts: async (filters) => {
    const response = await api.get('/products', { params: filters });
    return response.data;
  },

  // Get product by ID
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
};

// src/services/cart.service.js
export const cartService = {
  // Get cart
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  // Add to cart
  addToCart: async (productId, quantity, variantId) => {
    const response = await api.post('/cart/add', {
      productId,
      quantity,
      variantId,
    });
    return response.data;
  },

  // Update cart item
  updateCartItem: async (itemId, quantity) => {
    const response = await api.put(`/cart/${itemId}`, { quantity });
    return response.data;
  },

  // Remove from cart
  removeFromCart: async (itemId) => {
    const response = await api.delete(`/cart/${itemId}`);
    return response.data;
  },
};
```

---

### **iOS (Swift/SwiftUI)**

#### 1. Create API Configuration
```swift
// Config/APIConfig.swift
import Foundation

struct APIConfig {
    static let baseURL = "http://185.193.19.244:8080/api"
    static let timeout: TimeInterval = 30.0
    
    enum Endpoint {
        case health
        case login
        case loginFirebase
        case profile
        case categories
        case products
        case cart
        
        var path: String {
            switch self {
            case .health: return "/health"
            case .login: return "/auth/login"
            case .loginFirebase: return "/auth/loginFirebase"
            case .profile: return "/profile"
            case .categories: return "/categories"
            case .products: return "/products"
            case .cart: return "/cart"
            }
        }
        
        var url: URL {
            return URL(string: APIConfig.baseURL + path)!
        }
    }
}
```

#### 2. Create API Service
```swift
// Services/APIService.swift
import Foundation

class APIService {
    static let shared = APIService()
    
    private init() {}
    
    func request<T: Codable>(
        endpoint: APIConfig.Endpoint,
        method: String = "GET",
        body: [String: Any]? = nil
    ) async throws -> T {
        var request = URLRequest(url: endpoint.url)
        request.httpMethod = method
        request.timeoutInterval = APIConfig.timeout
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth token if available
        if let token = UserDefaults.standard.string(forKey: "auth_token") {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add body if present
        if let body = body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode(T.self, from: data)
    }
}

enum APIError: Error {
    case invalidResponse
    case httpError(Int)
}
```

---

### **Android (Kotlin)**

#### 1. Create API Configuration
```kotlin
// config/ApiConfig.kt
object ApiConfig {
    const val BASE_URL = "http://185.193.19.244:8080/api/"
    const val TIMEOUT = 30L // seconds
}
```

#### 2. Setup Retrofit
```kotlin
// network/ApiService.kt
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import java.util.concurrent.TimeUnit

// Create OkHttp client with interceptor
val loggingInterceptor = HttpLoggingInterceptor().apply {
    level = HttpLoggingInterceptor.Level.BODY
}

val authInterceptor = Interceptor { chain ->
    val token = SharedPreferencesHelper.getAuthToken()
    val request = chain.request().newBuilder()
        .apply {
            if (token != null) {
                addHeader("Authorization", "Bearer $token")
            }
        }
        .build()
    chain.proceed(request)
}

val okHttpClient = OkHttpClient.Builder()
    .addInterceptor(loggingInterceptor)
    .addInterceptor(authInterceptor)
    .connectTimeout(ApiConfig.TIMEOUT, TimeUnit.SECONDS)
    .readTimeout(ApiConfig.TIMEOUT, TimeUnit.SECONDS)
    .writeTimeout(ApiConfig.TIMEOUT, TimeUnit.SECONDS)
    .build()

// Create Retrofit instance
val retrofit = Retrofit.Builder()
    .baseUrl(ApiConfig.BASE_URL)
    .client(okHttpClient)
    .addConverterFactory(GsonConverterFactory.create())
    .build()

// API Interface
interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body credentials: LoginRequest): Response<LoginResponse>
    
    @POST("auth/loginFirebase")
    suspend fun loginFirebase(@Body token: FirebaseTokenRequest): Response<LoginResponse>
    
    @GET("profile")
    suspend fun getProfile(): Response<UserProfile>
    
    @PUT("profile")
    suspend fun updateProfile(@Body profile: UpdateProfileRequest): Response<UserProfile>
    
    @GET("categories")
    suspend fun getCategories(): Response<CategoriesResponse>
    
    @GET("products")
    suspend fun getProducts(@QueryMap filters: Map<String, String>): Response<ProductsResponse>
    
    @GET("cart")
    suspend fun getCart(): Response<CartResponse>
    
    @POST("cart/add")
    suspend fun addToCart(@Body item: AddToCartRequest): Response<CartResponse>
}

object ApiClient {
    val apiService: ApiService by lazy {
        retrofit.create(ApiService::class.java)
    }
}
```

---

### **Web (React/Next.js)**

#### 1. Create API Configuration
```javascript
// config/api.config.js
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:8080/api',
  },
  production: {
    baseURL: 'http://185.193.19.244:8080/api',
  },
};

export const getApiConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return API_CONFIG[env];
};

export default getApiConfig();
```

#### 2. Create API Client
```javascript
// services/api.client.js
import axios from 'axios';
import apiConfig from '../config/api.config';

const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 🔧 Available API Endpoints

### **Authentication Endpoints**
```
POST   /api/auth/register               - Register new user
POST   /api/auth/login                  - Login with email/password
POST   /api/auth/loginFirebase          - Login with Firebase (Google/Apple/Phone)
POST   /api/auth/logout                 - Logout user
POST   /api/auth/forgot-password        - Request password reset
POST   /api/auth/reset-password         - Reset password
POST   /api/auth/verify-otp             - Verify OTP
POST   /api/auth/resend-otp             - Resend OTP
POST   /api/auth/link-account           - Link authentication provider
```

### **User Profile Endpoints**
```
GET    /api/profile                     - Get user profile
PUT    /api/profile                     - Update user profile
DELETE /api/profile                     - Delete user account
GET    /api/profile/orders              - Get user orders
GET    /api/profile/addresses           - Get user addresses
POST   /api/profile/addresses           - Add new address
PUT    /api/profile/addresses/:id       - Update address
DELETE /api/profile/addresses/:id       - Delete address
```

### **Product Endpoints**
```
GET    /api/categories                  - Get all categories
GET    /api/categories/:id              - Get category by ID
GET    /api/products                    - Get all products (with filters)
GET    /api/products/:id                - Get product by ID
GET    /api/products/search             - Search products
GET    /api/products/featured           - Get featured products
GET    /api/products/new                - Get new arrivals
```

### **Cart Endpoints**
```
GET    /api/cart                        - Get user's cart
POST   /api/cart/add                    - Add item to cart
PUT    /api/cart/:itemId                - Update cart item quantity
DELETE /api/cart/:itemId                - Remove item from cart
DELETE /api/cart                        - Clear entire cart
```

### **Order Endpoints**
```
POST   /api/orders                      - Create new order
GET    /api/orders                      - Get user's orders
GET    /api/orders/:id                  - Get order details
PUT    /api/orders/:id/cancel           - Cancel order
GET    /api/orders/:id/track            - Track order
```

### **Wishlist Endpoints**
```
GET    /api/wishlist                    - Get user's wishlist
POST   /api/wishlist/add                - Add to wishlist
DELETE /api/wishlist/:productId         - Remove from wishlist
```

### **Review Endpoints**
```
POST   /api/products/:id/reviews        - Add product review
GET    /api/products/:id/reviews        - Get product reviews
PUT    /api/reviews/:id                 - Update review
DELETE /api/reviews/:id                 - Delete review
```

---

## 🧪 Testing the API

### **Health Check**
```bash
curl http://185.193.19.244:8080/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2025-10-11T17:44:58.000Z",
  "memory": {
    "rss": 192163840,
    "heapTotal": 121896960,
    "heapUsed": 114115424
  }
}
```

### **Get Categories**
```bash
curl http://185.193.19.244:8080/api/categories
```

### **Login Test**
```bash
curl -X POST http://185.193.19.244:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### **Get Profile (with auth token)**
```bash
curl http://185.193.19.244:8080/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔒 Security & Best Practices

### **1. Always Use HTTPS in Production**
While the current setup uses HTTP, you should setup SSL/HTTPS for production:
- Use Nginx as reverse proxy
- Get free SSL certificate from Let's Encrypt
- Update all API calls to use `https://`

See `CONTABO_DEPLOYMENT_GUIDE.md` for SSL setup instructions.

### **2. Environment Variables**
Never hardcode API URLs in your code. Use environment variables:

**React Native:**
```javascript
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://185.193.19.244:8080/api';
```

**iOS:**
Use `.xcconfig` files or Info.plist

**Android:**
Use `BuildConfig` or `local.properties`

### **3. Error Handling**
Always handle network errors gracefully:
```javascript
try {
  const response = await api.get('/products');
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Server error:', error.response.status);
  } else if (error.request) {
    // Request made but no response
    console.error('Network error');
  } else {
    // Other errors
    console.error('Error:', error.message);
  }
}
```

### **4. Request Timeout**
Set appropriate timeouts for requests:
```javascript
const api = axios.create({
  baseURL: 'http://185.193.19.244:8080/api',
  timeout: 30000, // 30 seconds
});
```

### **5. Token Management**
- Store auth tokens securely (Keychain/Keystore)
- Implement token refresh logic
- Clear tokens on logout
- Handle 401 responses globally

---

## 📊 Backend Status & Monitoring

### **Check Backend Status**
```bash
# Health check
curl http://185.193.19.244:8080/health

# Check if server is responding
ping 185.193.19.244

# Test specific endpoint
curl http://185.193.19.244:8080/api/categories
```

### **Backend Logs** (For Backend Team)
```bash
ssh root@185.193.19.244 'cd /opt/yoraa-backend && docker compose logs -f'
```

---

## 🆘 Troubleshooting

### **Issue: Cannot connect to API**
**Solutions:**
1. Check if server is running: `curl http://185.193.19.244:8080/health`
2. Check network connectivity
3. Verify firewall allows port 8080
4. Check if you're using correct URL

### **Issue: 401 Unauthorized**
**Solutions:**
1. Check if auth token is included in request headers
2. Verify token is valid and not expired
3. Re-login to get new token

### **Issue: Slow API responses**
**Solutions:**
1. Check network connection
2. Contact backend team - might be server issue
3. Implement request caching

### **Issue: CORS errors (Web only)**
**Solution:**
Backend already has CORS enabled. If still seeing errors:
1. Verify you're using correct API URL
2. Check browser console for specific error
3. Contact backend team if issue persists

---

## 📞 Support & Contact

### **Backend Team Contact**
- **Email:** contact@yoraa.in
- **Server IP:** 185.193.19.244
- **Backend Status:** Check `/health` endpoint

### **Important URLs**
- **API Base:** `http://185.193.19.244:8080/api`
- **Health Check:** `http://185.193.19.244:8080/health`
- **Documentation:** This file

### **For Backend Issues:**
Backend team can check logs using:
```bash
ssh root@185.193.19.244 'cd /opt/yoraa-backend && docker compose logs -f'
```

---

## ✅ Integration Checklist

Frontend team should complete:

- [ ] Update API base URL to production
- [ ] Test health endpoint
- [ ] Test authentication (login/register)
- [ ] Test product listing
- [ ] Test cart operations
- [ ] Test order placement
- [ ] Implement error handling
- [ ] Implement token refresh
- [ ] Test on different networks
- [ ] Test with actual devices
- [ ] Update environment variables
- [ ] Document any issues found

---

## 🚀 Quick Start for Frontend Developers

**1. Update your API configuration:**
```javascript
const API_BASE_URL = 'http://185.193.19.244:8080/api';
```

**2. Test the connection:**
```javascript
fetch('http://185.193.19.244:8080/health')
  .then(res => res.json())
  .then(data => console.log('Backend is healthy:', data))
  .catch(err => console.error('Backend error:', err));
```

**3. Implement authentication:**
- Use `/api/auth/login` for email/password
- Use `/api/auth/loginFirebase` for Google/Apple/Phone
- Store the returned token
- Add token to all subsequent requests

**4. Start building features!**

---

**Last Updated:** October 11, 2025  
**Backend Version:** Production v1.0  
**Status:** ✅ Live & Healthy  
**Deployed:** Docker on Contabo VPS

🎉 **Happy Coding!**
