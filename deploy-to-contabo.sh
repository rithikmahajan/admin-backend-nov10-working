#!/bin/bash

# 🚀 Yoraa Backend - Contabo Deployment Script
# This script automates the deployment of your backend to Contabo using Docker

set -e  # Exit on any error

# ========================================
# Configuration
# ========================================
SERVER_IP="185.193.19.244"
SERVER_USER="root"
DEPLOY_PATH="/opt/yoraa-backend"
SSH_KEY="$HOME/.ssh/id_ed25519"  # Using your SSH key to avoid password prompts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================
# Functions
# ========================================

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Setup SSH command
if [ -n "$SSH_KEY" ]; then
    SSH_CMD="ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP"
    SCP_CMD="scp -i $SSH_KEY"
    RSYNC_CMD="rsync -e 'ssh -i $SSH_KEY'"
else
    SSH_CMD="ssh $SERVER_USER@$SERVER_IP"
    SCP_CMD="scp"
    RSYNC_CMD="rsync"
fi

# ========================================
# Pre-deployment Checks
# ========================================

print_header "🔍 Pre-Deployment Checks"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    exit 1
fi
print_success ".env.production exists"

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile not found!"
    exit 1
fi
print_success "Dockerfile exists"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found!"
    exit 1
fi
print_success "docker-compose.yml exists"

# Check SSH connection
print_info "Testing SSH connection to $SERVER_IP..."
if $SSH_CMD "echo 'SSH connection successful'" > /dev/null 2>&1; then
    print_success "SSH connection successful"
else
    print_error "Cannot connect to server via SSH"
    exit 1
fi

# ========================================
# Create Deployment Directory
# ========================================

print_header "📁 Creating Deployment Directory"
$SSH_CMD "mkdir -p $DEPLOY_PATH"
print_success "Directory created: $DEPLOY_PATH"

# ========================================
# Transfer Files
# ========================================

print_header "📦 Transferring Files to Server"

print_info "Syncing files (this may take a few minutes)..."

# Using rsync for efficient transfer
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude 'final' \
    --exclude '.git' \
    --exclude 'database_backup' \
    --exclude '*.md' \
    --exclude '.DS_Store' \
    --exclude 'test-*.js' \
    --exclude '*.postman_collection.json' \
    --exclude '.vscode' \
    --exclude '.idea' \
    -e "ssh $([ -n "$SSH_KEY" ] && echo "-i $SSH_KEY" || echo "")" \
    ./ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/

print_success "Files transferred successfully"

# ========================================
# Prepare Environment
# ========================================

print_header "🔧 Preparing Environment on Server"

# Copy .env.production to .env
$SSH_CMD "cd $DEPLOY_PATH && cp .env.production .env"
print_success "Environment file configured"

# ========================================
# Check Docker Installation
# ========================================

print_header "🐳 Checking Docker Installation"

if $SSH_CMD "command -v docker" > /dev/null 2>&1; then
    DOCKER_VERSION=$($SSH_CMD "docker --version")
    print_success "Docker is installed: $DOCKER_VERSION"
else
    print_warning "Docker is not installed on the server"
    print_info "Installing Docker..."
    
    $SSH_CMD "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    $SSH_CMD "systemctl start docker && systemctl enable docker"
    
    print_success "Docker installed successfully"
fi

# ========================================
# Stop Existing Containers
# ========================================

print_header "🛑 Stopping Existing Containers"

if $SSH_CMD "cd $DEPLOY_PATH && docker compose ps -q yoraa-backend-prod" > /dev/null 2>&1; then
    print_info "Stopping existing container..."
    $SSH_CMD "cd $DEPLOY_PATH && docker compose down"
    print_success "Existing containers stopped"
else
    print_info "No existing containers to stop"
fi

# ========================================
# Build Docker Image
# ========================================

print_header "🏗️  Building Docker Image"

