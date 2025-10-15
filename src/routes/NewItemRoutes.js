const express = require("express");
const router = express.Router();
const newItemController = require("../controllers/itemController/NewItemController");
const recommendationController = require("../controllers/itemController/RecommendationController");
const { locationBasedPricingMiddleware } = require("../middleware/locationPricingMiddleware");

// Import the new product review controller
const productReviewController = require("../controllers/reviewController/ProductReviewController");
// Import the detailed rating controller
const detailedRatingController = require("../controllers/reviewController/DetailedRatingController");
const { verifyToken } = require("../middleware/VerifyToken");

// Import bundle routes
const bundleRoutes = require("./BundleRoutes");

// Bundle routes - must be before other routes to avoid conflicts with :itemId
router.use("/bundles", bundleRoutes);

// DEBUG ENDPOINT: Test product validation with ObjectId conversion
router.post("/debug/validate-products", async (req, res) => {
  try {
    const { productIds } = req.body;
    const Item = require("../models/Item");
    const mongoose = require("mongoose");
    
    console.log('📥 Received product IDs:', productIds);
    console.log('📥 Type:', typeof productIds[0]);
    
    // Test 1: Direct string query (WILL FAIL)
    const test1 = await Item.find({
      _id: { $in: productIds }
    });
    console.log('❌ Test 1 (String IDs):', test1.length, 'found');
    
    // Test 2: Convert to ObjectId (SHOULD WORK)
    const objectIds = productIds.map(id => mongoose.Types.ObjectId(id));
    const test2 = await Item.find({
      _id: { $in: objectIds }
    });
    console.log('✅ Test 2 (ObjectIds):', test2.length, 'found');
    
    // Test 3: Check status
    const test3 = await Item.find({
      _id: { $in: objectIds },
      status: 'live'
    });
    console.log('✅ Test 3 (Live products):', test3.length, 'found');
    
    res.json({
      received: productIds.length,
      test1_string: test1.length,
      test2_objectid: test2.length,
      test3_live: test3.length,
      products: test2.map(p => ({
        id: p._id,
        name: p.name || p.productName,
        status: p.status,
        sizes: p.sizes?.length || 0
      }))
    });
  } catch (error) {
    console.error("Debug validation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Search products endpoint - must be before other routes to avoid conflicts
router.get("/search", (req, res) => {
  console.log("🔍 Search route hit with query:", req.query.query);
  newItemController.searchProducts(req, res);
});

// Sale endpoints - must be before other routes to avoid conflicts with /:itemId
router.get("/sale", locationBasedPricingMiddleware, (req, res) => {
  console.log("🏷️ Sale products route hit");
  newItemController.getSaleProducts(req, res);
});

router.get("/sale/category/:categoryId", locationBasedPricingMiddleware, (req, res) => {
  console.log("🏷️ Sale products by category route hit:", req.params.categoryId);
  newItemController.getSaleProductsByCategory(req, res);
});

// ===== PRODUCT REVIEW ENDPOINTS - Frontend Compatible =====
// Get product reviews - matches frontend expectation: GET /api/products/:productId/reviews  
router.get("/:productId/reviews", (req, res) => {
  console.log("📝 Product reviews route hit for productId:", req.params.productId);
  productReviewController.getProductReviews(req, res);
});

// Get product rating statistics - matches frontend expectation: GET /api/products/:productId/rating-stats
router.get("/:productId/rating-stats", (req, res) => {
  console.log("📊 Product rating stats route hit for productId:", req.params.productId);
  productReviewController.getProductRatingStats(req, res);
});

// Submit product review - matches frontend expectation: POST /api/products/:productId/reviews
router.post("/:productId/reviews", verifyToken, (req, res) => {
  console.log("✍️ Submit product review route hit for productId:", req.params.productId);
  productReviewController.submitProductReview(req, res);
});

// ===== DETAILED RATING ENDPOINTS - Size/Comfort/Durability =====
// Submit detailed rating - matches frontend expectation: POST /api/products/:productId/rating
router.post("/:productId/rating", verifyToken, (req, res) => {
  console.log("⭐ Submit detailed rating route hit for productId:", req.params.productId);
  detailedRatingController.submitProductRating(req, res);
});

// Get detailed ratings - matches frontend expectation: GET /api/products/:productId/detailed-ratings
router.get("/:productId/detailed-ratings", (req, res) => {
  console.log("📊 Get detailed ratings route hit for productId:", req.params.productId);
  detailedRatingController.getProductDetailedRatings(req, res);
});

// Voice search endpoint - enhanced search for voice input
// Supports both text queries and audio files (for future implementation)
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for audio files
  fileFilter: (req, file, cb) => {
    // Accept audio files for future voice processing
    if (file.mimetype.startsWith('audio/') || file.fieldname === 'text') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed for voice search'), false);
    }
  }
});

router.post("/voice-search", upload.single('audio'), (req, res) => {
  console.log("🎤 Voice search route hit with:", { 
    hasText: !!(req.body.query || req.body.text),
    hasAudio: !!req.file,
    audioSize: req.file ? req.file.size : 0
  });
  newItemController.voiceSearchProducts(req, res);
});

// Filtered items endpoint for frontend (PUBLIC - NO AUTH REQUIRED)
router.get("/filtered", locationBasedPricingMiddleware, (req, res) => {
  console.log("🔍 Filtered items route hit with params:", req.query);
  newItemController.getFilteredItems(req, res);
});

// Phase 1: Create basic product
router.post("/basic-product", (req, res) => {
  console.log("Basic product route hit");
  newItemController.createBasicProduct(req, res);
});

// Phase 2: Update product with draft configuration
router.put("/:itemId/draft-configuration", (req, res) => {
  newItemController.updateDraftConfiguration(req, res);
});

// Phase 5: Update product status (draft → schedule → live)
router.put("/:itemId/status", (req, res) => {
  newItemController.updateProductStatus(req, res);
});

// Get products by status (draft, live, scheduled)
router.get("/status/:status", (req, res) => {
  newItemController.getProductsByStatus(req, res);
});

// Get items by subcategory (with location-based pricing)
router.get("/subcategory/:subCategoryId", locationBasedPricingMiddleware, (req, res) => {
  newItemController.getItemsBySubCategory(req, res);
});

// Get latest items by subcategory (with location-based pricing)
router.get("/latest-items/:subCategoryId", locationBasedPricingMiddleware, (req, res) => {
  newItemController.getLatestItemsBySubCategory(req, res);
});

// Arrangement routes (must be before /:itemId route to avoid conflicts)
router.get("/categories-arrangement", newItemController.getCategoriesForArrangement);
router.get("/items-arrangement", newItemController.getItemsForArrangement);
router.put("/categories-display-order", newItemController.updateCategoriesDisplayOrder);
router.put("/subcategories-display-order", (req, res) => {
  console.log("🎯 ROUTE HIT: PUT /api/items/subcategories-display-order");
  newItemController.updateSubCategoriesDisplayOrder(req, res);
});
router.put("/items-display-order", newItemController.updateItemsDisplayOrder);

// Update category and subcategory assignment for an item
router.put("/:itemId/category-assignment", (req, res) => {
  newItemController.updateItemCategoryAssignment(req, res);
});

// Standard CRUD operations (with location-based pricing for GET requests)
router.get("/", locationBasedPricingMiddleware, newItemController.getAllItems);
router.get("/:itemId", locationBasedPricingMiddleware, newItemController.getItemById);
router.put("/:itemId", newItemController.updateItem);
router.delete("/:itemId", newItemController.deleteItem);

// Recommendation Settings Routes
router.get("/:itemId/recommendation-settings", recommendationController.getRecommendationSettings);
router.put("/:itemId/recommendation-settings", recommendationController.updateRecommendationSettings);

// Product Management Settings Routes
router.get("/:itemId/management-settings", recommendationController.getProductManagementSettings);
router.put("/:itemId/management-settings", recommendationController.updateProductManagementSettings);

// Bulk operations
router.put("/bulk/management-settings", recommendationController.bulkUpdateProductSettings);

module.exports = router;
