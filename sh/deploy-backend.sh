#!/bin/bash

# Yoraa Backend Deployment Script
# This script deploys only the backend files (excluding admin panel) to the server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - Update these variables according to your server setup
SERVER_USER="root"
SERVER_HOST="185.193.19.244"
SERVER_PATH="/var/www/yoraa-backend"
SSH_KEY_PATH="$HOME/.ssh/contabo_server"  # Update this path to your SSH key

echo -e "${YELLOW}🚀 Starting Yoraa Backend Deployment...${NC}"

# Function to check if required variables are set
check_config() {
    if [ "$SERVER_USER" = "your-username" ] || [ "$SERVER_HOST" = "your-server-ip-or-domain" ]; then
        echo -e "${RED}❌ Please update the server configuration in this script:${NC}"
        echo "   - SERVER_USER: Your server username"
        echo "   - SERVER_HOST: Your server IP or domain"
        echo "   - SERVER_PATH: Path where backend should be deployed"
        echo "   - SSH_KEY_PATH: Path to your SSH private key"
        exit 1
    fi
}

# Function to create remote directory structure
setup_remote_directory() {
    echo -e "${YELLOW}📁 Setting up remote directory structure...${NC}"
    ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" "mkdir -p $SERVER_PATH"
}

# Function to sync backend files
sync_backend_files() {
    echo -e "${YELLOW}📦 Syncing backend files to server...${NC}"
    
    # Rsync backend files excluding admin panel and development files
    rsync -avz --progress \
        --exclude-from='.deployignore' \
        --exclude='final/' \
        --exclude='node_modules/' \
        --exclude='.git/' \
        --exclude='.env*' \
        --exclude='*.log' \
        --exclude='.DS_Store' \
        --delete \
        -e "ssh -i $SSH_KEY_PATH" \
        ./ "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"
    
    echo -e "${GREEN}✅ Files synced successfully${NC}"
}

# Function to install dependencies on server
install_dependencies() {
    echo -e "${YELLOW}📦 Installing dependencies on server...${NC}"
    ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && npm install --production"
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Function to restart the application using PM2
restart_application() {
    echo -e "${YELLOW}🔄 Restarting application with PM2...${NC}"
    ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && pm2 restart ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production"
    echo -e "${GREEN}✅ Application restarted${NC}"
}

# Function to check application status
check_status() {
    echo -e "${YELLOW}🔍 Checking application status...${NC}"
    ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" "pm2 status yoraa-api"
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
}

# Main deployment flow
main() {
    check_config
    setup_remote_directory
    sync_backend_files
    install_dependencies
    restart_application
    check_status
    
    echo -e "${GREEN}🎉 Backend deployment completed successfully!${NC}"
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "   1. Make sure your .env file is properly configured on the server"
    echo "   2. Check the application logs: ssh $SERVER_USER@$SERVER_HOST 'pm2 logs yoraa-api'"
    echo "   3. Monitor the application: ssh $SERVER_USER@$SERVER_HOST 'pm2 monit'"
}

# Run the deployment
main "$@"
