const express = require("express");
const pointsController = require("../controllers/pointsController/PointsController");
const { verifyToken } = require("../middleware/VerifyToken");

const router = express.Router();

/**
 * @route   GET /user
 * @desc    Get current authenticated user's points information  
 * @access  Protected
 */
router.get("/user", verifyToken, pointsController.getCurrentUserPoints);

/**
 * @route   POST /redeem
 * @desc    Redeem points for current authenticated user
 * @access  Protected
 */
router.post("/redeem", verifyToken, pointsController.redeemCurrentUserPoints);

/**
 * @route   GET /config
 * @desc    Get points system configuration
 * @access  Protected (Admin)
 */
router.get("/config", verifyToken, pointsController.getSystemConfig);

/**
 * @route   PUT /config
 * @desc    Update points system configuration
 * @access  Protected (Admin)
 */
router.put("/config", verifyToken, pointsController.updateSystemConfig);

/**
 * @route   GET /users
 * @desc    Get all users with their points information
 * @access  Protected (Admin)
 */
router.get("/users", verifyToken, pointsController.getAllUsersWithPoints);

/**
 * @route   GET /user/:userId
 * @desc    Get specific user's points information
 * @access  Protected
 */
router.get("/user/:userId", verifyToken, pointsController.getUserPoints);

/**
 * @route   POST /user/:userId/allocate
 * @desc    Allocate points to a specific user
 * @access  Protected (Admin)
 */
router.post("/user/:userId/allocate", verifyToken, pointsController.allocatePoints);

/**
 * @route   POST /user/:userId/redeem
 * @desc    Redeem points from a specific user
 * @access  Protected
 */
router.post("/user/:userId/redeem", verifyToken, pointsController.redeemPoints);

/**
 * @route   PUT /user/:userId
 * @desc    Update user's points data
 * @access  Protected (Admin)
 */
router.put("/user/:userId", verifyToken, pointsController.updateUserPoints);

/**
 * @route   GET /user/:userId/history
 * @desc    Get user's points transaction history
 * @access  Protected
 */
router.get("/user/:userId/history", verifyToken, pointsController.getUserPointsHistory);

/**
 * @route   DELETE /user/:userId
 * @desc    Delete user's points record
 * @access  Protected (Admin)
 */
router.delete("/user/:userId", verifyToken, pointsController.deleteUserPoints);

/**
 * @route   GET /summary
 * @desc    Get points system summary statistics
 * @access  Protected (Admin)
 */
router.get("/summary", verifyToken, pointsController.getPointsSummary);

module.exports = router;
