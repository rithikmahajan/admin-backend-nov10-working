#!/bin/bash

# Quick Test Script for /api/user/profile endpoints
# Tests the newly added alias routes for mobile app compatibility

echo "🧪 Testing /api/user/profile Endpoints"
echo "======================================="
echo ""

# Configuration
BASE_URL="http://localhost:8000"
PHONE="1234567890"  # Replace with your test user phone
PASSWORD="test123"   # Replace with your test user password

echo "📝 Configuration:"
echo "   Base URL: $BASE_URL"
echo "   Phone: $PHONE"
echo ""

# Step 1: Login to get token
echo "Step 1: Logging in to get authentication token..."
echo "------------------------------------------------"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"phNo\":\"$PHONE\",\"password\":\"$PASSWORD\"}")

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token (assuming the response has a token field)
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // .data.token // empty' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Failed to get authentication token!"
  echo "   Please check your credentials and try again."
  echo ""
  echo "   Expected response format:"
  echo "   { \"token\": \"your_jwt_token_here\" }"
  echo ""
  exit 1
fi

echo "✅ Successfully obtained token: ${TOKEN:0:20}..."
echo ""

# Step 2: Test GET /api/user/profile
echo "Step 2: Testing GET /api/user/profile..."
echo "----------------------------------------"

GET_RESPONSE=$(curl -s -X GET "$BASE_URL/api/user/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "GET Response:"
echo "$GET_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_RESPONSE"
echo ""

# Check if GET was successful
if echo "$GET_RESPONSE" | grep -q '"success":true' || echo "$GET_RESPONSE" | grep -q '"id"'; then
  echo "✅ GET /api/user/profile - SUCCESS"
else
  echo "❌ GET /api/user/profile - FAILED"
fi
echo ""

# Step 3: Test PUT /api/user/profile
echo "Step 3: Testing PUT /api/user/profile..."
echo "----------------------------------------"

# Prepare test data
UPDATE_DATA='{
  "firstName": "Test",
  "lastName": "User",
  "gender": "Male"
}'

PUT_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/user/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_DATA")

echo "PUT Response:"
echo "$PUT_RESPONSE" | jq '.' 2>/dev/null || echo "$PUT_RESPONSE"
echo ""

# Check if PUT was successful
if echo "$PUT_RESPONSE" | grep -q '"success":true' || echo "$PUT_RESPONSE" | grep -q '"message":"Profile updated successfully"'; then
  echo "✅ PUT /api/user/profile - SUCCESS"
else
  echo "❌ PUT /api/user/profile - FAILED"
fi
echo ""

# Step 4: Verify the update by getting profile again
echo "Step 4: Verifying update (GET again)..."
echo "---------------------------------------"

VERIFY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/user/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "Verification Response:"
echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"
echo ""

# Check if firstName and gender were updated
if echo "$VERIFY_RESPONSE" | grep -q '"firstName":"Test"' && echo "$VERIFY_RESPONSE" | grep -q '"gender":"Male"'; then
  echo "✅ Profile update verified - Changes persisted"
else
  echo "⚠️  Could not verify all changes (might still be working)"
fi
echo ""

# Step 5: Test original endpoint for comparison
echo "Step 5: Testing original /api/profile endpoint..."
echo "-------------------------------------------------"

ORIGINAL_RESPONSE=$(curl -s -X GET "$BASE_URL/api/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "Original Endpoint Response:"
echo "$ORIGINAL_RESPONSE" | jq '.' 2>/dev/null || echo "$ORIGINAL_RESPONSE"
echo ""

# Compare responses
if [ "$VERIFY_RESPONSE" == "$ORIGINAL_RESPONSE" ]; then
  echo "✅ Both endpoints return identical data - Alias working correctly!"
else
  echo "⚠️  Endpoints return different data - May need investigation"
fi
echo ""

# Summary
echo "========================================="
echo "📊 Test Summary"
echo "========================================="
echo ""
echo "Endpoints Tested:"
echo "  ✓ POST /api/auth/login"
echo "  ✓ GET  /api/user/profile (new alias)"
echo "  ✓ PUT  /api/user/profile (new alias)"
echo "  ✓ GET  /api/profile (original)"
echo ""
echo "🎯 Status: Testing Complete"
echo ""
echo "Next Steps:"
echo "1. Review the responses above"
echo "2. Verify mobile app works with /api/user/profile"
echo "3. Update documentation if needed"
echo ""
echo "📚 For more information, see:"
echo "   - API_USER_PROFILE_ENDPOINT_FIX.md"
echo "   - BACKEND_API_DOCUMENTATION_INDEX.md"
echo ""
