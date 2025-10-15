# 📨 Frontend Team - Razorpay Integration Update

## 🎯 Action Required

The backend now uses **TEST keys** for local development. You need to update your frontend to use the test key.

---
# 🔑 Razorpay Test vs Live Key Configuration Guide

## 📋 Overview

For **local development**, you should ALWAYS use **Razorpay TEST keys**.  
For **production**, use **Razorpay LIVE keys**.

---

## 🔧 Backend Configuration

### Current Setup (Updated for Development)

Your `server.env` file has been updated to use **TEST keys** for local development:

```env
# ❌ OLD - LIVE KEYS (Use only in production)
# RAZORPAY_KEY_ID=rzp_live_VRU7ggfYLI7DWV
# RAZORPAY_KEY_SECRET=giunOIOED3FhjWxW2dZ2peNe

# ✅ NEW - TEST KEYS (For local development)
RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_HERE
RAZORPAY_KEY_SECRET=YOUR_TEST_SECRET_HERE
```

### How to Get Razorpay Test Keys

1. **Login to Razorpay Dashboard**: https://dashboard.razorpay.com/
2. **Switch to Test Mode**: Toggle at the top-left corner
3. **Navigate to Settings > API Keys**
4. **Generate Test Keys** if not already created
5. Copy the **Test Key ID** (starts with `rzp_test_`) and **Test Secret**
6. Update your `server.env` file with these values

---

## 🚀 Backend API Endpoint

Your backend now exposes the Razorpay key through an API endpoint (✅ **SECURE - Only exposes the Key ID, NOT the secret**):

### Get Razorpay Key

```http
GET http://185.193.19.244:8000/api/config/razorpay
```

**Response:**
```json
{
  "keyId": "rzp_test_YOUR_TEST_KEY_HERE",
  "mode": "test",
  "environment": "development"
}
```

### Frontend Usage

In your frontend code, fetch the key dynamically:

```javascript
// Example: Fetch Razorpay key from backend
const fetchRazorpayKey = async () => {
  try {
    const response = await fetch('http://185.193.19.244:8000/api/config/razorpay');
    const data = await response.json();
    
    console.log(`🔑 Razorpay Mode: ${data.mode}`);
    return data.keyId;
  } catch (error) {
    console.error('Failed to fetch Razorpay key:', error);
    // Fallback to hardcoded key (not recommended for production)
    return 'rzp_test_YOUR_TEST_KEY_HERE';
  }
};

// Use it in your checkout flow
const initializePayment = async () => {
  const razorpayKey = await fetchRazorpayKey();
  
  const options = {
    key: razorpayKey,
    amount: orderData.amount,
    currency: 'INR',
    // ... other Razorpay options
  };
  
  const razorpay = new window.Razorpay(options);
  razorpay.open();
};
```

---

## 🎨 Frontend Configuration

Since your frontend code is in a **different repository**, you need to update the Razorpay key there as well.

### Frontend Changes Needed

Look for where the Razorpay key is configured in your frontend code. It might be in:

- `src/config/environment.js`
- `src/config/razorpay.js`
- `.env` file
- Or directly in your checkout/payment component

**Update the key to:**

```javascript
// ❌ OLD - LIVE KEY
const RAZORPAY_KEY = 'rzp_live_VRU7ggfYLI7DWV';

// ✅ NEW - TEST KEY
const RAZORPAY_KEY = process.env.NODE_ENV === 'production' 
  ? 'rzp_live_VRU7ggfYLI7DWV'  // Live key for production
  : 'rzp_test_YOUR_TEST_KEY_HERE';  // Test key for development
```

Or in your `.env` file:

```env
# Development (.env.development)
REACT_APP_RAZORPAY_KEY=rzp_test_YOUR_TEST_KEY_HERE

# Production (.env.production)
REACT_APP_RAZORPAY_KEY=rzp_live_VRU7ggfYLI7DWV
```

---

## 🧪 Testing with Test Keys

### Test Card Details

Once you switch to test keys, use these test cards for testing:

