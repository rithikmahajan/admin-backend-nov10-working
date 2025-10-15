const mongoose = require("mongoose");

// Text Position Schema for draggable text elements
const textPositionSchema = new mongoose.Schema({
    x: { type: Number, default: 20 },
    y: { type: Number, default: 20 }
}, { _id: false });

// Banner Schema for Rewards Management
const bannerSchema = new mongoose.Schema(
    {
        // Banner identification
        bannerId: {
            type: String,
            unique: true,
            index: true,
            default: function() {
                return `banner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
        },

        // Banner content
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        detail: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },

        // Banner image
        image: {
            url: { type: String, required: true },
            publicId: { type: String }, // For Cloudinary or similar services
            alt: { type: String, default: 'Banner Image' }
        },

        // Banner positioning and priority
        priority: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
            index: true
        },

        textPosition: {
            type: textPositionSchema,
            default: () => ({ x: 20, y: 20 })
        },

        // Banner status and visibility
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        isPublished: {
            type: Boolean,
            default: false,
            index: true
        },

        // Banner type and category
        bannerType: {
            type: String,
            enum: ['reward', 'promotion', 'announcement', 'seasonal'],
            default: 'reward',
            index: true
        },

        // Display settings
        displaySettings: {
            showOnMobile: { type: Boolean, default: true },
            showOnDesktop: { type: Boolean, default: true },
            startDate: { type: Date },
            endDate: { type: Date }
        },

        // Rewards specific fields
        rewardDetails: {
            rewardType: {
                type: String,
                enum: ['welcome', 'birthday', 'loyalty', 'seasonal', 'custom'],
                default: 'welcome'
            },
            discountPercentage: { type: Number, min: 0, max: 100 },
            discountAmount: { type: Number, min: 0 },
            minOrderValue: { type: Number, min: 0, default: 0 },
            maxDiscountAmount: { type: Number, min: 0 },
            validityDays: { type: Number, min: 1, default: 30 },
            isStackable: { type: Boolean, default: false }
        },

        // Analytics and tracking
        analytics: {
            views: { type: Number, default: 0 },
            clicks: { type: Number, default: 0 },
            conversions: { type: Number, default: 0 },
            lastViewed: { type: Date }
        },

        // SEO and metadata
        seo: {
            metaTitle: { type: String, maxlength: 60 },
            metaDescription: { type: String, maxlength: 160 },
            slug: { type: String, unique: true, sparse: true }
        },

        // Admin tracking
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: function() {
                // Default to a system user ID or new ObjectId
                return new mongoose.Types.ObjectId();
            }
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        // Approval workflow
        approvalStatus: {
            type: String,
            enum: ['draft', 'pending_approval', 'approved', 'rejected'],
            default: 'draft',
            index: true
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        approvedAt: { type: Date },

        rejectionReason: { type: String },

        // Tags for organization
        tags: [{
            type: String,
            trim: true,
            lowercase: true
        }]
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
        versionKey: false
    }
);

// Indexes for better query performance
bannerSchema.index({ priority: 1, isActive: 1, isPublished: 1 });
bannerSchema.index({ bannerType: 1, isActive: 1 });
bannerSchema.index({ 'displaySettings.startDate': 1, 'displaySettings.endDate': 1 });
bannerSchema.index({ createdAt: -1 });
bannerSchema.index({ 'analytics.views': -1 });

// Pre-save middleware to generate bannerId
bannerSchema.pre('save', function(next) {
    if (this.isNew && !this.bannerId) {
        this.bannerId = `banner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    next();
});

// Pre-save middleware to generate slug from title
bannerSchema.pre('save', function(next) {
    if (this.isModified('title') && !this.seo.slug) {
        this.seo.slug = this.title
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    }
    next();
});

// Instance methods
bannerSchema.methods.incrementView = function() {
    this.analytics.views += 1;
    this.analytics.lastViewed = new Date();
    return this.save();
};

bannerSchema.methods.incrementClick = function() {
    this.analytics.clicks += 1;
    return this.save();
};

bannerSchema.methods.incrementConversion = function() {
    this.analytics.conversions += 1;
    return this.save();
};

bannerSchema.methods.publish = function() {
    this.isPublished = true;
    this.approvalStatus = 'approved';
    this.approvedAt = new Date();
    return this.save();
};

bannerSchema.methods.unpublish = function() {
    this.isPublished = false;
    return this.save();
};

// Static methods
bannerSchema.statics.getActiveBanners = function(bannerType = null) {
    const query = { isActive: true, isPublished: true };
    if (bannerType) {
        query.bannerType = bannerType;
    }
    
    const now = new Date();
    query.$or = [
        { 'displaySettings.startDate': { $exists: false } },
        { 'displaySettings.startDate': { $lte: now } }
    ];
    query.$or = [
        { 'displaySettings.endDate': { $exists: false } },
        { 'displaySettings.endDate': { $gte: now } }
    ];
    
    return this.find(query).sort({ priority: 1, createdAt: -1 });
};

bannerSchema.statics.getByPriority = function(limit = 10) {
    return this.find({ isActive: true, isPublished: true })
               .sort({ priority: 1, createdAt: -1 })
               .limit(limit);
};

bannerSchema.statics.searchBanners = function(searchTerm) {
    return this.find({
        $text: { $search: searchTerm },
        isActive: true
    }).sort({ score: { $meta: 'textScore' } });
};

// Add text index for search functionality
bannerSchema.index({
    title: 'text',
    detail: 'text',
    'seo.metaTitle': 'text',
    'seo.metaDescription': 'text'
});

// Virtual for banner URL
bannerSchema.virtual('url').get(function() {
    return `/banners/${this.seo.slug || this.bannerId}`;
});

// Virtual for click-through rate
bannerSchema.virtual('ctr').get(function() {
    if (this.analytics.views === 0) return 0;
    return ((this.analytics.clicks / this.analytics.views) * 100).toFixed(2);
});

// Virtual for conversion rate
bannerSchema.virtual('conversionRate').get(function() {
    if (this.analytics.clicks === 0) return 0;
    return ((this.analytics.conversions / this.analytics.clicks) * 100).toFixed(2);
});

// Ensure virtual fields are serialized
bannerSchema.set('toJSON', { virtuals: true });
bannerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Banner", bannerSchema);
