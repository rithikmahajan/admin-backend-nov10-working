# 🚀 Backend Production API - Frontend Team Handoff

## ✅ Status: LIVE & READY

Your backend API is deployed and ready for integration!

---

## 🌐 Production API URL

```
http://185.193.19.244:8080/api
```

**Test it now:**
```bash
curl http://185.193.19.244:8080/health
```

---

## ⚡ Quick Start (3 Steps)

### **Step 1: Update Your API Configuration**

**React Native / JavaScript:**
```javascript
const API_BASE_URL = 'http://185.193.19.244:8080/api';
```

**iOS (Swift):**
```swift
let API_BASE_URL = "http://185.193.19.244:8080/api"
```

**Android (Kotlin):**
```kotlin
const val API_BASE_URL = "http://185.193.19.244:8080/api/"
```

### **Step 2: Test Connection**
```javascript
fetch('http://185.193.19.244:8080/health')
  .then(res => res.json())
  .then(data => console.log('✅ Backend connected:', data))
  .catch(err => console.error('❌ Backend error:', err));
```

### **Step 3: Start Building!**
All your existing API calls will work - just update the base URL.

---

## 🔑 Authentication

### **Login Request**
```javascript
POST http://185.193.19.244:8080/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### **Response**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### **Use Token in Requests**
```javascript
fetch('http://185.193.19.244:8080/api/profile', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json'
  }
})
```

---

## 📋 Common Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/loginFirebase` | POST | Login with Google/Apple/Phone |
| `/api/profile` | GET | Get user profile (auth required) |
| `/api/categories` | GET | Get all categories |
| `/api/products` | GET | Get all products |
| `/api/cart` | GET | Get user's cart (auth required) |
| `/api/cart/add` | POST | Add item to cart (auth required) |
| `/api/orders` | POST | Create order (auth required) |

---

## 📚 Full Documentation

For complete integration guide with code examples for all platforms:

**📄 Read: `FRONTEND_PRODUCTION_CONFIG.md`**

This includes:
- Platform-specific code examples (iOS, Android, React Native, Web)
- All API endpoints with request/response examples
- Authentication flow
- Error handling
- Best practices

**📄 Quick Reference: `QUICK_REFERENCE.md`**

---

## 🧪 Test These First

Before building features, test these endpoints:

```bash
# 1. Health check
curl http://185.193.19.244:8080/health

# 2. Get categories
curl http://185.193.19.244:8080/api/categories

# 3. Get products
curl http://185.193.19.244:8080/api/products
```

All should return JSON responses. If they do, you're good to go! ✅

---

## 🆘 Having Issues?

### **Cannot connect to API**
- ✅ Check URL: `http://185.193.19.244:8080/api`
- ✅ Check internet connection
- ✅ Try in browser: http://185.193.19.244:8080/health

### **401 Unauthorized**
- ✅ Include auth token in headers: `Authorization: Bearer {token}`
- ✅ Token format: `Bearer YOUR_TOKEN_HERE`

### **Other Issues**
- 📧 Contact: contact@yoraa.in
- 🌐 Check status: http://185.193.19.244:8080/health

---

## 📱 What Changed?

**Before (Development):**
```javascript
const API_URL = 'http://localhost:8080/api';
```

**Now (Production):**
```javascript
const API_URL = 'http://185.193.19.244:8080/api';
```

That's it! Everything else stays the same. 🎉

---

## ✅ Integration Checklist

- [ ] Update API base URL in your code
- [ ] Test health endpoint
- [ ] Test login/register
- [ ] Test product listing
- [ ] Test cart operations
- [ ] Test order placement
- [ ] Test on real devices
- [ ] Report any issues

---

## 📞 Support

- **Backend Status:** http://185.193.19.244:8080/health
- **Documentation:** `FRONTEND_PRODUCTION_CONFIG.md`
- **Email:** contact@yoraa.in

---

**Backend Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Deployed:** October 11, 2025

**Happy Coding! 🚀**
