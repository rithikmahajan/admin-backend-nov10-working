const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  }],
  item_quantities: [{
    item_id: {
      type: String, // Use itemId string instead of ObjectId
      required: true,
    },
    sku: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    size: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // 🆕 ENHANCED PRICING FIELDS
    original_price: {
      type: Number,
      min: 0,
    },
    sale_price: {
      type: Number,
      min: 0,
    },
    price_type: {
      type: String,
      enum: ['regular', 'sale'],
    },
    is_on_sale: {
      type: Boolean,
      default: false,
    },
    savings: {
      type: Number,
      min: 0,
      default: 0,
    },
    discount_percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    frontend_price: {
      type: Number,
      min: 0,
    },
    
    desiredSize: {
      type: String,
    },
  }],
  total_price: {
    type: Number,
    required: true,
  },
  payment_status: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending',
  },
  razorpay_order_id: {
    type: String,
  },
  razorpay_payment_id: {
    type: String,
  },
  razorpay_signature: {
    type: String,
  },
  order_status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  shipping_status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'RETRYING', 'FAILED', 'AWB_FAILED', 'In Transit', 'Delivered', 'Cancelled'],
    default: 'PENDING',
  },
  shipping_error: {
    type: String,
  },
  payment_verified_at: {
    type: Date,
  },
  shipping_started_at: {
    type: Date,
  },
  shipping_completed_at: {
    type: Date,
  },
  shipping_failed_at: {
    type: Date,
  },
  address: {
    firstName: String,
    lastName: String,
    email: String, // Added email field for delivery notifications
    address: String,
    city: String,
    state: String,
    country: String,
    pinCode: String,
    phoneNumber: String,
    apartment: String, // Optional apartment/unit number
    landmark: String, // Optional landmark for delivery reference
  },
  shiprocket_orderId: {
    type: String,
  },
  shiprocket_shipment_id: {
    type: String,
  },
  awb_code: {
    type: String,
  },
  tracking_url: {
    type: String,
  },
  courier_company_id: {
    type: String,
  },
  courier_name: {
    type: String,
  },
  freight_charges: {
    type: Number,
  },
  applied_weight: {
    type: Number,
  },
  routing_code: {
    type: String,
  },
  invoice_no: {
    type: String,
  },
  transporter_id: {
    type: String,
  },
  transporter_name: {
    type: String,
  },
  courier_partner: {
    type: String,
  },
  expected_delivery_date: {
    type: Date,
  },
  auto_assigned: {
    type: Boolean,
    default: false,
  },
  shipped_by: {
    shipper_company_name: String,
    shipper_address_1: String,
    shipper_address_2: String,
    shipper_city: String,
    shipper_state: String,
    shipper_country: String,
    shipper_postcode: String,
    shipper_phone: String,
    shipper_email: String,
  },
  refund: {
    requestDate: Date,
    status: String,
    rmaNumber: String,
    amount: Number,
    reason: String,
    returnAwbCode: String,
    returnTrackingUrl: String,
    returnLabelUrl: String,
    shiprocketReturnId: String,
    returnShipmentId: String,
    refundTransactionId: String,
    refundStatus: String,
    notes: String,
    images: [String],
  },
  exchange: {
    requestDate: Date,
    status: String,
    rmaNumber: String,
    newItemId: String,
    desiredSize: String,
    reason: String,
    returnAwbCode: String,
    returnTrackingUrl: String,
    returnLabelUrl: String,
    shiprocketReturnId: String,
    returnShipmentId: String,
    forwardAwbCode: String,
    forwardTrackingUrl: String,
    shiprocketForwardOrderId: String,
    forwardShipmentId: String,
    notes: String,
    images: [String],
  },
  promoCode: {
    type: String,
    trim: true,
  },
  promoDiscount: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  // 🆕 ENHANCED CART CALCULATION SUMMARY
  cart_calculation: {
    subtotal: {
      type: Number,
      min: 0,
    },
    total_savings: {
      type: Number,
      min: 0,
      default: 0,
    },
    average_discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    tax_amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    shipping_fee: {
      type: Number,
      min: 0,
      default: 0,
    },
    discount_amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    final_total: {
      type: Number,
      min: 0,
    },
    item_count: {
      type: Number,
      min: 0,
    },
    total_quantity: {
      type: Number,
      min: 0,
    },
    has_sale_items: {
      type: Boolean,
      default: false,
    },
    calculation_timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  
  // 🆕 COMPREHENSIVE ORDER DATA STRUCTURE - Following complete specification
  
  // Customer Information
  customer: {
    user_id: String,
    firstName: String,
    lastName: String,
    fullName: String,
    email: String,
    phone: String,
    isGuest: { type: Boolean, default: false },
    guestSessionId: String,
    registrationDate: Date,
    totalOrders: { type: Number, default: 0 }
  },
  
  // Order Summary & Pricing (complete breakdown)
  orderSummary: {
    subtotal: { type: Number, min: 0 },
    shippingCharges: { type: Number, min: 0, default: 0 },
    taxAmount: { type: Number, min: 0, default: 0 },
    discountAmount: { type: Number, min: 0, default: 0 },
    couponCode: String,
    couponDiscount: { type: Number, min: 0, default: 0 },
    totalAmount: { type: Number, min: 0 },
    currency: { type: String, default: "INR" },
    freeDeliveryApplied: { type: Boolean, default: false },
    shippingThreshold: { type: Number, default: 500 },
    taxBreakdown: {
      cgst: { type: Number, min: 0, default: 0 },
      sgst: { type: Number, min: 0, default: 0 },
      igst: { type: Number, min: 0, default: 0 }
    }
  },
  
  // Payment Information (comprehensive)
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paymentMethod: String, // card/netbanking/upi/wallet
    paymentStatus: { type: String, enum: ['pending', 'captured', 'failed'], default: 'pending' },
    amountPaid: Number,
    currency: { type: String, default: "INR" },
    paymentDate: Date,
    gatewayFee: { type: Number, default: 0 },
    netAmount: Number,
    cardDetails: {
      last4: String,
      network: String, // Visa/Mastercard/Rupay
      type: String, // credit/debit
      issuer: String // Bank name
    },
    bankReference: String,
    receipt: String
  },
  
  // Order Metadata & Tracking
  orderMetadata: {
    orderId: String, // Internal order ID (ORD-2024-001234)
    orderNumber: String, // Customer-facing order number (YRA001234)
    orderStatus: { 
      type: String, 
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    fulfillmentStatus: { 
      type: String, 
      enum: ['pending', 'processing', 'shipped', 'delivered'],
      default: 'pending'
    },
    source: String, // mobile_app_ios/mobile_app_android/web_app
    deviceInfo: {
      platform: String,
      version: String,
      deviceModel: String,
      appVersion: String,
      userAgent: String
    },
    orderNotes: String,
    internalNotes: String,
    tags: [String],
    priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
    estimatedDelivery: String,
    confirmedAt: Date,
    userId: String,
    sessionId: String,
    ipAddress: String
  },
  
  // Shiprocket Integration Data (complete structure)
  shiprocketData: {
    orderDetails: {
      order_id: String,
      order_date: String,
      channel_id: { type: String, default: "custom" },
      billing_customer_name: String,
      billing_last_name: String,
      billing_address: String,
      billing_address_2: String,
      billing_city: String,
      billing_pincode: String,
      billing_state: String,
      billing_country: String,
      billing_email: String,
      billing_phone: String,
      shipping_is_billing: { type: Boolean, default: true },
      order_items: [{
        name: String,
        sku: String,
        units: Number,
        selling_price: Number,
        discount: Number,
        tax: Number,
        hsn: String
      }],
      payment_method: { type: String, default: "Prepaid" },
      shipping_charges: { type: Number, default: 0 },
      giftwrap_charges: { type: Number, default: 0 },
      transaction_charges: { type: Number, default: 0 },
      total_discount: { type: Number, default: 0 },
      sub_total: Number,
      length: Number,
      breadth: Number,
      height: Number,
      weight: Number
    }
  },
  
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', orderSchema);