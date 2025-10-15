// Import required dependencies
const express = require("express"); // Express framework for routing
const multer = require("multer"); // Middleware for handling file uploads
const categoryController = require("../controllers/categoryController/CategoryController"); // Controller for category-related logic
const { uploadMultipart, deleteFileFromS3 } = require("../utils/S3"); // S3 utilities for file upload and deletion
const mongoose = require("mongoose"); // Mongoose for MongoDB operations
const Category = require("../models/Category"); // Mongoose model for Category collection
const { ApiResponse } = require("../utils/ApiResponse"); // Utility to standardize API responses
const { verifyToken } = require("../middleware/VerifyToken"); // Middleware to verify JWT tokens
const checkAdminRole = require("../middleware/CheckAdminRole"); // Middleware to restrict access to admins

// Initialize an Express router instance
const CategoryRouter = express.Router();

// Import NewItemController for sale functionality
const newItemController = require("../controllers/itemController/NewItemController");

// Configure multer for in-memory storage (files are stored in memory, not on disk)
const storage = multer.memoryStorage();
const upload = multer({ storage }); // Multer instance for handling file uploads

// GET /api/categories/sale
// Gets categories that have sale products (PUBLIC - NO AUTH REQUIRED)
CategoryRouter.get("/sale", (req, res) => {
  console.log("🏷️ Sale categories route hit");
  newItemController.getSaleCategories(req, res);
});

// POST /api/categories/
// Creates a new category with an optional image upload (admin-only)
CategoryRouter.post(
  "/",
  verifyToken, // Ensure user is authenticated
  checkAdminRole, // Ensure user has admin role
  upload.single("image"), // Handle single file upload (field name: "image")
  async (req, res) => {
    try {
      console.log("ROUTE - Creating category:");
      console.log("ROUTE - req.file:", req.file ? { name: req.file.originalname, size: req.file.size, type: req.file.mimetype } : null);
      console.log("ROUTE - req.body:", req.body);

      // Validate required fields
      if (!req.body.name || !req.body.name.trim()) {
        return res.status(400).json(ApiResponse(null, "Category name is required", false, 400));
      }

      // Check if an image file was uploaded
      if (!req.file) {
        return res.status(400).json(ApiResponse(null, "Image file is required", false, 400));
      }

      // Check for duplicate category name (case-insensitive)
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${req.body.name.trim()}$`, 'i') }
      });
      if (existingCategory) {
        return res.status(400).json(ApiResponse(null, "Category name already exists", false, 400));
      }

      // Generate a new MongoDB ObjectId for the category
      const newCategoryId = new mongoose.Types.ObjectId();

      // Upload the image to AWS S3 and get the file URL
      console.log("ROUTE - Uploading image to S3...");
      const fileUrl = await uploadMultipart(req.file, "categories", newCategoryId);
      console.log("ROUTE - File uploaded to:", fileUrl);

      // Attach the image URL to the request body for use in the controller
      req.body.imageUrl = fileUrl;

      // Call the controller to create the category
      await categoryController.createCategory(req, res, newCategoryId);
      
      // The controller already sends the response, so no need to send another one
    } catch (error) {
      console.error("ROUTE - Category creation error:", error);
      // Ensure no response is sent if headers were already sent
      if (!res.headersSent) {
        res.status(500).json(ApiResponse(null, "Category creation failed", false, 500, error.message));
      }
    }
  }
);

// GET /api/categories/totalCountCategories
// Retrieves the total number of categories (authenticated users only)
CategoryRouter.get(
  "/totalCountCategories",
  verifyToken,
  categoryController.getTotalCategories
);

// GET /api/categories/
// Retrieves all categories (public access)
CategoryRouter.get("/", categoryController.getAllCategories);

// GET /api/categories/:id
// Retrieves a single category by its ID (public access)
CategoryRouter.get("/:id", categoryController.getCategoryById);

// PUT /api/categories/:id
// Updates an existing category with an optional image upload (admin-only)
CategoryRouter.put(
  "/:id",
  verifyToken, // Ensure user is authenticated
  checkAdminRole, // Ensure user has admin role
  upload.single("image"), // Handle single file upload (field name: "image")
  async (req, res) => {
    try {
      console.log("UPDATE REQUEST - req.params.id:", req.params.id); // Log category ID for debugging
      console.log("UPDATE REQUEST - req.body:", req.body); // Log request body
      console.log("UPDATE REQUEST - req.file:", req.file); // Log uploaded file

      // Check if the category exists
      const existingCategory = await Category.findById(req.params.id);
      console.log("UPDATE REQUEST - existingCategory:", existingCategory); // Log existing category for debugging
      if (!existingCategory) {
        return res
          .status(404)
          .json(ApiResponse(null, "Category not found", false, 404));
      }

      // If a new image is uploaded, delete the old image from S3
      if (req.file && existingCategory.imageUrl) {
        await deleteFileFromS3(existingCategory.imageUrl);
      }

      // If a new image is uploaded, upload it to S3 and update the image URL
      if (req.file) {
        const fileUrl = await uploadMultipart(req.file, "categories", req.params.id);
        req.body.imageUrl = fileUrl; // Attach new image URL to request body
      }

      // Call the controller to update the category
      await categoryController.updateCategory(req, res);
    } catch (error) {
      // Send error response if update fails
      res
        .status(500)
        .json(
          ApiResponse(null, "Category update failed", false, 500, error.message)
        );
    }
  }
);

// DELETE /api/categories/:id
// Deletes a category by its ID (admin-only)
CategoryRouter.delete(
  "/:id",
  verifyToken,
  checkAdminRole,
  categoryController.deleteCategory
);

// Export the router for use in the main Express app
module.exports = CategoryRouter;