print_info "Building image (this may take a few minutes)..."
$SSH_CMD "cd $DEPLOY_PATH && docker compose build yoraa-backend-prod"
print_success "Docker image built successfully"

# ========================================
# Start Container
# ========================================

print_header "🚀 Starting Docker Container"

$SSH_CMD "cd $DEPLOY_PATH && docker compose up -d yoraa-backend-prod"
print_success "Container started"

# Wait for container to be healthy
print_info "Waiting for container to be healthy..."
sleep 10

# ========================================
# Verify Deployment
# ========================================

print_header "✅ Verifying Deployment"

# Check container status
CONTAINER_STATUS=$($SSH_CMD "cd $DEPLOY_PATH && docker compose ps yoraa-backend-prod --format '{{.Status}}'")
print_info "Container status: $CONTAINER_STATUS"

if echo "$CONTAINER_STATUS" | grep -q "Up"; then
    print_success "Container is running"
else
    print_error "Container is not running properly"
    print_info "Checking logs..."
    $SSH_CMD "cd $DEPLOY_PATH && docker compose logs yoraa-backend-prod --tail=50"
    exit 1
fi

# Test health endpoint
print_info "Testing health endpoint..."
sleep 5
if $SSH_CMD "curl -f -s http://localhost:8080/health" > /dev/null; then
    print_success "Health endpoint is responding"
else
    print_error "Health endpoint is not responding"
    print_info "Container logs:"
    $SSH_CMD "cd $DEPLOY_PATH && docker compose logs yoraa-backend-prod --tail=50"
    exit 1
fi

# ========================================
# Configure Firewall
# ========================================

print_header "🔥 Configuring Firewall"

# Check if UFW is installed
if $SSH_CMD "command -v ufw" > /dev/null 2>&1; then
    print_info "Opening port 8080..."
    $SSH_CMD "ufw allow 8080/tcp" || true
    print_success "Firewall configured"
else
    print_warning "UFW not installed, skipping firewall configuration"
fi

# ========================================
# Show Deployment Info
# ========================================

print_header "🎉 Deployment Complete!"

echo ""
print_success "Backend deployed successfully to Contabo!"
echo ""
print_info "Server Details:"
echo "  📍 IP Address: $SERVER_IP"
echo "  📂 Deploy Path: $DEPLOY_PATH"
echo "  🐳 Container: yoraa-api-prod"
echo ""
print_info "API Endpoints:"
echo "  🔍 Health: http://$SERVER_IP:8080/health"
echo "  🌐 API Base: http://$SERVER_IP:8080/api"
echo ""
print_info "Useful Commands:"
echo "  📊 View Logs:    ssh $SERVER_USER@$SERVER_IP 'cd $DEPLOY_PATH && docker compose logs -f'"
echo "  🔄 Restart:      ssh $SERVER_USER@$SERVER_IP 'cd $DEPLOY_PATH && docker compose restart'"
echo "  🛑 Stop:         ssh $SERVER_USER@$SERVER_IP 'cd $DEPLOY_PATH && docker compose down'"
echo "  📈 Stats:        ssh $SERVER_USER@$SERVER_IP 'docker stats yoraa-api-prod'"
echo ""

# Test external access
print_info "Testing external API access..."
if curl -f -s http://$SERVER_IP:8080/health > /dev/null 2>&1; then
    print_success "API is accessible externally!"
    echo ""
    print_success "🎉 Your backend is now LIVE at: http://$SERVER_IP:8080"
else
    print_warning "Cannot access API externally - check firewall settings"
    print_info "Run this on the server to open the firewall:"
    echo "  sudo ufw allow 8080/tcp"
fi

echo ""
print_header "📱 Next Steps"
echo "1. Update your mobile app's API URL to: http://$SERVER_IP:8080/api"
echo "2. Test all endpoints from your mobile app"
echo "3. Consider setting up SSL/HTTPS with Nginx (see CONTABO_DEPLOYMENT_GUIDE.md)"
echo "4. Monitor logs: docker compose logs -f"
echo ""
