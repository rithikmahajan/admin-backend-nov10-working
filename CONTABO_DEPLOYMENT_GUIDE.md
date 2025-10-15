# 🚀 Contabo Server Deployment Guide - Docker

This guide will help you deploy your Yoraa backend to Contabo using Docker.

## 📋 Prerequisites

1. ✅ Contabo VPS server
2. ✅ SSH access to the server
3. ✅ Domain/IP: `185.193.19.244`
4. ✅ Docker installed on Contabo server

## 🔧 Step 1: Prepare Your Contabo Server

### SSH into your Contabo server:
```bash
ssh root@185.193.19.244
# Or use your specific SSH key/username
```

### Install Docker on Contabo (if not already installed):
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
```

## 📦 Step 2: Transfer Files to Contabo

### Option A: Using the deployment script (Recommended)
```bash
# On your local Mac, run:
chmod +x deploy-to-contabo.sh
./deploy-to-contabo.sh
```

### Option B: Manual Transfer
```bash
# Create directory on server
ssh root@185.193.19.244 "mkdir -p /opt/yoraa-backend"

# Copy files using rsync
rsync -avz --exclude 'node_modules' \
  --exclude 'final' \
  --exclude '.git' \
  --exclude 'database_backup' \
  --exclude '*.md' \
  -e ssh \
  ./ root@185.193.19.244:/opt/yoraa-backend/

# Or use scp
scp -r \
  Dockerfile \
  docker-compose.yml \
  package*.json \
  index.js \
  ecosystem.config.js \
  .env.production \
  firebase*.json \
  firestore.* \
  serviceAccountKey.json \
  firebase-service-account.json \
  src/ \
  root@185.193.19.244:/opt/yoraa-backend/
```

## 🚀 Step 3: Deploy on Contabo

### SSH into Contabo:
```bash
ssh root@185.193.19.244
```

### Navigate to deployment directory:
```bash
cd /opt/yoraa-backend
```

### Create/Update .env file:
```bash
# Copy production env
cp .env.production .env

# Or create directly
nano .env
# (Paste your production environment variables)
```

### Build and Start Docker Container:
```bash
# Build the Docker image
docker compose build yoraa-backend-prod

# Start the container
docker compose up -d yoraa-backend-prod

# Check status
docker compose ps

# View logs
docker compose logs yoraa-backend-prod -f
```

## 🔍 Step 4: Verify Deployment

### Check if container is running:
```bash
docker compose ps
# Should show: yoraa-api-prod | Up | healthy
```

### Test the API:
```bash
# Health check
curl http://localhost:8080/health

# Test categories endpoint
curl http://185.193.19.244:8080/api/categories
```

### View logs:
```bash
# Follow logs in real-time
docker compose logs yoraa-backend-prod -f

# View last 100 lines
docker compose logs yoraa-backend-prod --tail=100
```

## 🌐 Step 5: Configure Firewall & Network

### Open port 8080:
```bash
# UFW Firewall
sudo ufw allow 8080/tcp
sudo ufw status

# Or iptables
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables-save
```

### Test from external:
```bash
# From your local Mac:
curl http://185.193.19.244:8080/health
curl http://185.193.19.244:8080/api/categories
```

## 🔒 Step 6: Setup SSL/HTTPS with Nginx (Optional but Recommended)

### Install Nginx:
```bash
sudo apt install nginx -y
```

### Create Nginx config:
```bash
sudo nano /etc/nginx/sites-available/yoraa-api
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.yoraa.in 185.193.19.244;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/yoraa-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Setup SSL with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yoraa.in
```

## 🔄 Step 7: Management Commands

### Restart the backend:
```bash
cd /opt/yoraa-backend
docker compose restart yoraa-backend-prod
```

### Update the backend:
```bash
cd /opt/yoraa-backend

# Pull latest code
git pull  # if using git
# OR transfer new files from local

# Rebuild and restart
docker compose down
docker compose build yoraa-backend-prod
docker compose up -d yoraa-backend-prod
```

### View logs:
```bash
docker compose logs yoraa-backend-prod -f
```

### Stop the backend:
```bash
docker compose down
```

### Clean up old images:
```bash
docker system prune -a
```

## 📊 Step 8: Monitoring & Maintenance

### Check resource usage:
```bash
docker stats yoraa-api-prod
```

### Check disk space:
```bash
df -h
```

### Backup database:
```bash
# Your MongoDB is already on Atlas, so it's backed up automatically
# But you can export if needed
```

### Setup auto-restart:
The docker-compose.yml already has `restart: unless-stopped` configured,
so the container will automatically restart if it crashes or if the server reboots.

## 🆘 Troubleshooting

### Container keeps restarting:
```bash
# Check logs
docker compose logs yoraa-backend-prod --tail=100

# Check if port is already in use
sudo netstat -tulpn | grep 8080
```

### Database connection issues:
```bash
# Verify MongoDB connection string in .env
cat .env | grep MONGO_URI

# Test MongoDB connection from server
docker exec yoraa-api-prod node -e "console.log(process.env.MONGO_URI)"
```

### Out of memory:
```bash
# Check memory usage
free -m

# Restart container
docker compose restart yoraa-backend-prod
```

### File permission issues:
```bash
# Fix ownership
sudo chown -R $USER:$USER /opt/yoraa-backend
```

## 📱 Step 9: Update Mobile App

After deployment, update your mobile app's API base URL to:
- Development: `http://185.193.19.244:8080/api`
- Production: `https://api.yoraa.in/api` (if using Nginx + SSL)

## ✅ Deployment Checklist

- [ ] SSH access to Contabo server working
- [ ] Docker installed on Contabo
- [ ] Files transferred to server
- [ ] .env.production configured correctly
- [ ] MongoDB Atlas connection working
- [ ] Docker container built successfully
- [ ] Container running and healthy
- [ ] Port 8080 accessible externally
- [ ] API endpoints responding correctly
- [ ] Nginx reverse proxy configured (optional)
- [ ] SSL certificate installed (optional)
- [ ] Mobile app updated with new API URL

## 🔗 Useful Links

- Server IP: `185.193.19.244`
- API URL: `http://185.193.19.244:8080/api`
- Health Check: `http://185.193.19.244:8080/health`
- MongoDB Atlas: Already configured

---

**Last Updated:** October 11, 2025  
**Status:** Ready for Deployment
