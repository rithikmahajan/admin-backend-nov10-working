const express = require('express');
const partnerController = require('../controllers/partnerController/PartnerController');
const { verifyToken } = require('../middleware/VerifyToken');
const checkAdminRole = require('../middleware/CheckAdminRole');

const partnerRouter = express.Router();

// Admin routes - require admin authentication
partnerRouter.use(verifyToken);

// Create new partner
partnerRouter.post('/', checkAdminRole, partnerController.createPartner);

// Get all partners with pagination and filters
partnerRouter.get('/', checkAdminRole, partnerController.getAllPartners);

// Get partner statistics
partnerRouter.get('/statistics', checkAdminRole, partnerController.getPartnerStatistics);

// Get partner by ID or partner ID
partnerRouter.get('/:partnerId', checkAdminRole, partnerController.getPartnerById);

// Update partner details
partnerRouter.put('/:partnerId', checkAdminRole, partnerController.updatePartner);

// Update partner password
partnerRouter.put('/:partnerId/password', checkAdminRole, partnerController.updatePartnerPassword);

// Block/Unblock partner
partnerRouter.patch('/:partnerId/toggle-status', checkAdminRole, partnerController.togglePartnerStatus);

// Delete partner (soft delete)
partnerRouter.delete('/:partnerId', checkAdminRole, partnerController.deletePartner);

// Partner authentication routes (no admin required)
partnerRouter.post('/login', partnerController.partnerLogin);

module.exports = partnerRouter;
