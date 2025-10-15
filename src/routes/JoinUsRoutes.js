const express = require("express");
const { body, param, query } = require("express-validator");
const {
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
} = require("../controllers/joinUsController/joinUsController");

const router = express.Router();

// Common validation rules
const textPositionValidation = () => [
    body("textPosition.x")
        .optional()
        .isNumeric()
        .withMessage("Text position X must be a number")
        .isFloat({ min: 0, max: 100 })
        .withMessage("Text position X must be between 0 and 100"),
    body("textPosition.y")
        .optional()
        .isNumeric()
        .withMessage("Text position Y must be a number")
        .isFloat({ min: 0, max: 100 })
        .withMessage("Text position Y must be between 0 and 100"),
    body("textPosition.fontSize")
        .optional()
        .isInt({ min: 8, max: 72 })
        .withMessage("Font size must be between 8 and 72"),
    body("textPosition.color")
        .optional()
        .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .withMessage("Color must be a valid hex color")
];

const sectionValidation = () => [
    body("section")
        .optional()
        .isIn(["head", "posting", "bottom"])
        .withMessage("Section must be one of: head, posting, bottom")
];

const imageValidation = () => [
    body("image.url")
        .optional()
        .custom((value) => {
            // Allow blob URLs for development and regular URLs for production
            if (!value) return true;
            const isValidUrl = /^https?:\/\//.test(value) || /^blob:/.test(value) || /^data:/.test(value);
            if (!isValidUrl) {
                throw new Error('Image URL must be a valid URL, blob URL, or data URL');
            }
            return true;
        }),
    body("image.publicId")
        .optional()
        .isString()
        .isLength({ min: 1 })
        .withMessage("Image public ID must be a non-empty string"),
    body("image.alt")
        .optional()
        .isString()
        .isLength({ min: 1, max: 200 })
        .withMessage("Image alt text must be between 1 and 200 characters")
];

const seoValidation = () => [
    body("seo.metaTitle")
        .optional()
        .isString()
        .isLength({ min: 1, max: 60 })
        .withMessage("Meta title must be between 1 and 60 characters"),
    body("seo.metaDescription")
        .optional()
        .isString()
        .isLength({ min: 1, max: 160 })
        .withMessage("Meta description must be between 1 and 160 characters"),
    body("seo.keywords")
        .optional()
        .isArray()
        .withMessage("Keywords must be an array"),
    body("seo.keywords.*")
        .optional()
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage("Each keyword must be between 1 and 50 characters")
];

// Validation for creating a new join us post
const createJoinUsPostValidation = [
    body("title")
        .notEmpty()
        .withMessage("Title is required")
        .isLength({ min: 1, max: 200 })
        .withMessage("Title must be between 1 and 200 characters"),
    
    body("detail")
        .notEmpty()
        .withMessage("Detail is required")
        .isLength({ min: 1, max: 2000 })
        .withMessage("Detail must be between 1 and 2000 characters"),
    
    body("priority")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Priority must be a positive integer"),
    
    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be a boolean"),
    
    body("isPublished")
        .optional()
        .isBoolean()
        .withMessage("isPublished must be a boolean"),
    
    body("displaySettings.showOnHomepage")
        .optional()
        .isBoolean()
        .withMessage("showOnHomepage must be a boolean"),
    
    body("displaySettings.animationType")
        .optional()
        .isIn(["fade", "slide", "zoom", "bounce", "none"])
        .withMessage("Animation type must be one of: fade, slide, zoom, bounce, none"),
    
    body("displaySettings.duration")
        .optional()
        .isInt({ min: 1000, max: 30000 })
        .withMessage("Duration must be between 1000 and 30000 milliseconds"),
    
    body("rewardDetails.rewardType")
        .optional()
        .isIn(["points", "discount", "cashback", "gift", "exclusive"])
        .withMessage("Reward type must be one of: points, discount, cashback, gift, exclusive"),
    
    body("rewardDetails.rewardValue")
        .optional()
        .isNumeric()
        .withMessage("Reward value must be a number"),
    
    body("tags")
        .optional()
        .isArray()
        .withMessage("Tags must be an array"),
    
    body("tags.*")
        .optional()
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage("Each tag must be between 1 and 50 characters"),
    
    ...textPositionValidation(),
    ...sectionValidation(),
    ...imageValidation(),
    ...seoValidation()
];

