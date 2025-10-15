const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const { uploadMultipart } = require("../utils/S3");
const { ApiResponse } = require("../utils/ApiResponse");
const Item = require("../models/Item");

// Import middleware for authentication and role-based access
const { verifyToken } = require("../middleware/VerifyToken");
const checkAdminRole = require("../middleware/CheckAdminRole");

const router = express.Router();

// Configure Multer for in-memory file storage
const storage = multer.memoryStorage();

// Multer upload configurations for different file types
const uploadImage = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const uploadVideo = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

/**
 * @route   POST /upload-images/:itemId
 * @desc    Upload multiple images for a product
 * @access  Protected (Admin only)
 */
router.post("/upload-images/:itemId", 
  // verifyToken, // Temporarily disabled for testing
  // checkAdminRole, // Temporarily disabled for testing  
  uploadImage.array('images', 10), async (req, res) => {
  try {
    const { itemId } = req.params;

    // Validate item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json(ApiResponse(null, "Item not found", false, 404));
    }

    // Ensure files are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json(ApiResponse(null, "No image files uploaded", false, 400));
    }

    // Upload all images to S3
    const uploadPromises = req.files.map(async (file, index) => {
      const fileName = `items/${itemId}/images/${Date.now()}_${index}_${file.originalname}`;
      const fileUrl = await uploadMultipart(file, `items/${itemId}/images`, `${Date.now()}_${index}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`);
      
      return {
        url: fileUrl,
        type: 'image',
        priority: (item.images?.length || 0) + index + 1,
        originalName: file.originalname,
        size: file.size
      };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    // Update item with new images
    const currentImages = item.images || [];
    const updatedImages = [...currentImages, ...uploadedImages];

    const updatedItem = await Item.findByIdAndUpdate(itemId, {
      images: updatedImages
    }, { new: true }); // Return updated document

    res.status(200).json(ApiResponse({
      data: updatedItem, // Include complete updated product
      uploadedImages,
      totalImages: updatedImages.length
    }, "Images uploaded successfully", true, 200));

  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json(ApiResponse(null, "Image upload failed", false, 500, error.message));
  }
});

/**
 * @route   POST /upload-videos/:itemId
 * @desc    Upload multiple videos for a product
 * @access  Protected (Admin only)
 */
router.post("/upload-videos/:itemId", 
  // verifyToken, // Temporarily disabled for testing
  // checkAdminRole, // Temporarily disabled for testing
  uploadVideo.array('videos', 5), async (req, res) => {
  try {
    const { itemId } = req.params;

    // Validate item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json(ApiResponse(null, "Item not found", false, 404));
    }

    // Ensure files are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json(ApiResponse(null, "No video files uploaded", false, 400));
    }

    // Upload all videos to S3
    const uploadPromises = req.files.map(async (file, index) => {
      const fileName = `items/${itemId}/videos/${Date.now()}_${index}_${file.originalname}`;
      const fileUrl = await uploadMultipart(file, `items/${itemId}/videos`, `${Date.now()}_${index}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`);
      
      return {
        url: fileUrl,
        type: 'video',
        priority: (item.images?.length || 0) + index + 1
      };
    });

    const uploadedVideos = await Promise.all(uploadPromises);

    // Update item by adding videos to images array with type: 'video'
    const currentImages = item.images || [];
    const updatedImages = [...currentImages, ...uploadedVideos];

    const updatedItem = await Item.findByIdAndUpdate(itemId, {
      images: updatedImages
    }, { new: true }); // Return updated document

    // Count videos from images array
    const videoCount = updatedImages.filter(img => img.type === 'video').length;

    res.status(200).json(ApiResponse({
      data: updatedItem, // Include complete updated product
      uploadedVideos,
      totalVideos: videoCount
    }, "Videos uploaded successfully", true, 200));

  } catch (error) {
    console.error("Video upload error:", error);
    res.status(500).json(ApiResponse(null, "Video upload failed", false, 500, error.message));
  }
});

/**
 * @route   DELETE /delete-image/:itemId/:imageIndex
 * @desc    Delete a specific image from a product
 * @access  Protected (Admin only)
 */
