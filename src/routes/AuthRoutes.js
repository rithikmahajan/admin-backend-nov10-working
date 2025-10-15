// Import required dependencies
const express = require("express"); // Express framework for routing
const {
  loginController,
  signUpController,
  resetPassword,
  deleteUser,
  sendVerificationEmail,
  verifyEmail,
  verifyFirebaseOtp,
  verifyOtp,
  signupFirebase,
  loginFirebase,
  logout,
  resendOtp,
  generateOtp,
  getTotalUserCount,
  refreshToken,
  linkAuthProvider,
  getLinkedProviders,
} = require("../controllers/authController/AuthController"); // Authentication controller functions

// Import admin setup service for admin management routes
const adminSetupService = require("../services/adminSetupService");
const { verify } = require("jsonwebtoken"); // JWT verification (unused in this code, consider removing)
const { verifyToken } = require("../middleware/VerifyToken"); // Middleware to verify JWT tokens
const { optionalVerifyToken } = require("../middleware/OptionalAuth"); // Optional authentication middleware

// Initialize an Express router instance
const authRouter = express.Router();

// Define authentication-related API routes
authRouter
  // POST /api/auth/login
  // Handles user login (likely with email/password or similar credentials)
  .post("/login", loginController)

  // POST /api/auth/signup
  // Handles user signup (creates a new user account)
  .post("/signup", signUpController)

  // POST /api/auth/verifyFirebaseOtp
  // Verifies an OTP sent via Firebase (e.g., for phone-based authentication)
  .post("/verifyFirebaseOtp", verifyFirebaseOtp)

  // POST /api/auth/generate-otp
  // Generates and sends an OTP (likely via SMS or email, e.g., using 2Factor.in)
  .post("/generate-otp", generateOtp)

  // POST /api/auth/verifyOtp
  // Verifies an OTP for user authentication/verification
  .post("/verifyOtp", verifyOtp)

  // POST /api/auth/resend-otp (Commented out)
  // Resends an OTP (e.g., if the user didn't receive the first one)
  // .post("/resend-otp", resendOtp)

  // POST /api/auth/signup/firebase
  // Handles Firebase-based signup (creates user with Firebase Authentication)
  .post("/signup/firebase", signupFirebase)

  // POST /api/auth/register/firebase (alias for frontend compatibility)
  // Handles Firebase-based registration (same as signup)
  .post("/register/firebase", signupFirebase)

  // POST /api/auth/login/firebase
  // Handles Firebase-based login (authenticates user with Firebase)
  .post("/login/firebase", loginFirebase)

  // POST /api/auth/apple-signin
  // Handles Apple Sign In with Firebase (creates or logs in user)
  .post("/apple-signin", loginFirebase)

  // POST /api/auth/sendVerificationEmail
  // Sends a verification email to the user (e.g., with a link or code)
  .post("/sendVerificationEmail", sendVerificationEmail)

  // POST /api/auth/verifyEmail
  // Verifies the user's email (e.g., by clicking a link or entering a code)
  .post("/verifyEmail", verifyEmail)

  // POST /api/auth/resetPassword
  // Handles password reset requests (e.g., sends a reset link or updates password)
  .post("/resetPassword", resetPassword)

  // DELETE /api/auth/deleteUser
  // Deletes a user account (protected by JWT verification)
  .delete("/deleteUser", verifyToken, deleteUser)

  // GET /api/auth/totalUsersCount
  // Retrieves the total number of users (protected by JWT verification)
  .get("/totalUsersCount", verifyToken, getTotalUserCount)

  // POST /api/auth/refresh-token
  // Refreshes JWT token using current valid token (protected by JWT verification)
  .post("/refresh-token", verifyToken, refreshToken)

  // GET /api/auth/logout
  // Handles user logout (e.g., clears tokens or sessions) - Optional auth allows unauthenticated logout
  .get("/logout", optionalVerifyToken, logout)

  // POST /api/auth/logout
  // Handles user logout via POST method (for frontend compatibility) - Optional auth allows unauthenticated logout
  .post("/logout", optionalVerifyToken, logout)

  // POST /api/auth/link-provider
  // Link a new authentication provider to existing account (protected - requires authentication)
  .post("/link-provider", verifyToken, linkAuthProvider)

  // GET /api/auth/linked-providers
  // Get all authentication methods linked to the current user (protected)
  .get("/linked-providers", verifyToken, getLinkedProviders)

  // Admin management routes (permanent)
  // GET /api/auth/admin/status
  // Check admin user status and create if doesn't exist
  .get("/admin/status", async (req, res) => {
    try {
      const result = await adminSetupService.initializeAdmin();
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          adminExists: true,
          userId: result.user._id,
          phone: result.user.phNo,
          name: result.user.name
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error checking admin status",
        error: error.message
      });
    }
  })

  // POST /api/auth/admin/reset-password
  // Reset admin password (protected route for maintenance)
  .post("/admin/reset-password", verifyToken, async (req, res) => {
    try {
      // Only allow if current user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required."
        });
      }

      const { newPassword } = req.body;
      const result = await adminSetupService.resetAdminPassword(newPassword);
      
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error resetting admin password",
        error: error.message
      });
    }
  });

// Export the router for use in the main Express app
module.exports = authRouter;