// Validation for updating a join us post
const updateJoinUsPostValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid post ID format"),
    
    body("title")
        .optional()
        .isLength({ min: 1, max: 200 })
        .withMessage("Title must be between 1 and 200 characters"),
    
    body("detail")
        .optional()
        .isLength({ min: 1, max: 2000 })
        .withMessage("Detail must be between 1 and 2000 characters"),
    
    body("priority")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Priority must be a positive integer"),
    
    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be a boolean"),
    
    body("isPublished")
        .optional()
        .isBoolean()
        .withMessage("isPublished must be a boolean"),
    
    ...textPositionValidation(),
    ...sectionValidation(),
    ...imageValidation(),
    ...seoValidation()
];

// Validation for getting posts by section
const getSectionValidation = [
    param("section")
        .isIn(["head", "posting", "bottom"])
        .withMessage("Section must be one of: head, posting, bottom"),
    
    query("limit")
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage("Limit must be between 1 and 50")
];

// Validation for getting posts with pagination
const getPaginationValidation = [
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
    
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
    
    query("sortBy")
        .optional()
        .isIn(["priority", "createdAt", "updatedAt", "title", "section"])
        .withMessage("Sort by must be one of: priority, createdAt, updatedAt, title, section"),
    
    query("sortOrder")
        .optional()
        .isIn(["asc", "desc"])
        .withMessage("Sort order must be asc or desc"),
    
    query("section")
        .optional()
        .isIn(["head", "posting", "bottom"])
        .withMessage("Section must be one of: head, posting, bottom"),
    
    query("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be a boolean"),
    
    query("isPublished")
        .optional()
        .isBoolean()
        .withMessage("isPublished must be a boolean"),
    
    query("approvalStatus")
        .optional()
        .isIn(["pending", "approved", "rejected"])
        .withMessage("Approval status must be one of: pending, approved, rejected"),
    
    query("search")
        .optional()
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage("Search query must be between 1 and 100 characters")
];

// Validation for ID parameters
const idValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid post ID format")
];

// Validation for bulk priority updates
const bulkPriorityValidation = [
    body("priorities")
        .isArray({ min: 1 })
        .withMessage("Priorities must be a non-empty array"),
    
    body("priorities.*.id")
        .isMongoId()
        .withMessage("Each priority item must have a valid post ID"),
    
    body("priorities.*.priority")
        .isInt({ min: 1 })
        .withMessage("Each priority must be a positive integer"),
    
    body("priorities.*.section")
        .optional()
        .isIn(["head", "posting", "bottom"])
        .withMessage("Section must be one of: head, posting, bottom")
];

// Validation for bulk updates
const bulkUpdateValidation = [
    body("postIds")
        .isArray({ min: 1 })
        .withMessage("Post IDs must be a non-empty array"),
    
    body("postIds.*")
        .isMongoId()
        .withMessage("Each post ID must be a valid MongoDB ObjectId"),
    
    body("updates")
        .isObject()
        .withMessage("Updates must be an object"),
    
    body("updates.isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be a boolean"),
    
    body("updates.isPublished")
        .optional()
        .isBoolean()
        .withMessage("isPublished must be a boolean"),
    
    body("updates.approvalStatus")
        .optional()
        .isIn(["pending", "approved", "rejected"])
        .withMessage("Approval status must be one of: pending, approved, rejected")
];

// Routes

// Create a new join us post
router.post("/", createJoinUsPostValidation, createJoinUsPost);

// Get all join us posts with filtering and pagination
router.get("/", getPaginationValidation, getAllJoinUsPosts);

// Get all active posts grouped by section
router.get("/active", getAllActivePosts);

// Get active posts by section
router.get("/section/:section", getSectionValidation, getActivePostsBySection);

// Get post by ID
router.get("/:id", idValidation, getJoinUsPostById);

// Update post
router.put("/:id", updateJoinUsPostValidation, updateJoinUsPost);

// Delete post (soft delete)
router.delete("/:id", idValidation, deleteJoinUsPost);

// Permanently delete post
router.delete("/:id/permanent", idValidation, permanentDeleteJoinUsPost);

// Publish post
router.patch("/:id/publish", idValidation, publishJoinUsPost);

// Unpublish post
router.patch("/:id/unpublish", idValidation, unpublishJoinUsPost);

// Update post priorities in bulk
router.patch("/priorities/bulk", bulkPriorityValidation, updatePostPriorities);

// Get post analytics
router.get("/:id/analytics", idValidation, getJoinUsPostAnalytics);

// Track post click
router.post("/:id/track/click", idValidation, trackJoinUsPostClick);

// Track post conversion
router.post("/:id/track/conversion", idValidation, trackJoinUsPostConversion);

// Bulk update posts
router.patch("/bulk", bulkUpdateValidation, bulkUpdateJoinUsPosts);

module.exports = router;
