const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController/ReviewController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// ---------- USER ROUTES (Item ID) ----------

// Create a review (user)
router.post('/user/:itemId/reviews', isAuthenticated, reviewController.createReview);

// Get reviews for Item (user)
router.get('/user/:itemId/reviews', reviewController.getReviews);

// Update user's own review (user)
router.put('/user/:itemId/reviews/:reviewId', isAuthenticated, reviewController.updateReview);

// Delete user's own review (user)
router.delete('/user/:itemId/reviews/:reviewId', isAuthenticated, reviewController.deleteReview);

// Get average rating for Item (user)
router.get('/user/:itemId/average-rating', reviewController.getAverageRating);

// ---------- PUBLIC ROUTES (Item ID) ----------

// Get reviews by Item ID (public)
router.get('/public/:itemId/reviews', reviewController.getReviews);

// Get average rating by Item ID (public)
router.get('/public/:itemId/average-rating', reviewController.getAverageRating);

// ---------- ADMIN ROUTES (Item ID) ----------

// Get reviews by Item ID (admin)
router.get('/admin/:itemId/reviews', isAuthenticated, isAdmin, reviewController.getReviews);

// Add a fake review using userId (admin, uses itemId)
router.post('/admin/:itemId/reviews', isAuthenticated, isAdmin, reviewController.createFakeReview);

// Update review settings (admin, uses itemId)
router.put('/admin/:itemId/review-settings', isAuthenticated, isAdmin, reviewController.updateReviewSettings);

// ===== FRONTEND COMPATIBLE ENDPOINTS =====
// Import the new product review controller for frontend-compatible endpoints
const productReviewController = require('../controllers/reviewController/ProductReviewController');

// Mark review as helpful - matches frontend expectation: POST /api/reviews/:reviewId/helpful
router.post('/:reviewId/helpful', isAuthenticated, productReviewController.markReviewHelpful);

module.exports = router;