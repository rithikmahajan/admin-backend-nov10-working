#!/bin/bash

# Yoraa Admin Panel Production Deployment Script
# Deploys the built React admin panel to yoraa.in.net

echo "🚀 Starting deployment to yoraa.in.net..."

# Configuration
PROJECT_NAME="Yoraa Admin Panel"
BUILD_DIR="./final/dist"
REMOTE_HOST="yoraa.in.net"
REMOTE_PATH="/var/www/html/admin"
BACKUP_PATH="/var/www/html/admin_backup_$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    print_error "Build directory not found: $BUILD_DIR"
    print_error "Please run 'npm run build:prod' in the final/ directory first"
    exit 1
fi

print_success "Build directory found: $BUILD_DIR"

# Check build files
if [ ! -f "$BUILD_DIR/index.html" ]; then
    print_error "Build files missing. Please rebuild the project."
    exit 1
fi

print_success "Build files verified"

# Show deployment information
echo ""
print_status "📋 Deployment Information:"
echo "   Project: $PROJECT_NAME"
echo "   Source: $BUILD_DIR"
echo "   Target: $REMOTE_HOST:$REMOTE_PATH"
echo "   Backup: $BACKUP_PATH"
echo ""

# Deployment options
echo "📦 Deployment Options:"
echo "1. Deploy via rsync (requires SSH access)"
echo "2. Create deployment package for manual upload"
echo "3. Deploy via Netlify"
echo "4. Exit"
echo ""

read -p "Choose deployment method (1-4): " choice

case $choice in
    1)
        print_status "Deploying via rsync..."
        
        # Check if SSH key exists
        SSH_KEY="$HOME/.ssh/id_rsa"
        if [ ! -f "$SSH_KEY" ]; then
            print_warning "SSH key not found at $SSH_KEY"
            read -p "Enter path to SSH private key (or press Enter to use password): " custom_key
            if [ -n "$custom_key" ] && [ -f "$custom_key" ]; then
                SSH_KEY="$custom_key"
            else
                SSH_KEY=""
            fi
        fi

        # Backup existing files
        if [ -n "$SSH_KEY" ]; then
            print_status "Creating backup..."
            ssh -i "$SSH_KEY" root@$REMOTE_HOST "mkdir -p $BACKUP_PATH && cp -r $REMOTE_PATH/* $BACKUP_PATH/ 2>/dev/null || true"
            
            # Deploy files
            print_status "Uploading files..."
            rsync -avz --delete -e "ssh -i $SSH_KEY" "$BUILD_DIR/" root@$REMOTE_HOST:$REMOTE_PATH/
        else
            print_status "Creating backup..."
            ssh root@$REMOTE_HOST "mkdir -p $BACKUP_PATH && cp -r $REMOTE_PATH/* $BACKUP_PATH/ 2>/dev/null || true"
            
            # Deploy files
            print_status "Uploading files..."
            rsync -avz --delete "$BUILD_DIR/" root@$REMOTE_HOST:$REMOTE_PATH/
        fi
        
        if [ $? -eq 0 ]; then
            print_success "Deployment completed successfully!"
            print_success "Admin panel is now live at: https://$REMOTE_HOST/admin"
        else
            print_error "Deployment failed!"
            exit 1
        fi
        ;;
    
    2)
        print_status "Creating deployment package..."
        
        PACKAGE_NAME="yoraa-admin-$(date +%Y%m%d_%H%M%S).tar.gz"
        
        # Create package
        cd "$BUILD_DIR"
        tar -czf "../$PACKAGE_NAME" *
        cd - > /dev/null
        
        print_success "Deployment package created: $PACKAGE_NAME"
        print_status "Upload this file to your server and extract it to $REMOTE_PATH"
        print_status "Commands to run on server:"
        echo "   mkdir -p $REMOTE_PATH"
        echo "   tar -xzf $PACKAGE_NAME -C $REMOTE_PATH"
        echo "   chown -R www-data:www-data $REMOTE_PATH"
        echo "   chmod -R 644 $REMOTE_PATH"
        echo "   find $REMOTE_PATH -type d -exec chmod 755 {} \;"
        ;;
    
    3)
        print_status "Deploying via Netlify..."
        
        # Check if Netlify CLI is installed
        if ! command -v netlify &> /dev/null; then
            print_error "Netlify CLI not found. Installing..."
            npm install -g netlify-cli
        fi
        
        # Deploy to Netlify
        cd final
        netlify deploy --prod --dir=dist
        cd - > /dev/null
        
        if [ $? -eq 0 ]; then
            print_success "Netlify deployment completed!"
            print_warning "Note: Update your DNS to point to Netlify if needed"
        else
            print_error "Netlify deployment failed!"
            exit 1
        fi
        ;;
    
    4)
        print_status "Deployment cancelled."
        exit 0
        ;;
    
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Post-deployment checks
echo ""
print_status "🔍 Post-deployment checks:"
print_status "1. Verify admin panel loads: https://$REMOTE_HOST/admin"
print_status "2. Test OTP authentication with: 7006114695"
print_status "3. Check Firebase configuration"
print_status "4. Verify API connectivity to: https://$REMOTE_HOST/api"

echo ""
print_success "🎉 Deployment process completed!"
print_status "Admin panel should now be accessible at: https://$REMOTE_HOST/admin"
