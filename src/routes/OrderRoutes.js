// Import required dependencies
const express = require("express"); // Express framework for routing
const {
  getOrdersByUser,
  getOrderById,
  cancelOrder,
  getExchangeOrdersByUser,
  createReturnOrder,
  getReturnOrdersByUser,
  createExchangeOrder,
  getDeliveredOrdersByUser,
  getAllOrdersSorted,
  authenticateShiprocket,
  getShiprocketTracking,
  getOrderStatusCounts,
  getDeliveryOptionsAndCurrency,
  convertPricesForUser,
  // New Shiprocket API endpoints
  createShiprocketOrder,
  generateAWB,
  trackShipmentByOrderId,
  processReturnAWB,
  checkServiceability,
} = require("../controllers/paymentController/OrderController"); // Controller for order-related logic
const { verifyToken } = require("../middleware/VerifyToken"); // Middleware to verify JWT tokens
const { cartPricingMiddleware } = require("../middleware/locationPricingMiddleware"); // Location-based pricing middleware
const multer = require("multer"); // Middleware for handling file uploads

// Initialize an Express router instance
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory (not on disk) for direct upload to S3
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit each file to 10MB
}).array("images", 3); // Handle up to 3 files in the 'images' field

// Define order-related API endpoints
router
  // GET /api/orders/getAllByUser
  // Retrieves all orders for the authenticated user (with currency conversion)
  .get("/getAllByUser", verifyToken, cartPricingMiddleware, getOrdersByUser)

  // GET /api/orders/user
  // Retrieves all orders for the authenticated user (frontend compatibility route)
  .get("/user", verifyToken, cartPricingMiddleware, getOrdersByUser)

  // GET /api/orders/delivery-options
  // Get delivery options and currency info based on user location (PUBLIC - no auth required)
  // IMPORTANT: This route MUST be before /:orderId to prevent path conflicts
  .get("/delivery-options", getDeliveryOptionsAndCurrency)

  // GET /api/orders/:orderId
  // Retrieves a specific order by ID for the authenticated user (with currency conversion)
  .get("/:orderId", verifyToken, cartPricingMiddleware, getOrderById)

  // POST /api/orders/cancel/:order_id
  // Cancels a specific order by its ID (no file upload required)
  .post("/cancel/:order_id", cancelOrder)

  // GET /api/orders/getAllOrder
  // Retrieves all orders, sorted (likely for admin use, authenticated)
  .get("/getAllOrder", verifyToken, cartPricingMiddleware, getAllOrdersSorted)

  // POST /api/orders/shiprocket/auth
  // Authenticates with Shiprocket API (no file upload required)
  .post("/shiprocket/auth", authenticateShiprocket)

  // GET /api/orders/shiprocket/track/:awbCode
  // Retrieves tracking information from Shiprocket by AWB code (no file upload)
  .get("/shiprocket/track/:awbCode", getShiprocketTracking)

  // GET /api/orders/delivered
  // Retrieves delivered orders for the authenticated user
  .get("/delivered", verifyToken, getDeliveredOrdersByUser)

  // GET /api/orders/exchange-orders
  // Retrieves exchange orders for the authenticated user
  .get("/exchange-orders", verifyToken, getExchangeOrdersByUser)

  // GET /api/orders/return-orders
  // Retrieves return orders for the authenticated user
  .get("/return-orders", verifyToken, getReturnOrdersByUser)

  // GET /api/orders/status-counts
  // Retrieves counts of orders by status (e.g., pending, delivered) for the authenticated user
  .get("/status-counts", verifyToken, getOrderStatusCounts)

  // POST /api/orders/exchange
  // Creates an exchange order with optional image uploads (up to 3 images)
  .post("/exchange", verifyToken, upload, createExchangeOrder)

  // POST /api/orders/return
  // Creates a return order with optional image uploads (up to 3 images)
  .post("/return", verifyToken, upload, createReturnOrder)

  // POST /api/orders/convert-prices
  // Convert prices to user's currency for display
  .post("/convert-prices", convertPricesForUser)

  // =====================================
  // NEW SHIPROCKET API ENDPOINTS
  // =====================================

  // POST /api/orders/create-shiprocket-order/:orderId
  // Creates a new shipment in Shiprocket for the given order
  .post("/create-shiprocket-order/:orderId", verifyToken, createShiprocketOrder)

  // POST /api/orders/generate-awb/:orderId
  // Generates AWB for an existing Shiprocket shipment
  .post("/generate-awb/:orderId", verifyToken, generateAWB)

  // GET /api/orders/track-shipment/:orderId
  // Tracks shipment status using the order's AWB code
  .get("/track-shipment/:orderId", verifyToken, trackShipmentByOrderId)

  // POST /api/orders/process-return-awb/:orderId
  // Processes return AWB generation for return requests
  .post("/process-return-awb/:orderId", verifyToken, processReturnAWB)

  // POST /api/orders/check-serviceability
  // Checks courier serviceability between pickup and delivery pincodes
  .post("/check-serviceability", checkServiceability);

