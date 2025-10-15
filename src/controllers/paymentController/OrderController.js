const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require('mongoose');
const Order = require("../../models/Order");
const Item = require("../../models/Item");
const PromoCode = require("../../models/PromoCodes");
// Note: ItemDetails functionality is now merged into Item model

// Import currency and delivery utilities
const { 
  getCurrencyByCountry, 
  convertPrice, 
  formatPriceWithCurrency,
  convertPricesInBulk 
} = require("../../utils/currencyUtils");
const { 
  getDeliveryOptionsByCountry, 
  calculateShippingCost, 
  checkFreeDeliveryEligibility,
  isIndianLocation 
} = require("../../utils/deliveryUtils");

// Load Razorpay credentials from environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_live_VRU7ggfYLI7DWV";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "giunOIOED3FhjWxW2dZ2peNe";

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

console.log(`🔐 Shiprocket configured with API User: ${SHIPROCKET_EMAIL}`);
console.log(`🏢 Company ID: 5783639 (Yoraa Apparels Private Limited)`);

// Enhanced Shiprocket token management with caching
let shiprocketToken = null;
let tokenExpiryTime = null;

async function getShiprocketToken() {
  try {
    // Validate credentials are available
    if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
      console.error("❌ Shiprocket credentials not configured in environment variables");
      return null;
    }

    // Check if we have a valid cached token
    if (shiprocketToken && tokenExpiryTime && new Date() < tokenExpiryTime) {
      return shiprocketToken;
    }

    console.log('Refreshing Shiprocket token...');
    const response = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: SHIPROCKET_EMAIL, 
        password: SHIPROCKET_PASSWORD 
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Authentication failed: ${response.status}`);
    }

    if (!data.token) {
      throw new Error('No token received from Shiprocket');
    }

    // Cache the token (typically valid for 10 days, we'll refresh after 8 days)
    shiprocketToken = data.token;
    tokenExpiryTime = new Date(Date.now() + (8 * 24 * 60 * 60 * 1000)); // 8 days
    
    console.log('Shiprocket token refreshed successfully');
    return shiprocketToken;
  } catch (error) {
    console.error("Shiprocket Auth Error:", error.message);
    // Clear cached token on error
    shiprocketToken = null;
    tokenExpiryTime = null;
    throw new Error(`Failed to authenticate with Shiprocket: ${error.message}`);
  }
}

// Enhanced Shiprocket API request with retry logic
async function makeShiprocketRequest(url, options = {}) {
  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      const token = await getShiprocketToken();
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      });

      // If unauthorized, clear token and retry once
      if (response.status === 401 && retryCount < maxRetries) {
        console.log('Shiprocket token expired, refreshing...');
        shiprocketToken = null;
        tokenExpiryTime = null;
        retryCount++;
        continue;
      }

      return response;
    } catch (error) {
      retryCount++;
      if (retryCount > maxRetries) {
        throw error;
      }
      console.log(`Shiprocket request failed, retry ${retryCount}:`, error.message);
      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
}

async function checkCourierServiceability(token, pickupPincode, deliveryPincode, weight = 0.5) {
  try {
    const serviceabilityResponse = await makeShiprocketRequest(`${SHIPROCKET_API_BASE}/courier/serviceability`, {
      method: "POST",
      body: JSON.stringify({
        pickup_postcode: pickupPincode,
        delivery_postcode: deliveryPincode,
        weight: parseFloat(weight) || 0.5,
        cod: 0,
      }),
    });

    if (!serviceabilityResponse.ok) {
      const errorData = await serviceabilityResponse.json();
      console.log("Shiprocket serviceability error:", errorData);
      return { 
        success: false, 
        message: errorData.message || "Serviceability check failed",
        statusCode: serviceabilityResponse.status
      };
    }

    const serviceabilityData = await serviceabilityResponse.json();
    console.log("Courier Serviceability Response:", JSON.stringify(serviceabilityData, null, 2));
    
    if (serviceabilityData.data?.available_courier_companies?.length > 0) {
      return { 
        success: true, 
        couriers: serviceabilityData.data.available_courier_companies 
      };
    } else {
      return { 
        success: false, 
        message: "No courier available for this route",
        data: serviceabilityData
      };
    }
  } catch (error) {
    console.error("Error checking courier serviceability:", error.message);
    return { 
      success: false, 
      message: "Error checking courier serviceability", 
      error: error.message 
    };
  }
}

async function checkShiprocketWalletBalance(token) {
  try {
    console.log('🔍 Checking Shiprocket wallet balance...');
    
    // Try multiple potential wallet balance endpoints
    const endpoints = [
      '/wallet/balance',
      '/account/details', 
      '/settings/company/profile',
      '/user/profile',
      '/orders' // This might contain balance info
    ];

    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying endpoint: ${SHIPROCKET_API_BASE}${endpoint}`);
        const balanceResponse = await fetch(`${SHIPROCKET_API_BASE}${endpoint}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const balanceData = await balanceResponse.json();
        console.log(`📊 Response from ${endpoint}:`, JSON.stringify(balanceData, null, 2));
        
        // Check if this endpoint has balance information
        if (balanceData.data && balanceData.data.available_balance !== undefined) {
          const balance = balanceData.data.available_balance;
          console.log(`✅ Found balance: Rs ${balance}`);
          if (balance < 100) {
            return {
              success: false,
              message: "Insufficient Shiprocket wallet balance",
              error: `Available balance is Rs ${balance}. Minimum required balance is Rs 100.`,
            };
          }
          return { success: true, balance };
        }
        
        // Store the last meaningful error
        if (balanceData.message && balanceData.status_code !== 404) {
          lastError = balanceData;
        }
        
      } catch (endpointError) {
        console.log(`❌ Error with endpoint ${endpoint}:`, endpointError.message);
        lastError = { message: endpointError.message };
      }
    }
    
    // If no endpoint worked, return a mock balance for development purposes
    console.log('⚠️ No wallet balance endpoint available, using mock data for development');
    return { 
      success: true, 
      balance: 5000, // Mock balance for development
      mock: true,
      note: "Wallet balance API not available - using mock data" 
    };
    
  } catch (error) {
    console.error("Error checking Shiprocket wallet balance:", error);
    return { 
      success: true, 
      balance: 5000, // Fallback mock balance
      mock: true,
      error: error.message,
      note: "Wallet balance API error - using mock data"
    };
  }
}

async function generateAWBWithCourier(shipmentId, token) {
  try {
    const awbResponse = await fetch(`${SHIPROCKET_API_BASE}/courier/assign/awb`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shipment_id: shipmentId }),
    });

    const awbData = await awbResponse.json();
    console.log("AWB Assignment Response:", JSON.stringify(awbData, null, 2));
    if (awbResponse.ok && awbData.awb_assign_status === 1) {
      return {
        success: true,
        message: "AWB generated successfully",
        awbData: awbData.response.data,
      };
    } else {
      console.error("Failed to generate AWB:", awbData);
      if (awbData.status_code === 350) {
        return {
          success: false,
          message: "Insufficient Shiprocket wallet balance",
          error: "Please recharge your Shiprocket wallet. Minimum required balance is Rs 100.",
        };
      }
      return {
        success: false,
        message: "AWB generation failed",
        error: awbData?.message || "Unknown error",
      };
    }
  } catch (error) {
    console.error("Error generating AWB:", error);
    return { success: false, message: "Error generating AWB", error: error.message };
  }
}

// Create Order
exports.createOrder = async (req, res) => {
  try {
    const { amount, cart, staticAddress, promoCode, deliveryOption } = req.body;
    const userId = req.user._id;

    console.log("amount:", amount);
    console.log("cart:", cart);
    console.log("address:", staticAddress);
    console.log("promoCode:", promoCode);
    console.log("deliveryOption:", deliveryOption);
    console.log("userId:", userId);

    // Validate cart data
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty or invalid" });
    }

    // Extract item IDs and SKUs from cart
    const itemIds = cart.map(cartItem => cartItem.itemId || cartItem.id); // Support both field names
    const skus = cart.map(cartItem => cartItem.sku);

    // Validate itemIds with detailed error messages
    const invalidIds = itemIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
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

    // Check if all items exist with detailed error reporting
    const existingItems = await Item.find({ _id: { $in: itemIds } });
    if (existingItems.length !== itemIds.length) {
      const existingItemIds = existingItems.map(item => item._id.toString());
      const missingItemIds = itemIds.filter(id => !existingItemIds.includes(id.toString()));
      
      console.error("❌ Items not found in database:", missingItemIds);
      
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

    // Validate SKUs in Items (merged model)
    const itemDetails = await Item.find({ _id: { $in: itemIds } });
    for (const cartItem of cart) {
      const itemId = cartItem.itemId || cartItem.id; // Support both field names
      const detail = itemDetails.find(d => d._id.toString() === itemId);
      if (!detail) {
        return res.status(400).json({ 
          error: "Item not found",
          message: `Item ${itemId} not found in database`,
          invalidItems: [{
            itemId: itemId,
            name: cartItem.name || 'Unknown',
            reason: 'Item not found'
          }]
        });
      }
      const skuExists = detail.sizes.some(size => size.sku === cartItem.sku);
      if (!skuExists) {
        console.error(`❌ Invalid SKU for ${detail.productName}:`, {
          requestedSku: cartItem.sku,
          availableSizes: detail.sizes.map(s => ({ sku: s.sku, size: s.size }))
        });
        
        return res.status(400).json({ 
          error: "Invalid item configuration",
          message: "Size or SKU no longer available",
          invalidItems: [{
            itemId: itemId,
            name: detail.productName,
            requestedSku: cartItem.sku,
            requestedSize: cartItem.size || 'Unknown',
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
    }

    // Determine user's location and currency
    const userCountry = staticAddress?.country || 'India';
    const userCurrency = getCurrencyByCountry(userCountry);
    const isIndia = isIndianLocation(userCountry);
    
    console.log("User location:", { userCountry, userCurrency, isIndia });

    // Calculate original cart total (prices stored in INR)
    let cartTotal = 0;
    for (const cartItem of cart) {
      const item = existingItems.find(i => i._id.toString() === cartItem.itemId);
      cartTotal += item.price * cartItem.quantity;
    }

    // Convert cart total to user currency if needed
    let displayCartTotal = cartTotal;
    if (userCurrency !== 'INR') {
      displayCartTotal = await convertPrice(cartTotal, userCurrency);
    }

    // Calculate shipping cost based on location and delivery option
    let shippingCost = 0;
    let selectedDeliveryOption = null;

    if (deliveryOption) {
      try {
        const shippingResult = calculateShippingCost(
          deliveryOption, 
          userCountry, 
          cartTotal, 
          1 // Default weight - should be calculated from items
        );
        shippingCost = shippingResult.cost;
        selectedDeliveryOption = shippingResult.option;
        
        // Convert shipping cost to INR if order currency is USD
        if (shippingResult.currency === 'USD' && userCurrency === 'USD') {
          // Convert USD shipping cost to INR for storage
          shippingCost = shippingCost / 0.012; // Approximate USD to INR conversion
        }
        
        console.log("Shipping calculation:", shippingResult);
      } catch (error) {
        console.error("Error calculating shipping:", error);
        return res.status(400).json({ error: error.message });
      }
    } else {
      // Use legacy shipping logic for backward compatibility
      shippingCost = cartTotal > 500 ? 0 : 50;
    }

    let totalAmount = cartTotal + shippingCost;

    // Validate and apply promo code
    let promoDiscount = 0;
    let modifiedCart = [...cart];
    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode.toUpperCase(), isActive: true });
      if (!promo) {
        return res.status(400).json({ error: "Invalid or inactive promo code" });
      }

      const currentDate = new Date();
      if (currentDate < promo.startDate || currentDate > promo.endDate) {
        return res.status(400).json({ error: "Promo code has expired" });
      }

      if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) {
        return res.status(400).json({ error: "Promo code usage limit reached" });
      }

      if (cartTotal < promo.minOrderValue) {
        return res.status(400).json({ error: `Cart total must be at least ₹${promo.minOrderValue}` });
      }

      if (promo.discountType === 'percentage') {
        promoDiscount = (cartTotal * promo.discountValue) / 100;
      } else if (promo.discountType === 'fixed') {
        promoDiscount = promo.discountValue;
      } else if (promo.discountType === 'free_shipping') {
        promoDiscount = shippingCost;
      } else if (promo.discountType === 'bogo') {
        // Find the cheapest item to duplicate
        const cheapestItem = existingItems.reduce((min, item) => {
          return min.price < item.price ? min : item;
        }, existingItems[0]);
        const cheapestCartItem = cart.find(c => c.itemId === cheapestItem._id.toString());
        modifiedCart.push({
          itemId: cheapestItem._id.toString(),
          sku: cheapestCartItem.sku,
          quantity: cheapestCartItem.quantity,
        });
        promoDiscount = cheapestItem.price * cheapestCartItem.quantity;
      }

      totalAmount = cartTotal + shippingCost - promoDiscount;
    }

    // Validate provided amount
    if (Math.abs(totalAmount - amount) > 0.01) {
      return res.status(400).json({ error: `Provided amount (${amount}) does not match calculated total (${totalAmount})` });
    }

    const options = {
      amount: totalAmount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    // Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create(options);

    // Prepare item_quantities with SKUs
    const itemQuantities = modifiedCart.map(cartItem => ({
      item_id: cartItem.itemId,
      sku: cartItem.sku,
      quantity: cartItem.quantity,
    }));

    // Save Order in Database
    const newOrder = new Order({
      user: userId,
      items: itemIds,
      total_price: totalAmount,
      payment_status: "Pending",
      razorpay_order_id: razorpayOrder.id,
      address: staticAddress,
      item_quantities: itemQuantities,
      promoCode: promoCode ? promoCode.toUpperCase() : null,
      promoDiscount,
    });

    await newOrder.save();

    res.json({
      ...razorpayOrder,
      calculatedTotal: totalAmount,
      promoDiscount,
      shippingCost,
    });
    console.log("order created:", newOrder);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "Error creating Razorpay order", details: error.message });
  }
};

// Verify Payment & Create Shiprocket Order
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // Verify Razorpay Payment Signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Update Order Payment Status
    let order = await Order.findOneAndUpdate(
      { razorpay_order_id },
      {
        $set: {
          payment_status: "Paid",
          razorpay_payment_id,
          razorpay_signature,
        },
      },
      { new: true }
    ).populate("items").populate("user");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Increment promo code usage if applied
    if (order.promoCode) {
      const promo = await PromoCode.findOneAndUpdate(
        { code: order.promoCode, isActive: true },
        { $inc: { currentUses: 1 } },
        { new: true }
      );
      if (!promo) {
        console.warn(`Promo code ${order.promoCode} not found or inactive during payment verification`);
      }
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
      sizeEntry.quantity -= quantity; // Also update quantity field for consistency

      // Aggregate quantity for Item stock update
      if (itemStockUpdates.has(itemId.toString())) {
        itemStockUpdates.set(itemId.toString(), itemStockUpdates.get(itemId.toString()) + quantity);
      } else {
        itemStockUpdates.set(itemId.toString(), quantity);
      }

      await itemDetails.save();
    }

    // Update stock in Item model
    for (const [itemId, quantity] of itemStockUpdates) {
      const item = await Item.findById(itemId);
      if (!item) {
        throw new Error(`Item not found for ID: ${itemId}`);
      }
      if (item.stock < quantity) {
        throw new Error(
          `Insufficient stock for item ID: ${itemId}. Available: ${item.stock}, Requested: ${quantity}`
        );
      }
      item.stock -= quantity;
      await item.save();
    }

    // Get Shiprocket API Token
    const token = await getShiprocketToken();
    if (!token) {
      return res.status(500).json({ success: false, message: "Failed to authenticate Shiprocket" });
    }

    // Calculate shipping cost (same logic as in createOrder)
    const cartTotal = order.items.reduce((total, item) => total + (item.price * order.item_quantities.find(q => q.item_id.toString() === item._id.toString()).quantity), 0);
    const shippingCost = order.promoCode && order.promoCode.discountType === 'free_shipping' ? 0 : (cartTotal > 500 ? 0 : 50);

    // Create Order in Shiprocket
    const totalWeight = Math.max(
      order.items.reduce((total, item) => total + (item.weight || 0.5), 0),
      0.5
    );
    const maxLength = Math.max(...order.items.map((item) => item.length ?? 0.5), 0.5);
    const maxBreadth = Math.max(...order.items.map((item) => item.breadth ?? 0.5), 0.5);
    const maxHeight = Math.max(...order.items.map((item) => item.height ?? 0.5), 0.5);

    const shiprocketResponse = await fetch(`${SHIPROCKET_API_BASE}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order_id: order._id.toString(),
        order_date: new Date().toISOString().split('T')[0], // Date only, not timestamp
        pickup_location: "warehouse",
        billing_customer_name: order.address.firstName || "Guest",
        billing_last_name: order.address.lastName || "N/A",
        billing_address: order.address.address,
        billing_city: order.address.city,
        billing_pincode: order.address.pinCode,
        billing_state: order.address.state,
        billing_country: order.address.country || "India",
        billing_email: order.user?.email || "customer@example.com",
        billing_phone: order.user?.phNo || "9999999999",
        shipping_is_billing: true,
        payment_method: "Prepaid",
        sub_total: order.total_price,
        length: maxLength,
        breadth: maxBreadth,
        height: maxHeight,
        weight: totalWeight,
        order_items: order.item_quantities.map((entry) => {
          const item = order.items.find((i) => i._id.toString() === entry.item_id.toString());
          return {
            name: item ? item.name : "Unknown Item",
            sku: entry.sku,
            units: entry.quantity,
            selling_price: item ? item.price : 0,
          };
        }),
      }),
    });

    const shiprocketData = await shiprocketResponse.json();
    
    // Enhanced error handling for IP restrictions
    if (shiprocketResponse.status === 403) {
      console.error('❌ Shiprocket 403 Error - IP Restriction:', shiprocketData);
      throw new Error(
        'Shiprocket API access restricted. Please whitelist your server IP address in Shiprocket dashboard (Settings → API → IP Whitelisting). ' +
        'Contact support@shiprocket.in if IP whitelisting is not available. Error: ' + shiprocketData.message
      );
    }
    if (shiprocketData.status_code === 1) {
      order.shiprocket_shipment_id = shiprocketData.shipment_id;
      order.shiprocket_orderId = shiprocketData.order_id;
      await order.save();

      const awbResponse = await generateAWBWithCourier(shiprocketData.shipment_id, token);
      if (awbResponse.success) {
        const awbData = awbResponse.awbData;
        if (!awbData || !awbData.awb_code) {
          console.error("Invalid AWB data structure:", awbData);
          throw new Error("Failed to retrieve AWB code");
        }
        order.awb_code = awbData.awb_code;
        order.shiprocket_shipment_id = awbData.shipment_id;
        order.tracking_url = `https://shiprocket.co/tracking/${awbData.awb_code}`;
        order.courier_company_id = awbData.courier_company_id;
        order.courier_name = awbData.courier_name;
        order.freight_charges = awbData.freight_charges;
        order.applied_weight = awbData.applied_weight;
        order.routing_code = awbData.routing_code;
        order.invoice_no = awbData.invoice_no;
        order.transporter_id = awbData.transporter_id;
        order.transporter_name = awbData.transporter_name;
        order.shipped_by = {
          shipper_company_name: awbData.shipped_by.shipper_company_name,
          shipper_address_1: awbData.shipped_by.shipper_address_1,
          shipper_address_2: awbData.shipped_by.shipper_address_2,
          shipper_city: awbData.shipped_by.shipper_city,
          shipper_state: awbData.shipped_by.shipper_state,
          shipper_country: awbData.shipped_by.shipper_country,
          shipper_postcode: awbData.shipped_by.shipper_postcode,
          shipper_phone: awbData.shipped_by.shipper_phone,
          shipper_email: awbData.shipped_by.shipper_email,
        };
        await order.save();
        return res.json({
          success: true,
          message: "Payment verified, Shiprocket order created & AWB generated!",
          order,
          shiprocketOrderId: shiprocketData.order_id,
          awbCode: awbData.awb_code,
        });
      } else {
        console.error("AWB generation failed:", awbResponse.error);
        return res.json({
          success: true,
          message: "Payment verified and Shiprocket order created, but AWB generation failed",
          order,
          shiprocketOrderId: shiprocketData.order_id,
          awbCode: "AWB generation failed",
        });
      }
    } else {
      throw new Error("Shiprocket order creation failed: " + JSON.stringify(shiprocketData));
    }
  } catch (error) {
    console.error("Payment verification error:", error);

    let order = await Order.findOne({ razorpay_order_id: req.body.razorpay_order_id });
    if (error.message.includes("Insufficient stock") && req.body.razorpay_payment_id && order) {
      try {
        const refund = await razorpay.payments.refund(req.body.razorpay_payment_id, {
          amount: order.total_price * 100,
          speed: "optimum",
        });
        console.log("Refund initiated due to insufficient stock:", refund);
      } catch (refundError) {
        console.error("Refund failed:", refundError);
      }
    }

    res.status(500).json({ success: false, message: "Payment verification failed", error: error.message });
  }
};

