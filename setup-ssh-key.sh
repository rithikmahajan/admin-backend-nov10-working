#!/bin/bash

# 🔑 Setup SSH Key for Passwordless Deployment
# Run this ONCE to enable passwordless deployments

set -e

SERVER_IP="185.193.19.244"
SERVER_USER="root"
SSH_KEY="$HOME/.ssh/id_ed25519"

echo "🔑 Setting up SSH key for passwordless access..."
echo "📌 You will be asked for the server password ONE TIME only"
echo ""

# Copy SSH key to server
ssh-copy-id -i "${SSH_KEY}.pub" "$SERVER_USER@$SERVER_IP"

echo ""
echo "✅ SSH key installed successfully!"
echo "🎉 You can now deploy without entering a password"
echo ""
echo "Next step: Run ./deploy-to-contabo.sh"
