const admin = require('../config/firebase-admin');
const User = require('../models/User');

/**
 * Determine authentication method based on Firebase token claims
 */
function determineAuthMethod(decodedToken) {
  const providers = decodedToken.firebase?.identities || {};
  const signInProvider = decodedToken.firebase?.sign_in_provider;
  
  // Check for phone authentication
  if (signInProvider === 'phone' || providers.phone) {
    return 'phone';
  }
  
  // Check for Google authentication
  if (signInProvider === 'google.com' || providers['google.com']) {
    return 'google';
  }
  
  // Check for Apple authentication
  if (signInProvider === 'apple.com' || providers['apple.com']) {
    return 'apple';
  }
  
  // Check for email/password authentication
  if (signInProvider === 'password' || providers.email) {
    return 'email';
  }
  
  // Default fallback
  return 'unknown';
}

/**
 * Extract user information based on authentication method
 */
function extractUserInfo(decodedToken, authMethod) {
  const baseInfo = {
    uid: decodedToken.uid,
    authMethod: authMethod,
    emailVerified: decodedToken.email_verified || false,
    phoneVerified: decodedToken.phone_number ? true : false,
    picture: decodedToken.picture || null,
    providerId: decodedToken.firebase?.sign_in_provider
  };

  switch (authMethod) {
    case 'phone':
      return {
        ...baseInfo,
        phoneNumber: decodedToken.phone_number || null,
        email: decodedToken.email || null, // May not have email
        name: decodedToken.name || decodedToken.phone_number || 'Phone User'
      };
      
    case 'google':
      return {
        ...baseInfo,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email,
        phoneNumber: decodedToken.phone_number || null,
        googleId: decodedToken.firebase?.identities?.['google.com']?.[0] || null
      };
      
    case 'apple':
      return {
        ...baseInfo,
        email: decodedToken.email || null, // Apple may hide email
        name: decodedToken.name || decodedToken.email || 'Apple User',
        phoneNumber: decodedToken.phone_number || null,
        appleId: decodedToken.firebase?.identities?.['apple.com']?.[0] || null
      };
      
    case 'email':
      return {
        ...baseInfo,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email,
        phoneNumber: decodedToken.phone_number || null
      };
      
    default:
      return {
        ...baseInfo,
        email: decodedToken.email || null,
        name: decodedToken.name || decodedToken.email || 'User',
        phoneNumber: decodedToken.phone_number || null
      };
  }
}

/**
 * Firebase JWT Token Validation Middleware
 * Validates Firebase ID tokens sent from frontend
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header is present
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required to access chat support.'
        }
      });
    }

    // Extract token from header
    const firebaseToken = authHeader.split(' ')[1];
    
    if (!firebaseToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_MISSING',
          message: 'Token missing, please login again'
        }
      });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    
    // Determine authentication method and extract user information
    const authMethod = determineAuthMethod(decodedToken);
    const firebaseUser = extractUserInfo(decodedToken, authMethod);

    console.log('✅ Firebase token validated for user:', firebaseUser.uid);
    console.log('🔐 Authentication method:', authMethod);
    console.log('📧 User email:', firebaseUser.email);
    console.log('📱 User phone:', firebaseUser.phoneNumber);

    // Try to find user in our database using multiple identifiers
    let dbUser = null;
    
    // Search by email first (if available)
    if (firebaseUser.email) {
      dbUser = await User.findOne({ email: firebaseUser.email });
    }
    
    // If not found by email, try phone number
    if (!dbUser && firebaseUser.phoneNumber) {
      dbUser = await User.findOne({ 
        $or: [
          { phNo: firebaseUser.phoneNumber },
          { phoneNumber: firebaseUser.phoneNumber },
          { phone: firebaseUser.phoneNumber }
        ]
      });
    }
    
    // If still not found, try Firebase UID
    if (!dbUser) {
      dbUser = await User.findOne({ firebaseUid: firebaseUser.uid });
    }

    // Attach comprehensive user info to request
    req.user = {
      // Firebase user data (always available)
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.name,
      phoneNumber: firebaseUser.phoneNumber,
      picture: firebaseUser.picture,
      
      // Authentication details
      authMethod: firebaseUser.authMethod,
      authSource: 'firebase',
      providerId: firebaseUser.providerId,
      emailVerified: firebaseUser.emailVerified,
      phoneVerified: firebaseUser.phoneVerified,
      
      // Third-party IDs (if applicable)
      googleId: firebaseUser.googleId || null,
      appleId: firebaseUser.appleId || null,
      
      // Database user data (may be null)
      _id: dbUser ? dbUser._id : null,
      isAdmin: dbUser ? dbUser.isAdmin : false,
      dbUser: dbUser,
      
      // User status
      isRegisteredUser: !!dbUser,
      hasDbAccount: !!dbUser
    };

    next();
    
  } catch (error) {
    console.error('❌ Firebase token validation failed:', error.message);
    console.error('🔍 Error code:', error.code);
    
    // Handle specific Firebase authentication errors
    let errorResponse = {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token, please login again'
      }
    };

    // Customize error messages based on Firebase error codes
    switch (error.code) {
      case 'auth/id-token-expired':
        errorResponse.error.code = 'TOKEN_EXPIRED';
        errorResponse.error.message = 'Token expired, please refresh your session';
        break;
      case 'auth/argument-error':
        errorResponse.error.code = 'INVALID_TOKEN_FORMAT';
        errorResponse.error.message = 'Invalid token format';
        break;
      case 'auth/id-token-revoked':
        errorResponse.error.code = 'TOKEN_REVOKED';
        errorResponse.error.message = 'Token has been revoked, please login again';
        break;
      case 'auth/user-disabled':
        errorResponse.error.code = 'USER_DISABLED';
        errorResponse.error.message = 'User account has been disabled';
        break;
      case 'auth/project-not-found':
        errorResponse.error.code = 'PROJECT_ERROR';
        errorResponse.error.message = 'Authentication service temporarily unavailable';
        break;
      default:
        // Keep default error message for unknown errors
        break;
    }
    
    return res.status(401).json(errorResponse);
  }
};

/**
 * Legacy JWT Token Validation (for admin panel)
 * Validates tokens generated by our backend
 */
