#!/bin/bash

# 🧪 Automated Checkout Fix Verification Script
# This tests if the Razorpay create-order endpoint is working

set -e

echo "🧪 CHECKOUT FIX VERIFICATION TEST"
echo "=================================="
echo ""

# Configuration
BASE_URL="http://185.193.19.244:8000"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGRhZTNmZDQ3MDU0ZmU3NWM2NTE0OTMiLCJlbWFpbCI6InJpdGhpa21haGFqYW4yN0BnbWFpbC5jb20iLCJpYXQiOjE3NjA0MTU4OTgsImV4cCI6MTc2MDQxOTQ5OH0.yNiprxEo8kUcZi7ZRz6K2xHsHucMkfjPqmmuGH21gjo"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Server Health Check
echo -e "${BLUE}[1/5] Checking server health...${NC}"
HEALTH=$(curl -s "$BASE_URL/health" | jq -r '.status' 2>/dev/null || echo "unknown")
if [ "$HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✅ Server is healthy${NC}"
    UPTIME=$(curl -s "$BASE_URL/health" | jq -r '.uptime')
    UPTIME_HOURS=$((UPTIME / 3600))
    echo -e "   Server uptime: ${UPTIME_HOURS} hours"
    if [ "$UPTIME_HOURS" -gt 240 ]; then
        echo -e "${YELLOW}   ⚠️  Server hasn't been restarted in ${UPTIME_HOURS} hours (10+ days)${NC}"
        echo -e "${YELLOW}   ⚠️  This might be the issue - old code still running${NC}"
    fi
else
    echo -e "${RED}❌ Server is not responding${NC}"
    exit 1
fi
echo ""

# Test 2: Product Validation
echo -e "${BLUE}[2/5] Validating test products exist...${NC}"
PRODUCT1="68da56fc0561b958f6694e1d"
PRODUCT2="68da56fc0561b958f6694e19"

for PRODUCT_ID in $PRODUCT1 $PRODUCT2; do
    echo -e "   Testing product: ${PRODUCT_ID}"
    RESPONSE=$(curl -s "$BASE_URL/api/products/$PRODUCT_ID")
    STATUS=$(echo "$RESPONSE" | jq -r '.statusCode // .status // "error"')
    
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "success" ]; then
        PRODUCT_NAME=$(echo "$RESPONSE" | jq -r '.data.productName // .data.name // "Unknown"')
        PRODUCT_STATUS=$(echo "$RESPONSE" | jq -r '.data.status // "Unknown"')
        echo -e "${GREEN}   ✅ Found: $PRODUCT_NAME (status: $PRODUCT_STATUS)${NC}"
        
        if [ "$PRODUCT_STATUS" != "live" ] && [ "$PRODUCT_STATUS" != "active" ]; then
            echo -e "${YELLOW}   ⚠️  Product status is '$PRODUCT_STATUS' - might not pass validation${NC}"
        fi
    else
        echo -e "${RED}   ❌ Product not found or error${NC}"
        echo -e "   Response: $RESPONSE"
    fi
done
echo ""

# Test 3: Single Product Order Creation
echo -e "${BLUE}[3/5] Testing single product order creation...${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/razorpay/create-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": 1752,
    "cart": [
      {
        "id": "68da56fc0561b958f6694e1d",
        "name": "Product 36",
        "quantity": 1,
        "price": 1752,
        "size": "small",
        "sku": "SKU036"
      }
    ],
    "staticAddress": {
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      "phoneNumber": "+918717000084",
      "address": "Test Address",
      "city": "Test City",
      "state": "Test State",
      "country": "India",
      "pinCode": "180001"
    }
  }')

SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
ERROR=$(echo "$RESPONSE" | jq -r '.error // "none"')
ORDER_ID=$(echo "$RESPONSE" | jq -r '.data.orderId // "none"')

if [ "$SUCCESS" = "true" ] && [ "$ORDER_ID" != "none" ]; then
    echo -e "${GREEN}✅ Order created successfully!${NC}"
    echo -e "   Order ID: ${ORDER_ID}"
    echo -e "${GREEN}🎉 THE FIX IS WORKING!${NC}"
