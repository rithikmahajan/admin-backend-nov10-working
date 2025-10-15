const JoinUs = require("../../models/JoinUs");
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
 * Create a new join us post
 */
const createJoinUsPost = async (req, res) => {
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
            section,
            displaySettings,
            rewardDetails,
            seo,
            tags,
            customContent
        } = req.body;

        // Check if priority already exists for active posts in the same section
        if (priority && section) {
            const existingPost = await JoinUs.findOne({ 
                priority, 
                section,
                isActive: true,
                _id: { $ne: req.params.id } // Exclude current post if updating
            });
            
            if (existingPost) {
                return sendErrorResponse(res, 400, `Post with priority ${priority} already exists in ${section} section`);
            }
        }

        // Create post object
        const postData = {
            title,
            detail,
            image: image ? {
                url: image.url || image,
                publicId: image.publicId,
                alt: image.alt || title
            } : undefined,
            priority: priority || await getNextPriorityInSection(section || 'posting'),
            textPosition: textPosition || { x: 20, y: 20 },
            section: section || 'posting',
            createdBy: req.user?.id || new mongoose.Types.ObjectId(), // Assuming user is attached to req
            displaySettings,
            rewardDetails,
            seo,
            tags,
            customContent
        };

        const joinUsPost = new JoinUs(postData);
        await joinUsPost.save();

        sendSuccessResponse(res, 201, "Join Us post created successfully", joinUsPost);
    } catch (error) {
        console.error("Create Join Us Post Error:", error);
        sendErrorResponse(res, 500, "Failed to create join us post", error.message);
    }
};

/**
 * Get all join us posts with filtering, sorting, and pagination
 */
const getAllJoinUsPosts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'priority',
            sortOrder = 'asc',
            section,
            isActive,
            isPublished,
            approvalStatus,
            search
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (section) filter.section = section;
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
        // Secondary sort by section and priority for consistency
        if (sortBy !== 'section') sort.section = 1;
        if (sortBy !== 'priority') sort.priority = 1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Execute queries
        const [posts, total] = await Promise.all([
            JoinUs.find(filter)
                  .sort(sort)
                  .skip(skip)
                  .limit(parseInt(limit))
                  .populate('createdBy', 'name email')
                  .populate('updatedBy', 'name email')
                  .populate('approvedBy', 'name email'),
            JoinUs.countDocuments(filter)
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

        sendSuccessResponse(res, 200, "Join Us posts retrieved successfully", posts, meta);
    } catch (error) {
        console.error("Get All Join Us Posts Error:", error);
        sendErrorResponse(res, 500, "Failed to retrieve join us posts", error.message);
    }
};

/**
 * Get active posts by section for public display
 */
const getActivePostsBySection = async (req, res) => {
    try {
        const { section } = req.params;
        const { limit = 10 } = req.query;
        
        // Validate section
        const validSections = Object.values(JoinUs.SECTION_TYPES);
        if (!validSections.includes(section)) {
            return sendErrorResponse(res, 400, `Invalid section. Must be one of: ${validSections.join(', ')}`);
        }
        
        const posts = await JoinUs.getActivePostsBySection(section);
        
        // Increment view count for each post
        const viewPromises = posts.map(post => post.incrementView());
        await Promise.all(viewPromises);

        sendSuccessResponse(res, 200, `Active ${section} posts retrieved successfully`, posts.slice(0, parseInt(limit)));
    } catch (error) {
        console.error("Get Active Posts By Section Error:", error);
        sendErrorResponse(res, 500, "Failed to retrieve active posts", error.message);
    }
};

/**
 * Get all active posts grouped by section
 */
const getAllActivePosts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const posts = await JoinUs.getAllActivePosts();
        
        // Group posts by section
        const groupedPosts = posts.reduce((acc, post) => {
            if (!acc[post.section]) {
                acc[post.section] = [];
            }
            acc[post.section].push(post);
            return acc;
        }, {});

        // Limit posts per section if specified
        if (limit) {
            Object.keys(groupedPosts).forEach(section => {
                groupedPosts[section] = groupedPosts[section].slice(0, parseInt(limit));
            });
        }

        // Increment view count for all posts
        const viewPromises = posts.map(post => post.incrementView());
        await Promise.all(viewPromises);

        sendSuccessResponse(res, 200, "All active posts retrieved successfully", groupedPosts);
    } catch (error) {
        console.error("Get All Active Posts Error:", error);
        sendErrorResponse(res, 500, "Failed to retrieve all active posts", error.message);
    }
};

/**
 * Get post by ID
 */
const getJoinUsPostById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid post ID format");
        }

        const post = await JoinUs.findById(id)
                                 .populate('createdBy', 'name email')
                                 .populate('updatedBy', 'name email')
                                 .populate('approvedBy', 'name email');

        if (!post) {
            return sendErrorResponse(res, 404, "Join Us post not found");
        }

        // Increment view count
        await post.incrementView();

        sendSuccessResponse(res, 200, "Join Us post retrieved successfully", post);
    } catch (error) {
        console.error("Get Join Us Post By ID Error:", error);
        sendErrorResponse(res, 500, "Failed to retrieve join us post", error.message);
    }
};

