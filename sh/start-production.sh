#!/bin/bash

# Production Environment Start Script
echo "🚀 Starting Yoraa Admin Panel in PRODUCTION mode..."
echo ""

# Color codes for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found!${NC}"
    echo "Creating .env.production file..."
    cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=8000
HOST=0.0.0.0

# Database Configuration - UPDATE WITH YOUR PRODUCTION DATABASE
MONGO_URI=mongodb://localhost:27017/yoraa

# Admin Configuration
ADMIN_PHONE=7006114695
ADMIN_PASSWORD=R@2727thik
ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@yoraa.com

# API Configuration
API_BASE_URL=http://185.193.19.244:8000/api
FRONTEND_URL=http://185.193.19.244:3001

# Security - CHANGE IN PRODUCTION
JWT_SECRET=production-secret-key-change-this
JWT_EXPIRES_IN=7d

# External Services (Add your production keys)
# RAZORPAY_KEY_ID=your_production_key
# RAZORPAY_KEY_SECRET=your_production_secret
# AWS_ACCESS_KEY_ID=your_aws_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret
# AWS_REGION=ap-south-1
# AWS_BUCKET_NAME=your_bucket_name
EOF
    echo -e "${GREEN}✅ .env.production file created${NC}"
    echo -e "${YELLOW}⚠️  Please update production values in .env.production${NC}"
fi

echo -e "${BLUE}📋 Production Configuration:${NC}"
echo -e "  🌐 API URL: http://185.193.19.244:8000/api"
echo -e "  📊 Database: Production MongoDB"
echo -e "  👤 Admin Phone: 7006114695"
echo -e "  🔑 Admin Password: R@2727thik"
echo ""

# Start backend in production mode
echo -e "${YELLOW}🚀 Starting Backend Server...${NC}"
NODE_ENV=production npm run prod

echo ""
echo -e "${GREEN}✅ Production server started successfully!${NC}"
echo -e "${BLUE}📝 Next Steps:${NC}"
echo -e "  1. Ensure frontend is built and deployed"
echo -e "  2. Access admin panel at http://185.193.19.244:3001"
echo -e "  3. Login with phone: 7006114695, password: R@2727thik"
