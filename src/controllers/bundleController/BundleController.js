const ProductBundle = require("../../models/ProductBundle");
const Item = require("../../models/Item");
const Category = require("../../models/Category");
const SubCategory = require("../../models/SubCategory");
const { ApiResponse } = require("../../utils/ApiResponse");
const mongoose = require("mongoose");

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
 * Get all bundles with pagination and filtering
 */
const getAllBundles = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status = 'all',
            categoryId,
            subCategoryId,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const query = {};

        // Filter by status
        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        // Filter by category
        if (categoryId) {
            query['mainProduct.categoryId'] = categoryId;
        }

        // Filter by subcategory
        if (subCategoryId) {
            query['mainProduct.subCategoryId'] = subCategoryId;
        }

        // Search functionality
        if (search) {
            query.$or = [
                { bundleName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { 'mainProduct.productName': { $regex: search, $options: 'i' } }
            ];
        }

        // Check if bundle is currently valid
        const currentDate = new Date();
        query.$and = [
            { validFrom: { $lte: currentDate } },
            {
                $or: [
                    { validUntil: { $exists: false } },
                    { validUntil: null },
                    { validUntil: { $gte: currentDate } }
                ]
            }
        ];

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const bundles = await ProductBundle.find(query)
            .populate('mainProduct.categoryId', 'name')
            .populate('mainProduct.subCategoryId', 'name')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ProductBundle.countDocuments(query);

        const response = {
            bundles,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit),
                hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
                hasPrev: parseInt(page) > 1
            }
        };

        return sendSuccessResponse(res, 200, "Bundles retrieved successfully", response);
    } catch (error) {
        console.error('Error in getAllBundles:', error);
        return sendErrorResponse(res, 500, "Failed to retrieve bundles", error.message);
    }
};

/**
 * Get bundle categories - returns all categories and subcategories for bundling
 */
const getBundleCategories = async (req, res) => {
    try {
        // Get all categories (not just ones with bundles, for creating new bundles)
        const categories = await Category.find({}).select('_id name description imageUrl displayOrder').sort({ displayOrder: 1, name: 1 });

        // Get all subcategories 
        const subcategories = await SubCategory.find({})
        .populate('categoryId', '_id name')
        .select('_id name categoryId displayOrder')
        .sort({ displayOrder: 1, name: 1 });

        const response = {
            categories,
            subcategories
        };

        return sendSuccessResponse(res, 200, "Bundle categories retrieved successfully", response);
    } catch (error) {
        console.error('Error in getBundleCategories:', error);
        return sendErrorResponse(res, 500, "Failed to retrieve bundle categories", error.message);
    }
};

/**
 * Get items that can be bundled - returns items available for selection
 */
const getAvailableItemsForBundles = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            categoryId,
            subCategoryId,
            search,
            excludeItemId
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const query = { 
            status: 'live', // Only show live items
            isActive: true 
        };

        // Note: This endpoint is kept for backward compatibility
        // Frontend should use /api/items/subcategory/:subCategoryId for better performance

        // Exclude specific item (useful when creating bundles)
        if (excludeItemId) {
            query._id = { $ne: excludeItemId };
        }

        // Search functionality
        if (search) {
            query.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const items = await Item.find(query)
            .populate('categoryId', 'name')
            .populate('subCategoryId', 'name')
            .select('_id productName categoryId subCategoryId image price discountPrice status')
            .sort({ productName: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Item.countDocuments(query);

        const response = {
            items,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit),
                hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
                hasPrev: parseInt(page) > 1
            }
        };

        return sendSuccessResponse(res, 200, "Available items retrieved successfully", response);
    } catch (error) {
        console.error('Error in getAvailableItemsForBundles:', error);
        return sendErrorResponse(res, 500, "Failed to retrieve available items", error.message);
    }
};

/**
 * Get bundle by ID
 */
const getBundleById = async (req, res) => {
    try {
        const { id } = req.params;

        const bundle = await ProductBundle.findById(id)
            .populate('mainProduct.categoryId', 'name')
            .populate('mainProduct.subCategoryId', 'name');

        if (!bundle) {
            return sendErrorResponse(res, 404, "Bundle not found");
        }

        return sendSuccessResponse(res, 200, "Bundle retrieved successfully", bundle);
    } catch (error) {
        console.error('Error in getBundleById:', error);
        return sendErrorResponse(res, 500, "Failed to retrieve bundle", error.message);
    }
};

/**
 * Create new bundle
 */
const createBundle = async (req, res) => {
    try {
        const bundleData = req.body;
        
        // Add creator information
        bundleData.createdBy = req.user?.name || req.user?.email || 'admin';
        
        const bundle = new ProductBundle(bundleData);
        const savedBundle = await bundle.save();

        return sendSuccessResponse(res, 201, "Bundle created successfully", savedBundle);
    } catch (error) {
        console.error('Error in createBundle:', error);
        return sendErrorResponse(res, 500, "Failed to create bundle", error.message);
    }
};

/**
 * Update bundle
 */
const updateBundle = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Add updater information
        updateData.updatedBy = req.user?.name || req.user?.email || 'admin';

        const bundle = await ProductBundle.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!bundle) {
            return sendErrorResponse(res, 404, "Bundle not found");
        }

        return sendSuccessResponse(res, 200, "Bundle updated successfully", bundle);
    } catch (error) {
        console.error('Error in updateBundle:', error);
        return sendErrorResponse(res, 500, "Failed to update bundle", error.message);
    }
};

/**
 * Delete bundle
 */
const deleteBundle = async (req, res) => {
    try {
        const { id } = req.params;

        const bundle = await ProductBundle.findByIdAndDelete(id);

        if (!bundle) {
            return sendErrorResponse(res, 404, "Bundle not found");
        }

        return sendSuccessResponse(res, 200, "Bundle deleted successfully");
    } catch (error) {
        console.error('Error in deleteBundle:', error);
        return sendErrorResponse(res, 500, "Failed to delete bundle", error.message);
    }
};

/**
 * Toggle bundle active status
 */
const toggleBundleStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const bundle = await ProductBundle.findById(id);
        if (!bundle) {
            return sendErrorResponse(res, 404, "Bundle not found");
        }

        bundle.isActive = !bundle.isActive;
        bundle.updatedBy = req.user?.name || req.user?.email || 'admin';
        await bundle.save();

        return sendSuccessResponse(res, 200, "Bundle status updated successfully", bundle);
    } catch (error) {
        console.error('Error in toggleBundleStatus:', error);
        return sendErrorResponse(res, 500, "Failed to update bundle status", error.message);
    }
};

/**
 * Get bundles for a specific product (public route)
 */
const getBundlesForProduct = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { limit = 10 } = req.query;

        const currentDate = new Date();
        const bundles = await ProductBundle.find({
            'mainProduct.itemId': itemId,
            isActive: true,
            validFrom: { $lte: currentDate },
            $or: [
                { validUntil: { $exists: false } },
                { validUntil: null },
                { validUntil: { $gte: currentDate } }
            ]
        })
        .sort({ priority: -1 })
        .limit(parseInt(limit));

        return sendSuccessResponse(res, 200, "Product bundles retrieved successfully", bundles);
    } catch (error) {
        console.error('Error in getBundlesForProduct:', error);
        return sendErrorResponse(res, 500, "Failed to retrieve product bundles", error.message);
    }
};

module.exports = {
    getAllBundles,
    getBundleCategories,
    getAvailableItemsForBundles,
    getBundleById,
    createBundle,
    updateBundle,
    deleteBundle,
    toggleBundleStatus,
    getBundlesForProduct
};
