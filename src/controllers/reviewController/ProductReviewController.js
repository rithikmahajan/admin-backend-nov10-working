const mongoose = require("mongoose");
const Item = require("../../models/Item");
const User = require("../../models/User");
const { ApiResponse } = require("../../utils/ApiResponse");

/**
 * Get Product Reviews - Frontend Compatible Format
 * @route GET /api/products/:productId/reviews
 */
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 20, page = 1, rating } = req.query;

    console.log(`[getProductReviews] Fetching reviews for productId: ${productId}`);

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json(
        ApiResponse(null, "Invalid product ID", false, 400)
      );
    }

    const product = await Item.findById(productId).populate("reviews.user", "name email");
    if (!product) {
      return res.status(404).json(
        ApiResponse(null, "Product not found", false, 404)
      );
    }

    let reviews = product.reviews || [];

    // Filter by rating if specified
    if (rating && parseInt(rating) >= 1 && parseInt(rating) <= 5) {
      reviews = reviews.filter(review => review.rating === parseInt(rating));
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedReviews = reviews.slice(startIndex, endIndex);

    // Format reviews to match frontend expectations
    const formattedReviews = paginatedReviews.map(review => ({
      id: review._id.toString(),
      _id: review._id.toString(),
      userId: review.user?._id?.toString() || 'anonymous',
      userName: review.user?.name || 'Anonymous User',
      name: review.user?.name || 'Anonymous User',
      rating: review.rating,
      title: review.title || '', // Optional title
      comment: review.reviewText || review.comment || '',
      content: review.reviewText || review.comment || '',
      reviewText: review.reviewText || review.comment || '',
      helpful: review.helpful || 0,
      helpfulCount: review.helpful || 0,
      verified: review.verified || true,
      isVerified: review.verified || true,
      hasPhotos: review.photos && review.photos.length > 0,
      photos: review.photos || [],
      
      // Add detailed ratings
      size: review.size,
      comfort: review.comfort,
      durability: review.durability,
      detailedRatingsSubmitted: review.detailedRatingsSubmitted || false,
      
      createdAt: review.createdAt || review.date || new Date(),
      date: review.createdAt || review.date || new Date()
    }));

    const totalReviews = reviews.length;
    const totalPages = Math.ceil(totalReviews / parseInt(limit));

    console.log(`[getProductReviews] Retrieved ${formattedReviews.length} reviews for productId: ${productId}`);

    return res.status(200).json(
      ApiResponse({
        reviews: formattedReviews,
        totalReviews,
        currentPage: parseInt(page),
        totalPages
      }, "Reviews retrieved successfully", true, 200)
    );

  } catch (error) {
    console.error(`[getProductReviews] Server error: ${error.message}`, { stack: error.stack });
    return res.status(500).json(
      ApiResponse(null, "Server error", false, 500, error.message)
    );
  }
};

/**
 * Get Product Rating Statistics - Frontend Compatible Format
 * @route GET /api/products/:productId/rating-stats
 */
const getProductRatingStats = async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`[getProductRatingStats] Fetching rating stats for productId: ${productId}`);

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json(
        ApiResponse(null, "Invalid product ID", false, 400)
      );
    }

    const product = await Item.findById(productId);
    if (!product) {
      return res.status(404).json(
        ApiResponse(null, "Product not found", false, 404)
      );
    }

    const reviews = product.reviews || [];
    const totalReviews = reviews.length;

    // Calculate average rating
    const averageRating = totalReviews > 0 
      ? parseFloat((reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1))
      : 0;

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating]++;
      }
    });

    // Calculate recommendation percentage (ratings 4 and 5 are considered positive)
    const positiveReviews = ratingDistribution[4] + ratingDistribution[5];
    const recommendationPercentage = totalReviews > 0 
      ? Math.round((positiveReviews / totalReviews) * 100)
      : 0;

    console.log(`[getProductRatingStats] Stats calculated for productId: ${productId}, averageRating: ${averageRating}`);

    return res.status(200).json(
      ApiResponse({
        averageRating,
        totalReviews,
        recommendationPercentage,
        ratingDistribution
      }, "Rating statistics retrieved successfully", true, 200)
    );

  } catch (error) {
    console.error(`[getProductRatingStats] Server error: ${error.message}`, { stack: error.stack });
    return res.status(500).json(
      ApiResponse(null, "Server error", false, 500, error.message)
    );
  }
};

/**
 * Submit Product Review - Frontend Compatible Format
 * @route POST /api/products/:productId/reviews
 */
const submitProductReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment, title, images, size, comfort, durability, detailedRatingsSubmitted } = req.body;

    console.log(`[submitProductReview] Processing review submission for productId: ${productId}`, {
      rating,
      hasComment: !!comment,
      hasTitle: !!title,
      imageCount: images ? images.length : 0
    });

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment is required"
      });
    }

    const product = await Item.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check if user has already reviewed this product
    const existingReview = product.reviews.find(
      review => review.user?.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product"
      });
    }

    // Get user information
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Handle image uploads if provided
    let photoUrls = [];
    if (images && Array.isArray(images) && images.length > 0) {
      console.log(`[submitProductReview] Processing ${images.length} images for upload`);
      
      // Filter out local file paths and only keep valid URLs or base64 strings
      photoUrls = images
        .filter(img => img && typeof img === 'string' && !img.startsWith('file://'))
        .slice(0, 2); // Limit to 2 images as per frontend requirement
      
      console.log(`[submitProductReview] ${photoUrls.length} valid images processed for review`);
    }

    // Create new review with detailed ratings
    const newReview = {
      user: req.user._id,
      rating: parseInt(rating),
      reviewText: comment,
      title: title || '',
      helpful: 0,
      verified: true,
      photos: photoUrls, // Store the image URLs/base64 strings
      
      // Add detailed ratings if provided (convert 1-5 scale to 0-4 scale)
      size: size !== undefined ? Math.max(0, Math.min(4, parseInt(size) - 1)) : undefined,
      comfort: comfort !== undefined ? Math.max(0, Math.min(4, parseInt(comfort) - 1)) : undefined,
      durability: durability !== undefined ? Math.max(0, Math.min(4, parseInt(durability) - 1)) : undefined,
      detailedRatingsSubmitted: detailedRatingsSubmitted || false,
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    product.reviews.push(newReview);
    product.markModified("reviews");

    // Update average rating
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    product.averageRating = product.reviews.length > 0
      ? parseFloat((totalRating / product.reviews.length).toFixed(2))
      : 0;

    await product.save();

    // Get the newly added review (it will have an _id after saving)
    const savedReview = product.reviews[product.reviews.length - 1];

    // Format response to match frontend expectations
    const formattedReview = {
      id: savedReview._id.toString(),
      _id: savedReview._id.toString(),
      userId: req.user._id.toString(),
      userName: user.name || 'Anonymous User',
      rating: savedReview.rating,
      comment: savedReview.reviewText,
      title: savedReview.title,
      images: savedReview.photos || [], // Include images in response
      helpful: 0,
      verified: true,
      size: savedReview.size !== undefined ? savedReview.size + 1 : undefined, // Convert back to 1-5 scale for response
      comfort: savedReview.comfort !== undefined ? savedReview.comfort + 1 : undefined,
      durability: savedReview.durability !== undefined ? savedReview.durability + 1 : undefined,
      detailedRatingsSubmitted: savedReview.detailedRatingsSubmitted,
      createdAt: savedReview.createdAt
    };

    console.log(`[submitProductReview] Review submitted successfully for productId: ${productId}`);

    // Frontend expects this exact format
    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      reviewId: savedReview._id.toString(),
      review: formattedReview
    });

  } catch (error) {
    console.error(`[submitProductReview] Server error: ${error.message}`, { 
      stack: error.stack,
      productId,
      userId: req.user?._id,
      requestBody: req.body
    });
    return res.status(500).json({
      success: false,
      message: "Failed to submit review. Please try again later.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Mark Review as Helpful - Frontend Compatible Format
 * @route POST /api/reviews/:reviewId/helpful
 */
const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    console.log(`[markReviewHelpful] Processing helpful vote for reviewId: ${reviewId}`);

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json(
        ApiResponse(null, "Invalid review ID", false, 400)
      );
    }

    // Find the product that contains this review
    const product = await Item.findOne({ "reviews._id": reviewId });
    if (!product) {
      return res.status(404).json(
        ApiResponse(null, "Review not found", false, 404)
      );
    }

    // Find the specific review
    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json(
        ApiResponse(null, "Review not found", false, 404)
      );
    }

    // Initialize helpful users array if it doesn't exist
    if (!review.helpfulUsers) {
      review.helpfulUsers = [];
    }

    // Check if user has already marked this review as helpful
    const hasAlreadyMarkedHelpful = review.helpfulUsers.some(
      userId => userId.toString() === req.user._id.toString()
    );

    if (hasAlreadyMarkedHelpful) {
      return res.status(400).json(
        ApiResponse(null, "You have already marked this review as helpful", false, 400)
      );
    }

    // Add user to helpful users and increment count
    review.helpfulUsers.push(req.user._id);
    review.helpful = (review.helpful || 0) + 1;

    product.markModified("reviews");
    await product.save();

    console.log(`[markReviewHelpful] Review marked as helpful, new count: ${review.helpful}`);

    return res.status(200).json(
      ApiResponse({
        reviewId: reviewId,
        newHelpfulCount: review.helpful
      }, "Review marked as helpful", true, 200)
    );

  } catch (error) {
    console.error(`[markReviewHelpful] Server error: ${error.message}`, { stack: error.stack });
    return res.status(500).json(
      ApiResponse(null, "Server error", false, 500, error.message)
    );
  }
};

module.exports = {
  getProductReviews,
  getProductRatingStats,
  submitProductReview,
  markReviewHelpful
};
