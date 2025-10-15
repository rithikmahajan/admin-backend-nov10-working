# 🚀 Yoraa Backend - Quick Reference Card

## 📍 Production Server Details

| Item | Value |
|------|-------|
| **Server IP** | `185.193.19.244` |
| **Port** | `8080` |
| **Status** | ✅ Live & Healthy |
| **Protocol** | HTTP (HTTPS setup pending) |
| **Database** | MongoDB Atlas (Cloud) |
| **Deployed** | October 11, 2025 |
| **Container** | Docker (yoraa-api-prod) |

---

## 🌐 API URLs

```
Health Check:    http://185.193.19.244:8080/health
API Base URL:    http://185.193.19.244:8080/api
```

---

## 📱 Frontend Configuration

### **React Native / Expo**
```javascript
const API_BASE_URL = 'http://185.193.19.244:8080/api';
```

### **iOS (Swift)**
```swift
let API_BASE_URL = "http://185.193.19.244:8080/api"
```

### **Android (Kotlin)**
```kotlin
const val API_BASE_URL = "http://185.193.19.244:8080/api/"
```

### **React / Next.js**
```javascript
const API_BASE_URL = 'http://185.193.19.244:8080/api';
```

---

## 🔑 Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Email/Password login |
| `/api/auth/loginFirebase` | POST | Google/Apple/Phone login |
| `/api/profile` | GET | Get user profile |
| `/api/categories` | GET | Get all categories |
| `/api/products` | GET | Get all products |
| `/api/cart` | GET | Get user's cart |
| `/api/orders` | POST | Create order |

---

## 🧪 Quick Test

### Test Backend Health
```bash
curl http://185.193.19.244:8080/health
```

### Test API Endpoint
```bash
curl http://185.193.19.244:8080/api/categories
```

### Test Authentication
```bash
curl -X POST http://185.193.19.244:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 🔐 Authentication Flow

1. **Login** → Get token from `/api/auth/login` or `/api/auth/loginFirebase`
2. **Store Token** → Save in AsyncStorage/Keychain/SharedPreferences
3. **Use Token** → Add `Authorization: Bearer {token}` to all requests
4. **Handle 401** → Clear token and redirect to login

### Example Request with Auth
```javascript
fetch('http://185.193.19.244:8080/api/profile', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json',
  }
})
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details"
}
```

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| **Cannot connect** | Check URL: `http://185.193.19.244:8080/api` |
| **401 Unauthorized** | Check auth token in request headers |
| **Timeout** | Increase timeout to 30s |
| **CORS error** | Backend has CORS enabled - check your request |

---

## 📞 Backend Team Contact

- **Email:** contact@yoraa.in
- **Server IP:** 185.193.19.244
- **Status Page:** http://185.193.19.244:8080/health

---

## 📄 Full Documentation

See **`FRONTEND_PRODUCTION_CONFIG.md`** for complete integration guide with:
- Platform-specific code examples
- All API endpoints
- Error handling
- Best practices
- Security guidelines

---

**Last Updated:** October 11, 2025  
**Status:** ✅ Production Ready
