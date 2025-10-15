#!/bin/bash

# Yoraa Backend Docker Deployment Script
# This script handles deployment to production servers

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="yoraa-api-prod"
IMAGE_NAME="yoraa-backend"
COMPOSE_FILE="docker-compose.yml"

echo -e "${BLUE}🐳 Yoraa Backend Docker Deployment${NC}"
echo "=================================="

# Function to print colored messages
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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Docker and Docker Compose are installed"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    print_info "Creating .env.production template..."
    cp .env.development .env.production
    print_warning "Please update .env.production with production credentials before continuing"
    exit 1
fi

print_success ".env.production found"

# Pull latest code (if in git repo)
if [ -d ".git" ]; then
    print_info "Pulling latest code from git..."
    git pull origin main || git pull origin master || print_warning "Could not pull from git"
fi

# Backup old container (if exists)
if docker ps -a | grep -q $CONTAINER_NAME; then
    print_info "Backing up old container..."
    docker commit $CONTAINER_NAME ${IMAGE_NAME}-backup:$(date +%Y%m%d-%H%M%S) || true
fi

# Stop existing containers
print_info "Stopping existing containers..."
docker-compose down || true

# Build new image
print_info "Building production Docker image..."
docker-compose build yoraa-backend-prod

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Start container
print_info "Starting production container..."
docker-compose up -d yoraa-backend-prod

if [ $? -eq 0 ]; then
    print_success "Container started successfully"
else
    print_error "Failed to start container"
    exit 1
fi

# Wait for container to be healthy
print_info "Waiting for container to be healthy..."
sleep 5

# Check health
HEALTH_CHECK_COUNT=0
MAX_HEALTH_CHECKS=10

while [ $HEALTH_CHECK_COUNT -lt $MAX_HEALTH_CHECKS ]; do
    if curl -f http://localhost:8080/health &> /dev/null; then
        print_success "Container is healthy!"
        break
    fi
    
    HEALTH_CHECK_COUNT=$((HEALTH_CHECK_COUNT + 1))
    print_info "Health check attempt $HEALTH_CHECK_COUNT/$MAX_HEALTH_CHECKS..."
    sleep 3
done

if [ $HEALTH_CHECK_COUNT -eq $MAX_HEALTH_CHECKS ]; then
    print_error "Container health check failed"
    print_info "Checking logs..."
    docker-compose logs --tail=50 yoraa-backend-prod
    exit 1
fi

# Show running containers
print_info "Running containers:"
docker ps --filter name=yoraa

# Show logs (last 20 lines)
print_info "Recent logs:"
docker-compose logs --tail=20 yoraa-backend-prod

# Cleanup old images (keep last 3)
print_info "Cleaning up old images..."
docker images ${IMAGE_NAME}-backup --format "{{.ID}}" | tail -n +4 | xargs -r docker rmi || true

print_success "Deployment completed successfully! 🎉"
echo ""
print_info "Useful commands:"
echo "  - View logs: docker-compose logs -f yoraa-backend-prod"
echo "  - Stop container: docker-compose down"
echo "  - Restart container: docker-compose restart yoraa-backend-prod"
echo "  - Access shell: docker exec -it yoraa-api-prod sh"
echo ""
print_info "API is running at: http://localhost:8080"
