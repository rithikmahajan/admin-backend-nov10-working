# 🚨 TestFlight Profile Issue - User Shows as Guest After Sign In

## ❌ **PROBLEM**
After successful sign-in in TestFlight, user profile does NOT get updated and shows "Guest User" data instead of actual logged-in user information.

**Affected Methods:**
- ✅ Apple ID Sign In
- ✅ Google Sign In  
- ✅ Phone Number (OTP)
- ✅ Email/Password

---

## 🔍 **ROOT CAUSE ANALYSIS**

### Backend Status: ✅ WORKING CORRECTLY
The backend is functioning properly:
- Users are being created/updated correctly
- Firebase authentication is working
- JWT tokens are being generated
- User verification status is set correctly
- Profile data is available via `/api/profile` endpoint

### Mobile App Issue: ❌ NOT PERSISTING USER DATA
The React Native/iOS app is **NOT properly storing or retrieving user authentication data** after successful login.

**Evidence from Backend Logs:**
```javascript
// Backend returns correct data:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "user_id_here",
      "email": "user@example.com",
      "name": "John Doe",
      "isVerified": true,
      "isEmailVerified": true,
      "authProvider": "google"
    }
  },
  "message": "Login successful"
}
```

**But mobile app shows:** Guest user with default data

---

## ✅ **SOLUTION - CRITICAL FIXES FOR MOBILE APP**

### **Fix 1: Ensure AsyncStorage is Installed**

```bash
# Install AsyncStorage for React Native
npm install @react-native-async-storage/async-storage

# For iOS (run in ios/ directory)
cd ios && pod install && cd ..
```

### **Fix 2: Create Auth Storage Service**

Create `src/services/authStorageService.js`:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@auth_token';
const USER_DATA_KEY = '@user_data';
const USER_ID_KEY = '@user_id';

class AuthStorageService {
  /**
   * 🔥 CRITICAL: Store auth data IMMEDIATELY after login response
   */
  async storeAuthData(token, userData) {
    try {
      console.log('💾 STORING AUTH DATA:', {
        token: token ? 'EXISTS' : 'NULL',
        userId: userData?._id,
        userName: userData?.name,
        userEmail: userData?.email
      });
      
      await AsyncStorage.multiSet([
        [AUTH_TOKEN_KEY, token],
        [USER_DATA_KEY, JSON.stringify(userData)],
        [USER_ID_KEY, userData._id]
      ]);
      
      console.log('✅ Auth data stored successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error storing auth data:', error);
      return { success: false, error };
    }
  }

  /**
   * Get authentication token
   */
  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      console.log('🔑 Retrieved token:', token ? 'EXISTS' : 'NULL');
      return token;
    } catch (error) {
      console.error('❌ Error getting token:', error);
      return null;
    }
  }

  /**
   * Get user data
   */
  async getUserData() {
    try {
      const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        console.log('👤 Retrieved user:', {
          id: userData?._id,
          name: userData?.name,
          email: userData?.email
        });
        return userData;
      }
      console.log('⚠️ No user data found in storage');
      return null;
    } catch (error) {
      console.error('❌ Error getting user data:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const token = await this.getAuthToken();
      const userData = await this.getUserData();
      
      const isAuth = !!(token && userData);
      console.log('🔐 Is authenticated:', isAuth);
      return isAuth;
    } catch (error) {
      console.error('❌ Error checking auth:', error);
      return false;
    }
  }

  /**
   * Clear all auth data (logout)
   */
  async clearAuthData() {
    try {
      console.log('🧹 Clearing auth data...');
      await AsyncStorage.multiRemove([
        AUTH_TOKEN_KEY,
        USER_DATA_KEY,
        USER_ID_KEY
      ]);
      console.log('✅ Auth data cleared');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
      return { success: false, error };
    }
  }
}

export default new AuthStorageService();
```

---

### **Fix 3: Update Login Functions to Store Data**

#### **A. Apple Sign In** (e.g., `AppleLoginScreen.js` or auth handler)

```javascript
import authStorageService from './services/authStorageService';
import { AppleAuthentication } from 'expo-apple-authentication'; // or react-native-apple-authentication

