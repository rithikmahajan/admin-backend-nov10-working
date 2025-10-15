const mongoose = require("mongoose");

// Text Position Schema for draggable text elements
const textPositionSchema = new mongoose.Schema({
    x: { type: Number, default: 20 },
    y: { type: Number, default: 20 }
}, { _id: false });

// Section Types Enum
const SECTION_TYPES = {
    HEAD: 'head',
    POSTING: 'posting', 
    BOTTOM: 'bottom'
};

// JoinUs Schema for Join Us Control Management
const joinUsSchema = new mongoose.Schema(
    {
        // Post identification
        postId: {
            type: String,
            unique: true,
            index: true,
            default: function() {
                return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
        },

        // Post content
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

        // Post image
        image: {
            url: { type: String },
            publicId: { type: String }, // For Cloudinary or similar services
            alt: { type: String, default: 'Join Us Post Image' }
        },

        // Post positioning and priority
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

        // Section management
        section: {
            type: String,
            enum: Object.values(SECTION_TYPES),
            required: true,
            default: SECTION_TYPES.POSTING,
            index: true
        },

        // Post status and visibility
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

        // Display settings
        displaySettings: {
            showOnMobile: { type: Boolean, default: true },
            showOnDesktop: { type: Boolean, default: true },
            startDate: { type: Date },
            endDate: { type: Date }
        },

        // Reward/promotional specific fields
        rewardDetails: {
            rewardType: {
                type: String,
                enum: ['welcome', 'birthday', 'loyalty', 'seasonal', 'membership', 'custom'],
                default: 'welcome'
            },
            discountPercentage: { type: Number, min: 0, max: 100 },
            discountAmount: { type: Number, min: 0 },
            minOrderValue: { type: Number, min: 0, default: 0 },
            maxDiscountAmount: { type: Number, min: 0 },
            validityDays: { type: Number, min: 1, default: 30 },
            isStackable: { type: Boolean, default: false },
            membershipLevel: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'] }
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
            required: true
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
        }],

        // Content customization
        customContent: {
            backgroundColor: { type: String, default: '#ffffff' },
            textColor: { type: String, default: '#000000' },
            fontSize: { type: String, default: 'medium' },
            fontFamily: { type: String, default: 'Arial' }
        }
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
        versionKey: false
    }
);

// Indexes for better query performance
joinUsSchema.index({ section: 1, priority: 1, isActive: 1 });
joinUsSchema.index({ section: 1, isActive: 1, isPublished: 1 });
joinUsSchema.index({ 'displaySettings.startDate': 1, 'displaySettings.endDate': 1 });
joinUsSchema.index({ createdAt: -1 });
joinUsSchema.index({ 'analytics.views': -1 });
joinUsSchema.index({ approvalStatus: 1, section: 1 });

// Pre-save middleware to generate postId
joinUsSchema.pre('save', function(next) {
    if (this.isNew && !this.postId) {
        this.postId = `joinus_${this.section}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    next();
});

// Pre-save middleware to generate slug from title
joinUsSchema.pre('save', function(next) {
    if (this.isModified('title') && !this.seo.slug) {
        this.seo.slug = this.title
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    }
    next();
});

// Instance methods
joinUsSchema.methods.incrementView = function() {
    this.analytics.views += 1;
    this.analytics.lastViewed = new Date();
    return this.save();
};

joinUsSchema.methods.incrementClick = function() {
    this.analytics.clicks += 1;
    return this.save();
};

joinUsSchema.methods.incrementConversion = function() {
    this.analytics.conversions += 1;
    return this.save();
};

joinUsSchema.methods.publish = function() {
    this.isPublished = true;
    this.approvalStatus = 'approved';
    this.approvedAt = new Date();
    return this.save();
};

joinUsSchema.methods.unpublish = function() {
    this.isPublished = false;
    return this.save();
};

// Static methods
joinUsSchema.statics.getActivePostsBySection = function(section) {
    const query = { 
        isActive: true, 
        isPublished: true,
        section: section
    };
    
    const now = new Date();
    query.$or = [
        { 'displaySettings.startDate': { $exists: false } },
        { 'displaySettings.startDate': { $lte: now } }
    ];
    
    return this.find(query)
               .sort({ priority: 1, createdAt: -1 });
};

joinUsSchema.statics.getAllActivePosts = function() {
    const query = { isActive: true, isPublished: true };
    
    const now = new Date();
    query.$or = [
        { 'displaySettings.startDate': { $exists: false } },
        { 'displaySettings.startDate': { $lte: now } }
    ];
    
    return this.find(query)
               .sort({ section: 1, priority: 1, createdAt: -1 });
};

joinUsSchema.statics.getByPriorityInSection = function(section, limit = 10) {
    return this.find({ 
        section: section,
        isActive: true, 
        isPublished: true 
    })
    .sort({ priority: 1, createdAt: -1 })
    .limit(limit);
};

joinUsSchema.statics.searchPosts = function(searchTerm, section = null) {
    const query = {
        $text: { $search: searchTerm },
        isActive: true
    };
    
    if (section) {
        query.section = section;
    }
    
    return this.find(query).sort({ score: { $meta: 'textScore' } });
};

// Add text index for search functionality
joinUsSchema.index({
    title: 'text',
    detail: 'text',
    'seo.metaTitle': 'text',
    'seo.metaDescription': 'text'
});

// Virtual for post URL
joinUsSchema.virtual('url').get(function() {
    return `/join-us/${this.section}/${this.seo.slug || this.postId}`;
});

// Virtual for click-through rate
joinUsSchema.virtual('ctr').get(function() {
    if (this.analytics.views === 0) return 0;
    return ((this.analytics.clicks / this.analytics.views) * 100).toFixed(2);
});

// Virtual for conversion rate
joinUsSchema.virtual('conversionRate').get(function() {
    if (this.analytics.clicks === 0) return 0;
    return ((this.analytics.conversions / this.analytics.clicks) * 100).toFixed(2);
});

// Virtual for section display name
joinUsSchema.virtual('sectionDisplayName').get(function() {
    switch(this.section) {
        case SECTION_TYPES.HEAD: return 'Header';
        case SECTION_TYPES.POSTING: return 'Main Content';
        case SECTION_TYPES.BOTTOM: return 'Footer';
        default: return 'Unknown';
    }
});

// Ensure virtual fields are serialized
joinUsSchema.set('toJSON', { virtuals: true });
joinUsSchema.set('toObject', { virtuals: true });

// Export section types for use in other files
joinUsSchema.statics.SECTION_TYPES = SECTION_TYPES;

module.exports = mongoose.model("JoinUs", joinUsSchema);
