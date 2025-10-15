const Banner = require("../../models/Banner");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

// Utility function for error responses
const sendErrorResponse = (res, statusCode, message, details = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        details,
        timestamp: new Date().toISOString()
    });
};

// Utility function for success responses
const sendSuccessResponse = (res, statusCode, message, data = null, meta = null) => {
    const response = {
        success: true,
        message,
        timestamp: new Date().toISOString()
    };
    
    if (data !== null) response.data = data;
    if (meta !== null) response.meta = meta;
    
    return res.status(statusCode).json(response);
};

/**
 * Create a new banner
 */
const createBanner = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendErrorResponse(res, 400, "Validation failed", errors.array());
        }

        const {
            title,
            detail,
            image,
            priority,
            textPosition,
            bannerType,
            displaySettings,
            rewardDetails,
            seo,
            tags
        } = req.body;

        // Check if priority already exists for active banners
        if (priority) {
            const existingBanner = await Banner.findOne({ 
                priority, 
                isActive: true,
                _id: { $ne: req.params.id } // Exclude current banner if updating
            });
            
            if (existingBanner) {
                return sendErrorResponse(res, 400, `Banner with priority ${priority} already exists`);
            }
        }

        // Create banner object
        const bannerData = {
            title,
            detail,
            image: {
                url: image.url || image,
                publicId: image.publicId,
                alt: image.alt || title
            },
            priority: priority || await getNextPriority(),
            textPosition: textPosition || { x: 20, y: 20 },
            bannerType: bannerType || 'reward',
            createdBy: req.user?.id || new mongoose.Types.ObjectId(), // Default ObjectId if no user
            displaySettings,
            rewardDetails,
            seo,
            tags
        };

        const banner = new Banner(bannerData);
        await banner.save();

        sendSuccessResponse(res, 201, "Banner created successfully", banner);
    } catch (error) {
        console.error("Create Banner Error:", error);
        sendErrorResponse(res, 500, "Failed to create banner", error.message);
    }
};

/**
 * Get all banners with filtering, sorting, and pagination
 */
const getAllBanners = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'priority',
            sortOrder = 'asc',
            bannerType,
            isActive,
            isPublished,
            approvalStatus,
            search
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (bannerType) filter.bannerType = bannerType;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
        if (approvalStatus) filter.approvalStatus = approvalStatus;
        
        // Add search functionality
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { detail: { $regex: search, $options: 'i' } },
                { 'seo.metaTitle': { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Execute queries
        const [banners, total] = await Promise.all([
            Banner.find(filter)
                  .sort(sort)
                  .skip(skip)
                  .limit(parseInt(limit))
                  .populate('createdBy', 'name email')
                  .populate('updatedBy', 'name email')
                  .populate('approvedBy', 'name email'),
            Banner.countDocuments(filter)
        ]);

        // Calculate pagination meta
        const totalPages = Math.ceil(total / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPreviousPage = parseInt(page) > 1;

        const meta = {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
            hasNextPage,
            hasPreviousPage
        };

        sendSuccessResponse(res, 200, "Banners retrieved successfully", banners, meta);
    } catch (error) {
        console.error("Get All Banners Error:", error);
        sendErrorResponse(res, 500, "Failed to retrieve banners", error.message);
    }
};

/**
 * Get active banners for public display
 */
const getActiveBanners = async (req, res) => {
    try {
        const { bannerType, limit = 10 } = req.query;
        
        const banners = await Banner.getActiveBanners(bannerType);
        
        // Increment view count for each banner
        const viewPromises = banners.map(banner => banner.incrementView());
        await Promise.all(viewPromises);

        sendSuccessResponse(res, 200, "Active banners retrieved successfully", banners.slice(0, parseInt(limit)));
    } catch (error) {
        console.error("Get Active Banners Error:", error);
        sendErrorResponse(res, 500, "Failed to retrieve active banners", error.message);
    }
};

/**
 * Get banner by ID
 */
const getBannerById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid banner ID format");
        }

        const banner = await Banner.findById(id)
                                 .populate('createdBy', 'name email')
                                 .populate('updatedBy', 'name email')
                                 .populate('approvedBy', 'name email');

        if (!banner) {
            return sendErrorResponse(res, 404, "Banner not found");
        }

        // Increment view count
        await banner.incrementView();

        sendSuccessResponse(res, 200, "Banner retrieved successfully", banner);
    } catch (error) {
        console.error("Get Banner By ID Error:", error);
        sendErrorResponse(res, 500, "Failed to retrieve banner", error.message);
    }
};