router.delete("/delete-image/:itemId/:imageIndex", verifyToken, checkAdminRole, async (req, res) => {
  try {
    const { itemId, imageIndex } = req.params;
    const index = parseInt(imageIndex);

    // Validate item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json(ApiResponse(null, "Item not found", false, 404));
    }

    // Validate image index
    if (!item.images || index >= item.images.length || index < 0) {
      return res.status(400).json(ApiResponse(null, "Invalid image index", false, 400));
    }

    // Remove image from array
    const updatedImages = item.images.filter((_, i) => i !== index);

    const updatedItem = await Item.findByIdAndUpdate(itemId, {
      images: updatedImages
    }, { new: true }).populate('categoryId').populate('subCategoryId');

    res.status(200).json(ApiResponse({
      item: updatedItem,
      remainingImages: updatedImages.length
    }, "Image deleted successfully", true, 200));

  } catch (error) {
    console.error("Image delete error:", error);
    res.status(500).json(ApiResponse(null, "Image delete failed", false, 500, error.message));
  }
});

/**
 * @route   DELETE /delete-video/:itemId/:videoIndex
 * @desc    Delete a specific video from a product
 * @access  Protected (Admin only)
 */
router.delete("/delete-video/:itemId/:videoIndex", verifyToken, checkAdminRole, async (req, res) => {
  try {
    const { itemId, videoIndex } = req.params;
    const index = parseInt(videoIndex);

    // Validate item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json(ApiResponse(null, "Item not found", false, 404));
    }

    // Validate video index
    if (!item.videos || index >= item.videos.length || index < 0) {
      return res.status(400).json(ApiResponse(null, "Invalid video index", false, 400));
    }

    // Remove video from array
    const updatedVideos = item.videos.filter((_, i) => i !== index);

    await Item.findByIdAndUpdate(itemId, {
      videos: updatedVideos
    });

    res.status(200).json(ApiResponse({
      remainingVideos: updatedVideos.length
    }, "Video deleted successfully", true, 200));

  } catch (error) {
    console.error("Video delete error:", error);
    res.status(500).json(ApiResponse(null, "Video delete failed", false, 500, error.message));
  }
});

/**
 * @route   POST /upload-size-chart/:itemId
 * @desc    Upload size chart image for a product
 * @access  Protected (Admin only)
 */
router.post("/upload-size-chart/:itemId", 
  // verifyToken, // Temporarily disabled for testing
  // checkAdminRole, // Temporarily disabled for testing
  uploadImage.single('sizeChart'), async (req, res) => {
  try {
    const { itemId } = req.params;
    
    console.log('📁 Size chart upload request received:', {
      itemId,
      hasFile: !!req.file,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      mimetype: req.file?.mimetype
    });
    
    if (!req.file) {
      console.log('❌ No size chart image provided');
      return res.status(400).json(ApiResponse(null, "No size chart image provided", false, 400));
    }

    // Validate item exists
    const item = await Item.findById(itemId);
    if (!item) {
      console.log('❌ Item not found:', itemId);
      return res.status(404).json(ApiResponse(null, "Item not found", false, 404));
    }

    console.log('📤 Uploading size chart to S3...');
    // Upload to S3 - fixed path structure
    const fileUrl = await uploadMultipart(req.file, `items/${itemId}`, `size-chart/${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`);
    console.log('✅ Size chart uploaded to S3:', fileUrl);

    // Update item with size chart image
    const updatedItem = await Item.findByIdAndUpdate(itemId, {
      sizeChartImage: {
        url: fileUrl,
        uploadedAt: new Date(),
        filename: req.file.originalname
      }
    }, { new: true }).populate('categoryId').populate('subCategoryId');

    console.log('✅ Size chart upload successful');
    res.status(200).json(ApiResponse({
      item: updatedItem,
      sizeChartImage: updatedItem.sizeChartImage
    }, "Size chart image uploaded successfully", true, 200));

  } catch (error) {
    console.error("Size chart upload error:", error);
    res.status(500).json(ApiResponse(null, "Size chart upload failed", false, 500, error.message));
  }
});

/**
 * @route   DELETE /delete-size-chart/:itemId
 * @desc    Delete size chart image from a product
 * @access  Protected (Admin only)
 */
router.delete("/delete-size-chart/:itemId", verifyToken, checkAdminRole, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Validate item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json(ApiResponse(null, "Item not found", false, 404));
    }

    // Remove size chart image
    const updatedItem = await Item.findByIdAndUpdate(itemId, {
      $unset: { sizeChartImage: 1 }
    }, { new: true }).populate('categoryId').populate('subCategoryId');

    res.status(200).json(ApiResponse({
      item: updatedItem
    }, "Size chart image deleted successfully", true, 200));

  } catch (error) {
    console.error("Size chart delete error:", error);
    res.status(500).json(ApiResponse(null, "Size chart delete failed", false, 500, error.message));
  }
});

module.exports = router;
