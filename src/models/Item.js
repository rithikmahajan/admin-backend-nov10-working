const mongoose = require("mongoose");

// Enhanced Size schema (merged from both models)
const sizeSchema = new mongoose.Schema({
    size: { type: String, required: false }, // Changed to optional to fix validation error
    quantity: { type: Number, default: 0 },
    stock: { type: Number, default: 0 }, // For compatibility with paymentController
    hsnCode: { type: String, maxlength: 8 }, // 8 digits as requested
    sku: { type: String, required: false }, // Format: men/tshirt/insomniac tshirt/2025/07/28/12345678 - auto-generated
    barcode: { type: String, maxlength: 14 }, // 14 digits as requested
    
    // Pricing at size level
    regularPrice: { type: Number, min: 0, default: 0 },
    salePrice: { type: Number, min: 0, default: 0 },
    
    // Measurements in centimeters (cm)
    fitWaistCm: { type: Number }, // fit waist (cm)
    inseamLengthCm: { type: Number }, // inseam length (cm)
    chestCm: { type: Number }, // chest (cm)
    frontLengthCm: { type: Number }, // front length (cm)
    acrossShoulderCm: { type: Number }, // across shoulder (cm)
    
    // Measurements in inches (in)
    toFitWaistIn: { type: Number }, // to fit waist (in)
    inseamLengthIn: { type: Number }, // inseam length (in)
    chestIn: { type: Number }, // chest (in)
    frontLengthIn: { type: Number }, // front length (in)
    acrossShoulderIn: { type: Number }, // across shoulder (in)
    
    // SEO and URL fields at size level
    metaTitle: { type: String }, // meta title
    metaDescription: { type: String }, // meta description
    slugUrl: { type: String }, // slug URL
    
    // Filters at size level - multiple filters can be assigned to each size
    filters: [
      {
        key: { type: String, required: true, index: true }, // e.g., "color", "material", "style"
        value: { type: String, required: true, index: true }, // e.g., "Red", "Cotton", "Casual"
        code: { type: String }, // optional hex code for colors or unique identifier
      },
    ],
}, { _id: false });

