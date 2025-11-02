#!/bin/bash

# Backend Deployment Script for Contabo Production Server
# This script deploys the updated backend with multer fixes

set -e  # Exit on any error

echo "============================================"
echo "🚀 Deploying Backend to Contabo Production"
echo "============================================"
echo ""

# Configuration
BACKEND_DIR="~/yoraa-backend"
PM2_APP_NAME="yoraa-backend"
GIT_BRANCH="main"

echo "📦 Step 1: Pulling latest changes from Git..."
cd $BACKEND_DIR || exit 1
git fetch origin
git pull origin $GIT_BRANCH
echo "✅ Code updated"
echo ""

echo "📦 Step 2: Installing dependencies..."
npm install --production
echo "✅ Dependencies installed"
echo ""

echo "🔍 Step 3: Checking environment variables..."
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please create .env file with required variables"
    exit 1
fi
echo "✅ Environment file exists"
echo ""

echo "🔄 Step 4: Restarting PM2 process..."
if pm2 list | grep -q "$PM2_APP_NAME"; then
    pm2 restart $PM2_APP_NAME
    echo "✅ PM2 process restarted"
else
    echo "⚠️  PM2 process not found, starting new instance..."
    pm2 start index.js --name $PM2_APP_NAME
    pm2 save
    echo "✅ PM2 process started"
fi
echo ""

echo "📋 Step 5: Checking application status..."
pm2 status
echo ""

echo "📜 Step 6: Showing recent logs..."
pm2 logs $PM2_APP_NAME --lines 20 --nostream
echo ""

echo "🧪 Step 7: Testing API endpoints..."
sleep 3  # Wait for server to fully start

echo "Testing GET /health..."
curl -s http://localhost:8001/health | head -10
echo ""

echo "Testing GET /api/categories..."
curl -s http://localhost:8001/api/categories | head -10
echo ""

echo "============================================"
echo "✅ Deployment Complete!"
echo "============================================"
echo ""
echo "📝 Changes deployed:"
echo "   ✅ Added multer file size limits (10MB)"
echo "   ✅ Added file type validation (images only)"
echo "   ✅ Added proper error handling for multer errors"
echo "   ✅ Increased server timeout to 5 minutes"
echo "   ✅ Added keep-alive and headers timeout"
echo ""
echo "🔍 Next steps:"
echo "   1. Monitor logs: pm2 logs $PM2_APP_NAME"
echo "   2. Check status: pm2 status"
echo "   3. Test file upload from admin panel"
echo ""
echo "🌐 Production URLs:"
echo "   Backend: https://api.yoraa.in.net"
echo "   Admin Panel: https://yoraa.in.net"
echo ""