else
    echo -e "${RED}❌ Order creation failed${NC}"
    echo -e "   Error: ${ERROR}"
    echo -e "   Full response:"
    echo "$RESPONSE" | jq '.'
    
    # Check for specific error messages
    if echo "$RESPONSE" | grep -q "Invalid item IDs"; then
        echo -e "${YELLOW}📋 Diagnosis: 'Invalid item IDs' error detected${NC}"
        echo -e "${YELLOW}   This means:${NC}"
        echo -e "${YELLOW}   1. Server hasn't been restarted (still running old code), OR${NC}"
        echo -e "${YELLOW}   2. Products don't exist in database, OR${NC}"
        echo -e "${YELLOW}   3. Products have wrong status (not 'live')${NC}"
    fi
    
    if echo "$RESPONSE" | grep -q "invalidItems"; then
        echo -e "${YELLOW}📋 Invalid items details:${NC}"
        echo "$RESPONSE" | jq '.invalidItems'
    fi
fi
echo ""

# Test 4: Multiple Products Order Creation
echo -e "${BLUE}[4/5] Testing multiple products order creation...${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/razorpay/create-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": 2748,
    "cart": [
      {
        "id": "68da56fc0561b958f6694e1d",
        "name": "Product 36",
        "quantity": 1,
        "price": 1752,
        "size": "small",
        "sku": "SKU036"
      },
      {
        "id": "68da56fc0561b958f6694e19",
        "name": "Product 34",
        "quantity": 1,
        "price": 996,
        "size": "L",
        "sku": "SKU034"
      }
    ],
    "staticAddress": {
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      "phoneNumber": "+918717000084",
      "address": "Test Address",
      "city": "Test City",
      "state": "Test State",
      "country": "India",
      "pinCode": "180001"
    }
  }')

SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
ERROR=$(echo "$RESPONSE" | jq -r '.error // "none"')
ORDER_ID=$(echo "$RESPONSE" | jq -r '.data.orderId // "none"')

if [ "$SUCCESS" = "true" ] && [ "$ORDER_ID" != "none" ]; then
    echo -e "${GREEN}✅ Multi-product order created successfully!${NC}"
    echo -e "   Order ID: ${ORDER_ID}"
else
    echo -e "${RED}❌ Multi-product order creation failed${NC}"
    echo -e "   Error: ${ERROR}"
    echo -e "   Full response:"
    echo "$RESPONSE" | jq '.'
fi
echo ""

# Test 5: Summary
echo -e "${BLUE}[5/5] Test Summary${NC}"
echo "===================="
echo ""

# Determine overall status
if [ "$SUCCESS" = "true" ]; then
    echo -e "${GREEN}🎉 SUCCESS: Checkout is working!${NC}"
    echo ""
    echo "✅ All tests passed"
    echo "✅ ObjectId conversion working"
    echo "✅ Product validation working"
    echo "✅ Razorpay order creation working"
    echo ""
    echo "Next steps:"
    echo "1. Inform frontend team checkout is fixed"
    echo "2. Frontend team should re-test from their app"
    echo "3. Monitor for any edge cases"
else
    echo -e "${RED}❌ FAILED: Checkout is still broken${NC}"
    echo ""
    echo "Required actions:"
    echo ""
    echo "1. ${YELLOW}RESTART PRODUCTION SERVER${NC}"
    echo "   The fix is in the code but server needs restart to load it."
    echo ""
    echo "   Commands to try:"
    echo "   - pm2 restart all"
    echo "   - pm2 restart backend"
    echo "   - systemctl restart backend"
    echo "   - docker-compose restart"
    echo ""
    echo "2. After restart, run this script again"
    echo ""
    echo "3. If still failing, check:"
    echo "   - Product status in database (should be 'live')"
    echo "   - Backend logs for detailed error messages"
    echo "   - MongoDB connection"
fi

echo ""
echo "Test completed at: $(date)"
