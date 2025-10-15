const mongoose = require("mongoose");
const ProductRating = require("../../models/ProductRating");
const Item = require("../../models/Item");
const { ApiResponse } = require("../../utils/ApiResponse");

/**
 * Submit Product Detailed Rating
 * @route POST /api/products/:productId/rating
 */
const submitProductRating = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    console.log(`[submitProductRating] Processing rating for productId: ${productId}, userId: ${userId}`);

    // Validate product ID
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json(
        ApiResponse(null, "Invalid product ID", false, 400)
      );
    }

    // Verify product exists
    const product = await Item.findById(productId);
    if (!product) {
      return res.status(404).json(
        ApiResponse(null, "Product not found", false, 404)
      );
    }

    // Extract rating data - support both formats from frontend
    const {
      sizeRating,
      comfortRating,
      durabilityRating,
      size,
      comfort,
      durability
    } = req.body;

    // Convert ratings to 1-5 scale (frontend sometimes sends 0-4 scale)
    let sizeValue, comfortValue, durabilityValue;

    if (sizeRating !== undefined) {
      sizeValue = parseInt(sizeRating);
    } else if (size !== undefined) {
      // Convert 0-4 scale to 1-5 scale
      sizeValue = parseInt(size) + 1;
    }

    if (comfortRating !== undefined) {
      comfortValue = parseInt(comfortRating);
    } else if (comfort !== undefined) {
      // Convert 0-4 scale to 1-5 scale  
      comfortValue = parseInt(comfort) + 1;
    }

    if (durabilityRating !== undefined) {
      durabilityValue = parseInt(durabilityRating);
    } else if (durability !== undefined) {
      // Convert 0-4 scale to 1-5 scale
      durabilityValue = parseInt(durability) + 1;
    }

    // Validate ratings
    if (!sizeValue || !comfortValue || !durabilityValue) {
      return res.status(400).json(
        ApiResponse(null, "Size, comfort, and durability ratings are required", false, 400)
      );
    }

    if ([sizeValue, comfortValue, durabilityValue].some(rating => rating < 1 || rating > 5)) {
      return res.status(400).json(
        ApiResponse(null, "All ratings must be between 1 and 5", false, 400)
      );
    }

    // Check if user has already rated this product
    const existingRating = await ProductRating.findOne({ productId, userId });

    const ratingData = {
      productId,
      userId,
      ratings: {
        size: sizeValue,
        comfort: comfortValue,
        durability: durabilityValue
      }
    };

    let savedRating;
    let isUpdate = false;

    if (existingRating) {
      // Update existing rating
      existingRating.ratings = ratingData.ratings;
      existingRating.updatedAt = new Date();
      savedRating = await existingRating.save();
      isUpdate = true;
      console.log(`[submitProductRating] Updated existing rating for productId: ${productId}`);
    } else {
      // Create new rating
      savedRating = new ProductRating(ratingData);
      await savedRating.save();
      console.log(`[submitProductRating] Created new rating for productId: ${productId}`);
    }

    return res.status(isUpdate ? 200 : 201).json(
      ApiResponse({
        productId: productId,
        ratings: {
          size: sizeValue,
          comfort: comfortValue,
          durability: durabilityValue
        }
      }, `Rating ${isUpdate ? 'updated' : 'submitted'} successfully`, true, isUpdate ? 200 : 201)
    );

  } catch (error) {
    console.error(`[submitProductRating] Server error: ${error.message}`, { stack: error.stack });
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json(
        ApiResponse(null, "You have already rated this product", false, 400)
      );
    }
    
    return res.status(500).json(
      ApiResponse(null, "Server error", false, 500, error.message)
    );
  }
};

/**
 * Get Product Detailed Ratings Statistics
 * @route GET /api/products/:productId/detailed-ratings
 */
const getProductDetailedRatings = async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`[getProductDetailedRatings] Fetching detailed ratings for productId: ${productId}`);

    // Validate product ID
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json(
        ApiResponse(null, "Invalid product ID", false, 400)
      );
    }

    // Verify product exists
    const product = await Item.findById(productId);
    if (!product) {
      return res.status(404).json(
        ApiResponse(null, "Product not found", false, 404)
      );
    }

    // Aggregate rating statistics
    const ratingStats = await ProductRating.aggregate([
      {
        $match: { productId: new mongoose.Types.ObjectId(productId) }
      },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageSize: { $avg: "$ratings.size" },
          averageComfort: { $avg: "$ratings.comfort" },
          averageDurability: { $avg: "$ratings.durability" },
          sizeRatings: { $push: "$ratings.size" },
          comfortRatings: { $push: "$ratings.comfort" },
          durabilityRatings: { $push: "$ratings.durability" }
        }
      }
    ]);

    let responseData;

    if (ratingStats.length === 0) {
      // No ratings yet
      responseData = {
        productId: productId,
        averageRatings: {
          size: 0,
          comfort: 0,
          durability: 0
        },
        totalRatings: 0,
        ratingCounts: {
          size: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
          comfort: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
          durability: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
        }
      };
    } else {
      const stats = ratingStats[0];

      // Calculate rating distribution counts
      const calculateDistribution = (ratings) => {
        const distribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
        ratings.forEach(rating => {
          distribution[rating.toString()] = (distribution[rating.toString()] || 0) + 1;
        });
        return distribution;
      };

      responseData = {
        productId: productId,
        averageRatings: {
          size: parseFloat((stats.averageSize || 0).toFixed(1)),
          comfort: parseFloat((stats.averageComfort || 0).toFixed(1)),
          durability: parseFloat((stats.averageDurability || 0).toFixed(1))
        },
        totalRatings: stats.totalRatings,
        ratingCounts: {
          size: calculateDistribution(stats.sizeRatings),
          comfort: calculateDistribution(stats.comfortRatings),
          durability: calculateDistribution(stats.durabilityRatings)
        }
      };
    }

    console.log(`[getProductDetailedRatings] Retrieved stats for productId: ${productId}, totalRatings: ${responseData.totalRatings}`);

    return res.status(200).json(
      ApiResponse(responseData, "Detailed ratings retrieved successfully", true, 200)
    );

  } catch (error) {
    console.error(`[getProductDetailedRatings] Server error: ${error.message}`, { stack: error.stack });
    return res.status(500).json(
      ApiResponse(null, "Server error", false, 500, error.message)
    );
  }
};

module.exports = {
  submitProductRating,
  getProductDetailedRatings
};
