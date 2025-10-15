#!/bin/bash

# Yoraa Backend Deployment Verification Script
# This script verifies that the backend deployment was successful

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration - Update these to match your deployment
SERVER_USER="root"
SERVER_HOST="185.193.19.244"
SERVER_PORT="8080"
SSH_KEY_PATH="~/.ssh/contabo_server"

echo -e "${YELLOW}🔍 Verifying Yoraa Backend Deployment...${NC}"

# Function to check if server configuration is updated
check_config() {
    if [ "$SERVER_USER" = "your-username" ] || [ "$SERVER_HOST" = "your-server-ip-or-domain" ]; then
        echo -e "${RED}❌ Please update the server configuration in this script${NC}"
        exit 1
    fi
}

# Function to check PM2 status
check_pm2_status() {
    echo -e "${YELLOW}📊 Checking PM2 status...${NC}"
    ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" "pm2 status yoraa-api" || {
        echo -e "${RED}❌ PM2 process not found or not running${NC}"
        return 1
    }
    echo -e "${GREEN}✅ PM2 process is running${NC}"
}

# Function to check health endpoint
check_health_endpoint() {
    echo -e "${YELLOW}🏥 Checking health endpoint...${NC}"
    ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" "curl -f http://localhost:$SERVER_PORT/health" || {
        echo -e "${RED}❌ Health endpoint not responding${NC}"
        return 1
    }
    echo -e "${GREEN}✅ Health endpoint is responding${NC}"
}

# Function to check API endpoint
check_api_endpoint() {
    echo -e "${YELLOW}🔌 Checking API health endpoint...${NC}"
    ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" "curl -f http://localhost:$SERVER_PORT/api/health" || {
        echo -e "${RED}❌ API health endpoint not responding${NC}"
        return 1
    }
    echo -e "${GREEN}✅ API health endpoint is responding${NC}"
}

# Function to check logs for errors
check_logs() {
    echo -e "${YELLOW}📋 Checking recent logs for errors...${NC}"
    ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" "pm2 logs yoraa-api --lines 20 --nostream" | grep -i error && {
        echo -e "${YELLOW}⚠️  Found some errors in logs - please review${NC}"
    } || {
        echo -e "${GREEN}✅ No recent errors found in logs${NC}"
    }
}

# Function to verify backend files are present
check_backend_files() {
    echo -e "${YELLOW}📁 Verifying backend files are present...${NC}"
    
    # Check if main files exist
    ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" "
        if [ -f /var/www/yoraa-backend/index.js ] && 
           [ -f /var/www/yoraa-backend/package.json ] && 
           [ -d /var/www/yoraa-backend/src ]; then
            echo 'Backend files found'
            exit 0
        else
            echo 'Backend files missing'
            exit 1
        fi
    " || {
        echo -e "${RED}❌ Backend files are missing${NC}"
        return 1
    }
    echo -e "${GREEN}✅ Backend files are present${NC}"
}

# Function to verify admin panel is excluded
check_admin_exclusion() {
    echo -e "${YELLOW}🚫 Verifying admin panel is excluded...${NC}"
    ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" "
        if [ -d /var/www/yoraa-backend/final ]; then
            echo 'Admin panel found - should be excluded'
            exit 1
        else
            echo 'Admin panel correctly excluded'
            exit 0
        fi
    " || {
        echo -e "${RED}❌ Admin panel directory found - deployment may have included frontend${NC}"
        return 1
    }
    echo -e "${GREEN}✅ Admin panel correctly excluded from deployment${NC}"
}

# Function to show deployment summary
show_summary() {
    echo -e "\n${GREEN}🎉 Deployment Verification Summary:${NC}"
    echo -e "${GREEN}✅ Backend deployment successful${NC}"
    echo -e "${GREEN}✅ Application is running and healthy${NC}"
    echo -e "${GREEN}✅ API endpoints are responding${NC}"
    echo -e "${GREEN}✅ Admin panel correctly excluded${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "   • Monitor logs: ssh $SERVER_USER@$SERVER_HOST 'pm2 logs yoraa-api'"
    echo "   • Check metrics: ssh $SERVER_USER@$SERVER_HOST 'pm2 monit'"
    echo "   • Test API endpoints from your frontend application"
    echo ""
    echo -e "${GREEN}🌐 Your backend is ready at: http://$SERVER_HOST:$SERVER_PORT${NC}"
}

# Main verification flow
main() {
    check_config
    check_backend_files
    check_admin_exclusion
    check_pm2_status
    check_health_endpoint
    check_api_endpoint
    check_logs
    show_summary
}

# Run the verification
main "$@"
