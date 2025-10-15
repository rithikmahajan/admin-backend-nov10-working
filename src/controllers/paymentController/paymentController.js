const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../../models/Order");
const { uploadMultipart, deleteFileFromS3 } = require("../../utils/S3");
const mongoose = require("mongoose");
const Item = require("../../models/Item");
const { findSizeVariant } = require("../../utils/skuUtils");

// Import currency and delivery utilities
const { 
  getCurrencyByCountry, 
  convertPrice, 
  formatPriceWithCurrency
} = require("../../utils/currencyUtils");

// Import enhanced price calculation utilities
const {
  calculateEffectivePrice,
  calculateCartTotal,
  validateItemPrice,
  formatPrice
} = require("../../utils/priceCalculation");
const { 
  calculateShippingCost, 
  isIndianLocation 
} = require("../../utils/deliveryUtils");

// Razorpay configuration with environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_live_VRU7ggfYLI7DWV";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "OIOED3FhjWxW2dZ2peNe";

// 🧪 Test Order Flow - Verify automatic order creation system
exports.testOrderFlow = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid order ID" 
      });
    }

    const order = await Order.findById(orderId).populate('items').populate('user');
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Verify user owns this order (security check)
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied - not your order" 
      });
    }

    const flowStatus = {
      orderId: orderId,
      orderCreated: !!order,
      paymentStatus: order.payment_status,
      razorpayOrderId: order.razorpay_order_id,
      razorpayPaymentId: order.razorpay_payment_id,
      shippingStatus: order.shipping_status,
      shiprocketOrderId: order.shiprocket_orderId,
      shipmentId: order.shiprocket_shipment_id,
      awbCode: order.awb_code,
      courierPartner: order.courier_name,
      autoAssigned: order.auto_assigned,
      trackingUrl: order.tracking_url,
      expectedDelivery: order.expected_delivery_date,
      orderTotal: order.total_price,
      itemsCount: order.items.length,
      customerDetails: {
        name: `${order.address.firstName} ${order.address.lastName}`,
        email: order.address.email,
        phone: order.address.phoneNumber,
        address: `${order.address.address}, ${order.address.city}, ${order.address.state} - ${order.address.pinCode}`
      },
      timestamps: {
        orderCreated: order.created_at,
        paymentVerified: order.payment_verified_at,
        shippingStarted: order.shipping_started_at,
        shippingCompleted: order.shipping_completed_at,
        shippingFailed: order.shipping_failed_at
      },
      errors: {
        shippingError: order.shipping_error || null
      }
    };

    // Determine overall flow status
    let overallStatus = 'INCOMPLETE';
    if (order.payment_status === 'Paid' && order.shipping_status === 'SHIPPED' && order.awb_code) {
      overallStatus = 'FULLY_AUTOMATED_SUCCESS';
    } else if (order.payment_status === 'Paid' && order.shipping_status === 'PROCESSING') {
      overallStatus = 'PAYMENT_SUCCESS_SHIPPING_IN_PROGRESS';
    } else if (order.payment_status === 'Paid' && order.shipping_status === 'FAILED') {
      overallStatus = 'PAYMENT_SUCCESS_SHIPPING_FAILED';
    } else if (order.payment_status === 'Pending') {
      overallStatus = 'AWAITING_PAYMENT';
    }

    res.json({
      success: true,
      message: "Order flow status retrieved successfully",
      overallStatus,
      flowStatus,
      recommendations: overallStatus === 'PAYMENT_SUCCESS_SHIPPING_FAILED' 
        ? ['Check shipping error details', 'Retry shipping from admin panel', 'Verify Shiprocket API credentials']
        : overallStatus === 'FULLY_AUTOMATED_SUCCESS'
        ? ['Order fully automated successfully!', 'Customer can track shipment', 'No action required']
        : ['Monitor order progress', 'Check logs for any errors']
    });

  } catch (error) {
    console.error("Test order flow error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error testing order flow",
      error: error.message 
    });
  }
};

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_API_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_API_PASSWORD;

// Validate Shiprocket environment variables
if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
  console.error("❌ Missing Shiprocket credentials in environment variables");
  console.error("Required: SHIPROCKET_API_EMAIL, SHIPROCKET_API_PASSWORD");
}

