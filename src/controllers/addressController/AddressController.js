const Address = require("../../models/Address");
const { ApiResponse } = require("../../utils/ApiResponse");

// Create Address
exports.create = async (req, res) => {
  try {
    console.log('📍 CREATE ADDRESS - Raw request body:', req.body);
    console.log('📍 CREATE ADDRESS - Headers:', req.headers);
    console.log('📍 CREATE ADDRESS - Content-Type:', req.get('Content-Type'));
    
    const userId = req.user._id; // Extracting userId from token
    console.log('📍 CREATE ADDRESS - User ID:', userId);
    
    // Extract and map fields properly - handle multiple field name variations
    const { 
      firstName, 
      lastName, 
      phone, 
      phoneNumber, 
      email,
      address: addressLine, 
      addressLine1, // Frontend sends this instead of 'address'
      city, 
      state, 
      pinCode, 
      pincode, // Frontend might send this instead of 'pinCode'
      country, 
      type, 
      apartment,
      addressLine2, // Optional second address line
      landmark 
    } = req.body;
    
    // Map field variations to standard names for compatibility
    const finalAddress = addressLine || addressLine1;
    const finalPinCode = pinCode || pincode;
    const finalApartment = apartment || addressLine2;
    const finalCountry = country || 'India'; // Default country to India if not provided

    // Validate required fields (including email) using mapped values
    if (!firstName || !lastName || !finalAddress || !city || !state || !finalPinCode || !email) {
      const missingFields = [];
      if (!firstName) missingFields.push('firstName');
      if (!lastName) missingFields.push('lastName');
      if (!finalAddress) missingFields.push('address (or addressLine1)');
      if (!city) missingFields.push('city');
      if (!state) missingFields.push('state');
      if (!finalPinCode) missingFields.push('pinCode (or pincode)');
      if (!email) missingFields.push('email');
      
      console.log('📍 CREATE ADDRESS - Missing fields:', missingFields);
      return res.status(400).json(
        ApiResponse(null, `Missing required fields: ${missingFields.join(', ')}`, false, 400)
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('📍 CREATE ADDRESS - Invalid email format:', email);
      return res.status(400).json(
        ApiResponse(null, 'Please enter a valid email address', false, 400)
      );
    }

    // Map phone to phoneNumber (frontend sends 'phone', backend expects 'phoneNumber')
    const finalPhoneNumber = phone || phoneNumber;
    if (!finalPhoneNumber) {
      console.log('📍 CREATE ADDRESS - Missing phone number');
      return res.status(400).json(
        ApiResponse(null, 'Phone number is required', false, 400)
      );
    }

    // Create address data object
    const addressData = {
      firstName,
      lastName,
      phoneNumber: finalPhoneNumber,
      email,
      address: finalAddress,
      city,
      state,
      pinCode: finalPinCode,
      country: finalCountry,
      type,
      apartment: apartment || addressLine2 || '', // Use addressLine2 if apartment not provided
      landmark: landmark || '', // Optional field
      user: userId
    };

    console.log('📍 CREATE ADDRESS - Final address data:', addressData);

    // Ensure user does not have more than one 'current' address
    const existingAddress = await Address.findOne({ user: userId, type });

    if (existingAddress && type === "current") {
      return res.status(400).json(ApiResponse(null, "A current address already exists!", false, 400));
    }

    // Create new address with userId from token
    const newAddress = new Address(addressData);
    await newAddress.save();

    console.log('📍 CREATE ADDRESS - Address created successfully:', newAddress._id);
    res.status(201).json(ApiResponse(newAddress, "Address added successfully", true, 201));
  } catch (error) {
    console.error("📍 CREATE ADDRESS - Error creating address:", error);
    console.error("📍 CREATE ADDRESS - Request body:", req.body);
    console.error("📍 CREATE ADDRESS - Error details:", error.message);
    
    // Handle Mongoose validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      console.error("📍 CREATE ADDRESS - Validation errors:", validationErrors);
      
      return res.status(400).json(
        ApiResponse(null, `Validation failed: ${validationErrors.map(e => e.message).join(', ')}`, false, 400)
      );
    }
    
    res.status(500).json(ApiResponse(null, `Server error: ${error.message}`, false, 500));
  }
};

// Get Addresses by User ID (from Token)
exports.getByUserId = async (req, res) => {
  try {
    const userId = req.user._id; // Extracting userId from token
    const addresses = await Address.find({ user: userId });

    if (!addresses.length) {
      return res.status(404).json(ApiResponse(null, "No addresses found", false, 404));
    }

    res.status(200).json(ApiResponse(addresses, "Addresses fetched successfully", true, 200));
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json(ApiResponse(null, "Server error", false, 500));
  }
};

// Update Address by ID
exports.updateById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Ensure only the owner can update their address
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: id, user: userId },
      req.body,
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json(ApiResponse(null, "Address not found or unauthorized", false, 404));
    }

    res.status(200).json(ApiResponse(updatedAddress, "Address updated successfully", true, 200));
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json(ApiResponse(null, "Server error", false, 500));
  }
};

// Delete Address by ID
exports.deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Ensure only the owner can delete their address
    const deletedAddress = await Address.findOneAndDelete({ _id: id, user: userId });

    if (!deletedAddress) {
      return res.status(404).json(ApiResponse(null, "Address not found or unauthorized", false, 404));
    }

    res.status(200).json(ApiResponse(null, "Address deleted successfully", true, 200));
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json(ApiResponse(null, "Server error", false, 500));
  }
};
