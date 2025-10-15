const express = require('express');
const router = express.Router();
const CartAbandonmentController = require('../controllers/cartAbandonmentController/cartAbandonmentController');

// Get all abandoned carts with filters
router.get('/abandoned-carts', CartAbandonmentController.getAbandonedCarts);

// Sync users from Firebase
router.post('/sync-firebase-users', CartAbandonmentController.syncFirebaseUsers);

// Export data (CSV/XLSX)
router.get('/export', CartAbandonmentController.exportData);

// Send email to specific user
router.post('/send-email/:userId', CartAbandonmentController.sendEmail);

// Send bulk emails
router.post('/send-bulk-emails', CartAbandonmentController.sendBulkEmails);

// Get user profile
router.get('/user-profile/:userId', CartAbandonmentController.getUserProfile);

// Delete user
router.delete('/delete-user/:userId', CartAbandonmentController.deleteUser);

// Get filter options
router.get('/filter-options', CartAbandonmentController.getFilterOptions);

// Get statistics
router.get('/statistics', async (req, res) => {
  try {
    const filters = req.query;
    const stats = await CartAbandonmentController.getStatistics(filters);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;
