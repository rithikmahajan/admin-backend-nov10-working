#!/bin/bash

# 🔍 RAZORPAY ORDER CREATION - SIMPLE CURL TEST
# This script tests order creation on both LOCAL and PRODUCTION backends

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 RAZORPAY ORDER CREATION TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if auth token is provided
if [ -z "$AUTH_TOKEN" ]; then
  echo -e "${RED}❌ ERROR: No auth token provided${NC}"
  echo ""
  echo "To get your auth token:"
  echo "1. Open your mobile app or web app"
  echo "2. Login with your account"
  echo "3. Open browser dev tools > Network tab"
  echo "4. Make any API call (like viewing products)"
  echo "5. Click on the request > Headers tab"
  echo "6. Copy the 'Authorization' header value (without 'Bearer ' prefix)"
  echo ""
  echo "Then run:"
  echo "  export AUTH_TOKEN=\"your_token_here\""
  echo "  ./test-razorpay-order.sh"
  echo ""
  exit 1
fi

echo -e "${BLUE}📝 Configuration:${NC}"
echo "  Product ID: 68da56fc0561b958f6694e1d"
echo "  User ID: 68dae3fd47054fe75c651493"
echo "  Auth Token: ${AUTH_TOKEN:0:20}..."
echo ""

# Test payload
PAYLOAD='{
  "amount": 1752,
  "cart": [{
    "id": "68da56fc0561b958f6694e1d",
    "itemId": "68da56fc0561b958f6694e1d",
    "name": "Product 36",
    "quantity": 1,
    "price": 1752,
    "size": "small",
    "sku": "PROD-36-SMALL"
  }],
  "staticAddress": {
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phoneNumber": "9876543210",
    "address": "123 Test Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pinCode": "400001",
    "country": "India"
  },
  "userId": "68dae3fd47054fe75c651493",
  "paymentMethod": "razorpay",
  "deliveryOption": "standard"
}'

# Function to test an endpoint
test_endpoint() {
  local ENV_NAME=$1
  local URL=$2
  local ICON=$3
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${YELLOW}$ICON $ENV_NAME BACKEND TEST${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo -e "${BLUE}📡 Testing: $URL/api/razorpay/create-order${NC}"
  echo ""
  
  # Make request and save response
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$URL/api/razorpay/create-order" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "$PAYLOAD" \
    --connect-timeout 10 \
    --max-time 15)
  
  # Check if curl failed
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ CONNECTION FAILED${NC}"
    echo ""
    if [[ "$ENV_NAME" == "LOCAL" ]]; then
      echo "💡 Your local backend is not running!"
      echo ""
      echo "To start it:"
      echo "  cd /path/to/backend"
      echo "  PORT=8001 npm start"
      echo ""
    else
      echo "💡 Production backend may be down or firewall blocking."
      echo ""
    fi
    return 1
  fi
  
  # Extract status code (last line) and response body (everything else)
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
  
  echo -e "${BLUE}📥 Response Status: $HTTP_CODE${NC}"
  echo ""
  echo "Response Body:"
  echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
  echo ""
  
  # Analyze response
  if echo "$RESPONSE_BODY" | grep -q '"orderId"'; then
    ORDER_ID=$(echo "$RESPONSE_BODY" | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ ORDER CREATION SUCCESSFUL!${NC}"
    echo -e "${GREEN}   Order ID: $ORDER_ID${NC}"
    echo -e "${GREEN}   ObjectId Fix: APPLIED ✓${NC}"
    echo ""
  elif echo "$RESPONSE_BODY" | grep -qi "invalid item"; then
    echo -e "${RED}❌ ORDER CREATION FAILED!${NC}"
    echo -e "${RED}   Error: Invalid item IDs${NC}"
    echo -e "${RED}   ObjectId Fix: NOT APPLIED ✗${NC}"
    echo ""
    echo "🔥 DIAGNOSIS: Backend cannot find products"
    echo "   Reason: String IDs not converted to ObjectId"
    echo ""
    if [[ "$ENV_NAME" == "LOCAL" ]]; then
      echo "💡 FIX for LOCAL:"
      echo "   1. Check if ObjectId conversion is in your code:"
      echo "      grep -n 'mongoose.Types.ObjectId' src/controllers/paymentController/paymentController.js"
      echo "   2. If missing, apply fix from URGENT_BACKEND_FIX_NOT_APPLIED.md"
      echo "   3. Restart backend: PORT=8001 npm start"
      echo ""
    else
      echo "💡 FIX for PRODUCTION:"
      echo "   1. SSH into server: ssh root@185.193.19.244"
      echo "   2. Apply ObjectId fix to backend code"
      echo "   3. Restart backend: pm2 restart all"
      echo "   4. Run this test again"
      echo ""
    fi
  elif echo "$RESPONSE_BODY" | grep -qi "unauthorized\|authentication\|token"; then
    echo -e "${RED}❌ AUTHENTICATION FAILED!${NC}"
    echo -e "${RED}   Error: Invalid or expired token${NC}"
    echo ""
    echo "💡 FIX: Get a fresh auth token:"
    echo "   1. Login to your app again"
    echo "   2. Copy new token from Network tab"
    echo "   3. Run: export AUTH_TOKEN=\"new_token\""
    echo "   4. Run this test again"
    echo ""
  else
    echo -e "${YELLOW}⚠️  UNEXPECTED RESPONSE${NC}"
    echo ""
  fi
  
  return 0
}

# Test LOCAL backend
test_endpoint "LOCAL" "http://localhost:8001" "🏠"

echo ""

# Test PRODUCTION backend  
test_endpoint "PRODUCTION" "http://185.193.19.244:8000" "🌍"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 TEST COMPLETE${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
