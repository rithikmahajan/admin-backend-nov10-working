#!/bin/bash

echo ""
echo "🎯 YORAA - COMPLETE ORDER PLAC    echo "🔐 Step 3: Verifying OTP"
    echo "========================="
    
    VERIFY_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/verifyOtp \
      -H "Content-Type: application/json" \
      -d "{\"phone\":\"$TEST_PHONE\",\"otp\":\"$OTP\"}")TEST"
echo "=========================================="
echo "Testing with updated Shiprocket credentials:"
echo "✅ Email: support@yoraa.in"
echo "✅ Password: R@0621thik"
echo "=========================================="
echo ""

# Step 1: Get Products
echo "📦 Step 1: Fetching Products"
echo "============================="
PRODUCTS=$(curl -s http://localhost:8000/api/products?limit=1)
echo "$PRODUCTS"

PRODUCT_ID=$(echo "$PRODUCTS" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
PRODUCT_NAME=$(echo "$PRODUCTS" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
PRODUCT_PRICE=$(echo "$PRODUCTS" | grep -o '"price":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$PRODUCT_ID" ]; then
    echo ""
    echo "✅ Product found: $PRODUCT_NAME"
    echo "   ID: $PRODUCT_ID"
    echo "   Price: ₹$PRODUCT_PRICE"
else
    echo "❌ No products found"
    exit 1
fi

echo ""
echo "📱 Step 2: Sending OTP"
echo "======================="
TEST_PHONE="7006114695"
echo "Phone: $TEST_PHONE"
echo ""

OTP_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/generate-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$TEST_PHONE\"}")

echo "Response:"
echo "$OTP_RESPONSE"

# Extract OTP if present in response (for testing environments)
OTP=$(echo "$OTP_RESPONSE" | grep -o '"otp":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -n "$OTP" ]; then
    echo "✅ OTP found in response: $OTP"
    echo ""
    echo "🚀 Continuing with order placement..."
    echo ""
    
    # Step 3: Verify OTP
    echo "🔐 Step 3: Verifying OTP"
    echo "========================="
    
    VERIFY_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/verify-otp \
      -H "Content-Type: application/json" \
      -d "{\"phone\":\"$TEST_PHONE\",\"otp\":\"$OTP\"}")
    
    echo "$VERIFY_RESPONSE"
    
    TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
        echo ""
        echo "✅ OTP verified successfully"
        echo "🎫 Token: ${TOKEN:0:50}..."
        
        echo ""
        echo "💳 Step 4: Creating Razorpay Order"
        echo "==================================="
        
        RAZORPAY_RESPONSE=$(curl -s -X POST http://localhost:8000/api/payment/create-order \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d "{\"amount\":$PRODUCT_PRICE,\"currency\":\"INR\"}")
        
        echo "$RAZORPAY_RESPONSE"
        
        RAZORPAY_ORDER_ID=$(echo "$RAZORPAY_RESPONSE" | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$RAZORPAY_ORDER_ID" ]; then
            echo ""
            echo "✅ Razorpay order created: $RAZORPAY_ORDER_ID"
            
            echo ""
            echo "📦 Step 5: Placing Order with Shiprocket"
            echo "========================================="
            
            # Create mock payment data
            PAYMENT_ID="pay_test_$(date +%s)"
            SIGNATURE="test_signature_$(date +%s)"
            
            ORDER_DATA="{
                \"razorpay_order_id\": \"$RAZORPAY_ORDER_ID\",
                \"razorpay_payment_id\": \"$PAYMENT_ID\",
                \"razorpay_signature\": \"$SIGNATURE\",
                \"orderDetails\": {
                    \"items\": [{
                        \"productId\": \"$PRODUCT_ID\",
                        \"name\": \"$PRODUCT_NAME\",
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
                        \"addressLine2\": \"Apartment 4B\",
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
            echo "📋 Final Order Response:"
            echo "========================"
            echo "$ORDER_RESPONSE"
            
            # Check if order was successful
            if echo "$ORDER_RESPONSE" | grep -q '"success":true'; then
                echo ""
                echo "✅ ✅ ✅ ORDER PLACED SUCCESSFULLY! ✅ ✅ ✅"
                ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
                SHIPROCKET_ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"shiprocketOrderId":[0-9]*' | cut -d':' -f2)
                echo "📋 Order ID: $ORDER_ID"
                echo "🚛 Shiprocket Order ID: $SHIPROCKET_ORDER_ID"
                echo ""
                echo "✅ Updated Shiprocket credentials are working perfectly!"
            else
                echo ""
                echo "⚠️ Order placement completed but check response for details"
            fi
        else
            echo "❌ Failed to create Razorpay order"
        fi
    else
        echo "❌ Failed to verify OTP"
    fi
else
    echo "⏸️  MANUAL STEP REQUIRED:"
    echo ""
    echo "1. Check OTP for phone: $TEST_PHONE"
    echo "2. Run the following command with the OTP:"
    echo ""
    echo "   ./place-order-with-otp.sh $PRODUCT_ID $PRODUCT_PRICE <OTP>"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