// Cancel Order
exports.cancelOrder = async (req, res) => {
  try {
    const { order_id } = req.params;

    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.shipping_status === "Delivered") {
      return res.status(400).json({ success: false, message: "Order cannot be cancelled as it is already delivered" });
    }

    if (order.shiprocket_orderId) {
      const shiprocketToken = await getShiprocketToken();
      if (!shiprocketToken) {
        return res.status(500).json({ success: false, message: "Failed to authenticate with Shiprocket" });
      }

      const cancelShiprocket = await fetch(`${SHIPROCKET_API_BASE}/orders/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${shiprocketToken}`,
        },
        body: JSON.stringify({ ids: [order.shiprocket_orderId] }),
      });

      const cancelData = await cancelShiprocket.json();
      if (!cancelShiprocket.ok || !cancelData.success) {
        return res.status(500).json({ success: false, message: "Failed to cancel shipment in Shiprocket", error: cancelData });
      }
    }

    if (order.payment_status === "Paid" && order.razorpay_payment_id) {
      const refundResponse = await fetch(`https://api.razorpay.com/v1/payments/${order.razorpay_payment_id}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`,
        },
        body: JSON.stringify({ amount: order.total_price * 100, speed: "optimum" }),
      });

      const refundData = await refundResponse.json();
      if (!refundResponse.ok || !refundData.id) {
        return res.status(500).json({ success: false, message: "Refund failed", error: refundData });
      }

      order.refund_status = "Initiated";
    } else {
      order.refund_status = "Not Required";
    }

    // If promo code was applied, consider decrementing usage
    if (order.promoCode) {
      await PromoCode.findOneAndUpdate(
        { code: order.promoCode, isActive: true },
        { $inc: { currentUses: -1 } }
      );
    }

    order.order_status = "Cancelled";
    order.shipping_status = "Cancelled";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Create Return Order
