// Import required dependencies
const express = require("express");
const {
  // Admin Order Management
  adminGetAllOrders,
  adminGetOrderById,
  adminUpdateOrderStatus,
  adminAcceptOrder,
  adminRejectOrder,
  adminCancelOrder,
  adminGetOrderStatistics,
  adminBulkUpdateOrders,
  
  // Vendor Management
  adminGetAvailableVendors,
  adminAllotVendor,
  
  // Courier Management
  adminUpdateCourierStatus,
  
  // Return Management
  adminGetReturnRequests,
  adminProcessReturnRequest,
  adminGetReturnStats,
  
  // Exchange Management
  adminGetExchangeRequests,
  adminProcessExchangeRequest,
  adminGetExchangeStats,

  // Shiprocket Integration
  createShiprocketOrder,
  generateAWB,
  trackShipmentByOrderId,
  createShipment,
  getShippingLabel,
  getAvailableCouriers,
  getShippingRates,
  getPickupLocations,
  cancelShipment,
  assignCourierToOrder,
  bulkCreateShipments,
  getShiprocketWalletBalance,
  
  // Admin Dispatch Management - New
  adminDispatchOrder,
  adminGetDispatchOptions
} = require("../controllers/paymentController/OrderController");

const { verifyToken } = require("../middleware/VerifyToken");
const multer = require("multer");

// Initialize an Express router instance
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).array("images", 3);

// ===== ADMIN ORDER MANAGEMENT ROUTES =====

// GET /api/admin/orders - Get all orders with filters
router.get("/orders", verifyToken, adminGetAllOrders);

// GET /api/admin/orders/statistics - Get order statistics
router.get("/orders/statistics", verifyToken, adminGetOrderStatistics);

// GET /api/admin/orders/status-options - Get available status options (removed - function doesn't exist)
// router.get("/orders/status-options", verifyToken, getStatusOptions);

