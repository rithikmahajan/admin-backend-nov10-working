const mongoose = require('mongoose');

const ProductRatingSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ratings: {
    size: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comfort: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    durability: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Compound index to ensure one rating per user per product
ProductRatingSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Index for efficient aggregation queries
ProductRatingSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model('ProductRating', ProductRatingSchema);
