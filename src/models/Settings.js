const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Communication Preferences
    communicationPreferences: {
      enabled: { type: Boolean, default: false },
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
      orderUpdates: { type: Boolean, default: true },
      promotionalOffers: { type: Boolean, default: false },
    },

    // Profile Visibility
    profileVisibility: {
      enabled: { type: Boolean, default: false },
      publicProfile: { type: Boolean, default: false },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      showAddress: { type: Boolean, default: false },
      showOrderHistory: { type: Boolean, default: false },
      showWishlist: { type: Boolean, default: false },
    },

    // Location Data
    locationData: {
      enabled: { type: Boolean, default: false },
      trackLocation: { type: Boolean, default: false },
      shareWithPartners: { type: Boolean, default: false },
      locationAccuracy: { type: String, enum: ["high", "medium", "low"], default: "medium" },
      storeLocationHistory: { type: Boolean, default: false },
    },

    // Auto Invoice Mailing
    autoInvoice: {
      enabled: { type: Boolean, default: false },
      autoSend: { type: Boolean, default: true },
      includePaymentDetails: { type: Boolean, default: true },
      sendCopy: { type: Boolean, default: false },
      emailTemplate: { type: String, default: "default" },
    },

    // Hugging Face API
    huggingFaceApi: {
      enabled: { type: Boolean, default: false },
      apiKey: { type: String, default: "" },
      modelPreference: { type: String, default: "general" },
      dataSharing: { type: Boolean, default: false },
      autoOptimization: { type: Boolean, default: true },
    },

    // Online Discounts
    onlineDiscounts: {
      enabled: { type: Boolean, default: false },
      autoApplyBest: { type: Boolean, default: true },
      stackDiscounts: { type: Boolean, default: false },
      memberDiscounts: { type: Boolean, default: true },
      seasonalDiscounts: { type: Boolean, default: true },
      maxDiscountPercent: { type: Number, default: 50, min: 0, max: 100 },
    },

    // Shipping Charges
    shippingCharges: {
      enabled: { type: Boolean, default: false },
      freeShippingThreshold: { type: Number, default: 500 },
      expeditedShipping: { type: Boolean, default: true },
      internationalShipping: { type: Boolean, default: false },
      shippingInsurance: { type: Boolean, default: false },
      trackingUpdates: { type: Boolean, default: true },
    },

    // HSN Codes
    hsnCodes: {
      enabled: { type: Boolean, default: false },
      autoAssign: { type: Boolean, default: true },
      validateCodes: { type: Boolean, default: true },
      updateNotifications: { type: Boolean, default: false },
      defaultHsnCode: { type: String, default: "" },
    },

    // User Limits
    userLimits: {
      enabled: { type: Boolean, default: false },
      maxOrdersPerDay: { type: Number, default: 10 },
      maxCartItems: { type: Number, default: 100 },
      maxWishlistItems: { type: Number, default: 50 },
      sessionTimeout: { type: Number, default: 30 }, // minutes
    },

    // Language & Region
    languageRegion: {
      enabled: { type: Boolean, default: false },
      language: { type: String, default: "en" },
      region: { type: String, default: "US" },
      currency: { type: String, default: "USD" },
      dateFormat: { type: String, default: "MM/DD/YYYY" },
      timezone: { type: String, default: "UTC" },
    },

    // Dynamic Pricing
    dynamicPricing: {
      enabled: { type: Boolean, default: false },
      priceUpdateFrequency: { type: String, enum: ["hourly", "daily", "weekly"], default: "daily" },
      maxPriceIncrease: { type: Number, default: 50, min: 0, max: 100 },
      maxPriceDecrease: { type: Number, default: 30, min: 0, max: 100 },
      considerDemand: { type: Boolean, default: true },
      considerInventory: { type: Boolean, default: true },
      considerCompetitor: { type: Boolean, default: false },
    },

    // Auto Notifications
    autoNotifications: {
      enabled: { type: Boolean, default: false },
      orderConfirmation: { type: Boolean, default: true },
      shipmentUpdates: { type: Boolean, default: true },
      deliveryConfirmation: { type: Boolean, default: true },
      paymentReminders: { type: Boolean, default: true },
      stockAlerts: { type: Boolean, default: false },
      priceDropAlerts: { type: Boolean, default: false },
    },

    // Webhooks
    webhooks: {
      enabled: { type: Boolean, default: false },
      endpoints: [{
        _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        name: { type: String, required: true },
        url: { type: String, required: true },
        events: { type: [String], required: true },
        method: { type: String, enum: ['POST', 'PUT', 'PATCH'], default: 'POST' },
        active: { type: Boolean, default: true },
        secret: { type: String, required: true },
        description: { type: String, default: '' },
        headers: { type: Map, of: String, default: {} },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        lastTriggered: { type: Date, default: null },
        status: { type: String, enum: ['pending', 'healthy', 'error', 'disabled'], default: 'pending' },
        triggerCount: { type: Number, default: 0 },
        successCount: { type: Number, default: 0 },
        failureCount: { type: Number, default: 0 },
        lastError: { type: String, default: null },
      }],
      retryAttempts: { type: Number, default: 3, min: 1, max: 10 },
      timeoutSeconds: { type: Number, default: 30, min: 5, max: 120 },
      enableSigning: { type: Boolean, default: true },
      signingSecret: { type: String, default: '' },
      logWebhooks: { type: Boolean, default: true },
      enableRateLimiting: { type: Boolean, default: true },
      rateLimit: { type: Number, default: 100, min: 1, max: 1000 }, // requests per minute
    },

    // Shipping Settings with detailed charge management
    shipping_settings: {
      charges: [{
        country: { type: String, required: true },
        region: { type: String, required: true },
        deliveryCharge: { type: Number, required: true, min: 0 },
        returnCharge: { type: Number, required: true, min: 0 },
        estimatedDays: { type: Number, required: true, min: 1, max: 365 },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      }],
      general_settings: {
        enabled: { type: Boolean, default: false },
        freeShippingThreshold: { type: Number, default: 500, min: 0 },
        expeditedShipping: { type: Boolean, default: true },
        internationalShipping: { type: Boolean, default: false },
        shippingInsurance: { type: Boolean, default: false },
        trackingUpdates: { type: Boolean, default: true },
        updatedAt: { type: Date, default: Date.now },
      }
    },

    // Metadata
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: { type: String, default: "user" },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
settingsSchema.index({ userId: 1 });
settingsSchema.index({ userId: 1, lastUpdated: -1 });

