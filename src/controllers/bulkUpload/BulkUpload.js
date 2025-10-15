const Item = require("../../models/Item");
// Note: ItemDetails functionality is now merged into Item model
const SubCategory = require("../../models/SubCategory");
const { bulkUploadFilesToS3, parseImageFilename, cleanupFailedUploads } = require("../../utils/S3");
const { ApiResponse } = require("../../utils/ApiResponse");
const mongoose = require("mongoose");

/**
 * Bulk upload items with primary images
 */
exports.bulkUploadItems = async (req, res) => {
  console.log("Starting bulkUploadItems controller");

  try {
    // Check if JSON file is provided
    console.log("Checking for JSON file in req.files");
    if (!req.files || !req.files.jsonFile || req.files.jsonFile.length === 0) {
      console.error("No JSON file provided");
      return res.status(400).json(ApiResponse(null, "JSON file is required", false, 400));
    }
    console.log("JSON file found:", req.files.jsonFile[0].originalname);

    // Parse JSON file
    const jsonFile = req.files.jsonFile[0];
    let itemsData;
    try {
      console.log("Parsing JSON file");
      itemsData = JSON.parse(jsonFile.buffer.toString());
      if (!Array.isArray(itemsData)) {
        console.error("JSON is not an array");
        return res.status(400).json(ApiResponse(null, "JSON must be an array of items", false, 400));
      }
      console.log(`Parsed ${itemsData.length} items from JSON`);
    } catch (error) {
      console.error("Failed to parse JSON:", error.message);
      return res.status(400).json(ApiResponse(null, "Invalid JSON format", false, 400, error.message));
    }

    const media = req.files.media || []; // Changed from "images" to "media"
    console.log(`Found ${media.length} images`, media.map(img => img.originalname));

    const results = {
      successful: [],
      failed: [],
    };

    // Process items sequentially
    console.log("Starting item processing");
    for (const itemData of itemsData) {
      console.log(`Processing item with itemId: ${itemData.itemId || "unknown"}`);
      let newItemId = null;
      let uploadedUrls = [];
      try {
        // Validate required fields
        console.log("Validating required fields");
        if (!itemData.itemId || (!itemData.productName && !itemData.name) || !itemData.subCategoryId || !itemData.categoryId) {
          throw new Error("Missing required fields: itemId, productName (or name), subCategoryId, categoryId");
        }

        // Validate filters format
        console.log("Validating filters format");
        if (itemData.filters) {
          if (!Array.isArray(itemData.filters)) {
            throw new Error("Filters must be an array of objects");
          }
          for (const filter of itemData.filters) {
            if (!filter || typeof filter !== "object" || !filter.key || !filter.value) {
              throw new Error("Each filter must be an object with 'key' and 'value'");
            }
          }
        }

        // Check for duplicate itemId
        console.log("Checking for duplicate itemId");
        const existingItem = await Item.findOne({ itemId: itemData.itemId });
        if (existingItem) {
          throw new Error(`Duplicate itemId: ${itemData.itemId}`);
        }

        // Verify subCategoryId and categoryId
        console.log("Verifying subCategoryId and categoryId");
        const subCategory = await SubCategory.findOne({
          _id: itemData.subCategoryId,
          categoryId: itemData.categoryId,
        });
        if (!subCategory) {
          throw new Error(`Invalid subCategoryId: ${itemData.subCategoryId} or categoryId: ${itemData.categoryId}`);
        }

        // Generate new item ID
        newItemId = new mongoose.Types.ObjectId();
        console.log(`Generated new item ID: ${newItemId}`);

        // Create item
        console.log("Creating new Item document");
        const newItem = new Item({
          _id: newItemId,
          itemId: itemData.itemId,
          productId: itemData.itemId, // Add productId for compatibility with existing indexes
          
          // Use new fields or fall back to legacy fields
          productName: itemData.productName || itemData.name,
          title: itemData.title || itemData.productName || itemData.name,
          description: itemData.description || '',
          manufacturingDetails: itemData.manufacturingDetails || '',
          shippingAndReturns: itemData.shippingAndReturns || '',
          returnable: itemData.returnable !== undefined ? Boolean(itemData.returnable) : true,
          
          // Platform pricing structure
          platformPricing: {
            yoraa: {
              enabled: true,
              price: Number(itemData.price || 0),
              salePrice: Number(itemData.discountPrice || itemData.salePrice || 0)
            },
            myntra: {
              enabled: itemData.platformPricing?.myntra?.enabled || false,
              price: Number(itemData.platformPricing?.myntra?.price || itemData.price || 0),
              salePrice: Number(itemData.platformPricing?.myntra?.salePrice || itemData.discountPrice || 0)
            },
            amazon: {
              enabled: itemData.platformPricing?.amazon?.enabled || false,
              price: Number(itemData.platformPricing?.amazon?.price || itemData.price || 0),
              salePrice: Number(itemData.platformPricing?.amazon?.salePrice || itemData.discountPrice || 0)
            },
            flipkart: {
              enabled: itemData.platformPricing?.flipkart?.enabled || false,
              price: Number(itemData.platformPricing?.flipkart?.price || itemData.price || 0),
              salePrice: Number(itemData.platformPricing?.flipkart?.salePrice || itemData.discountPrice || 0)
            },
            nykaa: {
              enabled: itemData.platformPricing?.nykaa?.enabled || false,
              price: Number(itemData.platformPricing?.nykaa?.price || itemData.price || 0),
              salePrice: Number(itemData.platformPricing?.nykaa?.salePrice || itemData.discountPrice || 0)
            }
          },
          
          // Categories
          subCategoryId: itemData.subCategoryId,
          categoryId: itemData.categoryId,
          
          // Size and stock management
          stockSizeOption: itemData.stockSizeOption || 'sizes',
          sizes: itemData.sizes ? itemData.sizes.map(size => ({
            size: size.size,
            quantity: parseInt(size.quantity) || 0,
            stock: parseInt(size.stock) || parseInt(size.quantity) || 0,
            hsnCode: size.hsnCode || '',
            sku: size.sku || `${itemData.categoryId}/${itemData.subCategoryId}/${itemData.productName || itemData.name}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(new Date().getDate()).padStart(2, '0')}/${Math.random().toString().slice(2, 10)}`,
            barcode: size.barcode || '',
            regularPrice: Number(size.regularPrice || itemData.price || 0),
            salePrice: Number(size.salePrice || itemData.discountPrice || 0),
            // Measurements
            fitWaistCm: size.fitWaistCm || 0,
            inseamLengthCm: size.inseamLengthCm || 0,
            chestCm: size.chestCm || 0,
            frontLengthCm: size.frontLengthCm || 0,
            acrossShoulderCm: size.acrossShoulderCm || 0,
            toFitWaistIn: size.toFitWaistIn || 0,
            inseamLengthIn: size.inseamLengthIn || 0,
            chestIn: size.chestIn || 0,
            frontLengthIn: size.frontLengthIn || 0,
            acrossShoulderIn: size.acrossShoulderIn || 0,
            metaTitle: size.metaTitle || '',
            metaDescription: size.metaDescription || '',
            slugUrl: size.slugUrl || ''
          })) : [],
          
          // Variants
          variants: itemData.variants || [],
          
          // Additional options
          alsoShowInOptions: itemData.alsoShowInOptions || {},
          sizeChart: itemData.sizeChart || {},
          commonSizeChart: itemData.commonSizeChart || {},
          filters: itemData.filters || [],
          tags: itemData.tags || [],
          
          // Status and scheduling
          status: itemData.status || 'draft',
          scheduledDate: itemData.scheduledDate || '',
          scheduledTime: itemData.scheduledTime || '',
          publishAt: itemData.publishAt ? new Date(itemData.publishAt) : null,
          publishingOptions: itemData.publishingOptions || {},
          
          // Meta data
          metaTitle: itemData.metaTitle || itemData.productName || itemData.name,
          metaDescription: itemData.metaDescription || itemData.description || '',
          slugUrl: itemData.slugUrl || (itemData.productName || itemData.name).toLowerCase().replace(/\s+/g, '-'),
          
          
          // Status flags
          isActive: itemData.isActive !== undefined ? Boolean(itemData.isActive) : true,
          isDeleted: false
        });

        try {
          await newItem.save();
          console.log(`Saved Item document: ${newItemId}`);
        } catch (validationError) {
          console.error(`Validation error for item ${itemData.itemId}:`, validationError.message);
          throw new Error(`Item validation failed: ${validationError.message}`);
        }

        // Filter primary images for this item
        console.log("Filtering primary images for item");
        const itemImages = media.filter((img) => { // Changed from "images" to "media"
          const parsed = parseImageFilename(img.originalname);
          console.log(`Parsed filename ${img.originalname}:`, parsed);
          const matches = parsed && parsed.productId.toUpperCase() === itemData.itemId.toUpperCase() && parsed.isPrimary;
          if (!matches) {
            console.log(`Image ${img.originalname} does not match productId ${itemData.itemId} or is not primary`, parsed);
          }
          return matches;
        });
        console.log(`Found ${itemImages.length} primary images for item ${itemData.itemId}`, itemImages.map(img => img.originalname));

        // Require at least one primary image
        if (itemImages.length === 0) {
          throw new Error(`No primary image found for productId: ${itemData.itemId}`);
        }

        // Upload images in bulk
        const folder = `categories/${itemData.categoryId}/${itemData.subCategoryId}`;
        console.log(`Uploading images to S3 folder: ${folder}`);
        const startTime = Date.now();
        const uploadResults = await bulkUploadFilesToS3(itemImages, folder, newItemId.toString());
        console.log(`Bulk upload completed in ${(Date.now() - startTime) / 1000} seconds`);

        // Store uploaded URLs for potential cleanup
        uploadedUrls = uploadResults.filter((result) => result.url).map((result) => result.url);
        console.log(`Uploaded ${uploadedUrls.length} images:`, uploadedUrls);

        // Check for failed uploads
        const failedUploads = uploadResults.filter((result) => result.error);
        if (failedUploads.length > 0) {
          console.log(`Bulk upload summary: ${uploadedUrls.length} succeeded, ${failedUploads.length} failed`);
          throw new Error(`Failed to upload ${failedUploads.length} images: ${failedUploads.map((f) => f.originalname).join(", ")}`);
        }
        console.log(`Bulk upload summary: ${uploadedUrls.length} succeeded, 0 failed`);

        // Link images to the new structure
        let primaryImageUrl = null;
        const imagesArray = [];
        console.log("Processing uploaded images for new structure");
        
        for (const result of uploadResults) {
          const parsed = parseImageFilename(result.originalname);
          if (!parsed) {
            throw new Error(`Invalid filename format: ${result.originalname}`);
          }
          
          if (parsed.isPrimary) {
            primaryImageUrl = result.url;
            imagesArray.unshift({ // Add primary image at the beginning
              url: result.url,
              type: 'image',
              priority: 1
            });
            console.log(`Set primary image: ${primaryImageUrl}`);
          } else {
            imagesArray.push({
              url: result.url,
              type: 'image',
              priority: imagesArray.length + 1
            });
          }
        }
        
        // Update the item with both new images structure and legacy imageUrl
        console.log("Updating item with images");
        await Item.updateOne(
          { _id: newItemId },
          { 
            images: imagesArray,
            imageUrl: primaryImageUrl // Legacy support
          }
        );

        results.successful.push({
          productId: itemData.itemId,
          itemId: newItemId,
          productName: itemData.productName || itemData.name,
          primaryImageUrl,
          totalImages: imagesArray.length,
          status: itemData.status || 'draft'
        });
        console.log(`Successfully processed item ${itemData.itemId}`);
      } catch (error) {
        console.error(`Error processing item ${itemData.itemId || "unknown"}:`, error.message);
        // Cleanup uploaded images if any
        if (uploadedUrls.length > 0) {
          console.log(`Cleaning up ${uploadedUrls.length} uploaded images for ${itemData.itemId}`);
          await cleanupFailedUploads(uploadedUrls);
        }
        // Delete partially created item if it exists
        if (newItemId) {
          console.log(`Deleting partially created item: ${newItemId}`);
          await Item.deleteOne({ _id: newItemId });
        }
        results.failed.push({
          productId: itemData.itemId || "unknown",
          error: error.message,
        });
      }
    }

    // Send response
    console.log("Sending response:", JSON.stringify(results, null, 2));
    return res.status(200).json(ApiResponse(results, "Bulk items upload completed", true, 200));
  } catch (error) {
    console.error("Bulk items upload error:", error.message);
    return res.status(500).json(ApiResponse(null, "Bulk items upload failed", false, 500, error.message));
  }
};

