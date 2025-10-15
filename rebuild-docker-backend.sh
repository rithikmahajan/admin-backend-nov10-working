#!/bin/bash

# 🔧 Rebuild Docker Backend Container with ObjectId Fix
# =====================================================

echo "🚀 Rebuilding Docker Backend with Updated Code..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# SSH into production server and rebuild
ssh -o ConnectTimeout=10 root@185.193.19.244 << 'ENDSSH'

set -e  # Exit on error

echo "📂 Navigating to backend directory..."
cd /var/www/yoraa-backend

echo ""
echo "🛑 Stopping current container..."
docker stop yoraa-api-prod || true

echo ""
echo "🧹 Removing old container..."
docker rm yoraa-api-prod || true

echo ""
echo "🔨 Rebuilding Docker image with latest code..."
docker compose build --no-cache yoraa-backend-prod || docker-compose build --no-cache yoraa-backend-prod

echo ""
echo "🚀 Starting new container..."
docker compose up -d yoraa-backend-prod || docker-compose up -d yoraa-backend-prod

echo ""
echo "⏳ Waiting for container to be healthy..."
sleep 10

echo ""
echo "✅ Checking container status..."
docker ps | grep yoraa-api-prod

echo ""
echo "🔍 Verifying ObjectId fix is present..."
if docker exec yoraa-api-prod grep -q "const objectIds = productIds.map" /app/src/controllers/paymentController/paymentController.js; then
    echo "✅ ObjectId conversion code found in container!"
else
    echo "❌ WARNING: ObjectId fix not found in container"
    exit 1
fi

echo ""
echo "📋 Checking container logs..."
docker logs --tail 20 yoraa-api-prod

ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Docker container rebuilt successfully!${NC}"
    echo ""
    echo "🧪 Testing the fix..."
    echo ""
    
    # Wait a bit more for the server to fully start
    sleep 5
    
    # Test the health endpoint
    echo "Testing health endpoint..."
    curl -s http://185.193.19.244:8080/health | jq . || echo "Health check response received"
    
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: You need a valid auth token to test checkout${NC}"
    echo "Test command:"
    echo ""
    echo 'curl -X POST http://185.193.19.244:8080/api/razorpay/create-order \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -H "Authorization: Bearer YOUR_VALID_TOKEN" \'
    echo '  -d '"'"'{'
    echo '    "amount": 1752,'
    echo '    "cart": [{'
    echo '      "id": "68da56fc0561b958f6694e1d",'
    echo '      "name": "Product 36",'
    echo '      "quantity": 1,'
    echo '      "price": 1752,'
    echo '      "size": "small",'
    echo '      "sku": "SKU036"'
    echo '    }],'
    echo '    "staticAddress": {...},'
    echo '    "userId": "68dae3fd47054fe75c651493",'
    echo '    "paymentMethod": "razorpay"'
    echo '  }'"'"
    echo ""
    echo -e "${GREEN}🎉 Backend is ready! Test checkout from your mobile app.${NC}"
else
    echo ""
    echo -e "${RED}❌ Failed to rebuild Docker container${NC}"
    exit 1
fi
