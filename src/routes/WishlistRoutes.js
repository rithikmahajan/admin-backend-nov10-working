// Import required modules
const express = require("express");

// Import controller that handles wishlist-related logic
const wishlistController = require("../controllers/wishlistController/WishlistController");

// Import middleware to verify JWT token (for authentication)
const { verifyToken } = require("../middleware/VerifyToken");
const { optionalVerifyToken } = require("../middleware/OptionalAuth"); // Optional auth for guest users

// Initialize a new Express router
const wishlistRouter = express.Router();

/**
 * @route   POST /add
 * @desc    Add an item to the wishlist (supports both authenticated users and guests)
 * @access  Optional Auth (User can be authenticated or provide sessionId)
 */
wishlistRouter.post("/add", optionalVerifyToken, wishlistController.addToWishlist);

/**
 * @route   GET /
 * @desc    Retrieve the wishlist (supports both authenticated users and guests)
 * @access  Optional Auth (User can be authenticated or provide sessionId)
 */
wishlistRouter.get("/", optionalVerifyToken, wishlistController.getWishlist);

/**
 * @route   DELETE /remove/:itemId
 * @desc    Remove a specific item from the wishlist by wishlist entry ID (supports both authenticated and guest users)
 * @access  Optional Auth (User can be authenticated or provide sessionId)
 * @note    itemId parameter accepts either wishlist entry ID (_id) or product ID (item) for backward compatibility
 */
wishlistRouter.delete("/remove/:itemId", optionalVerifyToken, wishlistController.removeFromWishlist);

/**
 * @route   DELETE /clear
 * @desc    Clear the entire wishlist (supports both authenticated and guest users)
 * @access  Optional Auth (User can be authenticated or provide sessionId)
 */
wishlistRouter.delete("/clear", optionalVerifyToken, wishlistController.clearWishlist);

/**
 * @route   POST /transfer
 * @desc    Transfer guest wishlist to authenticated user after login/signup
 * @access  Protected (User must be authenticated)
 */
wishlistRouter.post("/transfer", verifyToken, wishlistController.transferGuestWishlist);

/**
 * @route   POST /move-to-cart
 * @desc    Move an item from wishlist to cart (supports both authenticated and guest users)
 * @access  Optional Auth (User can be authenticated or provide sessionId)
 */
wishlistRouter.post("/move-to-cart", optionalVerifyToken, wishlistController.moveToCart);

/**
 * @route   POST /move-all-to-cart
 * @desc    Move all items from wishlist to cart (supports both authenticated and guest users)
 * @access  Optional Auth (User can be authenticated or provide sessionId)
 */
wishlistRouter.post("/move-all-to-cart", optionalVerifyToken, wishlistController.moveAllToCart);

// Export the router to be used in the main application
module.exports = wishlistRouter;
