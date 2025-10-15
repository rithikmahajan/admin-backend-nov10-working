const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define User Schema
const userSchema = new Schema({
  name: {
    type: String,
    required: false, // Optional name field
  },
  phNo: {
    type: String,
    unique: false, // Phone number doesn't have to be unique
    required: false,
    default: "1234567890", // Default phone number
  },
  password: {
    type: String,
    required: false, // Optional password (for flexibility with OTP or social logins)
  },
  isVerified: {
    type: Boolean,
    default: false, // General verification status
  },
  isPhoneVerified: {
    type: Boolean,
    default: false, // Whether phone number is verified
  },
  isEmailVerified: {
    type: Boolean,
    default: false, // Whether email is verified
  },
  isAdmin: {
    type: Boolean,
    default: false, // Admin flag for backend access or special permissions
  },
  isProfile: {
    type: Boolean,
    default: false, // Whether the user has completed their profile
  },
  email: {
    type: String,
    required: false,
    unique: false, // Email doesn't have to be unique
    default: "demo@example.com", // Default email
  },
  firebaseUid: {
    type: String,
    required: false, // UID from Firebase Auth if used
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  fcmToken: {
    type: String,
    unique: false, // FCM token for push notifications
  },
  platform: {
    type: String,
    enum: ["android", "ios"],
    default: null, // Platform type (for push or analytics)
  },
  emailVerificationToken: {
    type: String,
    required: false, // Token for verifying email
  },
  emailVerificationExpires: {
    type: Date,
    required: false, // Expiration time for email verification token
  },
  authProvider: {
    type: String,
    enum: ["email", "google", "apple", "facebook", "firebase"],
    default: "email"
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  lastLogoutAt: {
    type: Date,
    default: null
  },
  // Location preference fields for currency conversion
  preferredCountry: {
    type: String,
    enum: ["IN", "US", "GB", "CA", "AU"],
    default: "IN"
  },
  preferredCurrency: {
    type: String,
    enum: ["INR", "USD"],
    default: "INR"
  },
  locationUpdatedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Add index for faster Firebase UID lookups
userSchema.index({ firebaseUid: 1 });
userSchema.index({ email: 1 });
userSchema.index({ phNo: 1 });

// Export the User model
module.exports = mongoose.model("User", userSchema);
