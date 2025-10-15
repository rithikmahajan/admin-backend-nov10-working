const mongoose = require("mongoose");
const { deleteFileFromS3 } = require("../utils/S3");

// Define schema for SubCategory
const subCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Name of the subcategory
    description: { type: String }, // Optional description
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true }, // Each SubCategory belongs to 1 Category
    imageUrl: { type: String }, // S3 Image URL for subcategory
    displayOrder: { type: Number, default: 0, index: true }, // Display order for arrangement control
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Delete only subcategory's own resources when deleted
subCategorySchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  // Delete subcategory image from S3 if exists
  if (this.imageUrl) await deleteFileFromS3(this.imageUrl);

  next(); // Proceed to delete the subcategory document
});

// Export the SubCategory model
module.exports = mongoose.model("SubCategory", subCategorySchema);
