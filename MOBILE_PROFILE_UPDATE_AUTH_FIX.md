# Mobile App Profile Update Authentication Issue - Fix Guide

## 🚨 Issue Description
**Error Message:** "Failed to save profile: Authentication required. Please log in."

**Problem:** Even after logging in successfully, the profile update fails with authentication error in TestFlight.

**Last Reported:** October 11, 2025

---

## 🔍 Root Cause Analysis

The backend is correctly configured and working. The issue is on the **mobile app side** where the authentication token is not being properly sent with the profile update request.

---

## ✅ Backend Verification (Already Working)

### Endpoint Details
- **URL:** `PUT /api/users/profile`
- **Authentication:** Required (JWT Token)
- **Middleware:** `VerifyToken`

### Expected Request Format
```javascript
PUT https://your-api-domain.com/api/users/profile
Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

Body:
{
  "name": "Guest",
  "email": "guest@yoraa.com",
  "phone": "1234567890",
  "dateOfBirth": "05/06/1999",
  "gender": "male"
  // Add other fields as needed
}
```

### Backend Authentication Flow
1. Request hits `/api/users/profile` endpoint
2. `VerifyToken` middleware extracts token from `Authorization` header
3. Token format expected: `Bearer <token>`
4. Token is verified using JWT secret
5. User ID is extracted and attached to `req.userId`
6. Profile update proceeds with authenticated user

---

## 🐛 Common Mobile App Issues to Check

### 1. Token Storage After Login
**Check if token is being stored properly after successful login:**

```javascript
// ✅ CORRECT - After successful login
const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await loginResponse.json();

// CRITICAL: Store the token
await AsyncStorage.setItem('authToken', data.token);
await AsyncStorage.setItem('userId', data.userId);
```

### 2. Token Retrieval Before Profile Update
**Check if token is being retrieved and sent:**

```javascript
// ✅ CORRECT - Before profile update
const token = await AsyncStorage.getItem('authToken');

if (!token) {
  // Show error: "Please log in first"
  return;
}

const updateResponse = await fetch(`${API_URL}/api/users/profile`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // CRITICAL: Must include "Bearer " prefix
  },
  body: JSON.stringify(profileData)
});
```

### 3. Authorization Header Format
**The header MUST include "Bearer " prefix:**

```javascript
// ❌ WRONG
headers: {
  'Authorization': token  // Missing "Bearer " prefix
}

// ❌ WRONG
headers: {
  'authorization': `Bearer ${token}`  // Lowercase 'a' - may work but not standard
}

// ✅ CORRECT
headers: {
  'Authorization': `Bearer ${token}`  // Uppercase 'A', with "Bearer " prefix
}
```

### 4. Token Expiration
**Check if token has expired:**

```javascript
// Token expires in 7 days (backend config: 604800 seconds)
// Check token age before using
const loginTime = await AsyncStorage.getItem('loginTime');
const now = new Date().getTime();
const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

if (now - loginTime > sevenDaysInMs) {
  // Token expired, redirect to login
  await AsyncStorage.clear();
  navigation.navigate('Login');
}
```

### 5. API URL Configuration
**Verify the API URL is correct:**

```javascript
// ❌ WRONG - Missing /api prefix
const API_URL = 'https://your-domain.com';
fetch(`${API_URL}/users/profile`, ...);  // Results in /users/profile

// ✅ CORRECT
const API_URL = 'https://your-domain.com/api';
fetch(`${API_URL}/users/profile`, ...);  // Results in /api/users/profile

// OR

// ✅ ALSO CORRECT
const API_URL = 'https://your-domain.com';
fetch(`${API_URL}/api/users/profile`, ...);  // Results in /api/users/profile
```

---

## 🔧 Recommended Fixes for Mobile Team

### Fix 1: Create API Service with Automatic Token Handling

```javascript
// services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://your-api-domain.com/api';

export const apiRequest = async (endpoint, options = {}) => {
  try {
    // Get token
    const token = await AsyncStorage.getItem('authToken');
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add authorization if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Make request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    // Handle 401 (unauthorized)
    if (response.status === 401) {
      await AsyncStorage.clear();
      throw new Error('Authentication required. Please log in.');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Usage in profile update
export const updateProfile = async (profileData) => {
  return await apiRequest('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};
```

### Fix 2: Update Profile Screen

```javascript
// screens/ProfileScreen.js
import { apiRequest } from '../services/api';
import { Alert } from 'react-native';

const handleSaveProfile = async () => {
  try {
    setLoading(true);
    
    // Validate data
    if (!name || !email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    
    // Make API call
    const response = await apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name,
        email,
        phone,
        dateOfBirth,
        gender,
      }),
    });
    
    Alert.alert('Success', 'Profile updated successfully');
    
  } catch (error) {
    if (error.message.includes('Authentication required')) {
      Alert.alert('Error', 'Session expired. Please log in again.');
      // Navigate to login
      navigation.navigate('Login');
    } else {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  } finally {
    setLoading(false);
  }
};
```

