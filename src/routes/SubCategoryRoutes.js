// Import core modules and dependencies
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");

// Import controllers and utilities
const subCategoryController = require("../controllers/subCategoryController/SubCategoryController");
const { uploadMultipart, deleteFileFromS3 } = require("../utils/S3");
const SubCategory = require("../models/SubCategory");
const Category = require("../models/Category");
const { ApiResponse } = require("../utils/ApiResponse");

// Import middleware for authentication and role-based access
const { verifyToken } = require("../middleware/VerifyToken");
const checkAdminRole = require("../middleware/CheckAdminRole");
const { cache, clearCache } = require("../middleware/cache"); // Redis caching middleware

// Initialize a new router for subcategory-related routes
const SubCategoryRouter = express.Router();

// ===============================
// Configure Multer for in-memory file storage
// ===============================
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1 // Only allow 1 file per request
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

/**
 * @route   POST /
 * @desc    Create a new subcategory with image upload
 * @access  Protected (Admin only)
 */
SubCategoryRouter.post("/", verifyToken, checkAdminRole, upload.single("image"), async (req, res) => {
  try {
    // Ensure an image is uploaded
    if (!req.file) {
      return res.status(400).json(ApiResponse(null, "No file uploaded", false, 400));
    }

    // Check for existing subcategory with the same name
    const existingSubCategory = await SubCategory.findOne({ name: req.body.name });
    if (existingSubCategory) {
      return res.status(400).json(ApiResponse(null, "Subcategory with this name already exists", false, 400));
    }

    // Validate if the provided category ID exists
    const category = await Category.findById(req.body.categoryId);
    if (!category) {
      return res.status(400).json(ApiResponse(null, "Category not found", false, 400));
    }

    // Generate a unique ObjectId for the new subcategory
    const newSubCategoryId = new mongoose.Types.ObjectId();

    // Upload image to AWS S3
    const fileUrl = await uploadMultipart(req.file, `categories/${req.body.categoryId}`, newSubCategoryId || "default");
    console.log("File uploaded to:", fileUrl);

    // Attach uploaded image URL to request body
    req.body.imageUrl = fileUrl;

    // Create the subcategory via controller
    const subCategory = await subCategoryController.createSubCategory(req, res, newSubCategoryId);

    // Handle any error during creation
    if (subCategory.error) {
      return res.status(400).json(ApiResponse(null, subCategory.error, false, 400));
    }

    // Clear subcategory cache after creation (optional - don't fail if unavailable)
    try {
      await clearCache('cache:*/subcategories*');
    } catch (cacheError) {
      console.log("⚠️  Cache clearing skipped:", cacheError.message);
    }

    // Success response
    res.status(201).json(ApiResponse(subCategory, "Subcategory created successfully", true, 201));
  } catch (error) {
    console.error(error);
    res.status(500).json(ApiResponse(null, "Subcategory creation failed", false, 500, error.message));
  }
});

/**
 * @route   GET /totalSubcategories
 * @desc    Get total count of subcategories
 * @access  Protected
 */
SubCategoryRouter.get("/totalSubcategories", verifyToken, subCategoryController.getTotalSubCategories);

/**
 * @route   GET /
 * @desc    Get all subcategories (Cached for 1 hour)
 * @access  Public
 */
SubCategoryRouter.get("/", cache(3600), subCategoryController.getAllSubCategories);

/**
 * @route   GET /category/:categoryId
 * @desc    Get subcategories filtered by category ID (Cached for 1 hour)
 * @access  Public
 */
SubCategoryRouter.get("/category/:categoryId", cache(3600), subCategoryController.getSubCategoriesByCategory);

/**
 * @route   GET /:id
 * @desc    Get a single subcategory by ID
 * @access  Public
 */
SubCategoryRouter.get("/:id", subCategoryController.getSubCategoryById);

/**
 * @route   PUT /:id
 * @desc    Update an existing subcategory (with optional image replacement)
 * @access  Protected (Admin only)
 */
SubCategoryRouter.put("/:id", verifyToken, checkAdminRole, upload.single("image"), async (req, res) => {
  try {
    console.log("req.params.id", req.params.id);

    // Check if subcategory exists
    const existingSubCategory = await SubCategory.findById(req.params.id);
    console.log("existingSubCategory", existingSubCategory);
    if (!existingSubCategory) {
      return res.status(404).json(ApiResponse(null, "Subcategory not found", false, 404));
    }

    // Validate the new category ID
    const category = await Category.findById(req.body.categoryId);
    if (!category) {
      return res.status(400).json(ApiResponse(null, "Category not found", false, 400));
    }

    // Handle image replacement if a new image is uploaded
    if (req.file) {
      // Delete the old image from S3 if it exists
      if (existingSubCategory.imageUrl) {
        await deleteFileFromS3(existingSubCategory.imageUrl);
      }

      // Upload the new image and attach its URL to the request body
      const fileUrl = await uploadMultipart(req.file, `categories/${req.body.categoryId}`, req.params.id || "default");
      req.body.imageUrl = fileUrl;
    }

    // Update the subcategory via controller
    const updatedSubCategory = await subCategoryController.updateSubCategory(req, res);
    
    // Clear subcategory cache after update (optional - don't fail if unavailable)
    try {
      await clearCache('cache:*/subcategories*');
    } catch (cacheError) {
      console.log("⚠️  Cache clearing skipped:", cacheError.message);
    }
    
    res.status(200).json(updatedSubCategory);
  } catch (error) {
    res.status(500).json(ApiResponse(null, "Subcategory update failed", false, 500, error.message));
  }
});

/**
 * @route   DELETE /:id
 * @desc    Delete a subcategory by ID (clears cache after deletion)
 * @access  Protected (Admin only)
 */
SubCategoryRouter.delete("/:id", verifyToken, checkAdminRole, async (req, res) => {
  await subCategoryController.deleteSubCategory(req, res);
  // Clear subcategory cache after deletion (optional - don't fail if unavailable)
  try {
    await clearCache('cache:*/subcategories*');
  } catch (cacheError) {
    console.log("⚠️  Cache clearing skipped:", cacheError.message);
  }
});

// Export the router so it can be mounted in the main app (e.g., app.js)
module.exports = SubCategoryRouter;