/**
 * Bulk upload item details with images (now updates existing items with detailed info)
 */

/**
 * Bulk upload item details with images (now updates existing items with detailed info)
 */
exports.bulkUploadItemDetails = async (req, res) => {
  console.log("Starting bulkUploadItemDetails controller (updating existing items with details)");
  
  try {
    // Check if files are present
    if (!req.files || !req.files.jsonFile) {
      return res.status(400).json(ApiResponse(null, "JSON file is required", false, 400));
    }

    // Get JSON file
    const jsonFile = req.files.jsonFile[0];
    if (!jsonFile) {
      return res.status(400).json(ApiResponse(null, "Valid JSON file is required", false, 400));
    }

    console.log("JSON file found:", jsonFile.originalname);
    let itemDetailsData;
    try {
      itemDetailsData = JSON.parse(jsonFile.buffer.toString());
      if (!Array.isArray(itemDetailsData)) {
        return res.status(400).json(ApiResponse(null, "JSON must be an array of item details", false, 400));
      }
      console.log(`Parsed ${itemDetailsData.length} item details from JSON`);
    } catch (error) {
      return res.status(400).json(ApiResponse(null, "Invalid JSON format", false, 400, error.message));
    }

    // Get media files (optional)
    const mediaFiles = req.files.media || [];
    console.log("Found media files:", mediaFiles.map((f) => f.originalname));

    const results = { successful: [], failed: [] };

    for (const itemData of itemDetailsData) {
      console.log(`Processing item details for productId: ${itemData.itemId}`);
      let uploadedUrls = [];

      try {
        // Find the corresponding Item
        const item = await Item.findOne({ productId: itemData.itemId });
        if (!item) {
          throw new Error(`Item not found for productId: ${itemData.itemId}`);
        }

        // Prepare update data with enhanced details
        const updateData = {};
        
        // Update basic details if provided
        if (itemData.description) updateData.description = itemData.description;
        if (itemData.manufacturingDetails) updateData.manufacturingDetails = itemData.manufacturingDetails;
        if (itemData.shippingAndReturns) updateData.shippingAndReturns = itemData.shippingAndReturns;
        if (itemData.returnable !== undefined) updateData.returnable = Boolean(itemData.returnable);
        
        // Update platform pricing if provided
        if (itemData.platformPricing) {
          updateData.platformPricing = {
            ...item.platformPricing.toObject(),
            ...itemData.platformPricing
          };
        }
        
        // Update variants if provided
        if (itemData.variants && Array.isArray(itemData.variants)) {
          updateData.variants = itemData.variants;
        }
        
        // Update size chart and common size chart
        if (itemData.sizeChart) updateData.sizeChart = itemData.sizeChart;
        if (itemData.commonSizeChart) updateData.commonSizeChart = itemData.commonSizeChart;
        
        // Update tags if provided
        if (itemData.tags && Array.isArray(itemData.tags)) {
          updateData.tags = itemData.tags;
        }
        
        // Update alsoShowInOptions if provided
        if (itemData.alsoShowInOptions) {
          updateData.alsoShowInOptions = itemData.alsoShowInOptions;
        }
        
        // Update publishing options if provided
        if (itemData.publishingOptions) {
          updateData.publishingOptions = itemData.publishingOptions;
        }
        
        // Update status and scheduling if provided
        if (itemData.status) updateData.status = itemData.status;
        if (itemData.scheduledDate) updateData.scheduledDate = itemData.scheduledDate;
        if (itemData.scheduledTime) updateData.scheduledTime = itemData.scheduledTime;
        if (itemData.publishAt) updateData.publishAt = new Date(itemData.publishAt);
        
        // Update meta fields if provided
        if (itemData.metaTitle) updateData.metaTitle = itemData.metaTitle;
        if (itemData.metaDescription) updateData.metaDescription = itemData.metaDescription;
        if (itemData.slugUrl) updateData.slugUrl = itemData.slugUrl;

        // Process media files if any
        if (mediaFiles.length > 0) {
          // Filter media files for this product (if naming convention is followed)
          const itemMedia = mediaFiles.filter((media) => {
            return media.originalname.toLowerCase().includes(itemData.itemId.toLowerCase());
          });
          
          if (itemMedia.length > 0) {
            // Upload media files to S3
            const s3Folder = `categories/${item.categoryId}/${item.subCategoryId}/${item._id}`;
            console.log(`Uploading ${itemMedia.length} media files to S3 folder: ${s3Folder}`);
            const uploadResults = await bulkUploadFilesToS3(itemMedia, s3Folder);
            
            uploadedUrls = uploadResults.filter((result) => result.url).map((result) => result.url);
            console.log(`Uploaded ${uploadedUrls.length} media files for ${itemData.itemId}`);
            
            // Add uploaded images to the images array
            const newImages = uploadResults.map((result, index) => ({
              url: result.url,
              type: result.originalname.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image',
              priority: (item.images?.length || 0) + index + 1
            }));
            
            updateData.images = [...(item.images || []), ...newImages];
          }
        }

        // Update the item
        if (Object.keys(updateData).length > 0) {
          await Item.updateOne({ _id: item._id }, { $set: updateData });
          console.log(`Updated item ${itemData.itemId} with detailed information`);
        }

        results.successful.push({
          productId: itemData.itemId,
          itemId: item._id,
          updatedFields: Object.keys(updateData),
          mediaFilesUploaded: uploadedUrls.length
        });

      } catch (error) {
        console.error(`Error processing item details for ${itemData.itemId}:`, error.message);
        
        // Cleanup uploaded images if any
        if (uploadedUrls.length > 0) {
          console.log(`Cleaning up ${uploadedUrls.length} uploaded images for ${itemData.itemId}`);
          await cleanupFailedUploads(uploadedUrls);
        }
        
        results.failed.push({
          productId: itemData.itemId || "unknown",
          error: error.message
        });
      }
    }

    console.log("Bulk item details upload completed. Results:", JSON.stringify(results, null, 2));
    return res.status(200).json(ApiResponse(results, "Bulk item details upload completed", true, 200));
  } catch (error) {
    console.error("Error in bulkUploadItemDetails:", error);
    return res.status(500).json(ApiResponse(null, "Bulk item details upload failed", false, 500, error.message));
  }
};