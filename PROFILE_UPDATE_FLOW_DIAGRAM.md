# Profile Update Flow - Visual Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REACT NATIVE APP - USER PROFILE UPDATE               │
└─────────────────────────────────────────────────────────────────────────┘

BEFORE (NOT WORKING):
═══════════════════════════════════════════════════════════════════════════

┌──────────────────┐
│  React Native    │
│  Mobile App      │
└────────┬─────────┘
         │
         │ PUT /api/profile (with auth token)
         │ { firstName, lastName, email, phone }
         │
         ▼
┌────────────────────┐
│   Backend Server   │
│   (index.js)       │
└────────┬───────────┘
         │
         │ ❌ Route not found!
         │
         ▼
┌────────────────────┐
│   404 Not Found    │
│   Profile NOT      │
│   updated!         │
└────────────────────┘


AFTER (WORKING):
═══════════════════════════════════════════════════════════════════════════

┌──────────────────┐
│  React Native    │
│  Mobile App      │
└────────┬─────────┘
         │
         │ PUT /api/profile
         │ Headers: Authorization: Bearer <token>
         │ Body: { firstName, lastName, email, phone, preferences }
         │
         ▼
┌────────────────────────────────────────────────────────────────────┐
│   Backend Server (index.js)                                        │
│   ✅ NEW ENDPOINT: PUT /api/profile                                │
│                                                                     │
│   1. Verify Authentication (verifyToken middleware)                │
│   2. Extract userId from JWT token                                 │
│   3. Find User in database                                         │
│   4. Update User model (name, email, phone, preferences)           │
│   5. Update/Create UserProfile (email, imageUrl)                   │
│   6. Get user addresses                                            │
│   7. Format response                                               │
│   8. Return success + updated profile data                         │
└────────┬───────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────┐
│   DATABASE                                                          │
│                                                                     │
│   ┌──────────────┐         ┌──────────────────┐                   │
│   │    User      │         │   UserProfile    │                   │
│   │              │         │                  │                   │
│   │ - name       │◄────────┤ - user (ref)     │                   │
│   │ - email      │         │ - email          │                   │
│   │ - phNo       │         │ - imageUrl       │                   │
│   │ - currency   │         │ - dob            │                   │
│   │ - language   │         │ - gender         │                   │
│   │ - isProfile  │         │ - addresses[]    │                   │
│   └──────────────┘         └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ ✅ Success Response
         │
         ▼
┌────────────────────────────────────────────────────────────────────┐
│   Response to React Native App                                     │
│                                                                     │
│   {                                                                 │
│     "success": true,                                                │
│     "data": {                                                       │
│       "id": "...",                                                  │
│       "firstName": "John",                                          │
│       "lastName": "Doe",                                            │
│       "email": "john@example.com",                                  │
│       "phone": "+919876543210",                                     │
│       "profileImage": "...",                                        │
│       "membershipTier": "basic",                                    │
│       "pointsBalance": 100,                                         │
│       "isEmailVerified": true,                                      │
│       "isPhoneVerified": true,                                      │
│       "preferences": {                                              │
│         "currency": "INR",                                          │
│         "language": "en",                                           │
│         "notifications": true                                       │
│       },                                                            │
│       "addresses": [...]                                            │
│     },                                                              │
│     "message": "Profile updated successfully"                       │
│   }                                                                 │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────┐
│  React Native App  │
│  Updates UI with   │
│  new profile data  │
│  ✅ Success!       │
└────────────────────┘


SECURITY FLOW:
═══════════════════════════════════════════════════════════════════════════

┌──────────────────┐
│   Request with   │
│   Auth Token     │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────┐
│   verifyToken Middleware (middleware/VerifyToken.js)               │
│                                                                     │
│   1. Extract token from Authorization header                       │
│   2. Verify JWT signature                                          │
│   3. Check token expiration                                        │
│   4. Decode user info from token                                   │
│   5. Attach user to req.user                                       │
└────────┬───────────────────────────────────────────────────────────┘
         │
         ├─────► ❌ Invalid/Expired Token
         │       └─► 401 Unauthorized
         │
         ▼ ✅ Valid Token
┌────────────────────────────────────────────────────────────────────┐
│   PUT /api/profile Handler (index.js)                              │
│                                                                     │
│   1. Get userId from req.user._id (from token)                     │
│   2. Find user in database                                         │
│   3. ✅ User found → Update profile                                │
│   4. ❌ User not found → 404 Not Found                             │
└────────┬───────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────┐
│   Response         │
│   200 OK or        │
│   Error Code       │
└────────────────────┘


ALTERNATIVE ENDPOINTS:
═══════════════════════════════════════════════════════════════════════════

