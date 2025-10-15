const express = require("express");
const router = express.Router();
const {
    getAllBundles,
    getBundleCategories,
    getAvailableItemsForBundles,
    getBundleById,
    createBundle,
    updateBundle,
    deleteBundle,
    toggleBundleStatus,
    getBundlesForProduct
} = require("../controllers/bundleController/BundleController");

// Import middleware for authentication
const { verifyToken } = require("../middleware/VerifyToken");

/**
 * @route   GET /api/items/bundles
 * @desc    Get all bundles with pagination and filtering
 * @access  Public
 */
router.get("/", getAllBundles);

/**
 * @route   GET /api/items/bundles/categories
 * @desc    Get all categories that have bundles
 * @access  Public
 */
router.get("/categories", getBundleCategories);

/**
 * @route   GET /api/items/bundles/items
 * @desc    Get available items for bundle selection
 * @access  Public
 */
router.get("/items", getAvailableItemsForBundles);

/**
 * @route   GET /api/items/bundles/product/:itemId
 * @desc    Get bundles for a specific product
 * @access  Public
 */
router.get("/product/:itemId", getBundlesForProduct);

/**
 * @route   GET /api/items/bundles/:id
 * @desc    Get bundle by ID
 * @access  Public
 */
router.get("/:id", getBundleById);

/**
 * @route   POST /api/items/bundles
 * @desc    Create new bundle
 * @access  Private (Admin)
 */
router.post("/", verifyToken, createBundle);

/**
 * @route   PUT /api/items/bundles/:id
 * @desc    Update bundle
 * @access  Private (Admin)
 */
router.put("/:id", verifyToken, updateBundle);

/**
 * @route   PATCH /api/items/bundles/:id/toggle-status
 * @desc    Toggle bundle active status
 * @access  Private (Admin)
 */
router.patch("/:id/toggle-status", verifyToken, toggleBundleStatus);

/**
 * @route   DELETE /api/items/bundles/:id
 * @desc    Delete bundle
 * @access  Private (Admin)
 */
router.delete("/:id", verifyToken, deleteBundle);

module.exports = router;
