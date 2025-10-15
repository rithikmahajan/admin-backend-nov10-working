# 🐳 Docker Deployment Guide - Yoraa Backend

## 📋 Quick Start

```bash
# Stop any running services
cd /Users/rithikmahajan/Desktop/oct-7-backend-admin-main

# Build and start production
docker-compose up --build yoraa-backend-prod -d

# Or use npm script
npm run docker:prod:build
```

---

## 🚀 Deployment Options

### Option 1: Production Deployment (Recommended)

```bash
# Build and start in detached mode
docker-compose up --build -d yoraa-backend-prod

# Check logs
docker-compose logs -f yoraa-backend-prod

# Check status
docker-compose ps
```

**Access**: `http://localhost:8080`

### Option 2: Development Deployment (Hot Reload)

```bash
# Build and start development
docker-compose up --build -d yoraa-backend-dev

# Check logs
docker-compose logs -f yoraa-backend-dev
```

**Access**: `http://localhost:8001`

### Option 3: Both Environments

```bash
# Start both production and development
docker-compose up --build -d

# Production: http://localhost:8080
# Development: http://localhost:8001
```

---

## 🔧 Pre-Deployment Checklist

### 1. Verify Docker Installation

```bash
docker --version
# Should show: Docker version 28.5.1 or higher

docker-compose --version
# Should show: Docker Compose version v2.40.0 or higher
```

### 2. Check Environment Files

```bash
# Production environment
ls -la .env.production

# Development environment
ls -la .env.development
```

### 3. Kill Existing Node Processes (if any)

```bash
# Find and kill processes on port 8080
lsof -ti:8080 | xargs kill -9 2>/dev/null

# Find and kill processes on port 8001
lsof -ti:8001 | xargs kill -9 2>/dev/null
```

---

## 📦 Docker Commands Reference

### Build Commands

```bash
# Build production image
docker-compose build yoraa-backend-prod

# Build development image
docker-compose build yoraa-backend-dev

# Rebuild without cache
docker-compose build --no-cache yoraa-backend-prod
```

### Start/Stop Commands

```bash
# Start production (foreground)
docker-compose up yoraa-backend-prod

# Start production (background/detached)
docker-compose up -d yoraa-backend-prod

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Monitoring Commands

```bash
# View logs (all services)
docker-compose logs

# View logs (specific service, follow mode)
docker-compose logs -f yoraa-backend-prod

# View last 100 lines
docker-compose logs --tail=100 yoraa-backend-prod

# Check container status
docker-compose ps

# Check resource usage
docker stats
```

### Debug Commands

```bash
# Access container shell
docker exec -it yoraa-api-prod sh

# View container details
docker inspect yoraa-api-prod

# Check health status
docker inspect --format='{{json .State.Health}}' yoraa-api-prod | jq
```

---

## 🔍 Verification Steps

### 1. Check Container is Running

```bash
docker-compose ps
```

Expected output:
```
NAME              IMAGE                         STATUS
yoraa-api-prod    oct-7-backend-admin-main...   Up (healthy)
```

### 2. Test API Endpoints

```bash
# Health check
curl http://localhost:8080/health

# Get Razorpay config
curl http://localhost:8080/api/config/razorpay

# Get test products (new endpoint!)
curl http://localhost:8080/api/razorpay/test-products

# Get all products
curl http://localhost:8080/api/products
```

### 3. Check Logs for Errors

```bash
docker-compose logs yoraa-backend-prod | grep -i error
```

---

## 🛠️ Troubleshooting

### Issue 1: Port Already in Use

**Error**: `EADDRINUSE: address already in use ::1:8080`

**Solution**:
```bash
# Find process using port
lsof -ti:8080

# Kill the process
lsof -ti:8080 | xargs kill -9

# Or stop Docker containers
docker-compose down
```

### Issue 2: Container Keeps Restarting

**Check logs**:
```bash
docker-compose logs --tail=50 yoraa-backend-prod
```

**Common causes**:
- MongoDB connection failed
- Missing environment variables
- Port conflict

### Issue 3: Cannot Connect to MongoDB

**Check environment variables**:
```bash
docker exec -it yoraa-api-prod sh
cat /app/.env.production | grep MONGO_URI
```

**Solution**: Verify `MONGO_URI` in `.env.production`

### Issue 4: Unhealthy Container

```bash
# Check health status
docker inspect yoraa-api-prod | grep -A 10 Health

# Common fix: Restart container
docker-compose restart yoraa-backend-prod
```

---

## 🔄 Update & Redeploy

### Quick Update (Code Changes)

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up --build -d yoraa-backend-prod

# Verify
curl http://localhost:8080/health
```

### Full Clean Redeploy

```bash
# Stop all containers
docker-compose down

# Remove all images
docker-compose down --rmi all

# Remove volumes
docker-compose down -v

# Rebuild from scratch
docker-compose up --build -d yoraa-backend-prod
```

