const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Partner name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  partnerId: {
    type: String,
    required: [true, 'Partner ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // Allows null values but ensures uniqueness when present
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  phone: {
    type: String,
    trim: true,
    sparse: true,
    validate: {
      validator: function(v) {
        return !v || /^[6-9]\d{9}$/.test(v);
      },
      message: 'Please enter a valid 10-digit phone number'
    }
  },
  status: {
    type: String,
    enum: ['active', 'blocked', 'pending'],
    default: 'active'
  },
  role: {
    type: String,
    default: 'partner',
    immutable: true
  },
  permissions: {
    canAcceptOrders: {
      type: Boolean,
      default: true
    },
    canRejectOrders: {
      type: Boolean,
      default: true
    },
    canViewOrders: {
      type: Boolean,
      default: true
    }
  },
  businessInfo: {
    businessName: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'India'
      }
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true
    }
  },
  statistics: {
    totalOrdersAssigned: {
      type: Number,
      default: 0
    },
    totalOrdersAccepted: {
      type: Number,
      default: 0
    },
    totalOrdersRejected: {
      type: Number,
      default: 0
    },
    totalOrdersCompleted: {
      type: Number,
      default: 0
    },
    acceptanceRate: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
partnerSchema.index({ partnerId: 1 });
partnerSchema.index({ status: 1 });
partnerSchema.index({ createdAt: -1 });
partnerSchema.index({ 'businessInfo.businessName': 1 });
partnerSchema.index({ isDeleted: 1, status: 1 });

// Virtual for account lock status
partnerSchema.virtual('isLocked').get(function() {
  return !!(this.lockedUntil && this.lockedUntil > Date.now());
});

// Pre-save middleware to hash password
partnerSchema.pre('save', async function(next) {
  try {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update statistics
partnerSchema.pre('save', function(next) {
  if (this.statistics.totalOrdersAssigned > 0) {
    this.statistics.acceptanceRate = (this.statistics.totalOrdersAccepted / this.statistics.totalOrdersAssigned) * 100;
  }
  
  if (this.statistics.totalOrdersAccepted > 0) {
    this.statistics.completionRate = (this.statistics.totalOrdersCompleted / this.statistics.totalOrdersAccepted) * 100;
  }
  
  next();
});

// Instance method to check password
partnerSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to increment login attempts
partnerSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockedUntil && this.lockedUntil < Date.now()) {
    return this.updateOne({
      $set: {
        loginAttempts: 1
      },
      $unset: {
        lockedUntil: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockedUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
partnerSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockedUntil: 1
    }
  });
};

// Static method to find active partners
partnerSchema.statics.findActive = function() {
  return this.find({ 
    status: 'active', 
    isDeleted: false 
  }).select('-password');
};

// Static method to find by partner ID
partnerSchema.statics.findByPartnerId = function(partnerId) {
  return this.findOne({ 
    partnerId: partnerId,
    isDeleted: false 
  });
};

// Static method for soft delete
partnerSchema.methods.softDelete = function(deletedBy) {
  return this.updateOne({
    isDeleted: true,
    deletedAt: new Date(),
    updatedBy: deletedBy
  });
};

const Partner = mongoose.model('Partner', partnerSchema);

module.exports = Partner;
