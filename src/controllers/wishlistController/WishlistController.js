const Wishlist = require("../../models/Wishlist");
const GuestWishlist = require("../../models/GuestWishlist");
const Item = require("../../models/Item");
const { ApiResponse } = require("../../utils/ApiResponse");

// ✅ Add an item to the wishlist (supports both authenticated and guest users)
exports.addToWishlist = async (req, res) => {
    console.log("inside", req.user); // Debugging user info

    try {
        console.log("inside", req.body); // Debugging request body
        const { itemId, sessionId } = req.body;
        const isAuthenticated = req.user && req.user._id;
        
        if (!isAuthenticated && !sessionId) {
            return res.status(400).json(ApiResponse(
                null, 
                "Either authentication or sessionId is required to add items to wishlist", 
                false, 
                400
            ));
        }

        const userId = isAuthenticated ? req.user._id : null;

        // Check if the item exists in the Item collection
        const itemExists = await Item.findById(itemId);
        if (!itemExists) {
            return res.status(404).json(ApiResponse(null, "Item not found", false, 404));
        }

        if (isAuthenticated) {
            // Authenticated user - use regular Wishlist model
            const alreadyInWishlist = await Wishlist.findOne({ user: userId, item: itemId });
            if (alreadyInWishlist) {
                return res.status(400).json(ApiResponse(null, "Item is already in wishlist", false, 400));
            }

            // Create and save new wishlist item
            const newWishlistItem = new Wishlist({ user: userId, item: itemId });
            await newWishlistItem.save();

            res.status(201).json(ApiResponse(newWishlistItem, "Item added to wishlist", true, 201));
        } else {
            // Guest user - use GuestWishlist model
            const alreadyInGuestWishlist = await GuestWishlist.findOne({ sessionId, item: itemId });
            if (alreadyInGuestWishlist) {
                return res.status(400).json(ApiResponse(null, "Item is already in guest wishlist", false, 400));
            }

            // Create and save new guest wishlist item
            const newGuestWishlistItem = new GuestWishlist({ 
                sessionId, 
                item: itemId,
                deviceId: req.headers['x-device-id'] // Optional device tracking
            });
            await newGuestWishlistItem.save();

            res.status(201).json(ApiResponse(newGuestWishlistItem, "Item added to guest wishlist", true, 201));
        }
    } catch (error) {
        res.status(500).json(ApiResponse(null, "Server error", false, 500));
    }
};

// ✅ Get all wishlist items (supports both authenticated and guest users) with pagination
exports.getWishlist = async (req, res) => {
    try {
        let { page, limit, sessionId } = req.query;
        const isAuthenticated = req.user && req.user._id;

        // Set default pagination values if not provided
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;

        if (isAuthenticated) {
            const userId = req.user._id;
            // Fetch wishlist items with pagination and populate item details
            const wishlist = await Wishlist.find({ user: userId })
                .populate("item")
                .skip(skip)
                .limit(limit);

            // Get total wishlist count for pagination metadata
            const totalItems = await Wishlist.countDocuments({ user: userId });

            res.status(200).json(ApiResponse({
                wishlist,
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page
            }, "Wishlist retrieved successfully", true, 200));
        } else if (sessionId) {
            // Fetch guest wishlist items with pagination and populate item details
            const wishlist = await GuestWishlist.find({ sessionId })
                .populate("item")
                .skip(skip)
                .limit(limit);

            // Get total guest wishlist count for pagination metadata
            const totalItems = await GuestWishlist.countDocuments({ sessionId });

            res.status(200).json(ApiResponse({
                wishlist,
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page
            }, "Guest wishlist retrieved successfully", true, 200));
        } else {
            return res.status(400).json(ApiResponse(
                null, 
                "Either authentication or sessionId is required to get wishlist items", 
                false, 
                400
            ));
        }
    } catch (error) {
        res.status(500).json(ApiResponse(null, "Server error", false, 500));
    }
};

