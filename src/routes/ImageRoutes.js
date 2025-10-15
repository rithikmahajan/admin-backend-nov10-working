const express = require('express');
const { generateSignedUrl } = require('../utils/S3');
const router = express.Router();

// Endpoint to get/refresh signed URL for an image
router.post('/refresh-image-url', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }
    
    // Extract the S3 key from the URL
    let s3Key;
    if (imageUrl.includes('X-Amz-Algorithm')) {
      // It's already a signed URL, extract the key from the path
      const urlParts = new URL(imageUrl);
      s3Key = urlParts.pathname.substring(1); // Remove leading slash
      // Remove bucket name from the path
      const bucketName = process.env.AWS_BUCKET_NAME;
      if (s3Key.startsWith(`${bucketName}/`)) {
        s3Key = s3Key.substring(bucketName.length + 1);
      }
    } else if (imageUrl.includes(process.env.AWS_BUCKET_NAME)) {
      // It's a direct S3 URL
      const urlParts = new URL(imageUrl);
      const pathParts = urlParts.pathname.split('/');
      const bucketIndex = pathParts.indexOf(process.env.AWS_BUCKET_NAME);
      if (bucketIndex !== -1) {
        s3Key = pathParts.slice(bucketIndex + 1).join('/');
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid image URL format'
      });
    }
    
    if (!s3Key) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract S3 key from URL'
      });
    }
    
    // Generate new signed URL
    const newSignedUrl = await generateSignedUrl(s3Key);
    
    res.json({
      success: true,
      data: {
        originalUrl: imageUrl,
        signedUrl: newSignedUrl,
        s3Key: s3Key,
        expiresIn: '24 hours'
      }
    });
    
  } catch (error) {
    console.error('Error refreshing image URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh image URL',
      error: error.message
    });
  }
});

// Endpoint to get signed URLs for multiple images
router.post('/refresh-multiple-urls', async (req, res) => {
  try {
    const { imageUrls } = req.body;
    
    if (!Array.isArray(imageUrls)) {
      return res.status(400).json({
        success: false,
        message: 'imageUrls must be an array'
      });
    }
    
    const results = await Promise.all(
      imageUrls.map(async (imageUrl) => {
        try {
          // Extract S3 key (same logic as above)
          let s3Key;
          if (imageUrl.includes('X-Amz-Algorithm')) {
            const urlParts = new URL(imageUrl);
            s3Key = urlParts.pathname.substring(1);
            const bucketName = process.env.AWS_BUCKET_NAME;
            if (s3Key.startsWith(`${bucketName}/`)) {
              s3Key = s3Key.substring(bucketName.length + 1);
            }
          } else if (imageUrl.includes(process.env.AWS_BUCKET_NAME)) {
            const urlParts = new URL(imageUrl);
            const pathParts = urlParts.pathname.split('/');
            const bucketIndex = pathParts.indexOf(process.env.AWS_BUCKET_NAME);
            if (bucketIndex !== -1) {
              s3Key = pathParts.slice(bucketIndex + 1).join('/');
            }
          }
          
          if (s3Key) {
            const signedUrl = await generateSignedUrl(s3Key);
            return {
              originalUrl: imageUrl,
              signedUrl: signedUrl,
              success: true
            };
          } else {
            return {
              originalUrl: imageUrl,
              signedUrl: null,
              success: false,
              error: 'Could not extract S3 key'
            };
          }
        } catch (error) {
          return {
            originalUrl: imageUrl,
            signedUrl: null,
            success: false,
            error: error.message
          };
        }
      })
    );
    
    res.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('Error refreshing multiple URLs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh image URLs',
      error: error.message
    });
  }
});

module.exports = router;