exports.createReturnOrder = async (req, res) => {
  console.log("=== Starting createReturnOrder ===");
  try {
    console.log("Raw Request Body:", req.body);
    console.log("Uploaded Files:", req.files);

    const { orderId, reason } = req.body;
    const userId = req.user._id;
    const images = req.files;

    console.log("Parsed Request Body:", { orderId, reason });
    console.log("User ID:", userId);
    console.log("Uploaded Images:", images ? images.length : 0);

    if (!orderId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: orderId and reason are required" 
      });
    }

    if (images && images.length > 3) {
      return res.status(400).json({ success: false, message: "Maximum 3 images allowed" });
    }

    const order = await Order.findById(orderId)
      .populate("items", "name price sku dimensions")
      .populate("item_quantities.item_id", "name price sku dimensions");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to return this order" });
    }

    if (order.shipping_status !== "Delivered") {
      return res.status(400).json({ success: false, message: "Order must be delivered to initiate a return" });
    }

    const deliveredDate = order.created_at;
    const currentDate = new Date();
    const daysSinceDelivery = (currentDate - new Date(deliveredDate)) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 30) {
      return res.status(400).json({ success: false, message: "Return period expired (30 days after delivery)" });
    }

    const token = await getShiprocketToken();
    console.log("Shiprocket Token:", token);
    if (!token) {
      return res.status(500).json({ success: false, message: "Failed to authenticate with Shiprocket" });
    }

    let imageUrls = [];
    if (images && images.length > 0) {
      imageUrls = images.map(file => {
        console.log(`Processing image: ${file.originalname}`);
        return `https://example.com/uploads/${file.originalname}`;
      });
      console.log("Uploaded Image URLs:", imageUrls);
    }

    const returnDimensions = order.item_quantities.reduce((acc, qty) => {
      const detail = order.items.find(i => i._id.toString() === qty.item_id.toString())?.dimensions || { length: 10, breadth: 10, height: 10, weight: 0.5 };
      return {
        length: Math.max(acc.length || 0, (detail.length || 10) * qty.quantity),
        breadth: Math.max(acc.breadth || 0, (detail.breadth || 10) * qty.quantity),
        height: Math.max(acc.height || 0, (detail.height || 10) * qty.quantity),
        weight: (acc.weight || 0) + ((detail.weight || 0.5) * qty.quantity),
      };
    }, {});

    const returnPayload = {
      order_id: `R_${orderId}_${Date.now()}`,
      order_date: new Date().toISOString().split("T")[0],
      channel_id: process.env.SHIPROCKET_CHANNEL_ID || "6355414",
      pickup_customer_name: order.address.firstName,
      pickup_last_name: order.address.lastName || "",
      pickup_address: order.address.address,
      pickup_address_2: "",
      pickup_city: order.address.city,
      pickup_state: order.address.state,
      pickup_country: order.address.country || "India",
      pickup_pincode: order.address.pinCode,
      pickup_email: order.user?.email || "customer@example.com",
      pickup_phone: order.address.phoneNumber.replace(/\D/g, ""),
      pickup_isd_code: "91",
      shipping_customer_name: order.shipped_by.shipper_company_name || "Seller",
      shipping_last_name: "",
      shipping_address: order.shipped_by.shipper_address_1 || "Default Address",
      shipping_address_2: order.shipped_by.shipper_address_2 || "",
      shipping_city: order.shipped_by.shipper_city || "Default City",
      shipping_country: order.shipped_by.shipper_country || "India",
      shipping_pincode: order.shipped_by.shipper_postcode || "110001",
      shipping_state: order.shipped_by.shipper_state || "Default State",
      shipping_email: order.shipped_by.shipper_email || "seller@example.com",
      shipping_phone: order.shipped_by.shipper_phone || "9999999999",
      shipping_isd_code: "91",
      order_items: order.item_quantities.map((qty) => {
        const item = order.items.find(i => i._id.toString() === qty.item_id.toString());
        return {
          name: item?.name || "Unknown Item",
          sku: item?.sku || "UNKNOWN_SKU",
          units: qty.quantity,
          selling_price: item?.price || 0,
          discount: 0,
          hsn: item?.hsn || "1733808730720",
        };
      }),
      payment_method: "Prepaid",
      total_discount: order.promoDiscount || 0,
      sub_total: order.total_price,
      length: returnDimensions.length || 10,
      breadth: returnDimensions.breadth || 10,
      height: returnDimensions.height || 10,
      weight: returnDimensions.weight || 0.5,
      return_reason: reason || "Item defective or doesn't work",
    };

    console.log("Return Payload:", JSON.stringify(returnPayload, null, 2));

    const returnResponse = await fetch(`${SHIPROCKET_API_BASE}/orders/create/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(returnPayload),
    });

    const returnData = await returnResponse.json();
    console.log("Full Return Response:", JSON.stringify(returnData, null, 2));

    if (!returnResponse.ok || !returnData.order_id) {
      return res.status(500).json({
        success: false,
        message: "Failed to create return order",
        error: returnData.message || returnData,
      });
    }

    let returnAwbResult;
    const returnShipmentId = returnData.shipment_id;
    if (returnShipmentId) {
      returnAwbResult = await generateAWBWithCourier(returnShipmentId, token);
      if (!returnAwbResult.success) {
        console.error("Failed to assign return AWB:", returnAwbResult);
      }
    }

    let refundData;
    if (order.payment_status === "Paid" && order.razorpay_payment_id) {
      const refundResponse = await fetch(`https://api.razorpay.com/v1/payments/${order.razorpay_payment_id}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${razorpay.key_id}:${razorpay.key_secret}`).toString("base64")}`,
        },
        body: JSON.stringify({ amount: order.total_price * 100, speed: "optimum" }),
      });

      refundData = await refundResponse.json();
      if (!refundResponse.ok || !refundData.id) {
        return res.status(500).json({ success: false, message: "Refund initiation failed", error: refundData });
      }
    }

    // If promo code was applied, decrement usage
    if (order.promoCode) {
      await PromoCode.findOneAndUpdate(
        { code: order.promoCode, isActive: true },
        { $inc: { currentUses: -1 } }
      );
    }

    order.refund = {
      requestDate: new Date(),
      status: refundData ? "Initiated" : "Pending",
      rmaNumber: returnPayload.order_id,
      amount: order.total_price,
      reason: reason || "Not specified",
      returnAwbCode: returnAwbResult?.success ? returnAwbResult.awbData.awb_code : returnData.awb_code || "",
      returnTrackingUrl: returnAwbResult?.success
        ? `https://shiprocket.co/tracking/${returnAwbResult.awbData.awb_code}`
        : returnData.awb_code
        ? `https://shiprocket.co/tracking/${returnData.awb_code}`
        : "",
      returnLabelUrl: returnData.label_url || "",
      shiprocketReturnId: returnData.order_id,
      returnShipmentId: returnData.shipment_id || "",
      refundTransactionId: refundData?.id || null,
      refundStatus: refundData ? "Initiated" : null,
      notes: "Return initiated via Shiprocket Return API",
      images: imageUrls
    };

    await order.save();

    res.status(200).json({
      success: true,
      message: "Return order created successfully" + (refundData ? " and refund initiated" : ""),
      rmaNumber: order.refund.rmaNumber,
      returnLabelUrl: order.refund.returnLabelUrl,
      refund: order.refund,
    });
  } catch (error) {
    console.error("Error in createReturnOrder:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

// Create Exchange Order
exports.createExchangeOrder = async (req, res) => {
  console.log("=== Starting createExchangeOrder ===");
  try {
    console.log("Raw Request Body:", req.body);
    console.log("Uploaded Files:", req.files);

    const { orderId, newItemId, desiredSize, reason } = req.body;
    const userId = req.user._id;
    const images = req.files;

    console.log("Parsed Request Body:", { orderId, newItemId, desiredSize, reason });
    console.log("User ID:", userId);
    console.log("Uploaded Images:", images ? images.length : 0);

    if (!orderId || !newItemId || !desiredSize || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: orderId, newItemId, desiredSize, and reason are required" 
      });
    }

    if (images && images.length > 3) {
      return res.status(400).json({ success: false, message: "Maximum 3 images allowed" });
    }

    const order = await Order.findById(orderId)
      .populate("items", "name price sku dimensions")
      .populate("item_quantities.item_id", "name price sku dimensions");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to exchange this order" });
    }

    if (order.shipping_status !== "Delivered") {
      return res.status(400).json({ success: false, message: "Order must be delivered to initiate an exchange" });
    }

    const deliveredDate = order.created_at;
    const currentDate = new Date();
    const daysSinceDelivery = (currentDate - new Date(deliveredDate)) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 30) {
      return res.status(400).json({ success: false, message: "Exchange period expired (30 days after delivery)" });
    }

    const token = await getShiprocketToken();
    console.log("Shiprocket Token:", token);
    if (!token) {
      return res.status(500).json({ success: false, message: "Failed to authenticate with Shiprocket" });
    }

    let imageUrls = [];
    if (images && images.length > 0) {
      imageUrls = images.map(file => {
        console.log(`Processing image: ${file.originalname}`);
        return `https://example.com/uploads/${file.originalname}`;
      });
      console.log("Uploaded Image URLs:", imageUrls);
    }

    const returnDimensions = order.item_quantities.reduce((acc, qty) => {
      const detail = order.items.find(i => i._id.toString() === qty.item_id.toString())?.dimensions || { length: 10, breadth: 10, height: 10, weight: 0.5 };
      return {
        length: Math.max(acc.length || 0, (detail.length || 10) * qty.quantity),
        breadth: Math.max(acc.breadth || 0, (detail.breadth || 10) * qty.quantity),
        height: Math.max(acc.height || 0, (detail.height || 10) * qty.quantity),
        weight: (acc.weight || 0) + ((detail.weight || 0.5) * qty.quantity),
      };
    }, {});

    const exchangeDimensions = order.item_quantities.reduce((acc, qty) => {
      const detail = order.items.find(i => i._id.toString() === qty.item_id.toString())?.dimensions || { length: 11, breadth: 11, height: 11, weight: 0.5 };
      return {
        length: Math.max(acc.length || 0, (detail.length || 11) * qty.quantity),
        breadth: Math.max(acc.breadth || 0, (detail.breadth || 11) * qty.quantity),
        height: Math.max(acc.height || 0, (detail.height || 11) * qty.quantity),
        weight: (acc.weight || 0) + ((detail.weight || 0.5) * qty.quantity),
      };
    }, {});

    const exchangePayload = {
      exchange_order_id: `EX_${orderId}_${Date.now()}`,
      seller_pickup_location_id: process.env.SELLER_PICKUP_LOCATION_ID || "7256830",
      seller_shipping_location_id: process.env.SELLER_SHIPPING_LOCATION_ID || "7256830",
      return_order_id: `R_${orderId}_${Date.now()}`,
      order_date: new Date().toISOString().split("T")[0],
      payment_method: "prepaid",
      channel_id: process.env.SHIPROCKET_CHANNEL_ID || "6355414",
      buyer_shipping_first_name: order.address.firstName,
      buyer_shipping_address: order.address.address,
      buyer_shipping_city: order.address.city,
      buyer_shipping_state: order.address.state,
      buyer_shipping_country: order.address.country || "India",
      buyer_shipping_pincode: order.address.pinCode,
      buyer_shipping_phone: order.address.phoneNumber.replace(/\D/g, ""),
      buyer_shipping_email: order.user?.email || "customer@example.com",
      buyer_pickup_first_name: order.address.firstName,
      buyer_pickup_address: order.address.address,
      buyer_pickup_city: order.address.city,
      buyer_pickup_state: order.address.state,
      buyer_pickup_country: order.address.country || "India",
      buyer_pickup_pincode: order.address.pinCode,
      buyer_pickup_phone: order.address.phoneNumber.replace(/\D/g, ""),
      order_items: order.item_quantities.map((qty) => {
        const item = order.items.find(i => i._id.toString() === qty.item_id.toString());
        return {
          name: item?.name || "Unknown Item",
          selling_price: item?.price || 0,
          units: qty.quantity,
          hsn: item?.hsn || "1733808730720",
          sku: item?.sku || newItemId,
          exchange_item_name: item?.name || "Unknown Item",
          exchange_item_sku: newItemId,
        };
      }),
      sub_total: order.total_price,
      total_discount: order.promoDiscount || 0,
      return_length: returnDimensions.length || 10,
      return_breadth: returnDimensions.breadth || 10,
      return_height: returnDimensions.height || 10,
      return_weight: returnDimensions.weight || 0.5,
      exchange_length: exchangeDimensions.length || 11,
      exchange_breadth: exchangeDimensions.breadth || 11,
      exchange_height: exchangeDimensions.height || 11,
      exchange_weight: exchangeDimensions.weight || 0.5,
      return_reason: 29
    };

    console.log("Exchange Payload:", JSON.stringify(exchangePayload, null, 2));

    const exchangeResponse = await fetch(`${SHIPROCKET_API_BASE}/orders/create/exchange`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(exchangePayload),
    });

    const exchangeData = await exchangeResponse.json();
    console.log("Full Exchange Response:", JSON.stringify(exchangeData, null, 2));

    if (!exchangeResponse.ok || !exchangeData.success) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create exchange order", 
        error: exchangeData.message || exchangeData 
      });
    }

    let returnAwbResult;
    const returnShipmentId = exchangeData.data?.return_orders?.shipment_id;
    if (returnShipmentId) {
      returnAwbResult = await generateAWBWithCourier(returnShipmentId, token);
      if (!returnAwbResult.success) {
        console.error("Failed to assign return AWB:", returnAwbResult);
      }
    } else {
      console.warn("Return shipment ID not found in response");
    }

    let forwardAwbResult;
    const forwardShipmentId = exchangeData.data?.forward_orders?.shipment_id;
    if (forwardShipmentId) {
      forwardAwbResult = await generateAWBWithCourier(forwardShipmentId, token);
      if (!forwardAwbResult.success) {
        console.error("Failed to assign forward AWB:", forwardAwbResult);
      }
    } else {
      console.warn("Forward shipment ID not found in response");
    }

    // If promo code was applied, decrement usage
    if (order.promoCode) {
      await PromoCode.findOneAndUpdate(
        { code: order.promoCode, isActive: true },
        { $inc: { currentUses: -1 } }
      );
    }

    order.exchange = {
      requestDate: new Date(),
      status: "Pending",
      rmaNumber: exchangePayload.return_order_id,
      newItemId,
      desiredSize,
      reason: reason || "Not specified",
      returnAwbCode: returnAwbResult?.success ? returnAwbResult.awbData.awb_code : exchangeData.data?.return_orders?.awb_code || "",
      returnTrackingUrl: returnAwbResult?.success ? 
        `https://shiprocket.co/tracking/${returnAwbResult.awbData.awb_code}` : 
        exchangeData.data?.return_orders?.awb_code ? `https://shiprocket.co/tracking/${exchangeData.data.return_orders.awb_code}` : "",
      returnLabelUrl: exchangeData.data?.return_orders?.label_url || "",
      shiprocketReturnId: exchangeData.data?.return_orders?.order_id || exchangePayload.return_order_id,
      returnShipmentId: exchangeData.data?.return_orders?.shipment_id || "",
      forwardAwbCode: forwardAwbResult?.success ? forwardAwbResult.awbData.awb_code : exchangeData.data?.forward_orders?.awb_code || "",
      forwardTrackingUrl: forwardAwbResult?.success ? 
        `https://shiprocket.co/tracking/${forwardAwbResult.awbData.awb_code}` : 
        exchangeData.data?.forward_orders?.awb_code ? `https://shiprocket.co/tracking/${exchangeData.data.forward_orders.awb_code}` : "",
      shiprocketForwardOrderId: exchangeData.data?.forward_orders?.order_id || exchangePayload.exchange_order_id,
      forwardShipmentId: exchangeData.data?.forward_orders?.shipment_id || "",
      notes: "Exchange initiated via Shiprocket Exchange API",
      images: imageUrls
    };

    order.item_quantities.forEach(item => {
      item.desiredSize = desiredSize || item.desiredSize || "Not specified";
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: "Exchange order created successfully" + 
        (returnAwbResult?.success ? " with return AWB assigned" : "") + 
        (forwardAwbResult?.success ? " with forward AWB assigned" : ""),
      rmaNumber: order.exchange.rmaNumber,
      returnLabelUrl: order.exchange.returnLabelUrl,
      exchange: order.exchange,
      forwardAwbCode: order.exchange.forwardAwbCode,
      returnAwbCode: order.exchange.returnAwbCode,
    });
  } catch (error) {
    console.error("Error in createExchangeOrder:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

// Get Orders By User
exports.getOrdersByUser = async (req, res) => {
  console.log("Fetching user orders...");

  try {
    const userId = req.user._id;
    console.log("User ID:", userId);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({
      user: userId,
    });

    console.log("Total eligible orders:", totalOrders);

    const orders = await Order.find({
      user: userId,
    })
      .populate("user", "firstName lastName email phoneNumber")
      .populate("items", "name price imageUrl description")
      .populate("item_quantities.item_id", "name price image")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    console.log("Orders retrieved:", orders.length);
    console.log("Orders Data:", JSON.stringify(orders, null, 2));

    // Return response with orders array (empty if no orders found)
    const message = orders.length > 0 ? "Orders fetched successfully" : "No orders found";

    res.status(200).json({
      success: true,
      data: orders, // Changed from 'orders' to 'data' to match frontend expectations
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      message: message
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get Order By ID for User
exports.getOrderById = async (req, res) => {
  console.log("Fetching order by ID...");

  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    console.log("Order ID:", orderId);
    console.log("User ID:", userId);

    // Validate orderId - accept both Razorpay order IDs and MongoDB ObjectIds
    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: "Order ID is required" 
      });
    }

    // Build query to search by both razorpay_order_id and _id
    let orderQuery = {
      user: userId,
      $or: []
    };

    // If it's a Razorpay order ID (starts with "order_")
    if (orderId.startsWith('order_') && orderId.length > 6) {
      orderQuery.$or.push({ razorpay_order_id: orderId });
    }

    // If it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      orderQuery.$or.push({ _id: orderId });
    }

    // If no valid format found
    if (orderQuery.$or.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid order ID format" 
      });
    }

    // Find the order and ensure it belongs to the requesting user
    const order = await Order.findOne(orderQuery)
      .populate("user", "firstName lastName email phoneNumber")
      .populate("items", "name price imageUrl description")
      .populate("item_quantities.item_id", "name price image")
      .lean();

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found or access denied" 
      });
    }

    // Apply currency conversion if middleware has set currency info
    if (req.userCurrency && req.userLocation) {
      try {
        // Convert order total
        if (order.total_amount) {
          order.total_amount = convertPrice(
            order.total_amount, 
            'INR', 
            req.userCurrency.code
          );
        }

        // Convert item prices
        if (order.cart && Array.isArray(order.cart)) {
          order.cart = order.cart.map(cartItem => {
            if (cartItem.price) {
              cartItem.price = convertPrice(
                cartItem.price, 
                'INR', 
                req.userCurrency.code
              );
            }
            return cartItem;
          });
        }

        // Convert item_quantities prices
        if (order.item_quantities && Array.isArray(order.item_quantities)) {
          order.item_quantities = order.item_quantities.map(item => {
            if (item.item_id && item.item_id.price) {
              item.item_id.price = convertPrice(
                item.item_id.price, 
                'INR', 
                req.userCurrency.code
              );
            }
            return item;
          });
        }

        // Add currency info to response
        order.currency = req.userCurrency;
        order.deliveryOptions = req.deliveryOptions;
      } catch (conversionError) {
        console.warn("Currency conversion failed for order:", conversionError);
      }
    }

    console.log("Order retrieved successfully:", orderId);

    res.status(200).json({
      success: true,
      data: order,
      message: "Order details fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Get All Orders Sorted
exports.getAllOrdersSorted = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "firstName lastName email phoneNumber")
      .populate("items", "name price image description")
      .populate("item_quantities.item_id", "name price image")
      .sort({ created_at: -1 });

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No orders found" });
    }

    res.status(200).json({
      success: true,
      totalOrders: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error fetching sorted orders:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Authenticate Shiprocket
exports.authenticateShiprocket = async (req, res) => {
  try {
    const token = await getShiprocketToken();
    if (!token) {
      return res.status(500).json({ success: false, message: "Failed to authenticate with Shiprocket" });
    }
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("Error authenticating Shiprocket:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get Shiprocket Tracking
exports.getShiprocketTracking = async (req, res) => {
  try {
    const { awbCode } = req.params;
    const shiprocketToken = await getShiprocketToken();
    if (!shiprocketToken) {
      return res.status(500).json({ success: false, message: "Failed to authenticate with Shiprocket" });
    }

    const response = await fetch(`${SHIPROCKET_API_BASE}/courier/track/awb/${awbCode}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${shiprocketToken}`,
      },
    });

    const data = await response.json();
    if (!response.ok || !data.tracking_data) {
      return res.status(404).json({ success: false, message: "Tracking data not available" });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching Shiprocket tracking:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get Delivered Orders By User
exports.getDeliveredOrdersByUser = async (req, res) => {
  console.log("Fetching delivered orders for user...");

  try {
    const userId = req.user._id;
    console.log("User ID:", userId);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalDeliveredOrders = await Order.countDocuments({
      user: userId,
      shipping_status: "Delivered",
    });

    console.log("Total delivered orders:", totalDeliveredOrders);

    const orders = await Order.find({
      user: userId,
      shipping_status: "Delivered",
    })
      .populate("user", "firstName lastName email phoneNumber")
      .populate("items", "name price imageUrl description")
      .populate("item_quantities.item_id", "name price image")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    console.log("Delivered Orders Retrieved:", orders.length);
    console.log("Orders Data:", JSON.stringify(orders, null, 2));

    // Return response with orders array (empty if no orders found)
    const message = orders.length > 0 ? "Delivered orders fetched successfully" : "No delivered orders found";

    res.status(200).json({
      success: true,
      totalDeliveredOrders,
      currentPage: page,
      totalPages: Math.ceil(totalDeliveredOrders / limit),
      orders,
      message: message
    });
  } catch (error) {
    console.error("Error fetching delivered orders:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get Return Orders By User
exports.getReturnOrdersByUser = async (req, res) => {
  console.log("Fetching return orders for user...");

  try {
    const userId = req.user._id;
    console.log("User ID:", userId);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalReturnOrders = await Order.countDocuments({
      user: userId,
      "refund.requestDate": { $exists: true },
    });

    console.log("Total return orders:", totalReturnOrders);

    const returnOrders = await Order.find({
      user: userId,
      "refund.requestDate": { $exists: true },
    })
      .populate("user", "firstName lastName email phoneNumber")
      .populate("items", "name price imageUrl description")
      .populate("item_quantities.item_id", "name price image")
      .select("order_status shipping_status total_price refund created_at")
      .sort({ "refund.requestDate": -1 })
      .skip(skip)
      .limit(limit);

    console.log("Return Orders Retrieved:", returnOrders.length);
    console.log("Return Orders Data:", JSON.stringify(returnOrders, null, 2));

    // Return response with return orders array (empty if no orders found)
    const message = returnOrders.length > 0 ? "Return orders fetched successfully" : "No return orders found";

    res.status(200).json({
      success: true,
      totalReturnOrders,
      currentPage: page,
      totalPages: Math.ceil(totalReturnOrders / limit),
      returnOrders,
      message: message
    });
  } catch (error) {
    console.error("Error fetching return orders:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Get Exchange Orders By User
exports.getExchangeOrdersByUser = async (req, res) => {
  console.log("Fetching exchange orders for user...");

  try {
    const userId = req.user._id;
    console.log("User ID:", userId);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalExchangeOrders = await Order.countDocuments({
      user: userId,
      "exchange.requestDate": { $exists: true },
    });

    console.log("Total exchange orders:", totalExchangeOrders);

    const exchangeOrders = await Order.find({
      user: userId,
      "exchange.requestDate": { $exists: true },
    })
      .populate("user", "firstName lastName email phoneNumber")
      .populate("items", "name price imageUrl description")
      .populate("item_quantities.item_id", "name price image")
      .select("order_status shipping_status total_price exchange created_at")
      .sort({ "exchange.requestDate": -1 })
      .skip(skip)
      .limit(limit);

    console.log("Exchange Orders Retrieved:", exchangeOrders.length);
    console.log("Exchange Orders Data:", JSON.stringify(exchangeOrders, null, 2));

    // Return response with exchange orders array (empty if no orders found)
    const message = exchangeOrders.length > 0 ? "Exchange orders fetched successfully" : "No exchange orders found";

    res.status(200).json({
      success: true,
      totalExchangeOrders,
      currentPage: page,
      totalPages: Math.ceil(totalExchangeOrders / limit),
      exchangeOrders,
      message: message
    });
  } catch (error) {
    console.error("Error fetching exchange orders:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Get Order Status Counts
exports.getOrderStatusCounts = async (req, res) => {
  try {
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrdered: {
            $sum: {
              $cond: [{ $ne: ["$order_status", "Cancelled"] }, 1, 0]
            }
          },
          totalDelivered: {
            $sum: {
              $cond: [{ $eq: ["$shipping_status", "Delivered"] }, 1, 0]
            }
          },
          totalCancelled: {
            $sum: {
              $cond: [{ $eq: ["$order_status", "Cancelled"] }, 1, 0]
            }
          },
          totalRefunded: {
            $sum: {
              $cond: [
                { $in: ["$refund.status", ["Processed", "Initiated"]] },
                1,
                0
              ]
            }
          },
          totalExchanged: {
            $sum: {
              $cond: [
                { $in: ["$exchange.status", ["Shipped", "Shiprocket_Shipped"]] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalOrdered: 1,
          totalDelivered: 1,
          totalCancelled: 1,
          totalRefunded: 1,
          totalExchanged: 1
        }
      }
    ]);

    const stats = orderStats.length > 0 ? orderStats[0] : {
      totalOrdered: 0,
      totalDelivered: 0,
      totalCancelled: 0,
      totalRefunded: 0,
      totalExchanged: 0
    };

    console.log("Order Status Counts:", stats);

    res.status(200).json({
      success: true,
      message: "Order status counts retrieved successfully",
      data: stats
    });
  } catch (error) {
    console.error("Error fetching order status counts:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// ============= ADMIN ORDER MANAGEMENT ENDPOINTS =============

// Get all orders for admin with filters and pagination - Enhanced for Frontend Requirements
exports.adminGetAllOrders = async (req, res) => {
  try {
    console.log('🔍 adminGetAllOrders called with query:', req.query);
    
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      shipmentStatus,
      searchQuery,
      dateFrom,
      dateTo,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Build query filters
    if (status) {
      query.order_status = status;
    }
    
    if (paymentStatus) {
      query.payment_status = paymentStatus;
    }
    
    if (shipmentStatus) {
      query.shipping_status = shipmentStatus;
    }
    
    if (searchQuery) {
      // Enhanced search in order fields, customer details, and AWB codes
      query.$or = [
        { razorpay_order_id: { $regex: searchQuery, $options: 'i' } },
        { razorpay_payment_id: { $regex: searchQuery, $options: 'i' } },
        { invoice_no: { $regex: searchQuery, $options: 'i' } },
        { awb_code: { $regex: searchQuery, $options: 'i' } },
        { 'address.firstName': { $regex: searchQuery, $options: 'i' } },
        { 'address.lastName': { $regex: searchQuery, $options: 'i' } },
        { 'address.email': { $regex: searchQuery, $options: 'i' } },
        { 'address.phoneNumber': { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    if (dateFrom || dateTo) {
      query.created_at = {};
      if (dateFrom) query.created_at.$gte = new Date(dateFrom);
      if (dateTo) query.created_at.$lte = new Date(dateTo);
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute queries with enhanced population for admin panel
    const [orders, totalOrders] = await Promise.all([
      Order.find(query)
        .populate('items', 'name price image description sku category subCategory')
        .populate('user', 'name email phNo phoneNumber')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    // Transform orders for admin panel display with complete customer information
    const transformedOrders = orders.map(order => {
      // Calculate customer name from address or user
      const customerName = order.address 
        ? `${order.address.firstName || ''} ${order.address.lastName || ''}`.trim()
        : order.user?.name || 'Guest Customer';

      // Get customer email from address or user
      const customerEmail = order.address?.email || order.user?.email || 'No Email';

      // Get customer phone from address or user
      const customerPhone = order.address?.phoneNumber || order.user?.phNo || order.user?.phoneNumber || 'No Phone';

      // Format shipping address
      const shippingAddress = order.address ? {
        full_name: customerName,
        address_line_1: order.address.address || '',
        address_line_2: order.address.apartment || '',
        city: order.address.city || '',
        state: order.address.state || '',
        postal_code: order.address.pinCode || '',
        country: order.address.country || 'India',
        phone: customerPhone,
        landmark: order.address.landmark || '',
        email: customerEmail
      } : null;

      // Transform items with complete details
      const items = order.item_quantities ? order.item_quantities.map(qty => {
        const item = order.items?.find(i => i._id.toString() === qty.item_id.toString());
        return {
          product_id: qty.item_id,
          name: item?.name || 'Unknown Product',
          description: item?.description || '',
          size: qty.desiredSize || 'N/A',
          sku: qty.sku,
          quantity: qty.quantity,
          unit_price: item?.price || 0,
          total_price: (item?.price || 0) * qty.quantity,
          image_url: item?.image || '',
          category: item?.category || ''
        };
      }) : [];

      // Calculate order totals
      const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);

      return {
        _id: order._id,
        order_number: order.razorpay_order_id || order._id.toString(),
        
        // Customer Information
        customer: {
          user_id: order.user?._id || null,
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        },
        
        // Shipping Address
        shipping_address: shippingAddress,
        
        // Order Items
        items,
        
        // Pricing Information
        pricing: {
          subtotal: subtotal,
          shipping_charges: order.shipping_charges || 0,
          tax_amount: order.tax_amount || 0,
          discount_amount: order.promoDiscount || 0,
          total_amount: order.total_price,
          currency: 'INR'
        },
        
        // Payment Information
        payment: {
          razorpay_order_id: order.razorpay_order_id,
          razorpay_payment_id: order.razorpay_payment_id,
          payment_method: order.payment_method || 'Online',
          amount_paid: order.total_price,
          currency: 'INR',
          payment_status: order.payment_status,
          payment_date: order.payment_verified_at
        },
        
        // Order Status
        order_status: order.order_status,
        shipment_status: order.shipping_status,
        
        // Shipping Information
        courier_partner: order.courier_name || order.courier_partner,
        tracking_number: order.awb_code,
        tracking_url: order.tracking_url,
        estimated_delivery: order.expected_delivery_date,
        
        // Shiprocket Details
        shiprocket_order_id: order.shiprocket_orderId,
        shipment_id: order.shiprocket_shipment_id,
        courier_company_id: order.courier_company_id,
        invoice_no: order.invoice_no,
        
        // Timestamps
        created_at: order.created_at,
        updated_at: order.updated_at || order.created_at,
        
        // Additional Fields for Admin Actions
        can_dispatch: order.payment_status === 'Paid' && 
                     order.shipping_status === 'PENDING' && 
                     order.order_status !== 'Cancelled',
        
        auto_assigned: order.auto_assigned || false
      };
    });

    const totalPages = Math.ceil(totalOrders / limit);

    console.log('✅ adminGetAllOrders success:', {
      ordersCount: transformedOrders.length,
      totalOrders,
      totalPages,
      currentPage: page
    });

    res.status(200).json({
      success: true,
      data: transformedOrders,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_orders: totalOrders,
        items_per_page: parseInt(limit)
      },
      message: transformedOrders.length > 0 ? "Orders retrieved successfully" : "No orders found"
    });
  } catch (error) {
    console.error("❌ Error fetching admin orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    });
  }
};

// Get order statistics for admin dashboard
exports.adminGetOrderStatistics = async (req, res) => {
  try {
    console.log('🔍 adminGetOrderStatistics called');
    
    // First, let's get basic counts to ensure the aggregation works
    const totalOrders = await Order.countDocuments();
    console.log('📊 Total orders in database:', totalOrders);

    if (totalOrders === 0) {
      return res.status(200).json({
        success: true,
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        paidOrders: 0,
        returnRequests: 0,
        exchangeRequests: 0,
        totalRevenue: 0
      });
    }

    // Use safer aggregation with better error handling
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingCount: {
            $sum: { 
              $cond: [
                { $eq: [{ $ifNull: ["$order_status", "Pending"] }, "Pending"] }, 
                1, 
                0
              ] 
            }
          },
          processingCount: {
            $sum: { 
              $cond: [
                { $eq: [{ $ifNull: ["$order_status", ""] }, "Processing"] }, 
                1, 
                0
              ] 
            }
          },
          shippedCount: {
            $sum: { 
              $cond: [
                { $eq: [{ $ifNull: ["$order_status", ""] }, "Shipped"] }, 
                1, 
                0
              ] 
            }
          },
          deliveredCount: {
            $sum: { 
              $cond: [
                { $eq: [{ $ifNull: ["$order_status", ""] }, "Delivered"] }, 
                1, 
                0
              ] 
            }
          },
          cancelledCount: {
            $sum: { 
              $cond: [
                { $eq: [{ $ifNull: ["$order_status", ""] }, "Cancelled"] }, 
                1, 
                0
              ] 
            }
          },
          paidCount: {
            $sum: { 
              $cond: [
                { $eq: [{ $ifNull: ["$payment_status", "Pending"] }, "Paid"] }, 
                1, 
                0
              ] 
            }
          },
          totalRevenue: { 
            $sum: { 
              $cond: [
                { $eq: [{ $ifNull: ["$payment_status", "Pending"] }, "Paid"] },
                { $ifNull: ["$total_price", 0] },
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {};
    
    const statistics = {
      totalOrders: result.totalOrders || 0,
      pendingOrders: result.pendingCount || 0,
      processingOrders: result.processingCount || 0,
      shippedOrders: result.shippedCount || 0,
      deliveredOrders: result.deliveredCount || 0,
      cancelledOrders: result.cancelledCount || 0,
      paidOrders: result.paidCount || 0,
      returnRequests: 0, // We'll handle this separately if needed
      exchangeRequests: 0, // We'll handle this separately if needed
      totalRevenue: result.totalRevenue || 0
    };

    console.log('📊 Order statistics calculated:', statistics);

    res.status(200).json({
      success: true,
      ...statistics
    });
  } catch (error) {
    console.error("❌ Error fetching order statistics:", error);
    console.error('Full error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get order by ID for admin with complete details - Enhanced for Frontend Requirements
exports.adminGetOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('🔍 adminGetOrderById called for orderId:', orderId);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format"
      });
    }

    const order = await Order.findById(orderId)
      .populate('user', 'name email phNo phoneNumber firstName lastName')
      .populate('items', 'name image price description sku category subCategory sizes')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Calculate customer name from address or user
    const customerName = order.address 
      ? `${order.address.firstName || ''} ${order.address.lastName || ''}`.trim()
      : order.user?.name || order.user?.firstName && order.user?.lastName 
        ? `${order.user.firstName} ${order.user.lastName}` 
        : 'Guest Customer';

    // Get customer email from address or user
    const customerEmail = order.address?.email || order.user?.email || 'No Email';

    // Get customer phone from address or user
    const customerPhone = order.address?.phoneNumber || order.user?.phNo || order.user?.phoneNumber || 'No Phone';

    // Transform items with complete details
    const items = order.item_quantities ? order.item_quantities.map(qty => {
      const item = order.items?.find(i => i._id.toString() === qty.item_id.toString());
      return {
        product_id: qty.item_id,
        name: item?.name || 'Unknown Product',
        description: item?.description || '',
        size: qty.desiredSize || 'N/A',
        sku: qty.sku,
        quantity: qty.quantity,
        unit_price: item?.price || 0,
        total_price: (item?.price || 0) * qty.quantity,
        image_url: item?.image || '',
        category: item?.category || '',
        subcategory: item?.subCategory || ''
      };
    }) : [];

    // Calculate order totals
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);

    // Build comprehensive order object for admin panel
    const enhancedOrder = {
      _id: order._id,
      order_number: order.razorpay_order_id || order._id.toString(),
      
      // Customer Information
      customer: {
        user_id: order.user?._id || null,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        created_at: order.user?.createdAt || null
      },
      
      // Shipping Address
      shipping_address: order.address ? {
        full_name: customerName,
        address_line_1: order.address.address || '',
        address_line_2: order.address.apartment || '',
        city: order.address.city || '',
        state: order.address.state || '',
        postal_code: order.address.pinCode || '',
        country: order.address.country || 'India',
        phone: customerPhone,
        landmark: order.address.landmark || '',
        email: customerEmail
      } : null,
      
      // Order Items
      items,
      
      // Pricing Information
      pricing: {
        subtotal: subtotal,
        shipping_charges: order.shipping_charges || 0,
        tax_amount: order.tax_amount || 0,
        discount_amount: order.promoDiscount || 0,
        total_amount: order.total_price,
        currency: 'INR'
      },
      
      // Payment Information
      payment: {
        razorpay_order_id: order.razorpay_order_id,
        razorpay_payment_id: order.razorpay_payment_id,
        razorpay_signature: order.razorpay_signature,
        payment_method: order.payment_method || 'Online',
        amount_paid: order.total_price,
        currency: 'INR',
        payment_status: order.payment_status,
        payment_date: order.payment_verified_at
      },
      
      // Order Status
      order_status: order.order_status,
      shipment_status: order.shipping_status,
      
      // Shipping Information
      courier_partner: order.courier_name || order.courier_partner,
      tracking_number: order.awb_code,
      tracking_url: order.tracking_url,
      estimated_delivery: order.expected_delivery_date,
      
      // Shiprocket Details
      shiprocket_order_id: order.shiprocket_orderId,
      shipment_id: order.shiprocket_shipment_id,
      courier_company_id: order.courier_company_id,
      invoice_no: order.invoice_no,
      freight_charges: order.freight_charges,
      applied_weight: order.applied_weight,
      routing_code: order.routing_code,
      transporter_id: order.transporter_id,
      transporter_name: order.transporter_name,
      
      // Promo Code Information
      promo_code: order.promoCode,
      promo_discount: order.promoDiscount,
      
      // Return/Exchange Information
      refund: order.refund,
      exchange: order.exchange,
      
      // Shipper Information
      shipped_by: order.shipped_by,
      
      // Timestamps
      created_at: order.created_at,
      updated_at: order.updated_at || order.created_at,
      payment_verified_at: order.payment_verified_at,
      shipping_started_at: order.shipping_started_at,
      shipping_completed_at: order.shipping_completed_at,
      shipping_failed_at: order.shipping_failed_at,
      
      // Additional Fields for Admin Actions
      can_dispatch: order.payment_status === 'Paid' && 
                   order.shipping_status === 'PENDING' && 
                   order.order_status !== 'Cancelled',
      
      can_cancel: order.order_status !== 'Cancelled' && 
                  order.shipping_status !== 'Delivered',
      
      can_refund: order.payment_status === 'Paid' && 
                  !order.refund?.refundTransactionId,
      
      auto_assigned: order.auto_assigned || false,
      
      // Shipping Error Details
      shipping_error: order.shipping_error
    };

    console.log('✅ adminGetOrderById success for orderId:', orderId);

    res.status(200).json({
      success: true,
      data: enhancedOrder,
      message: "Order details retrieved successfully"
    });
  } catch (error) {
    console.error("❌ Error fetching admin order by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message
    });
  }
};

// Update order status
exports.adminUpdateOrderStatus = async (req, res) => {
  try {
    console.log("🔧 Admin updateOrderStatus called with:", {
      orderId: req.params.orderId,
      body: req.body,
      user: req.user ? req.user._id : 'No user'
    });

    const { orderId } = req.params;
    const { status, notes, shipping_status } = req.body;

    // Validate required parameters
    if (!status) {
      console.error("❌ Missing status in request body");
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    // Validate and normalize status values
    const validOrderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Accepted'];
    const validShippingStatuses = ['Pending', 'Shipped', 'In Transit', 'Delivered', 'Cancelled'];
    
    // Normalize status to proper case
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const normalizedShippingStatus = shipping_status ? 
      shipping_status.charAt(0).toUpperCase() + shipping_status.slice(1).toLowerCase() : null;
    
    // Special case for "In Transit"
    const finalShippingStatus = normalizedShippingStatus === 'In transit' ? 'In Transit' : normalizedShippingStatus;
    
    if (!validOrderStatuses.includes(normalizedStatus)) {
      console.error("❌ Invalid order status:", status, "normalized:", normalizedStatus);
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validOrderStatuses.join(', ')}`
      });
    }

    if (finalShippingStatus && !validShippingStatuses.includes(finalShippingStatus)) {
      console.error("❌ Invalid shipping status:", shipping_status, "normalized:", finalShippingStatus);
      return res.status(400).json({
        success: false,
        message: `Invalid shipping status. Must be one of: ${validShippingStatuses.join(', ')}`
      });
    }

    console.log("🔍 Finding order with ID:", orderId);
    const order = await Order.findById(orderId).populate('user', 'firstName lastName email').populate('items', 'name price');
    
    if (!order) {
      console.error("❌ Order not found:", orderId);
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    console.log("📦 Current order status:", {
      current_order_status: order.order_status,
      current_shipping_status: order.shipping_status,
      new_order_status: normalizedStatus,
      new_shipping_status: finalShippingStatus
    });

    // Update order status
    order.order_status = normalizedStatus;
    
    // Update shipping status if provided
    if (finalShippingStatus) {
      order.shipping_status = finalShippingStatus;
    }

    await order.save();

    console.log("✅ Order status updated successfully:", {
      orderId: order._id,
      order_status: order.order_status,
      shipping_status: order.shipping_status
    });

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: {
        _id: order._id,
        order_status: order.order_status,
        shipping_status: order.shipping_status,
        payment_status: order.payment_status,
        total_price: order.total_price,
        created_at: order.created_at,
        user: order.user,
        items: order.items
      }
    });
  } catch (error) {
    console.error("❌ Error updating order status:", {
      error: error.message,
      stack: error.stack,
      orderId: req.params.orderId,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message
    });
  }
};

// Accept order
exports.adminAcceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    order.order_status = "Accepted";
    order.acceptedAt = new Date();
    if (notes) {
      order.adminNotes = notes;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order accepted successfully",
      order
    });
  } catch (error) {
    console.error("Error accepting order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept order",
      error: error.message
    });
  }
};

// Reject order
exports.adminRejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    order.order_status = "Rejected";
    order.rejectedAt = new Date();
    order.rejectionReason = reason;
    if (notes) {
      order.adminNotes = notes;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order rejected successfully",
      order
    });
  } catch (error) {
    console.error("Error rejecting order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject order",
      error: error.message
    });
  }
};

// Cancel order with automatic refund and Shiprocket cancellation
exports.adminCancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, notes, force = false } = req.body;

    console.log(`🚫 Admin cancelling order ${orderId}:`, { reason, notes, force });

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if order can be cancelled
    if (!force && ['shipped', 'delivered', 'cancelled'].includes(order.order_status?.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order that is already ${order.order_status}. Use force=true to override.`
      });
    }

    // 1. Cancel Shiprocket shipment if it exists
    if (order.shiprocket_shipment_id && order.shipping_status !== 'CANCELLED') {
      try {
        const token = await getShiprocketToken();
        if (token) {
          const cancelResponse = await fetch(`${SHIPROCKET_API_BASE}/orders/cancel/shipment/${order.shiprocket_shipment_id}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ids: [order.shiprocket_shipment_id]
            })
          });

          const cancelData = await cancelResponse.json();
          console.log(`📦 Shiprocket cancellation result:`, cancelData);

          if (cancelResponse.ok) {
            order.shipping_status = 'CANCELLED';
            order.shipping_cancelled_at = new Date();
          } else {
            console.warn(`⚠️ Failed to cancel Shiprocket shipment:`, cancelData);
          }
        }
      } catch (shipError) {
        console.error("Error cancelling Shiprocket shipment:", shipError);
        // Continue with order cancellation even if Shiprocket fails
      }
    }

    // 2. Process refund if payment was made
    if (order.payment_status === "Paid" && order.razorpay_payment_id) {
      try {
        const refundResponse = await fetch(`https://api.razorpay.com/v1/payments/${order.razorpay_payment_id}/refund`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`,
          },
          body: JSON.stringify({ 
            amount: order.total_price * 100, // Convert to paise
            speed: "optimum",
            notes: {
              reason: reason || "Order cancelled by admin",
              order_id: order._id.toString()
            }
          }),
        });

        const refundData = await refundResponse.json();
        console.log(`💰 Refund result:`, refundData);

        if (refundResponse.ok && refundData.id) {
          order.refund_status = "Initiated";
          order.refund_id = refundData.id;
          order.refund_amount = refundData.amount / 100; // Convert back to rupees
          order.refunded_at = new Date();
        } else {
          console.error(`❌ Refund failed:`, refundData);
          throw new Error(`Refund failed: ${refundData.error?.description || 'Unknown error'}`);
        }
      } catch (refundError) {
        console.error("Error processing refund:", refundError);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to process refund", 
          error: refundError.message 
        });
      }
    }

    // 3. Restore inventory (add items back to stock)
    try {
      for (const entry of order.item_quantities || []) {
        const item = await Item.findById(entry.item_id);
        if (item && item.stock !== undefined) {
          item.stock += entry.quantity;
          await item.save();
          console.log(`📦 Restored ${entry.quantity} units to item ${entry.item_id}`);
        }
      }
    } catch (stockError) {
      console.error("Error restoring inventory:", stockError);
      // Continue with cancellation even if stock restoration fails
    }

    // 4. Update order status
    order.order_status = "Cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
    order.adminCancelled = true;
    if (notes) {
      order.adminNotes = notes;
    }

    await order.save();

    console.log(`✅ Order ${orderId} cancelled successfully`);

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: {
        _id: order._id,
        order_status: order.order_status,
        shipping_status: order.shipping_status,
        refund_status: order.refund_status,
        refund_amount: order.refund_amount,
        cancelledAt: order.cancelledAt,
        cancellationReason: order.cancellationReason
      }
    });
  } catch (error) {
    console.error("❌ Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message
    });
  }
};

// Allot vendor to order
exports.adminAllotVendor = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { vendorId, notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    order.vendorId = vendorId;
    order.vendorAllotted = true;
    order.vendorAllottedAt = new Date();
    if (notes) {
      order.vendorNotes = notes;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Vendor allotted successfully",
      order
    });
  } catch (error) {
    console.error("Error allotting vendor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to allot vendor",
      error: error.message
    });
  }
};

// Update courier status
exports.adminUpdateCourierStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { courierStatus, trackingId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    order.shipping_status = courierStatus;
    if (trackingId) {
      order.trackingId = trackingId;
    }
    order.courierUpdatedAt = new Date();

    await order.save();

    res.status(200).json({
      success: true,
      message: "Courier status updated successfully",
      order
    });
  } catch (error) {
    console.error("Error updating courier status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update courier status",
      error: error.message
    });
  }
};

// Get return requests
exports.adminGetReturnRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      dateFrom,
      dateTo
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { "refund.status": { $exists: true, $ne: null } };

    if (status) {
      query["refund.status"] = status;
    }

    if (dateFrom || dateTo) {
      query["refund.initiatedAt"] = {};
      if (dateFrom) query["refund.initiatedAt"].$gte = new Date(dateFrom);
      if (dateTo) query["refund.initiatedAt"].$lte = new Date(dateTo);
    }

    const [returns, totalReturns] = await Promise.all([
      Order.find(query)
        .populate('items', 'productName image')
        .sort({ "refund.initiatedAt": -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      returns,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReturns / limit),
        totalItems: totalReturns,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching return requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch return requests",
      error: error.message
    });
  }
};

// Process return request
exports.adminProcessReturnRequest = async (req, res) => {
  try {
    const { orderId, returnId } = req.params;
    const { action, reason, notes } = req.body; // action: 'accept' or 'reject'

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (action === 'accept') {
      order.refund.status = "Accepted";
      order.refund.acceptedAt = new Date();
    } else if (action === 'reject') {
      order.refund.status = "Rejected";
      order.refund.rejectedAt = new Date();
      order.refund.rejectionReason = reason;
    }

    if (notes) {
      order.refund.adminNotes = notes;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Return request ${action}ed successfully`,
      order
    });
  } catch (error) {
    console.error("Error processing return request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process return request",
      error: error.message
    });
  }
};

// Get exchange requests
exports.adminGetExchangeRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      dateFrom,
      dateTo
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { "exchange.status": { $exists: true, $ne: null } };

    if (status) {
      query["exchange.status"] = status;
    }

    if (dateFrom || dateTo) {
      query["exchange.initiatedAt"] = {};
      if (dateFrom) query["exchange.initiatedAt"].$gte = new Date(dateFrom);
      if (dateTo) query["exchange.initiatedAt"].$lte = new Date(dateTo);
    }

    const [exchanges, totalExchanges] = await Promise.all([
      Order.find(query)
        .populate('items', 'productName image')
        .sort({ "exchange.initiatedAt": -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      exchanges,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalExchanges / limit),
        totalItems: totalExchanges,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching exchange requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exchange requests",
      error: error.message
    });
  }
};

// Process exchange request
exports.adminProcessExchangeRequest = async (req, res) => {
  try {
    const { orderId, exchangeId } = req.params;
    const { action, reason, notes } = req.body; // action: 'accept' or 'reject'

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (action === 'accept') {
      order.exchange.status = "Accepted";
      order.exchange.acceptedAt = new Date();
    } else if (action === 'reject') {
      order.exchange.status = "Rejected";
      order.exchange.rejectedAt = new Date();
      order.exchange.rejectionReason = reason;
    }

    if (notes) {
      order.exchange.adminNotes = notes;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Exchange request ${action}ed successfully`,
      order
    });
  } catch (error) {
    console.error("Error processing exchange request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process exchange request",
      error: error.message
    });
  }
};

// Get return statistics
exports.adminGetReturnStats = async (req, res) => {
  try {
    const returnStats = await Order.aggregate([
      {
        $match: {
          "refund.status": { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: "$refund.status",
          count: { $sum: 1 },
          totalAmount: { 
            $sum: { 
              $cond: { 
                if: { $ifNull: ["$refund.amount", false] }, 
                then: "$refund.amount", 
                else: "$totalAmount" 
              } 
            } 
          }
        }
      }
    ]);

    const totalReturns = await Order.countDocuments({
      "refund.status": { $exists: true, $ne: null }
    });

    const processedStats = {
      total: totalReturns,
      pending: 0,
      accepted: 0,
      rejected: 0,
      processing: 0,
      completed: 0,
      totalAmount: 0
    };

    returnStats.forEach(stat => {
      const status = stat._id?.toLowerCase() || 'pending';
      processedStats[status] = stat.count;
      processedStats.totalAmount += stat.totalAmount || 0;
    });

    res.status(200).json({
      success: true,
      stats: processedStats
    });
  } catch (error) {
    console.error("Error fetching return stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch return statistics",
      error: error.message
    });
  }
};

// Get exchange statistics
exports.adminGetExchangeStats = async (req, res) => {
  try {
    const exchangeStats = await Order.aggregate([
      {
        $match: {
          "exchange.status": { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: "$exchange.status",
          count: { $sum: 1 },
          totalAmount: { 
            $sum: { 
              $cond: { 
                if: { $ifNull: ["$exchange.amount", false] }, 
                then: "$exchange.amount", 
                else: "$totalAmount" 
              } 
            } 
          }
        }
      }
    ]);

    const totalExchanges = await Order.countDocuments({
      "exchange.status": { $exists: true, $ne: null }
    });

    const processedStats = {
      total: totalExchanges,
      pending: 0,
      accepted: 0,
      rejected: 0,
      processing: 0,
      completed: 0,
      totalAmount: 0
    };

    exchangeStats.forEach(stat => {
      const status = stat._id?.toLowerCase() || 'pending';
      processedStats[status] = stat.count;
      processedStats.totalAmount += stat.totalAmount || 0;
    });

    res.status(200).json({
      success: true,
      stats: processedStats
    });
  } catch (error) {
    console.error("Error fetching exchange stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exchange statistics",
      error: error.message
    });
  }
};

// Get available vendors
exports.adminGetAvailableVendors = async (req, res) => {
  try {
    // For now, return mock vendor data
    // In a real implementation, you would have a Vendor model
    const vendors = [
      { _id: "vendor1", name: "Vendor 1", location: "Delhi", active: true },
      { _id: "vendor2", name: "Vendor 2", location: "Mumbai", active: true },
      { _id: "vendor3", name: "Vendor 3", location: "Bangalore", active: true },
    ];

    res.status(200).json({
      success: true,
      vendors
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendors",
      error: error.message
    });
  }
};

// Bulk update orders
exports.adminBulkUpdateOrders = async (req, res) => {
  try {
    const { orderIds, action, ...data } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order IDs are required"
      });
    }

    let updateData = {};
    
    switch (action) {
      case 'accept':
        updateData = {
          order_status: "Accepted",
          acceptedAt: new Date()
        };
        break;
      case 'reject':
        updateData = {
          order_status: "Rejected",
          rejectedAt: new Date(),
          rejectionReason: data.reason || "Bulk rejection"
        };
        break;
      case 'updateStatus':
        updateData = {
          order_status: data.status,
          lastUpdated: new Date()
        };
        break;
      case 'allotVendor':
        updateData = {
          vendorId: data.vendorId,
          vendorAllotted: true,
          vendorAllottedAt: new Date()
        };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action"
        });
    }

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: updateData }
    );

    res.status(200).json({
      success: true,
      message: `Bulk operation completed. ${result.modifiedCount} orders updated.`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error performing bulk operation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform bulk operation",
      error: error.message
    });
  }
};

