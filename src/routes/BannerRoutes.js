const express = require("express");
const { body, query, param } = require("express-validator");
const {
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
} = require("../controllers/bannerController/bannerController");

const router = express.Router();

// Validation middleware for banner creation and updates
const bannerValidationRules = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 100 })
        .withMessage('Title must not exceed 100 characters'),
    
    body('detail')
        .trim()
        .notEmpty()
        .withMessage('Detail is required')
        .isLength({ max: 1000 })
        .withMessage('Detail must not exceed 1000 characters'),
    
    body('image')
        .custom((value) => {
            if (typeof value === 'string') {
                // Simple URL validation
                if (!value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('data:')) {
                    throw new Error('Image must be a valid URL or base64 data');
                }
            } else if (typeof value === 'object') {
                if (!value.url) {
                    throw new Error('Image object must contain a url property');
                }
                if (!value.url.startsWith('http://') && !value.url.startsWith('https://') && !value.url.startsWith('data:')) {
                    throw new Error('Image URL must be a valid URL or base64 data');
                }
            } else {
                throw new Error('Image must be a string URL or object with url property');
            }
            return true;
        }),
    
    body('priority')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Priority must be a positive integer'),
    
    body('textPosition.x')
        .optional()
        .isNumeric()
        .withMessage('Text position X must be a number'),
    
    body('textPosition.y')
        .optional()
        .isNumeric()
        .withMessage('Text position Y must be a number'),
    
    body('bannerType')
        .optional()
        .isIn(['reward', 'promotion', 'announcement', 'seasonal'])
        .withMessage('Banner type must be one of: reward, promotion, announcement, seasonal'),
    
    body('rewardDetails.rewardType')
        .optional()
        .isIn(['welcome', 'birthday', 'loyalty', 'seasonal', 'custom'])
        .withMessage('Reward type must be one of: welcome, birthday, loyalty, seasonal, custom'),
    
    body('rewardDetails.discountPercentage')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Discount percentage must be between 0 and 100'),
    
    body('rewardDetails.discountAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Discount amount must be a positive number'),
    
    body('rewardDetails.minOrderValue')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum order value must be a positive number'),
    
    body('rewardDetails.validityDays')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Validity days must be a positive integer'),
    
    body('seo.metaTitle')
        .optional()
        .isLength({ max: 60 })
        .withMessage('Meta title must not exceed 60 characters'),
    
    body('seo.metaDescription')
        .optional()
        .isLength({ max: 160 })
        .withMessage('Meta description must not exceed 160 characters'),
    
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    
    body('tags.*')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Each tag must be between 1 and 50 characters')
];

// Validation for query parameters
const queryValidationRules = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('sortBy')
        .optional()
        .isIn(['priority', 'createdAt', 'updatedAt', 'title', 'bannerType'])
        .withMessage('Sort by must be one of: priority, createdAt, updatedAt, title, bannerType'),
    
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be either asc or desc'),
    
    query('bannerType')
        .optional()
        .isIn(['reward', 'promotion', 'announcement', 'seasonal'])
        .withMessage('Banner type must be one of: reward, promotion, announcement, seasonal'),
    
    query('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    
    query('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished must be a boolean'),
    
    query('approvalStatus')
        .optional()
        .isIn(['draft', 'pending_approval', 'approved', 'rejected'])
        .withMessage('Approval status must be one of: draft, pending_approval, approved, rejected')
];

// Parameter validation
const idValidationRule = param('id')
    .isMongoId()
    .withMessage('Invalid banner ID format');

// Routes

/**
 * @route   POST /api/banners
 * @desc    Create a new banner
 * @access  Private (Admin)
 */
router.post("/", bannerValidationRules, createBanner);

/**
 * @route   GET /api/banners
 * @desc    Get all banners with filtering, sorting, and pagination
 * @access  Private (Admin)
 */
router.get("/", queryValidationRules, getAllBanners);

