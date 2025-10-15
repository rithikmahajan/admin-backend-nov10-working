const Cart = require("../../models/Cart");
const GuestCart = require("../../models/GuestCart");
const { ApiResponse } = require("../../utils/ApiResponse");
const Item = require("../../models/Item"); // Model for the item being added to the cart

// ✅ Add item to cart (supports both authenticated and guest users)
exports.create = async (req, res) => {
  let itemId, size, sku, quantity, userId, sessionId; // Declare variables at function scope for error handling
  
  try {
    console.log("🛒 CART ADD REQUEST - req.body", req.body);
    ({ itemId, size, sku, quantity, sessionId } = req.body); // Extract relevant data from request body
    console.log("sku", sku);
    
    // Check if user is authenticated or using guest session
    const isAuthenticated = req.user && req.user._id;
    if (isAuthenticated) {
      userId = req.user._id; // Get current user's ID from authenticated request
    } else if (sessionId) {
      // Guest user with session ID
      console.log("🔓 Guest user with session:", sessionId);
    } else {
      return res.status(400).json(ApiResponse(
        null, 
        "Either authentication or sessionId is required to add items to cart", 
        false, 
        400
      ));
    }

    // Check if the item exists in the database
    const itemExists = await Item.findById(itemId);
    if (!itemExists) {
      return res.status(404).json(ApiResponse(null, "Item not found", false, 404));
    }

    // Debug: Log item sizes structure
    console.log("Available sizes for item:", itemExists.sizes.map(s => ({ size: s.size, sku: s.sku, stock: s.stock || s.quantity })));
    console.log("Looking for - size:", size, "sku:", sku);

    // More flexible validation - check by size first, then by SKU if provided
    let sizeVariant;
    
    if (sku) {
      // If SKU is provided, validate both size and SKU
      sizeVariant = itemExists.sizes.find(s => s.size === size && s.sku === sku);
      if (!sizeVariant) {
        // Try finding by SKU only
        sizeVariant = itemExists.sizes.find(s => s.sku === sku);
        if (!sizeVariant) {
          // Try finding by size only
          sizeVariant = itemExists.sizes.find(s => s.size === size);
          if (sizeVariant) {
            console.log("Found size variant by size only, using its SKU:", sizeVariant.sku);
            // Update the sku to match what we found
            sku = sizeVariant.sku;
          }
        }
      }
    } else {
      // If no SKU provided, find by size only
      sizeVariant = itemExists.sizes.find(s => s.size === size);
      if (sizeVariant) {
        // Use the SKU from the found size variant
        sku = sizeVariant.sku;
        console.log("No SKU provided, using SKU from size variant:", sku);
      }
    }

    if (!sizeVariant) {
      return res.status(400).json(ApiResponse(
        {
          availableSizes: itemExists.sizes.map(s => ({ size: s.size, sku: s.sku, stock: s.stock || s.quantity })),
          requestedSize: size,
          requestedSku: sku
        }, 
        "Invalid size or SKU", 
        false, 
        400
      ));
    }

    // Check stock availability
    const availableStock = sizeVariant.stock || sizeVariant.quantity || 0;
    if (availableStock < quantity) {
      return res.status(400).json(ApiResponse(
        {
          availableStock,
          requestedQuantity: quantity,
          size: sizeVariant.size,
          sku: sizeVariant.sku
        },
        `Insufficient stock. Only ${availableStock} items available`,
        false,
        400
      ));
    }

    // Handle authenticated vs guest users
    if (isAuthenticated) {
      // Authenticated user - use regular Cart model
      let existingCartItem = await Cart.findOne({ user: userId, item: itemId, sku });
      if (existingCartItem) {
        existingCartItem.quantity += quantity;
        await existingCartItem.save();
        return res.status(200).json(ApiResponse(existingCartItem, "Cart updated successfully", true, 200));
      }

      // Otherwise, add a new item entry to the cart
      const newCartItem = new Cart({
        user: userId,
        item: itemId,
        size, // Size from the item's sizes
        sku, // Stock Keeping Unit, uniquely identifies the item variant
        quantity,
      });
      await newCartItem.save();
      return res.status(201).json(ApiResponse(newCartItem, "Item added to cart successfully", true, 201));
    } else {
      // Guest user - use GuestCart model
      let existingGuestCartItem = await GuestCart.findOne({ sessionId, item: itemId, sku });
      if (existingGuestCartItem) {
        existingGuestCartItem.quantity += quantity;
        await existingGuestCartItem.save();
        return res.status(200).json(ApiResponse(existingGuestCartItem, "Guest cart updated successfully", true, 200));
      }

      // Otherwise, add a new item entry to the guest cart
      const newGuestCartItem = new GuestCart({
        sessionId,
        item: itemId,
        size, // Size from the item's sizes
        sku, // Stock Keeping Unit, uniquely identifies the item variant
        quantity,
        deviceId: req.headers['x-device-id'] // Optional device tracking
      });
      await newGuestCartItem.save();
      return res.status(201).json(ApiResponse(newGuestCartItem, "Item added to guest cart successfully", true, 201));
    }

    res.status(201).json(ApiResponse(newCartItem, "Item added to cart successfully", true, 201));
  } catch (error) {
    console.error("❌ CART CREATION ERROR:");
    console.error("Error type:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Request data:", { itemId, size, sku, quantity, userId });
    
    // Provide more specific error messages
    let errorMessage = "Error adding product to cart";
    if (error.name === 'ValidationError') {
      errorMessage = `Database validation error: ${error.message}`;
    } else if (error.name === 'CastError') {
      errorMessage = `Invalid data format: ${error.message}`;
    } else if (error.code === 11000) {
      errorMessage = "Duplicate entry error";
    }
    
    res.status(500).json(ApiResponse(null, errorMessage, false, 500, error.message));
  }
};