// ============= ADMIN SHIPMENT DISPATCH FUNCTIONALITY =============

// Dispatch Order - Enhanced for Frontend Requirements
exports.adminDispatchOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { 
      courier_partner, 
      tracking_number, 
      estimated_delivery_date, 
      dispatch_notes 
    } = req.body;

    console.log('🚀 adminDispatchOrder called:', {
      orderId,
      courier_partner,
      tracking_number,
      estimated_delivery_date
    });

    // Validate required fields
    if (!courier_partner || !tracking_number) {
      return res.status(400).json({
        success: false,
        message: "Courier partner and tracking number are required"
      });
    }

    // Validate estimated delivery date if provided
    if (estimated_delivery_date) {
      const deliveryDate = new Date(estimated_delivery_date);
      if (deliveryDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Estimated delivery date must be in the future"
        });
      }
    }

    // Find the order
    const order = await Order.findById(orderId)
      .populate('user', 'name email phNo phoneNumber')
      .populate('items', 'name price image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Validate order status for dispatch
    if (order.payment_status !== 'Paid') {
      return res.status(400).json({
        success: false,
        message: "Order must be paid before dispatch"
      });
    }

    if (order.order_status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: "Cannot dispatch cancelled order"
      });
    }

    if (order.shipping_status === 'Delivered') {
      return res.status(400).json({
        success: false,
        message: "Order is already delivered"
      });
    }

    // Update order with dispatch information
    const updateData = {
      courier_partner,
      courier_name: courier_partner,
      awb_code: tracking_number,
      tracking_number: tracking_number,
      tracking_url: `https://shiprocket.co/tracking/${tracking_number}`,
      estimated_delivery_date: estimated_delivery_date ? new Date(estimated_delivery_date) : null,
      order_status: 'Shipped',
      shipping_status: 'SHIPPED',
      shipping_started_at: new Date(),
      dispatch_notes: dispatch_notes || ''
    };

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: true }
    ).populate('user', 'name email phNo phoneNumber')
     .populate('items', 'name price image');

    // Send dispatch notification email to customer (if email service is available)
    try {
      const customerEmail = updatedOrder.address?.email || updatedOrder.user?.email;
      const customerName = updatedOrder.address?.firstName || updatedOrder.user?.name || 'Customer';
      
      if (customerEmail) {
        console.log(`📧 Dispatch notification should be sent to: ${customerEmail}`);
        // Here you would integrate with your email service
        // await sendDispatchNotificationEmail(updatedOrder, customerEmail, customerName);
      }
    } catch (emailError) {
      console.warn('⚠️ Failed to send dispatch notification email:', emailError.message);
      // Don't fail the dispatch operation due to email failure
    }

    console.log('✅ Order dispatched successfully:', {
      orderId: updatedOrder._id,
      courier_partner,
      tracking_number,
      order_status: updatedOrder.order_status,
      shipping_status: updatedOrder.shipping_status
    });

    res.status(200).json({
      success: true,
      message: "Order dispatched successfully",
      data: {
        order_id: updatedOrder._id,
        order_number: updatedOrder.razorpay_order_id || updatedOrder._id.toString(),
        courier_partner: updatedOrder.courier_partner,
        tracking_number: updatedOrder.awb_code,
        tracking_url: updatedOrder.tracking_url,
        shipment_status: updatedOrder.shipping_status,
        estimated_delivery: updatedOrder.estimated_delivery_date,
        dispatched_at: updatedOrder.shipping_started_at,
        customer_details: {
          name: updatedOrder.address?.firstName && updatedOrder.address?.lastName
            ? `${updatedOrder.address.firstName} ${updatedOrder.address.lastName}`
            : updatedOrder.user?.name || 'Customer',
          email: updatedOrder.address?.email || updatedOrder.user?.email,
          phone: updatedOrder.address?.phoneNumber || updatedOrder.user?.phNo || updatedOrder.user?.phoneNumber
        }
      }
    });
  } catch (error) {
    console.error("❌ Error dispatching order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to dispatch order",
      error: error.message
    });
  }
};

