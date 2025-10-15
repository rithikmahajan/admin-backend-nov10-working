const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * UserAuthMethod Schema
 * Stores multiple authentication methods for a single user
 * Allows linking Google, Apple, Facebook, Email/Password to one account
 */
const userAuthMethodSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  provider: {
    type: String,
    enum: ["email", "google", "apple", "facebook", "phone"],
    required: true
  },
  providerUserId: {
    type: String,
    required: true,
    // Combination of provider + providerUserId must be unique
    index: true
  },
  email: {
    type: String,
    required: false,
    index: true
  },
  phoneNumber: {
    type: String,
    required: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  linkedAt: {
    type: Date,
    default: Date.now
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one provider per user is unique
userAuthMethodSchema.index({ userId: 1, provider: 1 }, { unique: true });

// Compound index to ensure provider + providerUserId is globally unique
userAuthMethodSchema.index({ provider: 1, providerUserId: 1 }, { unique: true });

module.exports = mongoose.model("UserAuthMethod", userAuthMethodSchema);