// Create Order
exports.createOrder = async (req, res) => {
  try {
    const { amount, cart, staticAddress, deliveryOption } = req.body;
    const userId = req.user._id;

    console.log("🛒 CREATE ORDER REQUEST:");
    console.log("amount:", amount);
    console.log("cart:", JSON.stringify(cart, null, 2));
    console.log("staticAddress:", JSON.stringify(staticAddress, null, 2));
    console.log("deliveryOption:", deliveryOption);
    console.log("userId:", userId);

    // Enhanced field validation with detailed logging
    console.log("🔍 REQUEST VALIDATION:");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("User from auth:", req.user ? { id: req.user._id, email: req.user.email } : "No user");
    
    if (!amount || !cart || !staticAddress) {
      console.error("❌ Missing required fields:", {
        has_amount: !!amount,
        amount_value: amount,
        has_cart: !!cart,
        cart_length: cart ? cart.length : 0,
        has_staticAddress: !!staticAddress,
        staticAddress_keys: staticAddress ? Object.keys(staticAddress) : []
      });
      return res.status(400).json({ 
        error: "Missing required fields: amount, cart, and staticAddress are required",
        details: {
          amount: !!amount,
          cart: !!cart && Array.isArray(cart) && cart.length > 0,
          staticAddress: !!staticAddress
        }
      });
    }

    // Enhanced address validation with frontend compatibility
    const requiredAddressFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'address', 'city', 'state', 'pinCode'];
    const missingAddressFields = requiredAddressFields.filter(field => !staticAddress[field]);
    
    if (missingAddressFields.length > 0) {
      console.error("❌ Missing address fields:", missingAddressFields);
      return res.status(400).json({ 
        error: `Missing required address fields: ${missingAddressFields.join(', ')}` 
      });
    }

    // Normalize address format for consistent processing
    const normalizedAddress = {
      firstName: staticAddress.firstName,
      lastName: staticAddress.lastName,
      email: staticAddress.email,
      phoneNumber: staticAddress.phoneNumber,
      address: staticAddress.address,
      city: staticAddress.city,
      state: staticAddress.state,
      pinCode: staticAddress.pinCode,
      country: staticAddress.country || 'India',
      apartment: staticAddress.apartment || staticAddress.unit || '',
      landmark: staticAddress.landmark || ''
    };

    console.log("📍 Normalized delivery address:", normalizedAddress);

    // Determine user location and currency
    const userCountry = staticAddress?.country || 'India';
    const userCurrency = getCurrencyByCountry(userCountry);
    const isIndia = isIndianLocation(userCountry);
    
    console.log("User location context:", { userCountry, userCurrency, isIndia });

    // Validate cart data
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty or invalid" });
    }

    // Extract item IDs and SKUs from cart (handle both 'id' and 'itemId' for compatibility)
    const itemIds = cart.map(cartItem => cartItem.itemId || cartItem.id);
    const skus = cart.map(cartItem => cartItem.sku);

    console.log("🔍 PRODUCT VALIDATION - Starting validation");
    console.log("Extracted item IDs:", itemIds);
    console.log("Item ID types:", itemIds.map(id => typeof id));

    // Convert string IDs to ObjectId for MongoDB query
    const objectIds = itemIds.map(id => {
      try {
        return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
      } catch (err) {
        console.error(`❌ Invalid ObjectId: ${id}`, err);
        return null;
      }
    }).filter(id => id !== null);

    console.log(`✅ Converted ${objectIds.length} valid ObjectIds from ${itemIds.length} items`);

    // Validate itemIds with detailed error messages
    if (objectIds.length !== itemIds.length) {
      const invalidIds = itemIds.filter((id, index) => !objectIds[index]);
      console.error("❌ Invalid item IDs detected:", invalidIds);
      return res.status(400).json({ 
        error: "Invalid item IDs",
        invalidItems: invalidIds.map(id => {
          const cartItem = cart.find(item => (item.itemId || item.id) === id);
          return {
            itemId: id,
            name: cartItem?.name || 'Unknown',
            sku: cartItem?.sku || 'Unknown',
            reason: 'Invalid ID format'
          };
        })
      });
    }

    // Check if all items exist with proper ObjectId query
    console.log("🔍 Querying database with ObjectIds...");
    const existingItems = await Item.find({ 
      _id: { $in: objectIds },
      status: { $in: ['live', 'active', 'published'] } // Only validate live products
    });
    
    console.log(`📦 Found ${existingItems.length} valid products out of ${objectIds.length} requested`);
    
    if (existingItems.length !== objectIds.length) {
      const existingItemIds = existingItems.map(item => item._id.toString());
      const missingItemIds = itemIds.filter(id => !existingItemIds.includes(id.toString()));
      
      console.error("❌ Items not found or not live:", missingItemIds);
      
      return res.status(400).json({ 
        error: "Invalid item IDs",
        message: "Some items in your cart are no longer available",
        invalidItems: missingItemIds.map(id => {
          const cartItem = cart.find(item => (item.itemId || item.id) === id.toString());
          return {
            itemId: id.toString(),
            name: cartItem?.name || 'Unknown',
            sku: cartItem?.sku || 'Unknown',
            size: cartItem?.size || 'Unknown',
            reason: 'Item no longer available or has been removed'
          };
        }),
        suggestion: "Please remove these items from your cart and try again"
      });
    }

    console.log("✅ All products validated successfully");

    // Enhanced cart validation with robust price calculation
    const itemDetails = existingItems; // Use the validated items from database
    const validatedCart = [];
    
    for (const cartItem of cart) {
      const itemId = cartItem.itemId || cartItem.id; // Handle both field names
      const detail = itemDetails.find(d => d._id.toString() === itemId);
      if (!detail) {
        return res.status(400).json({ error: `Item not found for item ${itemId}` });
      }
      
      // 🔍 DEBUG: Log cart item and available sizes before lookup
      console.log(`🔍 DEBUG: Finding size variant for ${detail.productName}:`, {
        cartItem: {
          sku: cartItem.sku,
          size: cartItem.size,
          itemId: itemId
        },
        availableSizes: detail.sizes.map(s => ({
          sku: s.sku,
          size: s.size,
          stock: s.stock || s.quantity
        }))
      });

      // Use utility function to find size variant with fallback logic
      const sizeVariant = findSizeVariant(detail.sizes, cartItem.sku, cartItem.size);
      
      if (!sizeVariant) {
        console.error(`❌ No size variant found for ${detail.productName}:`, {
          requestedSku: cartItem.sku,
          requestedSize: cartItem.size,
          availableSizes: detail.sizes.map(s => ({ sku: s.sku, size: s.size }))
        });
        
        return res.status(400).json({ 
          error: "Invalid item configuration",
          message: "Size or SKU no longer available",
          invalidItems: [{
            itemId: itemId,
            name: detail.productName,
            requestedSku: cartItem.sku,
            requestedSize: cartItem.size,
            reason: 'The requested size/SKU is no longer available for this item',
            availableSizes: detail.sizes.map(s => ({ 
              sku: s.sku, 
              size: s.size,
              stock: s.stock || s.quantity || 0
            }))
          }],
          suggestion: "Please select a different size or remove this item from your cart"
        });
      }
      
      // Check stock availability
      const availableStock = sizeVariant.stock || sizeVariant.quantity || 0;
      if (availableStock < cartItem.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for item ${detail.productName} (${sizeVariant.size}). Available: ${availableStock}, Requested: ${cartItem.quantity}` 
        });
      }
      
      // �️ ENHANCED PRICE CALCULATION: Handle both regular and sale prices
      const priceCalculation = calculateEffectivePrice(sizeVariant);
      
      if (!priceCalculation.hasValidPrice) {
        return res.status(400).json({
          error: `No valid price configured for item ${detail.productName} (Size: ${sizeVariant.size}). Please set either regularPrice or salePrice.`
        });
      }
      
      // 🐛 DEBUG: Log comprehensive price information
      console.log(`💰 ENHANCED PRICE DEBUG for ${detail.productName}:`, {
        itemId: itemId,
        sku: sizeVariant.sku,
        size: sizeVariant.size,
        frontendPrice: cartItem.price,
        dbRegularPrice: sizeVariant.regularPrice,
        dbSalePrice: sizeVariant.salePrice,
        effectivePrice: priceCalculation.effectivePrice,
        priceType: priceCalculation.priceType,
        isOnSale: priceCalculation.isOnSale,
        savings: priceCalculation.savings,
        discountPercentage: priceCalculation.discountPercentage,
        stock: availableStock
      });
      
      console.log(`✅ Validated cart item: ${detail.productName} - Size: ${sizeVariant.size}, SKU: ${sizeVariant.sku}, Stock: ${availableStock}, Price: ${formatPrice(priceCalculation.effectivePrice)} (${priceCalculation.priceType})`);
      
      // Validate frontend price against calculated price
      const priceValidation = validateItemPrice(cartItem, detail);
      if (!priceValidation.isValid) {
        console.warn(`⚠️ Price validation warning: ${priceValidation.error}`);
        console.warn(`Frontend: ${formatPrice(priceValidation.frontendPrice)}, Database: ${formatPrice(priceValidation.dbPrice)}`);
      }
      
      validatedCart.push({
        ...cartItem,
        itemId: itemId, // Ensure we have itemId field
        sku: sizeVariant.sku,
        size: sizeVariant.size,
        price: priceCalculation.effectivePrice, // Use calculated effective price
        originalPrice: priceCalculation.originalPrice, // Store original price
        salePrice: priceCalculation.salePrice, // Store sale price
        priceType: priceCalculation.priceType, // Store price type
        isOnSale: priceCalculation.isOnSale, // Store sale status
        savings: priceCalculation.savings, // Store savings amount
        discountPercentage: priceCalculation.discountPercentage, // Store discount percentage
        frontendPrice: cartItem.price, // Keep track of frontend price for comparison
        itemName: detail.productName,
        sizeVariant: sizeVariant // Store size variant for further calculations
      });
    }

    // 💰 ENHANCED CART TOTAL CALCULATION using utility
    const cartCalculation = calculateCartTotal(validatedCart, {
      taxRate: 0, // Configure as needed
      shippingFee: 0, // Configure as needed
      discountAmount: 0 // Configure as needed
    });
    
    console.log(`📊 ENHANCED CART CALCULATION:`, {
      subtotal: formatPrice(cartCalculation.subtotal),
      totalSavings: formatPrice(cartCalculation.totalSavings),
      averageDiscount: `${cartCalculation.averageDiscount}%`,
      taxAmount: formatPrice(cartCalculation.taxAmount),
      shippingFee: formatPrice(cartCalculation.shippingFee),
      discountAmount: formatPrice(cartCalculation.discountAmount),
      finalTotal: formatPrice(cartCalculation.total),
      itemCount: cartCalculation.itemCalculations.length,
      totalQuantity: cartCalculation.itemCalculations.reduce((sum, item) => sum + item.quantity, 0)
    });
    
    // Detailed item breakdown for debugging
    console.log(`📊 ITEM BREAKDOWN:`, cartCalculation.itemCalculations.map(item => ({
      name: item.itemName,
      quantity: item.quantity,
      unitPrice: formatPrice(item.unitPrice),
      totalPrice: formatPrice(item.itemTotal),
      savings: formatPrice(item.itemSavings),
      priceType: item.priceType,
      isOnSale: item.isOnSale
    })));
    
    const calculatedAmount = cartCalculation.total;
    
    console.log('💵 Amount Validation:');
    console.log('Frontend sent amount:', amount);
    console.log('Backend calculated amount:', calculatedAmount);
    console.log('Total savings:', formatPrice(cartCalculation.totalSavings));
    console.log('Average discount:', `${cartCalculation.averageDiscount}%`);
    
    // 🛡️ SECURITY FIX: Always use backend calculated amount for security
    let finalAmount = calculatedAmount;
    
    if (Math.abs(calculatedAmount - amount) > 0.01) { // Allow 1 paisa difference for rounding
      console.warn('⚠️ Amount mismatch detected!');
      console.warn(`Frontend sent: ₹${amount}, Backend calculated: ₹${calculatedAmount}`);
      console.warn('Using backend calculated amount for security:', calculatedAmount);
    } else {
      console.log('✅ Amount validation passed - amounts match');
      console.log(`Both frontend and backend agree on amount: ₹${calculatedAmount}`);
    }
    
    console.log(`💰 Final amount to be used: ₹${finalAmount}`);

    // Debug Razorpay configuration
    console.log('🔐 Razorpay Configuration Debug:');
    console.log('Key ID (first 10 chars):', RAZORPAY_KEY_ID ? RAZORPAY_KEY_ID.substring(0, 10) + '...' : 'NOT SET');
    console.log('Key Secret (length):', RAZORPAY_KEY_SECRET ? RAZORPAY_KEY_SECRET.length + ' chars' : 'NOT SET');
    
    const options = {
      amount: finalAmount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
      notes: {
        customer_email: staticAddress.email,
        customer_phone: staticAddress.phoneNumber,
        customer_name: `${staticAddress.firstName} ${staticAddress.lastName}`,
        frontend_amount: amount,
        calculated_amount: calculatedAmount
      }
    };

    console.log('💳 Creating Razorpay order with options:', options);

    // Create Razorpay Order
    const order = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created successfully:', order.id);

    // Prepare item_quantities with comprehensive pricing information
    const itemQuantities = validatedCart.map(cartItem => {
      const itemQuantity = {
        item_id: cartItem.itemId,
        sku: cartItem.sku,
        quantity: cartItem.quantity,
        size: cartItem.size,
        price: cartItem.price, // Effective price (regularPrice or salePrice)
        
        // 🆕 ENHANCED PRICING FIELDS
        original_price: cartItem.originalPrice, // Always the regular price
        sale_price: cartItem.salePrice, // Sale price if available
        price_type: cartItem.priceType, // 'regular' or 'sale'
        is_on_sale: cartItem.isOnSale, // Boolean flag
        savings: cartItem.savings, // Amount saved if on sale
        discount_percentage: cartItem.discountPercentage, // Percentage discount
        
        // Frontend comparison for debugging
        frontend_price: cartItem.frontendPrice
      };
      
      // 🐛 DEBUG: Log each item quantity being prepared with enhanced pricing
      console.log(`📦 Preparing enhanced item_quantity:`, {
        itemId: itemQuantity.item_id,
        sku: itemQuantity.sku,
        size: itemQuantity.size,
        effectivePrice: formatPrice(itemQuantity.price),
        priceType: itemQuantity.price_type,
        isOnSale: itemQuantity.is_on_sale,
        savings: formatPrice(itemQuantity.savings),
        discountPercentage: `${itemQuantity.discount_percentage}%`
      });
      
      return itemQuantity;
    });

    console.log(`📋 Total itemQuantities prepared: ${itemQuantities.length}`);

    // 🆕 ENHANCED ORDER DATA STRUCTURE - Comprehensive order information capture
    // Prepare complete order metadata following the specification
    const orderMetadata = {
      orderId: `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      orderNumber: `YRA${String(Date.now()).slice(-6)}`,
      orderStatus: "pending",
      paymentStatus: "pending", 
      fulfillmentStatus: "pending",
      source: req.headers['user-agent']?.includes('iOS') ? 'mobile_app_ios' : 
              req.headers['user-agent']?.includes('Android') ? 'mobile_app_android' : 'web_app',
      deviceInfo: {
        platform: req.headers['user-agent']?.includes('iOS') ? 'iOS' : 
                  req.headers['user-agent']?.includes('Android') ? 'Android' : 'Web',
        userAgent: req.headers['user-agent'] || 'Unknown'
      },
      orderNotes: req.body.orderNotes || "Order placed via mobile app",
      priority: "normal",
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
      ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
      sessionId: req.session?.id || `session_${Date.now()}`
    };

    // Calculate shipping charges (free delivery over ₹500)
    const freeDeliveryThreshold = 500;
    const shippingCharges = finalAmount >= freeDeliveryThreshold ? 0 : 50;
    const freeDeliveryApplied = finalAmount >= freeDeliveryThreshold;
    
    // Calculate tax breakdown (18% GST for India)
    const subtotalBeforeTax = finalAmount / 1.18;
    const taxAmount = finalAmount - subtotalBeforeTax;
    const cgst = taxAmount / 2; // 9% CGST
    const sgst = taxAmount / 2; // 9% SGST

    // Prepare comprehensive order summary
    const orderSummary = {
      subtotal: cartCalculation.subtotal,
      shippingCharges: shippingCharges,
      taxAmount: taxAmount,
      discountAmount: cartCalculation.totalSavings,
      couponCode: req.body.couponCode || null,
      couponDiscount: req.body.couponDiscount || 0,
      totalAmount: finalAmount,
      currency: "INR",
      freeDeliveryApplied: freeDeliveryApplied,
      shippingThreshold: freeDeliveryThreshold,
      taxBreakdown: {
        cgst: cgst,
        sgst: sgst,
        igst: 0 // For intra-state orders
      }
    };

    // Prepare customer information
    const customerInfo = {
      user_id: userId,
      firstName: normalizedAddress.firstName,
      lastName: normalizedAddress.lastName,
      fullName: `${normalizedAddress.firstName} ${normalizedAddress.lastName}`,
      email: normalizedAddress.email,
      phone: normalizedAddress.phoneNumber,
      isGuest: !userId || userId === 'guest',
      guestSessionId: !userId ? `guest_session_${Date.now()}` : null
    };

    // Save Order in Database with comprehensive information following the specification
    const newOrder = new Order({
      user: userId,
      items: itemIds,
      total_price: finalAmount, // Use validated final amount
      payment_status: "Pending",
      razorpay_order_id: order.id,
      address: normalizedAddress, // Use normalized address format
      item_quantities: itemQuantities,
      shipping_status: "PENDING", // Initialize shipping status
      auto_assigned: false, // Will be set to true when auto-processed
      
      // 🆕 COMPREHENSIVE ORDER DATA - Following complete specification
      customer: customerInfo,
      orderSummary: orderSummary,
      
      // Payment Details (will be completed during payment verification)
      paymentDetails: {
        razorpayOrderId: order.id,
        paymentStatus: 'pending',
        currency: "INR",
        receipt: order.receipt
      },
      
      // Order Metadata
      orderMetadata: orderMetadata,
      
      // Shiprocket Data (prepared for automatic processing)
      shiprocketData: {
        orderDetails: {
          order_id: orderMetadata.orderId,
          order_date: new Date().toISOString().replace('Z', '+00:00'),
          channel_id: "custom",
          billing_customer_name: normalizedAddress.firstName,
          billing_last_name: normalizedAddress.lastName,
          billing_address: normalizedAddress.address + (normalizedAddress.apartment ? ', ' + normalizedAddress.apartment : ''),
          billing_address_2: normalizedAddress.landmark || '',
          billing_city: normalizedAddress.city,
          billing_pincode: normalizedAddress.pinCode,
          billing_state: normalizedAddress.state,
          billing_country: normalizedAddress.country || 'India',
          billing_email: normalizedAddress.email,
          billing_phone: normalizedAddress.phoneNumber.replace(/^\+91/, ''),
          shipping_is_billing: true,
          order_items: validatedCart.map(item => ({
            name: item.itemName,
            sku: item.sku,
            units: item.quantity,
            selling_price: Math.round(item.price),
            discount: Math.round(item.savings),
            tax: Math.round(item.price * 0.18), // 18% GST
            hsn: "61091000" // Default HSN for apparel
          })),
          payment_method: "Prepaid",
          shipping_charges: shippingCharges,
          giftwrap_charges: 0,
          transaction_charges: Math.round(finalAmount * 0.025), // Approx 2.5% transaction charge
          total_discount: Math.round(cartCalculation.totalSavings),
          sub_total: Math.round(finalAmount),
          length: 30, // Default package dimensions
          breadth: 25,
          height: 10,
          weight: Math.max(validatedCart.length * 0.2, 0.5) // Estimate 200g per item, minimum 500g
        }
      },
      
      // 🆕 ENHANCED CART CALCULATION SUMMARY
      cart_calculation: {
        subtotal: cartCalculation.subtotal,
        total_savings: cartCalculation.totalSavings,
        average_discount: cartCalculation.averageDiscount,
        tax_amount: cartCalculation.taxAmount,
        shipping_fee: cartCalculation.shippingFee,
        discount_amount: cartCalculation.discountAmount,
        final_total: cartCalculation.total,
        item_count: cartCalculation.itemCalculations.length,
        total_quantity: cartCalculation.itemCalculations.reduce((sum, item) => sum + item.quantity, 0),
        has_sale_items: cartCalculation.itemCalculations.some(item => item.priceType === 'sale'),
        calculation_timestamp: new Date()
      }
    });

    await newOrder.save();

    console.log('💾 Order saved to database:', {
      orderId: newOrder._id,
      razorpayOrderId: order.id,
      totalPrice: finalAmount,
      itemCount: validatedCart.length,
      customerEmail: staticAddress.email
    });

    // Return enhanced response with amount in rupees (not paise)
    const response = {
      id: order.id,
      amount: finalAmount, // Send amount in rupees, not paise
      amount_paise: order.amount, // Include paise amount for reference
      currency: order.currency,
      status: order.status,
      receipt: order.receipt,
      created_at: order.created_at,
      customer_details: {
        email: staticAddress.email,
        contact: staticAddress.phoneNumber,
        name: `${staticAddress.firstName} ${staticAddress.lastName}`
      },
      order_details: {
        items_count: validatedCart.length,
        calculated_amount: calculatedAmount,
        final_amount: finalAmount,
        frontend_amount: amount
      },
      // Include database order ID for tracking
      database_order_id: newOrder._id
    };

    res.json(response);
    console.log("✅ Razorpay order response sent:", {
      id: order.id,
      amount_rupees: finalAmount,
      amount_paise: order.amount,
      currency: order.currency,
      status: order.status,
      database_order_id: newOrder._id
    });
  } catch (error) {
    console.error("❌ Error creating Razorpay order:", {
      message: error.message,
      stack: error.stack,
      razorpayError: error.error || null,
      statusCode: error.statusCode || null,
      timestamp: new Date().toISOString()
    });
    
    // Provide more specific error messages based on error type
    let errorMessage = "Error creating Razorpay order";
    let statusCode = 500;
    
    if (error.statusCode === 401) {
      errorMessage = "Razorpay authentication failed. Please check API credentials.";
    } else if (error.statusCode === 400) {
      errorMessage = "Invalid order data provided to Razorpay.";
      statusCode = 400;
    } else if (error.message && error.message.includes('validation')) {
      errorMessage = "Order validation failed: " + error.message;
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

// Get Shiprocket Token
async function getShiprocketToken() {
  try {
    // Validate credentials are available
    if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
      console.error("❌ Shiprocket credentials not configured in environment variables");
      return null;
    }
    
    console.log("🔐 Attempting Shiprocket authentication with email:", SHIPROCKET_EMAIL);
    
    const response = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Shiprocket Auth Failed:", {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      return null;
    }
    
    if (data.token) {
      console.log("✅ Shiprocket authentication successful");
      return data.token;
    } else {
      console.error("❌ No token received from Shiprocket:", data);
      return null;
    }
    
  } catch (error) {
    console.error("❌ Shiprocket Auth Error:", error);
    return null;
  }
}

