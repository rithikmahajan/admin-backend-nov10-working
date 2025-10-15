const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed', 'free_shipping', 'bogo'],
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  minOrderValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxDiscountAmount: {
    type: Number,
    default: null, // null means no cap
    min: 0,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  maxUses: {
    type: Number,
    default: 0, // 0 means unlimited
    min: 0,
  },
  currentUses: {
    type: Number,
    default: 0,
    min: 0,
  },
  perUserLimit: {
    type: Number,
    default: 1,
    min: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isPublic: {
    type: Boolean,
    default: false, // true = available to all users
  },
  isPersonalized: {
    type: Boolean,
    default: false, // true = user-specific logic applies
  },
  targetUserSegment: {
    type: String,
    enum: ['all', 'new_users', 'returning_users', 'vip', 'inactive_users'],
    default: 'all',
  },
  categoryIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],
  productIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

promoCodeSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PromoCode', promoCodeSchema);