const verifyLegacyToken = async (req, res, next) => {
  try {
    const jwt = require('jsonwebtoken');
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false,
        message: "Token missing, please login again" 
      });
    }

    const token = authHeader.split(" ")[1];
    const decodedInfo = jwt.verify(token, process.env.SECRET_KEY);
    
    console.log("✅ Legacy token validated for user:", decodedInfo._id);

    if (decodedInfo && decodedInfo._id) {
      req.user = decodedInfo;
      return next();
    }

    return res.status(401).json({ 
      success: false,
      message: "Invalid Token, please login again" 
    });

  } catch (error) {
    console.log("❌ Legacy JWT Verification Error:", error.message);

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        success: false,
        message: "Token expired, please login again" 
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid Token, please login again" 
      });
    } else {
      return res.status(500).json({ 
        success: false,
        message: "Internal Server Error" 
      });
    }
  }
};

/**
 * Hybrid Token Validation
 * Tries Firebase first, then falls back to legacy JWT
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required to access this resource.'
      }
    });
  }

  const token = authHeader.split(' ')[1];
  
  // Try to determine token type by structure
  // Firebase tokens are much longer and have different structure
  if (token.length > 200 && token.split('.').length === 3) {
    // Likely a Firebase token, try Firebase validation first
    try {
      return await verifyFirebaseToken(req, res, next);
    } catch (error) {
      console.log('🔄 Firebase validation failed, trying legacy...');
      return await verifyLegacyToken(req, res, next);
    }
  } else {
    // Likely a legacy JWT token
    try {
      return await verifyLegacyToken(req, res, next);
    } catch (error) {
      console.log('🔄 Legacy validation failed, trying Firebase...');
      return await verifyFirebaseToken(req, res, next);
    }
  }
};

/**
 * Admin Only Middleware
 * Requires Firebase token and admin privileges
 */
const isAdmin = async (req, res, next) => {
  console.log('Checking admin access for user:', req.user ? {
    uid: req.user.uid,
    email: req.user.email,
    isAdmin: req.user.isAdmin
  } : 'No user');
  
  if (req.user && req.user.isAdmin) {
    console.log('✅ Admin access granted');
    next();
  } else {
    console.log('❌ Admin access denied');
    res.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_ACCESS_REQUIRED',
        message: 'Admin privileges required to access this resource'
      }
    });
  }
};

/**
 * Optional Firebase token verification - doesn't fail if no token provided
 * Used for endpoints that can work with or without authentication
 */
const optionalFirebaseToken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      // No token provided - continue without authentication
      console.log('🔓 No token provided, continuing without authentication');
      return next();
    }

    const token = authorization.split(' ')[1];
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const authMethod = determineAuthMethod(decodedToken);
      const userInfo = extractUserInfo(decodedToken, authMethod);
      
      req.user = {
        ...userInfo,
        decodedToken: decodedToken
      };
      
      console.log('✅ Optional Firebase token verified:', {
        uid: req.user.uid,
        authMethod: req.user.authMethod,
        email: req.user.email
      });
      
    } catch (tokenError) {
      // Token verification failed - continue without authentication
      console.log('⚠️ Token verification failed, continuing without auth:', tokenError.message);
    }
    
    next();
  } catch (error) {
    console.error('❌ Optional Firebase auth error:', error);
    // Don't fail - continue without authentication
    next();
  }
};

module.exports = {
  verifyFirebaseToken,
  verifyLegacyToken,
  verifyToken,
  isAdmin,
  optionalFirebaseToken
};
