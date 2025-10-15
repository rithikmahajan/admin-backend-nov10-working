# 🚀 Quick Deployment to Contabo - Docker

## ⚡ One-Command Deployment

```bash
./deploy-to-contabo.sh
```

This automated script will:
1. ✅ Transfer all files to Contabo server
2. ✅ Build Docker image on the server
3. ✅ Start the container
4. ✅ Verify deployment
5. ✅ Configure firewall

---

## 🔑 Before You Deploy

### 1. Check SSH Access
Test if you can SSH into your Contabo server:
```bash
ssh root@185.193.19.244
```

If you use an SSH key:
```bash
ssh -i ~/.ssh/your_key root@185.193.19.244
```

**Edit the script if using SSH key:**
Open `deploy-to-contabo.sh` and update line 10:
```bash
SSH_KEY="~/.ssh/your_key"  # Add your SSH key path
```

### 2. Verify Environment Variables
Make sure `.env.production` has the correct values:
```bash
# MongoDB Atlas connection
MONGO_URI=mongodb+srv://rithik27:rithik27@cluster0.yuzdh.mongodb.net/yoraa1?retryWrites=true&w=majority&appName=Cluster0

# Server configuration
PORT=8080
HOST=0.0.0.0

# Your API will be available at:
# http://185.193.19.244:8080/api
```

---

## 🎯 Deployment Steps

### Step 1: Run Deployment Script
```bash
cd /Users/rithikmahajan/Desktop/oct-7-backend-admin-main
./deploy-to-contabo.sh
```

The script will show progress:
```
========================================
🔍 Pre-Deployment Checks
========================================
✅ .env.production exists
✅ Dockerfile exists
✅ docker-compose.yml exists
✅ SSH connection successful

========================================
📦 Transferring Files to Server
========================================
...
```

### Step 2: Wait for Completion
The deployment takes ~5-10 minutes depending on:
- File transfer speed
- Docker image build time
- Server performance

### Step 3: Verify Deployment
After successful deployment, test the API:

```bash
# Test health endpoint
curl http://185.193.19.244:8080/health

# Test categories
curl http://185.193.19.244:8080/api/categories

# Test from browser
open http://185.193.19.244:8080/health
```

---

## 📊 Post-Deployment Management

### View Logs
```bash
ssh root@185.193.19.244 "cd /opt/yoraa-backend && docker compose logs -f yoraa-backend-prod"
```

### Check Status
```bash
ssh root@185.193.19.244 "cd /opt/yoraa-backend && docker compose ps"
```

### Restart Backend
```bash
ssh root@185.193.19.244 "cd /opt/yoraa-backend && docker compose restart yoraa-backend-prod"
```

### Stop Backend
```bash
ssh root@185.193.19.244 "cd /opt/yoraa-backend && docker compose down"
```

### Update Backend (Re-deploy)
Just run the script again:
```bash
./deploy-to-contabo.sh
```

---

## 🔧 Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# 1. SSH into server
ssh root@185.193.19.244

# 2. Create directory
mkdir -p /opt/yoraa-backend
cd /opt/yoraa-backend

# 3. Transfer files (run this on your Mac in a new terminal)
rsync -avz --exclude 'node_modules' --exclude 'final' --exclude '.git' \
  ./ root@185.193.19.244:/opt/yoraa-backend/

# 4. Back on server, copy env file
cp .env.production .env

# 5. Build and start
docker compose build yoraa-backend-prod
docker compose up -d yoraa-backend-prod

# 6. Check logs
docker compose logs yoraa-backend-prod -f
```

---

## 🆘 Troubleshooting

### Issue: "Permission denied (publickey)"
**Solution:** Add your SSH key or use password authentication:
```bash
ssh-copy-id root@185.193.19.244
```

### Issue: "Port 8080 already in use"
**Solution:** Stop the existing service:
```bash
ssh root@185.193.19.244 "sudo lsof -ti:8080 | xargs sudo kill -9"
```

### Issue: "Container keeps restarting"
**Solution:** Check logs:
```bash
ssh root@185.193.19.244 "cd /opt/yoraa-backend && docker compose logs yoraa-backend-prod --tail=100"
```

### Issue: "Cannot access API externally"
**Solution:** Open firewall:
```bash
ssh root@185.193.19.244 "sudo ufw allow 8080/tcp"
```

---

## 📱 Update Mobile App

After successful deployment, update your mobile app's API configuration:

### iOS (Swift/SwiftUI):
```swift
let API_BASE_URL = "http://185.193.19.244:8080/api"
```

### React Native:
```javascript
const API_BASE_URL = "http://185.193.19.244:8080/api";
```

### Android (Kotlin):
```kotlin
const val API_BASE_URL = "http://185.193.19.244:8080/api"
```

---

## 🔒 Security Recommendations

1. **Setup SSL/HTTPS** - See `CONTABO_DEPLOYMENT_GUIDE.md` for Nginx + Let's Encrypt setup
2. **Use environment variables** - Never commit sensitive data to git
3. **Enable firewall** - Only open necessary ports (80, 443, 8080, 22)
4. **Regular backups** - Your MongoDB is on Atlas (auto-backup), but backup environment files
5. **Monitor logs** - Set up log rotation and monitoring

---

## ✅ Deployment Checklist

- [ ] SSH access to Contabo working
- [ ] `.env.production` configured
- [ ] `deploy-to-contabo.sh` is executable
- [ ] Run deployment script: `./deploy-to-contabo.sh`
- [ ] Verify health endpoint: `curl http://185.193.19.244:8080/health`
- [ ] Test API endpoints
- [ ] Update mobile app API URL
- [ ] Test mobile app with production backend
- [ ] Setup SSL/HTTPS (optional but recommended)
- [ ] Configure monitoring/alerts

---

## 🌐 Your Production URLs

- **API Base URL:** `http://185.193.19.244:8080/api`
- **Health Check:** `http://185.193.19.244:8080/health`
- **Server Location:** `/opt/yoraa-backend`

---

**Ready to deploy? Run:**
```bash
./deploy-to-contabo.sh
```

🎉 Your backend will be live in ~5-10 minutes!
