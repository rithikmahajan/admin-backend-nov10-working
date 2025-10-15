# 📚 Frontend Team - Complete Documentation Index

## 🎯 Quick Navigation

This folder contains all the documentation your frontend team needs to integrate with the production backend on Contabo.

---

## 📖 Main Documentation Files

### 1️⃣ **FRONTEND_PRODUCTION_SETUP_CONTABO.md** ⭐ START HERE
**📄 Complete Setup Guide**
- Detailed configuration for all platforms (React Native, Flutter, Web)
- Step-by-step integration instructions
- Code examples and best practices
- Troubleshooting guide
- Security configurations

**Use this for:** Complete reference and detailed setup

---

### 2️⃣ **FRONTEND_QUICK_SETUP.md** ⚡ QUICK START
**📄 Quick Reference Card**
- Copy-paste ready configurations
- Minimal setup instructions
- Essential code snippets
- Platform-specific quick configs

**Use this for:** Fast setup, quick reference during development

---

### 3️⃣ **FRONTEND_INTEGRATION_DIAGRAM.md** 🎨 VISUAL GUIDE
**📄 Architecture & Flow Diagrams**
- Visual architecture overview
- Request flow diagrams
- Authentication flow
- API endpoint structure
- Platform-specific setup visuals

**Use this for:** Understanding the big picture, team presentations

---

## 🚀 Production Server Details

| Item | Value |
|------|-------|
| **Server IP** | `185.193.19.244` |
| **Port** | `8080` |
| **API Base URL** | `http://185.193.19.244:8080/api` |
| **Health Check** | `http://185.193.19.244:8080/health` |
| **Environment** | `Production` |
| **Deployment** | Docker (Contabo Server) |
| **Status** | ✅ Live & Healthy |

---

## 🔗 Quick Copy-Paste Configs

### React Native / JavaScript
```javascript
const API_BASE_URL = 'http://185.193.19.244:8080/api';
```

### Flutter / Dart
```dart
static const String baseUrl = 'http://185.193.19.244:8080/api';
```

### Web / React / Next.js
```env
REACT_APP_API_URL=http://185.193.19.244:8080/api
NEXT_PUBLIC_API_URL=http://185.193.19.244:8080/api
```

---

## 📱 Platform-Specific Setup

### iOS Configuration Required
✅ Update `Info.plist` to allow HTTP connections  
📄 See: **FRONTEND_PRODUCTION_SETUP_CONTABO.md** → iOS Section

### Android Configuration Required
✅ Add `network_security_config.xml`  
✅ Update `AndroidManifest.xml`  
📄 See: **FRONTEND_PRODUCTION_SETUP_CONTABO.md** → Android Section

---

## 🧪 Testing Your Connection

### Quick Health Check
Open in browser or curl:
```
http://185.193.19.244:8080/health
```

Expected Response:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-10-15T12:00:00.000Z"
}
```

### Test in Your App
```javascript
// JavaScript/React Native
fetch('http://185.193.19.244:8080/health')
  .then(res => res.json())
  .then(data => console.log('✅ Connected:', data));
```

```dart
// Flutter
final response = await dio.get('http://185.193.19.244:8080/health');
print('✅ Connected: ${response.data}');
```

---

## 🔐 Authentication

### Login Endpoint
```
POST http://185.193.19.244:8080/api/auth/login
```

### Request Body
```json
{
  "phone": "9876543210",
  "password": "your_password"
}
```

### Response
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "phone": "9876543210",
    "name": "User Name"
  }
}
```

### Using Token in Requests
```javascript
// Add to headers
headers: {
  'Authorization': 'Bearer ' + token
}
```

---

## 📋 Key API Endpoints

| Function | Method | Endpoint |
|----------|--------|----------|
| **Health Check** | GET | `/health` |
| **Login** | POST | `/api/auth/login` |
| **Register** | POST | `/api/auth/register` |
| **Send OTP** | POST | `/api/auth/send-otp` |
| **Verify OTP** | POST | `/api/auth/verify-otp` |
| **Get Products** | GET | `/api/products` |
| **Get Categories** | GET | `/api/categories` |
| **Get Cart** | GET | `/api/cart` |
| **Add to Cart** | POST | `/api/cart/add` |
| **Create Order** | POST | `/api/orders/create` |
| **Get Orders** | GET | `/api/orders` |
| **Get Profile** | GET | `/api/profile` |
| **Update Profile** | PUT | `/api/profile` |
| **Create Payment** | POST | `/api/razorpay/create-order` |
| **Verify Payment** | POST | `/api/razorpay/verify-payment` |

---

## 🎓 Related Backend Documentation

These files provide additional context about the backend:

| File | Description |
|------|-------------|
| `BACKEND_API_DOCUMENTATION_INDEX.md` | Complete API documentation |
| `AUTH_VERIFICATION_GUIDE.md` | Authentication & authorization details |
| `PAYMENT_TO_SHIPROCKET_FLOW.md` | Payment & order flow |
| `FCM_IMPLEMENTATION_SUMMARY.md` | Push notification setup |
| `QUICK_REFERENCE.md` | Backend quick reference |

---

## 🔧 Development Workflow

### Step 1: Read Documentation
1. Start with **FRONTEND_PRODUCTION_SETUP_CONTABO.md**
2. Use **FRONTEND_QUICK_SETUP.md** for quick reference
3. Review **FRONTEND_INTEGRATION_DIAGRAM.md** for architecture

