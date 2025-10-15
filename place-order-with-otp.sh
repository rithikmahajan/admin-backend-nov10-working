#!/bin/bash

PRODUCT_ID=$1
PRODUCT_PRICE=$2
OTP=$3
TEST_PHONE="9876543210"

if [ -z "$OTP" ]; then
    echo "Usage: ./place-order-with-otp.sh <PRODUCT_ID> <PRODUCT_PRICE> <OTP>"
    exit 1
fi

echo ""
echo "🔐 Step 3: Verifying OTP"
echo "========================="

VERIFY_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$TEST_PHONE\",\"otp\":\"$OTP\"}")

echo "$VERIFY_RESPONSE" | jq '.'

TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    exit 1
fi

echo "✅ OTP verified successfully"
echo "🎫 Token: ${TOKEN:0:50}..."

echo ""
echo "💳 Step 4: Creating Razorpay Order"
echo "==================================="

RAZORPAY_RESPONSE=$(curl -s -X POST http://localhost:8000/api/payment/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"amount\":$PRODUCT_PRICE,\"currency\":\"INR\"}")

echo "$RAZORPAY_RESPONSE" | jq '.'

RAZORPAY_ORDER_ID=$(echo "$RAZORPAY_RESPONSE" | jq -r '.orderId')

if [ "$RAZORPAY_ORDER_ID" = "null" ] || [ -z "$RAZORPAY_ORDER_ID" ]; then
    echo "❌ Failed to create Razorpay order"
    exit 1
fi

echo "✅ Razorpay order created: $RAZORPAY_ORDER_ID"

echo ""
echo "🚀 Step 5: Verify Payment & Create Order (with Shiprocket)"
echo "=========================================================="

ORDER_DATA="{
  \"razorpay_order_id\": \"$RAZORPAY_ORDER_ID\",
  \"razorpay_payment_id\": \"pay_test_$(date +%s)\",
  \"razorpay_signature\": \"test_signature_$(date +%s)\",
  \"orderDetails\": {
    \"items\": [{
      \"productId\": \"$PRODUCT_ID\",
      \"name\": \"Test Product\",
      \"quantity\": 1,
      \"price\": $PRODUCT_PRICE,
      \"size\": \"M\",
      \"color\": \"Blue\"
    }],
    \"shippingAddress\": {
      \"name\": \"Test User\",
      \"phone\": \"$TEST_PHONE\",
      \"email\": \"testuser@yoraa.in\",
      \"addressLine1\": \"123 Test Street\",
      \"addressLine2\": \"Near Test Market\",
      \"city\": \"Delhi\",
      \"state\": \"Delhi\",
      \"pincode\": \"110001\",
      \"country\": \"India\"
    },
    \"billingAddress\": {
      \"name\": \"Test User\",
      \"phone\": \"$TEST_PHONE\",
      \"email\": \"testuser@yoraa.in\",
      \"addressLine1\": \"123 Test Street\",
      \"addressLine2\": \"Near Test Market\",
      \"city\": \"Delhi\",
      \"state\": \"Delhi\",
      \"pincode\": \"110001\",
      \"country\": \"India\"
    },
    \"totalAmount\": $PRODUCT_PRICE
  }
}"

ORDER_RESPONSE=$(curl -s -X POST http://localhost:8000/api/payment/verify-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$ORDER_DATA")

echo ""
echo "📊 Order Response:"
echo "$ORDER_RESPONSE" | jq '.'

SUCCESS=$(echo "$ORDER_RESPONSE" | jq -r '.success')
ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.order._id')
SHIPROCKET_ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.shiprocketOrderId')

if [ "$SUCCESS" = "true" ]; then
    echo ""
    echo "✅ ✅ ✅ ORDER PLACED SUCCESSFULLY! ✅ ✅ ✅"
    echo ""
    echo "📋 Order Details:"
    echo "   Order ID: $ORDER_ID"
    echo "   🚛 Shiprocket Order ID: $SHIPROCKET_ORDER_ID"
    echo "   ✅ Order created in Shiprocket successfully!"
else
    echo ""
    echo "❌ ORDER CREATION FAILED"
    ERROR_MSG=$(echo "$ORDER_RESPONSE" | jq -r '.message')
    echo "Error: $ERROR_MSG"
fi
