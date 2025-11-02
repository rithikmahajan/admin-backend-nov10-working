const SubCategory = require("../../models/SubCategory");
const Category = require("../../models/Category");
const { deleteFileFromS3 } = require("../../utils/S3");
const { ApiResponse } = require("../../utils/ApiResponse");

// Create a new subcategory
exports.createSubCategory = async (req, res, newSubCategoryId) => {
  try {
    console.log("CONTROLLER - Creating subcategory with data:", {
      name: req.body.name,
      description: req.body.description,
      categoryId: req.body.categoryId,
      imageUrl: req.body.imageUrl,
      subcategoryId: newSubCategoryId
    });

    if (!req.file) {
      console.log("CONTROLLER - Error: No file uploaded");
      return { error: "Image is required" };  // Return an error message instead of sending a response directly
    }

    // Validate required fields
    if (!req.body.name || !req.body.name.trim()) {
      console.log("CONTROLLER - Error: Subcategory name is required");
      return { error: "Subcategory name is required" };
    }

    // Ensure image URL is provided (uploaded to S3 beforehand)
    if (!req.body.imageUrl) {
      console.log("CONTROLLER - Error: Image URL not provided after upload");
      return { error: "Image URL is required" };
    }

    const category = await Category.findById(req.body.categoryId);
    if (!category) {
      console.log("CONTROLLER - Error: Category not found");
      return { error: "Category not found" };  // Return an error message instead of sending a response directly
    }

    const newSubCategory = new SubCategory({
      _id: newSubCategoryId,  // Assign the generated ID
      name: req.body.name.trim(),
      description: req.body.description ? req.body.description.trim() : '',
      categoryId: req.body.categoryId,
      imageUrl: req.body.imageUrl,  // Image URL from S3
    });

    await newSubCategory.save();
    console.log("CONTROLLER - Subcategory created successfully:", newSubCategory);
    return newSubCategory;  // Return the subcategory data instead of sending a response
  } catch (err) {
    console.error("CONTROLLER - Create subcategory error:", err);
    return { error: err.message };  // Return the error message
  }
};


// Get all subcategories
exports.getAllSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.find().lean();
    
    // Ensure all subcategories have a valid image URL (add placeholder if missing)
    const subCategoriesWithImages = subCategories.map(subCategory => {
      if (!subCategory.imageUrl || subCategory.imageUrl.trim() === '') {
        subCategory.imageUrl = `${req.protocol}://${req.get('host')}/api/placeholder/64/64?text=${encodeURIComponent(subCategory.name)}`;
      }
      return subCategory;
    });
    
    // Set no-cache headers to prevent stale data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.status(200).json(ApiResponse(subCategoriesWithImages, "Subcategories fetched successfully", true, 200));
  } catch (err) {
    console.error(err);
    res.status(500).json(ApiResponse(null, err.message, false, 500));
  }
};

// Get a single subcategory by ID
exports.getSubCategoryById = async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      return res.status(404).json(ApiResponse(null, "SubCategory not found", false, 404));
    }
    
    // Ensure subcategory has a valid image URL (add placeholder if missing)
    const subCategoryObj = subCategory.toObject();
    if (!subCategoryObj.imageUrl || subCategoryObj.imageUrl.trim() === '') {
      subCategoryObj.imageUrl = `${req.protocol}://${req.get('host')}/api/placeholder/64/64?text=${encodeURIComponent(subCategoryObj.name)}`;
    }
    
    res.status(200).json(ApiResponse(subCategoryObj, "SubCategory fetched successfully", true, 200));
  } catch (err) {
    console.error(err);
    res.status(500).json(ApiResponse(null, err.message, false, 500));
  }
};

// Get subcategories by category ID
exports.getSubCategoriesByCategory = async (req, res) => {
  try {
    console.log('🔍 getSubCategoriesByCategory called with categoryId:', req.params.categoryId);
    console.log('🔍 categoryId type:', typeof req.params.categoryId);
    
    const subCategories = await SubCategory.find({ categoryId: req.params.categoryId })
      .select('-__v') // Exclude version field
      .lean();
    
    console.log('🔍 Query result count:', subCategories.length);
    if (subCategories.length > 0) {
      console.log('🔍 First result:', subCategories[0].name);
    }

    if (!subCategories || subCategories.length === 0) {
      return res.status(404).json(ApiResponse([], "No subcategories found.", false, 404));
    }

    return res.status(200).json(ApiResponse(subCategories, "Subcategories retrieved successfully.", true, 200));

  } catch (err) {
    console.error("Error fetching subcategories:", err);
    return res.status(500).json(ApiResponse(null, "Internal Server Error.", false, 500));
  }
};


// Update a subcategory
exports.updateSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      return res.status(404).json(ApiResponse(null, "SubCategory not found", false, 404));
    }

    subCategory.name = req.body.name || subCategory.name;
    subCategory.description = req.body.description || subCategory.description;
    subCategory.categoryId = req.body.categoryId || subCategory.categoryId;
    subCategory.imageUrl = req.body.imageUrl ? req.body.imageUrl : subCategory.imageUrl;

    await subCategory.save();
    res.status(200).json(subCategory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Delete a subcategory
exports.deleteSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      return res.status(404).json({ message: "SubCategory not found" });
    }

    if (subCategory.imageUrl) {
      await deleteFileFromS3(subCategory.imageUrl);
    }

    await subCategory.deleteOne();
    res.status(200).json({ message: "SubCategory deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
// Get total subcategory count
exports.getTotalSubCategories = async (req, res) => {
  try {
    const count = await SubCategory.countDocuments();
    res.status(200).json(ApiResponse({ totalSubCategories: count }, "Total subcategories count fetched successfully", true, 200));
  } catch (err) {
    console.error(err);
    res.status(500).json(ApiResponse(null, err.message, false, 500));
  }
};