// ✅ Remove a specific item from the wishlist (supports both authenticated and guest users)
exports.removeFromWishlist = async (req, res) => {
    try {
        const wishlistItemId = req.params.itemId; // This is the wishlist entry ID, not product ID
        const { sessionId } = req.query;
        const isAuthenticated = req.user && req.user._id;

        // Add debug logging to help diagnose issues
        console.log("🗑️  DELETE WISHLIST ITEM - Debug Info:", {
            wishlistItemId,
            sessionId,
            isAuthenticated: !!isAuthenticated,
            userId: isAuthenticated ? req.user._id : null,
            requestQuery: req.query,
            requestParams: req.params
        });

        if (isAuthenticated) {
            const userId = req.user._id;
            
            // Try to find and remove by wishlist entry ID first
            let wishlistItem = await Wishlist.findOneAndDelete({ 
                _id: wishlistItemId, 
                user: userId 
            });
            
            // If not found by wishlist ID, try by product ID (backward compatibility)
            if (!wishlistItem) {
                console.log("🔄 Trying to find by product ID (backward compatibility):", wishlistItemId);
                wishlistItem = await Wishlist.findOneAndDelete({ 
                    user: userId, 
                    item: wishlistItemId 
                });
            }
            
            if (!wishlistItem) {
                console.log("❌ Wishlist item not found for user:", { userId, wishlistItemId });
                return res.status(404).json(ApiResponse(null, "Item not found in wishlist", false, 404));
            }

            console.log("✅ Wishlist item removed successfully:", wishlistItem._id);
            res.status(200).json(ApiResponse(null, "Item removed from wishlist", true, 200));
        } else if (sessionId) {
            // Try to find and remove by wishlist entry ID first
            let guestWishlistItem = await GuestWishlist.findOneAndDelete({ 
                _id: wishlistItemId, 
                sessionId 
            });
            
            // If not found by wishlist ID, try by product ID (backward compatibility)
            if (!guestWishlistItem) {
                console.log("🔄 Trying to find guest item by product ID (backward compatibility):", wishlistItemId);
                guestWishlistItem = await GuestWishlist.findOneAndDelete({ 
                    sessionId, 
                    item: wishlistItemId 
                });
            }
            
            if (!guestWishlistItem) {
                console.log("❌ Guest wishlist item not found:", { sessionId, wishlistItemId });
                return res.status(404).json(ApiResponse(null, "Item not found in guest wishlist", false, 404));
            }

            console.log("✅ Guest wishlist item removed successfully:", guestWishlistItem._id);
            res.status(200).json(ApiResponse(null, "Item removed from guest wishlist", true, 200));
        } else {
            return res.status(400).json(ApiResponse(
                null, 
                "Either authentication or sessionId is required to remove wishlist items", 
                false, 
                400
            ));
        }
    } catch (error) {
        res.status(500).json(ApiResponse(null, "Server error", false, 500));
    }
};

// ✅ Clear the entire wishlist (supports both authenticated and guest users)
exports.clearWishlist = async (req, res) => {
    try {
        const { sessionId } = req.query;
        const isAuthenticated = req.user && req.user._id;

        if (isAuthenticated) {
            const userId = req.user._id;
            // Delete all wishlist items for the current user
            await Wishlist.deleteMany({ user: userId });
            res.status(200).json(ApiResponse(null, "Wishlist cleared successfully", true, 200));
        } else if (sessionId) {
            // Delete all guest wishlist items for the current session
            await GuestWishlist.deleteMany({ sessionId });
            res.status(200).json(ApiResponse(null, "Guest wishlist cleared successfully", true, 200));
        } else {
            return res.status(400).json(ApiResponse(
                null, 
                "Either authentication or sessionId is required to clear wishlist", 
                false, 
                400
            ));
        }
    } catch (error) {
        res.status(500).json(ApiResponse(null, "Server error", false, 500));
    }
};

