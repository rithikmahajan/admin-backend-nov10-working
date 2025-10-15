const express = require('express');
const router = express.Router();
const inviteFriendController = require('../controllers/inviteController/inviteafriend');
const { verifyToken } = require('../middleware/VerifyToken');
const checkAdminRole = require('../middleware/CheckAdminRole');

// Public routes (no authentication required)

// Validate invite code (for users to check code validity)
router.get('/validate/:code', inviteFriendController.validateInviteCode);

// Get invite code stats (public stats)
router.get('/stats', inviteFriendController.getInviteCodeStats);

// User routes (authentication required)

// Redeem invite code
router.post('/redeem', verifyToken, inviteFriendController.redeemInviteCode);

// Get user's redeemed codes
router.get('/my-redeemed', verifyToken, inviteFriendController.getUserRedeemedCodes);

// Admin routes (admin authentication required)

// Get all invite codes with pagination and search
router.get('/admin/all', checkAdminRole, inviteFriendController.getAllInviteCodes);

// Get specific invite code by ID
router.get('/admin/:id', checkAdminRole, inviteFriendController.getInviteCodeById);

// Create new invite code
router.post('/admin/create', checkAdminRole, inviteFriendController.createInviteCode);

// Update invite code
router.put('/admin/:id', checkAdminRole, inviteFriendController.updateInviteCode);

// Delete invite code
router.delete('/admin/:id', checkAdminRole, inviteFriendController.deleteInviteCode);

// Toggle invite code status (active/inactive)
router.patch('/admin/:id/toggle-status', checkAdminRole, inviteFriendController.toggleInviteCodeStatus);

// Generate random invite code
router.post('/admin/generate-code', checkAdminRole, inviteFriendController.generateInviteCode);

// Get detailed stats (admin only)
router.get('/admin/detailed-stats', checkAdminRole, inviteFriendController.getDetailedInviteCodeStats);

// Bulk operations (admin only)

// Bulk delete invite codes
router.delete('/admin/bulk-delete', checkAdminRole, inviteFriendController.bulkDeleteInviteCodes);

// Bulk update status
router.patch('/admin/bulk-status', checkAdminRole, inviteFriendController.bulkUpdateStatus);

// Export/Import routes

// Export invite codes to CSV
router.get('/admin/export', checkAdminRole, inviteFriendController.exportInviteCodes);

// Analytics routes

// Get redemption analytics
router.get('/admin/analytics/redemptions', checkAdminRole, inviteFriendController.getRedemptionAnalytics);

// Get performance analytics
router.get('/admin/analytics/performance', checkAdminRole, inviteFriendController.getPerformanceAnalytics);

module.exports = router;
