const express = require("express");
const router = express.Router();
const WebhookController = require("../controllers/webhookController/WebhookController");
const { isAuthenticated } = require("../middleware/authMiddleware");

// Safe validation middleware
const createValidation = () => {
  try {
    const { body, param, query } = require("express-validator");
    
    return {
      validateWebhookCreate: [
        body("name")
          .notEmpty()
          .withMessage("Webhook name is required")
          .isLength({ min: 1, max: 100 })
          .withMessage("Webhook name must be between 1 and 100 characters"),
        body("url")
          .notEmpty()
          .withMessage("Webhook URL is required")
          .isURL()
          .withMessage("Must be a valid URL"),
        body("events")
          .isArray({ min: 1 })
          .withMessage("At least one event must be specified"),
        body("method")
          .optional()
          .isIn(['POST', 'PUT', 'PATCH'])
          .withMessage("Method must be POST, PUT, or PATCH"),
        body("description")
          .optional()
          .isLength({ max: 500 })
          .withMessage("Description cannot exceed 500 characters"),
        body("active")
          .optional()
          .isBoolean()
          .withMessage("Active must be a boolean value"),
        body("headers")
          .optional()
          .isObject()
          .withMessage("Headers must be an object")
      ],
      validateWebhookUpdate: [
        param("webhookId")
          .isMongoId()
          .withMessage("Invalid webhook ID"),
        body("name")
          .optional()
          .isLength({ min: 1, max: 100 })
          .withMessage("Webhook name must be between 1 and 100 characters"),
        body("url")
          .optional()
          .isURL()
          .withMessage("Must be a valid URL"),
        body("events")
          .optional()
          .isArray({ min: 1 })
          .withMessage("At least one event must be specified"),
        body("method")
          .optional()
          .isIn(['POST', 'PUT', 'PATCH'])
          .withMessage("Method must be POST, PUT, or PATCH"),
        body("description")
          .optional()
          .isLength({ max: 500 })
          .withMessage("Description cannot exceed 500 characters"),
        body("active")
          .optional()
          .isBoolean()
          .withMessage("Active must be a boolean value"),
        body("headers")
          .optional()
          .isObject()
          .withMessage("Headers must be an object")
      ],
      validateWebhookId: [
        param("webhookId")
          .isMongoId()
          .withMessage("Invalid webhook ID")
      ],
      validatePagination: [
        query("page")
          .optional()
          .isInt({ min: 1 })
          .withMessage("Page must be a positive integer"),
        query("limit")
          .optional()
          .isInt({ min: 1, max: 100 })
          .withMessage("Limit must be between 1 and 100"),
        query("status")
          .optional()
          .isIn(['pending', 'healthy', 'error', 'disabled'])
          .withMessage("Status must be one of: pending, healthy, error, disabled"),
        query("active")
          .optional()
          .isBoolean()
          .withMessage("Active must be a boolean value")
      ]
    };
  } catch (error) {
    // If express-validator is not available, return empty middleware
    return {
      validateWebhookCreate: [],
      validateWebhookUpdate: [],
      validateWebhookId: [],
      validatePagination: []
    };
  }
};

const { 
  validateWebhookCreate, 
  validateWebhookUpdate, 
  validateWebhookId, 
  validatePagination 
} = createValidation();

// ==============================
// WEBHOOK MANAGEMENT ROUTES
// ==============================

// Get all webhooks for the authenticated user
router.get("/", isAuthenticated, ...validatePagination, WebhookController.getWebhooks);

// Create a new webhook
router.post("/create", isAuthenticated, ...validateWebhookCreate, WebhookController.createWebhook);

// Get a specific webhook by ID
router.get("/:webhookId", isAuthenticated, ...validateWebhookId, WebhookController.getWebhookById);

// Update a webhook
router.put("/:webhookId", isAuthenticated, ...validateWebhookUpdate, WebhookController.updateWebhook);

// Delete a webhook
router.delete("/:webhookId", isAuthenticated, ...validateWebhookId, WebhookController.deleteWebhook);

// Toggle webhook active status
router.patch("/:webhookId/toggle", isAuthenticated, ...validateWebhookId, WebhookController.toggleWebhook);

// Test a webhook
router.post("/:webhookId/test", isAuthenticated, ...validateWebhookId, WebhookController.testWebhook);

// Get webhook logs
router.get("/:webhookId/logs", isAuthenticated, ...validateWebhookId, ...validatePagination, WebhookController.getWebhookLogs);

// Get webhook statistics
router.get("/:webhookId/stats", isAuthenticated, ...validateWebhookId, WebhookController.getWebhookStats);

module.exports = router;