// ==============================
// Comprehensive Item Schema Definition (Merged from Item and ItemDetails)
// ==============================
const itemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    
    // productId for backward compatibility with existing unique indexes
    productId: {
      type: String,
      required: false, // Make it optional to avoid breaking existing records
      unique: true,
      sparse: true, // Only enforce unique constraint on non-null values
      index: true,
    },
    
    // Basic product information
    productName: { type: String, required: true, index: true },
    title: { type: String, index: true },
    description: { type: String, required: true },
    
    // Manufacturing and shipping details (simplified to single strings)
    manufacturingDetails: { type: String },
    shippingAndReturns: { type: String },
    
    returnable: { type: Boolean, default: true },
    
    // Stock and size management
    stockSizeOption: { type: String, enum: ['sizes', 'variants'], default: 'sizes' },
    
    // Product variants (for different colors, designs, etc.)
    variants: [{
        name: { type: String, required: true },
        images: [{ type: String }], // Array of image URLs
        videos: [{ type: String }], // Array of video URLs
        colors: [{ type: String }] // Array of color codes/names
    }],
    
    // Sizes directly at item level (no color variants)
    sizes: [sizeSchema],
    
    // Product images and media (moved from color variants to product level)
    images: [{
        url: { type: String, required: false },
        type: { type: String, enum: ["image", "video"], default: "image" },
        priority: { type: Number, default: 1 }
    }],
    
    // Size chart image for measurement reference
    sizeChartImage: {
        url: { type: String, required: false },
        uploadedAt: { type: Date, required: false },
        filename: { type: String, required: false }
    },
    
    // Categories (optional for draft items, required for published items)
    subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory", required: false },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: false },
    
    // Filter assignment
    filters: [
      {
        key: { type: String, required: true, index: true },
        value: { type: String, required: true, index: true },
        code: { type: String },
      },
    ],
    
    // Reviews and ratings (enhanced from both models)
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        reviewText: { type: String, trim: true },
        title: { type: String, trim: true }, // Review title (optional)
        helpful: { type: Number, default: 0, min: 0 }, // Count of helpful votes
        helpfulUsers: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User" 
        }], // Users who marked this review as helpful
        verified: { type: Boolean, default: true }, // Is this a verified purchase review
        photos: [{ type: String }], // Array of photo URLs (future feature)
        
        // Detailed ratings (0-4 scale for size, comfort, durability)
        size: { type: Number, min: 0, max: 4 }, // Size rating (0-4)
        comfort: { type: Number, min: 0, max: 4 }, // Comfort rating (0-4)
        durability: { type: Number, min: 0, max: 4 }, // Durability rating (0-4)
        detailedRatingsSubmitted: { type: Boolean, default: false }, // Flag indicating if detailed ratings were provided
        
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    }],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    ratingDistribution: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 }
    },
    isReviewDisplayEnabled: { type: Boolean, default: true },
    isReviewSubmissionEnabled: { type: Boolean, default: true },
    
    // Enhanced also show in options
    alsoShowInOptions: {
        similarItems: {
            enabled: { type: Boolean, default: false },
            placement: { type: String, default: 'default' },
            items: [{ type: mongoose.Schema.Types.Mixed }]
        },
        othersAlsoBought: {
            enabled: { type: Boolean, default: false },
            placement: { type: String, default: 'default' },
            items: [{ type: mongoose.Schema.Types.Mixed }]
        },
        youMightAlsoLike: {
            enabled: { type: Boolean, default: false },
            placement: { type: String, default: 'default' },
            items: [{ type: mongoose.Schema.Types.Mixed }]
        },
        customOptions: [{ type: mongoose.Schema.Types.Mixed }],
        appPlacements: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    
    // Enhanced publishing and scheduling options
    publishingOptions: {
        action: { type: String, enum: ['draft', 'publish', 'schedule', 'save_later'], default: 'draft' },
        scheduledDate: { type: String },
        scheduledTime: { type: String },
        publishAt: { type: Date },
        autoPublish: { type: Boolean, default: false },
        notificationSettings: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    publishedAt: { type: Date },
    
    // Product status
    status: {
        type: String,
        enum: ['draft', 'live', 'published', 'scheduled', 'inactive'],
        default: 'draft'
    },
    
    // Scheduling fields
    scheduledDate: {
        type: String, // Store as string for date in YYYY-MM-DD format
        required: false
    },
    scheduledTime: {
        type: String, // Store as string for time in HH:MM format
        required: false
    },
    scheduledAt: {
        type: Date, // Combined date-time when the product was scheduled
        required: false
    },
    publishAt: {
        type: Date, // Exact date-time when the product should go live
        required: false
    },
    
    // Status and flags (from ItemDetails)
    isActive: { type: Boolean, default: true },
    
    // Display order for arrangement control
    displayOrder: { type: Number, default: 0, index: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ==============================
// Indexes for better performance
// ==============================
itemSchema.index({ isActive: 1, isDeleted: 1 });
itemSchema.index({ categoryId: 1 });
itemSchema.index({ subCategoryId: 1 });
itemSchema.index({ 'filters.key': 1, 'filters.value': 1 }); // Product-level filters
itemSchema.index({ 'sizes.filters.key': 1, 'sizes.filters.value': 1 }); // Size-level filters

// ==============================
// Middleware: Auto-calculate average rating and sync stock/quantity
// ==============================
itemSchema.pre("save", function (next) {
  // Calculate average rating and rating distribution
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = parseFloat((totalRating / this.reviews.length).toFixed(2));
    this.totalReviews = this.reviews.length;
    
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    this.reviews.forEach(review => {
      distribution[review.rating]++;
    });
    this.ratingDistribution = distribution;
  } else {
    this.averageRating = 0;
    this.totalReviews = 0;
    this.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  }
  
  next();
});

// Export the Item model
module.exports = mongoose.model("Item", itemSchema);
