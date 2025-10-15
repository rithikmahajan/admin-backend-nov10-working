# 🔄 Frontend-Backend Synchronization Check Guide

**Last Updated:** October 12, 2025  
**Backend Version:** 1.0.0  
**API Base URL:** `http://185.193.19.244:8080/api`

---

## 🚨 CRITICAL ISSUES IDENTIFIED

Based on the screenshot provided, the mobile app is facing these issues:

### ❌ Issue #1: Endpoint Not Found
```
Error: API endpoint not found: PUT /api/user/profile
```

**Status:** ✅ **RESOLVED IN BACKEND**  
The backend has BOTH endpoints implemented:
- `PUT /api/profile` (Line 214 in index.js)
- `PUT /api/user/profile` (Line 419 in index.js)

**Root Cause:** Frontend may be using incorrect base URL or missing authentication token.

### ❌ Issue #2: Multiple Profile Request Errors
```
RN Error: API Error [GET /api/user/profile]
```

**Status:** ✅ **ENDPOINTS EXIST**  
- `GET /api/profile` (Line 143 in index.js)
- `GET /api/user/profile` (Line 348 in index.js)

---

## 📋 SYNCHRONIZATION CHECKLIST

### 1️⃣ **Base URL Configuration**

#### ✅ Frontend Should Have:
```javascript
// React Native Configuration
const API_BASE_URL = 'http://185.193.19.244:8080/api';

// OR for local testing
const API_BASE_URL = 'http://localhost:8080/api';
```

#### ⚠️ Common Mistakes:
```javascript
// ❌ WRONG - Missing /api
const API_BASE_URL = 'http://185.193.19.244:8080';

// ❌ WRONG - Extra slash
const API_BASE_URL = 'http://185.193.19.244:8080/api/';

// ❌ WRONG - Using /user/profile in base URL
const API_BASE_URL = 'http://185.193.19.244:8080/api/user';

// ✅ CORRECT
const API_BASE_URL = 'http://185.193.19.244:8080/api';
```

---

### 2️⃣ **Authentication Token**

#### ✅ All Profile Endpoints Require Auth Token:

```javascript
// Frontend MUST include Authorization header
const headers = {
  'Authorization': `Bearer ${userToken}`,
  'Content-Type': 'application/json'
};

// Example with axios
axios.get(`${API_BASE_URL}/profile`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Example with fetch
fetch(`${API_BASE_URL}/profile`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### ⚠️ Token Verification:
```javascript
// Check if token exists before making request
if (!token) {
  console.error('❌ No authentication token found');
  // Redirect to login
}

// Check token format
console.log('Token:', token.substring(0, 20) + '...');
// Should start with: eyJhbGciOiJIUzI1NiIs...
```

---

### 3️⃣ **Profile Endpoints - Complete Implementation**

#### 📥 **GET Profile Endpoints**

**Option 1:** `/api/profile` (Recommended)
```javascript
// Frontend Request
GET http://185.193.19.244:8080/api/profile
Headers: {
  'Authorization': 'Bearer YOUR_TOKEN_HERE',
  'Content-Type': 'application/json'
}

// Backend Response (200 OK)
{
  "success": true,
  "data": {
    "id": "67094f4a8be4c9ac5c0ca123",
    "firstName": "Rithik",
    "lastName": "Mahajan",
    "email": "user@example.com",
    "phone": "1234567890",
    "profileImage": "https://...",
    "gender": "Male",
    "membershipTier": "basic",
    "pointsBalance": 0,
    "isEmailVerified": false,
    "isPhoneVerified": false,
    "preferences": {
      "currency": "INR",
      "language": "en",
      "notifications": true
    },
    "addresses": []
  },
  "message": "Profile retrieved successfully"
}
```

**Option 2:** `/api/user/profile` (Mobile App Compatible)
```javascript
// Frontend Request
GET http://185.193.19.244:8080/api/user/profile
Headers: {
  'Authorization': 'Bearer YOUR_TOKEN_HERE',
  'Content-Type': 'application/json'
}