// ✅ Get cart items (supports both authenticated and guest users)
exports.getByUserId = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const isAuthenticated = req.user && req.user._id;
    
    if (isAuthenticated) {
      const userId = req.user._id;
      // Fetch all cart items for authenticated user
      const result = await Cart.find({ user: userId })
        .populate("item"); // Fetch full item details including sizes
      
      res.status(200).json(ApiResponse(result, "Cart retrieved successfully", true, 200));
    } else if (sessionId) {
      // Fetch guest cart items
      const result = await GuestCart.find({ sessionId })
        .populate("item"); // Fetch full item details including sizes
      
      res.status(200).json(ApiResponse(result, "Guest cart retrieved successfully", true, 200));
    } else {
      return res.status(400).json(ApiResponse(
        null, 
        "Either authentication or sessionId is required to get cart items", 
        false, 
        400
      ));
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(ApiResponse(null, "Error fetching cart items", false, 500));
  }
};

// ✅ Update cart item quantity, size, or SKU
exports.updateById = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, size, sku } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (size !== undefined) updateData.size = size;
    if (sku !== undefined) updateData.sku = sku;

    // Find cart item by ID and update it
    const updated = await Cart.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("item");

    if (!updated) {
      return res.status(404).json(ApiResponse(null, "Cart item not found", false, 404));
    }

    res.status(200).json(ApiResponse(updated, "Cart item updated successfully", true, 200));
  } catch (error) {
    console.log(error);
    res.status(500).json(ApiResponse(null, "Error updating cart item", false, 500));
  }
};

// ✅ Delete a specific cart item
exports.deleteById = async (req, res) => {
  console.log("🗑️ DELETE CART ITEM BY ID - Starting deletion");
  console.log("🔍 Request details:", { itemId: req.params.id, userId: req.user?._id });

  try {
    const { id } = req.params;

    // Find cart item by ID and delete it
    const deleted = await Cart.findByIdAndDelete(id);

    if (!deleted) {
      console.log(`❌ Cart item not found: ${id}`);
      return res.status(404).json(ApiResponse(null, "Cart item not found", false, 404));
    }

    console.log(`✅ Cart item deleted successfully: ${id}`);
    res.status(200).json(ApiResponse(null, "Cart item removed successfully", true, 200));
  } catch (error) {
    console.error("❌ DELETE BY ID ERROR:", error);
    res.status(500).json(ApiResponse(null, "Error deleting individual cart item", false, 500));
  }
};

// ✅ Clear cart for a user
exports.deleteByUserId = async (req, res) => {
  try {
    const userId = req.user._id;

    // Remove all cart items associated with the user
    await Cart.deleteMany({ user: userId });

    res.status(200).json(ApiResponse(null, "Cart cleared successfully", true, 200));
  } catch (error) {
    console.log(error);
    res.status(500).json(ApiResponse(null, "Error clearing cart", false, 500));
  }
};

