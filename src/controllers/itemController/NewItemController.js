const Item = require("../../models/Item");
const SubCategory = require("../../models/SubCategory");
const { ApiResponse } = require("../../utils/ApiResponse");
const { generateSKU, ensureValidSKUs, validateProductForLive } = require("../../utils/skuUtils");
const mongoose = require("mongoose");

// Create basic product (Phase 1 of the new flow)
const createBasicProduct = async (req, res) => {
  try {
    console.log("=== CREATE BASIC PRODUCT REQUEST ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const {
      name,
      productName, // Frontend sends productName
      title,
      description,
      manufacturingDetails,
      shippingAndReturns,
      returnable = true,
      categoryId,
      subCategoryId,
      sizes = [],
      colors = [],
      price,
      compareAtPrice,
      costPrice,
      sku,
      barcode,
      brand = 'Yoraa',
      tags = [],
      status = 'draft'
    } = req.body;

    // Use productName if name is not provided (frontend compatibility)
    const productNameToUse = name || productName;
    console.log("Using product name:", productNameToUse);

    // Validate required fields
    if (!productNameToUse || !productNameToUse.trim()) {
      console.log("ERROR: Product name is missing");
      return res.status(400).json(
        ApiResponse(null, "Product name is required", false, 400)
      );
    }

    if (!description || !description.trim()) {
      console.log("ERROR: Product description is missing");
      return res.status(400).json(
        ApiResponse(null, "Product description is required", false, 400)
      );
    }

    // Generate unique itemId
    const itemId = `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log("Generated itemId:", itemId);

    // Calculate default price from sizes if not provided
    let defaultPrice = price;
    if ((!defaultPrice || defaultPrice <= 0) && sizes.length > 0) {
      const firstSizePrice = sizes[0]?.regularPrice || sizes[0]?.salePrice || sizes[0]?.price;
      defaultPrice = firstSizePrice && firstSizePrice > 0 ? firstSizePrice : 1;
    }
    
    if (!defaultPrice || defaultPrice <= 0) {
      defaultPrice = 1;
    }

    console.log("Using default price:", defaultPrice);
    console.log("Sizes received:", JSON.stringify(sizes, null, 2));

    // Prepare sizes data with proper mapping
    const formattedSizes = sizes.map((size, index) => ({
      size: size.size || size.sizeName || 'One Size',
      quantity: parseInt(size.quantity) || parseInt(size.stock) || 0,
      stock: parseInt(size.stock) || parseInt(size.quantity) || 0,
      hsnCode: size.hsnCode || size.hsn || '',
      sku: size.sku, // Will be validated by ensureValidSKUs
      barcode: size.barcode || size.barcodeNo || '',
      regularPrice: parseFloat(size.regularPrice) || parseFloat(size.price) || parseFloat(defaultPrice),
      salePrice: parseFloat(size.salePrice) || parseFloat(size.price) || parseFloat(defaultPrice),
      // Measurements in cm - only set if provided and valid
      fitWaistCm: size.fitWaistCm && parseFloat(size.fitWaistCm) ? parseFloat(size.fitWaistCm) : undefined,
      inseamLengthCm: size.inseamLengthCm && parseFloat(size.inseamLengthCm) ? parseFloat(size.inseamLengthCm) : undefined,
      chestCm: size.chestCm && parseFloat(size.chestCm) ? parseFloat(size.chestCm) : undefined,
      frontLengthCm: size.frontLengthCm && parseFloat(size.frontLengthCm) ? parseFloat(size.frontLengthCm) : undefined,
      acrossShoulderCm: size.acrossShoulderCm && parseFloat(size.acrossShoulderCm) ? parseFloat(size.acrossShoulderCm) : undefined,
      // Measurements in inches - only set if provided and valid
      toFitWaistIn: size.toFitWaistIn && parseFloat(size.toFitWaistIn) ? parseFloat(size.toFitWaistIn) : undefined,
      inseamLengthIn: size.inseamLengthIn && parseFloat(size.inseamLengthIn) ? parseFloat(size.inseamLengthIn) : undefined,
      chestIn: size.chestIn && parseFloat(size.chestIn) ? parseFloat(size.chestIn) : undefined,
      frontLengthIn: size.frontLengthIn && parseFloat(size.frontLengthIn) ? parseFloat(size.frontLengthIn) : undefined,
      acrossShoulderIn: size.acrossShoulderIn && parseFloat(size.acrossShouldarIn) ? parseFloat(size.acrossShoulderIn) : undefined,
      // Meta fields
      metaTitle: size.metaTitle || '',
      metaDescription: size.metaDescription || '',
      slugUrl: size.slugUrl || ''
    }));

    // Ensure all sizes have valid SKUs using utility function
    const sizesWithValidSKUs = ensureValidSKUs(formattedSizes, productNameToUse);

    console.log("Formatted sizes:", JSON.stringify(formattedSizes, null, 2));

    // Create the basic product with error handling
    const itemData = {
      itemId,
      productId: itemId, // for backward compatibility
      productName: productNameToUse.trim(),
      title: title || productNameToUse.trim(),
      description: description.trim(),
      manufacturingDetails: manufacturingDetails || '',
      shippingAndReturns: shippingAndReturns || '',
      returnable,
      categoryId: categoryId || null,
      subCategoryId: subCategoryId || null,
      sizes: sizesWithValidSKUs,
      colors: Array.isArray(colors) ? colors.map(color => ({
        name: color.name || color,
        hexCode: color.hexCode || '#000000',
        isAvailable: color.isAvailable !== false
      })) : [],
      price: parseFloat(defaultPrice),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
      costPrice: costPrice ? parseFloat(costPrice) : null,
      sku: sku || `SKU-${Date.now()}`,
      barcode: barcode || `BAR-${Date.now()}`,
      brand,
      tags: Array.isArray(tags) ? tags : [],
      status,
      images: [],
      videos: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("Creating item with data keys:", Object.keys(itemData));

    const newItem = new Item(itemData);
    const savedItem = await newItem.save();

    console.log("Item saved successfully with ID:", savedItem._id);

    res.status(201).json(
      ApiResponse(
        savedItem,
        "Basic product created successfully",
        true,
        201
      )
    );
  } catch (error) {
    console.error("ERROR in createBasicProduct:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json(
      ApiResponse(null, "Failed to create basic product", false, 500, error.message)
    );
  }
};

// Update draft configuration (Phase 2 of the new flow)
const updateDraftConfiguration = async (req, res) => {
  try {
    const { itemId } = req.params;
    const {
      images = [],
      videos = [],
      filters = [],
      categoryId,
      subCategoryId,
      additionalDetails = {}
    } = req.body;

    const updatedItem = await Item.findOneAndUpdate(
      { $or: [{ itemId }, { _id: itemId }] },
      {
        $set: {
          images,
          videos,
          filters,
          categoryId,
          subCategoryId,
          ...additionalDetails,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json(
        ApiResponse(null, "Product not found", false, 404)
      );
    }

    res.status(200).json(
      ApiResponse(
        updatedItem,
        "Draft configuration updated successfully",
        true,
        200
      )
    );
  } catch (error) {
    console.error("Error updating draft configuration:", error);
    res.status(500).json(
      ApiResponse(null, "Failed to update draft configuration", false, 500, error.message)
    );
  }
};

// Get all items with pagination and filtering
const getAllItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      subCategory,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.categoryId = category;
    if (subCategory) filter.subCategoryId = subCategory;
    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get items with pagination
    const items = await Item.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('categoryId')
      .populate('subCategoryId');

    // Get total count for pagination
    const total = await Item.countDocuments(filter);

    res.status(200).json(
      ApiResponse(
        {
          items,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            hasNextPage: skip + parseInt(limit) < total,
            hasPrevPage: parseInt(page) > 1
          }
        },
        "Items retrieved successfully",
        true,
        200
      )
    );
  } catch (error) {
    console.error("Error getting all items:", error);
    res.status(500).json(
      ApiResponse(null, "Failed to retrieve items", false, 500, error.message)
    );
  }
};

// Get single item by ID
const getItemById = async (req, res) => {
  try {
    const { itemId } = req.params;
    console.log("📦 Fetching product by ID:", itemId);

    const item = await Item.findOne({ $or: [{ itemId }, { _id: itemId }] })
      .populate('categoryId')
      .populate('subCategoryId');

    if (!item) {
      console.log("❌ Product not found:", itemId);
      return res.status(404).json(
        ApiResponse(null, "Product not found", false, 404)
      );
    }

    console.log("✅ Product found:", {
      id: item._id,
      name: item.name || item.productName,
      status: item.status,
      sizesCount: item.sizes?.length || 0
    });

    // Return product data in MULTIPLE formats for frontend compatibility
    // This ensures the frontend can parse it regardless of which format they're checking
    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      statusCode: 200,
      // Direct product object (Option 1)
      _id: item._id,
      productName: item.name || item.productName,
      name: item.name || item.productName,
      status: item.status,
      sizes: item.sizes,
      images: item.images,
      categoryId: item.categoryId,
      subCategoryId: item.subCategoryId,
      description: item.description,
      fabric: item.fabric,
      care: item.care,
      color: item.color,
      brandId: item.brandId,
      countryOfOrigin: item.countryOfOrigin,
      seller: item.seller,
      sku: item.sku,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      // Wrapped in data field (Option 2)
      data: item,
      // Wrapped in product field (Option 3)
      product: item
    });
  } catch (error) {
    console.error("❌ Error getting item by ID:", error);
    res.status(500).json(
      ApiResponse(null, "Failed to retrieve product", false, 500, error.message)
    );
  }
};

// Update item
const updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    let updateData = { ...req.body, updatedAt: new Date() };

    console.log("🚨 updateItem route HIT with itemId:", itemId);
    console.log("Updating item with data:", JSON.stringify(updateData, null, 2));

    // If updating sizes, ensure all sizes have valid SKUs using utility
    if (updateData.sizes && Array.isArray(updateData.sizes)) {
      const productName = updateData.productName || 'Product';
      updateData.sizes = ensureValidSKUs(updateData.sizes, productName);
    }

    const updatedItem = await Item.findOneAndUpdate(
      { $or: [{ itemId }, { _id: itemId }] },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json(
        ApiResponse(null, "Product not found", false, 404)
      );
    }

    res.status(200).json(
      ApiResponse(updatedItem, "Product updated successfully", true, 200)
    );
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json(
      ApiResponse(null, "Failed to update product", false, 500, error.message)
    );
  }
};

// Delete item
const deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const deletedItem = await Item.findOneAndDelete({
      $or: [{ itemId }, { _id: itemId }]
    });

    if (!deletedItem) {
      return res.status(404).json(
        ApiResponse(null, "Product not found", false, 404)
      );
    }

    res.status(200).json(
      ApiResponse(deletedItem, "Product deleted successfully", true, 200)
    );
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json(
      ApiResponse(null, "Failed to delete product", false, 500, error.message)
    );
  }
};

// Update product status (draft → schedule → live)
const updateProductStatus = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { status } = req.body;

    console.log('🔧 Backend updateProductStatus called with:', { 
      itemId, 
      status, 
      params: req.params, 
      body: req.body 
    });

    if (!itemId || itemId === 'undefined') {
      console.error('❌ Backend updateProductStatus: itemId is missing or undefined!');
      return res.status(400).json(
        ApiResponse(null, "Item ID is missing or invalid", false, 400)
      );
    }

    // Validate status
    const validStatuses = ['draft', 'live', 'scheduled', 'inactive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(
        ApiResponse(null, "Invalid status. Must be one of: draft, live, scheduled, inactive", false, 400)
      );
    }

    // If trying to make item live, validate using utility function
    if (status === 'live') {
      const item = await Item.findOne({ $or: [{ itemId }, { _id: itemId }] });
      if (!item) {
        return res.status(404).json(
          ApiResponse(null, "Item not found", false, 404)
        );
      }

      // Validate product for live status using utility
      const validation = validateProductForLive(item);
      if (!validation.isValid) {
        return res.status(400).json(
          ApiResponse(null, `Cannot make item live: ${validation.errors.join(', ')}`, false, 400)
        );
      }
    }

    const updatedItem = await Item.findOneAndUpdate(
      { $or: [{ itemId }, { _id: itemId }] },
      { 
        $set: { 
          status, 
          updatedAt: new Date(),
          ...(status === 'live' ? { publishedAt: new Date() } : {})
        } 
      },
      { new: true, runValidators: true }
    );

    console.log('🔍 Backend findOneAndUpdate result:', {
      found: !!updatedItem,
      itemId,
      searchQuery: { $or: [{ itemId }, { _id: itemId }] },
      updatedItem: updatedItem ? {
        _id: updatedItem._id,
        itemId: updatedItem.itemId,
        productName: updatedItem.productName,
        status: updatedItem.status
      } : null
    });

    if (!updatedItem) {
      return res.status(404).json(
        ApiResponse(null, "Product not found", false, 404)
      );
    }

    res.status(200).json(
      ApiResponse(updatedItem, `Product status updated to ${status}`, true, 200)
    );
  } catch (error) {
    console.error("Error updating product status:", error);
    res.status(500).json(
      ApiResponse(null, "Failed to update product status", false, 500, error.message)
    );
  }
};

// Get products by status
const getProductsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status };
    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get items with pagination
    const items = await Item.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('categoryId')
      .populate('subCategoryId');

    // Get total count for pagination
    const total = await Item.countDocuments(filter);

    res.status(200).json(
      ApiResponse(
        {
          items,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            hasNextPage: skip + parseInt(limit) < total,
            hasPrevPage: parseInt(page) > 1
          }
        },
        `Items with status '${status}' retrieved successfully`,
        true,
        200
      )
    );
  } catch (error) {
    console.error("Error getting products by status:", error);
    res.status(500).json(
      ApiResponse(null, "Failed to retrieve products", false, 500, error.message)
    );
  }
};

// Get all items by subcategory
const getItemsBySubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;

    console.log("Fetching items for subcategory:", subCategoryId);

    // Validate subCategoryId
    if (!subCategoryId) {
      return res.status(400).json(
        ApiResponse(null, "SubCategory ID is required", false, 400)
      );
    }

    // Query for items in the subcategory with optional filtering
    const { status, limit = 50, page = 1, sort = 'createdAt' } = req.query;
    
    const filter = {
      subCategoryId: subCategoryId
    };

    // Apply status filter if provided
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    const sortOrder = sort === 'newest' ? { createdAt: -1 } : { createdAt: 1 };

    const items = await Item.find(filter)
      .sort(sortOrder)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('categoryId', 'name description')
      .populate('subCategoryId', 'name description');

    const totalItems = await Item.countDocuments(filter);

    return res.status(200).json(
      ApiResponse(
        {
          items,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
            itemsPerPage: parseInt(limit)
          }
        },
        "Items fetched successfully",
        true,
        200
      )
    );
  } catch (error) {
    console.error("Error fetching items by subcategory:", error);
    return res.status(500).json(
      ApiResponse(null, "Internal server error", false, 500)
    );
  }
};

// Get latest items by subcategory
const getLatestItemsBySubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const { 
      page = 1, 
      limit = 10,
      status = 'live' // Default to live items only
    } = req.query;

    // Validate subCategoryId
    if (!subCategoryId) {
      return res.status(400).json(
        ApiResponse(null, "SubCategory ID is required", false, 400)
      );
    }

    // Validate if subCategoryId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
      return res.status(400).json(
        ApiResponse(null, "Invalid SubCategory ID format", false, 400)
      );
    }

    // Build filter object
    const filter = { 
      subCategoryId: subCategoryId,
      status: status // Filter by status (default: live)
    };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get latest items sorted by createdAt in descending order
    const items = await Item.find(filter)
      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(parseInt(limit))
      .populate('categoryId', 'name description')
      .populate('subCategoryId', 'name description');

    // Get total count for pagination
    const total = await Item.countDocuments(filter);

    res.status(200).json(
      ApiResponse(
        {
          items,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            hasNextPage: skip + parseInt(limit) < total,
            hasPrevPage: parseInt(page) > 1
          },
          subCategoryId,
          status
        },
        `Latest items retrieved successfully for subcategory`,
        true,
        200
      )
    );
  } catch (error) {
    console.error("Error getting latest items by subcategory:", error);
    res.status(500).json(
      ApiResponse(null, "Failed to retrieve latest items", false, 500, error.message)
    );
  }
};

// Update category and subcategory assignment for an item
const updateItemCategoryAssignment = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { categoryId, subCategoryId } = req.body;

    // Validate itemId
    if (!itemId) {
      return res.status(400).json(
        ApiResponse(null, "Item ID is required", false, 400)
      );
    }

    // Validate that at least one field is provided
    if (!categoryId && !subCategoryId) {
      return res.status(400).json(
        ApiResponse(null, "At least one of categoryId or subCategoryId is required", false, 400)
      );
    }

    // Build update object
    const updateData = { updatedAt: new Date() };
    if (categoryId) updateData.categoryId = categoryId;
    if (subCategoryId) updateData.subCategoryId = subCategoryId;

    // Validate category exists if provided
    if (categoryId) {
      const Category = require('../../models/Category');
      const categoryExists = await Category.findById(categoryId);
      if (!categoryExists) {
        return res.status(404).json(
          ApiResponse(null, "Category not found", false, 404)
        );
      }
    }

    // Validate subcategory exists if provided
    if (subCategoryId) {
      const SubCategory = require('../../models/SubCategory');
      const subCategoryExists = await SubCategory.findById(subCategoryId);
      if (!subCategoryExists) {
        return res.status(404).json(
          ApiResponse(null, "Subcategory not found", false, 404)
        );
      }
    }

    // Update the item
    const updatedItem = await Item.findOneAndUpdate(
      { $or: [{ itemId }, { _id: itemId }] },
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('categoryId', 'name description')
      .populate('subCategoryId', 'name description');

    if (!updatedItem) {
      return res.status(404).json(
        ApiResponse(null, "Item not found", false, 404)
      );
    }

    res.status(200).json(
      ApiResponse(
        updatedItem,
        "Item category assignment updated successfully",
        true,
        200
      )
    );
  } catch (error) {
    console.error("Error updating item category assignment:", error);
    res.status(500).json(
      ApiResponse(null, "Failed to update item category assignment", false, 500, error.message)
    );
  }
};

// Search products for frontend - matches expected API format
const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    
    // Validate search query
    if (!query || query.trim().length === 0) {
      return res.status(400).json(
        ApiResponse([], "Search query is required", false, 400)
      );
    }

    console.log('🔍 Search request received:', { query });

    // Build comprehensive search filter
    const searchFilter = {
      status: 'live', // Only return live products for frontend search
      $or: [
        { productName: { $regex: query.trim(), $options: 'i' } },
        { description: { $regex: query.trim(), $options: 'i' } },
        { brand: { $regex: query.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(query.trim(), 'i')] } },
        // Search within sizes for size names, SKUs, etc.
        { 'sizes.size': { $regex: query.trim(), $options: 'i' } },
        { 'sizes.sku': { $regex: query.trim(), $options: 'i' } },
        // Search within filter values (colors, materials, etc.)
        { 'sizes.filters.value': { $regex: query.trim(), $options: 'i' } }
      ]
    };

    // Get search results with population
    const items = await Item.find(searchFilter)
      .populate('categoryId')
      .populate('subCategoryId')
      .limit(50) // Reasonable limit for search results
      .sort({ createdAt: -1 }); // Latest first

    console.log('🔍 Search found items:', items.length);

    // Transform items to match frontend expectations
    const transformedProducts = items.map(item => {
      // Get the first available size for pricing
      const firstSize = item.sizes && item.sizes.length > 0 ? item.sizes[0] : null;
      const price = firstSize?.regularPrice || firstSize?.salePrice || item.price || 0;
      const salePrice = firstSize?.salePrice;
      const originalPrice = firstSize?.regularPrice;
      
      // Calculate discount if both prices exist
      let discount = null;
      if (originalPrice && salePrice && originalPrice > salePrice) {
        discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100) + '%';
      }

      // Get category name
      const categoryName = item.categoryId?.name || item.categoryId?.categoryName || '';
      
      // Extract image URL from various possible formats
      const extractImageUrl = (imageItem) => {
        if (typeof imageItem === 'string') return imageItem;
        if (imageItem && typeof imageItem === 'object') {
          return imageItem.url || imageItem.src || imageItem.imageUrl || '';
        }
        return '';
      };

      // Get primary image URL
      let primaryImage = '';
      if (item.imageUrls && item.imageUrls.length > 0) {
        primaryImage = extractImageUrl(item.imageUrls[0]);
      } else if (item.images && item.images.length > 0) {
        primaryImage = extractImageUrl(item.images[0]);
      }

      // Process all images to ensure they're strings
      const processedImages = [];
      if (item.imageUrls) {
        processedImages.push(...item.imageUrls.map(extractImageUrl));
      } else if (item.images) {
        processedImages.push(...item.images.map(extractImageUrl));
      }
      
      return {
        id: item._id.toString(),
        name: item.productName || item.name || '',
        subtitle: item.description || '',
        price: price ? `US$${price}` : 'US$0',
        originalPrice: originalPrice && originalPrice !== price ? `US$${originalPrice}` : undefined,
        discount: discount || undefined,
        brand: item.brand || 'Yoraa',
        category: categoryName,
        image: primaryImage,
        images: processedImages.filter(url => url && url.trim().length > 0),
        inStock: item.sizes ? item.sizes.some(size => size.stock > 0) : true,
        // Additional fields that might be useful
        rating: item.averageRating || undefined,
        reviewCount: item.totalReviews || undefined
      };
    });

    console.log('🔍 Transformed products:', transformedProducts.length);

    // Return in the format expected by frontend
    res.status(200).json({
      data: transformedProducts
    });

  } catch (error) {
    console.error('❌ Search API error:', error);
    res.status(500).json(
      ApiResponse([], "Search failed", false, 500, error.message)
    );
  }
};

// Voice search products - Enhanced search functionality for voice input
const voiceSearchProducts = async (req, res) => {
  try {
    const { query, text } = req.body;
    const audioFile = req.file; // Multer stores uploaded file here
    
    // Get search query from text input or process audio file
    let searchQuery = query || text;
    
    console.log('🎤 Voice search request received:', { 
      searchQuery, 
      hasAudio: !!audioFile,
      audioSize: audioFile ? audioFile.size : 0,
      audioType: audioFile ? audioFile.mimetype : null
    });
    
    // Future: Process audio file if provided and no text query
    if (!searchQuery && audioFile) {
      // Placeholder for future audio-to-text conversion
      // This could integrate with services like Google Speech-to-Text, AWS Transcribe, etc.
      console.log('🎤 Audio file received but audio-to-text conversion not yet implemented');
      return res.status(400).json({
        success: false,
        message: "Audio-to-text conversion is not yet implemented. Please provide text query for now.",
        data: [],
        audioReceived: true,
        audioSize: audioFile.size,
        audioType: audioFile.mimetype
      });
    }
    
    // Validate search query
    if (!searchQuery || searchQuery.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required for voice search. Provide 'query' or 'text' field.",
        data: [],
        examples: [
          { query: "red dress" },
          { text: "show me blue jeans" }
        ]
      });
    }

    // Clean and normalize the search query for better matching
    searchQuery = searchQuery.trim().toLowerCase();
    
    // Enhanced search patterns for voice input
    // Voice searches tend to be more conversational, so we need broader matching
    const searchTerms = searchQuery.split(' ').filter(term => term.length > 2);
    
    // Build comprehensive voice-optimized search filter
    const voiceSearchFilter = {
      status: 'live', // Only return live products for frontend search
      $or: [
        // Exact product name matching (highest priority)
        { productName: { $regex: searchQuery, $options: 'i' } },
        
        // Partial product name matching
        ...searchTerms.map(term => ({ productName: { $regex: term, $options: 'i' } })),
        
        // Description matching
        { description: { $regex: searchQuery, $options: 'i' } },
        ...searchTerms.map(term => ({ description: { $regex: term, $options: 'i' } })),
        
        // Brand matching
        { brand: { $regex: searchQuery, $options: 'i' } },
        ...searchTerms.map(term => ({ brand: { $regex: term, $options: 'i' } })),
        
        // Tags matching (for categories, colors, styles, etc.)
        { tags: { $in: [new RegExp(searchQuery, 'i')] } },
        ...searchTerms.map(term => ({ tags: { $in: [new RegExp(term, 'i')] } })),
        
        // Size and SKU matching
        { 'sizes.size': { $regex: searchQuery, $options: 'i' } },
        { 'sizes.sku': { $regex: searchQuery, $options: 'i' } },
        
        // Filter values matching (colors, materials, patterns, etc.)
        { 'sizes.filters.value': { $regex: searchQuery, $options: 'i' } },
        ...searchTerms.map(term => ({ 'sizes.filters.value': { $regex: term, $options: 'i' } }))
      ]
    };

    // Add category-based search if voice query contains category keywords
    const Category = require("../../models/Category");
    const SubCategory = require("../../models/SubCategory");
    
    // Check if search query matches any category names
    const matchingCategories = await Category.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        ...searchTerms.map(term => ({ name: { $regex: term, $options: 'i' } }))
      ]
    });
    
    // Check if search query matches any subcategory names
    const matchingSubCategories = await SubCategory.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        ...searchTerms.map(term => ({ name: { $regex: term, $options: 'i' } }))
      ]
    });
    
    // Add category/subcategory filters to search
    if (matchingCategories.length > 0) {
      voiceSearchFilter.$or.push(
        ...matchingCategories.map(cat => ({ categoryId: cat._id }))
      );
    }
    
    if (matchingSubCategories.length > 0) {
      voiceSearchFilter.$or.push(
        ...matchingSubCategories.map(subCat => ({ subCategoryId: subCat._id }))
      );
    }

    console.log('🎤 Voice search filter created with', voiceSearchFilter.$or.length, 'conditions');

    // Get search results with population and enhanced scoring
    const items = await Item.find(voiceSearchFilter)
      .populate('categoryId')
      .populate('subCategoryId')
      .limit(30) // Reasonable limit for voice search results
      .sort({ 
        // Prioritize items with exact name matches, then by creation date
        productName: 1,
        createdAt: -1 
      });

    console.log('🎤 Voice search found items:', items.length);

    // Score and rank results based on relevance to voice query
    const scoredItems = items.map(item => {
      let score = 0;
      const productName = (item.productName || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      const brand = (item.brand || '').toLowerCase();
      
      // Scoring algorithm for voice search relevance
      if (productName.includes(searchQuery)) score += 10; // Exact match in name
      if (productName.startsWith(searchQuery)) score += 8; // Name starts with query
      if (brand.includes(searchQuery)) score += 6; // Brand match
      if (description.includes(searchQuery)) score += 4; // Description match
      
      // Score based on individual terms
      searchTerms.forEach(term => {
        if (productName.includes(term)) score += 3;
        if (description.includes(term)) score += 2;
        if (brand.includes(term)) score += 2;
      });
      
      // Boost score for items with good ratings and availability
      if (item.averageRating >= 4) score += 2;
      if (item.sizes && item.sizes.some(size => size.stock > 0)) score += 1;
      
      return { item, score };
    });
    
    // Sort by score (highest first) and take top results
    const topItems = scoredItems
      .sort((a, b) => b.score - a.score)
      .slice(0, 20) // Limit to top 20 most relevant results
      .map(scored => scored.item);

    // Transform items to match frontend expectations
    const transformedProducts = topItems.map(item => {
      // Get the first available size for pricing
      const firstSize = item.sizes && item.sizes.length > 0 ? item.sizes[0] : null;
      const price = firstSize?.regularPrice || firstSize?.salePrice || item.price || 0;
      const salePrice = firstSize?.salePrice;
      const originalPrice = firstSize?.regularPrice;
      
      // Calculate discount if both prices exist
      let discount = null;
      if (originalPrice && salePrice && originalPrice > salePrice) {
        discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100) + '%';
      }

      // Get category name
      const categoryName = item.categoryId?.name || item.categoryId?.categoryName || '';
      
      // Extract image URL from various possible formats
      const extractImageUrl = (imageItem) => {
        if (typeof imageItem === 'string') return imageItem;
        if (imageItem && typeof imageItem === 'object') {
          return imageItem.url || imageItem.src || imageItem.imageUrl || '';
        }
        return '';
      };

      // Get primary image URL
      let primaryImage = '';
      if (item.imageUrls && item.imageUrls.length > 0) {
        primaryImage = extractImageUrl(item.imageUrls[0]);
      } else if (item.images && item.images.length > 0) {
        primaryImage = extractImageUrl(item.images[0]);
      }

      // Process all images to ensure they're strings
      const processedImages = [];
      if (item.imageUrls) {
        processedImages.push(...item.imageUrls.map(extractImageUrl));
      } else if (item.images) {
        processedImages.push(...item.images.map(extractImageUrl));
      }
      
      return {
        id: item._id.toString(),
        name: item.productName || item.name || '',
        subtitle: item.description || '',
        price: price ? `US$${price}` : 'US$0',
        originalPrice: originalPrice && originalPrice !== price ? `US$${originalPrice}` : undefined,
        discount: discount || undefined,
        brand: item.brand || 'Yoraa',
        category: categoryName,
        image: primaryImage,
        images: processedImages.filter(url => url && url.trim().length > 0),
        inStock: item.sizes ? item.sizes.some(size => size.stock > 0) : true,
        // Additional fields for voice search
        rating: item.averageRating || undefined,
        reviewCount: item.totalReviews || undefined,
        // Voice search specific metadata
        searchRelevance: 'voice-optimized'
      };
    });

    console.log('🎤 Voice search transformed products:', transformedProducts.length);

    // Return enhanced response for voice search
    res.status(200).json({
      success: true,
      searchType: 'voice',
      query: searchQuery,
      resultsCount: transformedProducts.length,
      data: transformedProducts,
      // Additional metadata for voice search
      suggestions: transformedProducts.length === 0 ? [
        `Try searching for "${searchTerms[0]}" or similar items`,
        'Check spelling or try broader terms',
        'Browse our categories for similar products'
      ] : [],
      message: transformedProducts.length > 0 
        ? `Found ${transformedProducts.length} products matching "${searchQuery}"`
        : `No products found for "${searchQuery}". Try different keywords.`
    });

  } catch (error) {
    console.error('❌ Voice search API error:', error);
    res.status(500).json({
      success: false,
      searchType: 'voice',
      message: "Voice search failed. Please try again.",
      data: [],
      error: error.message
    });
  }
};

// Get categories for arrangement
const getCategoriesForArrangement = async (req, res) => {
  try {
    console.log('🔄 Fetching categories for arrangement...');
    
    const Category = require("../../models/Category");
    const SubCategory = require("../../models/SubCategory");
    
    // Fetch all categories with their subcategories
    const categories = await Category.find({ isDeleted: false })
      .populate('subcategories')
      .sort({ displayOrder: 1, createdAt: 1 });
    
    // Format categories for arrangement with additional metadata
    const formattedCategories = await Promise.all(
      categories.map(async (category) => {
        // Get item count for this category
        const itemCount = await Item.countDocuments({
          categoryId: category._id,
          status: { $in: ['live', 'scheduled'] }
        });
        
        return {
          _id: category._id,
          name: category.name,
          description: category.description,
          image: category.image,
          displayOrder: category.displayOrder || 0,
          subcategories: category.subcategories || [],
          itemCount: itemCount,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        };
      })
    );
    
    console.log(`✅ Found ${formattedCategories.length} categories for arrangement`);
    
    res.status(200).json({
      success: true,
      data: formattedCategories,
      message: 'Categories retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching categories for arrangement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories for arrangement',
      data: null,
      error: error.message
    });
  }
};

// Get items for arrangement by category
const getItemsForArrangement = async (req, res) => {
  try {
    console.log('🔄 Fetching items for arrangement...');
    const { categoryId, subCategoryId } = req.query;
    
    if (!categoryId || categoryId === 'all') {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required for item arrangement',
        data: null
      });
    }
    
    let items = [];
    
    if (subCategoryId && subCategoryId !== 'all') {
      // Step 3: If specific subcategory is selected, fetch items belonging to that subcategory
      console.log(`🔍 Step 3: Fetching items for subCategoryId: ${subCategoryId}`);
      items = await Item.find({
        subCategoryId: subCategoryId,
        status: { $in: ['live', 'scheduled'] }
      })
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name')
      .sort({ displayOrder: 1, createdAt: 1 });
      
      console.log(`✅ Found ${items.length} items in subcategory ${subCategoryId}`);
    } else {
      // Step 1: Get category, Step 2: Get all subcategories in this category, Step 3: Get all items in those subcategories
      console.log(`🔍 Step 1: Looking for category: ${categoryId}`);
      
      // Step 2: Get all subcategories that belong to this category
      console.log(`🔍 Step 2: Fetching subcategories for category: ${categoryId}`);
      const subcategories = await SubCategory.find({ categoryId: categoryId });
      const subCategoryIds = subcategories.map(sub => sub._id);
      
      console.log(`✅ Found ${subcategories.length} subcategories in category ${categoryId}:`);
      subcategories.forEach(sub => {
        console.log(`   - ${sub.name} (${sub._id})`);
      });
      
      if (subCategoryIds.length === 0) {
        console.log(`⚠️  No subcategories found for category ${categoryId}`);
        return res.status(200).json({
          success: true,
          data: [],
          message: 'No subcategories found for this category'
        });
      }
      
      // Step 3: Get all items that belong to any of these subcategories
      console.log(`🔍 Step 3: Fetching items for subcategories: ${subCategoryIds}`);
      items = await Item.find({
        subCategoryId: { $in: subCategoryIds },
        status: { $in: ['live', 'scheduled'] }
      })
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name')
      .sort({ displayOrder: 1, createdAt: 1 });
      
      console.log(`✅ Found ${items.length} total items across all subcategories`);
    }
    
    // Format items for arrangement
    const formattedItems = items.map(item => ({
      _id: item._id,
      name: item.productName || item.name,
      price: item.price,
      images: item.images && item.images.length > 0 ? item.images.map(img => img.url || img) : [],
      displayOrder: item.displayOrder || 0,
      categoryId: item.categoryId,
      subCategoryId: item.subCategoryId,
      status: item.status,
      createdAt: item.createdAt
    }));
    
    console.log(`✅ Final result: ${formattedItems.length} formatted items for arrangement`);
    
    res.status(200).json({
      success: true,
      data: formattedItems,
      message: 'Items retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching items for arrangement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items for arrangement',
      data: null,
      error: error.message
    });
  }
};

// Update categories display order
const updateCategoriesDisplayOrder = async (req, res) => {
  try {
    console.log('🔄 Updating categories display order...');
    const { categories } = req.body;
    
    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Categories array is required',
        data: null
      });
    }
    
    const Category = require("../../models/Category");
    
    // Update each category's display order
    const updatePromises = categories.map((category, index) => {
      return Category.findByIdAndUpdate(
        category._id,
        { displayOrder: category.displayOrder || index + 1 },
        { new: true }
      );
    });
    
    const updatedCategories = await Promise.all(updatePromises);
    
    console.log(`✅ Updated display order for ${updatedCategories.length} categories`);
    
    res.status(200).json({
      success: true,
      data: updatedCategories,
      message: 'Categories display order updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating categories display order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update categories display order',
      data: null,
      error: error.message
    });
  }
};

// Update items display order
const updateItemsDisplayOrder = async (req, res) => {
  try {
    console.log('🔄 Updating items display order...');
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required',
        data: null
      });
    }
    
    // Update each item's display order
    const updatePromises = items.map((item, index) => {
      return Item.findByIdAndUpdate(
        item._id,
        { displayOrder: item.displayOrder || index + 1 },
        { new: true }
      );
    });
    
    const updatedItems = await Promise.all(updatePromises);
    
    console.log(`✅ Updated display order for ${updatedItems.length} items`);
    
    res.status(200).json({
      success: true,
      data: updatedItems,
      message: 'Items display order updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating items display order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update items display order',
      data: null,
      error: error.message
    });
  }
};

// Update subcategories display order
const updateSubCategoriesDisplayOrder = async (req, res) => {
  try {
    console.log('🔄 Updating subcategories display order...');
    console.log('🔄 Route HIT: /api/items/subcategories-display-order');
    console.log('🔄 Request body:', JSON.stringify(req.body, null, 2));
    
    const { subcategories } = req.body;
    
    if (!subcategories || !Array.isArray(subcategories)) {
      return res.status(400).json({
        success: false,
        message: 'Subcategories array is required',
        data: null
      });
    }
    
    const SubCategory = require("../../models/SubCategory");
    
    // Update display order for each subcategory
    const updatePromises = subcategories.map((subcategory, index) => {
      return SubCategory.findByIdAndUpdate(
        subcategory._id,
        { displayOrder: index + 1 },
        { new: true }
      );
    });
    
    const updatedSubCategories = await Promise.all(updatePromises);
    
    console.log(`✅ Updated display order for ${updatedSubCategories.length} subcategories`);
    
    res.status(200).json({
      success: true,
      data: updatedSubCategories,
      message: 'Subcategories display order updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating subcategories display order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subcategories display order',
      data: null,
      error: error.message
    });
  }
};

// ✅ Get filtered items for frontend (PUBLIC - NO AUTH REQUIRED)
const getFilteredItems = async (req, res) => {
  try {
    console.log("🔍 === FILTERED ITEMS REQUEST ===");
    console.log("Query params:", JSON.stringify(req.query, null, 2));

    const {
      filters,
      priceMin,
      priceMax,
      sort,
      page = 1,
      limit = 20,
      category,
      subcategory,
      q // search query
    } = req.query;

    let query = {};
    let sortQuery = {};

    // Only show live items for public endpoint
    query.status = 'live';

    // Build filter query
    if (filters) {
      try {
        const filterObj = typeof filters === 'string' ? JSON.parse(filters) : filters;
        console.log("📋 Parsed filters:", filterObj);
        
        const filterConditions = [];

        Object.keys(filterObj).forEach(filterKey => {
          const values = filterObj[filterKey];
          if (values && Array.isArray(values) && values.length > 0) {
            console.log(`🏷️ Processing filter: ${filterKey} with values:`, values);
            
            if (filterKey === 'color') {
              filterConditions.push({
                "sizes.filters": {
                  $elemMatch: {
                    key: "color",
                    value: { $in: values.map(v => typeof v === 'object' ? v.name : v) }
                  }
                }
              });
            } else if (filterKey === 'size') {
              filterConditions.push({
                "sizes.size": { $in: values.map(v => typeof v === 'object' ? v.name : v) }
              });
            } else {
              // Generic filter handling for category, material, etc.
              filterConditions.push({
                "sizes.filters": {
                  $elemMatch: {
                    key: filterKey,
                    value: { $in: values.map(v => typeof v === 'object' ? v.name : v) }
                  }
                }
              });
            }
          }
        });

        if (filterConditions.length > 0) {
          query.$and = filterConditions;
          console.log("🔎 Applied filter conditions:", JSON.stringify(filterConditions, null, 2));
        }
      } catch (filterError) {
        console.error("❌ Error parsing filters:", filterError);
        return res.status(400).json({
          success: false,
          message: "Invalid filter format",
          error: filterError.message
        });
      }
    }

    // Price filter
    if (priceMin || priceMax) {
      query["sizes.regularPrice"] = {};
      if (priceMin) {
        query["sizes.regularPrice"].$gte = parseFloat(priceMin);
        console.log("💰 Min price filter:", priceMin);
      }
      if (priceMax) {
        query["sizes.regularPrice"].$lte = parseFloat(priceMax);
        console.log("💰 Max price filter:", priceMax);
      }
    }

    // Category filter
    if (category) {
      query.categoryId = category;
      console.log("📁 Category filter:", category);
    }
    if (subcategory) {
      query.subCategoryId = subcategory;
      console.log("📂 Subcategory filter:", subcategory);
    }

    // Search query
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      query.$or = [
        { productName: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
      console.log("🔍 Search query:", q);
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        sortQuery = { "sizes.regularPrice": 1 };
        break;
      case 'price_desc':
        sortQuery = { "sizes.regularPrice": -1 };
        break;
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      case 'popularity':
        sortQuery = { views: -1 };
        break;
      case 'alphabetical':
        sortQuery = { productName: 1 };
        break;
      default:
        sortQuery = { createdAt: -1 }; // Default to newest
    }

    console.log("🔄 Sort query:", sortQuery);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    console.log(`📄 Pagination: Page ${page}, Limit ${limit}, Skip ${skip}`);

    // Execute the query
    console.log("🔍 Final MongoDB query:", JSON.stringify(query, null, 2));
    
    const items = await Item.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name');

    const total = await Item.countDocuments(query);

    console.log(`✅ Found ${items.length} items out of ${total} total matching items`);

    // Format response to match frontend expectations
    const formattedItems = items.map(item => ({
      _id: item._id,
      itemId: item.itemId,
      productName: item.productName,
      title: item.title,
      description: item.description,
      images: item.images || [],
      sizes: item.sizes || [],
      category: item.categoryId,
      subcategory: item.subCategoryId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      // Add price range for easy frontend access
      priceRange: item.sizes && item.sizes.length > 0 ? {
        min: Math.min(...item.sizes.map(s => s.regularPrice || 0).filter(p => p > 0)),
        max: Math.max(...item.sizes.map(s => s.regularPrice || 0))
      } : null
    }));

    const response = {
      success: true,
      data: {
        items: formattedItems,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          hasNext: skip + items.length < total,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit)
        },
        appliedFilters: {
          filters: filters ? (typeof filters === 'string' ? JSON.parse(filters) : filters) : {},
          priceRange: { min: priceMin, max: priceMax },
          sort,
          category,
          subcategory,
          search: q
        },
        summary: {
          totalResults: total,
          currentResults: items.length,
          filtersApplied: Object.keys(query).length - 1, // -1 for status filter
          searchTerm: q || null
        }
      }
    };

    console.log(`📊 Response summary: ${items.length}/${total} items, ${Math.ceil(total / parseInt(limit))} pages`);
    
    res.json(response);

  } catch (error) {
    console.error("❌ Error filtering items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to filter items",
      error: error.message,
      data: null
    });
  }
};

// Get all sale products (products with sale prices)
const getSaleProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    console.log('🏷️ Getting sale products with pagination:', { page, limit, skip });
    
    // Find items that have sale prices (salePrice < regularPrice)
    const saleFilter = {
      status: 'live',
      $and: [
        { 'sizes.salePrice': { $exists: true, $ne: null } },
        { 'sizes.regularPrice': { $exists: true, $ne: null } }
      ]
    };
    
    const items = await Item.find(saleFilter)
      .populate('categoryId')
      .populate('subCategoryId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalCount = await Item.countDocuments(saleFilter);
    const totalPages = Math.ceil(totalCount / limit);
    
    console.log('🏷️ Found sale products:', items.length);
    
    // Transform products to match frontend expectations
    const transformedProducts = items.map(item => transformProductForAPI(item));
    
    res.status(200).json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: totalPages
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting sale products:', error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve sale products",
      error: error.message,
      data: []
    });
  }
};

// Get sale products by category
const getSaleProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    console.log('🏷️ Getting sale products by category:', { categoryId, page, limit });
    
    // Validate categoryId
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
        data: []
      });
    }
    
    // Find sale items in specific category
    const saleFilter = {
      status: 'live',
      categoryId: categoryId,
      $and: [
        { 'sizes.salePrice': { $exists: true, $ne: null } },
        { 'sizes.regularPrice': { $exists: true, $ne: null } }
      ]
    };
    
    const items = await Item.find(saleFilter)
      .populate('categoryId')
      .populate('subCategoryId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalCount = await Item.countDocuments(saleFilter);
    const totalPages = Math.ceil(totalCount / limit);
    
    console.log('🏷️ Found sale products in category:', items.length);
    
    // Transform products to match frontend expectations
    const transformedProducts = items.map(item => transformProductForAPI(item));
    
    res.status(200).json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: totalPages
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting sale products by category:', error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve sale products for category",
      error: error.message,
      data: []
    });
  }
};

// Get categories that have sale products
const getSaleCategories = async (req, res) => {
  try {
    console.log('🏷️ Getting categories with sale products');
    
    const Category = require("../../models/Category");
    
    // Find items that have sale prices and get unique category IDs
    const saleFilter = {
      status: 'live',
      $and: [
        { 'sizes.salePrice': { $exists: true, $ne: null } },
        { 'sizes.regularPrice': { $exists: true, $ne: null } }
      ]
    };
    
    const saleCategoryIds = await Item.distinct('categoryId', saleFilter);
    
    // Get category details for categories that have sale items
    const categories = await Category.find({
      _id: { $in: saleCategoryIds },
      status: 'active'
    }).sort({ displayOrder: 1, name: 1 });
    
    console.log('🏷️ Found categories with sale products:', categories.length);
    
    // Get sale product count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const saleCountFilter = {
          ...saleFilter,
          categoryId: category._id
        };
        const saleProductCount = await Item.countDocuments(saleCountFilter);
        
        return {
          id: category._id,
          name: category.name || category.categoryName,
          image: category.image || category.categoryImage,
          saleProductCount: saleProductCount
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: categoriesWithCounts
    });
    
  } catch (error) {
    console.error('❌ Error getting sale categories:', error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve sale categories",
      error: error.message,
      data: []
    });
  }
};

// Helper function to transform product data for API response
const transformProductForAPI = (item) => {
  try {
    // Get the first available size for pricing
    const firstSize = item.sizes && item.sizes.length > 0 ? item.sizes[0] : null;
    const price = firstSize?.regularPrice || firstSize?.salePrice || item.price || 0;
    const salePrice = firstSize?.salePrice;
    const originalPrice = firstSize?.regularPrice;
    
    // Calculate discount if both prices exist
    let discount = null;
    if (originalPrice && salePrice && originalPrice > salePrice) {
      discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    }
    
    // Get category name
    const categoryName = item.categoryId?.name || item.categoryId?.categoryName || '';
    
    // Extract image URL from various possible formats
    const extractImageUrl = (imageItem) => {
      if (typeof imageItem === 'string') return imageItem;
      if (imageItem && typeof imageItem === 'object') {
        return imageItem.url || imageItem.src || imageItem.imageUrl || '';
      }
      return '';
    };
    
    // Get primary image URL
    let primaryImage = '';
    if (item.imageUrls && item.imageUrls.length > 0) {
      primaryImage = extractImageUrl(item.imageUrls[0]);
    } else if (item.images && item.images.length > 0) {
      primaryImage = extractImageUrl(item.images[0]);
    }
    
    // Process all images to ensure they're strings
    const processedImages = [];
    if (item.imageUrls) {
      processedImages.push(...item.imageUrls.map(extractImageUrl));
    } else if (item.images) {
      processedImages.push(...item.images.map(extractImageUrl));
    }
    
    // Extract sizes and colors from the product
    const sizes = item.sizes ? item.sizes.map(size => size.size || size.name).filter(Boolean) : [];
    const colors = [];
    
    // Try to extract colors from filters
    if (item.sizes) {
      item.sizes.forEach(size => {
        if (size.filters) {
          size.filters.forEach(filter => {
            if (filter.name && filter.name.toLowerCase().includes('color') && filter.value) {
              if (!colors.includes(filter.value)) {
                colors.push(filter.value);
              }
            }
          });
        }
      });
    }
    
    return {
      id: item._id.toString(),
      name: item.productName || item.name || '',
      subtitle: item.description || '',
      price: salePrice || price || 0,
      salePrice: salePrice || null,
      originalPrice: originalPrice || price || 0,
      discount: discount || null,
      brand: item.brand || 'Yoraa',
      category: categoryName,
      image: primaryImage,
      images: processedImages.filter(url => url && url.trim().length > 0),
      inStock: item.sizes ? item.sizes.some(size => size.stock > 0) : true,
      sizes: sizes,
      colors: colors,
      rating: item.averageRating || undefined,
      reviewCount: item.totalReviews || undefined
    };
  } catch (error) {
    console.error('❌ Error transforming product:', error);
    return {
      id: item._id?.toString() || '',
      name: item.productName || item.name || '',
      subtitle: '',
      price: 0,
      salePrice: null,
      originalPrice: 0,
      discount: null,
      brand: 'Yoraa',
      category: '',
      image: '',
      images: [],
      inStock: false,
      sizes: [],
      colors: []
    };
  }
};

module.exports = {
  createBasicProduct,
  updateDraftConfiguration,
  updateProductStatus,
  getProductsByStatus,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
  getItemsBySubCategory,
  getLatestItemsBySubCategory,
  updateItemCategoryAssignment,
  searchProducts,
  voiceSearchProducts,
  getCategoriesForArrangement,
  getItemsForArrangement,
  updateCategoriesDisplayOrder,
  updateSubCategoriesDisplayOrder,
  updateItemsDisplayOrder,
  getFilteredItems,
  // Sale-specific endpoints
  getSaleProducts,
  getSaleProductsByCategory,
  getSaleCategories
};