// Generate AWB with Courier
async function generateAWBWithCourier(shipmentId, token, preferredCourier = null) {
  try {
    // Generate AWB
    const awbResponse = await fetch(`${SHIPROCKET_API_BASE}/courier/assign/awb`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipment_id: shipmentId,
      }),
    });

    const awbData = await awbResponse.json();
    console.log("awbData1111111111111", awbData);

    // Check if AWB assignment was successful
    if (awbData.awb_assign_status !== 1) {
      console.error("Failed to generate AWB:", awbData);
      return { success: false, message: "AWB generation failed", error: awbData };
    }

    return {
      success: true,
      message: "AWB generated successfully",
      awbData: awbData.response.data, // Return the nested data object
    };
  } catch (error) {
    console.error("Error generating AWB:", error);
    return { success: false, message: "Error generating AWB", error };
  }
}

// ⚡ FAST Payment Verification (1-2 seconds) - NO Shiprocket blocking
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    console.log("🔐 Payment verification started (FAST MODE):", {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature: razorpay_signature ? "***provided***" : "missing",
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      console.error("❌ Missing required payment verification fields:", {
        has_payment_id: !!razorpay_payment_id,
        has_order_id: !!razorpay_order_id,
        has_signature: !!razorpay_signature
      });
      return res.status(400).json({ 
        success: false, 
        message: "Missing required payment verification data" 
      });
    }

    // Verify Razorpay Payment Signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    console.log("🔍 Signature verification:", {
      body_string: body,
      expected_signature: expectedSignature,
      received_signature: razorpay_signature,
      key_secret_used: RAZORPAY_KEY_SECRET ? "***configured***" : "missing",
      signatures_match: expectedSignature === razorpay_signature
    });

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Signature verification failed:", {
        expected: expectedSignature,
        received: razorpay_signature,
        body: body,
        secret_length: RAZORPAY_KEY_SECRET ? RAZORPAY_KEY_SECRET.length : 0
      });
      return res.status(400).json({ 
        success: false, 
        message: "Payment signature verification failed" 
      });
    }

    console.log("✅ Payment signature verified successfully");

    // Find order first to debug amounts
    console.log("🔍 Finding order for debugging amounts...");
    const existingOrder = await Order.findOne({ razorpay_order_id }).populate("items").populate("user");
    
    if (!existingOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // 🐛 DEBUG: Log the original order amounts
    console.log("💰 ORDER AMOUNT DEBUG - Original order data:", {
      orderId: existingOrder._id,
      razorpay_order_id: existingOrder.razorpay_order_id,
      total_price: existingOrder.total_price,
      total_amount: existingOrder.total_amount,
      amount: existingOrder.amount,
      items_count: existingOrder.item_quantities?.length || 0,
      item_quantities: existingOrder.item_quantities?.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        price: item.price,
        sku: item.sku
      })),
      cart: existingOrder.cart?.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    });

    // Calculate expected total from item quantities
    let calculatedTotal = 0;
    if (existingOrder.item_quantities && existingOrder.item_quantities.length > 0) {
      calculatedTotal = existingOrder.item_quantities.reduce((sum, item) => {
        const itemPrice = item.price || 0;
        const itemQuantity = item.quantity || 0;
        console.log(`📦 Item calculation: ${itemPrice} x ${itemQuantity} = ${itemPrice * itemQuantity}`);
        return sum + (itemPrice * itemQuantity);
      }, 0);
    }

    console.log("🧮 CALCULATED TOTAL from item_quantities:", calculatedTotal);

    // 🆕 COMPLETE PAYMENT VERIFICATION - Update comprehensive order data
    // Get payment details from Razorpay API for complete information
    let paymentInfo = {};
    try {
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      paymentInfo = {
        method: payment.method || 'unknown',
        bank: payment.bank || null,
        wallet: payment.wallet || null,
        vpa: payment.vpa || null,
        card_id: payment.card_id || null,
        amount: payment.amount / 100, // Convert from paise to rupees
        fee: payment.fee / 100 || 0,
        tax: payment.tax / 100 || 0,
        status: payment.status
      };
      console.log("💳 Payment details fetched from Razorpay:", paymentInfo);
    } catch (error) {
      console.warn("⚠️ Could not fetch payment details from Razorpay:", error.message);
    }

    // Update Order Payment Status with Enhanced Details for Admin Panel
    let order = await Order.findOneAndUpdate(
      { razorpay_order_id },
      {
        $set: {
          payment_status: "Paid",
          razorpay_payment_id,
          razorpay_signature,
          shipping_status: "PENDING", // Add shipping status tracking
          payment_verified_at: new Date(),
          
          // 🆕 COMPLETE PAYMENT DETAILS UPDATE
          "paymentDetails.razorpayPaymentId": razorpay_payment_id,
          "paymentDetails.razorpaySignature": razorpay_signature,
          "paymentDetails.paymentMethod": paymentInfo.method || "card",
          "paymentDetails.paymentStatus": "captured",
          "paymentDetails.amountPaid": paymentInfo.amount || existingOrder.total_price,
          "paymentDetails.paymentDate": new Date(),
          "paymentDetails.gatewayFee": paymentInfo.fee || 0,
          "paymentDetails.netAmount": (paymentInfo.amount || existingOrder.total_price) - (paymentInfo.fee || 0),
          "paymentDetails.bankReference": razorpay_payment_id,
          "paymentDetails.receipt": existingOrder.razorpay_order_id,
          
          // Update order metadata
          "orderMetadata.orderStatus": "confirmed",
          "orderMetadata.paymentStatus": "paid",
          "orderMetadata.confirmedAt": new Date(),
          
          // Enhanced payment method detection
          payment_method: paymentInfo.method || "Online", // Default for Razorpay payments
          
          // Enhanced order status tracking
          order_status: "confirmed", // Set to confirmed after successful payment
          
          // Additional fields for admin panel display
          currency: "INR",
          
          // Ensure address email is captured for admin panel
          "address.email": existingOrder?.address?.email || existingOrder?.user?.email || "customer@yoraa.in"
        },
      },
      { new: true }
    ).populate("items").populate("user");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Track stock updates for Items to avoid multiple queries
    const itemStockUpdates = new Map();

    // Decrease Stock for Each Item in ItemDetails and Aggregate for Item
    for (const entry of order.item_quantities) {
      const itemId = entry.item_id;
      const sku = entry.sku;
      const quantity = entry.quantity;

      // Fetch Item for the item (using merged model)
      const itemDetails = await Item.findOne({ _id: itemId });
      if (!itemDetails) {
        throw new Error(`Item not found for item ID: ${itemId}`);
      }

      // Find the size entry by SKU and update stock
      const sizeEntry = itemDetails.sizes.find(s => s.sku === sku);
      if (!sizeEntry) {
        throw new Error(`SKU ${sku} not found for item ID: ${itemId}`);
      }
      
      if (sizeEntry.stock < quantity) {
        throw new Error(
          `Insufficient stock for SKU ${sku} of item ID: ${itemId}. Available: ${sizeEntry.stock}, Requested: ${quantity}`
        );
      }
      
      sizeEntry.stock -= quantity;
      sizeEntry.quantity -= quantity;

      // Aggregate quantity for Item stock update
      if (itemStockUpdates.has(itemId.toString())) {
        itemStockUpdates.set(itemId.toString(), itemStockUpdates.get(itemId.toString()) + quantity);
      } else {
        itemStockUpdates.set(itemId.toString(), quantity);
      }

      await itemDetails.save();
    }

    // Update stock in Item model (if Item has a stock field)
    for (const [itemId, quantity] of itemStockUpdates) {
      const item = await Item.findById(itemId);
      if (!item) {
        throw new Error(`Item not found for ID: ${itemId}`);
      }
      if (item.stock !== undefined) {
        if (item.stock < quantity) {
          throw new Error(
            `Insufficient stock for item ID: ${itemId}. Available: ${item.stock}, Requested: ${quantity}`
          );
        }
        item.stock -= quantity;
        await item.save();
      }
    }

    // � DEBUG: Log the final order data being sent to frontend
    console.log("📤 PAYMENT VERIFICATION RESPONSE DEBUG:", {
      orderId: order._id,
      razorpay_order_id: order.razorpay_order_id,
      razorpay_payment_id: order.razorpay_payment_id,
      total_price: order.total_price,
      total_amount: order.total_amount,
      amount: order.amount,
      payment_status: order.payment_status,
      items_count: order.items?.length || 0,
      item_quantities_count: order.item_quantities?.length || 0,
      address_exists: !!order.address,
      customer_email: order.address?.email,
      customer_name: `${order.address?.firstName} ${order.address?.lastName}`
    });

    // �🚀 IMMEDIATE RESPONSE - Payment verified successfully (1-2 seconds)
    const responseData = {
      success: true,
      message: "Payment verified successfully! Shipping processing in background.",
      orderId: order._id, // Add orderId at root level for frontend compatibility
      order: {
        _id: order._id,
        order_number: order.order_number || `ORD-${order._id.toString().slice(-8)}`,
        razorpay_order_id: order.razorpay_order_id,
        razorpay_payment_id: order.razorpay_payment_id,
        totalAmount: order.total_price, // Add totalAmount field for frontend compatibility
        total_price: order.total_price,
        subtotal: order.subtotal || order.total_price, // Add subtotal for frontend
        shippingCharges: order.shipping_charges || 0, // Add shipping charges
        taxAmount: order.tax_amount || 0, // Add tax amount
        currency: "INR",
        payment_status: order.payment_status,
        shipping_status: "PENDING",
        order_status: order.order_status,
        created_at: order.created_at || new Date(),
        items: order.items?.map(item => ({
          id: item._id,
          name: item.name,
          price: item.price,
          image: item.image || item.imageUrl,
          description: item.description
        })) || [],
        item_quantities: order.item_quantities?.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku,
          size: item.size
        })) || [],
        address: order.address,
        payment: {
          razorpay_order_id: order.razorpay_order_id,
          razorpay_payment_id: order.razorpay_payment_id,
          amount_paid: order.total_price,
          payment_status: order.payment_status,
          payment_method: "Online"
        }
      }
    };

    console.log("📤 FINAL RESPONSE TO FRONTEND:", JSON.stringify(responseData, null, 2));

    res.json(responseData);

    // � AUTOMATIC SHIPROCKET ORDER CREATION
    // Process shipping ASYNCHRONOUSLY after successful payment verification
    console.log(`🚀 Initiating automatic Shiprocket order creation for order ${order._id}...`);
    console.log(`📍 Delivery Address: ${order.address.firstName} ${order.address.lastName}, ${order.address.city}, ${order.address.state} - ${order.address.pinCode}`);
    console.log(`📦 Items Count: ${order.items.length}, Total: ₹${order.total_price}`);
    
    processShippingAsync(order._id.toString()).catch(error => {
      console.error(`❌ Automatic Shiprocket order creation failed for order ${order._id}:`, {
        error: error.message,
        orderId: order._id,
        customerEmail: order.address?.email,
        customerPhone: order.address?.phoneNumber,
        totalAmount: order.total_price,
        itemsCount: order.items.length,
        timestamp: new Date().toISOString()
      });
      
      // Update order with shipping failure status for admin visibility
      Order.findByIdAndUpdate(order._id, {
        shipping_status: "FAILED",
        shipping_error: error.message,
        shipping_failed_at: new Date()
      }).catch(updateError => {
        console.error("Failed to update shipping error status:", updateError);
      });
    });

    console.log(`✅ Payment verified for order ${order._id} - Automatic Shiprocket processing initiated`);

  } catch (error) {
    console.error("Payment verification error:", error);

    // Handle stock refund if payment verification fails after stock deduction
    if (error.message.includes("Insufficient stock") && req.body.razorpay_payment_id) {
      try {
        const refund = await razorpay.payments.refund(req.body.razorpay_payment_id, {
          amount: order ? order.total_price * 100 : 0,
          speed: "optimum",
        });
        console.log("Refund initiated due to insufficient stock:", refund);
      } catch (refundError) {
        console.error("Refund failed:", refundError);
      }
    }

    res.status(500).json({ 
      success: false, 
      message: "Payment verification failed", 
      error: error.message 
    });
  }
};

