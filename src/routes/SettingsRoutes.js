const express = require("express");
const router = express.Router();
const SettingsController = require("../controllers/settingsController/SettingsController");
const { isAuthenticated } = require("../middleware/authMiddleware");

// Safe validation middleware - only use if express-validator is available
const createValidation = () => {
  try {
    const { body, param, query } = require("express-validator");
    
    return {
      validateSettingCategory: [
        param("category").isIn([
          'communicationPreferences', 'profileVisibility', 'locationData',
          'autoInvoice', 'huggingFaceApi', 'onlineDiscounts', 'shippingCharges',
          'hsnCodes', 'userLimits', 'languageRegion', 'dynamicPricing',
          'autoNotifications', 'webhooks'
        ]).withMessage("Invalid setting category")
      ],
      validateBulkUpdate: [
        body("updates").isArray().withMessage("Updates must be an array"),
        body("updates.*.category").isString().withMessage("Category must be a string"),
        body("updates.*.settings").isObject().withMessage("Settings must be an object")
      ]
    };
  } catch (error) {
    // If express-validator is not available, return empty middleware
    return {
      validateSettingCategory: [],
      validateBulkUpdate: []
    };
  }
};

const { validateSettingCategory, validateBulkUpdate } = createValidation();

// Get all user settings
router.get("/", isAuthenticated, SettingsController.getUserSettings);

// Update all user settings
router.put("/", isAuthenticated, SettingsController.updateUserSettings);

// Get specific setting category
router.get("/category/:category", isAuthenticated, ...validateSettingCategory, SettingsController.getSettingCategory);

// Update specific setting category
router.put("/category/:category", isAuthenticated, ...validateSettingCategory, SettingsController.updateSettingCategory);

// Toggle specific setting (URL params)
router.patch("/toggle/:category/:setting", isAuthenticated, SettingsController.toggleSetting);

// Toggle specific setting (request body) - for our frontend
router.patch("/toggle", isAuthenticated, SettingsController.toggleSettingBody);

// Reset settings
router.post("/reset", isAuthenticated, SettingsController.resetSettings);

// Get settings history
router.get("/history", isAuthenticated, SettingsController.getSettingsHistory);

// Export settings
router.get("/export", isAuthenticated, SettingsController.exportSettings);

// Bulk update settings
router.put("/bulk", isAuthenticated, ...validateBulkUpdate, SettingsController.bulkUpdateSettings);

// Include webhook routes
const webhookRoutes = require("./WebhookRoutes");
router.use("/webhooks", webhookRoutes);

// ==============================
// SHIPPING ROUTES
// ==============================

// Get all shipping charges
router.get("/shipping/charges", isAuthenticated, SettingsController.getShippingCharges);

// Create new shipping charge
router.post("/shipping/charges", isAuthenticated, SettingsController.createShippingCharge);

// Update shipping charge
router.put("/shipping/charges/:chargeId", isAuthenticated, SettingsController.updateShippingCharge);

// Delete shipping charge
router.delete("/shipping/charges/:chargeId", isAuthenticated, (req, res, next) => {
  // Pre-validation middleware to check chargeId
  const { chargeId } = req.params;
  if (!chargeId || chargeId === 'undefined' || chargeId === 'null') {
    return res.status(400).json({
      success: false,
      message: 'Invalid or missing shipping charge ID in URL'
    });
  }
  
  // Check if chargeId is a valid MongoDB ObjectId format (24 hex characters)
  if (!/^[0-9a-fA-F]{24}$/.test(chargeId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid shipping charge ID format'
    });
  }
  
  next();
}, SettingsController.deleteShippingCharge);

// Update general shipping settings
router.put("/shipping/general", isAuthenticated, SettingsController.updateShippingSettings);

// Get shipping charge by location (lookup)
router.get("/shipping/charges/lookup", isAuthenticated, SettingsController.getShippingChargeByLocation);

module.exports = router;
