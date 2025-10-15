const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define Points Schema
const pointsSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  totalPointsAlloted: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPointsRedeemed: {
    type: Number,
    default: 0,
    min: 0
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  transactions: [{
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    generationBasis: {
      type: String,
      enum: ['purchase', 'referral', 'signup', 'review', 'admin_allocation', 'redemption'],
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
pointsSchema.index({ userId: 1, isActive: 1 });
pointsSchema.index({ 'transactions.date': -1 });

// Virtual to calculate balance from transactions
pointsSchema.virtual('calculatedBalance').get(function() {
  return this.totalPointsAlloted - this.totalPointsRedeemed;
});

// Pre-save middleware to update balance
pointsSchema.pre('save', function(next) {
  this.balance = this.totalPointsAlloted - this.totalPointsRedeemed;
  next();
});

// Static method to get or create points record for user
pointsSchema.statics.getOrCreateUserPoints = async function(userId) {
  let points = await this.findOne({ userId, isActive: true });
  
  if (!points) {
    points = new this({
      userId,
      totalPointsAlloted: 0,
      totalPointsRedeemed: 0,
      balance: 0,
      transactions: []
    });
    await points.save();
  }
  
  return points;
};

// Instance method to add points
pointsSchema.methods.addPoints = function(amount, description, generationBasis = 'admin_allocation') {
  this.totalPointsAlloted += amount;
  this.balance = this.totalPointsAlloted - this.totalPointsRedeemed;
  
  this.transactions.push({
    type: 'credit',
    amount,
    description,
    generationBasis
  });
  
  return this.save();
};

// Instance method to redeem points
pointsSchema.methods.redeemPoints = function(amount, description) {
  if (this.balance < amount) {
    throw new Error('Insufficient points balance');
  }
  
  this.totalPointsRedeemed += amount;
  this.balance = this.totalPointsAlloted - this.totalPointsRedeemed;
  
  this.transactions.push({
    type: 'debit',
    amount,
    description,
    generationBasis: 'redemption'
  });
  
  return this.save();
};

module.exports = mongoose.model("Points", pointsSchema);
