// Import required dependencies
const express = require("express"); // Express framework for routing
console.log("🚛 CART ROUTES FILE LOADING - CartRoutes.js is being loaded");
const cartController = require("../controllers/cartController/CartController"); // Controller for cart-related logic
console.log("🎯 CART CONTROLLER LOADED - CartController imported successfully");
const cartRoutes = express.Router(); // Initialize an Express router instance
const { verifyToken } = require("../middleware/VerifyToken"); // Middleware to verify JWT tokens
const { optionalVerifyToken } = require("../middleware/OptionalAuth"); // Optional auth for guest users
const { cartPricingMiddleware } = require("../middleware/locationPricingMiddleware"); // Location-based pricing middleware

// Define cart-related API endpoints, supports both authenticated and guest users
cartRoutes
  // POST /api/cart/
  // Adds an item to cart (supports both authenticated users and guests with sessionId)
  .post("/", optionalVerifyToken, cartController.create)

  // GET /api/cart/user
  // Retrieves the cart (supports both authenticated users and guests with sessionId)
  .get("/user", optionalVerifyToken, cartPricingMiddleware, cartController.getByUserId)

  // PATCH /api/cart/:id
  // Updates a specific cart item (e.g., quantity) by its ID for authenticated users only
  .patch("/:id", verifyToken, cartController.updateById)

  // PUT /api/cart/update
  // Frontend compatible: Updates cart item quantity by itemId and size
  .put("/update", optionalVerifyToken, cartController.updateCartItem)

  // DELETE /api/cart/remove
  // Frontend compatible: Removes item from cart by itemId and size
  .delete("/remove", optionalVerifyToken, cartController.removeCartItem)

  // DELETE /api/cart/clear
  // Clears the entire cart (supports both authenticated users and guests)
  // IMPORTANT: This must come BEFORE the /:id route to prevent "clear" being treated as an ID
  .delete("/clear", optionalVerifyToken, cartController.clearCart)

  // DELETE /api/cart/:id
  // Deletes a specific cart item by its ID for authenticated users only  
  .delete("/:id", verifyToken, cartController.deleteById)

  // DELETE /api/cart/item/:itemId
  // Deletes a cart item by the associated item ID (supports both authenticated and guest users)
  .delete("/item/:itemId", optionalVerifyToken, cartController.deleteByItemId)

  // POST /api/cart/transfer
  // Transfers guest cart to authenticated user after login/signup
  .post("/transfer", verifyToken, cartController.transferGuestCart)

  // Test endpoint to debug cart route issues
  .get("/test", (req, res) => {
    console.log("🧪 TEST CART ENDPOINT HIT - Routes are working!");
    res.json({ success: true, message: "Cart routes are working", timestamp: new Date().toISOString() });
  });

// Export the router for use in the main Express app
module.exports = cartRoutes;