// ✅ Transfer guest wishlist to authenticated user (called after login/signup)
exports.transferGuestWishlist = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.user._id;

        if (!sessionId) {
            return res.status(400).json(ApiResponse(
                null, 
                "SessionId is required to transfer guest wishlist", 
                false, 
                400
            ));
        }

        // Transfer guest wishlist to user
        const transferResult = await GuestWishlist.transferToUser(sessionId, userId);

        if (transferResult.success) {
            res.status(200).json(ApiResponse(
                { transferredItems: transferResult.transferredItems }, 
                "Guest wishlist transferred successfully", 
                true, 
                200
            ));
        } else {
            res.status(500).json(ApiResponse(
                null, 
                "Error transferring guest wishlist: " + transferResult.error, 
                false, 
                500
            ));
        }
    } catch (error) {
        res.status(500).json(ApiResponse(null, "Error transferring guest wishlist", false, 500));
    }
};

// ✅ Move a single item from wishlist to cart (supports both authenticated and guest users)
exports.moveToCart = async (req, res) => {
    try {
        const { itemId, size, sku, quantity = 1, sessionId } = req.body;
        const isAuthenticated = req.user && req.user._id;
        
        if (!isAuthenticated && !sessionId) {
            return res.status(400).json(ApiResponse(
                null, 
                "Either authentication or sessionId is required", 
                false, 
                400
            ));
        }

        const userId = isAuthenticated ? req.user._id : null;

        // Verify the item exists in the wishlist
        let wishlistItem;
        if (isAuthenticated) {
            wishlistItem = await Wishlist.findOne({ user: userId, item: itemId });
        } else {
            wishlistItem = await GuestWishlist.findOne({ sessionId, item: itemId });
        }

        if (!wishlistItem) {
            return res.status(404).json(ApiResponse(null, "Item not found in wishlist", false, 404));
        }

        // Check if the item exists in the Item collection
        const itemExists = await Item.findById(itemId);
        if (!itemExists) {
            return res.status(404).json(ApiResponse(null, "Item not found", false, 404));
        }

        // Validate size and SKU if provided
        let sizeVariant;
        if (size) {
            if (sku) {
                sizeVariant = itemExists.sizes.find(s => s.size === size && s.sku === sku);
            } else {
                sizeVariant = itemExists.sizes.find(s => s.size === size);
            }
            
            if (!sizeVariant) {
                return res.status(400).json(ApiResponse(
                    {
                        availableSizes: itemExists.sizes.map(s => ({ size: s.size, sku: s.sku })),
                        requestedSize: size,
                        requestedSku: sku
                    }, 
                    "Invalid size or SKU", 
                    false, 
                    400
                ));
            }
        }

        // Import cart models
        const Cart = require("../../models/Cart");
        const GuestCart = require("../../models/GuestCart");

        // Add to cart
        if (isAuthenticated) {
            // Check if item already exists in cart
            const existingCartItem = await Cart.findOne({ 
                user: userId, 
                item: itemId, 
                size: size || sizeVariant?.size,
                sku: sku || sizeVariant?.sku 
            });

            if (existingCartItem) {
                // Update quantity
                existingCartItem.quantity += quantity;
                await existingCartItem.save();
            } else {
                // Create new cart item
                const newCartItem = new Cart({
                    user: userId,
                    item: itemId,
                    size: size || sizeVariant?.size || itemExists.sizes[0]?.size,
                    sku: sku || sizeVariant?.sku || itemExists.sizes[0]?.sku,
                    quantity
                });
                await newCartItem.save();
            }
        } else {
            // Guest user
            const existingGuestCartItem = await GuestCart.findOne({ 
                sessionId, 
                item: itemId, 
                size: size || sizeVariant?.size,
                sku: sku || sizeVariant?.sku 
            });

            if (existingGuestCartItem) {
                // Update quantity
                existingGuestCartItem.quantity += quantity;
                await existingGuestCartItem.save();
            } else {
                // Create new guest cart item
                const newGuestCartItem = new GuestCart({
                    sessionId,
                    item: itemId,
                    size: size || sizeVariant?.size || itemExists.sizes[0]?.size,
                    sku: sku || sizeVariant?.sku || itemExists.sizes[0]?.sku,
                    quantity
                });
                await newGuestCartItem.save();
            }
        }

        // Remove from wishlist
        await wishlistItem.deleteOne();

        res.status(200).json(ApiResponse(
            { 
                itemId, 
                size: size || sizeVariant?.size || itemExists.sizes[0]?.size,
                sku: sku || sizeVariant?.sku || itemExists.sizes[0]?.sku,
                quantity 
            }, 
            "Item moved from wishlist to cart successfully", 
            true, 
            200
        ));

    } catch (error) {
        console.error("Error moving item from wishlist to cart:", error);
        res.status(500).json(ApiResponse(null, "Error moving item to cart", false, 500));
    }
};