// Same response format as above
```

#### 📤 **PUT Profile Endpoints**

**Option 1:** `/api/profile` (Recommended)
```javascript
// Frontend Request
PUT http://185.193.19.244:8080/api/profile
Headers: {
  'Authorization': 'Bearer YOUR_TOKEN_HERE',
  'Content-Type': 'application/json'
}
Body: {
  "firstName": "Rithik",
  "lastName": "Mahajan",
  "email": "new.email@example.com",
  "phone": "9876543210",
  "gender": "Male",
  "profileImage": "https://...",
  "preferences": {
    "currency": "INR",
    "language": "en",
    "notifications": true
  }
}

// Backend Response (200 OK)
{
  "success": true,
  "data": {
    "id": "...",
    "firstName": "Rithik",
    "lastName": "Mahajan",
    "email": "new.email@example.com",
    "phone": "9876543210",
    "gender": "Male",
    // ... full profile data
  },
  "message": "Profile updated successfully"
}
```

**Option 2:** `/api/user/profile` (Mobile App Compatible)
```javascript
// Frontend Request
PUT http://185.193.19.244:8080/api/user/profile
Headers: {
  'Authorization': 'Bearer YOUR_TOKEN_HERE',
  'Content-Type': 'application/json'
}
Body: {
  // Same as above
}

// Same response format
```

---

### 4️⃣ **Gender Field Validation**

#### ✅ Valid Gender Values:
```javascript
// Backend accepts these values ONLY
const validGenders = ['Male', 'Female', 'Other', ''];

// Frontend dropdown should use exact values
<Select>
  <Option value="Male">Male</Option>
  <Option value="Female">Female</Option>
  <Option value="Other">Other</Option>
</Select>

// ❌ WRONG
gender: 'male' // lowercase
gender: 'M'    // abbreviated
gender: 'MALE' // all caps

// ✅ CORRECT
gender: 'Male' // Capitalized
```

---

### 5️⃣ **Error Handling**

#### ✅ Frontend Should Handle These Responses:

```javascript
// Success Response
{
  "success": true,
  "data": { /* profile data */ },
  "message": "Profile updated successfully"
}

// Error Responses
// 1. Unauthorized (401)
{
  "success": false,
  "message": "No token provided" // or "Token expired"
}

// 2. Not Found (404)
{
  "success": false,
  "message": "User not found.",
  "data": null,
  "statusCode": 404
}

// 3. Server Error (500)
{
  "success": false,
  "message": "Internal server error while updating profile.",
  "error": "Detailed error message",
  "data": null,
  "statusCode": 500
}

// 4. Endpoint Not Found (404)
{
  "success": false,
  "message": "API endpoint not found: PUT /api/user/profile",
  "data": null,
  "statusCode": 404
}
```

#### ✅ Frontend Error Handling Code:

```javascript
// Using axios
try {
  const response = await axios.put(
    `${API_BASE_URL}/profile`,
    profileData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (response.data.success) {
    console.log('✅ Profile updated:', response.data.data);
    // Update local state
  }
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('❌ Server Error:', error.response.data);
    
    if (error.response.status === 401) {
      // Token expired or invalid
      console.log('🔐 Auth error - redirecting to login');
      // Redirect to login
    } else if (error.response.status === 404) {
      // Endpoint not found
      console.log('🔍 Endpoint not found:', error.response.data.message);
      // Show user-friendly error
    } else if (error.response.status === 500) {
      // Server error
      console.log('⚠️ Server error:', error.response.data.error);
      // Show retry option
    }
  } else if (error.request) {
    // Request made but no response
    console.error('❌ Network Error - No response from server');
    console.log('Check if backend is running and URL is correct');
  } else {
    // Error setting up request
    console.error('❌ Request Error:', error.message);
  }
}
```

---

### 6️⃣ **Complete Authentication Flow**

#### Step 1: Login
```javascript
// Frontend Login Request
POST http://185.193.19.244:8080/api/auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "67094f4a8be4c9ac5c0ca123",
      "email": "user@example.com",
      "name": "Rithik Mahajan",
      "phNo": "1234567890"
    }
  },
  "message": "Login successful"
}
```

#### Step 2: Store Token
```javascript
// React Native - AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('userToken', response.data.data.token);
await AsyncStorage.setItem('userId', response.data.data.user._id);
```

#### Step 3: Use Token in Requests
```javascript
// Get token before making request
const token = await AsyncStorage.getItem('userToken');

