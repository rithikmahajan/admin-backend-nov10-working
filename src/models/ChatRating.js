const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define Chat Rating Schema
const chatRatingSchema = new Schema({
  ratingId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  sessionRef: {
    type: Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true,
  },
  userInfo: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Can be null for guest users
    },
    name: {
      type: String,
      required: false, // Optional - may not be available for all auth methods
      default: 'User',
    },
    email: {
      type: String,
      required: false, // Optional - may not be available for phone/Apple auth
      default: null,
    },
    phone: {
      type: String,
      required: false, // For phone authentication
      default: null,
    },
    authMethod: {
      type: String,
      enum: ['email', 'phone', 'google', 'apple', 'guest'],
      required: false,
      default: 'guest',
    },
    isGuest: {
      type: Boolean,
      default: false,
    }
  },
  adminInfo: {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    }
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true,
  },
  feedback: {
    type: String,
    required: false,
    maxLength: 1000,
  },
  categories: {
    responsiveness: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
    helpfulness: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
    friendliness: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
    knowledgeability: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
    problemResolution: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    }
  },
  tags: [{
    type: String,
    enum: [
      'excellent_service',
      'quick_response',
      'helpful_advice',
      'friendly_staff',
      'problem_solved',
      'slow_response',
      'unhelpful',
      'rude_staff',
      'problem_not_solved',
      'technical_issues',
      'confusing_answers',
      'exceeded_expectations',
      'professional',
      'patient',
      'knowledgeable'
    ],
  }],
  sessionDetails: {
    duration: Number, // in seconds
    messageCount: Number,
    adminResponseTime: Number, // average response time in seconds
    waitTime: Number, // time before admin first responded
    sessionStartTime: Date,
    sessionEndTime: Date,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  source: {
    type: String,
    enum: ['mobile_app', 'web_app', 'website', 'email'],
    default: 'web_app',
  },
  deviceInfo: {
    platform: String,
    userAgent: String,
    ipAddress: String,
  },
  followUpRequired: {
    type: Boolean,
    default: false,
  },
  followUpReason: {
    type: String,
    required: false,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  sentimentScore: {
    type: Number,
    min: -1,
    max: 1,
    required: false, // Can be calculated using sentiment analysis
  },
  sentimentAnalysis: {
    positive: Number,
    negative: Number,
    neutral: Number,
    keywords: [String],
  },
  adminNotified: {
    type: Boolean,
    default: false,
  },
  internalNotes: [{
    note: String,
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    visibility: {
      type: String,
      enum: ['admin_only', 'all_staff'],
      default: 'admin_only',
    }
  }],
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes for better query performance
chatRatingSchema.index({ sessionId: 1 });
chatRatingSchema.index({ 'userInfo.userId': 1, timestamp: -1 });
chatRatingSchema.index({ 'adminInfo.adminId': 1, timestamp: -1 });
chatRatingSchema.index({ rating: 1, timestamp: -1 });
chatRatingSchema.index({ timestamp: -1 });
chatRatingSchema.index({ followUpRequired: 1 });
chatRatingSchema.index({ tags: 1 });

// Virtual for overall satisfaction category
chatRatingSchema.virtual('satisfactionLevel').get(function() {
  if (this.rating >= 4) return 'satisfied';
  if (this.rating >= 3) return 'neutral';
  return 'dissatisfied';
});

// Virtual for category average
chatRatingSchema.virtual('categoryAverage').get(function() {
  const categories = this.categories;
  const values = Object.values(categories).filter(v => v != null && v > 0);
  
  if (values.length === 0) return null;
  
  return values.reduce((sum, val) => sum + val, 0) / values.length;
});

// Virtual for feedback length category
chatRatingSchema.virtual('feedbackLength').get(function() {
  if (!this.feedback) return 'none';
  if (this.feedback.length < 50) return 'short';
  if (this.feedback.length < 200) return 'medium';
  return 'detailed';
});

// Pre-save middleware
chatRatingSchema.pre('save', function(next) {
  // Auto-tag based on rating
  if (this.rating >= 4 && !this.tags.includes('excellent_service')) {
    this.tags.push('excellent_service');
  } else if (this.rating <= 2 && !this.tags.includes('problem_not_solved')) {
    this.tags.push('problem_not_solved');
  }
  
  // Set follow-up required for low ratings
  if (this.rating <= 2) {
    this.followUpRequired = true;
    if (!this.followUpReason) {
      this.followUpReason = 'Low rating requires follow-up';
    }
  }
  
  next();
});

// Post-save middleware to update session rating
chatRatingSchema.post('save', async function(doc) {
  try {
    const ChatSession = require('./ChatSession');
    await ChatSession.findOneAndUpdate(
      { sessionId: doc.sessionId },
      { 
        rating: doc.rating,
        feedback: doc.feedback 
      }
    );
  } catch (error) {
    console.error('Error updating session rating:', error);
  }
});

// Static method to generate unique rating ID
chatRatingSchema.statics.generateRatingId = function() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `rating_${timestamp}_${random}`;
};

// Static method to get rating analytics
chatRatingSchema.statics.getAnalytics = async function(options = {}) {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to last 30 days
    endDate = new Date(),
    adminId = null
  } = options;
  
  const matchStage = {
    timestamp: { $gte: startDate, $lte: endDate }
  };
  
  if (adminId) {
    matchStage['adminInfo.adminId'] = new mongoose.Types.ObjectId(adminId);
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRatings: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        },
        averageCategories: {
          $avg: {
            $avg: [
              '$categories.responsiveness',
              '$categories.helpfulness',
              '$categories.friendliness',
              '$categories.knowledgeability',
              '$categories.problemResolution'
            ]
          }
        },
        followUpRequired: {
          $sum: { $cond: [{ $eq: ['$followUpRequired', true] }, 1, 0] }
        },
        satisfiedCustomers: {
          $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] }
        },
        dissatisfiedCustomers: {
          $sum: { $cond: [{ $lte: ['$rating', 2] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalRatings: 1,
        averageRating: { $round: ['$averageRating', 2] },
        averageCategories: { $round: ['$averageCategories', 2] },
        followUpRequired: 1,
        satisfactionRate: {
          $round: [
            { $multiply: [{ $divide: ['$satisfiedCustomers', '$totalRatings'] }, 100] },
            2
          ]
        },
        dissatisfactionRate: {
          $round: [
            { $multiply: [{ $divide: ['$dissatisfiedCustomers', '$totalRatings'] }, 100] },
            2
          ]
        },
        ratingDistribution: {
          $let: {
            vars: {
              ratings: '$ratingDistribution'
            },
            in: {
              1: { $size: { $filter: { input: '$$ratings', cond: { $eq: ['$$this', 1] } } } },
              2: { $size: { $filter: { input: '$$ratings', cond: { $eq: ['$$this', 2] } } } },
              3: { $size: { $filter: { input: '$$ratings', cond: { $eq: ['$$this', 3] } } } },
              4: { $size: { $filter: { input: '$$ratings', cond: { $eq: ['$$this', 4] } } } },
              5: { $size: { $filter: { input: '$$ratings', cond: { $eq: ['$$this', 5] } } } }
            }
          }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalRatings: 0,
    averageRating: 0,
    averageCategories: 0,
    followUpRequired: 0,
    satisfactionRate: 0,
    dissatisfactionRate: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
};

// Static method to get admin performance
chatRatingSchema.statics.getAdminPerformance = async function(adminId, period = 30) {
  const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
  
  const pipeline = [
    {
      $match: {
        'adminInfo.adminId': new mongoose.Types.ObjectId(adminId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRatings: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        responsiveness: { $avg: '$categories.responsiveness' },
        helpfulness: { $avg: '$categories.helpfulness' },
        friendliness: { $avg: '$categories.friendliness' },
        knowledgeability: { $avg: '$categories.knowledgeability' },
        problemResolution: { $avg: '$categories.problemResolution' },
        followUpCount: {
          $sum: { $cond: [{ $eq: ['$followUpRequired', true] }, 1, 0] }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalRatings: 0,
    averageRating: 0,
    responsiveness: 0,
    helpfulness: 0,
    friendliness: 0,
    knowledgeability: 0,
    problemResolution: 0,
    followUpCount: 0
  };
};

// Instance method to add internal note
chatRatingSchema.methods.addInternalNote = function(note, addedBy, visibility = 'admin_only') {
  this.internalNotes.push({
    note,
    addedBy,
    addedAt: new Date(),
    visibility
  });
  return this.save();
};

// Instance method to mark admin as notified
chatRatingSchema.methods.markAdminNotified = function() {
  this.adminNotified = true;
  return this.save();
};

// Export the model
const ChatRating = mongoose.model("ChatRating", chatRatingSchema);
module.exports = ChatRating;