Option 1: PUT /api/profile (RECOMMENDED for React Native)
├─► Simple JSON request
├─► No file upload
├─► Best for basic profile updates
└─► Fast and efficient

Option 2: PUT /api/userProfile/updateProfile
├─► Multipart form data
├─► Supports image upload
├─► More comprehensive updates
└─► Use when uploading profile picture

Option 3: PATCH /api/user/:id (NOW SECURED)
├─► Update user by ID
├─► Requires authentication
├─► Authorization check (own profile only)
└─► Admin can update any user


SECURITY LAYERS:
═══════════════════════════════════════════════════════════════════════════

Layer 1: Authentication (verifyToken middleware)
         ↓
         ✅ Valid JWT Token?
         │
         ├─► YES → Continue
         └─► NO → 401 Unauthorized

Layer 2: Authorization (in controller)
         ↓
         ✅ Is user updating own profile OR is admin?
         │
         ├─► YES → Continue
         └─► NO → 403 Forbidden

Layer 3: Validation (Mongoose validators)
         ↓
         ✅ Valid data format?
         │
         ├─► YES → Update database
         └─► NO → 400 Bad Request

Layer 4: Data Protection
         ↓
         ✅ Remove password from response
         ✅ Sanitize sensitive data
         └─► Return safe data to client


ERROR HANDLING:
═══════════════════════════════════════════════════════════════════════════

┌──────────────────┐
│   Request        │
└────────┬─────────┘
         │
         ├─► No token? → 401 Unauthorized
         ├─► Invalid token? → 401 Unauthorized
         ├─► Expired token? → 401 Unauthorized
         ├─► Wrong user? → 403 Forbidden
         ├─► User not found? → 404 Not Found
         ├─► Invalid data? → 400 Bad Request
         ├─► Server error? → 500 Internal Server Error
         └─► All good? → 200 OK ✅


LOGGING:
═══════════════════════════════════════════════════════════════════════════

Console Output:
├─► 📝 Updating user profile: <userId> <data>
├─► ✅ Profile updated successfully: <profileData>
├─► ❌ Error updating profile: <error>
├─► 🔒 Authentication required
└─► 🚫 Unauthorized access attempt


DATABASE MODELS:
═══════════════════════════════════════════════════════════════════════════

User Model (src/models/User.js)
├─► name (String) - Full name
├─► email (String) - Email address
├─► phNo (String) - Phone number
├─► password (String) - Hashed password
├─► isVerified (Boolean)
├─► isPhoneVerified (Boolean)
├─► isEmailVerified (Boolean)
├─► isAdmin (Boolean)
├─► isProfile (Boolean)
├─► firebaseUid (String)
├─► fcmToken (String)
├─► preferredCountry (String)
├─► preferredCurrency (String)
├─► authProvider (String)
└─► timestamps (createdAt, updatedAt)

UserProfile Model (src/models/UserProfile.js)
├─► user (ObjectId ref User) - Reference to User
├─► addresses (Array of ObjectId ref Address)
├─► email (String)
├─► dob (Date)
├─► gender (String)
└─► imageUrl (String)


REQUEST/RESPONSE CYCLE:
═══════════════════════════════════════════════════════════════════════════

1. React Native sends PUT request
   └─► Headers: { Authorization: Bearer <token> }
   └─► Body: { firstName, lastName, email, phone, preferences }

2. Express receives request
   └─► Matches route: PUT /api/profile

3. Middleware: verifyToken
   └─► Validates JWT token
   └─► Attaches user to req.user

4. Handler: PUT /api/profile
   └─► Gets userId from req.user._id
   └─► Finds user in database
   └─► Updates User model
   └─► Updates UserProfile model
   └─► Gets addresses
   └─► Formats response

5. Response sent to client
   └─► Status: 200 OK
   └─► Body: { success: true, data: {...}, message: "..." }

6. React Native receives response
   └─► Parses JSON
   └─► Updates local state
   └─► Updates UI


TESTING WORKFLOW:
═══════════════════════════════════════════════════════════════════════════

Test 1: Login
└─► POST /api/auth/login → Get token

Test 2: Get Profile
└─► GET /api/profile → See current data

Test 3: Update Profile
└─► PUT /api/profile → Update data

Test 4: Verify Update
└─► GET /api/profile → Confirm changes

Test 5: Unauthorized Access
└─► PATCH /api/user/<other-user-id> → Should fail with 403

✅ All tests pass!
```

---

## Quick Reference

### ✅ NEW Endpoint
```
PUT /api/profile
```

### 🔒 Now Protected
```
PATCH /api/user/:id
```

### 🛡️ Security
- Authentication required
- Authorization enforced
- Password never returned
- Detailed logging

### 📱 React Native
Update your API calls to:
```javascript
PUT http://server:8001/api/profile
```

### 🎯 Status
**✅ WORKING**