// Get dispatch form data (courier partners list)
exports.adminGetDispatchOptions = async (req, res) => {
  try {
    const courierPartners = [
      { value: 'BlueDart', label: 'BlueDart' },
      { value: 'DTDC', label: 'DTDC' },
      { value: 'Delhivery', label: 'Delhivery' },
      { value: 'India Post', label: 'India Post' },
      { value: 'FedEx', label: 'FedEx' },
      { value: 'DHL', label: 'DHL' },
      { value: 'Aramex', label: 'Aramex' },
      { value: 'Ecom Express', label: 'Ecom Express' },
      { value: 'XpressBees', label: 'XpressBees' },
      { value: 'Shiprocket', label: 'Shiprocket' }
    ];

    res.status(200).json({
      success: true,
      data: {
        courier_partners: courierPartners
      },
      message: "Dispatch options retrieved successfully"
    });
  } catch (error) {
    console.error("❌ Error fetching dispatch options:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dispatch options",
      error: error.message
    });
  }
};

// Get delivery options and currency info based on user location
exports.getDeliveryOptionsAndCurrency = async (req, res) => {
  try {
    const userId = req.user?._id; // Optional - user may not be authenticated
    const { location, currency, country: queryCountry, cartTotal, cartWeight } = req.query;
    
    // Support both 'location' and 'country' query parameters for flexibility
    let userCountry = location || queryCountry || 'India';
    
    // Try to get country from user's address if not provided and user is authenticated
    if (!userCountry && userId) {
      try {
        const Address = require("../../models/Address");
        const userAddress = await Address.findOne({ userId: userId }).sort({ createdAt: -1 });
        if (userAddress && userAddress.country) {
          userCountry = userAddress.country;
        }
      } catch (addressError) {
        console.log('Could not fetch user address (user may not be authenticated):', addressError.message);
        // Continue with default country
      }
    }
    
    const userCurrency = getCurrencyByCountry(userCountry);
    const isIndia = isIndianLocation(userCountry);
    
    // Get available delivery options
    const deliveryOptions = getDeliveryOptionsByCountry(
      userCountry,
      parseFloat(cartTotal) || 0,
      parseFloat(cartWeight) || 0
    );
    
    // Check free delivery eligibility
    const freeDeliveryInfo = checkFreeDeliveryEligibility(
      userCountry,
      parseFloat(cartTotal) || 0
    );
    
    // Get currency info
    const currencyInfo = {
      country: userCountry,
      currency: userCurrency,
      isIndia: isIndia,
      symbol: userCurrency === 'INR' ? '₹' : '$',
      locale: userCurrency === 'INR' ? 'en-IN' : 'en-US'
    };
    
    res.json({
      success: true,
      data: {
        userLocation: {
          country: userCountry,
          isIndia: isIndia,
          deliveryRegion: isIndia ? 'domestic' : 'international'
        },
        currency: currencyInfo,
        deliveryOptions: deliveryOptions,
        freeDeliveryInfo: freeDeliveryInfo,
        message: isIndia ? 
          'Free delivery available for orders above ₹500 in India' : 
          'International shipping available with tracking'
      }
    });
  } catch (error) {
    console.error('Error getting delivery options:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get delivery options',
      message: error.message 
    });
  }
};

