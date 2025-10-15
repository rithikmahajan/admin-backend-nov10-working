const Settings = require("../../models/Settings");
const User = require("../../models/User");

// Validation helper - safe validation result check
const getValidationErrors = (req) => {
  try {
    const { validationResult } = require("express-validator");
    return validationResult(req);
  } catch (error) {
    // If express-validator is not available, return empty errors
    return { isEmpty: () => true, array: () => [] };
  }
};

class SettingsController {
  
  // Get user settings
  static async getUserSettings(req, res) {
    try {
      console.log("Getting user settings for user:", req.user);
      
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated"
        });
      }

      const userId = req.user._id;

      let settings = await Settings.findOne({ userId });
      
      if (!settings) {
        // Create default settings if none exist
        const defaultSettings = Settings.getDefaultSettings(userId);
        settings = new Settings(defaultSettings);
        await settings.save();
      }
      
      res.status(200).json({
        success: true,
        message: "Settings retrieved successfully",
        data: settings,
        summary: settings.settingsSummary
      });
      
    } catch (error) {
      console.error("Error retrieving user settings:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving user settings",
        error: error.message
      });
    }
  }

  // Update user settings (full update)
  static async updateUserSettings(req, res) {
    try {
      const errors = getValidationErrors(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array()
        });
      }

      const userId = req.user._id;
      const updateData = {
        ...req.body,
        lastUpdated: new Date(),
        updatedBy: req.user.email || "user"
      };

      let settings = await Settings.findOne({ userId });
      
      if (!settings) {
        // Create new settings if none exist
        settings = new Settings({ userId, ...updateData });
      } else {
        // Update existing settings
        Object.assign(settings, updateData);
      }

      await settings.save();
      
      res.status(200).json({
        success: true,
        message: "Settings updated successfully",
        data: settings,
        summary: settings.settingsSummary
      });
      
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({
        success: false,
        message: "Error updating settings",
        error: error.message
      });
    }
  }

  // Update specific setting category
  static async updateSettingCategory(req, res) {
    try {
      const errors = getValidationErrors(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array()
        });
      }

      const userId = req.user._id;
      const { category } = req.params;
      const updateData = req.body;

      const validCategories = [
        'communicationPreferences', 'profileVisibility', 'locationData',
        'autoInvoice', 'huggingFaceApi', 'onlineDiscounts', 'shippingCharges',
        'hsnCodes', 'userLimits', 'languageRegion', 'dynamicPricing',
        'autoNotifications', 'webhooks'
      ];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid setting category"
        });
      }

      let settings = await Settings.findOne({ userId });
      
      if (!settings) {
        const defaultSettings = Settings.getDefaultSettings(userId);
        settings = new Settings(defaultSettings);
      }

      // Update specific category
      settings[category] = { ...settings[category], ...updateData };
      settings.lastUpdated = new Date();
      settings.updatedBy = req.user.email || "user";

      await settings.save();
      
      res.status(200).json({
        success: true,
        message: `${category} updated successfully`,
        data: {
          category,
          settings: settings[category],
          summary: settings.settingsSummary
        }
      });
      
    } catch (error) {
      console.error(`Error updating ${req.params.category}:`, error);
      res.status(500).json({
        success: false,
        message: "Error updating setting category",
        error: error.message
      });
    }
  }

  // Get specific setting category
  static async getSettingCategory(req, res) {
    try {
      // Check if user is authenticated
      if (!req.user) {
        console.error("No user found in request. Authentication middleware may have failed.");
        return res.status(401).json({
          success: false,
          message: "User not authenticated"
        });
      }

      const userId = req.user._id;
      const { category } = req.params;

      console.log("Getting setting category:", category, "for user:", userId);

      const validCategories = [
        'communicationPreferences', 'profileVisibility', 'locationData',
        'autoInvoice', 'huggingFaceApi', 'onlineDiscounts', 'shippingCharges',
        'hsnCodes', 'userLimits', 'languageRegion', 'dynamicPricing',
        'autoNotifications', 'webhooks'
      ];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid setting category"
        });
      }

      let settings = await Settings.findOne({ userId });
      
      if (!settings) {
        console.log("No settings found for user, creating default settings");
        const defaultSettings = Settings.getDefaultSettings(userId);
        settings = new Settings(defaultSettings);
        await settings.save();
        console.log("Default settings created successfully");
      }
      
      const categoryData = settings[category];
      console.log(`Retrieved ${category} settings:`, categoryData);
      
      res.status(200).json({
        success: true,
        message: `${category} retrieved successfully`,
        data: categoryData
      });
      
    } catch (error) {
      console.error(`Error getting ${req.params.category}:`, error.message);
      console.error("Stack trace:", error.stack);
      res.status(500).json({
        success: false,
        message: "Error retrieving setting category",
        error: error.message
      });
    }
  }

  // Toggle specific setting
  static async toggleSetting(req, res) {
    try {
      const userId = req.user._id;
      const { category, setting } = req.params;

      let settings = await Settings.findOne({ userId });
      
      if (!settings) {
        const defaultSettings = Settings.getDefaultSettings(userId);
        settings = new Settings(defaultSettings);
      }

      if (!settings[category]) {
        return res.status(400).json({
          success: false,
          message: "Invalid setting category"
        });
      }

      if (settings[category][setting] === undefined) {
        return res.status(400).json({
          success: false,
          message: "Invalid setting name"
        });
      }

      // Toggle the setting
      settings[category][setting] = !settings[category][setting];
      settings.lastUpdated = new Date();
      settings.updatedBy = req.user.email || "user";

      await settings.save();
      
      res.status(200).json({
        success: true,
        message: `${setting} toggled successfully`,
        data: {
          category,
          setting,
          newValue: settings[category][setting],
          categorySettings: settings[category]
        }
      });
      
    } catch (error) {
      console.error(`Error toggling ${req.params.setting}:`, error);
      res.status(500).json({
        success: false,
        message: "Error toggling setting",
        error: error.message
      });
    }
  }

  // Reset settings to default
  static async resetSettings(req, res) {
    try {
      const userId = req.user._id;
      const { category } = req.body;

      let settings = await Settings.findOne({ userId });
      
      if (!settings) {
        const defaultSettings = Settings.getDefaultSettings(userId);
        settings = new Settings(defaultSettings);
        await settings.save();
        
        return res.status(200).json({
          success: true,
          message: "Settings reset to default",
          data: settings
        });
      }

      if (category) {
        // Reset specific category
        const defaultSettings = Settings.getDefaultSettings(userId);
        settings[category] = defaultSettings[category];
      } else {
        // Reset all settings
        const defaultSettings = Settings.getDefaultSettings(userId);
        Object.assign(settings, defaultSettings);
      }

      settings.lastUpdated = new Date();
      settings.updatedBy = req.user.email || "user";
      await settings.save();
      
      res.status(200).json({
        success: true,
        message: category ? `${category} reset to default` : "All settings reset to default",
        data: category ? { [category]: settings[category] } : settings
      });
      
    } catch (error) {
      console.error("Error resetting settings:", error);
      res.status(500).json({
        success: false,
        message: "Error resetting settings",
        error: error.message
      });
    }
  }

  // Get settings history/audit log
  static async getSettingsHistory(req, res) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10 } = req.query;

      const settings = await Settings.findOne({ userId })
        .select('version lastUpdated updatedBy createdAt updatedAt')
        .lean();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Settings not found"
        });
      }

      // In a real application, you might want to maintain a separate audit log
      const history = {
        currentVersion: settings.version,
        lastUpdated: settings.lastUpdated,
        updatedBy: settings.updatedBy,
        created: settings.createdAt,
        modified: settings.updatedAt
      };

      res.status(200).json({
        success: true,
        message: "Settings history retrieved successfully",
        data: history
      });
      
    } catch (error) {
      console.error("Error getting settings history:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving settings history",
        error: error.message
      });
    }
  }

  // Export user settings
  static async exportSettings(req, res) {
    try {
      const userId = req.user._id;
      
      const settings = await Settings.findOne({ userId })
        .populate('userId', 'name email')
        .lean();
      
      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Settings not found"
        });
      }

      // Remove sensitive data for export
      const exportData = {
        ...settings,
        exportedAt: new Date(),
        exportedBy: req.user.email || "user"
      };
      
      // Remove sensitive fields
      if (exportData.huggingFaceApi) {
        delete exportData.huggingFaceApi.apiKey;
      }
      
      if (exportData.webhooks && exportData.webhooks.endpoints) {
        exportData.webhooks.endpoints.forEach(endpoint => {
          if (endpoint.secret) delete endpoint.secret;
        });
      }

      res.status(200).json({
        success: true,
        message: "Settings exported successfully",
        data: exportData
      });
      
    } catch (error) {
      console.error("Error exporting settings:", error);
      res.status(500).json({
        success: false,
        message: "Error exporting settings",
        error: error.message
      });
    }
  }

  // Bulk update settings
  static async bulkUpdateSettings(req, res) {
    try {
      const errors = getValidationErrors(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array()
        });
      }

      const userId = req.user._id;
      const { updates } = req.body; // Array of { category, settings } objects

      if (!Array.isArray(updates)) {
        return res.status(400).json({
          success: false,
          message: "Updates must be an array"
        });
      }

      let settings = await Settings.findOne({ userId });
      
      if (!settings) {
        const defaultSettings = Settings.getDefaultSettings(userId);
        settings = new Settings(defaultSettings);
      }

      // Apply all updates
      updates.forEach(update => {
        if (settings[update.category]) {
          settings[update.category] = { ...settings[update.category], ...update.settings };
        }
      });

      settings.lastUpdated = new Date();
      settings.updatedBy = req.user.email || "user";
      await settings.save();
      
      res.status(200).json({
        success: true,
        message: "Bulk settings update completed",
        data: settings,
        summary: settings.settingsSummary
      });
      
    } catch (error) {
      console.error("Error bulk updating settings:", error);
      res.status(500).json({
        success: false,
        message: "Error bulk updating settings",
        error: error.message
      });
    }
  }

  // Toggle specific setting with request body (for frontend integration)
  static async toggleSettingBody(req, res) {
    try {
      const userId = req.user._id;
      const { category, settingKey, value, requiresAuth, authData } = req.body;

      // If authentication is required, validate auth data
      if (requiresAuth && authData) {
        // Validate 2FA data (verificationCode, emailPassword, defaultPassword)
        if (!authData.verificationCode || !authData.emailPassword || !authData.defaultPassword) {
          return res.status(400).json({
            success: false,
            message: "Invalid authentication data. All fields are required."
          });
        }
        
        // Here you would normally validate the OTP and passwords
        // For now, we'll just check that they're provided
        console.log('2FA Authentication data received:', {
          hasVerificationCode: !!authData.verificationCode,
          hasEmailPassword: !!authData.emailPassword,
          hasDefaultPassword: !!authData.defaultPassword
        });
      }

      let settings = await Settings.findOne({ userId });
      
      if (!settings) {
        const defaultSettings = Settings.getDefaultSettings(userId);
        settings = new Settings(defaultSettings);
      }

      if (!settings[category]) {
        return res.status(400).json({
          success: false,
          message: "Invalid setting category"
        });
      }

      if (settings[category][settingKey] === undefined) {
        return res.status(400).json({
          success: false,
          message: "Invalid setting name"
        });
      }

      // Set the specific value (not toggle)
      settings[category][settingKey] = value;
      settings.lastUpdated = new Date();
      settings.updatedBy = req.user.email || "user";

      await settings.save();
      
      res.status(200).json({
        success: true,
        message: `${settingKey} updated successfully`,
        data: {
          category,
          settingKey,
          newValue: settings[category][settingKey],
          categorySettings: settings[category],
          lastUpdated: settings.lastUpdated
        }
      });
      
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({
        success: false,
        message: "Error updating setting",
        error: error.message
      });
    }
  }

  // Toggle specific setting with request body (for frontend integration)
  static async toggleSettingBody(req, res) {
    try {
      const userId = req.user._id;
      const { category, settingKey, value, requiresAuth, authData } = req.body;

      // If authentication is required, validate auth data
      if (requiresAuth && authData) {
        // Validate 2FA data (verificationCode, emailPassword, defaultPassword)
        if (!authData.verificationCode || !authData.emailPassword || !authData.defaultPassword) {
          return res.status(400).json({
            success: false,
            message: "Invalid authentication data. All fields are required."
          });
        }
        
        // Here you would normally validate the OTP and passwords
        // For now, we'll just check that they're provided
        console.log('2FA Authentication data received:', {
          hasVerificationCode: !!authData.verificationCode,
          hasEmailPassword: !!authData.emailPassword,
          hasDefaultPassword: !!authData.defaultPassword
        });
      }

      let settings = await Settings.findOne({ userId });
      
      if (!settings) {
        const defaultSettings = Settings.getDefaultSettings(userId);
        settings = new Settings(defaultSettings);
      }

      if (!settings[category]) {
        return res.status(400).json({
          success: false,
          message: "Invalid setting category"
        });
      }

      if (settings[category][settingKey] === undefined) {
        return res.status(400).json({
          success: false,
          message: "Invalid setting name"
        });
      }

      // Set the specific value (not toggle)
      settings[category][settingKey] = value;
      settings.lastUpdated = new Date();
      settings.updatedBy = req.user.email || "user";

      await settings.save();
      
      res.status(200).json({
        success: true,
        message: `${settingKey} updated successfully`,
        data: {
          category,
          settingKey,
          newValue: settings[category][settingKey],
          categorySettings: settings[category],
          lastUpdated: settings.lastUpdated
        }
      });
      
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({
        success: false,
        message: "Error updating setting",
        error: error.message
      });
    }
  }

  // ==============================
  // SHIPPING CHARGES METHODS
  // ==============================

  /**
   * Get all shipping charges for the authenticated user
   * @route GET /api/settings/shipping/charges
   */
  static async getShippingCharges(req, res) {
    try {
      const userId = req.user._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      let userSettings = await Settings.findOne({ userId });
      
      if (!userSettings) {
        const defaultSettings = Settings.getDefaultSettings(userId);
        userSettings = new Settings(defaultSettings);
        await userSettings.save();
      }

      // Ensure shipping_settings structure exists
      if (!userSettings.shipping_settings) {
        userSettings.shipping_settings = {
          charges: [],
          general_settings: {
            enabled: false,
            freeShippingThreshold: 500,
            expeditedShipping: true,
            internationalShipping: false,
            shippingInsurance: false,
            trackingUpdates: true,
          }
        };
        await userSettings.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Shipping charges retrieved successfully',
        data: {
          charges: userSettings.shipping_settings.charges || [],
          settings: userSettings.shipping_settings.general_settings || {}
        },
        debug: {
          chargesCount: userSettings.shipping_settings.charges?.length || 0,
          firstChargeId: userSettings.shipping_settings.charges?.[0]?._id || null
        }
      });
    } catch (error) {
      console.error('Error fetching shipping charges:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch shipping charges',
        error: error.message
      });
    }
  }

  /**
   * Create a new shipping charge
   * @route POST /api/settings/shipping/charges
   */
  static async createShippingCharge(req, res) {
    try {
      const userId = req.user._id;
      const { country, region, deliveryCharge, returnCharge, estimatedDays } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Validation
      if (!country || deliveryCharge === undefined || returnCharge === undefined || !estimatedDays) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: country, deliveryCharge, returnCharge, estimatedDays'
        });
      }

      if (deliveryCharge < 0 || returnCharge < 0 || estimatedDays < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid charge or delivery time values'
        });
      }

      let userSettings = await Settings.findOne({ userId });
      
      if (!userSettings) {
        const defaultSettings = Settings.getDefaultSettings(userId);
        userSettings = new Settings(defaultSettings);
      }

      if (!userSettings.shipping_settings) {
        userSettings.shipping_settings = {
          charges: [],
          general_settings: {
            enabled: false,
            freeShippingThreshold: 500,
            expeditedShipping: true,
            internationalShipping: false,
            shippingInsurance: false,
            trackingUpdates: true,
          }
        };
      }

      // Check for duplicate country-region combination
      const existingCharge = userSettings.shipping_settings.charges?.find(
        charge => charge.country === country && charge.region === (region || null)
      );

      if (existingCharge) {
        return res.status(409).json({
          success: false,
          message: 'Shipping charge for this country and region already exists'
        });
      }

      const newCharge = {
        country,
        region: region || null,
        deliveryCharge: parseFloat(deliveryCharge),
        returnCharge: parseFloat(returnCharge),
        estimatedDays: parseInt(estimatedDays),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (!userSettings.shipping_settings.charges) {
        userSettings.shipping_settings.charges = [];
      }

      userSettings.shipping_settings.charges.push(newCharge);
      userSettings.lastUpdated = new Date();
      userSettings.updatedBy = req.user.email || "user";
      await userSettings.save();

      // Get the saved charge with its _id
      const savedCharge = userSettings.shipping_settings.charges[userSettings.shipping_settings.charges.length - 1];

      return res.status(201).json({
        success: true,
        message: 'Shipping charge created successfully',
        data: {
          charge: savedCharge,
          totalCharges: userSettings.shipping_settings.charges.length
        }
      });
    } catch (error) {
      console.error('Error creating shipping charge:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create shipping charge',
        error: error.message
      });
    }
  }

  /**
   * Update an existing shipping charge
   * @route PUT /api/settings/shipping/charges/:chargeId
   */
  static async updateShippingCharge(req, res) {
    try {
      const userId = req.user._id;
      const { chargeId } = req.params;
      const { country, region, deliveryCharge, returnCharge, estimatedDays } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Validation
      if (!country || deliveryCharge === undefined || returnCharge === undefined || !estimatedDays) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: country, deliveryCharge, returnCharge, estimatedDays'
        });
      }

      if (deliveryCharge < 0 || returnCharge < 0 || estimatedDays < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid charge or delivery time values'
        });
      }

      const userSettings = await Settings.findOne({ userId });
      
      if (!userSettings || !userSettings.shipping_settings?.charges) {
        return res.status(404).json({
          success: false,
          message: 'Shipping charge not found'
        });
      }

      const chargeIndex = userSettings.shipping_settings.charges.findIndex(
        charge => charge._id.toString() === chargeId
      );

      if (chargeIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Shipping charge not found'
        });
      }

      // Check for duplicate country-region combination (excluding current charge)
      const duplicateCharge = userSettings.shipping_settings.charges.find(
        (charge, index) => 
          index !== chargeIndex && 
          charge.country === country && 
          charge.region === region
      );

      if (duplicateCharge) {
        return res.status(409).json({
          success: false,
          message: 'Shipping charge for this country and region already exists'
        });
      }

      // Update the charge - preserve the _id
      const existingCharge = userSettings.shipping_settings.charges[chargeIndex];
      existingCharge.country = country;
      existingCharge.region = region;
      existingCharge.deliveryCharge = parseFloat(deliveryCharge);
      existingCharge.returnCharge = parseFloat(returnCharge);
      existingCharge.estimatedDays = parseInt(estimatedDays);
      existingCharge.updatedAt = new Date();

      userSettings.lastUpdated = new Date();
      userSettings.updatedBy = req.user.email || "user";
      await userSettings.save();

      return res.status(200).json({
        success: true,
        message: 'Shipping charge updated successfully',
        data: {
          charge: userSettings.shipping_settings.charges[chargeIndex]
        }
      });
    } catch (error) {
      console.error('Error updating shipping charge:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update shipping charge',
        error: error.message
      });
    }
  }

  /**
   * Delete a shipping charge
   * @route DELETE /api/settings/shipping/charges/:chargeId
   */
  static async deleteShippingCharge(req, res) {
    try {
      const userId = req.user._id;
      const { chargeId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Validate chargeId parameter
      if (!chargeId || chargeId === 'undefined' || chargeId === 'null') {
        return res.status(400).json({
          success: false,
          message: 'Invalid or missing shipping charge ID'
        });
      }

      const userSettings = await Settings.findOne({ userId });
      
      if (!userSettings || !userSettings.shipping_settings?.charges) {
        return res.status(404).json({
          success: false,
          message: 'Shipping charge not found'
        });
      }

      // Additional validation to ensure charges array exists and is not empty
      if (!Array.isArray(userSettings.shipping_settings.charges) || 
          userSettings.shipping_settings.charges.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No shipping charges found'
        });
      }

      const chargeIndex = userSettings.shipping_settings.charges.findIndex(
        charge => charge._id && charge._id.toString() === chargeId
      );

      if (chargeIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Shipping charge not found'
        });
      }

      const deletedCharge = userSettings.shipping_settings.charges[chargeIndex];
      userSettings.shipping_settings.charges.splice(chargeIndex, 1);
      userSettings.lastUpdated = new Date();
      userSettings.updatedBy = req.user.email || "user";
      await userSettings.save();

      return res.status(200).json({
        success: true,
        message: 'Shipping charge deleted successfully',
        data: {
          deletedCharge,
          totalCharges: userSettings.shipping_settings.charges.length
        }
      });
    } catch (error) {
      console.error('Error deleting shipping charge:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete shipping charge',
        error: error.message
      });
    }
  }

  /**
   * Update general shipping settings
   * @route PUT /api/settings/shipping/general
   */
  static async updateShippingSettings(req, res) {
    try {
      const userId = req.user._id;
      const { 
        enabled, 
        freeShippingThreshold, 
        expeditedShipping, 
        internationalShipping, 
        shippingInsurance, 
        trackingUpdates 
      } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      let userSettings = await Settings.findOne({ userId });
      
      if (!userSettings) {
        const defaultSettings = Settings.getDefaultSettings(userId);
        userSettings = new Settings(defaultSettings);
      }

      if (!userSettings.shipping_settings) {
        userSettings.shipping_settings = {
          charges: [],
          general_settings: {}
        };
      }

      // Update general settings
      userSettings.shipping_settings.general_settings = {
        enabled: enabled !== undefined ? enabled : userSettings.shipping_settings.general_settings?.enabled || false,
        freeShippingThreshold: freeShippingThreshold !== undefined ? parseFloat(freeShippingThreshold) : userSettings.shipping_settings.general_settings?.freeShippingThreshold || 500,
        expeditedShipping: expeditedShipping !== undefined ? expeditedShipping : userSettings.shipping_settings.general_settings?.expeditedShipping || true,
        internationalShipping: internationalShipping !== undefined ? internationalShipping : userSettings.shipping_settings.general_settings?.internationalShipping || false,
        shippingInsurance: shippingInsurance !== undefined ? shippingInsurance : userSettings.shipping_settings.general_settings?.shippingInsurance || false,
        trackingUpdates: trackingUpdates !== undefined ? trackingUpdates : userSettings.shipping_settings.general_settings?.trackingUpdates || true,
        updatedAt: new Date()
      };

      userSettings.lastUpdated = new Date();
      userSettings.updatedBy = req.user.email || "user";
      await userSettings.save();

      return res.status(200).json({
        success: true,
        message: 'Shipping settings updated successfully',
        data: {
          settings: userSettings.shipping_settings.general_settings
        }
      });
    } catch (error) {
      console.error('Error updating shipping settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update shipping settings',
        error: error.message
      });
    }
  }

  /**
   * Get shipping charge for a specific country and region
   * @route GET /api/settings/shipping/charges/lookup
   */
  static async getShippingChargeByLocation(req, res) {
    try {
      const userId = req.user._id;
      const { country, region } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (!country || !region) {
        return res.status(400).json({
          success: false,
          message: 'Country and region parameters are required'
        });
      }

      const userSettings = await Settings.findOne({ userId });
      
      if (!userSettings || !userSettings.shipping_settings?.charges) {
        return res.status(404).json({
          success: false,
          message: 'No shipping charges found'
        });
      }

      const charge = userSettings.shipping_settings.charges.find(
        c => c.country === country && c.region === region
      );

      if (!charge) {
        return res.status(404).json({
          success: false,
          message: 'Shipping charge not found for this location'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Shipping charge retrieved successfully',
        data: {
          charge
        }
      });
    } catch (error) {
      console.error('Error fetching shipping charge by location:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch shipping charge',
        error: error.message
      });
    }
  }
}

module.exports = SettingsController;
