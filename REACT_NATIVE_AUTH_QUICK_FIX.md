# 🚨 REACT NATIVE AUTH - QUICK FIX (TL;DR)

## The Problem
**User details not persisting after login in React Native app (TestFlight)**

## The Root Cause
React Native app is NOT storing authentication data in AsyncStorage after successful login.

---

## ⚡ QUICK FIX (Copy & Paste)

### 1. Install AsyncStorage (1 command)

```bash
npm install @react-native-async-storage/async-storage
cd ios && pod install && cd ..
```

### 2. Add This After EVERY Login Method (CRITICAL)

**Add this code IMMEDIATELY after receiving login response from backend:**

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// After successful login API call
const result = await fetch('YOUR_BACKEND_URL/api/auth/login', {...});
const data = await result.json();

if (data.success && data.data) {
  // 🚨 CRITICAL - Add these 2 lines
  await AsyncStorage.setItem('@auth_token', data.data.token);
  await AsyncStorage.setItem('@user_data', JSON.stringify(data.data.user));
  
  // Then navigate
  navigation.replace('Home');
}
```

### 3. Add Auth Token to All API Requests

```javascript
// Before making any API request
const token = await AsyncStorage.getItem('@auth_token');

fetch('YOUR_BACKEND_URL/api/...', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 4. Check Auth on App Start

```javascript
// In App.js useEffect
useEffect(() => {
  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('@auth_token');
    const userData = await AsyncStorage.getItem('@user_data');
    
    if (token && userData) {
      // User is logged in
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  };
  
  checkAuth();
}, []);
```

---

## 📍 WHERE TO ADD THE FIX

Add `AsyncStorage.setItem()` calls in these files:

### File 1: Phone Login (OTP)
```javascript
// In: src/screens/LoginScreen.js (or similar)
// After: const result = await fetch('.../api/auth/verifyFirebaseOtp', ...)

if (result.data.success) {
  await AsyncStorage.setItem('@auth_token', result.data.token);      // ← ADD THIS
  await AsyncStorage.setItem('@user_data', JSON.stringify(result.data.user)); // ← ADD THIS
  navigation.replace('Home');
}
```

### File 2: Apple Sign In
```javascript
// In: src/screens/AppleSignIn.js (or similar)
// After: const result = await fetch('.../api/auth/apple-signin', ...)

if (result.data.success) {
  await AsyncStorage.setItem('@auth_token', result.data.token);      // ← ADD THIS
  await AsyncStorage.setItem('@user_data', JSON.stringify(result.data.user)); // ← ADD THIS
  navigation.replace('Home');
}
```

### File 3: Google Sign In
```javascript
// In: src/screens/GoogleSignIn.js (or similar)
// After: const result = await fetch('.../api/auth/login/firebase', ...)

if (result.data.success) {
  await AsyncStorage.setItem('@auth_token', result.data.token);      // ← ADD THIS
  await AsyncStorage.setItem('@user_data', JSON.stringify(result.data.user)); // ← ADD THIS
  navigation.replace('Home');
}
```

### File 4: Email/Password Login
```javascript
// In: src/screens/EmailLogin.js (or similar)
// After: const result = await fetch('.../api/auth/login', ...)

if (result.data.success) {
  await AsyncStorage.setItem('@auth_token', result.data.token);      // ← ADD THIS
  await AsyncStorage.setItem('@user_data', JSON.stringify(result.data.user)); // ← ADD THIS
  navigation.replace('Home');
}
```

---

## 🧪 QUICK TEST

After adding the fix:

1. **Login** with any method
2. **Check storage** (add debug code):
   ```javascript
   const token = await AsyncStorage.getItem('@auth_token');
   const userData = await AsyncStorage.getItem('@user_data');
   console.log('Token:', token ? 'EXISTS' : 'MISSING');
   console.log('User:', userData ? JSON.parse(userData) : 'MISSING');
   ```
3. **Close app completely**
4. **Reopen app**
5. **Expected**: User should still be logged in

---

## 🐛 DEBUG - If Still Not Working

Add this debug function to see what's stored:

```javascript
const debugStorage = async () => {
  const token = await AsyncStorage.getItem('@auth_token');
  const userData = await AsyncStorage.getItem('@user_data');
  
  console.log('=== STORAGE DEBUG ===');
  console.log('Token exists:', !!token);
  console.log('Token preview:', token?.substring(0, 30) + '...');
  console.log('User data:', userData ? JSON.parse(userData) : 'NONE');
  console.log('====================');
};

// Call after login
await debugStorage();
```

---

## ✅ SUCCESS CHECKLIST

After fix is deployed:

- [ ] User logs in → sees their name/profile immediately
- [ ] User closes app → still logged in when reopened
- [ ] User navigates to different screens → data persists
- [ ] User makes API calls → requests include auth token
- [ ] User logs out → all data cleared, returns to login screen

---

## 🔗 BACKEND ENDPOINTS (Already Working ✅)

Your backend is correctly configured. These endpoints all return `{token, user}`:

| Method | Endpoint | Status |
|--------|----------|--------|
| Phone OTP | `/api/auth/verifyFirebaseOtp` | ✅ Working |
| Apple | `/api/auth/apple-signin` | ✅ Working |
| Google | `/api/auth/login/firebase` | ✅ Working |
| Email/Password | `/api/auth/login` | ✅ Working |

**Response format (all methods):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "phNo": "1234567890",
      "isVerified": true
    }
  }
}
```

---

## ⏱️ TIME TO FIX

- **Minimum fix**: 15 minutes (just add AsyncStorage calls)
- **Complete fix**: 2 hours (with proper service, interceptors, etc.)

---

## 📋 NEXT STEPS

1. Read full guide: `REACT_NATIVE_AUTH_FIX.md`
2. Install AsyncStorage
3. Add storage calls to all login methods
4. Test on TestFlight
5. Verify users stay logged in

---

**Critical Issue Resolved: Users will now stay authenticated after login! 🎉**