// ✅ Delete a cart item by itemId (supports both authenticated and guest users)
exports.deleteByItemId = async (req, res) => {
  console.log("🗑️ DELETE CART ITEM BY ITEM ID - Starting deletion");
  console.log("🔍 Request details:", { 
    itemId: req.params.itemId, 
    sessionId: req.query.sessionId,
    userId: req.user?._id 
  });

  try {
    const { itemId } = req.params;
    const { sessionId } = req.query;
    const isAuthenticated = req.user && req.user._id;

    if (isAuthenticated) {
      const userId = req.user._id;
      console.log(`🗑️ Removing item ${itemId} from authenticated user cart: ${userId}`);
      
      // Remove a specific item from the user's cart
      const deletedItem = await Cart.findOneAndDelete({ user: userId, item: itemId });

      if (!deletedItem) {
        console.log(`❌ Cart item not found: ${itemId} for user: ${userId}`);
        return res.status(404).json(ApiResponse(null, "Cart item not found", false, 404));
      }

      console.log(`✅ Cart item removed successfully: ${itemId}`);
      res.status(200).json(ApiResponse(null, "Cart item removed successfully", true, 200));
    } else if (sessionId) {
      console.log(`🗑️ Removing item ${itemId} from guest cart session: ${sessionId}`);
      
      // Remove a specific item from guest cart
      const deletedItem = await GuestCart.findOneAndDelete({ sessionId, item: itemId });

      if (!deletedItem) {
        console.log(`❌ Guest cart item not found: ${itemId} for session: ${sessionId}`);
        return res.status(404).json(ApiResponse(null, "Guest cart item not found", false, 404));
      }

      console.log(`✅ Guest cart item removed successfully: ${itemId}`);
      res.status(200).json(ApiResponse(null, "Guest cart item removed successfully", true, 200));
    } else {
      console.log("❌ Delete by item ID failed: Missing authentication and sessionId");
      return res.status(400).json(ApiResponse(
        null, 
        "Either authentication or sessionId is required to remove cart items", 
        false, 
        400
      ));
    }
  } catch (error) {
    console.error("❌ DELETE BY ITEM ID ERROR:", error);
    res.status(500).json(ApiResponse(null, "Error removing specific cart item", false, 500));
  }
};

// ✅ Transfer guest cart to authenticated user (called after login/signup)
exports.transferGuestCart = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user._id;

    if (!sessionId) {
      return res.status(400).json(ApiResponse(
        null, 
        "SessionId is required to transfer guest cart", 
        false, 
        400
      ));
    }

    // Transfer guest cart to user
    const transferResult = await GuestCart.transferToUser(sessionId, userId);

    if (transferResult.success) {
      res.status(200).json(ApiResponse(
        { transferredItems: transferResult.transferredItems }, 
        "Guest cart transferred successfully", 
        true, 
        200
      ));
    } else {
      res.status(500).json(ApiResponse(
        null, 
        "Error transferring guest cart: " + transferResult.error, 
        false, 
        500
      ));
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(ApiResponse(null, "Error transferring guest cart", false, 500));
  }
};

