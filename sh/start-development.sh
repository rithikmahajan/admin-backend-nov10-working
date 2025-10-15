#!/bin/bash

# Development Environment Start Script
echo "🔧 Starting Yoraa Admin Panel in DEVELOPMENT mode..."
echo ""

# Color codes for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.development exists
if [ ! -f ".env.development" ]; then
    echo -e "${RED}❌ .env.development file not found!${NC}"
    echo "Creating .env.development file..."
    cat > .env.development << EOF
# Development Environment Configuration
NODE_ENV=development
PORT=8000
HOST=0.0.0.0

# Database Configuration
MONGO_URI=mongodb://localhost:27017/yoraa

# Admin Configuration
ADMIN_PHONE=7006114695
ADMIN_PASSWORD=R@2727thik
ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@yoraa.com

# API Configuration
API_BASE_URL=http://localhost:8000/api
FRONTEND_URL=http://localhost:3001

# Security
JWT_SECRET=development-secret-key
JWT_EXPIRES_IN=7d
EOF
    echo -e "${GREEN}✅ .env.development file created${NC}"
fi

echo -e "${BLUE}📋 Development Configuration:${NC}"
echo -e "  🌐 API URL: http://localhost:8000/api"
echo -e "  📊 Database: Local MongoDB (mongodb://localhost:27017/yoraa)"
echo -e "  👤 Admin Phone: 7006114695"
echo -e "  🔑 Admin Password: R@2727thik"
echo ""

# Start backend in development mode
echo -e "${YELLOW}🚀 Starting Backend Server...${NC}"
NODE_ENV=development npm run dev

echo ""
echo -e "${GREEN}✅ Development server started successfully!${NC}"
echo -e "${BLUE}📝 Next Steps:${NC}"
echo -e "  1. Open another terminal and navigate to 'final' folder"
echo -e "  2. Run: npm run dev"
echo -e "  3. Access admin panel at http://localhost:3001"
echo -e "  4. Login with phone: 7006114695, password: R@2727thik"