// 🚚 Async Shipping Processing Function (runs in background)
async function processShippingAsync(orderId) {
  try {
    console.log(`🚚 Starting automatic Shiprocket order creation for order ${orderId}...`);
    
    // Get order details with populated items and user data
    const order = await Order.findById(orderId).populate("items").populate("user");
    if (!order) {
      throw new Error(`Order ${orderId} not found for shipping processing`);
    }

    console.log(`📋 Order Details: Customer: ${order.address.firstName} ${order.address.lastName}, Items: ${order.items.length}, Total: ₹${order.total_price}`);

    // Update shipping status to processing
    await Order.findByIdAndUpdate(orderId, {
      shipping_status: "PROCESSING",
      shipping_started_at: new Date()
    });

    console.log(`🔄 Order ${orderId} status updated to PROCESSING`);

    // Get Shiprocket API Token
    const token = await getShiprocketToken();
    if (!token) {
      throw new Error("Failed to authenticate with Shiprocket");
    }

    // Calculate shipping dimensions
    const totalWeight = Math.max(
      order.items.reduce((total, item) => total + (item.weight || 0.5), 0),
      0.5
    );
    const maxLength = Math.max(...order.items.map((item) => item.length ?? 0.5), 0.5);
    const maxBreadth = Math.max(...order.items.map((item) => item.breadth ?? 0.5), 0.5);
    const maxHeight = Math.max(...order.items.map((item) => item.height ?? 0.5), 0.5);

    // 🆕 ENHANCED SHIPROCKET ORDER CREATION - Using comprehensive order data
    console.log(`📦 Creating enhanced Shiprocket order for ${orderId}...`);
    
    // Use the comprehensive shiprocket data structure if available
    let shiprocketOrderData;
    if (order.shiprocketData && order.shiprocketData.orderDetails) {
      // Use pre-populated Shiprocket data structure
      shiprocketOrderData = {
        ...order.shiprocketData.orderDetails,
        order_id: order.orderMetadata?.orderId || orderId,
        order_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        pickup_location: "7769394" // Correct pickup location ID from Shiprocket
      };
      console.log(`✅ Using pre-populated Shiprocket data structure`);
    } else {
      // Fallback to creating structure from order data
      shiprocketOrderData = {
        order_id: orderId,
        order_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        pickup_location: "7769394", // Correct pickup location ID from Shiprocket
        billing_customer_name: order.address.firstName || "Guest",
        billing_last_name: order.address.lastName || "N/A",
        billing_address: `${order.address.address}${order.address.apartment ? ', ' + order.address.apartment : ''}${order.address.landmark ? ', Near ' + order.address.landmark : ''}`,
        billing_city: order.address.city,
        billing_pincode: order.address.pinCode,
        billing_state: order.address.state,
        billing_country: order.address.country || "India",
        billing_email: order.address.email || order.user?.email || "customer@example.com",
        billing_phone: (order.address.phoneNumber || order.user?.phNo || "9999999999").replace(/^\+91/, ''),
        shipping_is_billing: true,
        payment_method: "Prepaid",
        sub_total: Math.round(order.total_price),
        length: maxLength,
        breadth: maxBreadth,
        height: maxHeight,
        weight: totalWeight,
        order_items: order.item_quantities.map((entry) => {
          const item = order.items.find((i) => i._id.toString() === entry.item_id.toString());
          return {
            name: item ? (item.productName || item.name) : "Unknown Item",
            sku: entry.sku,
            units: entry.quantity,
            selling_price: Math.round(entry.price || (item ? (item.salePrice || item.price || 0) : 0)),
            discount: Math.round(entry.savings || 0),
            tax: Math.round((entry.price || 0) * 0.18), // 18% GST
            hsn: "61091000" // Default HSN for apparel
          };
        }),
      };
      console.log(`⚠️ Using fallback Shiprocket data structure`);
    }

    console.log(`📋 Shiprocket order data:`, JSON.stringify(shiprocketOrderData, null, 2));

    const shiprocketResponse = await fetch(`${SHIPROCKET_API_BASE}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shiprocketOrderData),
    });

    const shiprocketData = await shiprocketResponse.json();
    console.log(`📋 Shiprocket response for order ${orderId}:`, shiprocketData);

    // Handle 403 permission errors specifically
    if (shiprocketResponse.status === 403) {
      console.error(`🚫 SHIPROCKET PERMISSION ERROR for order ${orderId}:`);
      console.error(`   Status: 403 - Unauthorized`);
      console.error(`   Message: ${shiprocketData.message}`);
      console.error(`   Account: ${SHIPROCKET_EMAIL} (Company ID: 5783639)`);
      console.error(`   Diagnosis: Account authenticated successfully but lacks order creation permissions`);
      console.error(`   Solution: Email support@shiprocket.in to enable API order management permissions`);
      console.error(`   Reference: See SHIPROCKET_SUPPORT_REQUEST.md for email template`);
      
      await Order.findByIdAndUpdate(orderId, {
        shipping_status: "PERMISSION_DENIED",
        shipping_error: `Shiprocket Account Permission Issue: Account '${SHIPROCKET_EMAIL}' (Company ID: 5783639) lacks API order creation permissions. Email support@shiprocket.in with account details to enable order management API access.`,
        shipping_failed_at: new Date(),
        shiprocket_error_details: {
          error_type: "API_PERMISSION_DENIED",
          error_code: 403,
          account_email: SHIPROCKET_EMAIL,
          company_id: 5783639,
          message: shiprocketData.message,
          solution: "Contact Shiprocket support to enable order management API permissions",
          support_email: "support@shiprocket.in"
        }
      });
      
      throw new Error(`Shiprocket API Permission Denied: Account '${SHIPROCKET_EMAIL}' requires order management permissions. Email support@shiprocket.in with Company ID 5783639 to resolve.`);
    }

    if (shiprocketData.status_code === 1) {
      // Update order with Shiprocket details
      await Order.findByIdAndUpdate(orderId, {
        shiprocket_shipment_id: shiprocketData.shipment_id,
        shiprocket_orderId: shiprocketData.order_id
      });

      // Generate AWB
      console.log(`🏷️  Generating AWB for shipment ${shiprocketData.shipment_id}...`);
      const awbResponse = await generateAWBWithCourier(shiprocketData.shipment_id, token);
      
      if (awbResponse.success && awbResponse.awbData && awbResponse.awbData.awb_code) {
        const awbData = awbResponse.awbData;
        
        // Update order with complete shipping details
        await Order.findByIdAndUpdate(orderId, {
          awb_code: awbData.awb_code,
          tracking_url: `https://shiprocket.co/tracking/${awbData.awb_code}`,
          courier_company_id: awbData.courier_company_id,
          courier_name: awbData.courier_name,
          courier_partner: awbData.courier_name, // Add courier partner for frontend display
          freight_charges: awbData.freight_charges,
          applied_weight: awbData.applied_weight,
          routing_code: awbData.routing_code,
          invoice_no: awbData.invoice_no,
          transporter_id: awbData.transporter_id,
          transporter_name: awbData.transporter_name,
          shipped_by: awbData.shipped_by || {},
          shipping_status: "SHIPPED",
          shipping_completed_at: new Date(),
          auto_assigned: true, // Mark as automatically assigned
          expected_delivery_date: awbData.estimated_delivery_date ? new Date(awbData.estimated_delivery_date) : null
        });

        console.log(`🎉 AUTOMATIC SHIPROCKET ORDER CREATION SUCCESSFUL!`);
        console.log(`📦 Order ${orderId} Details:`);
        console.log(`   • AWB Code: ${awbData.awb_code}`);
        console.log(`   • Courier: ${awbData.courier_name}`);
        console.log(`   • Customer: ${order.address.firstName} ${order.address.lastName}`);
        console.log(`   • Delivery: ${order.address.city}, ${order.address.state} - ${order.address.pinCode}`);
        console.log(`   • Tracking: https://shiprocket.co/tracking/${awbData.awb_code}`);
        console.log(`   • Expected Delivery: ${awbData.estimated_delivery_date || 'Not provided'}`);
        
        // TODO: Send shipping confirmation email/SMS to user
        // await sendShippingNotification(order.address.email, awbData.awb_code, awbData.courier_name);
        
      } else {
        console.error(`❌ AWB generation failed for order ${orderId}:`, awbResponse);
        await Order.findByIdAndUpdate(orderId, {
          shipping_status: "AWB_FAILED",
          shipping_error: "AWB generation failed: " + JSON.stringify(awbResponse.error),
          shipping_failed_at: new Date()
        });
      }
    } else {
      throw new Error(`Shiprocket order creation failed: ${JSON.stringify(shiprocketData)}`);
    }

  } catch (error) {
    console.error(`❌ Background shipping processing failed for order ${orderId}:`, error);
    
    // Update order with shipping failure
    await Order.findByIdAndUpdate(orderId, {
      shipping_status: "FAILED",
      shipping_error: error.message,
      shipping_failed_at: new Date()
    }).catch(updateError => {
      console.error("Failed to update shipping error status:", updateError);
    });
    
    throw error; // Re-throw for upstream error handling
  }
}

