const admin = require('../../config/firebase-admin');
const db = admin.firestore();
const auth = admin.auth();

// ✅ Get all Firebase Auth users
exports.getAllFirebaseUsers = async (req, res) => {
    try {
        console.log('📋 Fetching all Firebase Auth users...');
        
        const listUsersResult = await auth.listUsers(1000); // Max 1000 users per request
        
        const users = listUsersResult.users.map(userRecord => ({
            uid: userRecord.uid,
            email: userRecord.email || null,
            emailVerified: userRecord.emailVerified,
            displayName: userRecord.displayName || null,
            phoneNumber: userRecord.phoneNumber || null,
            photoURL: userRecord.photoURL || null,
            disabled: userRecord.disabled,
            creationTime: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime,
            customClaims: userRecord.customClaims || {}
        }));

        console.log(`✅ Retrieved ${users.length} Firebase users`);
        
        res.status(200).json({
            success: true,
            count: users.length,
            users: users
        });
        
    } catch (error) {
        console.error('❌ Error fetching Firebase users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Firebase users',
            error: error.message
        });
    }
};

// ✅ Get specific Firebase user by UID
exports.getFirebaseUserByUid = async (req, res) => {
    try {
        const { uid } = req.params;
        console.log(`👤 Fetching Firebase user with UID: ${uid}`);
        
        const userRecord = await auth.getUser(uid);
        
        const user = {
            uid: userRecord.uid,
            email: userRecord.email || null,
            emailVerified: userRecord.emailVerified,
            displayName: userRecord.displayName || null,
            phoneNumber: userRecord.phoneNumber || null,
            photoURL: userRecord.photoURL || null,
            disabled: userRecord.disabled,
            creationTime: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime,
            customClaims: userRecord.customClaims || {}
        };

        console.log(`✅ Retrieved Firebase user: ${user.email || user.uid}`);
        
        res.status(200).json({
            success: true,
            user: user
        });
        
    } catch (error) {
        console.error('❌ Error fetching Firebase user:', error);
        
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Firebase user',
            error: error.message
        });
    }
};

// ✅ Disable/Enable Firebase user account
exports.updateFirebaseUserStatus = async (req, res) => {
    try {
        const { uid } = req.params;
        const { disabled } = req.body;
        
        console.log(`🔒 ${disabled ? 'Disabling' : 'Enabling'} Firebase user: ${uid}`);
        
        // Update user status
        const userRecord = await auth.updateUser(uid, { disabled });
        
        const action = disabled ? 'disabled' : 'enabled';
        console.log(`✅ Firebase user ${action}: ${userRecord.email || userRecord.uid}`);
        
        res.status(200).json({
            success: true,
            message: `User ${action} successfully`,
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                disabled: userRecord.disabled
            }
        });
        
    } catch (error) {
        console.error('❌ Error updating Firebase user status:', error);
        
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: error.message
        });
    }
};

// ✅ Delete Firebase user account
exports.deleteFirebaseUser = async (req, res) => {
    try {
        const { uid } = req.params;
        console.log(`🗑️ Deleting Firebase user: ${uid}`);
        
        // Get user info before deletion for logging
        const userRecord = await auth.getUser(uid);
        const userEmail = userRecord.email || userRecord.uid;
        
        // Delete user
        await auth.deleteUser(uid);
        
        console.log(`✅ Firebase user deleted: ${userEmail}`);
        
        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            deletedUser: {
                uid: uid,
                email: userRecord.email
            }
        });
        
    } catch (error) {
        console.error('❌ Error deleting Firebase user:', error);
        
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
};

// ✅ Create new Firebase user (admin only)
exports.createFirebaseUser = async (req, res) => {
    try {
        const { email, password, displayName, phoneNumber, emailVerified } = req.body;
        
        console.log(`👤 Creating new Firebase user: ${email}`);
        
        const userRecord = await auth.createUser({
            email,
            password,
            displayName,
            phoneNumber,
            emailVerified: emailVerified || false
        });
        
        console.log(`✅ Firebase user created: ${userRecord.email}`);
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                emailVerified: userRecord.emailVerified
            }
        });
        
    } catch (error) {
        console.error('❌ Error creating Firebase user:', error);
        
        if (error.code === 'auth/email-already-exists') {
            return res.status(409).json({
                success: false,
                message: 'Email already exists',
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
};

// ✅ Update Firebase user data
exports.updateFirebaseUser = async (req, res) => {
    try {
        const { uid } = req.params;
        const updateData = req.body;
        
        console.log(`📝 Updating Firebase user: ${uid}`, updateData);
        
        // Remove uid from update data if present
        delete updateData.uid;
        
        const userRecord = await auth.updateUser(uid, updateData);
        
        console.log(`✅ Firebase user updated: ${userRecord.email || userRecord.uid}`);
        
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                emailVerified: userRecord.emailVerified,
                disabled: userRecord.disabled
            }
        });
        
    } catch (error) {
        console.error('❌ Error updating Firebase user:', error);
        
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
};

// ✅ Set custom claims for Firebase user (for role-based access)
exports.setCustomClaims = async (req, res) => {
    try {
        const { uid } = req.params;
        const { customClaims } = req.body;
        
        console.log(`🏷️ Setting custom claims for user: ${uid}`, customClaims);
        
        await auth.setCustomUserClaims(uid, customClaims);
        
        console.log(`✅ Custom claims set for user: ${uid}`);
        
        res.status(200).json({
            success: true,
            message: 'Custom claims set successfully',
            uid: uid,
            customClaims: customClaims
        });
        
    } catch (error) {
        console.error('❌ Error setting custom claims:', error);
        
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to set custom claims',
            error: error.message
        });
    }
};