/**
 * Update banner
 */
const updateBanner = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendErrorResponse(res, 400, "Validation failed", errors.array());
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid banner ID format");
        }

        const banner = await Banner.findById(id);
        if (!banner) {
            return sendErrorResponse(res, 404, "Banner not found");
        }

        const {
            title,
            detail,
            image,
            priority,
            textPosition,
            bannerType,
            displaySettings,
            rewardDetails,
            seo,
            tags,
            isActive,
            isPublished
        } = req.body;

        // Check priority conflicts
        if (priority && priority !== banner.priority) {
            const existingBanner = await Banner.findOne({ 
                priority, 
                isActive: true,
                _id: { $ne: id }
            });
            
            if (existingBanner) {
                return sendErrorResponse(res, 400, `Banner with priority ${priority} already exists`);
            }
        }

        // Update banner fields
        if (title !== undefined) banner.title = title;
        if (detail !== undefined) banner.detail = detail;
        if (image !== undefined) {
            banner.image = {
                url: image.url || image,
                publicId: image.publicId || banner.image.publicId,
                alt: image.alt || title || banner.image.alt
            };
        }
        if (priority !== undefined) banner.priority = priority;
        if (textPosition !== undefined) banner.textPosition = textPosition;
        if (bannerType !== undefined) banner.bannerType = bannerType;
        if (displaySettings !== undefined) banner.displaySettings = { ...banner.displaySettings, ...displaySettings };
        if (rewardDetails !== undefined) banner.rewardDetails = { ...banner.rewardDetails, ...rewardDetails };
        if (seo !== undefined) banner.seo = { ...banner.seo, ...seo };
        if (tags !== undefined) banner.tags = tags;
        if (isActive !== undefined) banner.isActive = isActive;
        if (isPublished !== undefined) banner.isPublished = isPublished;

        banner.updatedBy = req.user?.id || banner.updatedBy;

        await banner.save();

        sendSuccessResponse(res, 200, "Banner updated successfully", banner);
    } catch (error) {
        console.error("Update Banner Error:", error);
        sendErrorResponse(res, 500, "Failed to update banner", error.message);
    }
};

/**
 * Delete banner (soft delete by setting isActive to false)
 */
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid banner ID format");
        }

        const banner = await Banner.findById(id);
        if (!banner) {
            return sendErrorResponse(res, 404, "Banner not found");
        }

        // Soft delete
        banner.isActive = false;
        banner.isPublished = false;
        banner.updatedBy = req.user?.id || banner.updatedBy;
        await banner.save();

        sendSuccessResponse(res, 200, "Banner deleted successfully", { id: banner._id });
    } catch (error) {
        console.error("Delete Banner Error:", error);
        sendErrorResponse(res, 500, "Failed to delete banner", error.message);
    }
};

/**
 * Permanently delete banner
 */
const permanentDeleteBanner = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid banner ID format");
        }

        const banner = await Banner.findByIdAndDelete(id);
        if (!banner) {
            return sendErrorResponse(res, 404, "Banner not found");
        }

        sendSuccessResponse(res, 200, "Banner permanently deleted", { id });
    } catch (error) {
        console.error("Permanent Delete Banner Error:", error);
        sendErrorResponse(res, 500, "Failed to permanently delete banner", error.message);
    }
};

/**
 * Publish banner
 */
const publishBanner = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid banner ID format");
        }

        const banner = await Banner.findById(id);
        if (!banner) {
            return sendErrorResponse(res, 404, "Banner not found");
        }

        await banner.publish();
        banner.approvedBy = req.user?.id || banner.approvedBy;
        await banner.save();

        sendSuccessResponse(res, 200, "Banner published successfully", banner);
    } catch (error) {
        console.error("Publish Banner Error:", error);
        sendErrorResponse(res, 500, "Failed to publish banner", error.message);
    }
};

/**
 * Unpublish banner
 */
const unpublishBanner = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid banner ID format");
        }

        const banner = await Banner.findById(id);
        if (!banner) {
            return sendErrorResponse(res, 404, "Banner not found");
        }

        await banner.unpublish();
        banner.updatedBy = req.user?.id || banner.updatedBy;
        await banner.save();

        sendSuccessResponse(res, 200, "Banner unpublished successfully", banner);
    } catch (error) {
        console.error("Unpublish Banner Error:", error);
        sendErrorResponse(res, 500, "Failed to unpublish banner", error.message);
    }
};

