#!/bin/bash

echo ""
echo "🚀 COMPLETE ORDER CREATION TEST"
echo "================================="
echo "Testing with Shiprocket credentials:"
echo "✅ Email: support@yoraa.in"
echo "✅ Password: R@0621thik"
echo "================================="
echo ""

API_BASE="http://localhost:8000/api"
PHONE="7006114695"

# Step 1: Generate OTP
echo "📱 Step 1: Generating OTP for $PHONE"
echo "======================================"
OTP_RESPONSE=$(curl -s -X POST "$API_BASE/auth/generate-otp" \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"$PHONE\"}")

echo "$OTP_RESPONSE"

OTP=$(echo "$OTP_RESPONSE" | grep -o '"otp":"[0-9]*"' | grep -o '[0-9]*')

if [ -z "$OTP" ]; then
    echo "❌ Failed to generate OTP"
    exit 1
fi

echo ""
echo "✅ OTP Generated: $OTP"
echo ""

# Step 2: Verify OTP
echo "🔐 Step 2: Verifying OTP"
echo "========================"
VERIFY_RESPONSE=$(curl -s -X POST "$API_BASE/auth/verifyOtp" \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"$PHONE\",\"otp\":\"$OTP\"}")

TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to verify OTP"
    echo "$VERIFY_RESPONSE"
    exit 1
fi

echo "✅ Token received: ${TOKEN:0:60}..."
echo ""

# Step 3: Create Order
echo "🛒 Step 3: Creating Order with Shiprocket Integration"
echo "======================================================"

ORDER_RESPONSE=$(curl -s -X POST "$API_BASE/razorpay/create-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": 1142,
    "cart": [{
      "itemId": "68da56fc0561b958f6694e39",
      "name": "Product 50",
      "quantity": 1,
      "price": 1142,
      "size": "M"
    }],
    "staticAddress": {
      "firstName": "Rithik",
      "lastName": "Mahajan",
      "email": "rithik@yoraa.in",
      "phoneNumber": "7006114695",
      "address": "123 Test Street",
      "city": "Delhi",
      "state": "Delhi",
      "pinCode": "110001"
    },
    "deliveryOption": "standard"
  }')

echo ""
echo "📊 ORDER RESPONSE:"
echo "=================="
echo "$ORDER_RESPONSE" | head -50
echo ""

# Check if order was successful
if echo "$ORDER_RESPONSE" | grep -q '"id":"order_'; then
    ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"id":"order_[^"]*"' | cut -d'"' -f4)
    DB_ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"database_order_id":"[^"]*"' | cut -d'"' -f4)
    AMOUNT=$(echo "$ORDER_RESPONSE" | grep -o '"amount":[0-9]*' | head -1 | cut -d':' -f2)
    echo ""
    echo "✅ ✅ ✅ ORDER CREATED SUCCESSFULLY! ✅ ✅ ✅"
    echo ""
    echo "📋 Order Details:"
    echo "   Razorpay Order ID: $ORDER_ID"
    echo "   Database Order ID: $DB_ORDER_ID"
    echo "   Amount: ₹$AMOUNT"
    echo ""
    echo "🎉 This order is ready for payment!"
    echo "🚛 After payment verification, Shiprocket order will be created automatically!"
    echo "📧 Using NEW Shiprocket credentials: support@yoraa.in"
    echo ""
elif echo "$ORDER_RESPONSE" | grep -q '"error"'; then
    ERROR=$(echo "$ORDER_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo ""
    echo "❌ ORDER CREATION FAILED"
    echo "Error: $ERROR"
    echo ""
else
    echo ""
    echo "⚠️ Unexpected response format"
    echo "$ORDER_RESPONSE"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test Completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
