require('dotenv').config();
const jwt = require('jsonwebtoken');

// Optional middleware to verify JWT token - allows unauthenticated users
exports.optionalVerifyToken = async (req, res, next) => {
    console.log("🔍 OPTIONAL AUTH MIDDLEWARE - Request received:", {
        method: req.method,
        url: req.url,
        hasAuthHeader: !!req.headers.authorization
    });
    
    try {
        // Extract the token from Authorization header
        const authHeader = req.headers.authorization;

        // If no token is present, continue without authentication
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            req.user = null; // No authenticated user
            return next();
        }

        const token = authHeader.split(" ")[1]; // Extract token after 'Bearer'

        try {
            // Verify the token using the secret key
            const decodedInfo = jwt.verify(token, process.env.SECRET_KEY);
            console.log("Optional auth - decoded token payload:", decodedInfo);

            // Check if decoded token contains user ID
            if (decodedInfo && decodedInfo._id) {
                req.user = decodedInfo; // Attach decoded user data to request
            } else {
                req.user = null; // Invalid token structure
            }
        } catch (jwtError) {
            console.log("Optional JWT Verification Error:", jwtError);
            // For optional auth, we don't fail on invalid tokens
            req.user = null;
        }

        return next(); // Always proceed to next middleware or route

    } catch (error) {
        console.log("Optional Auth Middleware Error:", error);
        // Even on errors, we continue for optional auth
        req.user = null;
        return next();
    }
};

// Strict middleware for checkout - requires valid authentication
exports.requireAuthForCheckout = async (req, res, next) => {
    console.log("🔐 CHECKOUT AUTH MIDDLEWARE - Request received");
    console.log("Request URL:", req.url);
    console.log("Request method:", req.method);
    console.log("Request body keys:", Object.keys(req.body || {}));
    
    try {
        // Extract the token from Authorization header
        const authHeader = req.headers.authorization;

        // For checkout, authentication is mandatory
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ 
                success: false,
                message: "Authentication required for checkout. Please login with Apple, Google, phone number, or email.",
                requireAuth: true
            });
        }

        const token = authHeader.split(" ")[1]; // Extract token after 'Bearer'

        // Verify the token using the secret key
        const decodedInfo = jwt.verify(token, process.env.SECRET_KEY);
        console.log("Checkout auth - decoded token payload:", decodedInfo);

        // Check if decoded token contains user ID
        if (decodedInfo && decodedInfo._id) {
            req.user = decodedInfo; // Attach decoded user data to request
            
            // For checkout, we also need to validate that user has required info
            // This will be handled in the checkout controller
            return next(); // Proceed to next middleware or route
        }

        // If token is invalid (missing `_id`)
        return res.status(401).json({ 
            success: false,
            message: "Invalid authentication token. Please login again.",
            requireAuth: true
        });

    } catch (error) {
        console.log("Checkout JWT Verification Error:", error);

        // Handle specific JWT errors for checkout
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ 
                success: false,
                message: "Authentication token expired. Please login again.",
                requireAuth: true
            });
        } else if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid authentication token. Please login again.",
                requireAuth: true
            });
        } else {
            return res.status(500).json({ 
                success: false,
                message: "Internal Server Error during authentication"
            });
        }
    }
};

// Enhanced validation for checkout requirements with better error messages
exports.validateCheckoutRequirements = async (req, res, next) => {
    console.log("✅ CHECKOUT VALIDATION MIDDLEWARE - Request received");
    console.log("User ID:", req.user?._id);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    try {
        const User = require("../models/User");
        const Address = require("../models/Address");
        const userId = req.user._id;

        // Fetch user details from database
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found. Please login again.",
                requireAuth: true
            });
        }

        // Check if user has valid email (required for authentication)
        const hasValidEmail = user.email && 
                             user.email !== "demo@example.com" && 
                             user.email.includes("@") &&
                             user.email.trim() !== "";

        // Get delivery address phone and email from request body or selected address
        let deliveryPhone = null;
        let deliveryEmail = null;
        let hasValidDeliveryPhone = false;
        let hasValidDeliveryEmail = false;

        // Check if address ID is provided in request
        if (req.body.addressId) {
            const address = await Address.findById(req.body.addressId);
            if (address && address.userId.toString() === userId.toString()) {
                deliveryPhone = address.phoneNumber || address.phNo;
                deliveryEmail = address.email;
            }
        } 
        // Check if address is provided directly in request body (staticAddress)
        else if (req.body.staticAddress) {
            deliveryPhone = req.body.staticAddress.phoneNumber || req.body.staticAddress.phone;
            deliveryEmail = req.body.staticAddress.email;
        }
        // Check if staticAddress object is provided (frontend structure)
        else if (req.body.staticAddress && req.body.staticAddress.phoneNumber) {
            deliveryPhone = req.body.staticAddress.phoneNumber;
            deliveryEmail = req.body.staticAddress.email;
        }
        // Check if address object is provided in request body
        else if (req.body.address && req.body.address.phoneNumber) {
            deliveryPhone = req.body.address.phoneNumber;
            deliveryEmail = req.body.address.email;
        }
        // Check if delivery details are in request body
        else if (req.body.phoneNumber) {
            deliveryPhone = req.body.phoneNumber;
            deliveryEmail = req.body.email;
        }
        // Fallback to user's phone and email if no delivery info provided
        else {
            deliveryPhone = user.phNo;
            deliveryEmail = user.email;
        }

        // Validate delivery phone number
        if (deliveryPhone) {
            // Remove any spaces, dashes, or special characters for validation
            const cleanPhone = deliveryPhone.toString().replace(/[\s\-\(\)\+]/g, '');
            
            hasValidDeliveryPhone = cleanPhone && 
                                   cleanPhone !== "1234567890" && 
                                   cleanPhone.length >= 10 &&
                                   /^[0-9]+$/.test(cleanPhone); // Only digits allowed
        }

        // Validate delivery email address
        if (deliveryEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            hasValidDeliveryEmail = deliveryEmail && 
                                   deliveryEmail !== "demo@example.com" && 
                                   emailRegex.test(deliveryEmail.trim());
        }

        // For checkout, valid delivery address info is required (no longer require profile email)
        const missingFields = [];
        // Profile email is no longer required since email is provided in delivery address
        // if (!hasValidEmail) missingFields.push("valid email address in your profile");
        if (!hasValidDeliveryPhone) missingFields.push("valid phone number in delivery address");
        if (!hasValidDeliveryEmail) missingFields.push("valid email address in delivery address");

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Please provide ${missingFields.join(" and ")} to proceed with checkout.`,
                missingFields,
                requiresUserInfo: true,
                userInfo: {
                    hasValidEmail,
                    hasValidDeliveryPhone,
                    hasValidDeliveryEmail,
                    currentEmail: user.email,
                    currentPhone: user.phNo,
                    deliveryPhone: deliveryPhone,
                    deliveryEmail: deliveryEmail
                },
                checkoutValidation: {
                    phoneRequired: "A valid phone number is required in delivery address for delivery coordination and updates.",
                    deliveryEmailRequired: "A valid email address is required in delivery address for order updates and notifications."
                }
            });
        }

        // Attach validated user and delivery info to request
        req.userInfo = {
            userId: user._id,
            email: deliveryEmail || user.email, // Use delivery email if available, fallback to profile email
            phone: user.phNo,
            name: user.name,
            deliveryPhone: deliveryPhone,
            deliveryEmail: deliveryEmail,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified
        };

        return next();

    } catch (error) {
        console.log("Enhanced Checkout Validation Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error during checkout validation"
        });
    }
};
