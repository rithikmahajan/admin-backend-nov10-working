const admin = require("../../utils/firebaseConfig");

/**
 * Fetch all Firebase authenticated users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllFirebaseUsers = async (req, res) => {
  try {
    console.log("🔍 Fetching all Firebase authenticated users...");
    
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users;
    
    console.log(`✅ Successfully fetched ${users.length} Firebase users`);
    
    // Transform Firebase user data to match our frontend expectations
    const transformedUsers = users.map(user => {
      // Determine sign-up method from provider data
      let signUpMethod = 'Email/Password';
      let providerIcon = '📧';
      
      if (user.providerData && user.providerData.length > 0) {
        const provider = user.providerData[0];
        switch (provider.providerId) {
          case 'google.com':
            signUpMethod = 'Google';
            providerIcon = '🔍';
            break;
          case 'apple.com':
            signUpMethod = 'Apple';
            providerIcon = '🍎';
            break;
          case 'phone':
            signUpMethod = 'Phone';
            providerIcon = '📱';
            break;
          case 'facebook.com':
            signUpMethod = 'Facebook';
            providerIcon = '📘';
            break;
          default:
            signUpMethod = provider.providerId || 'Email/Password';
            providerIcon = '❓';
        }
      }
      
      return {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        emailVerified: user.emailVerified,
        disabled: user.disabled,
        metadata: {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime,
          lastRefreshTime: user.metadata.lastRefreshTime
        },
        providerData: user.providerData,
        signUpMethod,
        providerIcon,
        customClaims: user.customClaims || {}
      };
    });
    
    res.status(200).json({
      success: true,
      count: transformedUsers.length,
      users: transformedUsers
    });
    
  } catch (error) {
    console.error("❌ Error fetching Firebase users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Firebase users",
      error: error.message
    });
  }
};

/**
 * Get Firebase user by UID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getFirebaseUserById = async (req, res) => {
  try {
    const { uid } = req.params;
    
    console.log(`🔍 Fetching Firebase user with UID: ${uid}`);
    
    const user = await admin.auth().getUser(uid);
    
    res.status(200).json({
      success: true,
      user: {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        emailVerified: user.emailVerified,
        disabled: user.disabled,
        metadata: {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime,
          lastRefreshTime: user.metadata.lastRefreshTime
        },
        providerData: user.providerData,
        customClaims: user.customClaims || {}
      }
    });
    
  } catch (error) {
    console.error(`❌ Error fetching Firebase user ${req.params.uid}:`, error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch Firebase user",
      error: error.message
    });
  }
};

/**
 * Block/Disable Firebase user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.blockFirebaseUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const { reason } = req.body;
    
    console.log(`🚫 Blocking Firebase user with UID: ${uid}, Reason: ${reason}`);
    
    await admin.auth().updateUser(uid, {
      disabled: true
    });
    
    // Set custom claims for block reason
    await admin.auth().setCustomUserClaims(uid, {
      blocked: true,
      blockReason: reason || 'Admin action',
      blockedAt: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: "User blocked successfully",
      uid,
      reason: reason || 'Admin action'
    });
    
  } catch (error) {
    console.error(`❌ Error blocking Firebase user ${req.params.uid}:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to block Firebase user",
      error: error.message
    });
  }
};

/**
 * Unblock/Enable Firebase user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.unblockFirebaseUser = async (req, res) => {
  try {
    const { uid } = req.params;
    
    console.log(`✅ Unblocking Firebase user with UID: ${uid}`);
    
    await admin.auth().updateUser(uid, {
      disabled: false
    });
    
    // Remove block-related custom claims
    await admin.auth().setCustomUserClaims(uid, {
      blocked: false,
      blockReason: null,
      blockedAt: null,
      unblockedAt: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      uid
    });
    
  } catch (error) {
    console.error(`❌ Error unblocking Firebase user ${req.params.uid}:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to unblock Firebase user",
      error: error.message
    });
  }
};

/**
 * Delete Firebase user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteFirebaseUser = async (req, res) => {
  try {
    const { uid } = req.params;
    
    console.log(`🗑️ Deleting Firebase user with UID: ${uid}`);
    
    await admin.auth().deleteUser(uid);
    
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      uid
    });
    
  } catch (error) {
    console.error(`❌ Error deleting Firebase user ${req.params.uid}:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to delete Firebase user",
      error: error.message
    });
  }
};
