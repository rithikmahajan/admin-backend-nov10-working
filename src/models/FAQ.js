const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'FAQ title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters long'],
    maxlength: [200, 'Title must not exceed 200 characters']
  },
  detail: {
    type: String,
    required: [true, 'FAQ detail is required'],
    trim: true,
    minlength: [10, 'Detail must be at least 10 characters long'],
    maxlength: [2000, 'Detail must not exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'FAQ category is required'],
    enum: ['general', 'membership', 'points', 'shipping', 'returns', 'payments', 'account', 'orders', 'products'],
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0,
    min: 0
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional - for admin tracking
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional - for admin tracking
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
faqSchema.index({ category: 1, isActive: 1 });
faqSchema.index({ priority: 1, createdAt: -1 });
faqSchema.index({ title: 'text', detail: 'text' }); // Text search index

// Virtual for formatted creation date
faqSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toISOString().split('T')[0];
});

// Virtual for formatted update date
faqSchema.virtual('formattedUpdatedAt').get(function() {
  return this.updatedAt.toISOString().split('T')[0];
});

// Virtual fields for mobile app compatibility
faqSchema.virtual('question').get(function() {
  return this.title;
});

faqSchema.virtual('answer').get(function() {
  return this.detail;
});

faqSchema.virtual('order').get(function() {
  return this.priority;
});

// Pre-save middleware to auto-increment priority for new FAQs
faqSchema.pre('save', async function(next) {
  if (this.isNew && this.priority === 0) {
    try {
      const maxPriorityFaq = await this.constructor.findOne({}, {}, { sort: { priority: -1 } });
      this.priority = maxPriorityFaq ? maxPriorityFaq.priority + 1 : 1;
    } catch (error) {
      console.error('Error setting FAQ priority:', error);
    }
  }
  next();
});

// Static method to get FAQ categories
faqSchema.statics.getCategories = function() {
  return ['general', 'membership', 'points', 'shipping', 'returns', 'payments', 'account', 'orders', 'products'];
};

// Static method to get active FAQs by category
faqSchema.statics.getActiveByCategory = function(category) {
  const query = { isActive: true };
  if (category && category !== 'all') {
    query.category = category;
  }
  return this.find(query).sort({ priority: 1, createdAt: -1 });
};

// Instance method to increment view count
faqSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

const FAQ = mongoose.model('FAQ', faqSchema);

module.exports = FAQ;