// =====================================
// 🆕 ENHANCED ADMIN ORDER ROUTES - Complete order management for admin panel
// =====================================

const Order = require("../models/Order");
const mongoose = require('mongoose');

// 📊 Get All Orders with Complete Information (Enhanced Admin Panel)
router.get("/admin/orders/enhanced", verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      shippingStatus,
      dateFrom,
      dateTo,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    // Build filter conditions
    const filterConditions = {};
    
    if (status) filterConditions.order_status = status;
    if (paymentStatus) filterConditions.payment_status = paymentStatus;
    if (shippingStatus) filterConditions.shipping_status = shippingStatus;
    
    if (dateFrom || dateTo) {
      filterConditions.created_at = {};
      if (dateFrom) filterConditions.created_at.$gte = new Date(dateFrom);
      if (dateTo) filterConditions.created_at.$lte = new Date(dateTo);
    }
    
    if (search) {
      filterConditions.$or = [
        { "address.firstName": { $regex: search, $options: "i" } },
        { "address.lastName": { $regex: search, $options: "i" } },
        { "address.email": { $regex: search, $options: "i" } },
        { "address.phoneNumber": { $regex: search, $options: "i" } },
        { "orderMetadata.orderId": { $regex: search, $options: "i" } },
        { "orderMetadata.orderNumber": { $regex: search, $options: "i" } },
        { awb_code: { $regex: search, $options: "i" } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders with complete population
    const orders = await Order.find(filterConditions)
      .populate({
        path: "items", 
        select: "productName price salePrice images category"
      })
      .populate({
        path: "user",
        select: "firstName lastName email phNo"
      })
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filterConditions);

    // 🆕 ENHANCED ORDER RESPONSE - Complete information for admin panel
    const enhancedOrders = orders.map(order => ({
      // Basic Order Information
      _id: order._id,
      orderId: order.orderMetadata?.orderId || order._id,
      orderNumber: order.orderMetadata?.orderNumber || `YRA${order._id.toString().slice(-6)}`,
      
      // Customer Information (Complete)
      customer: {
        name: `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim(),
        email: order.address?.email || order.user?.email,
        phone: order.address?.phoneNumber || order.user?.phNo,
        isGuest: order.customer?.isGuest || false,
        userId: order.user?._id || order.customer?.user_id
      },
      
      // Shipping Address (Complete)
      shippingAddress: {
        name: `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim(),
        address: order.address?.address,
        apartment: order.address?.apartment,
        landmark: order.address?.landmark,
        city: order.address?.city,
        state: order.address?.state,
        pinCode: order.address?.pinCode,
        country: order.address?.country || 'India',
        phone: order.address?.phoneNumber,
        email: order.address?.email
      },
      
      // Product Details (Complete)
      items: order.items?.map((item, index) => {
        const itemQuantity = order.item_quantities?.[index] || {};
        return {
          id: item._id,
          name: item.productName,
          size: itemQuantity.size,
          quantity: itemQuantity.quantity,
          unitPrice: itemQuantity.price,
          totalPrice: itemQuantity.price * itemQuantity.quantity,
          sku: itemQuantity.sku,
          isOnSale: itemQuantity.is_on_sale,
          savings: itemQuantity.savings || 0,
          discountPercentage: itemQuantity.discount_percentage || 0,
          image: item.images?.[0] || null,
          category: item.category
        };
      }) || [],
      
      // Order Summary (Complete Financial Information)
      orderSummary: {
        subtotal: order.orderSummary?.subtotal || order.cart_calculation?.subtotal || 0,
        shippingCharges: order.orderSummary?.shippingCharges || 0,
        taxAmount: order.orderSummary?.taxAmount || order.cart_calculation?.tax_amount || 0,
        discountAmount: order.orderSummary?.discountAmount || order.cart_calculation?.total_savings || 0,
        totalAmount: order.orderSummary?.totalAmount || order.total_price,
        freeDeliveryApplied: order.orderSummary?.freeDeliveryApplied || false,
        currency: order.orderSummary?.currency || "INR",
        couponCode: order.orderSummary?.couponCode,
        couponDiscount: order.orderSummary?.couponDiscount || 0
      },
      
      // Payment Information (Complete)
      payment: {
        razorpayOrderId: order.razorpay_order_id,
        razorpayPaymentId: order.razorpay_payment_id || order.paymentDetails?.razorpayPaymentId,
        paymentMethod: order.paymentDetails?.paymentMethod || order.payment_method || "Online",
        paymentStatus: order.payment_status,
        amountPaid: order.paymentDetails?.amountPaid || order.total_price,
        paymentDate: order.paymentDetails?.paymentDate || order.payment_verified_at,
        gatewayFee: order.paymentDetails?.gatewayFee || 0,
        bankReference: order.paymentDetails?.bankReference
      },
      
      // Shipping Information (Complete)
      shipping: {
        status: order.shipping_status || 'PENDING',
        shiprocketOrderId: order.shiprocket_orderId,
        shiprocketShipmentId: order.shiprocket_shipment_id,
        awbCode: order.awb_code,
        trackingUrl: order.tracking_url,
        courierName: order.courier_name,
        courierCompanyId: order.courier_company_id,
        expectedDeliveryDate: order.expected_delivery_date,
        shippingStartedAt: order.shipping_started_at,
        shippingCompletedAt: order.shipping_completed_at,
        shippingError: order.shipping_error,
        autoAssigned: order.auto_assigned || false
      },
      
      // Order Status & Metadata
      status: {
        orderStatus: order.orderMetadata?.orderStatus || order.order_status || 'pending',
        paymentStatus: order.orderMetadata?.paymentStatus || order.payment_status || 'pending',
        fulfillmentStatus: order.orderMetadata?.fulfillmentStatus || 'pending',
        priority: order.orderMetadata?.priority || 'normal'
      },
      
      // Timestamps
      timestamps: {
        createdAt: order.created_at,
        confirmedAt: order.orderMetadata?.confirmedAt || order.payment_verified_at,
        updatedAt: order.updated_at,
        estimatedDelivery: order.orderMetadata?.estimatedDelivery
      },
      
      // Additional Information
      notes: {
        orderNotes: order.orderMetadata?.orderNotes,
        internalNotes: order.orderMetadata?.internalNotes
      },
      
      // System Information
      system: {
        source: order.orderMetadata?.source || 'web_app',
        platform: order.orderMetadata?.deviceInfo?.platform || 'unknown',
        ipAddress: order.orderMetadata?.ipAddress,
        sessionId: order.orderMetadata?.sessionId
      }
    }));

    // Response with complete pagination information
    res.json({
      success: true,
      data: {
        orders: enhancedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / parseInt(limit)),
          totalOrders: totalOrders,
          hasNextPage: skip + parseInt(limit) < totalOrders,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        },
        filters: {
          status,
          paymentStatus,
          shippingStatus,
          dateFrom,
          dateTo,
          search
        },
        summary: {
          totalRevenue: enhancedOrders.reduce((sum, order) => sum + (order.orderSummary.totalAmount || 0), 0),
          averageOrderValue: enhancedOrders.length > 0 ? 
            enhancedOrders.reduce((sum, order) => sum + (order.orderSummary.totalAmount || 0), 0) / enhancedOrders.length : 0,
          totalItemsSold: enhancedOrders.reduce((sum, order) => 
            sum + (order.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0), 0
          )
        }
      }
    });

  } catch (error) {
    console.error("Error fetching enhanced orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    });
  }
});

