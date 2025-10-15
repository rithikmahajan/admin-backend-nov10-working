const express = require('express');
const router = express.Router();
const firebaseAdminController = require('../controllers/adminController/firebaseAdminController');

// Admin middleware to check authorization
const isAdmin = (req, res, next) => {
    // Simple admin check - in production, implement proper JWT verification
    const adminToken = req.headers['x-admin-token'];
    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

// ✅ Firebase Admin User Management Routes

// Get all Firebase users
router.get('/users', isAdmin, firebaseAdminController.getAllFirebaseUsers);

// Get specific Firebase user by UID
router.get('/users/:uid', isAdmin, firebaseAdminController.getFirebaseUserByUid);

// Create new Firebase user
router.post('/users', isAdmin, firebaseAdminController.createFirebaseUser);

// Update Firebase user
router.put('/users/:uid', isAdmin, firebaseAdminController.updateFirebaseUser);

// Update user status (enable/disable)
router.patch('/users/:uid/status', isAdmin, firebaseAdminController.updateFirebaseUserStatus);

// Delete Firebase user
router.delete('/users/:uid', isAdmin, firebaseAdminController.deleteFirebaseUser);

// Set custom claims for user
router.post('/users/:uid/claims', isAdmin, firebaseAdminController.setCustomClaims);

module.exports = router;