// Convert prices for frontend display
exports.convertPricesForUser = async (req, res) => {
  try {
    const { items, country } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Items must be an array' 
      });
    }
    
    const userCountry = country || 'India';
    const userCurrency = getCurrencyByCountry(userCountry);
    
    // Convert prices to user currency
    const convertedItems = await convertPricesInBulk(items, userCountry);
    
    res.json({
      success: true,
      data: {
        items: convertedItems,
        currency: userCurrency,
        country: userCountry,
        conversionApplied: userCurrency !== 'INR'
      }
    });
  } catch (error) {
    console.error('Error converting prices:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to convert prices',
      message: error.message 
    });
  }
};

// =====================================
// NEW SHIPROCKET API ENDPOINTS
// =====================================

// 1. Create Shiprocket Order
exports.createShiprocketOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { pickupLocationId } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    // Find the order
    const order = await Order.findById(orderId).populate('items');
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if order already has Shiprocket integration
    if (order.shiprocket_orderId) {
      return res.status(400).json({
        success: false,
        error: 'Shiprocket order already exists for this order',
        data: {
          order_id: order.shiprocket_orderId,
          shipment_id: order.shiprocket_shipment_id
        }
      });
    }

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Prepare order data for Shiprocket
    const orderData = {
      order_id: order._id.toString(),
      order_date: order.created_at.toISOString().split('T')[0],
      pickup_location: pickupLocationId || "Primary", 
      channel_id: "",
      comment: "Yoraa E-commerce Order",
      billing_customer_name: order.address.firstName + " " + order.address.lastName,
      billing_last_name: order.address.lastName,
      billing_address: order.address.address,
      billing_city: order.address.city,
      billing_pincode: order.address.pinCode,
      billing_state: order.address.state,
      billing_country: order.address.country,
      billing_email: "customer@yoraa.in",
      billing_phone: order.address.phoneNumber,
      shipping_is_billing: true,
      order_items: order.items.map((item, index) => ({
        name: item.name,
        sku: order.item_quantities[index]?.sku || item._id.toString(),
        units: order.item_quantities[index]?.quantity || 1,
        selling_price: Math.round(item.price),
        discount: "",
        tax: "",
        hsn: item.hsnCode || ""
      })),
      payment_method: "Prepaid",
      sub_total: Math.round(order.total_price),
      length: 10,
      breadth: 10, 
      height: 5,
      weight: 0.5
    };

    // Create order in Shiprocket
    const response = await fetch(`${SHIPROCKET_API_BASE}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    const shiprocketResponse = await response.json();

    if (!response.ok) {
      console.error("Shiprocket Order Creation Failed:", shiprocketResponse);
      return res.status(400).json({
        success: false,
        error: 'Failed to create Shiprocket order',
        message: shiprocketResponse.message || 'Unknown error',
        details: shiprocketResponse
      });
    }

    // Update order with Shiprocket details
    order.shiprocket_orderId = shiprocketResponse.order_id.toString();
    order.shiprocket_shipment_id = shiprocketResponse.shipment_id.toString();
    order.shipping_status = 'PROCESSING';
    await order.save();

    res.json({
      success: true,
      message: "Shiprocket order created successfully",
      data: {
        order_id: shiprocketResponse.order_id,
        shipment_id: shiprocketResponse.shipment_id,
        status: "NEW",
        channel_order_id: order._id.toString(),
        awb: null
      }
    });

  } catch (error) {
    console.error('Error creating Shiprocket order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

// 2. Generate AWB
exports.generateAWB = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { preferredCourier } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if order has Shiprocket shipment ID
    if (!order.shiprocket_shipment_id) {
      return res.status(400).json({
        success: false,
        error: 'No Shiprocket shipment found for this order. Create Shiprocket order first.'
      });
    }

    // Check if AWB already exists
    if (order.awb_code) {
      return res.status(400).json({
        success: false,
        error: 'AWB already generated for this order',
        data: {
          awb_code: order.awb_code,
          courier_name: order.courier_name,
          tracking_url: order.tracking_url
        }
      });
    }

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Generate AWB using existing function
    const awbResult = await generateAWBWithCourier(order.shiprocket_shipment_id, token);

    if (!awbResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to generate AWB',
        message: awbResult.message
      });
    }

    // Update order with AWB details
    order.awb_code = awbResult.awb_code;
    order.courier_company_id = awbResult.courier_company_id;
    order.courier_name = awbResult.courier_name;
    order.tracking_url = awbResult.tracking_url;
    order.shipping_status = 'SHIPPED';
    order.shipping_started_at = new Date();
    await order.save();

    res.json({
      success: true,
      message: "AWB generated successfully",
      data: {
        awb_code: awbResult.awb_code,
        courier_company_id: awbResult.courier_company_id,
        courier_name: awbResult.courier_name,
        tracking_url: awbResult.tracking_url,
        expected_delivery_date: awbResult.expected_delivery_date,
        shipment_id: order.shiprocket_shipment_id
      }
    });

  } catch (error) {
    console.error('Error generating AWB:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

// 3. Track Shipment by Order ID
exports.trackShipmentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if order has AWB code
    if (!order.awb_code) {
      return res.status(400).json({
        success: false,
        error: 'No AWB found for this order. Generate AWB first.'
      });
    }

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Track the shipment using AWB code
    const trackingResponse = await fetch(`${SHIPROCKET_API_BASE}/courier/track/awb/${order.awb_code}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const trackingData = await trackingResponse.json();

    if (!trackingResponse.ok) {
      console.error("Shiprocket Tracking Failed:", trackingData);
      return res.status(400).json({
        success: false,
        error: 'Failed to track shipment',
        message: trackingData.message || 'Tracking service unavailable'
      });
    }

    res.json({
      success: true,
      tracking_data: {
        awb_code: order.awb_code,
        courier_name: order.courier_name,
        current_status: trackingData.tracking_data?.track_status || 'Unknown',
        shipment_track: trackingData.tracking_data?.shipment_track || [],
        expected_delivery: trackingData.tracking_data?.etd || null,
        tracking_url: order.tracking_url
      }
    });

  } catch (error) {
    console.error('Error tracking shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error', 
      message: error.message
    });
  }
};

