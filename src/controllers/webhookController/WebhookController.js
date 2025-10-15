const Settings = require("../../models/Settings");
const { ApiResponse } = require("../../utils/ApiResponse");
const mongoose = require("mongoose");
const crypto = require("crypto");
const axios = require("axios");

// Validation helper
const getValidationErrors = (req) => {
  try {
    const { validationResult } = require("express-validator");
    return validationResult(req);
  } catch (error) {
    return { isEmpty: () => true, array: () => [] };
  }
};

class WebhookController {
  
  // Create a new webhook endpoint
  static async createWebhook(req, res) {
    try {
      const errors = getValidationErrors(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ApiResponse(null, "Validation errors", false, 400, errors.array()));
      }

      const userId = req.user._id;
      const { name, url, events, method = 'POST', description, active = true, headers = {} } = req.body;

      // Validate required fields
      if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
        return res.status(400).json(ApiResponse(null, "Name, URL, and events are required", false, 400));
      }

      // Validate URL format
      try {
        new URL(url);
      } catch (error) {
        return res.status(400).json(ApiResponse(null, "Invalid URL format", false, 400));
      }

      // Get or create user settings
      let settings = await Settings.findOne({ userId });
      if (!settings) {
        const defaultSettings = Settings.getDefaultSettings(userId);
        settings = new Settings(defaultSettings);
      }

      // Generate a unique ID and secret for the webhook
      const webhookId = new mongoose.Types.ObjectId().toString();
      const secret = crypto.randomBytes(32).toString('hex');

      // Create the new webhook endpoint
      const newWebhook = {
        _id: webhookId,
        name: name.trim(),
        url: url.trim(),
        events: events,
        method: method.toUpperCase(),
        description: description?.trim() || '',
        active: active,
        secret: secret,
        headers: headers || {},
        createdAt: new Date(),
        lastTriggered: null,
        status: 'pending',
        triggerCount: 0,
        lastError: null,
        successCount: 0,
        failureCount: 0
      };

      // Add to settings
      if (!settings.webhooks) {
        settings.webhooks = {
          enabled: false,
          endpoints: [],
          retryAttempts: 3,
          timeoutSeconds: 30
        };
      }

      settings.webhooks.endpoints.push(newWebhook);
      settings.lastUpdated = new Date();
      settings.updatedBy = req.user.email || "user";

      await settings.save();

