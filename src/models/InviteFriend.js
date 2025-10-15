const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define InviteFriend Schema
const inviteFriendSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
    max: 100 // For percentage, max 100%; for fixed, can be any reasonable amount
  },
  maxRedemptions: {
    type: Number,
    default: 100,
    min: 1
  },
  redemptionCount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active',
    index: true
  },
  expiryDate: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  redeemedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    redeemedAt: {
      type: Date,
      default: Date.now
    }
  }],
  terms: {
    type: String,
    default: ''
  },
  minOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
inviteFriendSchema.index({ code: 1, status: 1 });
inviteFriendSchema.index({ createdAt: -1 });
inviteFriendSchema.index({ expiryDate: 1 });
inviteFriendSchema.index({ 'redeemedBy.userId': 1 });

// Virtual to check if code is expired
inviteFriendSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Virtual to check if code is available for redemption
inviteFriendSchema.virtual('isAvailable').get(function() {
  return this.status === 'active' && 
         !this.isExpired && 
         this.redemptionCount < this.maxRedemptions;
});

// Virtual to get remaining redemptions
inviteFriendSchema.virtual('remainingRedemptions').get(function() {
  return Math.max(0, this.maxRedemptions - this.redemptionCount);
});

// Pre-save middleware to update status based on expiry
inviteFriendSchema.pre('save', function(next) {
  // Auto-expire codes if expiry date has passed
  if (this.expiryDate && new Date() > this.expiryDate && this.status === 'active') {
    this.status = 'expired';
  }
  
  // Auto-deactivate if max redemptions reached
  if (this.redemptionCount >= this.maxRedemptions && this.status === 'active') {
    this.status = 'inactive';
  }
  
  next();
});

// Static method to find available codes
inviteFriendSchema.statics.findAvailableCodes = function() {
  return this.find({
    status: 'active',
    $or: [
      { expiryDate: null },
      { expiryDate: { $gt: new Date() } }
    ],
    $expr: { $lt: ['$redemptionCount', '$maxRedemptions'] }
  });
};

// Static method to validate and get code for redemption
inviteFriendSchema.statics.validateCodeForRedemption = async function(code, userId) {
  const inviteCode = await this.findOne({ code: code.toUpperCase() });
  
  if (!inviteCode) {
    throw new Error('Invalid invite code');
  }
  
  if (inviteCode.status !== 'active') {
    throw new Error('Invite code is not active');
  }
  
  if (inviteCode.expiryDate && new Date() > inviteCode.expiryDate) {
    throw new Error('Invite code has expired');
  }
  
  if (inviteCode.redemptionCount >= inviteCode.maxRedemptions) {
    throw new Error('Invite code has reached maximum redemption limit');
  }
  
  // Check if user already redeemed this code
  const alreadyRedeemed = inviteCode.redeemedBy.some(
    redemption => redemption.userId.toString() === userId.toString()
  );
  
  if (alreadyRedeemed) {
    throw new Error('You have already redeemed this invite code');
  }
  
  return inviteCode;
};

// Instance method to redeem code
inviteFriendSchema.methods.redeemCode = function(userId) {
  this.redeemedBy.push({
    userId: userId,
    redeemedAt: new Date()
  });
  this.redemptionCount += 1;
  this.updatedAt = new Date();
  
  return this.save();
};

// Instance method to check if user has redeemed this code
inviteFriendSchema.methods.hasUserRedeemed = function(userId) {
  return this.redeemedBy.some(
    redemption => redemption.userId.toString() === userId.toString()
  );
};

// Static method to get user's redeemed codes
inviteFriendSchema.statics.getUserRedeemedCodes = function(userId) {
  return this.find({
    'redeemedBy.userId': userId
  }).select('code description discountType discountValue redeemedBy.$');
};

const InviteFriend = mongoose.model("InviteFriend", inviteFriendSchema);

module.exports = InviteFriend;
