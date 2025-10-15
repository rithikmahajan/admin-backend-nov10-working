const mongoose = require('mongoose');

const cartAbandonmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  firebaseUid: {
    type: String,
    required: false,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  mobile: {
    type: String,
    required: false,
    index: true
  },
  userName: {
    type: String,
    required: false
  },
  userType: {
    type: String,
    enum: ['registered', 'guest'],
    default: 'guest',
    index: true
  },
  dob: {
    type: Date,
    required: false
  },
  gender: {
    type: String,
    enum: ['M', 'F', 'Other'],
    required: false
  },
  country: {
    type: String,
    required: false,
    index: true
  },
  region: {
    type: String,
    required: false,
    index: true
  },
  cartItems: [{
    itemId: String,
    itemName: String,
    quantity: Number,
    price: Number,
    image: String
  }],
  cartValue: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now,
    index: true
  },
  avgVisitTime: {
    type: Number, // in minutes
    default: 0
  },
  sessionDuration: {
    type: Number, // in minutes
    default: 0
  },
  abandonedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'abandoned', 'recovered', 'blocked'],
    default: 'abandoned',
    index: true
  },
  recoveryAttempts: {
    type: Number,
    default: 0
  },
  emailsSent: [{
    sentAt: Date,
    type: String, // 'recovery', 'reminder', 'offer'
    opened: { type: Boolean, default: false },
    clicked: { type: Boolean, default: false }
  }],
  smsSent: [{
    sentAt: Date,
    type: String,
    delivered: { type: Boolean, default: false }
  }],
  browserInfo: {
    userAgent: String,
    browser: String,
    device: String,
    os: String
  },
  locationInfo: {
    ip: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  referralSource: {
    type: String,
    required: false
  },
  pageViews: {
    type: Number,
    default: 0
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    required: false
  }
}, {
  timestamps: true,
  collection: 'cart_abandonments'
});

// Indexes for better query performance
cartAbandonmentSchema.index({ abandonedAt: -1 });
cartAbandonmentSchema.index({ userType: 1, status: 1 });
cartAbandonmentSchema.index({ country: 1, region: 1 });
cartAbandonmentSchema.index({ cartValue: -1 });
cartAbandonmentSchema.index({ lastActive: -1 });
cartAbandonmentSchema.index({ email: 1, status: 1 });

// Virtual for age calculation
cartAbandonmentSchema.virtual('age').get(function() {
  if (this.dob) {
    const today = new Date();
    const birthDate = new Date(this.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  return null;
});

// Static method to get abandoned carts with filters
cartAbandonmentSchema.statics.getAbandonedCarts = function(filters = {}) {
  const query = { status: 'abandoned' };
  
  // Date range filter
  if (filters.dateRange) {
    const now = new Date();
    let startDate;
    
    switch (filters.dateRange) {
      case 'last 7 days':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'last 30 days':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case 'last 90 days':
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }
    
    query.abandonedAt = { $gte: startDate };
  }
  
  // User type filter
  if (filters.userType && filters.userType !== 'all') {
    query.userType = filters.userType;
  }
  
  // Country/Region filter
  if (filters.countryRegion && filters.countryRegion !== 'all') {
    query.country = filters.countryRegion;
  }
  
  return this.find(query);
};

// Instance method to mark as recovered
cartAbandonmentSchema.methods.markAsRecovered = function() {
  this.status = 'recovered';
  this.recoveryAttempts += 1;
  return this.save();
};

// Instance method to add email record
cartAbandonmentSchema.methods.addEmailRecord = function(type) {
  this.emailsSent.push({
    sentAt: new Date(),
    type: type
  });
  this.recoveryAttempts += 1;
  return this.save();
};

// Instance method to add SMS record
cartAbandonmentSchema.methods.addSMSRecord = function(type) {
  this.smsSent.push({
    sentAt: new Date(),
    type: type
  });
  this.recoveryAttempts += 1;
  return this.save();
};

module.exports = mongoose.model('CartAbandonment', cartAbandonmentSchema);