// 📊 Get Shipping Status (for frontend polling)
exports.getShippingStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid order ID" 
      });
    }

    const order = await Order.findById(orderId).select(
      'shipping_status shipping_error awb_code tracking_url courier_name shiprocket_orderId payment_status created_at shipping_started_at shipping_completed_at shipping_failed_at'
    );

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    res.json({
      success: true,
      orderId: orderId,
      paymentStatus: order.payment_status,
      shippingStatus: order.shipping_status || "PENDING",
      shippingError: order.shipping_error || null,
      awbCode: order.awb_code || null,
      trackingUrl: order.tracking_url || null,
      courierName: order.courier_name || null,
      shiprocketOrderId: order.shiprocket_orderId || null,
      timestamps: {
        orderCreated: order.created_at,
        shippingStarted: order.shipping_started_at,
        shippingCompleted: order.shipping_completed_at,
        shippingFailed: order.shipping_failed_at
      }
    });

  } catch (error) {
    console.error("Get shipping status error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get shipping status", 
      error: error.message 
    });
  }
};

// 🔄 Retry Failed Shipping (manual retry endpoint)
exports.retryShipping = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid order ID" 
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Check if order payment is completed
    if (order.payment_status !== "Paid") {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot retry shipping for unpaid order" 
      });
    }

    // Check if shipping is in a retry-able state
    const retryableStatuses = ["FAILED", "AWB_FAILED", "PENDING"];
    if (!retryableStatuses.includes(order.shipping_status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot retry shipping from status: ${order.shipping_status}` 
      });
    }

    // Reset shipping status and start retry
    await Order.findByIdAndUpdate(orderId, {
      shipping_status: "RETRYING",
      shipping_error: null,
      shipping_started_at: new Date()
    });

    // Process shipping asynchronously
    processShippingAsync(orderId).catch(error => {
      console.error(`❌ Shipping retry failed for order ${orderId}:`, error);
    });

    res.json({
      success: true,
      message: "Shipping retry initiated",
      orderId: orderId,
      status: "RETRYING"
    });

  } catch (error) {
    console.error("Retry shipping error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to retry shipping", 
      error: error.message 
    });
  }
};

// 🧪 Get Test Products - Fetch valid products for Razorpay testing
// PUBLIC ENDPOINT - No authentication required for testing purposes
exports.getTestProducts = async (req, res) => {
  try {
    console.log('🧪 Fetching test products for Razorpay checkout...');
    
    // Fetch up to 10 live products with available stock
    const testProducts = await Item.find({
      status: 'live',
      'sizes.stock': { $gt: 0 } // Only products with stock
    })
    .select('_id name description price sizes images category subcategory')
    .limit(10)
    .lean();
    
    if (!testProducts || testProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products available for testing',
        suggestion: 'Please contact backend team to add test products',
        count: 0,
        products: []
      });
    }
    
    // Format products for frontend
    const formattedProducts = testProducts.map(product => {
      // Filter only sizes with stock
      const availableSizes = product.sizes.filter(size => 
        size.stock > 0 && size.sku
      );
      
      return {
        _id: product._id,
        id: product._id, // Alias for frontend compatibility
        name: product.name,
        description: product.description || '',
        price: product.price || 0,
        sizes: availableSizes.map(size => ({
          size: size.size,
          sku: size.sku,
          stock: size.stock,
          quantity: size.quantity || size.stock,
          regularPrice: size.regularPrice || product.price || 0,
          salePrice: size.salePrice || 0
        })),
        images: product.images || [],
        category: product.category,
        subcategory: product.subcategory,
        // Sample cart item format
        sampleCartItem: availableSizes.length > 0 ? {
          itemId: product._id,
          name: product.name,
          sku: availableSizes[0].sku,
          size: availableSizes[0].size,
          quantity: 1,
          price: product.price || availableSizes[0].regularPrice || 0
        } : null
      };
    }).filter(product => product.sizes.length > 0); // Only include products with available sizes
    
    console.log(`✅ Found ${formattedProducts.length} test products`);
    
    res.json({
      success: true,
      message: 'Available test products for Razorpay checkout',
      count: formattedProducts.length,
      products: formattedProducts,
      usage: {
        description: 'Use these products for testing Razorpay checkout',
        example: formattedProducts.length > 0 ? {
          productId: formattedProducts[0]._id,
          cartItem: formattedProducts[0].sampleCartItem
        } : null
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching test products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test products',
      error: error.message
    });
  }
};