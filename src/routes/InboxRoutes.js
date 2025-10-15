const express = require('express');
const router = express.Router();
const inboxController = require('../controllers/inboxController/inboxController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// ---------- USER ROUTES ----------

// Get folder counts
router.get('/user/counts', isAuthenticated, inboxController.getFolderCounts);

// Get messages by folder
router.get('/user/:folder', isAuthenticated, inboxController.getMessages);

// Get specific message
router.get('/user/message/:messageId', isAuthenticated, inboxController.getMessage);

// Send new message
router.post('/user/send', isAuthenticated, inboxController.sendMessage);

// Reply to message
router.post('/user/reply/:messageId', isAuthenticated, inboxController.replyMessage);

// Update message status (read, star, important, folder)
router.patch('/user/message/:messageId', isAuthenticated, inboxController.updateMessageStatus);

// Bulk update messages
router.patch('/user/bulk-update', isAuthenticated, inboxController.bulkUpdateMessages);

// Delete message permanently
router.delete('/user/message/:messageId', isAuthenticated, inboxController.deleteMessage);

// Get thread messages
router.get('/user/thread/:threadId', isAuthenticated, inboxController.getThreadMessages);

// ---------- EXTERNAL/PUBLIC ROUTES ----------

// Create message from external sources (contact forms, email, etc.)
// This route doesn't require authentication as it's for external users
router.post('/external/create', inboxController.createExternalMessage);

// ---------- ADMIN ROUTES ----------

// Get all messages for admin (with pagination and filtering)
router.get('/admin/all', isAuthenticated, isAdmin, (req, res, next) => {
  // Override user ID for admin to see all messages
  req.adminView = true;
  next();
}, inboxController.getMessages);

// Get messages by user ID (admin only)
router.get('/admin/user/:userId/:folder', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Temporarily set req.user._id to the requested userId
    const originalUserId = req.user._id;
    req.user._id = req.params.userId;
    req.params.folder = req.params.folder || 'inbox';
    
    await inboxController.getMessages(req, res);
    
    // Restore original user ID
    req.user._id = originalUserId;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user messages",
      error: error.message
    });
  }
});

// Admin reply to any message
router.post('/admin/reply/:messageId', isAuthenticated, isAdmin, inboxController.replyMessage);

// Admin update any message
router.patch('/admin/message/:messageId', isAuthenticated, isAdmin, inboxController.updateMessageStatus);

// Admin delete any message
router.delete('/admin/message/:messageId', isAuthenticated, isAdmin, inboxController.deleteMessage);

// Get system statistics for admin
router.get('/admin/stats', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const Message = require('../models/Inbox');
    
    const stats = await Message.aggregate([
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          unreadMessages: {
            $sum: { $cond: [{ $eq: ['$status', 'unread'] }, 1, 0] }
          },
          spamMessages: {
            $sum: { $cond: [{ $eq: ['$folder', 'spam'] }, 1, 0] }
          },
          importantMessages: {
            $sum: { $cond: [{ $eq: ['$isImportant', true] }, 1, 0] }
          }
        }
      }
    ]);

    const messagesByType = await Message.aggregate([
      {
        $group: {
          _id: '$messageType',
          count: { $sum: 1 }
        }
      }
    ]);

    const messagesBySource = await Message.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentActivity = await Message.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('sender.name sender.email subject createdAt messageType source')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalMessages: 0,
          unreadMessages: 0,
          spamMessages: 0,
          importantMessages: 0
        },
        messagesByType: messagesByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        messagesBySource: messagesBySource.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentActivity
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin statistics",
      error: error.message
    });
  }
});

module.exports = router;
