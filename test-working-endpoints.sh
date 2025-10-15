#!/bin/bash

# Get fresh token
echo "🔑 Getting fresh Shiprocket token..."
TOKEN=$(curl -s -X POST "https://apiv2.shiprocket.in/v1/external/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "contact@yoraa.in", "password": "R@2727thik"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

echo "✅ Token obtained"

# Test alternative courier endpoints
echo ""
echo "🚚 Testing Courier Information Endpoints..."

# Try rate calculation endpoint (sometimes this gives courier info)
echo "Testing rate calculation..."
curl -s -X GET "https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=180001&delivery_postcode=110001&weight=1" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'available_courier_companies' in data:
        couriers = data['available_courier_companies']
        print(f'✅ Found {len(couriers)} available couriers')
        for courier in couriers[:3]:
            print(f'  - {courier.get(\"courier_name\", \"Unknown\")} (ID: {courier.get(\"courier_company_id\", \"N/A\")})')
    elif 'data' in data and 'available_courier_companies' in data['data']:
        couriers = data['data']['available_courier_companies']
        print(f'✅ Found {len(couriers)} available couriers')
        for courier in couriers[:3]:
            print(f'  - {courier.get(\"courier_name\", \"Unknown\")} (ID: {courier.get(\"courier_company_id\", \"N/A\")})')
    else:
        print('❌ Error:', data.get('message', 'Unknown error'))
        print('Response keys:', list(data.keys()) if isinstance(data, dict) else 'Not a dict')
except Exception as e:
    print('❌ Failed to parse response:', str(e))
"

echo ""
echo "💰 Testing Wallet/Account Information..."

# Try to create a test order to see if we get better error messages
echo "Testing order creation permissions..."
curl -s -X POST "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | \
  python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('status_code') == 422:
        print('✅ Order creation endpoint accessible (validation errors expected)')
        print('Required fields:', data.get('message', 'N/A'))
    elif data.get('status_code') == 403:
        print('❌ Order creation forbidden - limited API access')
    else:
        print('Response:', data.get('message', data))
except Exception as e:
    print('❌ Failed to parse response:', str(e))
"

echo ""
echo "📊 Testing Account Status..."

# Check if we can get any account information
curl -s -X GET "https://apiv2.shiprocket.in/v1/external/settings/company/pickup" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'data' in data:
        company = data['data']
        print('Account Information:')
        print(f'  Company: {company.get(\"company_name\", \"N/A\")}')
        print(f'  Email: {company.get(\"shipping_address\", [{}])[0].get(\"email\", \"N/A\")}')
        print(f'  Phone: {company.get(\"shipping_address\", [{}])[0].get(\"phone\", \"N/A\")}')
        print(f'  Verified: {\"Yes\" if company.get(\"shipping_address\", [{}])[0].get(\"phone_verified\") == 1 else \"No\"}')
        print(f'  Status: {\"Active\" if company.get(\"shipping_address\", [{}])[0].get(\"status\") == 2 else \"Pending\"}')
    else:
        print('❌ Error:', data.get('message', 'Unknown error'))
except Exception as e:
    print('❌ Failed to parse response:', str(e))
"

echo ""
echo "🎯 Summary: If serviceability works above, your API access is sufficient for basic operations."