// GET /api/admin/delivery-options/:country - Test delivery options for a country
router.get("/delivery-options/:country", (req, res) => {
  const { calculateShippingCost, getDeliveryOptionsByCountry, checkFreeDeliveryEligibility } = require("../utils/deliveryUtils");
  const { country } = req.params;
  const { cartTotal = 0, cartWeight = 1 } = req.query;
  
  try {
    const deliveryOptions = getDeliveryOptionsByCountry(country, parseFloat(cartTotal), parseFloat(cartWeight));
    const freeDeliveryCheck = checkFreeDeliveryEligibility(country, parseFloat(cartTotal));
    
    res.json({
      success: true,
      country,
      cartTotal: parseFloat(cartTotal),
      cartWeight: parseFloat(cartWeight),
      deliveryOptions,
      freeDeliveryEligibility: freeDeliveryCheck
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/orders/shiprocket-stats - Get Shiprocket statistics

// GET /api/admin/orders/shipping-status-options - Get available shipping status options
router.get("/orders/shipping-status-options", verifyToken, (req, res) => {
  res.json({
    success: true,
    shippingStatusOptions: ['PENDING', 'PROCESSING', 'SHIPPED', 'RETRYING', 'FAILED', 'AWB_FAILED', 'In Transit', 'Delivered', 'Cancelled']
  });
});

// GET /api/admin/orders/:orderId - Get single order by ID
router.get("/orders/:orderId", verifyToken, adminGetOrderById);

// PUT /api/admin/orders/:orderId/status - Update order status
router.put("/orders/:orderId/status", verifyToken, adminUpdateOrderStatus);

// PUT /api/admin/orders/:orderId/accept - Accept order
router.put("/orders/:orderId/accept", verifyToken, adminAcceptOrder);

// PUT /api/admin/orders/:orderId/reject - Reject order
router.put("/orders/:orderId/reject", verifyToken, adminRejectOrder);

// PUT /api/admin/orders/:orderId/vendor - Allot vendor to order
router.put("/orders/:orderId/vendor", verifyToken, adminAllotVendor);

// PUT /api/admin/orders/:orderId/courier - Update courier status
router.put("/orders/:orderId/courier", verifyToken, adminUpdateCourierStatus);

// PUT /api/admin/orders/:orderId/cancel - Cancel order with refund
router.put("/orders/:orderId/cancel", verifyToken, adminCancelOrder);

// POST /api/admin/orders/bulk-update - Bulk update orders
router.post("/orders/bulk-update", verifyToken, adminBulkUpdateOrders);

// ===== ADMIN DISPATCH MANAGEMENT ROUTES - NEW =====

// POST /api/admin/orders/:orderId/dispatch - Dispatch order
router.post("/orders/:orderId/dispatch", verifyToken, adminDispatchOrder);

// GET /api/admin/dispatch-options - Get dispatch options (courier partners)
router.get("/dispatch-options", verifyToken, adminGetDispatchOptions);

// ===== SHIPROCKET INTEGRATION ROUTES =====

// POST /api/admin/orders/:orderId/create-shiprocket-order - Create Shiprocket order
router.post("/orders/:orderId/create-shiprocket-order", verifyToken, createShiprocketOrder);

// POST /api/admin/orders/:orderId/shipment - Create shipment
router.post("/orders/:orderId/shipment", verifyToken, createShipment);

// GET /api/admin/orders/:orderId/track - Track shipment
router.get("/orders/:orderId/track", verifyToken, trackShipmentByOrderId);

// POST /api/admin/orders/:orderId/awb - Generate AWB
router.post("/orders/:orderId/awb", verifyToken, generateAWB);

// GET /api/admin/orders/:orderId/label - Get shipping label
router.get("/orders/:orderId/label", verifyToken, getShippingLabel);

// GET /api/admin/orders/:orderId/couriers - Get available couriers
router.get("/orders/:orderId/couriers", verifyToken, getAvailableCouriers);

// GET /api/admin/orders/:orderId/rates - Get shipping rates
router.get("/orders/:orderId/rates", verifyToken, getShippingRates);

// GET /api/admin/pickup-locations - Get pickup locations
router.get("/pickup-locations", verifyToken, getPickupLocations);

// POST /api/admin/orders/:orderId/cancel-shipment - Cancel shipment
router.post("/orders/:orderId/cancel-shipment", verifyToken, cancelShipment);

// POST /api/admin/orders/:orderId/assign-courier - Assign specific courier
router.post("/orders/:orderId/assign-courier", verifyToken, assignCourierToOrder);

// POST /api/admin/orders/bulk-create-shipments - Bulk create shipments
router.post("/orders/bulk-create-shipments", verifyToken, bulkCreateShipments);

// GET /api/admin/shiprocket/wallet-balance - Get Shiprocket wallet balance
router.get("/shiprocket/wallet-balance", verifyToken, getShiprocketWalletBalance);

// ===== VENDOR MANAGEMENT ROUTES =====

// GET /api/admin/vendors - Get all vendors
router.get("/vendors", verifyToken, adminGetAvailableVendors);

// ===== RETURN MANAGEMENT ROUTES =====

// GET /api/admin/returns - Get all returns
router.get("/returns", verifyToken, adminGetReturnRequests);

// GET /api/admin/returns/stats - Get return statistics
router.get("/returns/stats", verifyToken, adminGetReturnStats);

// PUT /api/admin/returns/:returnId/process - Process return request
router.put("/returns/:returnId/process", verifyToken, upload, adminProcessReturnRequest);

// ===== EXCHANGE MANAGEMENT ROUTES =====

// GET /api/admin/exchanges - Get all exchanges
router.get("/exchanges", verifyToken, adminGetExchangeRequests);

// GET /api/admin/exchanges/stats - Get exchange statistics
router.get("/exchanges/stats", verifyToken, adminGetExchangeStats);

// PUT /api/admin/exchanges/:exchangeId/process - Process exchange request
router.put("/exchanges/:exchangeId/process", verifyToken, upload, adminProcessExchangeRequest);

// Export the router for use in the main Express app
module.exports = router;
