const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define Points System Configuration Schema
const pointsSystemConfigSchema = new Schema({
  isEnabled: {
    type: Boolean,
    default: true
  },
  pointsPerRupee: {
    type: Number,
    default: 1,
    min: 0
  },
  minimumRedemptionAmount: {
    type: Number,
    default: 100,
    min: 0
  },
  maximumRedemptionAmount: {
    type: Number,
    default: 10000,
    min: 0
  },
  pointsForActions: {
    signup: {
      type: Number,
      default: 100
    },
    referral: {
      type: Number,
      default: 500
    },
    review: {
      type: Number,
      default: 50
    },
    firstPurchase: {
      type: Number,
      default: 200
    }
  },
  expirationDays: {
    type: Number,
    default: 365,
    min: 0
  },
  adminSettings: {
    require2FA: {
      type: Boolean,
      default: true
    },
    defaultAllocationAmount: {
      type: Number,
      default: 100
    }
  }
}, {
  timestamps: true
});

// Ensure only one configuration document exists
pointsSystemConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  
  if (!config) {
    config = new this({});
    await config.save();
  }
  
  return config;
};

module.exports = mongoose.model("PointsSystemConfig", pointsSystemConfigSchema);