/**
 * Update post
 */
const updateJoinUsPost = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendErrorResponse(res, 400, "Validation failed", errors.array());
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid post ID format");
        }

        const post = await JoinUs.findById(id);
        if (!post) {
            return sendErrorResponse(res, 404, "Join Us post not found");
        }

        const {
            title,
            detail,
            image,
            priority,
            textPosition,
            section,
            displaySettings,
            rewardDetails,
            seo,
            tags,
            customContent,
            isActive,
            isPublished
        } = req.body;

        // Check priority conflicts within the same section
        if (priority && section && (priority !== post.priority || section !== post.section)) {
            const existingPost = await JoinUs.findOne({ 
                priority, 
                section: section || post.section,
                isActive: true,
                _id: { $ne: id }
            });
            
            if (existingPost) {
                return sendErrorResponse(res, 400, `Post with priority ${priority} already exists in ${section || post.section} section`);
            }
        }

        // Update post fields
        if (title !== undefined) post.title = title;
        if (detail !== undefined) post.detail = detail;
        if (image !== undefined) {
            post.image = image ? {
                url: image.url || image,
                publicId: image.publicId || post.image?.publicId,
                alt: image.alt || title || post.image?.alt
            } : undefined;
        }
        if (priority !== undefined) post.priority = priority;
        if (textPosition !== undefined) post.textPosition = textPosition;
        if (section !== undefined) post.section = section;
        if (displaySettings !== undefined) post.displaySettings = { ...post.displaySettings, ...displaySettings };
        if (rewardDetails !== undefined) post.rewardDetails = { ...post.rewardDetails, ...rewardDetails };
        if (seo !== undefined) post.seo = { ...post.seo, ...seo };
        if (tags !== undefined) post.tags = tags;
        if (customContent !== undefined) post.customContent = { ...post.customContent, ...customContent };
        if (isActive !== undefined) post.isActive = isActive;
        if (isPublished !== undefined) post.isPublished = isPublished;

        post.updatedBy = req.user?.id || post.updatedBy;

        await post.save();

        sendSuccessResponse(res, 200, "Join Us post updated successfully", post);
    } catch (error) {
        console.error("Update Join Us Post Error:", error);
        sendErrorResponse(res, 500, "Failed to update join us post", error.message);
    }
};

/**
 * Delete post (soft delete by setting isActive to false)
 */
const deleteJoinUsPost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid post ID format");
        }

        const post = await JoinUs.findById(id);
        if (!post) {
            return sendErrorResponse(res, 404, "Join Us post not found");
        }

        // Soft delete
        post.isActive = false;
        post.isPublished = false;
        post.updatedBy = req.user?.id || post.updatedBy;
        await post.save();

        sendSuccessResponse(res, 200, "Join Us post deleted successfully", { id: post._id });
    } catch (error) {
        console.error("Delete Join Us Post Error:", error);
        sendErrorResponse(res, 500, "Failed to delete join us post", error.message);
    }
};

/**
 * Permanently delete post
 */
const permanentDeleteJoinUsPost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid post ID format");
        }

        const post = await JoinUs.findByIdAndDelete(id);
        if (!post) {
            return sendErrorResponse(res, 404, "Join Us post not found");
        }

        sendSuccessResponse(res, 200, "Join Us post permanently deleted", { id });
    } catch (error) {
        console.error("Permanent Delete Join Us Post Error:", error);
        sendErrorResponse(res, 500, "Failed to permanently delete join us post", error.message);
    }
};

/**
 * Publish post
 */
const publishJoinUsPost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid post ID format");
        }

        const post = await JoinUs.findById(id);
        if (!post) {
            return sendErrorResponse(res, 404, "Join Us post not found");
        }

        await post.publish();
        post.approvedBy = req.user?.id || post.approvedBy;
        await post.save();

        sendSuccessResponse(res, 200, "Join Us post published successfully", post);
    } catch (error) {
        console.error("Publish Join Us Post Error:", error);
        sendErrorResponse(res, 500, "Failed to publish join us post", error.message);
    }
};

/**
 * Unpublish post
 */
const unpublishJoinUsPost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid post ID format");
        }

        const post = await JoinUs.findById(id);
        if (!post) {
            return sendErrorResponse(res, 404, "Join Us post not found");
        }

        await post.unpublish();
        post.updatedBy = req.user?.id || post.updatedBy;
        await post.save();

        sendSuccessResponse(res, 200, "Join Us post unpublished successfully", post);
    } catch (error) {
        console.error("Unpublish Join Us Post Error:", error);
        sendErrorResponse(res, 500, "Failed to unpublish join us post", error.message);
    }
};

/**
 * Update post priorities in bulk within a section
 */
