# Quick Authentication Test Reference - CORRECTED ✅

## 🚀 Correct Implementation

**All Firebase Authentication (Phone/Google/Apple) uses ONE endpoint:**

```
POST /api/auth/login/firebase
Body: { idToken: "firebase-id-token" }
```

---

## ✅ **Phone Authentication (Firebase)**

**React Native Code:**
```javascript
import auth from '@react-native-firebase/auth';

// Step 1: Send OTP (Firebase sends SMS)
const confirmation = await auth().signInWithPhoneNumber('+911234567890');

// Step 2: User enters OTP from SMS
const userCredential = await confirmation.confirm('123456');

// Step 3: Get Firebase token
const firebaseIdToken = await userCredential.user.getIdToken();

// Step 4: Send to backend
fetch('http://localhost:8001/api/auth/login/firebase', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ idToken: firebaseIdToken })
});
```

**✅ Success = JWT token + auto-created account**

**Note:** Cannot test with cURL - requires Firebase SMS verification

---

## ✅ **Google Sign-In (Firebase)**

**React Native Code:**
```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

// Step 1: Google Sign-In
const { idToken } = await GoogleSignin.signIn();
const googleCredential = auth.GoogleAuthProvider.credential(idToken);
const userCredential = await auth().signInWithCredential(googleCredential);

// Step 2: Get Firebase token
const firebaseIdToken = await userCredential.user.getIdToken();

// Step 3: Send to backend (SAME endpoint as phone!)
fetch('http://localhost:8001/api/auth/login/firebase', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ idToken: firebaseIdToken })
});
```

**✅ Success = JWT token + user with `authProvider: "google"`**

---

## ✅ **Apple Sign-In (Firebase)**

**React Native Code:**
```javascript
import { appleAuth } from '@invertase/react-native-apple-authentication';
import auth from '@react-native-firebase/auth';

// Step 1: Apple Sign-In
const appleAuthRequestResponse = await appleAuth.performRequest({
  requestedOperation: appleAuth.Operation.LOGIN,
  requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
});

// Step 2: Create Firebase credential
const { identityToken, nonce } = appleAuthRequestResponse;
const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
const userCredential = await auth().signInWithCredential(appleCredential);

// Step 3: Get Firebase token
const firebaseIdToken = await userCredential.user.getIdToken();

// Step 4: Send to backend (SAME endpoint!)
fetch('http://localhost:8001/api/auth/login/firebase', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ idToken: firebaseIdToken })
});
```

**✅ Success = JWT token + user with `authProvider: "apple"`**

---

## ✅ **Email + Password (Traditional - cURL testable)**

```bash
# Create account first
curl -X POST http://localhost:8001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "phNo": "1234567890",
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Then login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**✅ Success = JWT token**

---

## 🎯 **Key Differences**

| Auth Method | OTP Sender | OTP Verifier | Backend Endpoint | Auto-Create Account? |
|-------------|-----------|--------------|------------------|---------------------|
| **Firebase Phone** | Firebase (SMS) | Firebase | `/auth/login/firebase` | ✅ Yes |
| **Google Sign-In** | N/A | Firebase | `/auth/login/firebase` | ✅ Yes |
| **Apple Sign-In** | N/A | Firebase | `/auth/login/firebase` | ✅ Yes |
| **Email + Password** | Backend | Backend | `/auth/login` | ❌ No (use `/auth/signup`) |

---

## ❌ **DON'T Use These Endpoints for Regular Users**

### `/api/auth/verifyFirebaseOtp`
**Status:** ⚠️ Admin-only (phone `8717000084`)  
**Why:** Has hardcoded restriction blocking regular users

### `/api/auth/generate-otp` + `/api/auth/verifyOtp`
**Status:** ✅ Works but legacy  
**Why:** Separate OTP system, not integrated with Firebase

---

## 🔐 **Using JWT Token**

After successful login, use token for API calls:

```javascript
const token = await AsyncStorage.getItem('authToken');

fetch('http://localhost:8001/api/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'Updated Name' })
});
```

---

## ✅ **Testing Checklist**

### React Native App Tests:

- [ ] **Phone Login Flow:**
  1. Enter phone number
  2. Receive SMS from Firebase
  3. Enter OTP
  4. Get JWT token
  5. Account auto-created (if new user)

- [ ] **Google Sign-In Flow:**
  1. Click Google button
  2. Select Google account
  3. Get JWT token
  4. Account auto-created (if new user)

- [ ] **Apple Sign-In Flow:**
  1. Click Apple button
  2. Authenticate with Face ID/Touch ID
  3. Get JWT token
  4. Account auto-created (if new user)

### Backend Tests (cURL):

- [ ] **Email Login:**
  1. Create account with `/auth/signup`
  2. Login with `/auth/login`
  3. Get JWT token

---

## � **Expected Responses**

### Success (200):
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "User Name",
      "isVerified": true
    },
    "isNewUser": false
  },
  "message": "Firebase authentication successful",
  "success": true,
  "statusCode": 200
}
```

### Error (4xx):
```json
{
  "data": null,
  "message": "Invalid Firebase token",
  "success": false,
  "statusCode": 401
}
```

---

## 🚨 **Common Issues**

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid Firebase token" | Token expired or invalid | Get fresh token from Firebase |
| "Access denied. Admin login only" | Using `/verifyFirebaseOtp` endpoint | Use `/login/firebase` instead |
| "No account found" | Using `/auth/login` without signup | Use `/auth/signup` first OR use Firebase auth (auto-creates) |

---

## 💡 **Quick Summary**

### ✅ **CORRECT:**
```javascript
// All Firebase auth (Phone, Google, Apple) → Same endpoint!
fetch('http://localhost:8001/api/auth/login/firebase', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ idToken: firebaseIdToken })
});
```

### ❌ **WRONG:**
```javascript
// DON'T use different endpoints for different providers
// DON'T use /verifyFirebaseOtp for regular users
// DON'T use backend OTP for Firebase phone auth
```

---

**Need detailed examples?** See `AUTH_VERIFICATION_GUIDE.md`  
**Need backend analysis?** See `BACKEND_AUTH_ANALYSIS.md`

**Last Updated:** October 11, 2025
