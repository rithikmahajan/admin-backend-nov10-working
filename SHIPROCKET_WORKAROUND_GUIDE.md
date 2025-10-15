# Shiprocket API Workaround Integration Guide

## Quick Setup (5 minutes)

### 1. Import the workaround in your OrderController.js

```javascript
// At the top of src/controllers/paymentController/OrderController.js
const {
  getShiprocketTokenWithFallback,
  getCourierListWithFallback,
  checkServiceabilityWithFallback,
  FALLBACK_SHIPROCKET_DATA
} = require('../../utils/ShiprocketWorkaround');
```

### 2. Replace your existing Shiprocket functions

**Before (causing 403 errors):**
```javascript
exports.getShiprocketCouriers = async (req, res) => {
  try {
    const token = await getShiprocketToken();
    const response = await fetch(`${SHIPROCKET_API_BASE}/courier/courierListWithCounts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // This fails with 403
  } catch (error) {
    // Error handling
  }
};
```

**After (with fallback):**
```javascript
exports.getShiprocketCouriers = async (req, res) => {
  try {
    const token = await getShiprocketToken();
    const couriers = await getCourierListWithFallback(token);
    
    res.status(200).json({
      success: true,
      data: couriers,
      note: couriers.fallback ? "Using fallback data - contact Shiprocket for full API access" : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### 3. Update serviceability check

```javascript
exports.checkServiceability = async (req, res) => {
  try {
    const { pickupPin, deliveryPin, weight } = req.body;
    const token = await getShiprocketToken();
    
    const serviceability = await checkServiceabilityWithFallback(
      token, 
      pickupPin || "180001", // Your Jammu pincode
      deliveryPin, 
      weight || 1
    );
    
    res.status(200).json({
      success: true,
      data: serviceability,
      note: serviceability.fallback ? "Basic rates only - API upgrade needed for accurate pricing" : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### 4. Test the workaround

```bash
# Test courier list
curl -X GET "http://localhost:3000/api/shiprocket/couriers" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test serviceability  
curl -X POST "http://localhost:3000/api/shiprocket/serviceability" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"deliveryPin": "110001", "weight": 1}'
```

## What This Gives You Right Now

### ✅ Working Features:
- **Authentication**: ✅ Still works perfectly
- **Pickup Locations**: ✅ Can still fetch your warehouse details
- **Basic Courier List**: ✅ Shows standard couriers (BlueDart, Delhivery, DTDC, etc.)
- **Basic Serviceability**: ✅ Checks if pincode is valid and serviceable
- **Estimated Rates**: ✅ Basic pricing based on city tiers
- **Graceful Fallbacks**: ✅ Your app won't crash due to 403 errors

### ⚠️ Limitations (Until API Access):
- **Real-time Rates**: Uses estimated rates instead of live API rates
- **Wallet Balance**: Shows message to contact support
- **Live Order Tracking**: Can't create/track orders until API access
- **Courier Availability**: Uses standard list instead of real-time availability

## Frontend Changes Needed

Update your frontend to handle fallback responses:

```javascript
// In your React/Vue/Angular component
const checkShipping = async (pincode) => {
  const response = await fetch('/api/shiprocket/serviceability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deliveryPin: pincode, weight: 1 })
  });
  
  const data = await response.json();
  
  if (data.note) {
    // Show user that rates are estimated
    showMessage(data.note, 'warning');
  }
  
  return data.data.available_courier_companies;
};
```

## Next Steps

1. **Deploy this workaround** - Your app will work immediately
2. **Contact Shiprocket** - Use the template in SHIPROCKET_PERMISSION_RESOLUTION.md
3. **Monitor for upgrade** - Run diagnostic script weekly to check if permissions are granted
4. **Remove workaround** - Once full API access is granted, remove fallback logic

## Support Contact Template

```
Subject: API Permission Request - Company ID: 5783639

Hello Shiprocket Support,

Account Details:
- Email: contact@yoraa.in
- Company ID: 5783639
- User ID: 5996773

We need full API access for the following endpoints that currently return 403 Forbidden:
- GET /courier/courierListWithCounts
- GET /account/details/wallet-balance  
- GET /courier/serviceability
- POST /orders/create/adhoc
- GET /orders/show/{order_id}

Our business requires these APIs for production use. Please upgrade our account permissions.

Technical Details:
- Authentication: Working ✅
- Current Access: Pickup locations only
- Required: Full shipping API access

Thank you,
Yoraa Team
```

## Quick Test

Run this after integration:

```bash
node -e "
const { getCourierListWithFallback } = require('./src/utils/ShiprocketWorkaround');
getCourierListWithFallback('dummy-token').then(result => {
  console.log('Fallback Test:', result.fallback ? 'Working ✅' : 'API Access ✅');
});
"
```

Your Shiprocket integration will now work with basic functionality while you wait for full API access!