// ✅ Clear cart (supports both authenticated and guest users)
exports.clearCart = async (req, res) => {
  console.log("🛒 CART CLEAR REQUEST - Starting cart clear operation");
  console.log("🔍 Request details:", {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: {
      authorization: req.headers.authorization ? "Bearer [PRESENT]" : "NOT_PRESENT",
      contentType: req.headers['content-type']
    }
  });

  try {
    const { sessionId } = req.query;
    const isAuthenticated = req.user && req.user._id;

    console.log("🔐 Authentication status:", {
      isAuthenticated,
      userId: isAuthenticated ? req.user._id : null,
      sessionId: sessionId || null
    });

    if (isAuthenticated) {
      const userId = req.user._id;
      console.log(`🗑️ Clearing cart for authenticated user: ${userId}`);
      
      // Check existing cart items before deletion
      const existingItems = await Cart.find({ user: userId });
      console.log(`📊 Found ${existingItems.length} cart items to delete`);
      
      // Remove all cart items associated with the user
      const deleteResult = await Cart.deleteMany({ user: userId });
      console.log(`✅ Deletion result:`, {
        deletedCount: deleteResult.deletedCount,
        acknowledged: deleteResult.acknowledged
      });
      
      const responseData = {
        itemsRemoved: deleteResult.deletedCount,
        userId: userId
      };
      
      console.log("✅ Cart cleared successfully for authenticated user");
      res.status(200).json(ApiResponse(responseData, "Cart cleared successfully", true, 200));
      
    } else if (sessionId) {
      console.log(`🗑️ Clearing guest cart for session: ${sessionId}`);
      
      // Check existing guest cart items before deletion
      const existingItems = await GuestCart.find({ sessionId });
      console.log(`📊 Found ${existingItems.length} guest cart items to delete`);
      
      // Remove all guest cart items associated with the session
      const deleteResult = await GuestCart.deleteMany({ sessionId });
      console.log(`✅ Guest deletion result:`, {
        deletedCount: deleteResult.deletedCount,
        acknowledged: deleteResult.acknowledged
      });
      
      const responseData = {
        itemsRemoved: deleteResult.deletedCount,
        sessionId: sessionId
      };
      
      console.log("✅ Guest cart cleared successfully");
      res.status(200).json(ApiResponse(responseData, "Guest cart cleared successfully", true, 200));
      
    } else {
      console.log("❌ Cart clear failed: Missing authentication and sessionId");
      return res.status(400).json(ApiResponse(
        null, 
        "Either authentication or sessionId is required to clear cart", 
        false, 
        400
      ));
    }
  } catch (error) {
    console.error("❌ CART CLEAR ERROR:", error);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Error details:", {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    // Determine error type and return appropriate response
    let statusCode = 500;
    let errorMessage = "Error clearing cart";
    
    if (error.name === 'CastError') {
      statusCode = 400;
      errorMessage = "Invalid user ID or session ID format";
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = "Invalid request data";
    } else if (error.code === 11000) {
      statusCode = 409;
      errorMessage = "Conflict in cart operation";
    }
    
    res.status(statusCode).json(ApiResponse(null, errorMessage, false, statusCode));
  }
};

// ✅ NEW: Update cart item quantity - Frontend compatible endpoint
exports.updateCartItem = async (req, res) => {
  console.log("🔄 UPDATE CART ITEM - Starting update");
  console.log("🔍 Request body:", req.body);
  
  try {
    const { itemId, sizeId, size, quantity, sessionId } = req.body;
    const isAuthenticated = req.user && req.user._id;
    
    // Determine which size identifier to use
    const sizeToFind = sizeId || size;
    
    if (!itemId || !sizeToFind || quantity === undefined) {
      return res.status(400).json(ApiResponse(
        null,
        "itemId, size/sizeId, and quantity are required",
        false,
        400
      ));
    }

    if (isAuthenticated) {
      const userId = req.user._id;
      console.log(`🔄 Updating cart for authenticated user: ${userId}`);
      
      // Find and update the cart item
      const cartItem = await Cart.findOne({ 
        user: userId, 
        item: itemId, 
        size: sizeToFind 
      }).populate("item");

      if (!cartItem) {
        return res.status(404).json(ApiResponse(
          null,
          "Cart item not found",
          false,
          404
        ));
      }

      // Validate stock availability
      const itemData = cartItem.item;
      const sizeVariant = itemData.sizes.find(s => s.size === sizeToFind);
      
      if (sizeVariant) {
        const availableStock = sizeVariant.stock || sizeVariant.quantity || 0;
        if (availableStock < quantity) {
          return res.status(400).json(ApiResponse(
            { availableStock, requestedQuantity: quantity },
            `Insufficient stock. Only ${availableStock} items available`,
            false,
            400
          ));
        }
      }

      // Update quantity
      cartItem.quantity = quantity;
      await cartItem.save();

      // Get all cart items for summary
      const allCartItems = await Cart.find({ user: userId }).populate("item");
      const totalItems = allCartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = allCartItems.reduce((sum, item) => {
        const sizeData = item.item.sizes.find(s => s.size === item.size);
        const price = sizeData?.salePrice || sizeData?.regularPrice || sizeData?.price || 0;
        return sum + (price * item.quantity);
      }, 0);

      console.log("✅ Cart updated successfully");
      res.status(200).json(ApiResponse(
        {
          cart: {
            items: allCartItems,
            totalItems,
            totalPrice
          }
        },
        "Cart updated successfully",
        true,
        200
      ));
    } else if (sessionId) {
      console.log(`🔄 Updating guest cart for session: ${sessionId}`);
      
      // Find and update the guest cart item
      const cartItem = await GuestCart.findOne({ 
        sessionId, 
        item: itemId, 
        size: sizeToFind 
      }).populate("item");

      if (!cartItem) {
        return res.status(404).json(ApiResponse(
          null,
          "Cart item not found",
          false,
          404
        ));
      }

      // Validate stock availability
      const itemData = cartItem.item;
      const sizeVariant = itemData.sizes.find(s => s.size === sizeToFind);
      
      if (sizeVariant) {
        const availableStock = sizeVariant.stock || sizeVariant.quantity || 0;
        if (availableStock < quantity) {
          return res.status(400).json(ApiResponse(
            { availableStock, requestedQuantity: quantity },
            `Insufficient stock. Only ${availableStock} items available`,
            false,
            400
          ));
        }
      }

      // Update quantity
      cartItem.quantity = quantity;
      await cartItem.save();

      // Get all cart items for summary
      const allCartItems = await GuestCart.find({ sessionId }).populate("item");
      const totalItems = allCartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = allCartItems.reduce((sum, item) => {
        const sizeData = item.item.sizes.find(s => s.size === item.size);
        const price = sizeData?.salePrice || sizeData?.regularPrice || sizeData?.price || 0;
        return sum + (price * item.quantity);
      }, 0);

      console.log("✅ Guest cart updated successfully");
      res.status(200).json(ApiResponse(
        {
          cart: {
            items: allCartItems,
            totalItems,
            totalPrice
          }
        },
        "Cart updated successfully",
        true,
        200
      ));
    } else {
      return res.status(400).json(ApiResponse(
        null,
        "Either authentication or sessionId is required",
        false,
        400
      ));
    }
  } catch (error) {
    console.error("❌ UPDATE CART ITEM ERROR:", error);
    res.status(500).json(ApiResponse(
      null,
      "Error updating cart item",
      false,
      500
    ));
  }
};