// 4. Process Return AWB
exports.processReturnAWB = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if return request exists
    if (!order.refund || !order.refund.status) {
      return res.status(400).json({
        success: false,
        error: 'No return request found for this order'
      });
    }

    // Check if return AWB already exists
    if (order.refund.returnAwbCode) {
      return res.status(400).json({
        success: false,
        error: 'Return AWB already generated',
        data: {
          return_awb: order.refund.returnAwbCode,
          tracking_url: order.refund.returnTrackingUrl
        }
      });
    }

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Create return order data
    const returnOrderData = {
      order_id: `RET-${order._id.toString()}`,
      order_date: new Date().toISOString().split('T')[0],
      pickup_customer_name: order.address.firstName + " " + order.address.lastName,
      pickup_last_name: order.address.lastName,
      pickup_address: order.address.address,
      pickup_city: order.address.city,
      pickup_state: order.address.state,
      pickup_country: order.address.country,
      pickup_pincode: order.address.pinCode,
      pickup_email: "customer@yoraa.in",
      pickup_phone: order.address.phoneNumber,
      shipping_customer_name: "Yoraa Warehouse",
      shipping_last_name: "Team",
      shipping_address: "Warehouse Address", // TODO: Add actual warehouse address
      shipping_city: "Bangalore",
      shipping_state: "Karnataka", 
      shipping_country: "India",
      shipping_pincode: "560001",
      shipping_email: SHIPROCKET_EMAIL,
      shipping_phone: "9999999999",
      order_items: [{
        name: "Return Item",
        sku: "RETURN-" + order._id.toString(),
        units: 1,
        selling_price: 1
      }],
      payment_method: "COD",
      sub_total: 1,
      length: 10,
      breadth: 10,
      height: 5,
      weight: 0.5
    };

    // Create return order in Shiprocket
    const response = await fetch(`${SHIPROCKET_API_BASE}/orders/create/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(returnOrderData),
    });

    const returnResponse = await response.json();

    if (!response.ok) {
      console.error("Shiprocket Return Order Creation Failed:", returnResponse);
      return res.status(400).json({
        success: false,
        error: 'Failed to create return order',
        message: returnResponse.message || 'Unknown error'
      });
    }

    // Generate AWB for return shipment
    const awbResult = await generateAWBWithCourier(returnResponse.shipment_id, token);
    
    if (awbResult.success) {
      // Update order with return AWB details
      order.refund.returnAwbCode = awbResult.awb_code;
      order.refund.returnTrackingUrl = awbResult.tracking_url;
      order.refund.shiprocketReturnId = returnResponse.order_id.toString();
      order.refund.returnShipmentId = returnResponse.shipment_id.toString();
      await order.save();
    }

    res.json({
      success: true,
      message: "Return AWB generated successfully",
      data: {
        return_awb: awbResult.success ? awbResult.awb_code : null,
        pickup_scheduled_date: new Date().toISOString().split('T')[0],
        tracking_url: awbResult.success ? awbResult.tracking_url : null
      }
    });

  } catch (error) {
    console.error('Error processing return AWB:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

// 5. Check Serviceability with Fallback
exports.checkServiceability = async (req, res) => {
  try {
    const { pickup_postcode, delivery_postcode, pickupPincode, deliveryPincode, weight } = req.body;
    
    // Support both parameter names for flexibility
    const pickup = pickup_postcode || pickupPincode;
    const delivery = delivery_postcode || deliveryPincode;

    // Validate input
    if (!pickup || !delivery) {
      return res.status(400).json({
        success: false,
        error: 'Both pickup and delivery postcodes are required'
      });
    }

    try {
      // Try to get Shiprocket token and check serviceability
      const token = await getShiprocketToken();
      const serviceabilityResult = await checkCourierServiceability(token, pickup, delivery);

      if (serviceabilityResult.success && serviceabilityResult.couriers?.length > 0) {
        // Format response for frontend
        const formattedCouriers = serviceabilityResult.couriers.map(courier => ({
          courier_company_id: courier.courier_company_id,
          courier_name: courier.courier_name,
          freight_charge: courier.rate,
          cod_charges: courier.cod_charges,
          estimated_delivery_days: courier.estimated_delivery_days
        }));

        return res.json({
          success: true,
          data: {
            available_couriers: formattedCouriers,
            pickup_postcode: pickup,
            delivery_postcode: delivery,
            weight: weight || 0.5,
            source: 'shiprocket'
          }
        });
      }
    } catch (shiprocketError) {
      console.warn('Shiprocket serviceability failed, using fallback:', shiprocketError.message);
    }

    // Fallback: Provide default delivery options based on pincode analysis
    const fallbackOptions = generateFallbackDeliveryOptions(pickup, delivery, weight);
    
    res.json({
      success: true,
      data: {
        available_couriers: fallbackOptions,
        pickup_postcode: pickup,
        delivery_postcode: delivery,
        weight: weight || 0.5,
        source: 'fallback',
        message: 'Using standard delivery options. Shiprocket integration temporarily unavailable.'
      }
    });

  } catch (error) {
    console.error('Error checking serviceability:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during serviceability check',
      message: error.message
    });
  }
};

// Fallback delivery options generator
function generateFallbackDeliveryOptions(pickup, delivery, weight) {
  const baseWeight = parseFloat(weight) || 0.5;
  const isInternational = !isIndianPincode(pickup) || !isIndianPincode(delivery);
  
  if (isInternational) {
    return [
      {
        courier_company_id: 'international_std',
        courier_name: 'International Standard',
        freight_charge: 500 + (baseWeight * 100),
        cod_charges: 0,
        estimated_delivery_days: '7-14'
      },
      {
        courier_company_id: 'international_exp',
        courier_name: 'International Express',
        freight_charge: 800 + (baseWeight * 150),
        cod_charges: 0,
        estimated_delivery_days: '3-7'
      }
    ];
  }
  
  // Domestic options
  return [
    {
      courier_company_id: 'domestic_std',
      courier_name: 'Standard Delivery',
      freight_charge: 50 + (baseWeight * 20),
      cod_charges: 25,
      estimated_delivery_days: '5-7'
    },
    {
      courier_company_id: 'domestic_exp',
      courier_name: 'Express Delivery',
      freight_charge: 100 + (baseWeight * 30),
      cod_charges: 35,
      estimated_delivery_days: '2-4'
    },
    {
      courier_company_id: 'domestic_overnight',
      courier_name: 'Overnight Delivery',
      freight_charge: 200 + (baseWeight * 50),
      cod_charges: 50,
      estimated_delivery_days: '1-2'
    }
  ];
}

// Create Shipment
exports.createShipment = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    // Find the order
    const order = await Order.findById(orderId).populate("items").populate("user");
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if order is accepted
    if (order.order_status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'Order must be accepted before creating shipment'
      });
    }

    // Check if shipment already exists
    if (order.shiprocket_shipment_id) {
      return res.status(400).json({
        success: false,
        error: 'Shipment already exists for this order'
      });
    }

    // Get Shiprocket token
    const token = await getShiprocketToken();
    if (!token) {
      return res.status(500).json({
        success: false,
        error: 'Failed to authenticate with Shiprocket'
      });
    }

    // Calculate shipping dimensions
    const totalWeight = Math.max(
      order.items.reduce((total, item) => total + (item.weight || 0.5), 0),
      0.5
    );
    const maxLength = Math.max(...order.items.map((item) => item.length ?? 0.5), 0.5);
    const maxBreadth = Math.max(...order.items.map((item) => item.breadth ?? 0.5), 0.5);
    const maxHeight = Math.max(...order.items.map((item) => item.height ?? 0.5), 0.5);

    // Create shipment in Shiprocket
    const shipmentResponse = await fetch(`${SHIPROCKET_API_BASE}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_date: new Date().toISOString(),
        pickup_location: "warehouse",
        billing_customer_name: order.address.firstName || "Guest",
        billing_last_name: order.address.lastName || "N/A",
        billing_address: order.address.address,
        billing_city: order.address.city,
        billing_pincode: order.address.pinCode,
        billing_state: order.address.state,
        billing_country: order.address.country || "India",
        billing_email: order.user?.email || "customer@example.com",
        billing_phone: order.user?.phNo || "9999999999",
        shipping_is_billing: true,
        payment_method: "Prepaid",
        sub_total: order.total_price,
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
            selling_price: item ? (item.salePrice || item.price || 0) : 0,
          };
        }),
      }),
    });

    const shipmentData = await shipmentResponse.json();

    if (shipmentData.status_code === 1) {
      // Update order with shipment details
      await Order.findByIdAndUpdate(orderId, {
        shiprocket_shipment_id: shipmentData.shipment_id,
        shiprocket_orderId: shipmentData.order_id
      });

      res.json({
        success: true,
        message: 'Shipment created successfully',
        data: {
          shipment_id: shipmentData.shipment_id,
          order_id: shipmentData.order_id
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to create shipment',
        details: shipmentData
      });
    }

  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get Shipping Label
exports.getShippingLabel = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if order has AWB code
    if (!order.awb_code) {
      return res.status(400).json({
        success: false,
        error: 'No AWB found for this order. Generate AWB first.'
      });
    }

    // Get Shiprocket token
    const token = await getShiprocketToken();
    if (!token) {
      return res.status(500).json({
        success: false,
        error: 'Failed to authenticate with Shiprocket'
      });
    }

    // Get shipping label from Shiprocket
    const labelResponse = await fetch(`${SHIPROCKET_API_BASE}/courier/generate/label`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipment_id: order.shiprocket_shipment_id,
      }),
    });

    const labelData = await labelResponse.json();

    if (labelData.label_created === 1) {
      res.json({
        success: true,
        label_url: labelData.label_url,
        message: 'Label generated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to generate label',
        details: labelData
      });
    }

  } catch (error) {
    console.error('Error getting shipping label:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Helper to check if pincode is Indian
function isIndianPincode(pincode) {
  const pin = pincode?.toString().trim();
  return pin && /^[1-9][0-9]{5}$/.test(pin);
}

// 5. Get Available Couriers for Shipment
exports.getAvailableCouriers = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    // Find the order
    const order = await Order.findById(orderId).populate("items").populate("user");
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Get Shiprocket token
    const token = await getShiprocketToken();
    if (!token) {
      return res.status(500).json({
        success: false,
        error: 'Failed to authenticate with Shiprocket'
      });
    }

    // Calculate shipping dimensions and weight
    const totalWeight = Math.max(
      order.items.reduce((total, item) => total + (item.weight || 0.5), 0),
      0.5
    );

    // Get serviceability check
    const serviceabilityResponse = await fetch(`${SHIPROCKET_API_BASE}/courier/serviceability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        pickup_postcode: process.env.WAREHOUSE_PINCODE || "110001",
        delivery_postcode: order.address.pinCode,
        weight: totalWeight,
        cod: order.payment_method === 'COD' ? 1 : 0,
        declared_value: order.total_price || order.total_amount || 0
      })
    });

    const serviceabilityData = await serviceabilityResponse.json();

    if (serviceabilityData.status === 200) {
      res.json({
        success: true,
        couriers: serviceabilityData.data.available_courier_companies || [],
        message: 'Available couriers fetched successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to get available couriers',
        details: serviceabilityData
      });
    }

  } catch (error) {
    console.error('Error getting available couriers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// 6. Check Shipping Rates
exports.getShippingRates = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    // Find the order
    const order = await Order.findById(orderId).populate("items");
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Calculate shipping dimensions and weight
    const totalWeight = Math.max(
      order.items.reduce((total, item) => total + (item.weight || 0.5), 0),
      0.5
    );

    // Get shipping rates
    const ratesResponse = await fetch(`${SHIPROCKET_API_BASE}/courier/serviceability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        pickup_postcode: process.env.WAREHOUSE_PINCODE || "110001",
        delivery_postcode: order.address.pinCode,
        weight: totalWeight,
        cod: order.payment_method === 'COD' ? 1 : 0,
        declared_value: order.total_price || order.total_amount || 0
      })
    });

    const ratesData = await ratesResponse.json();

    if (ratesData.status === 200) {
      res.json({
        success: true,
        rates: ratesData.data.available_courier_companies?.map(courier => ({
          courier_company_id: courier.courier_company_id,
          courier_name: courier.courier_name,
          freight_charge: courier.freight_charge,
          cod_charges: courier.cod_charges,
          other_charges: courier.other_charges,
          total_charge: courier.rate,
          estimated_delivery_days: courier.estimated_delivery_days,
          etd: courier.etd
        })) || [],
        message: 'Shipping rates fetched successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to get shipping rates',
        details: ratesData
      });
    }

  } catch (error) {
    console.error('Error getting shipping rates:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// 7. Get Pickup Locations
exports.getPickupLocations = async (req, res) => {
  try {
    // Get Shiprocket token
    const token = await getShiprocketToken();
    if (!token) {
      return res.status(500).json({
        success: false,
        error: 'Failed to authenticate with Shiprocket'
      });
    }

    // Get pickup locations
    const pickupResponse = await fetch(`${SHIPROCKET_API_BASE}/settings/company/pickup`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    });

    const pickupData = await pickupResponse.json();

    if (pickupData.status === 200) {
      res.json({
        success: true,
        pickup_locations: pickupData.data?.shipping_address || [],
        message: 'Pickup locations fetched successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to get pickup locations',
        details: pickupData
      });
    }

  } catch (error) {
    console.error('Error getting pickup locations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// 8. Cancel Shipment
exports.cancelShipment = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if order has Shiprocket shipment ID
    if (!order.shiprocket_shipment_id) {
      return res.status(400).json({
        success: false,
        error: 'No Shiprocket shipment found for this order'
      });
    }

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Cancel the shipment
    const cancelResponse = await fetch(`${SHIPROCKET_API_BASE}/orders/cancel/shipment/${order.shiprocket_shipment_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    });

    const cancelData = await cancelResponse.json();

    if (cancelData.status_code === 200) {
      // Update order status
      await Order.findByIdAndUpdate(orderId, {
        shipping_status: 'CANCELLED',
        shiprocket_shipment_id: null,
        awb_code: null,
        courier_name: null,
        tracking_url: null
      });

      res.json({
        success: true,
        message: 'Shipment cancelled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to cancel shipment',
        details: cancelData
      });
    }

  } catch (error) {
    console.error('Error cancelling shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// 9. Assign Specific Courier to Order
exports.assignCourierToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { courier_company_id, courier_name } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    if (!courier_company_id) {
      return res.status(400).json({
        success: false,
        error: 'Courier company ID is required'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if order has Shiprocket shipment ID
    if (!order.shiprocket_shipment_id) {
      return res.status(400).json({
        success: false,
        error: 'Create shipment first before assigning courier'
      });
    }

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Assign AWB with specific courier
    const awbResponse = await fetch(`${SHIPROCKET_API_BASE}/courier/assign/awb`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipment_id: order.shiprocket_shipment_id,
        courier_id: courier_company_id
      })
    });

    const awbData = await awbResponse.json();

    if (awbData.status_code === 1) {
      // Update order with courier and AWB details
      await Order.findByIdAndUpdate(orderId, {
        courier_company_id: courier_company_id,
        courier_name: courier_name || awbData.courier_name,
        awb_code: awbData.awb_code,
        tracking_url: awbData.tracking_url,
        expected_delivery_date: awbData.expected_delivery_date,
        shipping_status: 'AWB_ASSIGNED'
      });

      res.json({
        success: true,
        message: 'Courier assigned successfully',
        data: {
          courier_company_id: courier_company_id,
          courier_name: courier_name || awbData.courier_name,
          awb_code: awbData.awb_code,
          tracking_url: awbData.tracking_url,
          expected_delivery_date: awbData.expected_delivery_date
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to assign courier',
        details: awbData
      });
    }

  } catch (error) {
    console.error('Error assigning courier:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// 10. Bulk Order Operations
exports.bulkCreateShipments = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of order IDs'
      });
    }

    const results = [];
    const errors = [];

    for (const orderId of orderIds) {
      try {
        // Use the existing createShipment logic
        const mockReq = { params: { orderId } };
        const mockRes = {
          json: (data) => data,
          status: (code) => ({ json: (data) => ({ ...data, statusCode: code }) })
        };

        await exports.createShipment(mockReq, mockRes);
        results.push({ orderId, status: 'success' });
      } catch (error) {
        errors.push({ orderId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Processed ${orderIds.length} orders`,
      results: {
        successful: results,
        failed: errors
      }
    });

  } catch (error) {
    console.error('Error in bulk shipment creation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get Shiprocket wallet balance
exports.getShiprocketWalletBalance = async (req, res) => {
  try {
    console.log('🔵 Getting Shiprocket wallet balance...');
    
    // Get Shiprocket authentication token
    const token = await getShiprocketToken();
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Failed to authenticate with Shiprocket'
      });
    }

    // Get wallet balance using the existing function
    const balanceResult = await checkShiprocketWalletBalance(token);
    
    if (balanceResult.success) {
      console.log('🟢 Wallet balance retrieved successfully:', balanceResult.balance);
      
      // Prepare response data
      const responseData = {
        balance: balanceResult.balance,
        currency: 'INR',
        status: 'active',
        last_updated: new Date().toISOString()
      };

      // Add additional info if it's mock data
      if (balanceResult.mock) {
        responseData.plan = 'Lite Plan';
        responseData.note = balanceResult.note || 'Wallet balance API not available for Lite plan';
        responseData.mock = true;
        responseData.message = 'Showing mock balance - Upgrade to access real wallet balance';
      }

      return res.status(200).json({
        success: true,
        data: responseData,
        message: balanceResult.mock ? 'Mock wallet balance (API not available)' : 'Wallet balance retrieved successfully'
      });
    } else {
      console.log('🔴 Failed to get wallet balance:', balanceResult.message);
      return res.status(400).json({
        success: false,
        message: balanceResult.message,
        error: balanceResult.error
      });
    }
  } catch (error) {
    console.error('🔴 Error getting Shiprocket wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};