# 🚀 Frontend Quick Setup - Contabo Production

## ⚡ TL;DR - Copy & Paste Configuration

### 📍 Production Server
```
IP: 185.193.19.244
Port: 8080
API: http://185.193.19.244:8080/api
```

---

## 🎯 React Native / Expo

### .env.production
```env
API_BASE_URL=http://185.193.19.244:8080/api
```

### Quick Config
```javascript
const API_CONFIG = {
  BASE_URL: 'http://185.193.19.244:8080/api',
  TIMEOUT: 30000,
};

import axios from 'axios';
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Add token
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

## 🎯 Flutter

### api_config.dart
```dart
class ApiConfig {
  static const String baseUrl = 'http://185.193.19.244:8080/api';
  static const int timeout = 30000;
}
```

### Quick Setup
```dart
import 'package:dio/dio.dart';

final dio = Dio(BaseOptions(
  baseUrl: 'http://185.193.19.244:8080/api',
  connectTimeout: Duration(milliseconds: 30000),
  receiveTimeout: Duration(milliseconds: 30000),
));

// Add token
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

## 🎯 Web (React/Vue/Next.js)

### .env.production
```env
REACT_APP_API_URL=http://185.193.19.244:8080/api
NEXT_PUBLIC_API_URL=http://185.193.19.244:8080/api
VUE_APP_API_URL=http://185.193.19.244:8080/api
```

### Quick Config
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://185.193.19.244:8080/api';

import axios from 'axios';
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});
```

---

## 📱 iOS Configuration (Info.plist)

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

---

## 📱 Android Configuration

### network_security_config.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">185.193.19.244</domain>
    </domain-config>
</network-security-config>
```

### AndroidManifest.xml
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

---

## ✅ Test Connection

### Browser
```
http://185.193.19.244:8080/health
```

### Terminal
```bash
curl http://185.193.19.244:8080/health
```

### In App (JavaScript)
```javascript
fetch('http://185.193.19.244:8080/health')
  .then(res => res.json())
  .then(data => console.log('✅ Connected:', data))
  .catch(err => console.error('❌ Failed:', err));
```

### In App (Flutter)
```dart
final response = await dio.get('http://185.193.19.244:8080/health');
print('✅ Connected: ${response.data}');
```

---

## 🔗 Key Endpoints

| Endpoint | URL |
|----------|-----|
| Health | `http://185.193.19.244:8080/health` |
| Login | `http://185.193.19.244:8080/api/auth/login` |
| Products | `http://185.193.19.244:8080/api/products` |
| Categories | `http://185.193.19.244:8080/api/categories` |
| Cart | `http://185.193.19.244:8080/api/cart` |
| Orders | `http://185.193.19.244:8080/api/orders` |
| Profile | `http://185.193.19.244:8080/api/profile` |

---

## 🚨 Common Issues

### Cannot Connect
- Check backend: `curl http://185.193.19.244:8080/health`
- Verify internet connection
- Check iOS/Android network config

### 401 Unauthorized
- Verify auth token is sent
- Re-login to refresh token

### Timeout
- Increase timeout value
- Check network speed

---

## 📖 Full Documentation
See `FRONTEND_PRODUCTION_SETUP_CONTABO.md` for detailed setup guide.

---

**Backend Status:** ✅ Live on Contabo  
**Last Updated:** October 15, 2025