// Make authenticated request
const response = await axios.get(
  `${API_BASE_URL}/profile`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

---

### 7️⃣ **All Available Profile-Related Endpoints**

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/api/auth/login` | POST | ❌ No | Login with email/password |
| `/api/auth/loginFirebase` | POST | ❌ No | Login with Google/Apple/Phone |
| `/api/auth/signup` | POST | ❌ No | Create new account |
| `/api/profile` | GET | ✅ Yes | Get user profile |
| `/api/profile` | PUT | ✅ Yes | Update user profile |
| `/api/user/profile` | GET | ✅ Yes | Get user profile (alias) |
| `/api/user/profile` | PUT | ✅ Yes | Update user profile (alias) |
| `/api/userProfile/updateProfile` | PUT | ✅ Yes | Legacy profile update endpoint |

---

### 8️⃣ **Network Debugging Checklist**

#### ✅ Test Backend Connectivity:

```javascript
// Test 1: Health Check (No Auth Required)
fetch('http://185.193.19.244:8080/health')
  .then(res => res.json())
  .then(data => console.log('✅ Backend Health:', data))
  .catch(err => console.error('❌ Backend Error:', err));

// Expected Response:
{
  "status": "healthy",
  "uptime": 12345.67,
  "timestamp": "2025-10-12T09:41:00.000Z",
  "memory": { /* memory stats */ }
}

// Test 2: API Health Check (No Auth Required)
fetch('http://185.193.19.244:8080/api/health')
  .then(res => res.json())
  .then(data => console.log('✅ API Health:', data))
  .catch(err => console.error('❌ API Error:', err));

// Expected Response:
{
  "success": true,
  "status": "healthy",
  "message": "API is operational",
  "timestamp": "2025-10-12T09:41:00.000Z",
  "version": "1.0.0"
}
```

#### ✅ Test Authentication:

```javascript
// Test 3: Profile Request (Auth Required)
const token = 'YOUR_TOKEN_HERE';

fetch('http://185.193.19.244:8080/api/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('✅ Profile Retrieved:', data.data);
    } else {
      console.error('❌ Profile Error:', data.message);
    }
  })
  .catch(err => console.error('❌ Network Error:', err));
```

---

### 9️⃣ **Common Issues & Solutions**

#### Issue 1: "API endpoint not found: PUT /api/user/profile"

**Possible Causes:**
1. ❌ Frontend is concatenating URLs incorrectly
2. ❌ Base URL has trailing slash
3. ❌ Request is going to wrong server

**Solution:**
```javascript
// ❌ WRONG - Double slashes
const url = `${API_BASE_URL}/` + `/user/profile`; // Results in //user/profile

// ✅ CORRECT
const url = `${API_BASE_URL}/user/profile`;

// ✅ BETTER - Use path joining
const url = new URL('/api/user/profile', 'http://185.193.19.244:8080').toString();
```

#### Issue 2: "No token provided" or 401 Unauthorized

**Possible Causes:**
1. ❌ Token not stored after login
2. ❌ Token expired
3. ❌ Token format incorrect

**Solution:**
```javascript
// Check token storage
const token = await AsyncStorage.getItem('userToken');
console.log('Stored Token:', token ? 'EXISTS' : 'MISSING');

// Check token format
if (token && !token.startsWith('eyJ')) {
  console.error('❌ Invalid token format');
  // Token should be JWT format
}

