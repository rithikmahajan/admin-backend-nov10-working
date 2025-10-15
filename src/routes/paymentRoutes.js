// Import the Express framework
const express = require("express");

// Create a new router object using Express
const router = express.Router();

// Import the payment controller containing business logic for handling payments
const paymentController = require("../controllers/paymentController/paymentController");

// Import middleware to verify JWT token for protected routes
const { verifyToken } = require("../middleware/VerifyToken");
const { requireAuthForCheckout, validateCheckoutRequirements } = require("../middleware/OptionalAuth");

// 🔐 STRICT AUTHENTICATION REQUIRED FOR ALL PAYMENT OPERATIONS
// Only authenticated users can initiate, verify, and manage payments

// Route to create a payment order
// MANDATORY: Authentication + valid email + valid delivery phone number
router.post("/create-order", requireAuthForCheckout, validateCheckoutRequirements, paymentController.createOrder);

// Route to verify payment after the transaction is completed
// MANDATORY: Authentication required to verify payments for security
router.post("/verify-payment", requireAuthForCheckout, paymentController.verifyPayment);

// 📊 Route to get shipping status (for frontend polling)
// Protected by verifyToken to ensure only authenticated users can check their order status
router.get("/shipping-status/:orderId", verifyToken, paymentController.getShippingStatus);

// 🔄 Route to retry failed shipping processing
// Protected by verifyToken to ensure only authenticated users can retry their orders
router.post("/retry-shipping/:orderId", verifyToken, paymentController.retryShipping);

// 🧪 Route to test automatic order creation flow (for development/testing)
// Protected by verifyToken - can be used to verify the entire flow is working
router.get("/test-order-flow/:orderId", verifyToken, paymentController.testOrderFlow);

// 🧪 Route to get test products for Razorpay testing
// PUBLIC ENDPOINT - No authentication required for testing purposes
router.get("/test-products", paymentController.getTestProducts);

// Export the router to be used in the main app file (e.g., app.js)
module.exports = router;