// ✅ NEW: Remove item from cart - Frontend compatible endpoint
exports.removeCartItem = async (req, res) => {
  console.log("🗑️ REMOVE CART ITEM - Starting removal");
  console.log("🔍 Request body:", req.body);
  
  try {
    const { itemId, sizeId, size, sessionId } = req.body;
    const isAuthenticated = req.user && req.user._id;
    
    // Determine which size identifier to use
    const sizeToFind = sizeId || size;
    
    if (!itemId) {
      return res.status(400).json(ApiResponse(
        null,
        "itemId is required",
        false,
        400
      ));
    }

    if (isAuthenticated) {
      const userId = req.user._id;
      console.log(`🗑️ Removing item from authenticated user cart: ${userId}`);
      
      // Build query - if size is provided, use it; otherwise just item ID
      const query = { user: userId, item: itemId };
      if (sizeToFind) {
        query.size = sizeToFind;
      }
      
      const deletedItem = await Cart.findOneAndDelete(query);

      if (!deletedItem) {
        return res.status(404).json(ApiResponse(
          null,
          "Cart item not found",
          false,
          404
        ));
      }

      console.log("✅ Item removed successfully");
      res.status(200).json(ApiResponse(
        null,
        "Item removed from cart",
        true,
        200
      ));
    } else if (sessionId) {
      console.log(`🗑️ Removing item from guest cart: ${sessionId}`);
      
      // Build query - if size is provided, use it; otherwise just item ID
      const query = { sessionId, item: itemId };
      if (sizeToFind) {
        query.size = sizeToFind;
      }
      
      const deletedItem = await GuestCart.findOneAndDelete(query);

      if (!deletedItem) {
        return res.status(404).json(ApiResponse(
          null,
          "Cart item not found",
          false,
          404
        ));
      }

      console.log("✅ Guest cart item removed successfully");
      res.status(200).json(ApiResponse(
        null,
        "Item removed from cart",
        true,
        200
      ));
    } else {
      return res.status(400).json(ApiResponse(
        null,
        "Either authentication or sessionId is required",
        false,
        400
      ));
    }
  } catch (error) {
    console.error("❌ REMOVE CART ITEM ERROR:", error);
    res.status(500).json(ApiResponse(
      null,
      "Error removing cart item",
      false,
      500
    ));
  }
};