#### ✅ Success Scenarios
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits (e.g., 123)
Expiry: Any future date (e.g., 12/28)
Name: Test User
```

#### ❌ Failure Scenarios
```
Card Number: 4000 0000 0000 0002
CVV: 123
Expiry: 12/28
```

#### ⏱️ Authentication Required
```
Card Number: 4000 0027 6000 3184
CVV: 123
Expiry: 12/28
```

More test cards: https://razorpay.com/docs/payments/payments/test-card-upi-details/

---

## 🚀 Backend API Endpoint

Your backend already exposes the Razorpay key through an API endpoint (if configured).

Check if you have an endpoint like:
- `GET /api/config/razorpay`
- `GET /api/razorpay/key`

If yes, make sure it returns the correct key based on environment:

```javascript
// In your backend controller
exports.getRazorpayKey = (req, res) => {
  res.json({
    key: process.env.RAZORPAY_KEY_ID
  });
};
```

---

## 📝 Environment-Based Configuration (Recommended)

### Backend (`server.env`)

Create separate environment files:

**`server.env.development`**
```env
RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_HERE
RAZORPAY_KEY_SECRET=YOUR_TEST_SECRET_HERE
```

**`server.env.production`**
```env
RAZORPAY_KEY_ID=rzp_live_VRU7ggfYLI7DWV
RAZORPAY_KEY_SECRET=giunOIOED3FhjWxW2dZ2peNe
```

### Frontend (In your frontend repo)

**`.env.development`**
```env
REACT_APP_RAZORPAY_KEY=rzp_test_YOUR_TEST_KEY_HERE
REACT_APP_API_URL=http://185.193.19.244:8000
```

**`.env.production`**
```env
REACT_APP_RAZORPAY_KEY=rzp_live_VRU7ggfYLI7DWV
REACT_APP_API_URL=https://your-production-domain.com
```

---

## ⚠️ Important Security Notes

1. **Never commit live keys to version control**
2. **Never expose live keys in frontend code**
3. **Always use environment variables**
4. **Use test keys in development**
5. **Validate on both frontend and backend**
6. **The frontend should fetch the key from the backend API** (recommended approach)

---

## 🔄 Quick Switch Command

To quickly switch between test and live keys during development:

```bash
# For local development - use test keys
export NODE_ENV=development

# For production - use live keys
export NODE_ENV=production
```

---

## 🎯 What You Need to Do Now

### Backend (This repo):
✅ Already updated `server.env` with test keys placeholder
- [ ] Get your actual Razorpay test keys from dashboard
- [ ] Replace placeholders in `server.env`
- [ ] Restart your backend server

### Frontend (Different repo):
- [ ] Update Razorpay key to test key
- [ ] Use environment variables for key management
- [ ] Test payment flow with test cards
- [ ] Ensure proper error handling

---

## 🧪 Verify Setup

After making changes:

1. **Backend**: Check logs to confirm test key is loaded
   ```
   console.log("Razorpay Key:", process.env.RAZORPAY_KEY_ID);
   // Should show: rzp_test_...
   ```

2. **Frontend**: Check console logs during payment
   ```
   console.log("Using Razorpay Key:", razorpayKey);
   // Should show: rzp_test_...
   ```

3. **Test a payment** with test card details

---

## 📞 Support

- Razorpay Docs: https://razorpay.com/docs/
- Test Cards: https://razorpay.com/docs/payments/payments/test-card-upi-details/
- Dashboard: https://dashboard.razorpay.com/

---

**Last Updated**: October 14, 2025

**Response:**
```json
{
  "keyId": "rzp_test_...",
  "mode": "test",
  "environment": "development"
}
```

---

## ✅ Recommended Implementation

### Step 1: Create a Utility Function

Create `src/utils/razorpayConfig.js`:

```javascript
let cachedRazorpayKey = null;

export const getRazorpayKey = async () => {
  // Return cached key if available
  if (cachedRazorpayKey) {
    return cachedRazorpayKey;
  }

  try {
    const response = await fetch('http://185.193.19.244:8000/api/config/razorpay');
    const data = await response.json();
    
    cachedRazorpayKey = data.keyId;
    
    console.log(`🔑 Razorpay Key Loaded: ${data.mode} mode`);
    
    return data.keyId;
  } catch (error) {
    console.error('Failed to fetch Razorpay key:', error);
    
    // Fallback to environment variable
    return process.env.REACT_APP_RAZORPAY_KEY || 'rzp_test_YOUR_TEST_KEY_HERE';
  }
};