const updatePostPriorities = async (req, res) => {
    try {
        const { priorities } = req.body; // Array of { id, priority, section }

        if (!Array.isArray(priorities)) {
            return sendErrorResponse(res, 400, "Priorities must be an array");
        }

        // Validate all IDs first
        for (const item of priorities) {
            if (!mongoose.Types.ObjectId.isValid(item.id)) {
                return sendErrorResponse(res, 400, `Invalid post ID: ${item.id}`);
            }
        }

        // Group by section to check for conflicts
        const sectionGroups = priorities.reduce((acc, item) => {
            const section = item.section || 'posting';
            if (!acc[section]) acc[section] = [];
            acc[section].push(item);
            return acc;
        }, {});

        // Check for priority conflicts within each section
        for (const [section, items] of Object.entries(sectionGroups)) {
            const prioritySet = new Set();
            for (const item of items) {
                if (prioritySet.has(item.priority)) {
                    return sendErrorResponse(res, 400, `Duplicate priority ${item.priority} in ${section} section`);
                }
                prioritySet.add(item.priority);
            }
        }

        const updatePromises = priorities.map(({ id, priority, section }) => {
            return JoinUs.findByIdAndUpdate(
                id, 
                { 
                    priority, 
                    ...(section && { section }),
                    updatedBy: req.user?.id 
                }, 
                { new: true }
            );
        });

        const updatedPosts = await Promise.all(updatePromises);

        sendSuccessResponse(res, 200, "Post priorities updated successfully", updatedPosts);
    } catch (error) {
        console.error("Update Post Priorities Error:", error);
        sendErrorResponse(res, 500, "Failed to update post priorities", error.message);
    }
};

/**
 * Get post analytics
 */
const getJoinUsPostAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid post ID format");
        }

        const post = await JoinUs.findById(id);
        if (!post) {
            return sendErrorResponse(res, 404, "Join Us post not found");
        }

        // Get post analytics
        const analytics = {
            postId: post._id,
            postTitle: post.title,
            section: post.section,
            totalViews: post.analytics.views,
            totalClicks: post.analytics.clicks,
            totalConversions: post.analytics.conversions,
            clickThroughRate: post.ctr,
            conversionRate: post.conversionRate,
            lastViewed: post.analytics.lastViewed,
            isActive: post.isActive,
            isPublished: post.isPublished,
            priority: post.priority
        };

        sendSuccessResponse(res, 200, "Post analytics retrieved successfully", analytics);
    } catch (error) {
        console.error("Get Post Analytics Error:", error);
        sendErrorResponse(res, 500, "Failed to retrieve post analytics", error.message);
    }
};

/**
 * Track post click
 */
const trackJoinUsPostClick = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid post ID format");
        }

        const post = await JoinUs.findById(id);
        if (!post) {
            return sendErrorResponse(res, 404, "Join Us post not found");
        }

        await post.incrementClick();

        sendSuccessResponse(res, 200, "Post click tracked successfully", {
            clicks: post.analytics.clicks
        });
    } catch (error) {
        console.error("Track Post Click Error:", error);
        sendErrorResponse(res, 500, "Failed to track post click", error.message);
    }
};

/**
 * Track post conversion
 */
const trackJoinUsPostConversion = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, "Invalid post ID format");
        }

        const post = await JoinUs.findById(id);
        if (!post) {
            return sendErrorResponse(res, 404, "Join Us post not found");
        }

        await post.incrementConversion();

        sendSuccessResponse(res, 200, "Post conversion tracked successfully", {
            conversions: post.analytics.conversions
        });
    } catch (error) {
        console.error("Track Post Conversion Error:", error);
        sendErrorResponse(res, 500, "Failed to track post conversion", error.message);
    }
};

/**
 * Get next available priority in a section
 */
const getNextPriorityInSection = async (section) => {
    try {
        const lastPost = await JoinUs.findOne({ section, isActive: true })
                                   .sort({ priority: -1 })
                                   .limit(1);
        return lastPost ? lastPost.priority + 1 : 1;
    } catch (error) {
        return 1;
    }
};

/**
 * Bulk operations
 */
const bulkUpdateJoinUsPosts = async (req, res) => {
    try {
        const { postIds, updates } = req.body;

        if (!Array.isArray(postIds) || postIds.length === 0) {
            return sendErrorResponse(res, 400, "Post IDs array is required");
        }

        const validIds = postIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length !== postIds.length) {
            return sendErrorResponse(res, 400, "Some post IDs are invalid");
        }

        const updateData = { ...updates };
        if (req.user?.id) {
            updateData.updatedBy = req.user.id;
        }

        const result = await JoinUs.updateMany(
            { _id: { $in: validIds } },
            { $set: updateData }
        );

        sendSuccessResponse(res, 200, "Posts updated successfully", {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error("Bulk Update Posts Error:", error);
        sendErrorResponse(res, 500, "Failed to bulk update posts", error.message);
    }
};

module.exports = {
    createJoinUsPost,
    getAllJoinUsPosts,
    getActivePostsBySection,
    getAllActivePosts,
    getJoinUsPostById,
    updateJoinUsPost,
    deleteJoinUsPost,
    permanentDeleteJoinUsPost,
    publishJoinUsPost,
    unpublishJoinUsPost,
    updatePostPriorities,
    getJoinUsPostAnalytics,
    trackJoinUsPostClick,
    trackJoinUsPostConversion,
    bulkUpdateJoinUsPosts
};