      res.status(201).json(ApiResponse(newWebhook, "Webhook created successfully", true, 201));

    } catch (error) {
      console.error("Error creating webhook:", error);
      res.status(500).json(ApiResponse(null, "Internal server error", false, 500, error.message));
    }
  }

  // Get all webhook endpoints for a user
  static async getWebhooks(req, res) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10, status, active } = req.query;

      const settings = await Settings.findOne({ userId });
      
      if (!settings || !settings.webhooks || !settings.webhooks.endpoints) {
        return res.status(200).json(ApiResponse({
          webhooks: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }, "No webhooks found", true, 200));
      }

      let webhooks = [...settings.webhooks.endpoints];

      // Apply filters
      if (status) {
        webhooks = webhooks.filter(webhook => webhook.status === status);
      }
      
      if (active !== undefined) {
        const isActive = active === 'true';
        webhooks = webhooks.filter(webhook => webhook.active === isActive);
      }

      // Pagination
      const total = webhooks.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedWebhooks = webhooks.slice(startIndex, startIndex + limit);

      res.status(200).json(ApiResponse({
        webhooks: paginatedWebhooks,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }, "Webhooks retrieved successfully", true, 200));

    } catch (error) {
      console.error("Error fetching webhooks:", error);
      res.status(500).json(ApiResponse(null, "Internal server error", false, 500, error.message));
    }
  }

  // Get a specific webhook endpoint
  static async getWebhookById(req, res) {
    try {
      const userId = req.user._id;
      const { webhookId } = req.params;

      const settings = await Settings.findOne({ userId });
      
      if (!settings || !settings.webhooks || !settings.webhooks.endpoints) {
        return res.status(404).json(ApiResponse(null, "Webhook not found", false, 404));
      }

      const webhook = settings.webhooks.endpoints.find(w => w._id.toString() === webhookId);
      
      if (!webhook) {
        return res.status(404).json(ApiResponse(null, "Webhook not found", false, 404));
      }

      res.status(200).json(ApiResponse(webhook, "Webhook retrieved successfully", true, 200));

    } catch (error) {
      console.error("Error fetching webhook:", error);
      res.status(500).json(ApiResponse(null, "Internal server error", false, 500, error.message));
    }
  }

  // Update a webhook endpoint
  static async updateWebhook(req, res) {
    try {
      const errors = getValidationErrors(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ApiResponse(null, "Validation errors", false, 400, errors.array()));
      }

      const userId = req.user._id;
      const { webhookId } = req.params;
      const updateData = req.body;

      const settings = await Settings.findOne({ userId });
      
      if (!settings || !settings.webhooks || !settings.webhooks.endpoints) {
        return res.status(404).json(ApiResponse(null, "Webhook not found", false, 404));
      }

      const webhookIndex = settings.webhooks.endpoints.findIndex(w => w._id.toString() === webhookId);
      
      if (webhookIndex === -1) {
        return res.status(404).json(ApiResponse(null, "Webhook not found", false, 404));
      }

      const webhook = settings.webhooks.endpoints[webhookIndex];

      // Validate URL if provided
      if (updateData.url) {
        try {
          new URL(updateData.url);
        } catch (error) {
          return res.status(400).json(ApiResponse(null, "Invalid URL format", false, 400));
        }
      }

      // Update webhook fields
      if (updateData.name) webhook.name = updateData.name.trim();
      if (updateData.url) webhook.url = updateData.url.trim();
      if (updateData.events && Array.isArray(updateData.events)) webhook.events = updateData.events;
      if (updateData.method) webhook.method = updateData.method.toUpperCase();
      if (updateData.description !== undefined) webhook.description = updateData.description.trim();
      if (updateData.active !== undefined) webhook.active = updateData.active;
      if (updateData.headers) webhook.headers = updateData.headers;

      webhook.updatedAt = new Date();
      settings.lastUpdated = new Date();
      settings.updatedBy = req.user.email || "user";

      await settings.save();

      res.status(200).json(ApiResponse(webhook, "Webhook updated successfully", true, 200));

    } catch (error) {
      console.error("Error updating webhook:", error);
      res.status(500).json(ApiResponse(null, "Internal server error", false, 500, error.message));
    }
  }

  // Delete a webhook endpoint
  static async deleteWebhook(req, res) {
    try {
      const userId = req.user._id;
      const { webhookId } = req.params;

      const settings = await Settings.findOne({ userId });
      
      if (!settings || !settings.webhooks || !settings.webhooks.endpoints) {
        return res.status(404).json(ApiResponse(null, "Webhook not found", false, 404));
      }

      const webhookIndex = settings.webhooks.endpoints.findIndex(w => w._id.toString() === webhookId);
      
      if (webhookIndex === -1) {
        return res.status(404).json(ApiResponse(null, "Webhook not found", false, 404));
      }

      // Remove the webhook
      settings.webhooks.endpoints.splice(webhookIndex, 1);
      settings.lastUpdated = new Date();
      settings.updatedBy = req.user.email || "user";

      await settings.save();

      res.status(200).json(ApiResponse({ webhookId }, "Webhook deleted successfully", true, 200));

    } catch (error) {
      console.error("Error deleting webhook:", error);
      res.status(500).json(ApiResponse(null, "Internal server error", false, 500, error.message));
    }
  }

  // Toggle webhook active status
  static async toggleWebhook(req, res) {
    try {
      const userId = req.user._id;
      const { webhookId } = req.params;

      const settings = await Settings.findOne({ userId });
      
      if (!settings || !settings.webhooks || !settings.webhooks.endpoints) {
        return res.status(404).json(ApiResponse(null, "Webhook not found", false, 404));
      }

      const webhook = settings.webhooks.endpoints.find(w => w._id.toString() === webhookId);
      
      if (!webhook) {
        return res.status(404).json(ApiResponse(null, "Webhook not found", false, 404));
      }

      webhook.active = !webhook.active;
      webhook.updatedAt = new Date();
      settings.lastUpdated = new Date();
      settings.updatedBy = req.user.email || "user";

      await settings.save();

      res.status(200).json(ApiResponse(webhook, `Webhook ${webhook.active ? 'activated' : 'deactivated'} successfully`, true, 200));

    } catch (error) {
      console.error("Error toggling webhook:", error);
      res.status(500).json(ApiResponse(null, "Internal server error", false, 500, error.message));
    }
  }

  // Test a webhook endpoint
  static async testWebhook(req, res) {
    try {
      const userId = req.user._id;
      const { webhookId } = req.params;
      const { testData = {} } = req.body;

      const settings = await Settings.findOne({ userId });
      
      if (!settings || !settings.webhooks || !settings.webhooks.endpoints) {
        return res.status(404).json(ApiResponse(null, "Webhook not found", false, 404));
      }

      const webhook = settings.webhooks.endpoints.find(w => w._id.toString() === webhookId);
      
      if (!webhook) {
        return res.status(404).json(ApiResponse(null, "Webhook not found", false, 404));
      }

      if (!webhook.active) {
        return res.status(400).json(ApiResponse(null, "Cannot test inactive webhook", false, 400));
      }

      // Prepare test payload
      const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        webhook_id: webhookId,
        test: true,
        data: testData,
        user_id: userId.toString()
      };

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Yoraa-Webhook-Test/1.0',
        ...webhook.headers
      };

      // Add signature if webhook has a secret
      if (webhook.secret) {
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(testPayload))
          .digest('hex');
        headers['X-Yoraa-Signature'] = `sha256=${signature}`;
      }

      const startTime = Date.now();
      let testResult;

      try {
        // Make the webhook call
        const response = await axios({
          method: webhook.method,
          url: webhook.url,
          data: testPayload,
          headers: headers,
          timeout: (settings.webhooks.timeoutSeconds || 30) * 1000,
        });

        const duration = Date.now() - startTime;

        testResult = {
          success: true,
          status_code: response.status,
          response_headers: response.headers,
          response_data: response.data,
          duration,
          timestamp: new Date().toISOString(),
          error: null
        };

        // Update webhook status
        const webhookToUpdate = settings.webhooks.endpoints.find(w => w._id.toString() === webhookId);
        webhookToUpdate.status = 'healthy';
        webhookToUpdate.lastTriggered = new Date();
        webhookToUpdate.successCount = (webhookToUpdate.successCount || 0) + 1;
        webhookToUpdate.triggerCount = (webhookToUpdate.triggerCount || 0) + 1;

      } catch (error) {
        const duration = Date.now() - startTime;

        testResult = {
          success: false,
          status_code: error.response?.status || 0,
          response_headers: error.response?.headers || {},
          response_data: error.response?.data || null,
          duration,
          timestamp: new Date().toISOString(),
          error: {
            message: error.message,
            code: error.code,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          }
        };

        // Update webhook status
        const webhookToUpdate = settings.webhooks.endpoints.find(w => w._id.toString() === webhookId);
        webhookToUpdate.status = 'error';
        webhookToUpdate.lastTriggered = new Date();
        webhookToUpdate.lastError = error.message;
        webhookToUpdate.failureCount = (webhookToUpdate.failureCount || 0) + 1;
        webhookToUpdate.triggerCount = (webhookToUpdate.triggerCount || 0) + 1;
      }

      await settings.save();

      res.status(200).json(ApiResponse(testResult, "Webhook test completed", true, 200));

    } catch (error) {
      console.error("Error testing webhook:", error);
      res.status(500).json(ApiResponse(null, "Internal server error", false, 500, error.message));
    }
  }

  // Get webhook logs (mock implementation - in real app, you'd have a separate logs collection)
  static async getWebhookLogs(req, res) {
    try {
      const userId = req.user._id;
      const { webhookId } = req.params;
      const { page = 1, limit = 20, status } = req.query;

      const settings = await Settings.findOne({ userId });
      
      if (!settings || !settings.webhooks || !settings.webhooks.endpoints) {
        return res.status(404).json(ApiResponse(null, "Webhook not found", false, 404));
      }

      const webhook = settings.webhooks.endpoints.find(w => w._id.toString() === webhookId);
      
      if (!webhook) {
        return res.status(404).json(ApiResponse(null, "Webhook not found", false, 404));
      }

      // Mock logs - in a real implementation, you'd query a logs collection
      const mockLogs = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          event: 'order.created',
          status: 'success',
          response_code: 200,
          duration: 245,
          payload_size: 1024
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          event: 'payment.success',
          status: 'success',
          response_code: 200,
          duration: 189,
          payload_size: 512
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          event: 'inventory.low',
          status: 'failed',
          response_code: 404,
          duration: 5000,
          payload_size: 256
        }
      ];

      // Apply status filter if provided
      let filteredLogs = mockLogs;
      if (status) {
        filteredLogs = mockLogs.filter(log => log.status === status);
      }

      // Pagination
      const total = filteredLogs.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedLogs = filteredLogs.slice(startIndex, startIndex + limit);

      res.status(200).json(ApiResponse({
        logs: paginatedLogs,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        webhook: {
          id: webhookId,
          name: webhook.name,
          url: webhook.url
        }
      }, "Webhook logs retrieved successfully", true, 200));

    } catch (error) {
      console.error("Error fetching webhook logs:", error);
      res.status(500).json(ApiResponse(null, "Internal server error", false, 500, error.message));
    }
  }

  // Get webhook statistics
  static async getWebhookStats(req, res) {
    try {
      const userId = req.user._id;
      const { webhookId } = req.params;

      const settings = await Settings.findOne({ userId });
      
      if (!settings || !settings.webhooks || !settings.webhooks.endpoints) {
        return res.status(404).json(ApiResponse(null, "Webhook not found", false, 404));
      }

      const webhook = settings.webhooks.endpoints.find(w => w._id.toString() === webhookId);
      
      if (!webhook) {
        return res.status(404).json(ApiResponse(null, "Webhook not found", false, 404));
      }

      const stats = {
        total_triggers: webhook.triggerCount || 0,
        successful_triggers: webhook.successCount || 0,
        failed_triggers: webhook.failureCount || 0,
        success_rate: webhook.triggerCount > 0 ? 
          ((webhook.successCount || 0) / webhook.triggerCount * 100).toFixed(2) : 0,
        last_triggered: webhook.lastTriggered,
        current_status: webhook.status || 'pending',
        active: webhook.active,
        created_at: webhook.createdAt,
        updated_at: webhook.updatedAt
      };

      res.status(200).json(ApiResponse(stats, "Webhook statistics retrieved successfully", true, 200));

    } catch (error) {
      console.error("Error fetching webhook stats:", error);
      res.status(500).json(ApiResponse(null, "Internal server error", false, 500, error.message));
    }
  }
}

module.exports = WebhookController;
