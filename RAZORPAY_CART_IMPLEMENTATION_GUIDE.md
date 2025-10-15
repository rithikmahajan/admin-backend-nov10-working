# 🛒 Razorpay & Cart Implementation Guide

**Complete Backend Implementation Reference for Frontend Team**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Cart Structure](#cart-structure)
3. [Order Creation Flow](#order-creation-flow)
4. [Payment Verification Flow](#payment-verification-flow)
5. [API Endpoints](#api-endpoints)
6. [Error Handling](#error-handling)
7. [Testing](#testing)

---

## 🎯 Overview

This document explains how the backend handles cart items and Razorpay payment integration. Understanding this will help you sync your frontend implementation correctly.

---

## 🛒 Cart Structure

### What Backend Expects

The backend expects cart items in this **exact format**:

```javascript
{
  "amount": 3878,                    // Total amount in INR (not paise)
  "cart": [
    {
      "itemId": "68da56fc0561b958f6694e1b",  // ✅ REQUIRED: Product ID (or use "id")
      "sku": "SKU035",                        // ✅ REQUIRED: SKU code
      "size": "XL",                           // ✅ REQUIRED: Size
      "quantity": 1,                          // ✅ REQUIRED: Quantity
      "price": 3878,                          // ✅ REQUIRED: Unit price
      "name": "Product Name"                  // ✅ REQUIRED: Product name
      // ❌ NO description field needed!
      // ❌ NO other fields required!
    }
  ],
  "staticAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pinCode": "400001",
    "country": "India",
    "phone": "9999999999"
  },
  "promoCode": "DISCOUNT10",          // Optional
  "deliveryOption": "standard"        // Optional
}
```

### ⚠️ Important Notes

1. **Field Names**: Backend supports both `itemId` and `id` for product ID
2. **No Description**: Backend does NOT expect or validate `description` field in cart items
3. **Price Format**: Send price in INR (not paise). Backend converts to paise (×100) for Razorpay
4. **Amount Validation**: Backend validates that `amount` matches calculated cart total

---

## 🔄 Order Creation Flow

### Step 1: Create Razorpay Order

**Endpoint**: `POST /api/razorpay/create-order`

**Request Body**:
```json
{
  "amount": 3878,
  "cart": [
    {
      "itemId": "68da56fc0561b958f6694e1b",
      "sku": "SKU035",
      "size": "XL",
      "quantity": 1,
      "price": 3878,
      "name": "Product Name"
    }
  ],
  "staticAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pinCode": "400001",
    "country": "India"
  }
}
```

**Backend Validation Process**:

```javascript
// 1. Validate cart is not empty
if (!Array.isArray(cart) || cart.length === 0) {
  return { error: "Cart is empty or invalid" };
}

// 2. Extract item IDs (supports both field names)
const itemIds = cart.map(cartItem => cartItem.itemId || cartItem.id);

// 3. Validate item IDs are valid MongoDB ObjectIds
const invalidIds = itemIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
if (invalidIds.length > 0) {
  return { error: "Invalid item IDs", invalidItems: [...] };
}

// 4. Check all items exist in database
const existingItems = await Item.find({ _id: { $in: itemIds } });
if (existingItems.length !== itemIds.length) {
  return { error: "Some items are no longer available" };
}

// 5. Validate SKUs exist for each item
for (const cartItem of cart) {
  const item = existingItems.find(i => i._id.toString() === cartItem.itemId);
  const skuExists = item.sizes.some(size => size.sku === cartItem.sku);
  if (!skuExists) {
    return { error: "Invalid SKU or size not available" };
  }
}

// 6. Calculate cart total
let cartTotal = 0;
for (const cartItem of cart) {
  const item = existingItems.find(i => i._id.toString() === cartItem.itemId);
  cartTotal += item.price * cartItem.quantity;
}

// 7. Validate provided amount matches calculated total
if (Math.abs(cartTotal - amount) > 0.01) {
  return { error: "Amount mismatch" };
}

// 8. Create Razorpay order
const razorpayOrder = await razorpay.orders.create({
  amount: cartTotal * 100,  // Convert to paise
  currency: "INR",
  receipt: `receipt_${Date.now()}`
});

// 9. Save order in database
const newOrder = new Order({
  user: userId,
  items: itemIds,
  total_price: cartTotal,
  payment_status: "Pending",
  razorpay_order_id: razorpayOrder.id,
  address: staticAddress,
  item_quantities: cart.map(item => ({
    item_id: item.itemId || item.id,
    sku: item.sku,
    quantity: item.quantity
  }))
});

await newOrder.save();
```

**Success Response**:
```json
{
  "id": "order_RTA9Z8zEjK3het",
  "entity": "order",
  "amount": 387800,              // In paise (3878 × 100)
  "amount_paid": 0,
  "amount_due": 387800,
  "currency": "INR",
  "receipt": "receipt_1760403359",
  "status": "created",
  "attempts": 0,
  "notes": [],
  "created_at": 1760403359,
  "calculatedTotal": 3878,       // In INR
  "promoDiscount": 0,
  "shippingCost": 0
}
```

**Error Responses**:

```json
// Invalid item IDs
{
  "error": "Invalid item IDs",
  "invalidItems": [
    {
      "itemId": "68da56fc0561b958f6694e35",
      "name": "Product 48",
      "sku": "PRODUCT48-SMALL-1759589167579-0",
      "reason": "Item no longer available or has been removed"
    }
  ],
  "suggestion": "Please remove these items from your cart and try again"
}

// Invalid SKU
{
  "error": "Invalid item configuration",
  "message": "Size or SKU no longer available",
  "invalidItems": [
    {
      "itemId": "68da56fc0561b958f6694e1b",
      "name": "Product Name",
      "requestedSku": "INVALID_SKU",
      "requestedSize": "XL",
      "reason": "The requested size/SKU is no longer available",
      "availableSizes": [
        { "sku": "SKU035", "size": "XL", "stock": 10 },
        { "sku": "SKU036", "size": "L", "stock": 5 }
      ]
    }
  ]
}

// Amount mismatch
{
  "error": "Provided amount (3878) does not match calculated total (4000)"
}
```

---

## ✅ Payment Verification Flow

### Step 2: Verify Payment

**Endpoint**: `POST /api/razorpay/verify-payment`

**Request Body**:
```json
{
  "razorpay_payment_id": "pay_XXXXXXXXXXXX",
  "razorpay_order_id": "order_RTA9Z8zEjK3het",
  "razorpay_signature": "signature_hash"
}
```

**Backend Process**:

```javascript
// 1. Verify Razorpay signature
const body = `${razorpay_order_id}|${razorpay_payment_id}`;
const expectedSignature = crypto
  .createHmac("sha256", RAZORPAY_KEY_SECRET)
  .update(body)
  .digest("hex");

if (expectedSignature !== razorpay_signature) {
  return { success: false, message: "Invalid signature" };
}

// 2. Update order status
const order = await Order.findOneAndUpdate(
  { razorpay_order_id },
  {
    $set: {
      payment_status: "Paid",
      razorpay_payment_id,
      razorpay_signature
    }
  },
  { new: true }
);

// 3. Decrement stock for each item
for (const entry of order.item_quantities) {
  const item = await Item.findById(entry.item_id);
  const sizeEntry = item.sizes.find(s => s.sku === entry.sku);
  
  if (sizeEntry.stock < entry.quantity) {
    throw new Error("Insufficient stock");
  }
  
  sizeEntry.stock -= entry.quantity;
  await item.save();
}

// 4. Create Shiprocket order (if applicable)
// ... Shiprocket integration code

// 5. Return success response
```

**Success Response**:
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "order": {
    "_id": "...",
    "razorpay_order_id": "order_RTA9Z8zEjK3het",
    "payment_status": "Paid",
    "total_price": 3878,
    "items": [...],
    "address": {...}
  }
}
```

---

## 📡 API Endpoints

### 1. Get Razorpay Key

```http
GET /api/config/razorpay
```

**Response**:
```json
{
  "keyId": "rzp_test_YOUR_KEY",
  "mode": "test",
  "environment": "development"
}
```

### 2. Create Order

```http
POST /api/razorpay/create-order
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Verify Payment

```http
POST /api/razorpay/verify-payment
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## ❌ Error Handling

### Common Error Scenarios

#### 1. Invalid Item IDs

**Error**:
```json
{
  "error": "Invalid item IDs",
  "message": "Some items in your cart are no longer available",
  "invalidItems": [...]
}
```

**Frontend Action**:
- Remove invalid items from cart
- Show user-friendly message: "Some items are no longer available"
- Refresh cart from backend

#### 2. Invalid SKU/Size

**Error**:
```json
{
  "error": "Invalid item configuration",
  "invalidItems": [
    {
      "availableSizes": [...]
    }
  ]
}
```

**Frontend Action**:
- Show available sizes to user
- Allow user to select different size
- Or remove item from cart

#### 3. Out of Stock

**Error**:
```json
{
  "error": "Insufficient stock for SKU XXX"
}
```

**Frontend Action**:
- Show "Out of stock" message
- Remove item from cart
- Suggest alternative products

#### 4. Amount Mismatch

**Error**:
```json
{
  "error": "Provided amount (3878) does not match calculated total (4000)"
}
```

**Frontend Action**:
- Recalculate cart total
- Sync with backend
- Try order creation again

#### 5. Payment Signature Invalid

**Error**:
```json
{
  "success": false,
  "message": "Invalid signature"
}
```

**Frontend Action**:
- Show payment failed message
- Do NOT mark order as paid
- Allow user to retry payment

---

## 🧪 Testing

### Test Flow

```javascript
// 1. Fetch Razorpay key
const response = await fetch('/api/config/razorpay');
const { keyId } = await response.json();
console.log('Razorpay Key:', keyId); // Should be rzp_test_...

// 2. Prepare cart data
const cartData = {
  amount: 3878,
  cart: [
    {
      itemId: "68da56fc0561b958f6694e1b",
      sku: "SKU035",
      size: "XL",
      quantity: 1,
      price: 3878,
      name: "Test Product"
    }
  ],
  staticAddress: {
    firstName: "Test",
    lastName: "User",
    address: "123 Test St",
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400001",
    country: "India"
  }
};

// 3. Create Razorpay order
const orderResponse = await fetch('/api/razorpay/create-order', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(cartData)
});

const orderData = await orderResponse.json();
console.log('Order created:', orderData);

// 4. Initialize Razorpay
const options = {
  key: keyId,
  amount: orderData.amount, // In paise
  currency: orderData.currency,
  order_id: orderData.id,
  name: 'Yoraa',
  description: 'Order Payment',
  handler: async function(response) {
    // 5. Verify payment
    const verifyResponse = await fetch('/api/razorpay/verify-payment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature
      })
    });
    
    const verifyData = await verifyResponse.json();
    console.log('Payment verified:', verifyData);
  },
  prefill: {
    name: 'Test User',
    email: 'test@example.com',
    contact: '9999999999'
  }
};

const razorpay = new window.Razorpay(options);
razorpay.open();
```

### Test Cards

```
✅ Success: 4111 1111 1111 1111
❌ Failure: 4000 0000 0000 0002
🔐 3D Secure: 4000 0027 6000 3184
```

---

## 🔍 Debugging Checklist

### Frontend Checklist

- [ ] Using correct Razorpay key (test key for development)
- [ ] Cart items have all required fields (`itemId`, `sku`, `size`, `quantity`, `price`, `name`)
- [ ] Not sending `description` field in cart items
- [ ] Amount is in INR (not paise)
- [ ] JWT token is valid and included in Authorization header
- [ ] Razorpay script is loaded (`https://checkout.razorpay.com/v1/checkout.js`)
- [ ] Payment handler is implemented correctly
- [ ] Error handling is in place for all scenarios

### Backend Checklist

- [ ] Razorpay test keys are configured in `server.env`
- [ ] MongoDB is connected
- [ ] Items exist in database with correct IDs
- [ ] SKUs are valid for the items
- [ ] Stock is available for the items
- [ ] Server is running and accessible

---

## 🚀 Complete Implementation Example

```javascript
// File: src/components/Checkout.jsx

import React, { useState, useEffect } from 'react';

const Checkout = ({ cartItems, user, address }) => {
  const [razorpayKey, setRazorpayKey] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch Razorpay key on mount
  useEffect(() => {
    fetchRazorpayKey();
  }, []);

  const fetchRazorpayKey = async () => {
    try {
      const response = await fetch('http://185.193.19.244:8000/api/config/razorpay');
      const data = await response.json();
      setRazorpayKey(data.keyId);
      console.log(`🔑 Razorpay Mode: ${data.mode}`);
    } catch (error) {
      console.error('Failed to fetch Razorpay key:', error);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);

    try {
      // 1. Prepare cart data (NO description field!)
      const cartData = {
        amount: calculateTotal(cartItems),
        cart: cartItems.map(item => ({
          itemId: item.id,           // or item._id
          sku: item.sku,
          size: item.selectedSize,
          quantity: item.quantity,
          price: item.price,
          name: item.name
          // ❌ NO description!
        })),
        staticAddress: address
      };

      console.log('📤 Sending cart data:', cartData);

      // 2. Create Razorpay order
      const orderResponse = await fetch('http://185.193.19.244:8000/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cartData)
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        console.error('❌ Order creation failed:', orderData);
        handleOrderError(orderData);
        return;
      }

      console.log('✅ Order created:', orderData);

      // 3. Initialize Razorpay
      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.id,
        name: 'Yoraa',
        description: 'Order Payment',
        image: 'https://your-logo.com/logo.png',
        handler: async (response) => {
          await verifyPayment(response);
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: () => {
            console.log('Payment cancelled by user');
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('❌ Checkout error:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      console.log('🔍 Verifying payment...');

      const response = await fetch('http://185.193.19.244:8000/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_signature: paymentResponse.razorpay_signature
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Payment verified successfully');
        // Clear cart
        // Navigate to success page
        window.location.href = '/order-success';
      } else {
        console.error('❌ Payment verification failed');
        alert('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      alert('Payment verification failed. Please contact support.');
    }
  };

  const handleOrderError = (errorData) => {
    if (errorData.invalidItems) {
      // Remove invalid items from cart
      console.log('Removing invalid items:', errorData.invalidItems);
      // Show user-friendly message
      alert(`Some items are no longer available:\n${errorData.invalidItems.map(i => i.name).join('\n')}`);
      // Refresh cart
    } else {
      alert(errorData.error || 'Failed to create order');
    }
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <button onClick={handleCheckout} disabled={loading || !razorpayKey}>
      {loading ? 'Processing...' : 'Checkout'}
    </button>
  );
};

export default Checkout;
```

---

## 📝 Key Takeaways

1. **Cart Format**: Only send required fields - no `description`!
2. **Amount**: Send in INR, backend converts to paise
3. **Item IDs**: Backend supports both `itemId` and `id`
4. **Validation**: Backend validates everything - item existence, SKUs, stock, amount
5. **Error Handling**: Backend returns detailed error information
6. **Razorpay Key**: Fetch dynamically from `/api/config/razorpay`
7. **Test Mode**: Always use test keys for development
8. **Payment Flow**: Create order → Open Razorpay → Verify payment

---

## 🔗 Related Files

- Backend Order Controller: `src/controllers/paymentController/OrderController.js`
- Order Model: `src/models/Order.js`
- Item Model: `src/models/Item.js`
- Config Routes: `src/routes/ConfigRoutes.js`

---

## 📞 Support

If you encounter issues:
1. Check console logs for detailed error messages
2. Verify cart structure matches backend expectations
3. Ensure all required fields are present
4. Test with test cards first
5. Contact backend team with error logs

---

**Last Updated**: October 14, 2025  
**Backend Version**: Latest  
**Razorpay SDK**: v1
