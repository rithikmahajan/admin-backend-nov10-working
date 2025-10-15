const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define Chat Message Schema
const chatMessageSchema = new Schema({
  messageId: {
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
  message: {
    type: String,
    required: true,
    maxLength: 2000,
  },
  sender: {
    type: String,
    enum: ['user', 'admin'],
    required: true,
    index: true,
  },
  senderInfo: {
    userId: {
      type: String, // Changed to String to support Firebase UIDs
      required: false,
    },
    firebaseUid: {
      type: String, // Firebase UID
      required: false,
    },
    dbUserId: {
      type: Schema.Types.ObjectId, // Reference to User collection if exists
      ref: 'User',
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    avatar: {
      type: String,
      required: false,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    authSource: {
      type: String,
      enum: ['firebase', 'legacy', 'guest'],
      default: 'firebase',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system', 'auto_response'],
    default: 'text',
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent',
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    }
  }],
  isSystemMessage: {
    type: Boolean,
    default: false,
  },
  systemMessageType: {
    type: String,
    enum: ['session_start', 'session_end', 'admin_joined', 'admin_left', 'escalated', 'timeout_warning'],
    required: false,
  },
  editHistory: [{
    originalMessage: String,
    editedAt: Date,
    editedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    }
  }],
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'ChatMessage',
    required: false,
  },
  reactions: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    emoji: String,
    addedAt: {
      type: Date,
      default: Date.now,
    }
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    platform: String,
    deliveredAt: Date,
    readAt: Date,
    retryCount: {
      type: Number,
      default: 0,
    }
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    required: false,
  },
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes for better query performance
chatMessageSchema.index({ sessionId: 1, timestamp: 1 });
chatMessageSchema.index({ 'senderInfo.userId': 1, timestamp: -1 });
chatMessageSchema.index({ sender: 1, timestamp: -1 });
chatMessageSchema.index({ status: 1 });
chatMessageSchema.index({ messageType: 1 });
chatMessageSchema.index({ isDeleted: 1, timestamp: -1 });

// Virtual for formatted timestamp
chatMessageSchema.virtual('formattedTime').get(function() {
  const now = new Date();
  const messageDate = this.timestamp;
  const diffTime = Math.abs(now - messageDate);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    return `${days}d ago`;
  }
});

// Virtual for time display in chat
chatMessageSchema.virtual('timeDisplay').get(function() {
  return this.timestamp.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
});

// Virtual for date display
chatMessageSchema.virtual('dateDisplay').get(function() {
  const today = new Date();
  const messageDate = this.timestamp;
  
  if (messageDate.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (messageDate.toDateString() === new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString()) {
    return 'Yesterday';
  } else {
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
});

// Pre-save middleware
chatMessageSchema.pre('save', function(next) {
  // Set sender info avatar if not provided
  if (!this.senderInfo.avatar && this.senderInfo.name) {
    this.senderInfo.avatar = this.senderInfo.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }
  
  // Update message status timestamps
  if (this.isModified('status')) {
    if (this.status === 'delivered') {
      this.metadata.deliveredAt = new Date();
    } else if (this.status === 'read') {
      this.metadata.readAt = new Date();
    }
  }
  
  next();
});

// Post-save middleware to update session message count and last message time
chatMessageSchema.post('save', async function(doc) {
  try {
    const ChatSession = require('./ChatSession');
    const session = await ChatSession.findOne({ sessionId: doc.sessionId });
    
    if (session) {
      session.messageCount = (session.messageCount || 0) + 1;
      session.lastMessageAt = doc.timestamp;
      
      if (doc.sender === 'user') {
        session.lastUserMessageAt = doc.timestamp;
      } else if (doc.sender === 'admin') {
        session.lastAdminMessageAt = doc.timestamp;
      }
      
      await session.save();
    }
  } catch (error) {
    console.error('Error updating session after message save:', error);
  }
});

// Static method to generate unique message ID
chatMessageSchema.statics.generateMessageId = function() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `msg_${timestamp}_${random}`;
};

// Static method to get messages for a session
chatMessageSchema.statics.getSessionMessages = function(sessionId, options = {}) {
  const {
    after = null,
    limit = 50,
    includeDeleted = false
  } = options;
  
  const query = { sessionId };
  
  if (!includeDeleted) {
    query.isDeleted = { $ne: true };
  }
  
  if (after) {
    // Find messages after a specific message ID
    query._id = { $gt: after };
  }
  
  return this.find(query)
    .populate('senderInfo.userId', 'name email')
    .populate('replyTo', 'message senderInfo.name')
    .sort({ timestamp: 1 })
    .limit(limit)
    .lean();
};

// Static method to get latest messages (for polling)
chatMessageSchema.statics.getNewMessages = function(sessionId, afterMessageId = null) {
  const query = { 
    sessionId,
    isDeleted: { $ne: true }
  };
  
  if (afterMessageId) {
    // Find the after message to get its timestamp
    return this.findOne({ messageId: afterMessageId })
      .then(afterMessage => {
        if (afterMessage) {
          query.timestamp = { $gt: afterMessage.timestamp };
        }
        
        return this.find(query)
          .populate('senderInfo.userId', 'name email')
          .sort({ timestamp: 1 })
          .limit(20)
          .lean();
      });
  }
  
  return this.find(query)
    .populate('senderInfo.userId', 'name email')
    .sort({ timestamp: 1 })
    .limit(20)
    .lean();
};

// Instance method to mark as read
chatMessageSchema.methods.markAsRead = function() {
  if (this.status !== 'read') {
    this.status = 'read';
    this.metadata.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to add reaction
chatMessageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => !r.userId.equals(userId));
  
  // Add new reaction
  this.reactions.push({
    userId,
    emoji,
    addedAt: new Date()
  });
  
  return this.save();
};

// Instance method to remove reaction
chatMessageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => !r.userId.equals(userId));
  return this.save();
};

// Instance method to soft delete
chatMessageSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Static method to get message analytics
chatMessageSchema.statics.getAnalytics = async function(sessionId) {
  const pipeline = [
    { $match: { sessionId, isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$sender',
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result.reduce((acc, item) => {
    acc[item._id] = {
      messageCount: item.count,
      avgResponseTime: item.avgResponseTime
    };
    return acc;
  }, {});
};

// Export the model
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
module.exports = ChatMessage;
