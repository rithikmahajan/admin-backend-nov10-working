const express = require("express");
const router = express.Router();
const firebaseController = require("../controllers/firebaseController/firebaseController");
const { isAuthenticated } = require("../middleware/authMiddleware");

/**
 * @route GET /api/firebase/users
 * @desc Get all Firebase authenticated users
 * @access Private (Admin only)
 */
router.get("/users", firebaseController.getAllFirebaseUsers);

/**
 * @route GET /api/firebase/users/:uid
 * @desc Get Firebase user by UID
 * @access Public (for testing)
 */
router.get("/users/:uid", firebaseController.getFirebaseUserById);

/**
 * @route POST /api/firebase/users/:uid/block
 * @desc Block/Disable Firebase user
 * @access Public (for testing)
 */
router.post("/users/:uid/block", firebaseController.blockFirebaseUser);

/**
 * @route POST /api/firebase/users/:uid/unblock
 * @desc Unblock/Enable Firebase user
 * @access Public (for testing)
 */
router.post("/users/:uid/unblock", firebaseController.unblockFirebaseUser);

/**
 * @route DELETE /api/firebase/users/:uid
 * @desc Delete Firebase user
 * @access Public (for testing)
 */
router.delete("/users/:uid", firebaseController.deleteFirebaseUser);

module.exports = router;
