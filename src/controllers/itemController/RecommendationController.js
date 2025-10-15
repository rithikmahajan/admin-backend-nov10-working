const { ApiResponse } = require("../../utils/ApiResponse");
const Item = require("../../models/Item");

/**
 * Update recommendation settings for a product
 */
const updateRecommendationSettings = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { alsoShowInOptions } = req.body;

    // Validate item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json(ApiResponse(null, "Product not found", false, 404));
    }

    // Update recommendation settings
    const updatedItem = await Item.findByIdAndUpdate(
      itemId,
      {
        alsoShowInOptions: {
          ...item.alsoShowInOptions,
          ...alsoShowInOptions
        }
      },
      { new: true, runValidators: true }
    );

    res.status(200).json(
      ApiResponse(
        updatedItem.alsoShowInOptions,
        "Recommendation settings updated successfully",
        true,
        200
      )
    );
  } catch (error) {
    console.error("Update recommendation settings error:", error);
    res.status(500).json(
      ApiResponse(null, "Failed to update recommendation settings", false, 500, error.message)
    );
  }
};

/**
 * Get recommendation settings for a product
 */
const getRecommendationSettings = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findById(itemId).select('alsoShowInOptions productName');
    if (!item) {
      return res.status(404).json(ApiResponse(null, "Product not found", false, 404));
    }

    res.status(200).json(
      ApiResponse(
        {
          itemId: item._id,
          productName: item.productName,
          alsoShowInOptions: item.alsoShowInOptions || {
            similarItems: { enabled: false, placement: "default", items: [] },
            othersAlsoBought: { enabled: false, placement: "default", items: [] },
            youMightAlsoLike: { enabled: false, placement: "default", items: [] },
            customOptions: []
          }
        },
        "Recommendation settings retrieved successfully",
        true,
        200
      )
    );
  } catch (error) {
    console.error("Get recommendation settings error:", error);
    res.status(500).json(
      ApiResponse(null, "Failed to get recommendation settings", false, 500, error.message)
    );
  }
};

/**
 * Update product management settings (status, visibility, etc.)
 */
const updateProductManagementSettings = async (req, res) => {
  try {
    const { itemId } = req.params;
    const updateData = req.body;

    // Validate item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json(ApiResponse(null, "Product not found", false, 404));
    }

    // Filter allowed fields for product management
    const allowedFields = [
      'isActive',
      'displayOrder',
      'isReviewDisplayEnabled',
      'isReviewSubmissionEnabled',
      'returnable',
      'status'
    ];

    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData.hasOwnProperty(field)) {
        filteredData[field] = updateData[field];
      }
    }

    // Update product
    const updatedItem = await Item.findByIdAndUpdate(
      itemId,
      filteredData,
      { new: true, runValidators: true }
    );

    res.status(200).json(
      ApiResponse(
        {
          itemId: updatedItem._id,
          productName: updatedItem.productName,
          settings: {
            isActive: updatedItem.isActive,
            displayOrder: updatedItem.displayOrder,
            isReviewDisplayEnabled: updatedItem.isReviewDisplayEnabled,
            isReviewSubmissionEnabled: updatedItem.isReviewSubmissionEnabled,
            returnable: updatedItem.returnable,
            status: updatedItem.status
          }
        },
        "Product management settings updated successfully",
        true,
        200
      )
    );
  } catch (error) {
    console.error("Update product management settings error:", error);
    res.status(500).json(
      ApiResponse(null, "Failed to update product management settings", false, 500, error.message)
    );
  }
};

/**
 * Get product management settings
 */
const getProductManagementSettings = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findById(itemId).select(
      'productName isActive displayOrder isReviewDisplayEnabled isReviewSubmissionEnabled returnable status'
    );
    
    if (!item) {
      return res.status(404).json(ApiResponse(null, "Product not found", false, 404));
    }

    res.status(200).json(
      ApiResponse(
        {
          itemId: item._id,
          productName: item.productName,
          settings: {
            isActive: item.isActive,
            displayOrder: item.displayOrder,
            isReviewDisplayEnabled: item.isReviewDisplayEnabled,
            isReviewSubmissionEnabled: item.isReviewSubmissionEnabled,
            returnable: item.returnable,
            status: item.status
          }
        },
        "Product management settings retrieved successfully",
        true,
        200
      )
    );
  } catch (error) {
    console.error("Get product management settings error:", error);
    res.status(500).json(
      ApiResponse(null, "Failed to get product management settings", false, 500, error.message)
    );
  }
};

/**
 * Bulk update product settings
 */
const bulkUpdateProductSettings = async (req, res) => {
  try {
    const { itemIds, updateData } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json(ApiResponse(null, "Item IDs are required", false, 400));
    }

    // Filter allowed fields
    const allowedFields = [
      'isActive',
      'displayOrder',
      'isReviewDisplayEnabled',
      'isReviewSubmissionEnabled',
      'returnable',
      'status'
    ];

    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData.hasOwnProperty(field)) {
        filteredData[field] = updateData[field];
      }
    }

    // Bulk update
    const result = await Item.updateMany(
      { _id: { $in: itemIds } },
      filteredData
    );

    res.status(200).json(
      ApiResponse(
        {
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount
        },
        "Bulk product settings updated successfully",
        true,
        200
      )
    );
  } catch (error) {
    console.error("Bulk update product settings error:", error);
    res.status(500).json(
      ApiResponse(null, "Failed to bulk update product settings", false, 500, error.message)
    );
  }
};

module.exports = {
  updateRecommendationSettings,
  getRecommendationSettings,
  updateProductManagementSettings,
  getProductManagementSettings,
  bulkUpdateProductSettings
};
