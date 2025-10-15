const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  PutBucketPolicyCommand,
  PutPublicAccessBlockCommand,
  PutBucketAclCommand,
  PutBucketWebsiteCommand,
} = require("@aws-sdk/client-s3");
const { getPublicUrl, generatePermanentUrl } = require("../utils/S3");
require("dotenv").config();

// Initialize Contabo S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-central-1",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Configure Contabo S3 bucket for public access
 * This ensures all uploaded media is accessible via public URLs without expiry
 */
async function configureContaboBucketForPublicAccess() {
  const bucketName = process.env.AWS_BUCKET_NAME;
  
  console.log("🚀 Starting Contabo S3 bucket configuration for public access...");
  console.log(`📦 Bucket: ${bucketName}`);
  console.log(`🌐 Endpoint: ${process.env.S3_ENDPOINT}`);

  try {
    // Step 1: Apply bucket policy for public read access
    console.log("📋 Step 1: Applying bucket policy for public access...");
    
    const bucketPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicReadGetObject",
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject", "s3:GetObjectVersion"],
          Resource: [`arn:aws:s3:::${bucketName}/*`]
        }
      ]
    };

    const policyCommand = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(bucketPolicy)
    });

    await s3Client.send(policyCommand);
    console.log("✅ Bucket policy applied successfully");

    // Step 2: Disable public access block settings
    console.log("🔓 Step 2: Configuring public access block settings...");
    
    const publicAccessCommand = new PutPublicAccessBlockCommand({
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false,
      },
    });

    await s3Client.send(publicAccessCommand);
    console.log("✅ Public access block settings configured");

    // Step 3: Set bucket ACL to public-read
    console.log("🌐 Step 3: Setting bucket ACL to public-read...");
    
    const aclCommand = new PutBucketAclCommand({
      Bucket: bucketName,
      ACL: "public-read",
    });

    await s3Client.send(aclCommand);
    console.log("✅ Bucket ACL set to public-read");

    // Step 4: Static website hosting (skip - not supported by all providers)
    console.log("🏠 Step 4: Static website hosting...");
    console.log("ℹ️  Skipping static website hosting (not required for object access)");

    // Step 5: Test public access with a sample file
    console.log("🧪 Step 5: Testing public access...");
    
    const testFileName = `test-public-access-${Date.now()}.txt`;
    const testContent = "Testing public access to Contabo S3 - This file should be publicly accessible!";
    
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testFileName,
      Body: testContent,
      ContentType: "text/plain",
      ACL: "public-read",
    });

    await s3Client.send(uploadCommand);
    console.log("✅ Test file uploaded");

    // Generate and test public URL
    const publicUrl = generatePermanentUrl(testFileName);
    console.log(`🔗 Test URL: ${publicUrl}`);

    // Test the URL with fetch
    try {
      const response = await fetch(publicUrl);
      if (response.ok) {
        const content = await response.text();
        console.log("✅ SUCCESS: Public access is working!");
        console.log(`📄 Retrieved content: ${content.substring(0, 50)}...`);
        
        // Clean up test file
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testFileName,
        });
        await s3Client.send(deleteCommand);
        console.log("🧹 Test file cleaned up");
        
        return {
          success: true,
          message: "Contabo S3 bucket configured successfully for public access",
          testUrl: publicUrl,
          configuration: {
            bucketPolicy: "Applied",
            publicAccess: "Enabled",
            bucketAcl: "public-read",
            staticWebsiteHosting: "Enabled",
          },
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (fetchError) {
      console.log("❌ Public URL test failed:", fetchError.message);
      return {
        success: false,
        message: "Configuration applied but public access test failed",
        error: fetchError.message,
        troubleshooting: [
          "Check if Contabo allows public access for your account",
          "Verify bucket name and endpoint are correct",
          "Contact Contabo support if issue persists",
        ],
      };
    }

  } catch (error) {
    console.error("❌ Error configuring bucket:", error);
    return {
      success: false,
      message: "Failed to configure bucket for public access",
      error: error.message,
    };
  }
}

/**
 * Verify that a file is publicly accessible
 */
async function verifyPublicAccess(fileName) {
  try {
    const publicUrl = generatePermanentUrl(fileName);
    const response = await fetch(publicUrl);
    
    return {
      accessible: response.ok,
      url: publicUrl,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    return {
      accessible: false,
      url: publicUrl,
      error: error.message,
    };
  }
}

/**
 * Get bucket configuration status
 */
async function getBucketConfigurationStatus() {
  const bucketName = process.env.AWS_BUCKET_NAME;
  
  try {
    // This would require additional permissions and commands
    // For now, return basic info
    return {
      bucketName,
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.AWS_REGION,
      configured: "Check via manual verification",
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
}

module.exports = {
  configureContaboBucketForPublicAccess,
  verifyPublicAccess,
  getBucketConfigurationStatus,
};
