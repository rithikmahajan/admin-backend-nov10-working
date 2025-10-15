const mongoose = require("mongoose");
const { Schema } = mongoose;

// ==============================
// Cart Schema Definition
// ==============================
const cartSchema = new Schema(
  {
    // Reference to the user who owns this cart item
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Reference to the main item/product
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },

    // Size from the item's sizes
    size: { type: String, required: true },

    // SKU (Stock Keeping Unit) representing a unique variation (size combination)
    // This corresponds to the SKU at the size level in Item.sizes.sku
    sku: { type: String, required: true },

    // Quantity of the item in the cart (must be at least 1)
    quantity: { type: Number, default: 1, min: 1 },
  },
  {
    timestamps: true,      // Adds createdAt and updatedAt fields automatically
    versionKey: false      // Disables the __v version key used by Mongoose
  }
);

// ==============================
// Validation Middleware
// ==============================
// Before saving, validate that the SKU and size exist within the associated Item
cartSchema.pre("save", async function (next) {
  const item = await mongoose.model("Item").findById(this.item);

  // Check if item is valid
  if (!item) {
    return next(new Error("Invalid Item reference"));
  }

  // Check if the provided size and SKU exist in the item's sizes
  const sizeVariant = item.sizes.find(size => 
    size.size === this.size && size.sku === this.sku
  );

  if (!sizeVariant) {
    return next(new Error("Invalid size or SKU provided"));
  }

  next();
});

// Export the Cart model
module.exports = mongoose.model("Cart", cartSchema);