// 📋 Get Single Order with Complete Details
router.get("/admin/orders/:orderId/enhanced", verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format"
      });
    }

    const order = await Order.findById(orderId)
      .populate({
        path: "items",
        select: "productName price salePrice images category description brand material weight dimensions"
      })
      .populate({
        path: "user",
        select: "firstName lastName email phNo registrationDate"
      })
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // 🆕 COMPLETE ORDER DETAILS RESPONSE
    const completeOrderDetails = {
      // Basic Information
      orderId: order._id,
      orderNumber: order.orderMetadata?.orderNumber || `YRA${order._id.toString().slice(-6)}`,
      internalOrderId: order.orderMetadata?.orderId,
      
      // Customer Information (Complete)
      customer: {
        userId: order.user?._id,
        name: `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim(),
        firstName: order.address?.firstName,
        lastName: order.address?.lastName,
        email: order.address?.email || order.user?.email,
        phone: order.address?.phoneNumber || order.user?.phNo,
        isGuest: order.customer?.isGuest || false,
        registrationDate: order.user?.registrationDate,
        totalOrders: order.customer?.totalOrders || 0
      },
      
      // Shipping Address (Complete with validation)
      shippingAddress: {
        firstName: order.address?.firstName,
        lastName: order.address?.lastName,
        fullName: `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim(),
        email: order.address?.email,
        phone: order.address?.phoneNumber,
        addressLine1: order.address?.address,
        addressLine2: order.address?.apartment,
        city: order.address?.city,
        state: order.address?.state,
        country: order.address?.country || 'India',
        pinCode: order.address?.pinCode,
        landmark: order.address?.landmark,
        addressType: 'HOME' // Default
      },
      
      // Product Details (Complete with specifications)
      cartItems: order.items?.map((item, index) => {
        const itemQuantity = order.item_quantities?.[index] || {};
        return {
          id: item._id,
          name: item.productName,
          description: item.description,
          size: itemQuantity.size,
          quantity: itemQuantity.quantity,
          sku: itemQuantity.sku,
          weight: item.weight || 200, // Default 200g
          dimensions: item.dimensions || { length: 30, width: 25, height: 2 },
          pricing: {
            regularPrice: itemQuantity.original_price || item.price,
            salePrice: itemQuantity.sale_price,
            priceAtOrder: itemQuantity.price,
            discount: itemQuantity.savings || 0,
            discountPercentage: itemQuantity.discount_percentage || 0
          },
          unitPrice: itemQuantity.price,
          totalPrice: itemQuantity.price * itemQuantity.quantity,
          imageUrl: item.images?.[0],
          brand: item.brand || "Yoraa",
          material: item.material,
          category: item.category,
          isOnSale: itemQuantity.is_on_sale || false
        };
      }) || [],
      
      // Order Summary (Complete Financial Breakdown)
      orderSummary: {
        subtotal: order.orderSummary?.subtotal || order.cart_calculation?.subtotal || 0,
        shippingCharges: order.orderSummary?.shippingCharges || 0,
        taxAmount: order.orderSummary?.taxAmount || 0,
        discountAmount: order.orderSummary?.discountAmount || 0,
        couponCode: order.orderSummary?.couponCode,
        couponDiscount: order.orderSummary?.couponDiscount || 0,
        totalAmount: order.orderSummary?.totalAmount || order.total_price,
        currency: "INR",
        freeDeliveryApplied: order.orderSummary?.freeDeliveryApplied || false,
        shippingThreshold: order.orderSummary?.shippingThreshold || 500,
        taxBreakdown: order.orderSummary?.taxBreakdown || {
          cgst: (order.orderSummary?.taxAmount || 0) / 2,
          sgst: (order.orderSummary?.taxAmount || 0) / 2,
          igst: 0
        }
      },
      
      // Payment Information (Complete)
      paymentDetails: {
        razorpayOrderId: order.razorpay_order_id,
        razorpayPaymentId: order.razorpay_payment_id || order.paymentDetails?.razorpayPaymentId,
        razorpaySignature: order.razorpay_signature,
        paymentMethod: order.paymentDetails?.paymentMethod || order.payment_method || "card",
        paymentStatus: order.payment_status,
        amountPaid: order.paymentDetails?.amountPaid || order.total_price,
        currency: "INR",
        paymentDate: order.paymentDetails?.paymentDate || order.payment_verified_at,
        gatewayFee: order.paymentDetails?.gatewayFee || 0,
        netAmount: order.paymentDetails?.netAmount || order.total_price,
        cardDetails: order.paymentDetails?.cardDetails || {},
        bankReference: order.paymentDetails?.bankReference || order.razorpay_payment_id
      },
      
      // Order Metadata (Complete)
      orderMetadata: {
        orderId: order.orderMetadata?.orderId,
        orderNumber: order.orderMetadata?.orderNumber,
        orderStatus: order.orderMetadata?.orderStatus || order.order_status || 'pending',
        paymentStatus: order.orderMetadata?.paymentStatus || order.payment_status || 'pending',
        fulfillmentStatus: order.orderMetadata?.fulfillmentStatus || 'pending',
        source: order.orderMetadata?.source || 'web_app',
        deviceInfo: order.orderMetadata?.deviceInfo || {},
        orderNotes: order.orderMetadata?.orderNotes,
        internalNotes: order.orderMetadata?.internalNotes,
        tags: order.orderMetadata?.tags || [],
        priority: order.orderMetadata?.priority || 'normal',
        estimatedDelivery: order.orderMetadata?.estimatedDelivery,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        confirmedAt: order.orderMetadata?.confirmedAt || order.payment_verified_at,
        userId: order.user?._id,
        sessionId: order.orderMetadata?.sessionId,
        ipAddress: order.orderMetadata?.ipAddress
      },
      
      // Shiprocket Integration Data (Complete)
      shiprocketData: order.shiprocketData || {
        orderDetails: {
          order_id: order.orderMetadata?.orderId || order._id,
          shiprocket_order_id: order.shiprocket_orderId,
          shipment_id: order.shiprocket_shipment_id,
          awb_code: order.awb_code,
          courier_name: order.courier_name,
          courier_company_id: order.courier_company_id,
          tracking_url: order.tracking_url,
          shipping_status: order.shipping_status,
          expected_delivery_date: order.expected_delivery_date,
          freight_charges: order.freight_charges,
          applied_weight: order.applied_weight
        }
      },
      
      // System Information
      system: {
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        paymentVerifiedAt: order.payment_verified_at,
        shippingStartedAt: order.shipping_started_at,
        shippingCompletedAt: order.shipping_completed_at,
        shippingFailedAt: order.shipping_failed_at,
        shippingError: order.shipping_error,
        autoAssigned: order.auto_assigned || false
      }
    };

    res.json({
      success: true,
      data: completeOrderDetails
    });

  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message
    });
  }
});

// Export the router for use in the main Express app
module.exports = router;