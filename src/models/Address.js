const mongoose = require("mongoose");
const { Schema } = mongoose;

// ==============================
// Address Schema Definition
// ==============================
const addressSchema = new Schema(
  {
    // Reference to the user who owns this address
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Recipient's first name
    firstName: { type: String, required: true },

    // Recipient's last name
    lastName: { type: String, required: true },

    // Street address or detailed address line
    address: { type: String, required: true },

    // City where the address is located
    city: { type: String, required: true },

    // State or province
    state: { type: String, required: true },

    // Postal/ZIP code
    pinCode: { type: String, required: true },

    // Country name
    country: { type: String, required: true },

    // Contact phone number for delivery or verification
    phoneNumber: { type: String, required: true },

    // Email address for delivery notifications and order confirmations
    email: { 
      type: String, 
      required: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    },

    // Optional apartment/unit/suite number
    apartment: { type: String, required: false },

    // Optional landmark for delivery reference
    landmark: { type: String, required: false },

    // Type of address: expanded to include more types
    type: { type: String, enum: ["current", "new", "home", "work", "other"], required: true },
  },
  {
    timestamps: true, // Automatically includes createdAt and updatedAt fields
    versionKey: false // Disables the __v version key
  }
);

// Export the Address model
module.exports = mongoose.model("Address", addressSchema);
