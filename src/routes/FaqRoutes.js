const express = require('express');
const router = express.Router();
const faqController = require('../controllers/FaqController');

// Optional middleware - add authentication if needed
// const { verifyToken } = require('../middleware/VerifyToken');
// const { requireAdmin } = require('../middleware/requireAdmin');

/**
 * FAQ Routes
 * Base path: /api/faqs
 */

// Public routes (no authentication required)
// GET /api/faqs - Get all FAQs with optional filtering and pagination
router.get('/', faqController.getAllFaqs);

// GET /api/faqs/categories - Get FAQ categories
router.get('/categories', faqController.getCategories);

// GET /api/faqs/search - Search FAQs
router.get('/search', faqController.searchFaqs);

// GET /api/faqs/stats - Get FAQ statistics
router.get('/stats', faqController.getFaqStats);

// GET /api/faqs/category/:category - Get FAQs by category (mobile app compatibility)
router.get('/category/:category', faqController.getFaqsByCategory);

// GET /api/faqs/:id - Get FAQ by ID
router.get('/:id', faqController.getFaqById);

// Admin routes (authentication required - uncomment middleware if needed)
// POST /api/faqs - Create new FAQ
router.post('/', /* verifyToken, requireAdmin, */ faqController.createFaq);

// PUT /api/faqs/:id - Update FAQ
router.put('/:id', /* verifyToken, requireAdmin, */ faqController.updateFaq);

// DELETE /api/faqs/:id - Delete FAQ
router.delete('/:id', /* verifyToken, requireAdmin, */ faqController.deleteFaq);

// PATCH /api/faqs/:id/status - Toggle FAQ active status
router.patch('/:id/status', /* verifyToken, requireAdmin, */ faqController.toggleFaqStatus);

// Bulk operations
// DELETE /api/faqs/bulk - Bulk delete FAQs
router.delete('/bulk', /* verifyToken, requireAdmin, */ faqController.bulkDeleteFaqs);

// PATCH /api/faqs/bulk/status - Bulk update FAQ status
router.patch('/bulk/status', /* verifyToken, requireAdmin, */ faqController.bulkUpdateStatus);

module.exports = router;
