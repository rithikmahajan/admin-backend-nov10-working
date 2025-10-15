const mongoose = require('mongoose');

const shippingChargeSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  region: {
    type: String,
    trim: true,
    maxlength: 100,
    default: null
  },
  deliveryCharge: {
    type: Number,
    required: true,
    min: 0
  },
  returnCharge: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedDays: {
    type: Number,
    required: true,
    min: 1,
    max: 365
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique country-region combinations
shippingChargeSchema.index({ country: 1, region: 1 }, { unique: true });

// Index for faster queries
shippingChargeSchema.index({ country: 1 });
shippingChargeSchema.index({ isActive: 1 });

// Virtual for display name
shippingChargeSchema.virtual('displayName').get(function() {
  return this.region ? `${this.country} - ${this.region}` : this.country;
});

// Ensure virtual fields are serialized
shippingChargeSchema.set('toJSON', { virtuals: true });
shippingChargeSchema.set('toObject', { virtuals: true });

// Pre-save middleware to update updatedAt
shippingChargeSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Pre-update middleware to update updatedAt
shippingChargeSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function() {
  this.set({ updatedAt: new Date() });
});

// Static method to find by country and region
shippingChargeSchema.statics.findByLocation = function(country, region = null) {
  return this.findOne({ 
    country: country.trim(), 
    region: region ? region.trim() : null,
    isActive: true 
  });
};

// Instance method to calculate total shipping cost
shippingChargeSchema.methods.getTotalShippingCost = function(includeReturn = false) {
  return includeReturn ? this.deliveryCharge + this.returnCharge : this.deliveryCharge;
};

const ShippingCharge = mongoose.model('ShippingCharge', shippingChargeSchema);

module.exports = ShippingCharge;
