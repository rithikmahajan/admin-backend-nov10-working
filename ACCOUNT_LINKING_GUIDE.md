# Account Linking Frontend Implementation Guide

## Overview
This guide explains how to handle multiple authentication methods (Apple, Google, Email/Password) for the same user account.

---

## 🔄 Complete Flow

### **Scenario 1: User Signs In with New Provider (Account Exists)**

#### Step 1: User clicks "Sign in with Apple"
```javascript
// Frontend initiates Apple OAuth
const appleSignIn = async () => {
  try {
    // Get Apple credentials from Firebase
    const result = await signInWithPopup(auth, new OAuthProvider('apple.com'));
    const idToken = await result.user.getIdToken();
    
    // Send to backend
    const response = await axios.post('/api/auth/apple-signin', { idToken });
    
    if (response.status === 200) {
      // Success - new account or existing Apple account
      handleSuccessfulLogin(response.data);
    }
    
  } catch (error) {
    if (error.response?.status === 409) {
      // Account exists with different method
      handleAccountConflict(error.response.data);
    } else {
      console.error('Sign in error:', error);
    }
  }
};
```

#### Step 2: Handle Account Conflict (409 Response)
```javascript
const handleAccountConflict = (data) => {
  // data structure:
  // {
  //   status: "account_exists",
  //   email: "user@example.com",
  //   existing_methods: ["email"],
  //   message: "..."
  // }
  
  // Show modal to user
  showAccountLinkModal({
    email: data.email,
    existingMethod: data.existing_methods[0],
    newMethod: 'apple',
    onLink: () => initiateAccountLinking(data),
    onCancel: () => closeModal()
  });
};
```

#### Step 3: Modal Component
```jsx
const AccountLinkModal = ({ email, existingMethod, newMethod, onLink, onCancel }) => {
  return (
    <div className="modal">
      <h2>Account Already Exists</h2>
      <p>
        An account with <strong>{email}</strong> already exists using <strong>{existingMethod}</strong>.
      </p>
      <p>Would you like to:</p>
      
      <button onClick={onLink}>
        Link {newMethod} to existing account
      </button>
      
      <button onClick={onCancel}>
        Cancel and use {existingMethod}
      </button>
    </div>
  );
};
```

#### Step 4: Link Accounts (Requires Re-authentication)
```javascript
const initiateAccountLinking = async (conflictData) => {
  try {
    // Step 1: Ask user to verify identity with existing method
    const existingAuth = await verifyExistingAccount(conflictData.existing_methods[0]);
    
    if (!existingAuth.token) {
      throw new Error('Verification failed');
    }
    
    // Step 2: User is now authenticated, link the new provider
    const appleResult = await signInWithPopup(auth, new OAuthProvider('apple.com'));
    const appleToken = await appleResult.user.getIdToken();
    
    // Step 3: Call backend to link accounts
    const response = await axios.post(
      '/api/auth/link-provider',
      { idToken: appleToken },
      { headers: { Authorization: `Bearer ${existingAuth.token}` } }
    );
    
    if (response.status === 200) {
      showSuccess('Successfully linked Apple account!');
      handleSuccessfulLogin(response.data);
    }
    
  } catch (error) {
    console.error('Account linking failed:', error);
    showError('Failed to link accounts');
  }
};
```

#### Step 5: Verify Existing Account
```javascript
const verifyExistingAccount = async (method) => {
  return new Promise((resolve, reject) => {
    if (method === 'email') {
      // Show email/password login form
      showLoginForm({
        onSuccess: (token) => resolve({ token }),
        onCancel: () => reject(new Error('User cancelled'))
      });
    } else if (method === 'google') {
      // Re-authenticate with Google
      signInWithGoogle()
        .then(token => resolve({ token }))
        .catch(reject);
    }
    // Add other methods as needed
  });
};
```

---

## 📱 Backend API Reference

### 1. **Sign In with Apple/Google** (Detects Conflicts)
```http
POST /api/auth/apple-signin
POST /api/auth/login/firebase
Content-Type: application/json

{
  "idToken": "firebase-id-token-here"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Firebase authentication successful",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "authProvider": "apple"
    }
  }
}
```

**Conflict Response (409):**
```json
{
  "success": false,
  "message": "Account exists with different authentication method",
  "data": {
    "status": "account_exists",
    "email": "user@example.com",
    "existing_methods": ["email"],
    "message": "An account with user@example.com already exists using email..."
  }
}
```

### 2. **Link Authentication Provider** (Protected)
```http
POST /api/auth/link-provider
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "idToken": "firebase-id-token-for-new-provider"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Successfully linked apple account",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "authProvider": "apple",
      "linkedProviders": ["email", "apple"]
    }
  }
}
```

**Error Response (409):**
```json
{
  "success": false,
  "message": "This apple account is already linked to another user account"
}
```

