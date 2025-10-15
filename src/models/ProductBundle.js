const mongoose = require("mongoose");

// Bundle Item Schema - represents individual items in a bundle
const bundleItemSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    itemId: { type: String, required: true }, // For easier lookup
    productName: { type: String, required: true },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: true
    },
    categoryName: { type: String, required: true },
    subCategoryName: { type: String, required: true },
    image: { type: String }, // Main image URL
    price: { type: Number, required: true },
    discountPrice: { type: Number, default: 0 },
    position: { type: Number, default: 0 }, // For drag & drop ordering
}, { _id: false });

// Main Product Bundle Schema
const productBundleSchema = new mongoose.Schema({
    bundleId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        default: function() {
            return `BUNDLE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    },
    
    bundleName: {
        type: String,
        required: true,
        trim: true
    },
    
    description: {
        type: String,
        trim: true
    },
    
    // Main product that triggers this bundle (e.g., red t-shirt)
    mainProduct: {
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true
        },
        itemId: { type: String, required: true },
        productName: { type: String, required: true },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true
        },
        subCategoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubCategory',
            required: true
        },
        categoryName: { type: String, required: true },
        subCategoryName: { type: String, required: true },
        image: { type: String },
        price: { type: Number, required: true }
    },
    
    // Bundle items (e.g., yellow pants, grey shoes)
    bundleItems: [bundleItemSchema],
    
    // Bundle pricing
    totalOriginalPrice: { type: Number, required: true, default: 0 },
    bundlePrice: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    
    // Bundle settings
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 1 }, // Higher priority bundles shown first
    
    // Display settings
    showOnProductPage: { type: Boolean, default: true },
    showInRecommendations: { type: Boolean, default: true },
    
    // Validity period
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date },
    
    // Metadata
    createdBy: {
        type: String,
        required: true
    },
    updatedBy: String,
    
    // Analytics
    viewCount: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
productBundleSchema.index({ 'mainProduct.itemId': 1 });
productBundleSchema.index({ 'mainProduct.categoryId': 1 });
productBundleSchema.index({ 'mainProduct.subCategoryId': 1 });
productBundleSchema.index({ isActive: 1 });
productBundleSchema.index({ priority: -1 });
productBundleSchema.index({ validFrom: 1, validUntil: 1 });

// Virtual for calculating savings
productBundleSchema.virtual('savings').get(function() {
    return this.totalOriginalPrice - this.bundlePrice;
});

// Virtual for checking if bundle is currently valid
productBundleSchema.virtual('isValid').get(function() {
    const now = new Date();
    const validFrom = this.validFrom || new Date(0);
    const validUntil = this.validUntil || new Date('2099-12-31');
    return now >= validFrom && now <= validUntil;
});

// Pre-save middleware to calculate totals
productBundleSchema.pre('save', function(next) {
    // Calculate total original price
    let totalOriginal = this.mainProduct.price;
    this.bundleItems.forEach(item => {
        totalOriginal += item.price;
    });
    this.totalOriginalPrice = totalOriginal;
    
    // Calculate discount amount and percentage
    this.discountAmount = this.totalOriginalPrice - this.bundlePrice;
    this.discountPercentage = this.totalOriginalPrice > 0 ? 
        Math.round((this.discountAmount / this.totalOriginalPrice) * 100) : 0;
    
    next();
});

// Static method to find bundles by main product
productBundleSchema.statics.findByMainProduct = function(itemId) {
    return this.find({ 
        'mainProduct.itemId': itemId, 
        isActive: true 
    }).populate('mainProduct.itemId bundleItems.itemId');
};

// Static method to find bundles by category
productBundleSchema.statics.findByCategory = function(categoryId) {
    return this.find({ 
        'mainProduct.categoryId': categoryId, 
        isActive: true 
    }).populate('mainProduct.itemId bundleItems.itemId');
};

// Instance method to increment view count
productBundleSchema.methods.incrementViews = function() {
    this.viewCount += 1;
    return this.save();
};

// Instance method to increment purchase count
productBundleSchema.methods.incrementPurchases = function() {
    this.purchaseCount += 1;
    return this.save();
};

module.exports = mongoose.model("ProductBundle", productBundleSchema);