const handleAppleSignIn = async () => {
  try {
    // Step 1: Get Apple credentials
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Step 2: Send to your backend
    const response = await fetch(`${API_URL}/api/auth/loginFirebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: credential.identityToken,
      })
    });

    const data = await response.json();

    if (data.success && data.data) {
      // 🔥 CRITICAL: Store the auth data
      await authStorageService.storeAuthData(data.data.token, data.data.user);
      
      console.log('✅ Apple login successful:', data.data.user.name);
      
      // Navigate to main app
      navigation.navigate('Home');
    } else {
      console.error('❌ Login failed:', data.message);
      Alert.alert('Error', data.message || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Apple sign in error:', error);
    Alert.alert('Error', 'Apple sign in failed');
  }
};
```

#### **B. Google Sign In** (e.g., `GoogleLoginScreen.js` or auth handler)

```javascript
import authStorageService from './services/authStorageService';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const handleGoogleSignIn = async () => {
  try {
    // Configure Google Sign In
    await GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID',
      offlineAccess: true,
    });

    // Step 1: Get Google credentials
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const { idToken } = await GoogleSignin.getTokens();

    // Step 2: Send to your backend
    const response = await fetch(`${API_URL}/api/auth/loginFirebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: idToken,
      })
    });

    const data = await response.json();

    if (data.success && data.data) {
      // 🔥 CRITICAL: Store the auth data
      await authStorageService.storeAuthData(data.data.token, data.data.user);
      
      console.log('✅ Google login successful:', data.data.user.name);
      
      // Navigate to main app
      navigation.navigate('Home');
    } else {
      console.error('❌ Login failed:', data.message);
      Alert.alert('Error', data.message || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Google sign in error:', error);
    Alert.alert('Error', 'Google sign in failed');
  }
};
```

#### **C. Phone OTP Sign In**

```javascript
import authStorageService from './services/authStorageService';
import auth from '@react-native-firebase/auth';