// Check token expiry
try {
  const tokenParts = token.split('.');
  const payload = JSON.parse(atob(tokenParts[1]));
  const expiry = new Date(payload.exp * 1000);
  console.log('Token expires:', expiry);
  
  if (expiry < new Date()) {
    console.error('❌ Token expired');
    // Refresh token or re-login
  }
} catch (e) {
  console.error('❌ Error decoding token:', e);
}
```

#### Issue 3: Network Request Failed

**Possible Causes:**
1. ❌ Backend server is down
2. ❌ Wrong IP/Port
3. ❌ Firewall blocking request
4. ❌ Mobile device on different network

**Solution:**
```javascript
// Test from terminal first
// From your Mac:
curl -X GET http://185.193.19.244:8080/health

// If above works, test from mobile network:
// 1. Enable mobile hotspot
// 2. Connect Mac to mobile hotspot
// 3. Get Mac's IP: ifconfig | grep "inet "
// 4. Update API_BASE_URL to Mac's IP:
const API_BASE_URL = 'http://192.168.X.X:8080/api'; // Your Mac's IP
```

---

### 🔟 **Frontend Implementation Example**

#### Complete Profile Screen Implementation:

```javascript
// ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'http://185.193.19.244:8080/api';

export default function ProfileScreen() {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
  });
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Get token
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Error', 'Please login first');
        return;
      }
      setToken(userToken);

      // Fetch profile
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/profile`,
        {
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setProfile(response.data.data);
        console.log('✅ Profile loaded:', response.data.data);
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (error) {
      console.error('❌ Load Profile Error:', error);
      
      if (error.response) {
        // Server responded with error
        Alert.alert(
          'Error',
          error.response.data.message || 'Failed to load profile'
        );
        
        if (error.response.status === 401) {
          // Redirect to login
          // navigation.navigate('Login');
        }
      } else if (error.request) {
        // No response from server
        Alert.alert(
          'Network Error',
          'Cannot connect to server. Please check your internet connection.'
        );
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      if (!token) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      setLoading(true);
      const response = await axios.put(
        `${API_BASE_URL}/profile`,
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone,
          gender: profile.gender,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setProfile(response.data.data);
        console.log('✅ Profile updated:', response.data.data);
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (error) {
      console.error('❌ Update Profile Error:', error);
      
      if (error.response) {
        Alert.alert(
          'Error',
          error.response.data.message || 'Failed to update profile'
        );
      } else if (error.request) {
        Alert.alert(
          'Network Error',
          'Cannot connect to server. Please check your internet connection.'
        );
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="First Name"
        value={profile.firstName}
        onChangeText={(text) => setProfile({ ...profile, firstName: text })}
      />
      
      <TextInput
        placeholder="Last Name"
        value={profile.lastName}
        onChangeText={(text) => setProfile({ ...profile, lastName: text })}
      />
      
      <TextInput
        placeholder="Email"
        value={profile.email}
        onChangeText={(text) => setProfile({ ...profile, email: text })}
      />
      
      <TextInput
        placeholder="Phone"
        value={profile.phone}
        onChangeText={(text) => setProfile({ ...profile, phone: text })}
      />
      
      {/* Gender Picker - Must use exact values */}
      <Picker
        selectedValue={profile.gender}
        onValueChange={(value) => setProfile({ ...profile, gender: value })}
      >
        <Picker.Item label="Select Gender" value="" />
        <Picker.Item label="Male" value="Male" />
        <Picker.Item label="Female" value="Female" />
        <Picker.Item label="Other" value="Other" />
      </Picker>
      
      <Button
        title={loading ? "Saving..." : "Save Profile"}
        onPress={updateProfile}
        disabled={loading}
      />
    </View>
  );
}
```

---

## 📊 **Backend Endpoint Summary**

### ✅ All Endpoints Currently Available:

```
Authentication:
✅ POST   /api/auth/login
✅ POST   /api/auth/loginFirebase
✅ POST   /api/auth/signup
✅ POST   /api/auth/generate-otp
✅ POST   /api/auth/verifyOtp
✅ POST   /api/auth/logout
✅ POST   /api/auth/refresh-token

Profile (Direct - Recommended):
✅ GET    /api/profile
✅ PUT    /api/profile

Profile (Alias - Mobile Compatible):
✅ GET    /api/user/profile
✅ PUT    /api/user/profile

Legacy Profile:
✅ PUT    /api/userProfile/updateProfile

Health Checks:
✅ GET    /health
✅ GET    /api/health
✅ GET    /api/status

Product Reviews:
✅ POST   /api/products/:productId/reviews
✅ GET    /api/products/:productId/reviews
```

