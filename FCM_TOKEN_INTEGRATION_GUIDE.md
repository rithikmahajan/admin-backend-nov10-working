# 🔥 FCM Token Integration Guide for Frontend Team

## 📋 Overview
This guide explains how to properly integrate Firebase Cloud Messaging (FCM) token registration with our Node.js backend for push notifications in the React Native app.

---

## 🚨 Critical Issue Identified

### ❌ Problem
The current implementation is **missing Step 3** of the correct authentication flow:
- ✅ User signs in with Firebase
- ✅ App receives Firebase ID token
- ❌ **MISSING: Send FCM token to backend**
- ✅ Backend verifies ID token
- ❌ **MISSING: Backend stores FCM token**
- ⚠️ Backend can't send push notifications (no FCM token stored)

### ✅ Solution
New endpoint created: `POST /api/users/update-fcm-token`

---

## 🔄 Correct Authentication & FCM Token Flow

```
┌─────────────────────┐         ┌─────────────┐         ┌──────────────────┐
│  React Native App   │         │   Firebase  │         │  Node.js Backend │
└─────────────────────┘         └─────────────┘         └──────────────────┘
          │                            │                          │
          │                            │                          │
    1️⃣ User signs in                  │                          │
          │──────────────────────────▶ │                          │
          │                            │                          │
          │                       Verify user                     │
          │                            │                          │
    2️⃣ Firebase ID token received     │                          │
          │◀───────────────────────────│                          │
          │                                                       │
          │         idToken = await user.getIdToken()            │
          │                                                       │
    3️⃣ Send ID token + FCM token to backend                      │
          │─────────────────────────────────────────────────────▶│
          │  POST /api/auth/verifyFirebaseOtp                    │
          │  { idToken, phoneNumber }                            │
          │                                                       │
          │                                          Verify ID token with
          │                                          Firebase Admin SDK
          │                                                       │
    4️⃣ Backend verifies & creates user                           │
          │◀──────────────────────────────────────────────────────│
          │  { success: true, token: "JWT", user: {...} }        │
          │                                                       │
          │  Store JWT in AsyncStorage                           │
          │                                                       │
    5️⃣ Request FCM permission & get token                        │
          │  const fcmToken = await messaging().getToken()       │
          │                                                       │
    6️⃣ Send FCM token to backend                                 │
          │─────────────────────────────────────────────────────▶│
          │  POST /api/users/update-fcm-token                    │
          │  Authorization: Bearer <JWT>                         │
          │  { fcmToken, platform: "android" }                   │
          │                                                       │
          │                                          Store FCM token in
          │                                          User collection
          │                                                       │
          │◀──────────────────────────────────────────────────────│
          │  { success: true, message: "FCM token updated" }     │
          │                                                       │
          ✅ User fully registered with FCM token                │
          │                                                       │
          │                                                       │
    7️⃣ Later: Backend sends push notifications                   │
          │◀──────────────────────────────────────────────────────│
          │  Uses stored FCM token from database                 │
          │                                                       │
```

---

## 🆕 New Backend Endpoint

### **POST** `/api/users/update-fcm-token`

**Purpose**: Register or update the user's FCM token for push notifications

**Authentication**: ✅ Required (Bearer token)

**Request Headers**:
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Request Body**:
```javascript
{
  "fcmToken": "string (required) - FCM device token from Firebase",
  "platform": "string (optional) - android | ios | web (defaults to android)"
}
```

**Success Response** (200):
```javascript
{
  "success": true,
  "message": "FCM token updated successfully",
  "data": {
    "userId": "68cd71f3f31eb5d72a6c8e25",
    "fcmToken": "dX4k...TnY9",
    "platform": "android",
    "updatedAt": "2025-10-11T10:30:00.000Z"
  }
}
```

**Error Responses**:

❌ **400 Bad Request** - Missing FCM token
```javascript
{
  "success": false,
  "message": "FCM token is required"
}
```