### Update Dependencies

```bash
# Stop container
docker-compose down yoraa-backend-prod

# Rebuild with no cache
docker-compose build --no-cache yoraa-backend-prod

# Start container
docker-compose up -d yoraa-backend-prod
```

---

## 📊 Production Configuration

### Environment Variables (.env.production)

Key variables that should be set:

```bash
NODE_ENV=production
PORT=8080
MONGO_URI=mongodb+srv://...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
SECRET_KEY=...
```

### Docker Compose Production Settings

```yaml
yoraa-backend-prod:
  ports:
    - "8080:8080"          # External:Internal
  restart: unless-stopped   # Auto-restart on crash
  env_file:
    - .env.production       # Load production env vars
```

---

## 🔐 Security Best Practices

### 1. Use Non-Root User
✅ Already configured in Dockerfile:
```dockerfile
USER nodejs
```

### 2. Environment Variables
✅ Never commit `.env` files to git
✅ Use `.env.production` for sensitive data

### 3. Health Checks
✅ Already configured:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s
```

### 4. Network Isolation
✅ Using custom bridge network:
```yaml
networks:
  - yoraa-network
```

---

## 📈 Performance Optimization

### Multi-Stage Build
✅ Already implemented:
- Base stage: Common setup
- Development stage: All dependencies
- Production stage: Production dependencies only

### Layer Caching
✅ Optimized order:
1. Copy package.json first
2. Install dependencies
3. Copy source code

### Resource Limits (Optional)

Add to `docker-compose.yml`:
```yaml
yoraa-backend-prod:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

---

## 🎯 Deployment Scenarios

### Scenario 1: Local Development

```bash
# Use development container with hot reload
docker-compose up -d yoraa-backend-dev

# Make changes to code - automatically reloads!
# Access at: http://localhost:8001
```

### Scenario 2: Local Production Testing

```bash
# Test production build locally
docker-compose up -d yoraa-backend-prod

# Test at: http://localhost:8080
```

### Scenario 3: Remote Server Deployment

```bash
# On your server (e.g., Contabo)
cd /path/to/backend
git pull
docker-compose up --build -d yoraa-backend-prod

# Configure nginx/reverse proxy to forward to port 8080
```

---

## 📝 NPM Scripts Available

```bash
# Development
npm run docker:dev              # Start dev container
npm run docker:dev:build        # Build & start dev

# Production
npm run docker:prod             # Start prod container
npm run docker:prod:build       # Build & start prod

# Management
npm run docker:down             # Stop all containers
npm run docker:clean            # Clean everything
```

---

## 🌐 Deployment to Remote Server

### Via SSH

```bash
# SSH to server
ssh user@185.193.19.244

# Navigate to project
cd /path/to/backend

# Pull latest changes
git pull

# Deploy
docker-compose up --build -d yoraa-backend-prod
```

### Using Deployment Script

```bash
# Local machine
./deploy-docker.sh production

# Or
./deploy-to-contabo.sh
```

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Container is running: `docker-compose ps`
- [ ] Health check passes: `curl http://localhost:8080/health`
- [ ] API responds: `curl http://localhost:8080/api/products`
- [ ] MongoDB connected: Check logs for connection success
- [ ] Razorpay configured: `curl http://localhost:8080/api/config/razorpay`
- [ ] Test products available: `curl http://localhost:8080/api/razorpay/test-products`
- [ ] No errors in logs: `docker-compose logs --tail=100 yoraa-backend-prod`

---

## 🆘 Emergency Commands

### Quick Restart
```bash
docker-compose restart yoraa-backend-prod
```

### Emergency Stop
```bash
docker-compose down --remove-orphans
```

### View All Containers
```bash
docker ps -a
```

### Remove Stuck Container
```bash
docker rm -f yoraa-api-prod
```

### Clean Everything
```bash
docker system prune -a --volumes
```

---

## 📞 Support

### Check Container Logs
```bash
docker-compose logs -f yoraa-backend-prod
```

### Check System Resources
```bash
docker stats yoraa-api-prod
```

### Export Logs
```bash
docker-compose logs yoraa-backend-prod > deployment-logs.txt
```

---

## 🎉 Success Indicators

When deployment is successful, you should see:

```
✅ Container: yoraa-api-prod (Up, Healthy)
✅ Port: 8080 (accessible)
✅ Health: /health endpoint returns 200
✅ Database: MongoDB connected
✅ API: Endpoints responding correctly
```

Test with:
```bash
curl http://localhost:8080/health && echo "✅ Backend is running!"
```

---

**Last Updated**: October 14, 2025  
**Docker Version**: 28.5.1  
**Compose Version**: v2.40.0  
**Status**: ✅ Ready for Deployment
