# User Profile Update Fix - React Native App

## Problem Summary
The React Native app users were unable to update their profile details. The issue was that the backend was missing a proper endpoint for profile updates that the React Native app could easily use.

## Root Cause
1. **Missing Endpoint**: There was no `PUT /api/profile` endpoint - only a `GET /api/profile` endpoint existed
2. **Unprotected Route**: The `PATCH /api/user/:id` route was not protected with authentication
3. **No Authorization Check**: Users could potentially update other users' profiles

## Solution Implemented

### 1. Added PUT /api/profile Endpoint
**File**: `index.js`

Created a new endpoint `PUT /api/profile` that:
- ✅ Requires authentication (`verifyToken` middleware)
- ✅ Updates user details (name, email, phone, preferences)
- ✅ Updates UserProfile (email, profile image)
- ✅ Returns consistent response format for React Native app
- ✅ Handles firstName/lastName separately and combines them into name field
- ✅ Marks profile as complete after update
- ✅ Logs all operations for debugging

**Endpoint Details**:
```
PUT /api/profile
Headers: 
  - Authorization: Bearer <token>
Body:
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+919876543210",
    "profileImage": "https://...",
    "preferences": {
      "currency": "INR",
      "language": "en",
      "notifications": true
    }
  }
```

### 2. Secured PATCH /api/user/:id Endpoint
**File**: `src/routes/UserRoutes.js`

- ✅ Added `verifyToken` middleware to require authentication
- ✅ Changed access level from Public to Protected

### 3. Added Authorization Check
**File**: `src/controllers/userController/UserController.js`

Enhanced `updateById` controller to:
- ✅ Check if requesting user is updating their own profile
- ✅ Allow admins to update any user's profile
- ✅ Return 403 Forbidden if user tries to update someone else's profile
- ✅ Add mongoose validation with `runValidators: true`
- ✅ Add detailed logging for debugging

## Available Endpoints for Profile Management

### React Native App - Recommended Endpoints:

#### 1. Get User Profile
```
GET /api/profile
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": {
    "id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "profileImage": "https://...",
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
  }
}
```

#### 2. Update User Profile (NEW - Recommended for React Native)
```
PUT /api/profile
Headers: Authorization: Bearer <token>
Body: {
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "preferences": {
    "currency": "USD",
    "language": "en",
    "notifications": true
  }
}
Response: Same as GET /api/profile
```

#### 3. Update User Profile (Multipart - for images)
```
PUT /api/userProfile/updateProfile
Headers: 
  - Authorization: Bearer <token>
  - Content-Type: multipart/form-data
Form Data:
  - name: "John Doe"
  - email: "john@example.com"
  - phNo: "+919876543210"
  - image: <file>
  - dob: "1990-01-01"
  - gender: "Male"
  - firstName: "John"
  - lastName: "Doe"
  - address: "123 Street"
  - city: "Mumbai"
  - state: "Maharashtra"
  - pinCode: "400001"
```

#### 4. Update User by ID (Now Protected)
```
PATCH /api/user/:id
Headers: Authorization: Bearer <token>
Body: {
  "name": "John Doe",
  "email": "john@example.com"
}
```

## React Native Integration

### Update Profile in React Native

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://your-server:8001/api';

// Get auth token
const getToken = async () => {
  return await AsyncStorage.getItem('authToken');
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  try {
    const token = await getToken();
    
    const response = await axios.put(
      `${API_BASE_URL}/profile`,
      {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        preferences: {
          currency: profileData.currency || 'INR',
          language: profileData.language || 'en',
          notifications: profileData.notifications !== false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Profile updated successfully');
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Update failed');
    }
  } catch (error) {
    console.error('❌ Profile update error:', error.response?.data || error.message);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async () => {
  try {
    const token = await getToken();
    
    const response = await axios.get(
      `${API_BASE_URL}/profile`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Get profile error:', error.response?.data || error.message);
    throw error;
  }
};
```

### Example React Native Component

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { updateUserProfile, getUserProfile } from './api/profile';

export default function ProfileScreen() {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getUserProfile();
      setProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updateUserProfile(profile);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>First Name:</Text>
      <TextInput
        value={profile.firstName}
        onChangeText={(text) => setProfile({ ...profile, firstName: text })}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      
      <Text>Last Name:</Text>
      <TextInput
        value={profile.lastName}
        onChangeText={(text) => setProfile({ ...profile, lastName: text })}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      
      <Text>Email:</Text>
      <TextInput
        value={profile.email}
        onChangeText={(text) => setProfile({ ...profile, email: text })}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      
      <Text>Phone:</Text>
      <TextInput
        value={profile.phone}
        onChangeText={(text) => setProfile({ ...profile, phone: text })}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      
      <Button 
        title={loading ? "Updating..." : "Update Profile"} 
        onPress={handleUpdate}
        disabled={loading}
      />
    </View>
  );
}
```

## Security Improvements

1. **Authentication Required**: All profile update endpoints now require valid JWT token
2. **Authorization Check**: Users can only update their own profiles (unless admin)
3. **Input Validation**: Mongoose validators run on all updates
4. **Password Protection**: Password field is always removed from responses
5. **Logging**: All operations are logged for audit trail

## Testing

### Test Script
A test script has been created: `test-profile-update.js`

Run it with:
```bash
node test-profile-update.js
```

### Manual Testing with cURL

```bash
# 1. Login to get token
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phNo":"1234567890","password":"test123"}'

# 2. Update profile (replace TOKEN with actual token)
curl -X PUT http://localhost:8001/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "firstName":"John",
    "lastName":"Doe",
    "email":"john@example.com",
    "phone":"+919876543210"
  }'

# 3. Get updated profile
curl -X GET http://localhost:8001/api/profile \
  -H "Authorization: Bearer TOKEN"
```

## Files Modified

1. `/Users/rithikmahajan/Desktop/oct-7-backend-admin-main/index.js`
   - Added `PUT /api/profile` endpoint

2. `/Users/rithikmahajan/Desktop/oct-7-backend-admin-main/src/routes/UserRoutes.js`
   - Added `verifyToken` middleware to `PATCH /:id` route

3. `/Users/rithikmahajan/Desktop/oct-7-backend-admin-main/src/controllers/userController/UserController.js`
   - Enhanced `updateById` with authorization checks

## Next Steps for React Native Team

1. **Update API calls** in the React Native app to use `PUT /api/profile`
2. **Ensure auth token** is included in all requests
3. **Handle error responses** properly (401, 403, 404, 500)
4. **Test thoroughly** with different user accounts
5. **Update state management** to refresh profile data after updates

## Error Handling

The endpoint returns standard error responses:

- **401 Unauthorized**: Token missing or invalid
- **403 Forbidden**: User trying to update someone else's profile
- **404 Not Found**: User not found
- **500 Internal Server Error**: Server error (check logs)

## Logging

All profile update operations log the following:
- User ID attempting the update
- Data being updated
- Success/failure status
- Any errors encountered

Check server logs for debugging:
```bash
# Look for these emoji markers:
📝 - Update attempt
✅ - Success
❌ - Error
```

## Conclusion

The React Native app should now be able to:
- ✅ Update user profile details successfully
- ✅ Get updated profile data immediately
- ✅ Handle errors gracefully
- ✅ Work securely with proper authentication

The fix ensures data consistency between User and UserProfile models and provides a clean API for the React Native frontend.
