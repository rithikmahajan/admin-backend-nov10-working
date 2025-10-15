# ⚠️ **DOCKER NOT INSTALLED!**

## You need to install Docker Desktop before proceeding

---

## 🚀 **Quick Install (5 minutes)**

### **Step 1: Download Docker Desktop**
👉 **https://www.docker.com/products/docker-desktop/**

Choose your Mac type:
- **M1/M2/M3 Mac** → "Mac with Apple chip"
- **Intel Mac** → "Mac with Intel chip"

### **Step 2: Install**
1. Open the downloaded `.dmg` file
2. Drag Docker icon to Applications folder
3. Open Docker Desktop from Applications
4. Click "Accept" on the service agreement
5. Wait for Docker to start (whale icon appears in menu bar)

### **Step 3: Verify Installation**
Open a new terminal and run:
```bash
docker --version
```

Should show: `Docker version 24.x.x` or similar

---

## 📋 **Alternative: Install via Homebrew**

```bash
# Install Docker Desktop
brew install --cask docker

# Open Docker Desktop
open /Applications/Docker.app
```

---

## ✅ **After Installation**

Once Docker is installed and running, you can deploy:

```bash
cd /Users/rithikmahajan/Desktop/oct-7-backend-admin-main

# Deploy production
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## 📚 **Full Documentation**

See [DOCKER_SETUP_MACOS.md](./DOCKER_SETUP_MACOS.md) for complete setup guide.

---

**Don't have admin rights?** You'll need administrator access to install Docker Desktop.
