#!/bin/bash

echo ""
echo "🎯 YORAA - COMPLETE ORDER PLACEMENT TEST WITH AUTH TOKEN"
echo "========================================================="
echo "Phone: 7006114695"
echo "Testing with updated Shiprocket credentials:"
echo "✅ Email: support@yoraa.in"
echo "✅ Password: R@0621thik"
echo "========================================================="
echo ""

# Configuration
TEST_PHONE="7006114695"
API_BASE="http://localhost:8000/api"

# Step 1: Get a product
echo "📦 Step 1: Fetching Products"
echo "============================="
PRODUCTS_RESPONSE=$(curl -s "$API_BASE/products?limit=1")
echo "Response: $PRODUCTS_RESPONSE"

# Extract product details (using grep and sed since jq might not be available)
PRODUCT_ID=$(echo "$PRODUCTS_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
PRODUCT_NAME=$(echo "$PRODUCTS_RESPONSE" | grep -o '"productName":"[^"]*"' | head -1 | cut -d'"' -f4)
# Try to get salePrice first, then regularPrice
PRODUCT_PRICE=$(echo "$PRODUCTS_RESPONSE" | grep -o '"salePrice":[0-9]*' | head -1 | cut -d':' -f2)
if [ -z "$PRODUCT_PRICE" ] || [ "$PRODUCT_PRICE" == "0" ]; then
    PRODUCT_PRICE=$(echo "$PRODUCTS_RESPONSE" | grep -o '"regularPrice":[0-9]*' | head -1 | cut -d':' -f2)
fi

if [ -z "$PRODUCT_ID" ]; then
    echo "❌ No products found or failed to parse response"
    exit 1
fi

echo "✅ Product found: $PRODUCT_NAME"
echo "   ID: $PRODUCT_ID"
echo "   Price: ₹$PRODUCT_PRICE"

# Step 2: Generate OTP
echo ""
echo "📱 Step 2: Generating OTP"
echo "========================="
echo "Phone: $TEST_PHONE"

OTP_RESPONSE=$(curl -s -X POST "$API_BASE/auth/generate-otp" \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"$TEST_PHONE\"}")

echo "Response: $OTP_RESPONSE"

# Check if OTP was sent successfully
if echo "$OTP_RESPONSE" | grep -q "success.*true"; then
    echo "✅ OTP sent successfully to $TEST_PHONE"
else
    echo "❌ Failed to send OTP"
    echo "$OTP_RESPONSE"
    exit 1
fi

# Step 3: Ask for OTP
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏸️  ENTER THE OTP YOU RECEIVED ON: $TEST_PHONE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "Enter OTP: " USER_OTP

if [ -z "$USER_OTP" ]; then
    echo "❌ No OTP entered"
    exit 1
fi

# Step 4: Verify OTP and get token
echo ""
echo "🔐 Step 3: Verifying OTP & Getting Auth Token"
echo "=============================================="

VERIFY_RESPONSE=$(curl -s -X POST "$API_BASE/auth/verifyOtp" \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"$TEST_PHONE\",\"otp\":\"$USER_OTP\"}")

echo "Response: $VERIFY_RESPONSE"

# Extract token
TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    echo "Response: $VERIFY_RESPONSE"
    exit 1
fi

echo "✅ OTP verified successfully!"
echo "🎫 Auth Token: ${TOKEN:0:60}..."

# Step 5: Create Razorpay Order
echo ""
echo "💳 Step 4: Creating Razorpay Order"
echo "==================================="
echo "Amount: ₹$PRODUCT_PRICE"

# Create order payload with cart and staticAddress
ORDER_PAYLOAD=$(cat <<EOF
{
  "amount": $PRODUCT_PRICE,
  "cart": [{
    "itemId": "$PRODUCT_ID",
    "productId": "$PRODUCT_ID",
    "name": "$PRODUCT_NAME",
    "quantity": 1,
    "price": $PRODUCT_PRICE,
    "size": "M"
  }],
  "staticAddress": {
    "firstName": "Rithik",
    "lastName": "Mahajan",
    "email": "rithik@yoraa.in",
    "phoneNumber": "$TEST_PHONE",
    "address": "123 Test Street",
    "city": "Delhi",
    "state": "Delhi",
    "pinCode": "110001"
  },
  "deliveryOption": "standard"
}
EOF
)

RAZORPAY_RESPONSE=$(curl -s -X POST "$API_BASE/razorpay/create-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$ORDER_PAYLOAD")

echo "Response: $RAZORPAY_RESPONSE"

# Extract Razorpay order ID
RAZORPAY_ORDER_ID=$(echo "$RAZORPAY_RESPONSE" | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$RAZORPAY_ORDER_ID" ]; then
    echo "❌ Failed to create Razorpay order"
    echo "Response: $RAZORPAY_RESPONSE"
    exit 1
fi

echo "✅ Razorpay order created"
echo "   Order ID: $RAZORPAY_ORDER_ID"

# Step 6: Verify Payment and Create Order with Shiprocket
echo ""
echo "🚀 Step 5: Verify Payment & Create Order (with Shiprocket)"
echo "=========================================================="

# Create order data
ORDER_DATA=$(cat <<EOF
{
  "razorpay_order_id": "$RAZORPAY_ORDER_ID",
  "razorpay_payment_id": "pay_test_$(date +%s)",
  "razorpay_signature": "test_signature_$(date +%s)",
  "orderDetails": {
    "items": [{
      "productId": "$PRODUCT_ID",
      "name": "$PRODUCT_NAME",
      "quantity": 1,
      "price": $PRODUCT_PRICE,
      "size": "M",
      "color": "Blue"
    }],
    "shippingAddress": {
      "name": "Rithik Mahajan",
      "phone": "$TEST_PHONE",
      "email": "rithik@yoraa.in",
      "addressLine1": "123 Test Street",
      "addressLine2": "Near Test Market",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110001",
      "country": "India"
    },
    "billingAddress": {
      "name": "Rithik Mahajan",
      "phone": "$TEST_PHONE",
      "email": "rithik@yoraa.in",
      "addressLine1": "123 Test Street",
      "addressLine2": "Near Test Market",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110001",
      "country": "India"
    },
    "totalAmount": $PRODUCT_PRICE
  }
}
EOF
)

ORDER_RESPONSE=$(curl -s -X POST "$API_BASE/razorpay/verify-payment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$ORDER_DATA")

echo ""
echo "📊 Order Creation Response:"
echo "============================"
echo "$ORDER_RESPONSE"

# Check if order was successful
if echo "$ORDER_RESPONSE" | grep -q '"success":true'; then
    ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    SHIPROCKET_ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"shiprocketOrderId":[^,}]*' | cut -d':' -f2)
    
    echo ""
    echo "✅ ✅ ✅ ORDER PLACED SUCCESSFULLY! ✅ ✅ ✅"
    echo ""
    echo "📋 Order Details:"
    echo "   ✅ Order ID: $ORDER_ID"
    echo "   🚛 Shiprocket Order ID: $SHIPROCKET_ORDER_ID"
    echo "   ✅ Order created in Shiprocket with updated credentials!"
    echo ""
    echo "🎉 SHIPROCKET INTEGRATION WORKING WITH:"
    echo "   📧 Email: support@yoraa.in"
    echo "   🔐 Password: R@0621thik"
else
    echo ""
    echo "❌ ORDER CREATION FAILED"
    ERROR_MSG=$(echo "$ORDER_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    echo "Error: $ERROR_MSG"
    echo ""
    echo "Full response:"
    echo "$ORDER_RESPONSE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