// Virtual for settings summary
settingsSchema.virtual("settingsSummary").get(function () {
  const enabledSettings = [];
  
  if (this.communicationPreferences.enabled) enabledSettings.push("Communication");
  if (this.profileVisibility.enabled) enabledSettings.push("Profile Visibility");
  if (this.locationData.enabled) enabledSettings.push("Location Data");
  if (this.autoInvoice.enabled) enabledSettings.push("Auto Invoice");
  if (this.huggingFaceApi.enabled) enabledSettings.push("Hugging Face API");
  if (this.onlineDiscounts.enabled) enabledSettings.push("Online Discounts");
  if (this.shippingCharges.enabled) enabledSettings.push("Shipping Charges");
  if (this.hsnCodes.enabled) enabledSettings.push("HSN Codes");
  if (this.userLimits.enabled) enabledSettings.push("User Limits");
  if (this.languageRegion.enabled) enabledSettings.push("Language & Region");
  if (this.dynamicPricing.enabled) enabledSettings.push("Dynamic Pricing");
  if (this.autoNotifications.enabled) enabledSettings.push("Auto Notifications");
  if (this.webhooks.enabled) enabledSettings.push("Webhooks");

  return {
    total: enabledSettings.length,
    enabled: enabledSettings,
  };
});

// Pre-save middleware to update version and lastUpdated
settingsSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
    this.lastUpdated = new Date();
  }
  next();
});

// Static method to get default settings
settingsSchema.statics.getDefaultSettings = function (userId) {
  return {
    userId,
    communicationPreferences: {
      enabled: false,
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
      orderUpdates: true,
      promotionalOffers: false,
    },
    profileVisibility: {
      enabled: false,
      publicProfile: false,
      showEmail: false,
      showPhone: false,
      showAddress: false,
      showOrderHistory: false,
      showWishlist: false,
    },
    locationData: {
      enabled: false,
      trackLocation: false,
      shareWithPartners: false,
      locationAccuracy: "medium",
      storeLocationHistory: false,
    },
    autoInvoice: {
      enabled: false,
      autoSend: true,
      includePaymentDetails: true,
      sendCopy: false,
      emailTemplate: "default",
    },
    huggingFaceApi: {
      enabled: false,
      apiKey: "",
      modelPreference: "general",
      dataSharing: false,
      autoOptimization: true,
    },
    onlineDiscounts: {
      enabled: false,
      autoApplyBest: true,
      stackDiscounts: false,
      memberDiscounts: true,
      seasonalDiscounts: true,
      maxDiscountPercent: 50,
    },
    shippingCharges: {
      enabled: false,
      freeShippingThreshold: 500,
      expeditedShipping: true,
      internationalShipping: false,
      shippingInsurance: false,
      trackingUpdates: true,
    },
    hsnCodes: {
      enabled: false,
      autoAssign: true,
      validateCodes: true,
      updateNotifications: false,
      defaultHsnCode: "",
    },
    userLimits: {
      enabled: false,
      maxOrdersPerDay: 10,
      maxCartItems: 100,
      maxWishlistItems: 50,
      sessionTimeout: 30,
    },
    languageRegion: {
      enabled: false,
      language: "en",
      region: "US",
      currency: "USD",
      dateFormat: "MM/DD/YYYY",
      timezone: "UTC",
    },
    dynamicPricing: {
      enabled: false,
      priceUpdateFrequency: "daily",
      maxPriceIncrease: 50,
      maxPriceDecrease: 30,
      considerDemand: true,
      considerInventory: true,
      considerCompetitor: false,
    },
    autoNotifications: {
      enabled: false,
      orderConfirmation: true,
      shipmentUpdates: true,
      deliveryConfirmation: true,
      paymentReminders: true,
      stockAlerts: false,
      priceDropAlerts: false,
    },
    webhooks: {
      enabled: false,
      endpoints: [],
      retryAttempts: 3,
      timeoutSeconds: 30,
      enableSigning: true,
      signingSecret: '',
      logWebhooks: true,
      enableRateLimiting: true,
      rateLimit: 100,
    },
  };
};

module.exports = mongoose.model("Settings", settingsSchema);
