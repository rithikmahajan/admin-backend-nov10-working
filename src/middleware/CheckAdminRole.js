const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

// Middleware to check if the user has admin role
const checkAdminRole = async (req, res, next) => {
    try {
        // The verifyToken middleware should have already verified the token and attached user info
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'User authentication required' });
        }

        console.log("checkAdminRole - req.user:", req.user);

        // Find user by ID from the decoded token (attached by verifyToken middleware)
        const user = await User.findById(req.user._id);

        // If user is not found
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is an admin
        if (!user.isAdmin) {
            return res.status(403).json({ message: 'Access denied, admin rights required' });
        }

        console.log("checkAdminRole - User is admin:", user.isAdmin);

        // Update req.user with full user object and continue
        req.user = user;
        next();
    } catch (error) {
        console.error("checkAdminRole error:", error);
        return res.status(500).json({ message: 'Internal server error in admin check' });
    }
};

module.exports = checkAdminRole;