---

## ✅ **VERIFICATION STEPS**

### Frontend Team Must Verify:

1. **Base URL Configuration**
   - [ ] `API_BASE_URL` is set to `http://185.193.19.244:8080/api`
   - [ ] No trailing slashes in base URL
   - [ ] All API calls use this base URL

2. **Authentication**
   - [ ] Token is saved after successful login
   - [ ] Token is included in all authenticated requests
   - [ ] Token format: `Bearer ${token}`
   - [ ] Proper error handling for 401 responses

3. **Profile Endpoints**
   - [ ] Using `/api/profile` or `/api/user/profile`
   - [ ] Not using `/api/user` as base URL
   - [ ] Gender field uses exact values: `Male`, `Female`, `Other`
   - [ ] Request body structure matches backend expectations

4. **Error Handling**
   - [ ] Handling network errors (no response)
   - [ ] Handling server errors (500)
   - [ ] Handling auth errors (401)
   - [ ] Handling not found errors (404)

5. **Testing**
   - [ ] Test health endpoint first
   - [ ] Test login flow
   - [ ] Test profile GET
   - [ ] Test profile PUT
   - [ ] Check console logs for errors

---

## 🔧 **Quick Test Scripts**

### Test 1: Backend Connectivity
```bash
# Run from terminal
curl -X GET http://185.193.19.244:8080/health
```

### Test 2: Login & Get Token
```bash
curl -X POST http://185.193.19.244:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Test 3: Get Profile (Replace YOUR_TOKEN)
```bash
curl -X GET http://185.193.19.244:8080/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test 4: Update Profile (Replace YOUR_TOKEN)
```bash
curl -X PUT http://185.193.19.244:8080/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Rithik",
    "lastName": "Mahajan",
    "gender": "Male",
    "phone": "1234567890"
  }'
```

---

## 📞 **Support & Debugging**

### If Issues Persist:

1. **Enable Backend Logging**
   - Backend already has detailed console logs
   - Check backend terminal for incoming requests
   - Look for: `📝 Updating user profile via /api/user/profile`

2. **Enable Frontend Logging**
   ```javascript
   // Add before every API call
   console.log('🔍 Making request to:', url);
   console.log('🔍 Headers:', headers);
   console.log('🔍 Body:', body);
   
   // Add in catch block
   console.error('❌ Full error:', JSON.stringify(error, null, 2));
   ```

3. **Network Inspection**
   - Use React Native Debugger
   - Check Network tab in Chrome DevTools
   - Verify exact URL being called
   - Verify headers being sent

4. **Common Fixes**
   ```javascript
   // Clear AsyncStorage and re-login
   await AsyncStorage.clear();
   
   // Force logout and login again
   // Verify new token is saved
   ```

---

## ✨ **Summary**

### Backend Status: ✅ READY
- All endpoints implemented
- Both `/api/profile` and `/api/user/profile` work
- Comprehensive error handling
- Detailed logging for debugging

### Frontend Requirements:
1. ✅ Use correct base URL: `http://185.193.19.244:8080/api`
2. ✅ Include auth token in headers: `Authorization: Bearer ${token}`
3. ✅ Use `/profile` or `/user/profile` endpoint (not `/user` base)
4. ✅ Send correct gender values: `Male`, `Female`, `Other`
5. ✅ Handle all error responses appropriately

### Next Steps:
1. Update frontend API configuration
2. Test health endpoint
3. Test login and token storage
4. Test profile GET
5. Test profile PUT with all fields
6. Verify gender field saves correctly

---

**Backend Contact:** Backend Team  
**API Documentation:** See `FRONTEND_HANDOFF.md`  
**Last Sync Check:** October 12, 2025
