# 🔥 FCM Token Integration - Quick Reference

## 🚀 TL;DR for Frontend Team

### What's Missing?
Your React Native app is **not sending FCM tokens** to the backend after login!

### What to Add?
After successful login, call this endpoint:

```javascript
POST /api/users/update-fcm-token
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "fcmToken": "device-fcm-token-from-firebase",
  "platform": "android" // or "ios"
}
```

---

## 📱 Quick Implementation (Copy & Paste)

### Step 1: Install Package
```bash
npm install @react-native-firebase/messaging
```

### Step 2: Get FCM Token After Login
```javascript
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

// After successful login:
const registerFCMToken = async () => {
  try {
    // Request permission
    const authStatus = await messaging().requestPermission();
    
    if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
      // Get FCM token
      const fcmToken = await messaging().getToken();
      
      // Get JWT from storage
      const jwtToken = await AsyncStorage.getItem('authToken');
      
      // Send to backend
      const response = await fetch('http://localhost:8001/api/users/update-fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          fcmToken: fcmToken,
          platform: Platform.OS, // 'android' or 'ios'
        }),
      });
      
      const data = await response.json();
      console.log('FCM registered:', data);
    }
  } catch (error) {
    console.error('FCM registration failed:', error);
  }
};

// Call this after login success
registerFCMToken();
```

### Step 3: Add to Login Flow
```javascript
const handleLogin = async () => {
  // ... existing login code ...
  
  if (loginSuccess) {
    await AsyncStorage.setItem('authToken', jwtToken);
    
    // 👇 ADD THIS LINE
    await registerFCMToken();
    
    navigation.navigate('Home');
  }
};
```

---

## 🧪 Test It

### Postman Test
```
POST http://localhost:8001/api/users/update-fcm-token
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

Body:
{
  "fcmToken": "test-token-12345",
  "platform": "android"
}

Expected Response:
{
  "success": true,
  "message": "FCM token updated successfully",
  "data": {
    "userId": "...",
    "fcmToken": "test-token-12345",
    "platform": "android"
  }
}
```

---

## 📋 Checklist

- [ ] Install @react-native-firebase/messaging
- [ ] Request notification permission
- [ ] Get FCM token from Firebase
- [ ] Send FCM token to backend after login
- [ ] Handle token refresh
- [ ] Test on real device
- [ ] Verify token in database

---

## 🆘 Common Errors

### "Token missing, please login again"
→ Add JWT token to Authorization header

### "FCM token is required"
→ Make sure fcmToken is not null

### "User not found"
→ User must login first

---

## 📖 Full Documentation
See `FCM_TOKEN_INTEGRATION_GUIDE.md` for complete implementation details.

---

**Status**: ✅ Backend Ready  
**Priority**: 🔴 HIGH  
**Time**: ~2 hours