// ✅ Move all items from wishlist to cart (supports both authenticated and guest users)
exports.moveAllToCart = async (req, res) => {
    try {
        const { sessionId, defaultSize = null } = req.body;
        const isAuthenticated = req.user && req.user._id;
        
        if (!isAuthenticated && !sessionId) {
            return res.status(400).json(ApiResponse(
                null, 
                "Either authentication or sessionId is required", 
                false, 
                400
            ));
        }

        const userId = isAuthenticated ? req.user._id : null;

        // Get all wishlist items
        let wishlistItems;
        if (isAuthenticated) {
            wishlistItems = await Wishlist.find({ user: userId }).populate('item');
        } else {
            wishlistItems = await GuestWishlist.find({ sessionId }).populate('item');
        }

        if (wishlistItems.length === 0) {
            return res.status(404).json(ApiResponse(null, "No items found in wishlist", false, 404));
        }

        // Import cart models
        const Cart = require("../../models/Cart");
        const GuestCart = require("../../models/GuestCart");

        const movedItems = [];
        const failedItems = [];

        // Process each wishlist item
        for (const wishlistItem of wishlistItems) {
            try {
                const item = wishlistItem.item;
                
                if (!item) {
                    failedItems.push({ itemId: wishlistItem.item, reason: "Item not found" });
                    continue;
                }

                // Use default size if available, otherwise use first available size
                const sizeToUse = defaultSize || item.sizes[0]?.size;
                const skuToUse = item.sizes.find(s => s.size === sizeToUse)?.sku || item.sizes[0]?.sku;

                if (isAuthenticated) {
                    // Check if item already exists in cart
                    const existingCartItem = await Cart.findOne({ 
                        user: userId, 
                        item: item._id, 
                        size: sizeToUse,
                        sku: skuToUse 
                    });

                    if (existingCartItem) {
                        existingCartItem.quantity += 1;
                        await existingCartItem.save();
                    } else {
                        const newCartItem = new Cart({
                            user: userId,
                            item: item._id,
                            size: sizeToUse,
                            sku: skuToUse,
                            quantity: 1
                        });
                        await newCartItem.save();
                    }
                } else {
                    // Guest user
                    const existingGuestCartItem = await GuestCart.findOne({ 
                        sessionId, 
                        item: item._id, 
                        size: sizeToUse,
                        sku: skuToUse 
                    });

                    if (existingGuestCartItem) {
                        existingGuestCartItem.quantity += 1;
                        await existingGuestCartItem.save();
                    } else {
                        const newGuestCartItem = new GuestCart({
                            sessionId,
                            item: item._id,
                            size: sizeToUse,
                            sku: skuToUse,
                            quantity: 1
                        });
                        await newGuestCartItem.save();
                    }
                }

                movedItems.push({
                    itemId: item._id,
                    name: item.name,
                    size: sizeToUse,
                    sku: skuToUse
                });

                // Remove from wishlist
                await wishlistItem.deleteOne();

            } catch (error) {
                failedItems.push({ 
                    itemId: wishlistItem.item._id || wishlistItem.item, 
                    reason: error.message 
                });
            }
        }

        res.status(200).json(ApiResponse(
            { 
                movedItems,
                failedItems,
                totalMoved: movedItems.length,
                totalFailed: failedItems.length
            }, 
            `Successfully moved ${movedItems.length} items from wishlist to cart`, 
            true, 
            200
        ));

    } catch (error) {
        console.error("Error moving all items from wishlist to cart:", error);
        res.status(500).json(ApiResponse(null, "Error moving items to cart", false, 500));
    }
};
