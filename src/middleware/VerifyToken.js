require('dotenv').config();
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
exports.verifyToken = async (req, res, next) => {
    try {
        // Extract the token from Authorization header
        const authHeader = req.headers.authorization;

        // If no token is present or it doesn't start with 'Bearer', return 401
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Token missing, please login again" });
        }

        const token = authHeader.split(" ")[1]; // Extract token after 'Bearer'
        // console.log("Extracted token:", token);

        // Verify the token using the secret key
        const decodedInfo = jwt.verify(token, process.env.SECRET_KEY);
        // console.log("Decoded token info:", decodedInfo);
        console.log("Decoded inside verify token services token payload:", decodedInfo);

        // Check if decoded token contains user ID
        if (decodedInfo && decodedInfo._id) {
            req.user = decodedInfo; // Attach decoded user data to request
            return next(); // Proceed to next middleware or route
        }

        // If token is invalid (missing `_id`)
        return res.status(401).json({ message: "Invalid Token, please login again" });

    } catch (error) {
        console.log("JWT Verification Error:", error);

        // Handle specific JWT errors
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Token expired, please login again" });
        } else if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Invalid Token, please login again" });
        } else {
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
};

// Optional middleware to verify JWT token (allows both authenticated and guest users)
exports.verifyTokenOptional = async (req, res, next) => {
    try {
        // Extract the token from Authorization header
        const authHeader = req.headers.authorization;

        // If no token is present, continue as guest user
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            req.user = null; // No authenticated user
            return next();
        }

        const token = authHeader.split(" ")[1]; // Extract token after 'Bearer'

        // Verify the token using the secret key
        const decodedInfo = jwt.verify(token, process.env.SECRET_KEY);
        console.log("Decoded inside verify token optional payload:", decodedInfo);

        // Check if decoded token contains user ID
        if (decodedInfo && decodedInfo._id) {
            req.user = decodedInfo; // Attach decoded user data to request
        } else {
            req.user = null; // Invalid token treated as guest
        }

        return next(); // Proceed to next middleware or route

    } catch (error) {
        console.log("JWT Optional Verification Error:", error);
        
        // If token verification fails, continue as guest user
        req.user = null;
        return next();
    }
};
