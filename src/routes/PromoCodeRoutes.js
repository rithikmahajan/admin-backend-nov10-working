const express = require('express');
const router = express.Router();
const { 
  validatePromoCode, 
  createPromoCode, 
  updatePromoCode, 
  deletePromoCode, 
  getAllPromoCodes,
  getPromoCodeById,
  bulkToggleStatus,
  bulkDelete,
  getPromoCodeStats,
  searchPromoCodes,
  getPromoCodesByStatus,
  getExpiredPromoCodes,
  clonePromoCode
} = require('../controllers/promoCodeController/PromoCodeController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const { verifyToken } = require('../middleware/VerifyToken');

// Public route for validating promo codes
router.post('/validate', validatePromoCode);
router.post('/promo-codes/validate', validatePromoCode); // Legacy support

// User routes for fetching available promo codes
router.get('/user/available', verifyToken, require('../controllers/promoCodeController/PromoCodeController').getAvailablePromoCodesForUser);
router.get('/public', require('../controllers/promoCodeController/PromoCodeController').getPublicPromoCodes);

// Admin-only routes for managing promo codes - Simple routes
router.post('/create', isAuthenticated, isAdmin, createPromoCode);
router.get('/all', isAuthenticated, isAdmin, getAllPromoCodes);
router.get('/:id', isAuthenticated, isAdmin, getPromoCodeById);
router.put('/:id', isAuthenticated, isAdmin, updatePromoCode);
router.delete('/:id', isAuthenticated, isAdmin, deletePromoCode);

// Admin-only routes for managing promo codes - Legacy complex routes
router.get('/admin/promo-codes', isAuthenticated, isAdmin, getAllPromoCodes);
router.get('/admin/promo-codes/stats', isAuthenticated, isAdmin, getPromoCodeStats);
router.get('/admin/promo-codes/search', isAuthenticated, isAdmin, searchPromoCodes);
router.get('/admin/promo-codes/status/:status', isAuthenticated, isAdmin, getPromoCodesByStatus);
router.get('/admin/promo-codes/expired', isAuthenticated, isAdmin, getExpiredPromoCodes);
router.get('/admin/promo-codes/:id', isAuthenticated, isAdmin, getPromoCodeById);
router.post('/admin/promo-codes', isAuthenticated, isAdmin, createPromoCode);
router.post('/admin/promo-codes/bulk/toggle-status', isAuthenticated, isAdmin, bulkToggleStatus);
router.post('/admin/promo-codes/bulk/delete', isAuthenticated, isAdmin, bulkDelete);
router.post('/admin/promo-codes/:id/clone', isAuthenticated, isAdmin, clonePromoCode);
router.put('/admin/promo-codes/:id', isAuthenticated, isAdmin, updatePromoCode);
router.delete('/admin/promo-codes/:id', isAuthenticated, isAdmin, deletePromoCode);

module.exports = router;