# 🚀 QUICK FIX: TestFlight Guest User Issue

## ❌ Problem
User shows as "Guest" in TestFlight even after successful login.

## ✅ Solution
Mobile app is NOT storing user data after login. Fix in **3 steps**:

---

## STEP 1: Install AsyncStorage

```bash
npm install @react-native-async-storage/async-storage
cd ios && pod install && cd ..
```

---

## STEP 2: Create Auth Service

Create `src/services/authStorageService.js`:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthStorageService {
  async storeAuthData(token, userData) {
    await AsyncStorage.multiSet([
      ['@auth_token', token],
      ['@user_data', JSON.stringify(userData)],
      ['@user_id', userData._id]
    ]);
  }

  async getAuthToken() {
    return await AsyncStorage.getItem('@auth_token');
  }

  async getUserData() {
    const data = await AsyncStorage.getItem('@user_data');
    return data ? JSON.parse(data) : null;
  }

  async clearAuthData() {
    await AsyncStorage.multiRemove(['@auth_token', '@user_data', '@user_id']);
  }
}

export default new AuthStorageService();
```

---

## STEP 3: Update ALL Login Functions

### 🔥 CRITICAL: Add this line after EVERY successful login:

```javascript
import authStorageService from './services/authStorageService';

// After login API call succeeds:
if (response.data.success && response.data.data) {
  // 🔥 ADD THIS LINE:
  await authStorageService.storeAuthData(
    response.data.data.token, 
    response.data.data.user
  );
  
  // Then navigate
  navigation.navigate('Home');
}
```

### Example for Each Login Method:

#### Apple Sign In:
```javascript
const handleAppleSignIn = async () => {
  const credential = await AppleAuthentication.signInAsync({...});
  
  const response = await fetch(`${API_URL}/api/auth/loginFirebase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: credential.identityToken })
  });
  
  const data = await response.json();
  
  if (data.success && data.data) {
    // 🔥 STORE AUTH DATA
    await authStorageService.storeAuthData(data.data.token, data.data.user);
    navigation.navigate('Home');
  }
};
```

#### Google Sign In:
```javascript
const handleGoogleSignIn = async () => {
  const userInfo = await GoogleSignin.signIn();
  const { idToken } = await GoogleSignin.getTokens();
  
  const response = await fetch(`${API_URL}/api/auth/loginFirebase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  
  const data = await response.json();
  
  if (data.success && data.data) {
    // 🔥 STORE AUTH DATA
    await authStorageService.storeAuthData(data.data.token, data.data.user);
    navigation.navigate('Home');
  }
};
```

#### Phone OTP:
```javascript
const handlePhoneSignIn = async (phoneNumber, otp) => {
  const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
  const credential = await confirmation.confirm(otp);
  const idToken = await credential.user.getIdToken();
  
  const response = await fetch(`${API_URL}/api/auth/loginFirebase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  
  const data = await response.json();
  
  if (data.success && data.data) {
    // 🔥 STORE AUTH DATA
    await authStorageService.storeAuthData(data.data.token, data.data.user);
    navigation.navigate('Home');
  }
};
```

#### Email/Password:
```javascript
const handleEmailLogin = async (email, password) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.success && data.data) {
    // 🔥 STORE AUTH DATA
    await authStorageService.storeAuthData(data.data.token, data.data.user);
    navigation.navigate('Home');
  }
};
```

---

## STEP 4: Load on App Start

In `App.js`:

```javascript
import authStorageService from './services/authStorageService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await authStorageService.getAuthToken();
    const user = await authStorageService.getUserData();
    
    if (token && user) {
      setIsAuthenticated(true);
      setUserData(user);
    }
  };

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MainNavigator userData={userData} />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
```

---

## STEP 5: Use Token for API Calls

### Get Profile:
```javascript
const fetchProfile = async () => {
  const token = await authStorageService.getAuthToken();
  
  const response = await fetch(`${API_URL}/api/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  if (data.success) {
    setProfile(data.data);
  }
};
```

### Update Profile:
```javascript
const updateProfile = async (profileData) => {
  const token = await authStorageService.getAuthToken();
  
  const response = await fetch(`${API_URL}/api/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });
  
  const data = await response.json();
  if (data.success) {
    Alert.alert('Success', 'Profile updated!');
  }
};
```

---

## 🧪 Test Checklist

After implementing:

1. ✅ Login with Apple ID
   - Check console: "STORING AUTH DATA"
   - Close app completely
   - Reopen app
   - User should still be logged in (not Guest)

2. ✅ Login with Google
   - Same test as above

3. ✅ Login with Phone
   - Same test as above

4. ✅ Login with Email
   - Same test as above

---

## 🐛 Debug

Add this to your profile screen:

```javascript
useEffect(() => {
  debugAuth();
}, []);

const debugAuth = async () => {
  const token = await authStorageService.getAuthToken();
  const user = await authStorageService.getUserData();
  
  console.log('🔍 DEBUG:');
  console.log('  Token:', token ? 'EXISTS' : 'NULL');
  console.log('  User:', user);
  console.log('  Name:', user?.name);
  console.log('  Email:', user?.email);
};
```

If you see "Token: NULL" or "User: null" → Auth data not stored
If you see data → Auth data stored correctly ✅

---

## 📋 Backend Endpoints (Already Working)

- `POST /api/auth/login` - Email/Password
- `POST /api/auth/loginFirebase` - Apple/Google/Phone
- `GET /api/profile` - Get profile (needs token)
- `PUT /api/profile` - Update profile (needs token)

**All endpoints return:**
```json
{
  "success": true,
  "data": {
    "token": "...",
    "user": {
      "_id": "...",
      "name": "...",
      "email": "...",
      "isVerified": true
    }
  }
}
```

---

## ⚡ Summary

1. Backend is working ✅
2. Issue is in mobile app ❌
3. Fix: Store auth data after login
4. Use authStorageService everywhere
5. Test all login methods in TestFlight

**Time to fix: ~30 minutes**

---

**Questions?** See `TESTFLIGHT_PROFILE_FIX.md` for detailed explanation.