export const getRazorpayMode = async () => {
  try {
    const response = await fetch('http://185.193.19.244:8000/api/config/razorpay');
    const data = await response.json();
    return data.mode; // 'test' or 'live'
  } catch (error) {
    return 'unknown';
  }
};
```

### Step 2: Update Your Checkout/Payment Component

**Before (Hardcoded):**
```javascript
const options = {
  key: 'rzp_live_VRU7ggfYLI7DWV', // ❌ Hardcoded live key
  amount: orderData.amount,
  currency: 'INR',
  // ... rest of options
};
```

**After (Dynamic):**
```javascript
import { getRazorpayKey } from '../utils/razorpayConfig';

const handlePayment = async () => {
  // Fetch key dynamically
  const razorpayKey = await getRazorpayKey();
  
  const options = {
    key: razorpayKey, // ✅ Dynamic key from backend
    amount: orderData.amount,
    currency: 'INR',
    order_id: orderData.id,
    name: 'Yoraa',
    description: 'Order Payment',
    image: 'https://your-app-logo.com/logo.png',
    handler: function (response) {
      // Payment success handler
      console.log('Payment successful:', response);
    },
    prefill: {
      name: user?.name,
      email: user?.email,
      contact: user?.phone
    },
    theme: {
      color: '#3399cc'
    }
  };
  
  const razorpay = new window.Razorpay(options);
  razorpay.open();
};
```

---

## 🧪 Test Payment Details

Use these test cards for testing:

### ✅ Success
```
Card: 4111 1111 1111 1111
CVV: 123
Expiry: 12/28
Name: Test User
```

### ❌ Failure
```
Card: 4000 0000 0000 0002
CVV: 123
Expiry: 12/28
```

### 🔐 3D Secure
```
Card: 4000 0027 6000 3184
CVV: 123
Expiry: 12/28
```

**More test cards**: https://razorpay.com/docs/payments/payments/test-card-upi-details/

---

## 🔄 Alternative: Environment Variable Approach

If you prefer not to make an API call, use environment variables:

### `.env.development`
```env
REACT_APP_RAZORPAY_KEY=rzp_test_YOUR_TEST_KEY_HERE
REACT_APP_API_URL=http://185.193.19.244:8000
```

### `.env.production`
```env
REACT_APP_RAZORPAY_KEY=rzp_live_VRU7ggfYLI7DWV
REACT_APP_API_URL=https://api.yoraa.com
```

### In your code:
```javascript
const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY;
```

---

## 🚨 Important Notes

1. **Test Mode Required**: For local development, you MUST use test keys
2. **Key Format**: Test keys start with `rzp_test_`, live keys with `rzp_live_`
3. **No Real Money**: Test mode doesn't process real payments
4. **Backend Validation**: Backend also validates using test keys

---

## ✅ Checklist

- [ ] Fetch Razorpay key from backend API (or use environment variable)
- [ ] Verify key starts with `rzp_test_` in console
- [ ] Test payment with test card `4111 1111 1111 1111`
- [ ] Verify payment success callback works
- [ ] Check order created in backend
- [ ] Test payment failure scenario
- [ ] Update environment variables for production

---

## 📞 Questions?

Contact backend team if you need:
- Test Razorpay credentials
- API endpoint not responding
- Payment integration issues
- Test scenarios failing

---

## 🎯 Expected Console Logs

After implementation, you should see:

```
🔑 Razorpay Key Loaded: test mode
🛒 Original bagItems structure: [{...}]
📦 Formatted cart item 1: {...}
📤 Sending Razorpay order data: {...}
✅ Razorpay order created successfully: {...}
💳 Initializing Razorpay payment with order: {...}
🚀 Opening Razorpay with options: {...}
```

And **NO** "Payment Failed - Unexpected Error" unless testing failure scenarios.

---

**Quick Start**: Use the API endpoint approach - it's more flexible and environment-aware!

---

**Last Updated**: October 14, 2025