❌ **401 Unauthorized** - Invalid or missing JWT
```javascript
{
  "message": "Token missing, please login again"
}
```

❌ **404 Not Found** - User not found
```javascript
{
  "success": false,
  "message": "User not found"
}
```

❌ **500 Internal Server Error** - Server error
```javascript
{
  "success": false,
  "message": "Error updating FCM token",
  "error": "Error details"
}
```

---

## 📱 React Native Implementation

### Step 1: Install Required Packages

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
# or
yarn add @react-native-firebase/app @react-native-firebase/messaging
```

### Step 2: Request FCM Permission (iOS)

Add to `ios/Podfile`:
```ruby
pod 'Firebase/Messaging'
```

Run:
```bash
cd ios && pod install && cd ..
```

### Step 3: Create FCM Service

Create `src/services/fcmService.js`:

```javascript
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

class FCMService {
  /**
   * Request FCM permission and get token
   */
  async requestPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ FCM Permission granted:', authStatus);
        return true;
      } else {
        console.log('❌ FCM Permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ FCM Permission error:', error);
      return false;
    }
  }

  /**
   * Get FCM device token
   */
  async getToken() {
    try {
      const token = await messaging().getToken();
      if (token) {
        console.log('📱 FCM Token:', token);
        await AsyncStorage.setItem('fcmToken', token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Send FCM token to backend
   */
  async registerTokenWithBackend(fcmToken, platform = 'android') {
    try {
      const jwtToken = await AsyncStorage.getItem('authToken');
      
      if (!jwtToken) {
        console.error('❌ No JWT token found. User must login first.');
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_BASE_URL}/users/update-fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          fcmToken: fcmToken,
          platform: platform, // 'android' or 'ios'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ FCM token registered with backend:', data);
        return { success: true, data };
      } else {
        console.error('❌ Failed to register FCM token:', data);
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('❌ Error registering FCM token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete FCM setup (request permission + get token + register with backend)
   */
  async setupFCM(platform = 'android') {
    try {
      console.log('🔥 Starting FCM setup...');

      // Step 1: Request permission
      const permissionGranted = await this.requestPermission();
      if (!permissionGranted) {
        return { success: false, error: 'Permission denied' };
      }

      // Step 2: Get FCM token
      const fcmToken = await this.getToken();
      if (!fcmToken) {
        return { success: false, error: 'Failed to get FCM token' };
      }

      // Step 3: Register with backend
      const result = await this.registerTokenWithBackend(fcmToken, platform);
      
      if (result.success) {
        console.log('✅ FCM setup completed successfully');
      }

      return result;
    } catch (error) {
      console.error('❌ FCM setup error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle token refresh
   */
  setupTokenRefreshListener(platform = 'android') {
    return messaging().onTokenRefresh(async (newToken) => {
      console.log('🔄 FCM Token refreshed:', newToken);
      await AsyncStorage.setItem('fcmToken', newToken);
      await this.registerTokenWithBackend(newToken, platform);
    });
  }

  /**
   * Handle foreground notifications
   */
  setupForegroundNotificationHandler() {
    return messaging().onMessage(async (remoteMessage) => {
      console.log('📬 Foreground notification:', remoteMessage);
      // Handle notification display in foreground
      // You can show a custom UI or use local notifications
    });
  }

  /**
   * Handle background/quit state notifications
   */
  setupBackgroundNotificationHandler() {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('📬 Background notification:', remoteMessage);
      // Handle background notification
    });
  }
}

export default new FCMService();
```

### Step 4: Integrate in Your Login Flow

Update your authentication flow in `src/screens/LoginScreen.js` (or similar):

```javascript
import fcmService from '../services/fcmService';
import { Platform } from 'react-native';

const LoginScreen = () => {
  const handleLogin = async (phoneNumber, otp) => {
    try {
      // Step 1: Verify OTP with Firebase
      const firebaseResult = await firebaseAuth.verifySMSOTP(otp);
      
      if (firebaseResult.success && firebaseResult.user) {
        // Step 2: Get Firebase ID token
        const idToken = await firebaseResult.user.getIdToken();
        
        // Step 3: Send ID token to backend for verification
        const response = await fetch(`${API_BASE_URL}/auth/verifyFirebaseOtp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken: idToken,
            phoneNumber: phoneNumber,
          }),
        });

        const data = await response.json();

        if (data.success && data.token) {
          // Step 4: Store JWT token
          await AsyncStorage.setItem('authToken', data.token);
          await AsyncStorage.setItem('userData', JSON.stringify(data.user));

          console.log('✅ User authenticated successfully');

          // Step 5: Register FCM token with backend
          const platform = Platform.OS; // 'android' or 'ios'
          const fcmResult = await fcmService.setupFCM(platform);

          if (fcmResult.success) {
            console.log('✅ FCM token registered successfully');
          } else {
            console.warn('⚠️ FCM registration failed, but login successful');
          }

          // Navigate to home screen
          navigation.navigate('Home');
        } else {
          Alert.alert('Login Failed', data.message || 'Authentication failed');
        }
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    }
  };

  return (
    // Your login UI
  );
};
```

### Step 5: Setup Notification Listeners in App.js

```javascript
import React, { useEffect } from 'react';
import fcmService from './src/services/fcmService';
import { Platform } from 'react-native';

const App = () => {
  useEffect(() => {
    // Setup notification handlers
    const unsubscribeForeground = fcmService.setupForegroundNotificationHandler();
    const unsubscribeRefresh = fcmService.setupTokenRefreshListener(Platform.OS);
    
    // Setup background handler (only once)
    fcmService.setupBackgroundNotificationHandler();

    // Cleanup on unmount
    return () => {
      unsubscribeForeground();
      unsubscribeRefresh();
    };
  }, []);

  return (
    // Your app content
  );
};

export default App;
```

---

## 🔧 Testing the Integration

### Test Checklist

#### 1. **Local Testing**
```bash
# Backend should be running on port 8001
npm start
```

#### 2. **Test FCM Token Update**

Using Postman or cURL:

```bash
curl -X POST http://localhost:8001/api/users/update-fcm-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fcmToken": "dX4kTnY9fH8pQmL5sW2xR3vB6nC9jK1mP4oY7tU0iE8aG",
    "platform": "android"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "FCM token updated successfully",
  "data": {
    "userId": "68cd71f3f31eb5d72a6c8e25",
    "fcmToken": "dX4kTnY9fH8pQmL5sW2xR3vB6nC9jK1mP4oY7tU0iE8aG",
    "platform": "android",
    "updatedAt": "2025-10-11T10:30:00.000Z"
  }
}
```

#### 3. **Verify Token in Database**

Check MongoDB:
```javascript
db.users.findOne({ _id: ObjectId("68cd71f3f31eb5d72a6c8e25") })
```

Should show:
```json
{
  "_id": "68cd71f3f31eb5d72a6c8e25",
  "fcmToken": "dX4kTnY9fH8pQmL5sW2xR3vB6nC9jK1mP4oY7tU0iE8aG",
  "platform": "android",
  ...
}
```

#### 4. **Test Push Notification**

Send test notification from admin panel:
```
POST /api/notifications/send-notification
{
  "title": "Test Notification",
  "body": "Testing FCM integration",
  "targetPlatform": "android"
}
```

---

## 🐛 Troubleshooting

### Issue 1: "Token missing, please login again"
**Solution**: Ensure JWT token is included in Authorization header
```javascript
'Authorization': `Bearer ${jwtToken}`
```

### Issue 2: "FCM token is required"
**Solution**: Verify fcmToken is not null/undefined before sending

### Issue 3: "User not found"
**Solution**: User must complete authentication flow first

### Issue 4: FCM token not persisting
**Solution**: Check if token refresh listener is setup correctly

### Issue 5: Notifications not received
**Solution**: 
1. Verify FCM token is stored in database
2. Check Firebase project configuration
3. Verify `firebase-service-account.json` is configured correctly

---

## 📊 Database Schema

### User Model Fields (Updated)

```javascript
{
  _id: ObjectId,
  name: String,
  phNo: String,
  email: String,
  firebaseUid: String,           // Firebase Auth UID
  fcmToken: String,              // ✅ FCM token for push notifications
  platform: String,              // ✅ 'android' | 'ios' | 'web'
  isVerified: Boolean,
  isPhoneVerified: Boolean,
  isEmailVerified: Boolean,
  isAdmin: Boolean,
  lastLoginAt: Date,             // ✅ Updated when FCM token is updated
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Security Notes

1. **JWT Token**: Always send JWT token in Authorization header
2. **HTTPS**: Use HTTPS in production
3. **Token Validation**: Backend validates JWT before updating FCM token
4. **Token Refresh**: Handle token refresh on app startup and when expired
5. **Platform Validation**: Backend validates platform to prevent injection

---

## 🚀 Deployment Notes

### Environment Variables

Ensure these are set in production:

```env
# Backend (.env.production)
FIREBASE_PROJECT_ID=yoraa-android-ios
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@yoraa-android-ios.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# React Native (.env)
API_BASE_URL=https://your-production-api.com/api
FIREBASE_PROJECT_ID=yoraa-android-ios
```

### Production Checklist

- [ ] Backend endpoint tested and working
- [ ] FCM service implemented in React Native
- [ ] Notification permissions requested on app startup
- [ ] Token refresh listener implemented
- [ ] Background notification handler setup
- [ ] Foreground notification UI implemented
- [ ] Deep linking configured for notification actions
- [ ] Error handling implemented
- [ ] Analytics tracking for FCM registration
- [ ] HTTPS enabled on backend

---

## 📞 API Endpoints Summary

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/auth/verifyFirebaseOtp` | Verify Firebase OTP & create user | ❌ No |
| POST | `/api/auth/login/firebase` | Firebase login | ❌ No |
| **POST** | **`/api/users/update-fcm-token`** | **Register FCM token** | **✅ Yes** |
| POST | `/api/notifications/send-notification` | Send push notification (admin) | ✅ Yes |

---

## 🎯 Complete Integration Workflow

```
1. User Opens App
   ↓
2. User Logs In (Firebase Authentication)
   ↓
3. App Gets Firebase ID Token
   ↓
4. App Sends ID Token to Backend → POST /api/auth/verifyFirebaseOtp
   ↓
5. Backend Verifies Token & Creates/Updates User
   ↓
6. Backend Returns JWT Token
   ↓
7. App Stores JWT Token in AsyncStorage
   ↓
8. App Requests FCM Permission
   ↓
9. App Gets FCM Device Token
   ↓
10. App Sends FCM Token to Backend → POST /api/users/update-fcm-token
    ↓
11. Backend Stores FCM Token in User Document
    ↓
12. ✅ User Can Now Receive Push Notifications!
```

---

## 📚 Additional Resources

- [Firebase Cloud Messaging (FCM) Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

## ✅ Status

| Component | Status |
|-----------|--------|
| Backend Endpoint | ✅ Created |
| User Model | ✅ Has fcmToken field |
| Authentication Flow | ✅ Working |
| Firebase Admin SDK | ✅ Configured |
| Notification Sending | ✅ Working |
| **Frontend Integration** | ⏳ **Pending** |

---

## 📝 Notes for Frontend Team

1. **Priority**: HIGH - This is required for push notifications to work
2. **Estimated Time**: 2-3 hours for implementation + testing
3. **Dependencies**: @react-native-firebase/messaging must be installed
4. **Testing**: Test on both Android and iOS devices
5. **Coordination**: Coordinate with backend team for endpoint testing

---

**Last Updated**: October 11, 2025  
**Backend Version**: 1.0.0  
**Created By**: Backend Team  
**Status**: ✅ Backend Ready - Awaiting Frontend Integration
