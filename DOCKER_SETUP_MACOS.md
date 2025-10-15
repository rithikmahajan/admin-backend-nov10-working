# 🐳 Docker Setup Guide for macOS

## ⚠️ Docker Not Installed

Docker is currently not installed on your system. Follow these steps to install and deploy.

---

## 📦 **STEP 1: Install Docker Desktop for Mac**

### Option A: Download from Website (Recommended)
1. Visit: https://www.docker.com/products/docker-desktop/
2. Click "Download for Mac"
3. Choose the correct version:
   - **Apple Silicon (M1/M2/M3)**: Download "Mac with Apple chip"
   - **Intel Mac**: Download "Mac with Intel chip"
4. Open the downloaded `.dmg` file
5. Drag Docker to Applications folder
6. Open Docker Desktop from Applications
7. Follow the setup wizard

### Option B: Install via Homebrew
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker Desktop
brew install --cask docker

# Open Docker Desktop
open /Applications/Docker.app
```

### Verify Installation
After installation, open a new terminal and run:
```bash
docker --version
docker compose version
```

You should see output like:
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

---

## 🚀 **STEP 2: Deploy Backend with Docker**

Once Docker is installed and running (you should see the Docker whale icon in your menu bar):

### Production Deployment

```bash
# Navigate to project directory
cd /Users/rithikmahajan/Desktop/oct-7-backend-admin-main

# Build and start the production containers
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check status
docker compose -f docker-compose.prod.yml ps
```

### Development Mode (with hot reload)

```bash
# Build and start development containers
docker compose -f docker-compose.dev.yml up --build

# View logs (in a new terminal)
docker compose -f docker-compose.dev.yml logs -f
```

---

## 🧪 **STEP 3: Test Your API**

Once containers are running, test the API:

```bash
# Health check
curl http://localhost:8080/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

Or open in browser:
- http://localhost:8080/health

---

## 📊 **Useful Docker Commands**

### Check Container Status
```bash
docker compose -f docker-compose.prod.yml ps
```

### View Logs
```bash
# All logs
docker compose -f docker-compose.prod.yml logs

# Follow logs (live)
docker compose -f docker-compose.prod.yml logs -f

# Specific service logs
docker compose -f docker-compose.prod.yml logs yoraa-backend
```

### Stop Containers
```bash
docker compose -f docker-compose.prod.yml down
```

### Restart Containers
```bash
docker compose -f docker-compose.prod.yml restart
```

### Remove Everything (including volumes)
```bash
docker compose -f docker-compose.prod.yml down -v
```

### Access Container Shell
```bash
docker compose -f docker-compose.prod.yml exec yoraa-backend sh
```

---

## 🔧 **Troubleshooting**

### Issue: "Docker daemon is not running"
**Solution:** Open Docker Desktop application from Applications folder

### Issue: "port 8080 is already allocated"
**Solution:** Stop the existing Node.js process
```bash
# Find process on port 8080
lsof -ti:8080

# Kill the process
kill -9 $(lsof -ti:8080)

# Then restart Docker containers
docker compose -f docker-compose.prod.yml up -d
```

### Issue: "Cannot connect to the Docker daemon"
**Solution:** Make sure Docker Desktop is running (whale icon in menu bar)

### Issue: Container keeps restarting
**Solution:** Check logs for errors
```bash
docker compose -f docker-compose.prod.yml logs yoraa-backend
```

### Issue: Environment variables not loading
**Solution:** Make sure `.env` file exists
```bash
# Check if .env exists
ls -la .env

# If not, copy from server.env
cp server.env .env
```

---

## 🎯 **Quick Start Script**

I've created a deployment script for you. After Docker is installed:

```bash
# Make the script executable
chmod +x deploy-docker.sh

# Run production deployment
./deploy-docker.sh prod

# Or run development deployment
./deploy-docker.sh dev
```

---

## 📱 **Testing with Mobile App**

Once Docker is running:

### Local Testing (Same WiFi)
1. Find your Mac's local IP:
   ```bash
   ipconfig getifaddr en0
   ```
2. Update mobile app API URL to: `http://YOUR_MAC_IP:8080`

### Production Deployment
- Deploy to a cloud server with Docker installed
- Update mobile app API URL to your production domain

---

## ✅ **Next Steps After Installation**

1. ✅ Install Docker Desktop
2. ✅ Wait for Docker to start (whale icon in menu bar)
3. ✅ Run: `docker compose -f docker-compose.prod.yml up -d --build`
4. ✅ Test: `curl http://localhost:8080/health`
5. ✅ Check logs: `docker compose -f docker-compose.prod.yml logs -f`

---

## 📚 **Additional Resources**

- Docker Desktop for Mac: https://docs.docker.com/desktop/install/mac-install/
- Docker Compose Documentation: https://docs.docker.com/compose/
- Docker Hub: https://hub.docker.com/

---

**Need Help?** Check the Docker Desktop application logs or visit Docker documentation.
