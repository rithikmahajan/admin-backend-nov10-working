const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController/chatController');
const { verifyFirebaseToken, verifyToken, isAdmin, optionalFirebaseToken } = require('../middleware/firebaseAuth');

// ---------- CHAT SESSION ROUTES ----------

// Create new chat session (Firebase authenticated users only)
router.post('/session', verifyFirebaseToken, chatController.createChatSession);

// Get chat session details (Firebase authenticated users only)
router.get('/session/:sessionId', verifyFirebaseToken, chatController.getChatSession);

// End chat session (Firebase authenticated users only)
router.post('/session/end', verifyFirebaseToken, chatController.endChatSession);

// Get user's chat history (Firebase authenticated users only)
router.get('/history', verifyFirebaseToken, chatController.getChatHistory);

// ---------- CHAT MESSAGE ROUTES ----------

// Send chat message (Firebase authenticated users only)
router.post('/message', verifyFirebaseToken, chatController.sendMessage);

// Get chat messages for a session (Firebase authenticated users only)
router.get('/messages/:sessionId', verifyFirebaseToken, chatController.getChatMessages);

// Poll for new messages (Firebase authenticated users only)
router.get('/poll/:sessionId', verifyFirebaseToken, chatController.pollForMessages);

// Mark messages as read (Firebase authenticated users only)
router.patch('/messages/:sessionId/read', verifyFirebaseToken, chatController.markMessagesAsRead);

// ---------- CHAT RATING ROUTES ----------

// Submit chat rating (optional authentication - works for both authenticated and guest users)
router.post('/rating', optionalFirebaseToken, chatController.submitRating);

// Get rating details (Firebase authenticated users only)
router.get('/rating/:sessionId', verifyFirebaseToken, chatController.getRating);

// ---------- ADMIN ROUTES ----------

// Get all active chat sessions (admin only - hybrid auth for admin panel)
router.get('/admin/active-sessions', verifyToken, isAdmin, chatController.getActiveSessions);

// Get all chat sessions with filtering (admin only - hybrid auth for admin panel)
router.get('/admin/sessions', verifyToken, isAdmin, chatController.getAllSessions);

// Get specific session details (admin only - hybrid auth for admin panel)
router.get('/admin/session/:sessionId', verifyToken, isAdmin, chatController.getAdminSessionDetails);

// Send admin message (admin only - hybrid auth for admin panel)
router.post('/admin/message', verifyToken, isAdmin, chatController.sendAdminMessage);

// End session as admin (admin only - hybrid auth for admin panel)
router.post('/admin/session/:sessionId/end', verifyToken, isAdmin, chatController.endSessionAsAdmin);

// Assign session to admin (admin only - hybrid auth for admin panel)
router.post('/admin/session/:sessionId/assign', verifyToken, isAdmin, chatController.assignSession);

// Add session tags (admin only - hybrid auth for admin panel)
router.post('/admin/session/:sessionId/tags', verifyToken, isAdmin, chatController.addSessionTags);

// Escalate session (admin only - hybrid auth for admin panel)
router.post('/admin/session/:sessionId/escalate', verifyToken, isAdmin, chatController.escalateSession);

// Add admin notes (admin only - hybrid auth for admin panel)
router.post('/admin/session/:sessionId/notes', verifyToken, isAdmin, chatController.addAdminNotes);

// Get chat analytics (admin only - hybrid auth for admin panel)
router.get('/admin/analytics', verifyToken, isAdmin, chatController.getChatAnalytics);

// Get admin performance metrics (admin only - hybrid auth for admin panel)
router.get('/admin/performance/:adminId?', verifyToken, isAdmin, chatController.getAdminPerformance);

// Get session analytics (admin only - hybrid auth for admin panel)
router.get('/admin/session/:sessionId/analytics', verifyToken, isAdmin, chatController.getSessionAnalytics);

// ---------- UTILITY ROUTES ----------

// Health check for chat service
router.get('/health', chatController.healthCheck);

// Get chat configuration
router.get('/config', chatController.getChatConfig);

// Test route for development
router.get('/test', chatController.testEndpoint);

module.exports = router;
