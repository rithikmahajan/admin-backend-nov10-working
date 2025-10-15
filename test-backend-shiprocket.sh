#!/bin/bash

# Shiprocket API Test Script for Yoraa Backend
# Run this when your server is running on localhost:8001

echo "🚀 Testing Yoraa Backend Shiprocket Integration..."
echo "=================================================="

BASE_URL="http://localhost:8001/api"

echo ""
echo "1️⃣ Testing Health Check..."
curl -s "$BASE_URL/health" | head -1
echo ""

echo "2️⃣ Testing Shiprocket Authentication..."
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/orders/shiprocket/auth" -H "Content-Type: application/json")
echo "Response: $AUTH_RESPONSE"
echo ""

echo "3️⃣ Testing Backend API Status..."
curl -s "$BASE_URL/status" | head -1
echo ""

echo "4️⃣ Available Shiprocket Endpoints in your backend:"
echo "   - POST $BASE_URL/orders/shiprocket/auth"
echo "   - GET $BASE_URL/orders/shiprocket/track/:awbCode"
echo "   - POST $BASE_URL/orders/create-shiprocket-order/:orderId"
echo "   - POST $BASE_URL/admin/orders/:orderId/create-shiprocket-order"
echo "   - GET $BASE_URL/admin/shiprocket/wallet-balance"
echo ""

echo "✅ Test complete! Run 'npm start' first if server is not running."
