// Import core modules and middleware
const express = require("express");
const multer = require("multer");

// Create a new Express router
const router = express.Router();

// Import controller containing business logic for user profile operations
const userProfileController = require("../controllers/userController/UserProfileController");

// Import middleware to verify JWT token for authentication
const { verifyToken } = require("../middleware/VerifyToken");

// Configure multer to store files in memory (used for profile image uploads)
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
 * @route   GET /getProfile
 * @desc    Retrieve the profile of the currently authenticated user
 * @access  Protected
 */
router.get("/getProfile", verifyToken, userProfileController.getUserProfile);

/**
 * @route   POST /postProfile
 * @desc    Create a new user profile with optional image upload
 * @access  Protected
 */
router.post("/postProfile", verifyToken, upload.single("image"), userProfileController.createUserProfile);

/**
 * @route   PUT /updateProfile
 * @desc    Update the authenticated user's profile with optional new image
 * @access  Protected
 */
router.put("/updateProfile", verifyToken, upload.single("image"), userProfileController.updateUserProfile);

/**
 * @route   GET /getProfileByUserId/:userId
 * @desc    Retrieve a user's profile by their user ID
 * @access  Protected
 */
router.get("/getProfileByUserId/:userId", verifyToken, userProfileController.getUserProfileById);

// Export the router to be used in the main app file
module.exports = router;
