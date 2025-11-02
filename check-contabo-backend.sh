#!/bin/bash

# Script to check Contabo backend status and logs
# Run this on your Contabo server via SSH

echo "============================================"
echo "🔍 Checking Contabo Backend Status"
echo "============================================"
echo ""

# Check if backend is running
echo "1️⃣ Checking backend process..."
echo ""
if command -v pm2 &> /dev/null; then
    echo "📊 PM2 Status:"
    pm2 list
    echo ""
    echo "📋 PM2 Logs (last 50 lines):"
    pm2 logs --lines 50 --nostream
elif command -v docker &> /dev/null; then
    echo "🐳 Docker Containers:"
    docker ps | grep -E "yoraa|backend|api"
    echo ""
    echo "📋 Docker Logs (last 50 lines):"
    docker logs --tail 50 $(docker ps -q -f name=yoraa) 2>&1
else
    echo "⚠️ Neither PM2 nor Docker found. Checking processes..."
    ps aux | grep -E "node|npm" | grep -v grep
fi

echo ""
echo "============================================"
echo "2️⃣ Checking Nginx Configuration..."
echo "============================================"
echo ""

if [ -f /etc/nginx/sites-available/api.yoraa.in.net ]; then
    echo "📄 Nginx Config for api.yoraa.in.net:"
    cat /etc/nginx/sites-available/api.yoraa.in.net
    echo ""
elif [ -f /etc/nginx/conf.d/api.yoraa.in.net.conf ]; then
    echo "📄 Nginx Config:"
    cat /etc/nginx/conf.d/api.yoraa.in.net.conf
    echo ""
else
    echo "⚠️ Nginx config not found in standard locations"
fi

echo "🔍 Checking Nginx status:"
sudo nginx -t
sudo systemctl status nginx --no-pager

echo ""
echo "============================================"
echo "3️⃣ Checking Network & Ports..."
echo "============================================"
echo ""

echo "📡 Listening ports:"
sudo netstat -tlnp | grep -E ":80|:443|:8000|:8001|:3000|:5000"

echo ""
echo "============================================"
echo "4️⃣ Testing Backend Endpoints..."
echo "============================================"
echo ""

echo "🧪 Testing GET /api/categories:"
curl -s -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  https://api.yoraa.in.net/api/categories | head -20

echo ""
echo "🧪 Testing POST /api/categories (without auth):"
curl -X POST \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  -m 10 \
  https://api.yoraa.in.net/api/categories 2>&1

echo ""
echo "============================================"
echo "5️⃣ Checking Recent Backend Logs..."
echo "============================================"
echo ""

# Check various log locations
if [ -f ~/backend.log ]; then
    echo "📋 ~/backend.log (last 30 lines):"
    tail -30 ~/backend.log
fi

if [ -f ~/yoraa-backend/backend.log ]; then
    echo "📋 ~/yoraa-backend/backend.log (last 30 lines):"
    tail -30 ~/yoraa-backend/backend.log
fi

if [ -f /var/log/nginx/error.log ]; then
    echo "📋 Nginx Error Log (last 20 lines):"
    sudo tail -20 /var/log/nginx/error.log
fi

if [ -f /var/log/nginx/api.yoraa.in.net.error.log ]; then
    echo "📋 API-specific Nginx Error Log (last 20 lines):"
    sudo tail -20 /var/log/nginx/api.yoraa.in.net.error.log
fi

echo ""
echo "============================================"
echo "✅ Diagnostic Complete!"
echo "============================================"
echo ""
echo "📝 Next Steps:"
echo "   1. Check if backend process is running"
echo "   2. Review Nginx proxy_timeout settings"
echo "   3. Check for POST-specific errors in logs"
echo "   4. Test multer file upload configuration"
echo ""
