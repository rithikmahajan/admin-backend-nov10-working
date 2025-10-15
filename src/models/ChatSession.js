const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define Chat Session Schema
const chatSessionSchema = new Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userInfo: {
    isGuest: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: String, // Firebase UID as primary identifier
      required: false, // Can be null for guest users
    },
    firebaseUid: {
      type: String, // Firebase UID (same as userId for Firebase users)
      required: false,
    },
    dbUserId: {
      type: Schema.Types.ObjectId, // Reference to User collection if exists
      ref: 'User',
      required: false,
    },
    
    // Contact information (optional based on auth method)
    email: {
      type: String,
      required: false, // Optional - Apple/Phone users might not have email
    },
    phone: {
      type: String,
      required: false, // Optional - Email/Apple users might not have phone
    },
    
    // Display information
    name: {
      type: String,
      required: true,
    },
    picture: {
      type: String,
      required: false,
    },
    
    // Authentication details
    authMethod: {
      type: String,
      enum: ['phone', 'email', 'google', 'apple', 'unknown'],
      required: false,
    },
    authSource: {
      type: String,
      enum: ['firebase', 'legacy', 'guest'],
      default: 'firebase',
    },
    providerId: {
      type: String, // Firebase provider ID
      required: false,
    },
    
    // Verification status
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    
    // Third-party identifiers
    googleId: {
      type: String,
      required: false,
    },
    appleId: {
      type: String,
      required: false,
    },
    
    // Database integration flags
    isRegisteredUser: {
      type: Boolean,
      default: false,
    },
    hasDbAccount: {
      type: Boolean,
      default: false,
    },
    isRegisteredUser: {
      type: Boolean,
      default: false,
    },
    guestSessionId: {
      type: String,
      required: false, // Only for guest users
    }
  },
  status: {
    type: String,
    enum: ['active', 'ended', 'ended_by_admin', 'timeout'],
    default: 'active',
    index: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
    index: true,
  },
  endTime: {
    type: Date,
    required: false,
  },
  duration: {
    type: Number, // in seconds
    required: false,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: false,
  },
  feedback: {
    type: String,
    required: false,
    maxLength: 1000,
  },
  assignedAdmin: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  adminInfo: {
    name: String,
    email: String,
    joinedAt: Date,
  },
  messageCount: {
    type: Number,
    default: 0,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  lastUserMessageAt: {
    type: Date,
    required: false,
  },
  lastAdminMessageAt: {
    type: Date,
    required: false,
  },
  sessionContext: {
    ipAddress: String,
    userAgent: String,
    platform: String,
    source: {
      type: String,
      enum: ['mobile_app', 'web_app', 'website', 'admin_panel'],
      default: 'web_app',
    }
  },
  tags: [{
    type: String,
    enum: ['order_issue', 'product_inquiry', 'shipping', 'payment', 'return', 'technical', 'general', 'complaint'],
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  isEscalated: {
    type: Boolean,
    default: false,
  },
  escalationReason: {
    type: String,
    required: false,
  },
  adminNotes: [{
    note: String,
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    }
  }],
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes for better query performance
chatSessionSchema.index({ 'userInfo.userId': 1, status: 1 });
chatSessionSchema.index({ 'userInfo.guestSessionId': 1 });
chatSessionSchema.index({ assignedAdmin: 1, status: 1 });
chatSessionSchema.index({ startTime: -1 });
chatSessionSchema.index({ lastMessageAt: -1 });
chatSessionSchema.index({ priority: 1, status: 1 });
chatSessionSchema.index({ tags: 1 });

// Virtual for session duration display
chatSessionSchema.virtual('durationDisplay').get(function() {
  if (!this.duration) return null;
  
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
});

// Virtual for session age
chatSessionSchema.virtual('sessionAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.startTime);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    return `${days}d ago`;
  }
});

// Pre-save middleware to calculate duration
chatSessionSchema.pre('save', function(next) {
  if (this.endTime && this.startTime && !this.duration) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

// Static method to generate unique session ID
chatSessionSchema.statics.generateSessionId = function() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `chat_${timestamp}_${random}`;
};

// Static method to find active sessions
chatSessionSchema.statics.findActiveSessions = function() {
  return this.find({ status: 'active' })
    .populate('userInfo.userId', 'name email')
    .populate('assignedAdmin', 'name email')
    .sort({ lastMessageAt: -1 });
};

// Static method to get session analytics
chatSessionSchema.statics.getAnalytics = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        startTime: {
          $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to last 30 days
          $lte: endDate || new Date()
        }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        completedSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] }
        },
        avgDuration: { $avg: '$duration' },
        avgRating: { $avg: '$rating' },
        avgMessageCount: { $avg: '$messageCount' },
        ratingCount: {
          $sum: { $cond: [{ $ne: ['$rating', null] }, 1, 0] }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalSessions: 0,
    completedSessions: 0,
    avgDuration: 0,
    avgRating: 0,
    avgMessageCount: 0,
    ratingCount: 0
  };
};

// Instance method to end session
chatSessionSchema.methods.endSession = function(endReason = 'user') {
  this.status = endReason === 'admin' ? 'ended_by_admin' : 'ended';
  this.endTime = new Date();
  if (this.startTime && this.endTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  return this.save();
};

// Instance method to assign admin
chatSessionSchema.methods.assignAdmin = function(adminUser) {
  this.assignedAdmin = adminUser._id;
  this.adminInfo = {
    name: adminUser.name,
    email: adminUser.email,
    joinedAt: new Date()
  };
  return this.save();
};

// Instance method to add tag
chatSessionSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to escalate session
chatSessionSchema.methods.escalate = function(reason) {
  this.isEscalated = true;
  this.priority = 'urgent';
  this.escalationReason = reason;
  return this.save();
};

// Export the model
const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
module.exports = ChatSession;