### 3. **Get Linked Providers** (Protected)
```http
GET /api/auth/linked-providers
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "linkedProviders": [
      {
        "provider": "email",
        "email": "user@example.com",
        "isVerified": true,
        "linkedAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## 🎨 UI Components

### Account Settings - Linked Providers Display
```jsx
const LinkedAccountsSection = () => {
  const [providers, setProviders] = useState([]);
  
  useEffect(() => {
    fetchLinkedProviders();
  }, []);
  
  const fetchLinkedProviders = async () => {
    try {
      const response = await axios.get('/api/auth/linked-providers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProviders(response.data.data.linkedProviders);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };
  
  const handleLinkProvider = async (providerName) => {
    try {
      let provider;
      if (providerName === 'google') {
        provider = new GoogleAuthProvider();
      } else if (providerName === 'apple') {
        provider = new OAuthProvider('apple.com');
      }
      
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      
      const response = await axios.post(
        '/api/auth/link-provider',
        { idToken },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.status === 200) {
        showSuccess(`Successfully linked ${providerName}!`);
        fetchLinkedProviders(); // Refresh list
      }
    } catch (error) {
      console.error('Error linking provider:', error);
      showError(error.response?.data?.message || 'Failed to link provider');
    }
  };
  
  return (
    <div className="linked-accounts">
      <h3>Linked Accounts</h3>
      
      {providers.map(provider => (
        <div key={provider.provider} className="provider-item">
          <span>{provider.provider}</span>
          <span>{provider.email}</span>
          <span className="verified">
            {provider.isVerified ? '✓ Verified' : 'Not verified'}
          </span>
        </div>
      ))}
      
      <div className="add-provider">
        <button onClick={() => handleLinkProvider('google')}>
          Link Google Account
        </button>
        <button onClick={() => handleLinkProvider('apple')}>
          Link Apple Account
        </button>
      </div>
    </div>
  );
};
```

---

## 🔒 Security Best Practices

### 1. **Always Require Re-authentication Before Linking**
```javascript
// WRONG ❌
const linkAccount = async (newProvider) => {
  // Directly linking without verification
  await axios.post('/api/auth/link-provider', { idToken });
};

// CORRECT ✅
const linkAccount = async (newProvider) => {
  // Step 1: Verify user owns the account
  const existingAuth = await promptUserLogin();
  
  // Step 2: Only then link new provider
  await axios.post('/api/auth/link-provider', 
    { idToken },
    { headers: { Authorization: `Bearer ${existingAuth.token}` } }
  );
};
```

### 2. **Rate Limiting**
Implement rate limiting on the frontend:
```javascript
let linkAttempts = 0;
const MAX_ATTEMPTS = 3;

const attemptLink = async () => {
  if (linkAttempts >= MAX_ATTEMPTS) {
    showError('Too many attempts. Please try again later.');
    return;
  }
  
  linkAttempts++;
  try {
    await linkAuthProvider();
    linkAttempts = 0; // Reset on success
  } catch (error) {
    // Handle error
  }
};
```

### 3. **Audit Logging**
Log all account linking events:
```javascript
const logAccountLinking = async (action, provider) => {
  await axios.post('/api/audit/log', {
    action: `account_${action}`,
    provider,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });
};
```

---

## 🧪 Testing Checklist

- [ ] User signs in with Apple when email/password account exists → Shows conflict modal
- [ ] User cancels account linking → Returns to login screen
- [ ] User confirms account linking → Prompts for existing credentials
- [ ] User successfully links accounts → Can sign in with both methods
- [ ] User tries to link already-linked provider → Shows error message
- [ ] User views linked accounts in settings → Shows all methods
- [ ] Rate limiting works after 3 failed attempts
- [ ] All events are logged for security audit

---

## 📊 Database Changes Summary

### Before:
```javascript
// User model
{
  _id: "user123",
  email: "user@example.com",
  firebaseUid: "firebase-uid-1",
  authProvider: "email" // Single provider only
}
```

### After:
```javascript
// User model (still stores primary provider)
{
  _id: "user123",
  email: "user@example.com",
  firebaseUid: "firebase-uid-1",
  authProvider: "email"
}

// Future enhancement: UserAuthMethods table
{
  userId: "user123",
  provider: "email",
  providerUserId: "firebase-uid-1",
  linkedAt: "2025-01-01"
}
{
  userId: "user123",
  provider: "apple",
  providerUserId: "firebase-uid-2",
  linkedAt: "2025-01-02"
}
```

---

## 🚀 Next Steps

1. **Implement the frontend modal** for account conflict detection
2. **Add re-authentication flow** before linking accounts
3. **Create account settings page** to display linked providers
4. **Add unlinking functionality** (allow users to remove providers)
5. **Implement audit logging** for security monitoring
6. **Add rate limiting** to prevent abuse
7. **Test all edge cases** thoroughly

---

## 📞 Support

If you encounter issues:
1. Check backend logs for detailed error messages
2. Verify Firebase configuration is correct
3. Ensure JWT tokens are being sent in Authorization header
4. Test with Postman using the provided collection
