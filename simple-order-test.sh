#!/bin/bash

# Simple standalone order test - no server imports

API_BASE="http://localhost:8000/api"
TEST_PHONE="7006114695"

echo "🎯 Testing Order Placement"
echo "=========================="

# Step 1: Generate OTP
echo "Generating OTP..."
OTP_RESP=$(curl -s -X POST "$API_BASE/auth/generate-otp" -H "Content-Type: application/json" -d '{"phoneNumber":"'$TEST_PHONE'"}')
OTP=$(echo "$OTP_RESP" | grep -o '"otp":"[^"]*"' | cut -d'"' -f4)

echo "OTP: $OTP"
echo ""
read -p "Press Enter to continue with OTP $OTP..."

# Step 2: Verify OTP
echo "Verifying OTP..."
TOKEN_RESP=$(curl -s -X POST "$API_BASE/auth/verifyOtp" -H "Content-Type: application/json" -d '{"phoneNumber":"'$TEST_PHONE'","otp":"'$OTP'"}')
TOKEN=$(echo "$TOKEN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token: ${TOKEN:0:50}..."
echo ""

# Step 3: Create order
echo "Creating order..."
ORDER_RESP=$(curl -s -X POST "$API_BASE/razorpay/create-order" \
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
      "phoneNumber": "'$TEST_PHONE'",
      "address": "123 Test Street",
      "city": "Delhi",
      "state": "Delhi",
      "pinCode": "110001"
    },
    "deliveryOption": "standard"
  }')

echo ""
echo "ORDER RESPONSE:"
echo "$ORDER_RESP"
