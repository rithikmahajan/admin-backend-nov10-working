const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define Message Schema
const messageSchema = new Schema({
  sender: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: function() {
        return this.sender.name.split(' ').map(n => n[0]).join('').toUpperCase();
      }
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Can be null for external emails
    }
  },
  recipient: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    }
  },
  subject: {
    type: String,
    required: true,
    maxLength: 200,
  },
  content: {
    type: String,
    required: true,
  },
  preview: {
    type: String,
    default: function() {
      return this.content.substring(0, 100) + (this.content.length > 100 ? '...' : '');
    }
  },
  messageType: {
    type: String,
    enum: ['app_message', 'email_query', 'contact_form', 'system_message', 'user_message'],
    default: 'user_message',
  },
  source: {
    type: String,
    enum: ['mobile_app', 'web_app', 'email', 'contact_form', 'system'],
    default: 'web_app',
  },
  category: {
    type: String,
    enum: ['Primary', 'Social', 'Work', 'Friends', 'Support', 'Marketing', 'System'],
    default: 'Primary',
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'replied', 'archived', 'deleted', 'spam'],
    default: 'unread',
  },
  folder: {
    type: String,
    enum: ['inbox', 'sent', 'draft', 'starred', 'important', 'spam', 'bin', 'archived'],
    default: 'inbox',
  },
  isStarred: {
    type: Boolean,
    default: false,
  },
  isImportant: {
    type: Boolean,
    default: false,
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
  // Reply chain - for threading messages
  threadId: {
    type: String,
    default: function() {
      return this._id.toString();
    }
  },
  parentMessageId: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    required: false,
  },
  replyCount: {
    type: Number,
    default: 0,
  },
  // Email specific fields
  emailHeaders: {
    messageId: String,
    inReplyTo: String,
    references: String,
  },
  // Metadata
  ipAddress: String,
  userAgent: String,
  readAt: Date,
  repliedAt: Date,
  archivedAt: Date,
  deletedAt: Date,
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes for better query performance
messageSchema.index({ 'recipient.userId': 1, folder: 1, status: 1 });
messageSchema.index({ 'sender.userId': 1, folder: 1 });
messageSchema.index({ threadId: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ 'recipient.email': 1, status: 1 });

// Virtual for formatted time
messageSchema.virtual('formattedTime').get(function() {
  const now = new Date();
  const messageDate = this.createdAt;
  const diffTime = Math.abs(now - messageDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return messageDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } else if (diffDays <= 7) {
    return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
});

// Virtual for formatted date
messageSchema.virtual('formattedDate').get(function() {
  const now = new Date();
  const messageDate = this.createdAt;
  const diffTime = Math.abs(now - messageDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Today';
  } else if (diffDays === 2) {
    return 'Yesterday';
  } else if (diffDays <= 7) {
    return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return messageDate.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  }
});

// Pre-save middleware to set preview and avatar
messageSchema.pre('save', function(next) {
  if (!this.preview && this.content) {
    this.preview = this.content.substring(0, 100) + (this.content.length > 100 ? '...' : '');
  }
  
  if (!this.sender.avatar && this.sender.name) {
    this.sender.avatar = this.sender.name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  next();
});

// Static method to get folder counts for a user
messageSchema.statics.getFolderCounts = async function(userId) {
  // Convert to ObjectId if it's a string
  const objectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  
  const counts = await this.aggregate([
    {
      $match: {
        $or: [
          { 'recipient.userId': objectId },
          { 'sender.userId': objectId }
        ]
      }
    },
    {
      $group: {
        _id: '$folder',
        count: { $sum: 1 },
        unreadCount: {
          $sum: {
            $cond: [
              { 
                $and: [
                  { $eq: ['$status', 'unread'] },
                  { $eq: ['$recipient.userId', objectId] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  // Convert to object format
  const folderCounts = {
    inbox: { total: 0, unread: 0 },
    starred: { total: 0, unread: 0 },
    sent: { total: 0, unread: 0 },
    draft: { total: 0, unread: 0 },
    important: { total: 0, unread: 0 },
    spam: { total: 0, unread: 0 },
    bin: { total: 0, unread: 0 },
    archived: { total: 0, unread: 0 }
  };
  
  counts.forEach(item => {
    if (folderCounts[item._id]) {
      folderCounts[item._id] = {
        total: item.count,
        unread: item.unreadCount
      };
    }
  });
  
  return folderCounts;
};

// Instance method to mark as read
messageSchema.methods.markAsRead = function() {
  if (this.status === 'unread') {
    this.status = 'read';
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to toggle star
messageSchema.methods.toggleStar = function() {
  this.isStarred = !this.isStarred;
  if (this.isStarred && this.folder !== 'starred') {
    this.folder = 'starred';
  } else if (!this.isStarred && this.folder === 'starred') {
    this.folder = 'inbox';
  }
  return this.save();
};

// Export the model
const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