/**
 * @route   GET /api/banners/active
 * @desc    Get active banners for public display
 * @access  Public
 */
router.get("/active", 
    [
        query('bannerType')
            .optional()
            .isIn(['reward', 'promotion', 'announcement', 'seasonal'])
            .withMessage('Banner type must be one of: reward, promotion, announcement, seasonal'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Limit must be between 1 and 50')
    ],
    getActiveBanners
);

/**
 * @route   GET /api/banners/:id
 * @desc    Get banner by ID
 * @access  Private (Admin)
 */
router.get("/:id", idValidationRule, getBannerById);

/**
 * @route   PUT /api/banners/:id
 * @desc    Update banner
 * @access  Private (Admin)
 */
router.put("/:id", [idValidationRule, ...bannerValidationRules], updateBanner);

/**
 * @route   DELETE /api/banners/:id
 * @desc    Soft delete banner
 * @access  Private (Admin)
 */
router.delete("/:id", idValidationRule, deleteBanner);

/**
 * @route   DELETE /api/banners/:id/permanent
 * @desc    Permanently delete banner
 * @access  Private (Super Admin)
 */
router.delete("/:id/permanent", idValidationRule, permanentDeleteBanner);

/**
 * @route   PATCH /api/banners/:id/publish
 * @desc    Publish banner
 * @access  Private (Admin)
 */
router.patch("/:id/publish", idValidationRule, publishBanner);

/**
 * @route   PATCH /api/banners/:id/unpublish
 * @desc    Unpublish banner
 * @access  Private (Admin)
 */
router.patch("/:id/unpublish", idValidationRule, unpublishBanner);

/**
 * @route   PATCH /api/banners/priorities
 * @desc    Update banner priorities in bulk
 * @access  Private (Admin)
 */
router.patch("/priorities", 
    [
        body('priorities')
            .isArray({ min: 1 })
            .withMessage('Priorities array is required'),
        body('priorities.*.id')
            .isMongoId()
            .withMessage('Each priority item must have a valid banner ID'),
        body('priorities.*.priority')
            .isInt({ min: 1 })
            .withMessage('Each priority item must have a valid priority number')
    ],
    updateBannerPriority
);

/**
 * @route   GET /api/banners/:id/analytics
 * @desc    Get banner analytics
 * @access  Private (Admin)
 */
router.get("/:id/analytics", 
    [
        idValidationRule,
        query('startDate')
            .optional()
            .isISO8601()
            .withMessage('Start date must be in ISO 8601 format'),
        query('endDate')
            .optional()
            .isISO8601()
            .withMessage('End date must be in ISO 8601 format')
    ],
    getBannerAnalytics
);

/**
 * @route   POST /api/banners/:id/click
 * @desc    Track banner click
 * @access  Public
 */
router.post("/:id/click", idValidationRule, trackBannerClick);

/**
 * @route   POST /api/banners/:id/conversion
 * @desc    Track banner conversion
 * @access  Public
 */
router.post("/:id/conversion", idValidationRule, trackBannerConversion);

/**
 * @route   PATCH /api/banners/bulk-update
 * @desc    Bulk update banners
 * @access  Private (Admin)
 */
router.patch("/bulk-update",
    [
        body('bannerIds')
            .isArray({ min: 1 })
            .withMessage('Banner IDs array is required'),
        body('bannerIds.*')
            .isMongoId()
            .withMessage('Each banner ID must be valid'),
        body('updates')
            .isObject()
            .withMessage('Updates object is required'),
        body('updates.isActive')
            .optional()
            .isBoolean()
            .withMessage('isActive must be boolean'),
        body('updates.isPublished')
            .optional()
            .isBoolean()
            .withMessage('isPublished must be boolean'),
        body('updates.bannerType')
            .optional()
            .isIn(['reward', 'promotion', 'announcement', 'seasonal'])
            .withMessage('Banner type must be valid')
    ],
    bulkUpdateBanners
);

module.exports = router;
