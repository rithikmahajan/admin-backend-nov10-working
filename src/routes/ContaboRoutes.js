const express = require("express");
const router = express.Router();
const {
  configureContaboBucketForPublicAccess,
  verifyPublicAccess,
  getBucketConfigurationStatus,
} = require("../utils/ContaboPublicConfig");
const { generatePermanentUrl, getPublicUrl } = require("../utils/S3");

/**
 * @route POST /api/contabo/configure-public-access
 * @desc Configure Contabo S3 bucket for public access
 * @access Admin only
 */
router.post("/configure-public-access", async (req, res) => {
  try {
    console.log("🚀 Configuring Contabo bucket for public access...");
    
    const result = await configureContaboBucketForPublicAccess();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Contabo S3 bucket configured successfully for public access",
        data: result,
        instructions: [
          "All media files will now be publicly accessible",
          "URLs do not expire - permanent access",
          "Use the S3 utility functions for consistent URL generation",
        ],
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        error: result.error,
        troubleshooting: result.troubleshooting,
      });
    }
  } catch (error) {
    console.error("❌ Error in configure-public-access:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while configuring public access",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/contabo/verify-access/:fileName
 * @desc Verify that a specific file is publicly accessible
 * @access Admin/Public
 */
router.get("/verify-access/:fileName", async (req, res) => {
  try {
    const { fileName } = req.params;
    
    console.log(`🔍 Verifying public access for: ${fileName}`);
    
    const result = await verifyPublicAccess(fileName);
    
    res.status(200).json({
      success: true,
      fileName,
      publicAccess: result,
    });
  } catch (error) {
    console.error("❌ Error verifying access:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying file access",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/contabo/bucket-status
 * @desc Get current bucket configuration status
 * @access Admin
 */
router.get("/bucket-status", async (req, res) => {
  try {
    const status = await getBucketConfigurationStatus();
    
    res.status(200).json({
      success: true,
      bucketStatus: status,
      recommendations: [
        "Ensure bucket policy allows public read access",
        "Verify that public access block settings are disabled",
        "Check that bucket ACL is set to public-read",
        "Test with sample files after configuration",
      ],
    });
  } catch (error) {
    console.error("❌ Error getting bucket status:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving bucket status",
      error: error.message,
    });
  }
});

/**
 * @route POST /api/contabo/generate-public-url
 * @desc Generate public URL for a given file path
 * @access Public
 */
router.post("/generate-public-url", (req, res) => {
  try {
    const { fileName } = req.body;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: "fileName is required",
      });
    }
    
    const publicUrl = generatePermanentUrl(fileName);
    
    res.status(200).json({
      success: true,
      fileName,
      publicUrl,
      permanent: true,
      expires: "Never (as long as file exists)",
    });
  } catch (error) {
    console.error("❌ Error generating public URL:", error);
    res.status(500).json({
      success: false,
      message: "Error generating public URL",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/contabo/test-upload
 * @desc Test upload and public access functionality
 * @access Admin
 */
router.get("/test-upload", async (req, res) => {
  try {
    const { uploadMultipart, setObjectPublicACL } = require("../utils/S3");
    
    // Create a test file
    const testContent = `Test upload at ${new Date().toISOString()}`;
    const testFile = {
      originalname: "test-upload.txt",
      mimetype: "text/plain",
      buffer: Buffer.from(testContent),
    };
    
    console.log("🧪 Testing upload and public access...");
    
    // Upload the test file
    const publicUrl = await uploadMultipart(testFile, "test", "contabo-test");
    
    // Verify public access
    const verification = await verifyPublicAccess(publicUrl.split('/').pop());
    
    res.status(200).json({
      success: true,
      message: "Test upload completed",
      testFile: {
        name: testFile.originalname,
        publicUrl,
        verification,
      },
      instructions: [
        "This test verifies that uploads work correctly",
        "The generated URL should be publicly accessible",
        "No authentication required for accessing the URL",
      ],
    });
  } catch (error) {
    console.error("❌ Error in test upload:", error);
    res.status(500).json({
      success: false,
      message: "Test upload failed",
      error: error.message,
    });
  }
});

module.exports = router;