### Fix 3: Login Screen - Ensure Token is Saved

```javascript
// screens/LoginScreen.js
const handleLogin = async () => {
  try {
    setLoading(true);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // CRITICAL: Save authentication data
    await AsyncStorage.setItem('authToken', data.token);
    await AsyncStorage.setItem('userId', data.userId);
    await AsyncStorage.setItem('userName', data.name);
    await AsyncStorage.setItem('userEmail', data.email);
    await AsyncStorage.setItem('loginTime', new Date().getTime().toString());
    
    // Navigate to home
    navigation.navigate('Home');
    
  } catch (error) {
    Alert.alert('Login Failed', error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 🧪 Testing Checklist for Mobile Team

### Pre-Testing Setup
- [ ] Clear AsyncStorage completely
- [ ] Uninstall and reinstall the TestFlight app
- [ ] Enable network debugging (React Native Debugger or Flipper)

### Test Flow
1. [ ] **Login Test**
   - Log in with valid credentials
   - Check AsyncStorage to confirm token is saved
   - Verify token format (should be a long string)
   
2. [ ] **Profile Load Test**
   - After login, navigate to Profile screen
   - Check if user data loads correctly
   - Verify API call includes Authorization header
   
3. [ ] **Profile Update Test**
   - Change name/email/phone
   - Click Save
   - Monitor network request in debugger
   - Confirm Authorization header is present: `Bearer <token>`
   - Check response status and message
   
4. [ ] **Token Persistence Test**
   - Update profile successfully
   - Close app completely
   - Reopen app
   - Try to update profile again (should work without re-login)

---

## 🔍 Debugging Steps

### Step 1: Check if Token Exists
```javascript
const token = await AsyncStorage.getItem('authToken');
console.log('Token:', token);
// Should print a long JWT string like: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Log Request Headers
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
console.log('Request Headers:', headers);
// Should show: { 'Content-Type': 'application/json', 'Authorization': 'Bearer eyJhbG...' }
```

### Step 3: Log Full Request
```javascript
console.log('API Request:', {
  url: `${API_BASE_URL}/users/profile`,
  method: 'PUT',
  headers: headers,
  body: JSON.stringify(profileData)
});
```

### Step 4: Check Response
```javascript
const response = await fetch(...);
console.log('Response Status:', response.status);
console.log('Response Headers:', response.headers);
const data = await response.json();
console.log('Response Data:', data);
```

---

## 📋 Expected Backend Response Formats

### Success Response (200)
```json
{
  "message": "Profile updated successfully",
  "user": {
    "userId": "12345",
    "name": "Guest",
    "email": "guest@yoraa.com",
    "phone": "1234567890",
    "dateOfBirth": "05/06/1999",
    "gender": "male"
  }
}
```

### Error Response (401) - Missing Token
```json
{
  "error": "Authorization token is required"
}
```

### Error Response (401) - Invalid Token
```json
{
  "error": "Invalid or expired token"
}
```

### Error Response (400) - Validation Error
```json
{
  "error": "Validation error message"
}
```

---

## 🚀 Quick Fix Summary

**Most Likely Issue:** Authorization header is not being sent with the profile update request.

**Quick Fix:**
1. Ensure token is saved after login: `await AsyncStorage.setItem('authToken', data.token)`
2. Retrieve token before profile update: `const token = await AsyncStorage.getItem('authToken')`
3. Add to headers: `'Authorization': \`Bearer ${token}\``
4. Use uppercase 'A' in 'Authorization'
5. Include space after 'Bearer'

---

## 📞 Backend Support

If you confirm all the above is implemented correctly and the issue persists, please provide:

1. **Network logs** showing the exact request being sent (headers and body)
2. **Console logs** showing the token value (first and last 10 characters only)
3. **Response** received from the server
4. **AsyncStorage dump** showing what's stored after login

**Backend Endpoint:** `PUT /api/users/profile`
**Expected Header:** `Authorization: Bearer <JWT_TOKEN>`
**Backend Status:** ✅ Working correctly (verified)

---

## 📝 Additional Notes

- Token expiration is set to **7 days** on the backend
- After 7 days, users must log in again
- Logout should clear all AsyncStorage data
- Consider implementing automatic token refresh for better UX

---

**Document Created:** October 11, 2025
**Backend Version:** Latest
**Issue Status:** Awaiting mobile team implementation

---

## Quick Reference Code Snippet

```javascript
// Complete working example for profile update
import AsyncStorage from '@react-native-async-storage/async-storage';

const updateProfile = async (profileData) => {
  try {
    // 1. Get token
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Please log in first');
    }
    
    // 2. Make request
    const response = await fetch('https://your-api.com/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Critical!
      },
      body: JSON.stringify(profileData)
    });
    
    // 3. Handle response
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Update failed');
    }
    
    return data;
  } catch (error) {
    console.error('Profile Update Error:', error);
    throw error;
  }
};
```

Good luck! 🚀