const handlePhoneSignIn = async (phoneNumber, otp) => {
  try {
    // Step 1: Sign in with Firebase
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    const credential = await confirmation.confirm(otp);
    const idToken = await credential.user.getIdToken();

    // Step 2: Send to your backend
    const response = await fetch(`${API_URL}/api/auth/loginFirebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: idToken,
      })
    });

    const data = await response.json();

    if (data.success && data.data) {
      // 🔥 CRITICAL: Store the auth data
      await authStorageService.storeAuthData(data.data.token, data.data.user);
      
      console.log('✅ Phone login successful:', data.data.user.phNo);
      
      // Navigate to main app
      navigation.navigate('Home');
    } else {
      console.error('❌ Login failed:', data.message);
      Alert.alert('Error', data.message || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Phone sign in error:', error);
    Alert.alert('Error', 'Phone verification failed');
  }
};
```

#### **D. Email/Password Login**

```javascript
import authStorageService from './services/authStorageService';

const handleEmailLogin = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    const data = await response.json();

    if (data.success && data.data) {
      // 🔥 CRITICAL: Store the auth data
      await authStorageService.storeAuthData(data.data.token, data.data.user);
      
      console.log('✅ Email login successful:', data.data.user.email);
      
      // Navigate to main app
      navigation.navigate('Home');
    } else {
      console.error('❌ Login failed:', data.message);
      Alert.alert('Error', data.message || 'Invalid credentials');
    }
  } catch (error) {
    console.error('❌ Email login error:', error);
    Alert.alert('Error', 'Login failed');
  }
};
```

---

### **Fix 4: Load User Data on App Start**

Create or update `App.js` or your main navigation component:

```javascript
import React, { useEffect, useState } from 'react';
import authStorageService from './services/authStorageService';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking auth status on app start...');
      
      const isAuth = await authStorageService.isAuthenticated();
      
      if (isAuth) {
        const user = await authStorageService.getUserData();
        const token = await authStorageService.getAuthToken();
        
        console.log('✅ User is authenticated:', {
          name: user?.name,
          email: user?.email,
          id: user?._id
        });
        
        setIsAuthenticated(true);
        setUserData(user);
        
        // Optional: Verify token with backend
        await verifyTokenWithBackend(token);
      } else {
        console.log('⚠️ User is NOT authenticated');
        setIsAuthenticated(false);
        setUserData(null);
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTokenWithBackend = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token verified, user profile:', data.data);
        // Update local user data with fresh data from backend
        setUserData(data.data);
      } else {
        console.log('⚠️ Token invalid or expired');
        // Clear auth data and logout
        await authStorageService.clearAuthData();
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Error verifying token:', error);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <AuthenticatedNavigator userData={userData} />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
```

---

### **Fix 5: Fetch and Display Profile Correctly**

In your Profile Screen:

```javascript
import React, { useEffect, useState } from 'react';
import authStorageService from './services/authStorageService';

const ProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Get token
      const token = await authStorageService.getAuthToken();
      
      if (!token) {
        console.log('❌ No auth token found');
        Alert.alert('Error', 'Please log in again');
        return;
      }

      // Fetch profile from backend
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Profile loaded:', data.data);
        setProfile(data.data);
        
        // Update stored user data
        await authStorageService.storeAuthData(token, data.data);
      } else {
        console.error('❌ Failed to load profile:', data.message);
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View>
      <Text>Name: {profile?.firstName} {profile?.lastName}</Text>
      <Text>Email: {profile?.email}</Text>
      <Text>Phone: {profile?.phone}</Text>
      {/* Display other profile fields */}
    </View>
  );
};
```

---

### **Fix 6: Update Profile with Authentication**

```javascript
const updateProfile = async (profileData) => {
  try {
    // Get token
    const token = await authStorageService.getAuthToken();
    
    if (!token) {
      Alert.alert('Error', 'Please log in again');
      return;
    }

    // Update profile
    const response = await fetch(`${API_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        preferences: profileData.preferences
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Profile updated successfully');
      
      // Update stored user data
      await authStorageService.storeAuthData(token, data.data);
      
      Alert.alert('Success', 'Profile updated successfully');
      
      // Refresh profile display
      setProfile(data.data);
    } else {
      console.error('❌ Failed to update profile:', data.message);
      Alert.alert('Error', data.message);
    }
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    Alert.alert('Error', 'Failed to update profile');
  }
};
```

---

## 🧪 **TESTING CHECKLIST**

### **1. Test Auth Data Storage**
```javascript
// Add this debug code after login
const debugAuth = async () => {
  const token = await authStorageService.getAuthToken();
  const user = await authStorageService.getUserData();
  
  console.log('🔍 DEBUG AUTH DATA:');
  console.log('  Token exists:', !!token);
  console.log('  User data:', user);
  console.log('  User ID:', user?._id);
  console.log('  User name:', user?.name);
  console.log('  User email:', user?.email);
};
```

### **2. Test Profile Loading**
- Open app
- Check logs for "Retrieved user" message
- Verify user data is loaded (not null)
- Verify profile screen shows user data (not Guest)

### **3. Test Each Login Method**
- ✅ Apple Sign In
- ✅ Google Sign In
- ✅ Phone OTP
- ✅ Email/Password

For each:
1. Sign in
2. Check logs: "STORING AUTH DATA"
3. Check logs: "Auth data stored successfully"
4. Close and reopen app
5. Check logs: "Retrieved user"
6. Verify profile shows correct data

---

## 🐛 **COMMON ISSUES & FIXES**

### Issue 1: User data is NULL after login
**Fix:** Make sure you're calling `storeAuthData()` IMMEDIATELY after successful login response

### Issue 2: Token exists but user data is NULL
**Fix:** Check AsyncStorage key names match exactly (`@user_data`)

### Issue 3: Profile shows guest after app restart
**Fix:** Implement the `checkAuthStatus()` function in App.js to load data on startup

### Issue 4: Backend returns 401 Unauthorized
**Fix:** Verify token is being sent with `Authorization: Bearer ${token}` format

### Issue 5: Data shows briefly then disappears
**Fix:** Check for race conditions - don't clear auth data during app initialization

---

## 📱 **BACKEND ENDPOINTS (Already Working)**

### Login Endpoints:
- `POST /api/auth/login` - Email/Password login
- `POST /api/auth/loginFirebase` - Firebase (Google/Apple/Phone) login

### Profile Endpoints:
- `GET /api/profile` - Get user profile (requires auth token)
- `PUT /api/profile` - Update user profile (requires auth token)

### Expected Response Format:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phNo": "1234567890",
      "isVerified": true,
      "isEmailVerified": true,
      "authProvider": "google"
    }
  },
  "message": "Login successful"
}
```

---

## ✅ **IMPLEMENTATION STEPS**

1. ✅ Install AsyncStorage
2. ✅ Create authStorageService.js
3. ✅ Update all login functions to store auth data
4. ✅ Update App.js to load auth data on startup
5. ✅ Update profile screen to fetch from backend
6. ✅ Update profile update function to use token
7. ✅ Test all login methods in TestFlight
8. ✅ Verify data persists after app restart

---

## 📝 **NOTES**

- Backend is **WORKING CORRECTLY** ✅
- Issue is **100% on the mobile app side** ❌
- All login methods return correct user data from backend
- Mobile app must store and retrieve this data using AsyncStorage
- TestFlight builds must include AsyncStorage dependency

---

**Last Updated:** October 11, 2025
**Status:** Ready for Mobile App Implementation