### Step 2: Configure Your App
1. Update API base URL
2. Configure iOS/Android for HTTP
3. Set up API client (axios/dio)
4. Add authentication interceptors

### Step 3: Test Connection
1. Test health endpoint
2. Test login/authentication
3. Test key features

### Step 4: Deploy
1. Build production app
2. Test on physical devices
3. Deploy to app stores

---

## 🚨 Important Notes

### ⚠️ HTTP vs HTTPS
- Currently using **HTTP** (not HTTPS)
- iOS requires specific configuration for HTTP
- Android 9+ requires network security config
- Consider HTTPS for production apps

### 🔐 Security
- Always store tokens securely
  - React Native: AsyncStorage (encrypted)
  - Flutter: flutter_secure_storage
  - Web: localStorage/sessionStorage
- Never log tokens in production
- Implement token refresh logic
- Handle 401 errors (logout & redirect)

### 📱 Network Handling
- Add loading states
- Handle network errors gracefully
- Implement retry logic
- Show user-friendly error messages
- Test on slow/poor connections

---

## ✅ Pre-Deployment Checklist

- [ ] **Configuration**
  - [ ] Updated API_BASE_URL to production
  - [ ] Set appropriate timeout values
  - [ ] Configured environment variables

- [ ] **Platform Setup**
  - [ ] iOS: Updated Info.plist for HTTP
  - [ ] Android: Added network_security_config.xml
  - [ ] Android: Updated AndroidManifest.xml

- [ ] **API Integration**
  - [ ] Created API client
  - [ ] Added request interceptor (auth)
  - [ ] Added response interceptor (errors)
  - [ ] Implemented token storage

- [ ] **Testing**
  - [ ] Health endpoint test ✓
  - [ ] Login/authentication test ✓
  - [ ] Product listing test ✓
  - [ ] Cart operations test ✓
  - [ ] Order creation test ✓
  - [ ] Payment flow test ✓

- [ ] **Error Handling**
  - [ ] Network errors
  - [ ] Authentication errors (401)
  - [ ] Validation errors (400)
  - [ ] Server errors (500)
  - [ ] Timeout errors

- [ ] **User Experience**
  - [ ] Loading states
  - [ ] Error messages
  - [ ] Success feedback
  - [ ] Offline handling

- [ ] **Production Ready**
  - [ ] Tested on physical devices
  - [ ] Tested on slow networks
  - [ ] Removed debug logs
  - [ ] Added analytics/monitoring
  - [ ] Ready for app store submission

---

## 🆘 Need Help?

### Backend Status Check
```bash
curl http://185.193.19.244:8080/health
```

### Common Issues & Solutions

**Issue:** Cannot connect to API  
**Solution:** Check health endpoint, verify internet connection, check iOS/Android config

**Issue:** 401 Unauthorized errors  
**Solution:** Verify token is sent in headers, re-login to get fresh token

**Issue:** Timeout errors  
**Solution:** Increase timeout value, check network stability

**Issue:** CORS errors (Web only)  
**Solution:** Backend has CORS enabled, check request headers

### Documentation Files
- Detailed troubleshooting: `FRONTEND_PRODUCTION_SETUP_CONTABO.md`
- Quick fixes: `FRONTEND_QUICK_SETUP.md`
- Backend reference: `BACKEND_API_DOCUMENTATION_INDEX.md`

---

## 📞 Backend Team Contact

### Server Information
- **IP:** 185.193.19.244
- **Container:** yoraa-api-prod
- **Deploy Path:** /opt/yoraa-backend

### Backend Status Commands
```bash
# Check container status
ssh root@185.193.19.244 'docker ps --filter name=yoraa'

# View logs
ssh root@185.193.19.244 'cd /opt/yoraa-backend && docker compose logs -f'

# Restart backend
ssh root@185.193.19.244 'cd /opt/yoraa-backend && docker compose restart'
```

---

## 🎯 Getting Started Right Now

### Option 1: Quick Start (5 minutes)
1. Open **FRONTEND_QUICK_SETUP.md**
2. Copy the config for your platform
3. Test the health endpoint
4. Start building!

### Option 2: Complete Setup (30 minutes)
1. Read **FRONTEND_PRODUCTION_SETUP_CONTABO.md**
2. Follow step-by-step instructions
3. Review **FRONTEND_INTEGRATION_DIAGRAM.md**
4. Implement & test thoroughly

### Option 3: Visual Understanding (10 minutes)
1. Start with **FRONTEND_INTEGRATION_DIAGRAM.md**
2. Understand the architecture
3. Follow the flow diagrams
4. Use as reference during development

---

## 🚀 You're Ready!

Your backend is **live and healthy** on Contabo server at `185.193.19.244:8080`.

All you need to do is:
1. ✅ Update your API configuration
2. ✅ Configure platform-specific settings
3. ✅ Test the connection
4. ✅ Build your app

**The backend is ready to serve your app!** 🎉

---

## 📝 Quick Reference

```javascript
// ONE-LINE SETUP
const API = 'http://185.193.19.244:8080/api';
```

```dart
// ONE-LINE SETUP
static const API = 'http://185.193.19.244:8080/api';
```

---

**Last Updated:** October 15, 2025  
**Backend Status:** ✅ Live on Contabo  
**Deployment Type:** Docker Production  
**Health Check:** http://185.193.19.244:8080/health

**Start with:** `FRONTEND_PRODUCTION_SETUP_CONTABO.md` 📖
