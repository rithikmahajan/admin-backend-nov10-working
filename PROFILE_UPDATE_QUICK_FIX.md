# 🚀 Quick Fix Guide - React Native Profile Update Issue

## Problem
React Native app users cannot update their profile details.

## Solution
Added a new `PUT /api/profile` endpoint and secured existing endpoints.

---

## ✅ For React Native Developers

### Use This Endpoint:
```
PUT /api/profile
```

### Example Request:
```javascript
const response = await fetch('http://your-server:8001/api/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${yourAuthToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+919876543210',
    preferences: {
      currency: 'INR',
      language: 'en',
      notifications: true
    }
  })
});

const data = await response.json();
console.log(data.data); // Updated profile
```

### Response Format:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "profileImage": "...",
    "membershipTier": "basic",
    "pointsBalance": 100,
    "isEmailVerified": true,
    "isPhoneVerified": true,
    "preferences": {
      "currency": "INR",
      "language": "en",
      "notifications": true
    },
    "addresses": [...]
  },
  "message": "Profile updated successfully"
}
```

---

## 🔐 Important Security Notes

1. **Always include Authorization header** with Bearer token
2. **Users can only update their own profile**
3. **Admins can update any profile**
4. **Password field is never returned** in responses

---

## 📝 Available Profile Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/profile` | Get current user profile | ✅ Yes |
| PUT | `/api/profile` | Update current user profile | ✅ Yes |
| PUT | `/api/userProfile/updateProfile` | Update with image (multipart) | ✅ Yes |
| PATCH | `/api/user/:id` | Update user by ID | ✅ Yes |
| GET | `/api/user/getUser` | Get user details | ✅ Yes |

---

## 🧪 Testing

### Quick Test with cURL:
```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phNo":"1234567890","password":"test123"}' \
  | jq -r '.token')

# 2. Update Profile
curl -X PUT http://localhost:8001/api/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User"}'

# 3. Get Profile
curl http://localhost:8001/api/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Import Postman Collection:
```
User_Profile_Update_Fix.postman_collection.json
```

### Run Test Script:
```bash
node test-profile-update.js
```

---

## 📱 React Native Code Example

```javascript
// api/profile.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://your-server:8001/api';

export const updateProfile = async (profileData) => {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};

// Usage in component
const handleSaveProfile = async () => {
  try {
    const result = await updateProfile({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+919876543210'
    });
    
    Alert.alert('Success', 'Profile updated!');
    console.log('Updated profile:', result.data);
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

---

## 🎯 What Changed?

### ✅ Added (index.js)
- `PUT /api/profile` - New endpoint for easy profile updates

### 🔒 Secured (UserRoutes.js)
- `PATCH /api/user/:id` - Now requires authentication

### 🛡️ Protected (UserController.js)
- Added authorization check - users can only update own profile
- Added detailed logging for debugging

---

## 📚 Full Documentation
See: `REACT_NATIVE_PROFILE_UPDATE_FIX.md`

---

## ✨ Key Features

- ✅ Works with React Native
- ✅ Simple API design
- ✅ Secure authentication
- ✅ Authorization checks
- ✅ Detailed error messages
- ✅ Consistent response format
- ✅ Logging for debugging
- ✅ Updates both User and UserProfile models

---

## 🆘 Troubleshooting

### 401 Unauthorized
- Check if auth token is valid
- Ensure token is not expired
- Verify Authorization header format: `Bearer <token>`

### 403 Forbidden
- You're trying to update someone else's profile
- Only admins can update other users

### 404 Not Found
- User doesn't exist
- Check user ID is correct

### 500 Internal Server Error
- Check server logs
- Verify database connection
- Ensure all required fields are provided

---

## 📞 Support

Check server logs for detailed error messages. Look for these markers:
- 📝 Update attempt
- ✅ Success
- ❌ Error

---

**Status**: ✅ Fixed and Deployed
**Server**: Running on port 8001
**Date**: 11 October 2025