/**
 * Update banner priority
 */
const updateBannerPriority = async (req, res) => {
    try {
        const { priorities } = req.body; // Array of { id, priority }

        if (!Array.isArray(priorities)) {
            return sendErrorResponse(res, 400, "Priorities must be an array");
        }

        const updatePromises = priorities.map(({ id, priority }) => {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error(`Invalid banner ID: ${id}`);
            }
            return Banner.findByIdAndUpdate(id, { priority }, { new: true });
        });

        const updatedBanners = await Promise.all(updatePromises);

        sendSuccessResponse(res, 200, "Banner priorities updated successfully", updatedBanners);
    } catch (error) {
        console.error("Update Banner Priority Error:", error);
        sendErrorResponse(res, 500, "Failed to update banner priorities", error.message);
    }
};

/**
 * Get banner analytics
 */
const getBannerAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid banner ID format");
        }

        const banner = await Banner.findById(id);
        if (!banner) {
            return sendErrorResponse(res, 404, "Banner not found");
        }

        // Build date filter
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        // Get banner analytics
        const analytics = {
            bannerId: banner._id,
            bannerTitle: banner.title,
            totalViews: banner.analytics.views,
            totalClicks: banner.analytics.clicks,
            totalConversions: banner.analytics.conversions,
            clickThroughRate: banner.ctr,
            conversionRate: banner.conversionRate,
            lastViewed: banner.analytics.lastViewed,
            isActive: banner.isActive,
            isPublished: banner.isPublished,
            priority: banner.priority
        };

        sendSuccessResponse(res, 200, "Banner analytics retrieved successfully", analytics);
    } catch (error) {
        console.error("Get Banner Analytics Error:", error);
        sendErrorResponse(res, 500, "Failed to retrieve banner analytics", error.message);
    }
};

/**
 * Track banner click
 */
const trackBannerClick = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid banner ID format");
        }

        const banner = await Banner.findById(id);
        if (!banner) {
            return sendErrorResponse(res, 404, "Banner not found");
        }

        await banner.incrementClick();

        sendSuccessResponse(res, 200, "Banner click tracked successfully", {
            clicks: banner.analytics.clicks
        });
    } catch (error) {
        console.error("Track Banner Click Error:", error);
        sendErrorResponse(res, 500, "Failed to track banner click", error.message);
    }
};

/**
 * Track banner conversion
 */
const trackBannerConversion = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid banner ID format");
        }

        const banner = await Banner.findById(id);
        if (!banner) {
            return sendErrorResponse(res, 404, "Banner not found");
        }

        await banner.incrementConversion();

        sendSuccessResponse(res, 200, "Banner conversion tracked successfully", {
            conversions: banner.analytics.conversions
        });
    } catch (error) {
        console.error("Track Banner Conversion Error:", error);
        sendErrorResponse(res, 500, "Failed to track banner conversion", error.message);
    }
};

/**
 * Get next available priority
 */
const getNextPriority = async () => {
    try {
        const lastBanner = await Banner.findOne({ isActive: true })
                                     .sort({ priority: -1 })
                                     .limit(1);
        return lastBanner ? lastBanner.priority + 1 : 1;
    } catch (error) {
        return 1;
    }
};

/**
 * Bulk operations
 */
const bulkUpdateBanners = async (req, res) => {
    try {
        const { bannerIds, updates } = req.body;

        if (!Array.isArray(bannerIds) || bannerIds.length === 0) {
            return sendErrorResponse(res, 400, "Banner IDs array is required");
        }

        const validIds = bannerIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length !== bannerIds.length) {
            return sendErrorResponse(res, 400, "Some banner IDs are invalid");
        }

        const updateData = { ...updates };
        if (req.user?.id) {
            updateData.updatedBy = req.user.id;
        }

        const result = await Banner.updateMany(
            { _id: { $in: validIds } },
            { $set: updateData }
        );

        sendSuccessResponse(res, 200, "Banners updated successfully", {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error("Bulk Update Banners Error:", error);
        sendErrorResponse(res, 500, "Failed to bulk update banners", error.message);
    }
};

module.exports = {
    createBanner,
    getAllBanners,
    getActiveBanners,
    getBannerById,
    updateBanner,
    deleteBanner,
    permanentDeleteBanner,
    publishBanner,
    unpublishBanner,
    updateBannerPriority,
    getBannerAnalytics,
    trackBannerClick,
    trackBannerConversion,
    bulkUpdateBanners
};
