# 🎯 Frontend Integration - One Page Reference

## 📍 Production Server
```
IP:     185.193.19.244
Port:   8080
API:    http://185.193.19.244:8080/api
Health: http://185.193.19.244:8080/health
```

---

## ⚡ Quick Setup

### React Native
```javascript
// .env.production
API_BASE_URL=http://185.193.19.244:8080/api

// api.js
import axios from 'axios';
const api = axios.create({
  baseURL: 'http://185.193.19.244:8080/api',
  timeout: 30000,
});
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;
```

### Flutter
```dart
// api_config.dart
class ApiConfig {
  static const baseUrl = 'http://185.193.19.244:8080/api';
  static const timeout = 30000;
}

// api_service.dart
final dio = Dio(BaseOptions(
  baseUrl: ApiConfig.baseUrl,
  connectTimeout: Duration(milliseconds: 30000),
));
dio.interceptors.add(InterceptorsWrapper(
  onRequest: (options, handler) async {
    final token = await getAuthToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    return handler.next(options);
  },
));
```

---

## 📱 Platform Config

### iOS (Info.plist)
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSExceptionDomains</key>
  <dict>
    <key>185.193.19.244</key>
    <dict>
      <key>NSExceptionAllowsInsecureHTTPLoads</key>
      <true/>
    </dict>
  </dict>
</dict>
```

### Android (network_security_config.xml)
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">185.193.19.244</domain>
    </domain-config>
</network-security-config>
```

### Android (AndroidManifest.xml)
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

---

## 🔗 Key Endpoints

```
GET    /health                    - Health check
POST   /api/auth/login            - Login
POST   /api/auth/register         - Register
POST   /api/auth/send-otp         - Send OTP
POST   /api/auth/verify-otp       - Verify OTP
GET    /api/products              - List products
GET    /api/products/:id          - Get product
GET    /api/categories            - List categories
GET    /api/cart                  - Get cart
POST   /api/cart/add              - Add to cart
POST   /api/orders/create         - Create order
GET    /api/orders                - Get orders
GET    /api/profile               - Get profile
PUT    /api/profile               - Update profile
POST   /api/razorpay/create-order - Create payment
POST   /api/razorpay/verify       - Verify payment
```

---

## 🧪 Test Connection

### Browser
```
http://185.193.19.244:8080/health
```

### JavaScript
```javascript
fetch('http://185.193.19.244:8080/health')
  .then(res => res.json())
  .then(data => console.log('✅', data));
```

### Dart
```dart
final res = await dio.get('http://185.193.19.244:8080/health');
print('✅ ${res.data}');
```

---

## 🔐 Auth Flow

### Login Request
```javascript
POST /api/auth/login
{
  "phone": "9876543210",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "user": {...}
}
```

### Use Token
```javascript
headers: {
  'Authorization': 'Bearer ' + token
}
```

---

## 🚨 Error Handling

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - logout
      clearToken();
      navigateToLogin();
    }
    return Promise.reject(error);
  }
);
```

---

## ✅ Checklist

- [ ] Update API_BASE_URL
- [ ] Configure iOS Info.plist
- [ ] Configure Android network_security_config.xml
- [ ] Add auth interceptor
- [ ] Test health endpoint
- [ ] Test login
- [ ] Test authenticated requests
- [ ] Handle 401 errors
- [ ] Add loading states
- [ ] Add error messages
- [ ] Test on device

---

## 📚 Full Docs

- **Complete Guide:** `FRONTEND_PRODUCTION_SETUP_CONTABO.md`
- **Quick Setup:** `FRONTEND_QUICK_SETUP.md`
- **Diagrams:** `FRONTEND_INTEGRATION_DIAGRAM.md`
- **Index:** `FRONTEND_TEAM_README.md`

---

**Status:** ✅ Live | **Date:** Oct 15, 2025 | **Server:** Contabo
