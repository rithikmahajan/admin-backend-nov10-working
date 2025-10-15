// Import required dependencies
const bcrypt = require("bcryptjs"); // For password hashing (not used in this code, consider removing if unnecessary)
const jwt = require("jsonwebtoken"); // For generating and verifying JSON Web Tokens
const admin = require("../utils/firebaseConfig"); // Firebase Admin SDK instance for server-side operations
const User = require("../models/User"); // Mongoose model for User collection
const UserProfile = require("../models/UserProfile"); // Mongoose model for UserProfile collection
const { ApiResponse } = require("../utils/ApiResponse"); // Utility to standardize API responses

/**
 * Handles Firebase signup by verifying a Firebase ID token, creating a user in MongoDB if needed,
 * and generating a JWT for session management.
 * @param {string} idToken - Firebase ID token from the client (obtained after Firebase Authentication).
 * @returns {Promise<Object>} - An object containing the JWT token and user details.
 * @throws {Error} - If Firebase token verification or user creation fails.
 */
exports.handleFirebaseSignup = async (idToken) => {
  console.log("🔥 handleFirebaseSignup - Starting Firebase authentication"); // Log for debugging
  try {
    // Verify the Firebase ID token to authenticate the user
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid; // Extract Firebase user ID
    const email = decodedToken.email;
    const name = decodedToken.name;
    
    console.log("✅ Firebase token verified:", { firebaseUid, email, name }); // Log Firebase UID for debugging

    // Check if the user already exists in the MongoDB database
    let firebaseUser = await User.findOne({ firebaseUid });
    console.log("🔍 User lookup by firebaseUid:", firebaseUser ? "Found" : "Not found"); // Log user data (or null if not found)

    if (!firebaseUser) {
      // Create a new user in MongoDB if not found
      console.log("📝 Creating new user in database...");
      firebaseUser = new User({
        email: email || '', // Email from Firebase token
        name: name || 'User', // Name from Firebase token
        firebaseUid: firebaseUid, // Firebase user ID
        isVerified: true, // ✅ CRITICAL: Mark as verified (Firebase handles verification)
        isEmailVerified: true, // ✅ CRITICAL: Assume email is verified by Firebase
        isPhoneVerified: false,
        isProfile: false,
        authProvider: 'firebase',
        lastLoginAt: new Date()
      });
      await firebaseUser.save(); // Save user to MongoDB
      console.log("✅ New user created with ID:", firebaseUser._id);

      // Create an associated user profile in MongoDB
      const newUserProfile = new UserProfile({
        user: firebaseUser._id, // Reference to the User document
        email: firebaseUser.email, // Email for profile
      });
      await newUserProfile.save(); // Save profile to MongoDB
      console.log("✅ User profile created");
    } else {
      // ✅ CRITICAL FIX: Ensure existing user is verified
      let hasChanges = false;
      if (!firebaseUser.isVerified) {
        firebaseUser.isVerified = true;
        hasChanges = true;
        console.log("🔧 FIXING: Setting existing user as verified");
      }
      if (!firebaseUser.isEmailVerified && email) {
        firebaseUser.isEmailVerified = true;
        hasChanges = true;
        console.log("🔧 FIXING: Setting email as verified");
      }
      
      firebaseUser.lastLoginAt = new Date();
      hasChanges = true;
      
      if (hasChanges) {
        await firebaseUser.save();
        console.log("✅ Existing user updated and verified");
      }
    }

    // Generate a JWT for the user session
    const token = jwt.sign(
      { _id: firebaseUser._id, email: firebaseUser.email }, // Payload with user ID and email
      process.env.SECRET_KEY, // Secret key for signing (from .env)
      { expiresIn: "30d" } // Token expires in 30 days
    );
    console.log("🔐 JWT token generated successfully"); // Log generated token for debugging

    // Decode the JWT to log its payload (for debugging, not required for functionality)
    const decodedToken1 = jwt.decode(token);
    console.log("📋 Decoded JWT payload:", decodedToken1);

    // Construct user object to return
    const userObject = {
      _id: firebaseUser._id, // MongoDB user ID (using _id for consistency)
      email: firebaseUser.email, // User email
      name: firebaseUser.name, // User name
      isVerified: firebaseUser.isVerified, // ✅ Verification status
      isEmailVerified: firebaseUser.isEmailVerified, // Email verification status
      isPhoneVerified: firebaseUser.isPhoneVerified,
      isProfile: firebaseUser.isProfile,
      authProvider: firebaseUser.authProvider
    };

    console.log("✅ Firebase signup/login successful for user:", firebaseUser._id);
    console.log("   User verification status:", {
      isVerified: userObject.isVerified,
      isEmailVerified: userObject.isEmailVerified
    });

    // Return token and user details
    return { token, user: userObject };
  } catch (error) {
    console.error("❌ Error during Firebase signup:", error); // Log error for debugging
    throw new Error("Firebase signup failed"); // Throw error to be handled by caller
  }
};

/**
 * Handles Firebase login by verifying a Firebase ID token and generating a JWT for an existing user.
 * @param {string} idToken - Firebase ID token from the client.
 * @returns {Promise<string>} - The generated JWT token.
 * @throws {Error} - If the user is not found or token verification fails.
 */
exports.loginFirebase = async (idToken) => {
  // Verify the Firebase ID token
  const decodedToken = await admin.auth().verifyIdToken(idToken);

  // Find the user in MongoDB by Firebase UID
  const firebaseUser = await User.findOne({ firebaseUid: decodedToken.uid });

  // Throw an error if the user does not exist
  if (!firebaseUser) {
    throw new Error("User not found");
  }

  // Generate a JWT for the user session
  const token = jwt.sign(
    { id: firebaseUser._id, email: decodedToken.email }, // Payload with user ID and email
    process.env.JWT_SECRET, // Secret key for signing (from .env)
    { expiresIn: "1h" } // Token expires in 1 hour
  );

  // Return the generated token
  return token;
};