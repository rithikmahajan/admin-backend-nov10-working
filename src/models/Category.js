const mongoose = require("mongoose");
const { deleteFileFromS3 } = require("../utils/S3");

// ==============================
// Category Schema Definition
// ==============================
const categorySchema = new mongoose.Schema(
  {
    // Unique name for the category
    name: { type: String, required: true, unique: true },
    
    // Optional description of the category
    description: { type: String },
    
    // Image URL stored in S3 for category display
    imageUrl: { type: String },
        
    // Display order for arrangement control
    displayOrder: { type: Number, default: 0, index: true },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// ===================================================
// Middleware: Pre-deletion cleanup for Category only
// When a Category document is deleted, clean up only its own resources
// ===================================================
categorySchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  // Delete the category image from S3 if it exists
  if (this.imageUrl) await deleteFileFromS3(this.imageUrl);

  next();
});

// Export the Category model
module.exports = mongoose.model("Category", categorySchema);
