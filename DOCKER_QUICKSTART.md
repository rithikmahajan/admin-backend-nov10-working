# 🐳 Docker Quick Start

## TL;DR

```bash
# Development (with hot reload)
npm run docker:dev

# Production (optimized)
npm run docker:prod

# Stop everything
npm run docker:down
```

---

## Why Docker?

✅ **Same environment everywhere** - No more "works on my machine"  
✅ **Easy setup** - One command to start everything  
✅ **Isolated** - No conflicts with other projects  
✅ **Production-ready** - Test production build locally  

---

## First Time Setup

### 1. Install Docker Desktop

**macOS:**
```bash
# Download from: https://www.docker.com/products/docker-desktop
# Or use Homebrew:
brew install --cask docker
```

**Verify installation:**
```bash
docker --version
docker-compose --version
```

### 2. Start Development

```bash
# Build and start
npm run docker:dev:build

# Access API
curl http://localhost:8001/health
```

**That's it!** Your backend is running in Docker 🎉

---

## Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| **Command** | `npm run docker:dev` | `npm run docker:prod` |
| **Port** | 8001 | 8080 |
| **Hot Reload** | ✅ Yes | ❌ No |
| **Dependencies** | All (dev+prod) | Production only |
| **Size** | Larger | Optimized |
| **Debug** | Full logging | Minimal logging |

---

## Common Commands

```bash
# Start development
npm run docker:dev

# Start production
npm run docker:prod

# Rebuild and start (after package.json changes)
npm run docker:dev:build
npm run docker:prod:build

# Stop all containers
npm run docker:down

# Clean everything (containers, volumes, cache)
npm run docker:clean

# View logs
docker-compose logs -f yoraa-backend-dev
docker-compose logs -f yoraa-backend-prod

# Access container shell
docker exec -it yoraa-api-dev sh
docker exec -it yoraa-api-prod sh
```

---

## Daily Workflow

### 1. Morning - Start Development
```bash
npm run docker:dev
```

### 2. During Day - Code Changes
- Edit files normally
- Changes auto-reload (nodemon)
- No need to restart

### 3. View Logs
```bash
docker-compose logs -f yoraa-backend-dev
```

### 4. End of Day - Stop
```bash
npm run docker:down
```

---

## Testing Production Locally

```bash
# Start production build
npm run docker:prod:build

# Test endpoints
curl http://localhost:8080/health
curl http://localhost:8080/api/profile

# Check logs
docker-compose logs yoraa-backend-prod
```

---

## Environment Files

### Development (`.env.development`)
- Port: 8001
- Debug logging: Enabled
- Database: Local or test
- Used by: `npm run docker:dev`

### Production (`.env.production`)
- Port: 8080
- Debug logging: Disabled
- Database: Production
- Used by: `npm run docker:prod`

**⚠️ Never commit .env files to git!**

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
lsof -i :8001

# Kill it
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Changes Not Reflecting
```bash
# Make sure you're running dev (not prod)
npm run docker:down
npm run docker:dev

# For package.json changes, rebuild
npm run docker:dev:build
```

### Container Won't Start
```bash
# Check logs
docker-compose logs yoraa-backend-dev

# Try clean restart
npm run docker:clean
npm run docker:dev:build
```

### Database Connection Issues
```bash
# For local MongoDB, use host.docker.internal
# In .env.development:
MONGO_URI=mongodb://host.docker.internal:27017/yoraa1

# For remote MongoDB, use full connection string
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/yoraa1
```

---

## Deployment to Server

### Option 1: Using Deploy Script (Recommended)
```bash
# On server
git pull
./deploy-docker.sh
```

### Option 2: Manual
```bash
# On server
git pull
docker-compose build yoraa-backend-prod
docker-compose up -d yoraa-backend-prod

# Check status
docker ps
curl http://localhost:8080/health
```

### Option 3: Docker Hub
```bash
# Build and tag
docker build -t yourusername/yoraa-backend:latest .

# Push to Docker Hub
docker push yourusername/yoraa-backend:latest

# On server - pull and run
docker pull yourusername/yoraa-backend:latest
docker run -d -p 8080:8080 --env-file .env.production yourusername/yoraa-backend:latest
```

---

## Monitoring

```bash
# View logs
docker-compose logs -f yoraa-backend-prod

# Check container status
docker ps

# Monitor resources
docker stats

# Check health
curl http://localhost:8080/health
```

---

## Advanced Usage

### Run Specific Command in Container
```bash
# Run npm command
docker-compose run --rm yoraa-backend-dev npm install <package>

# Run shell command
docker exec yoraa-api-dev ls -la

# Access Node REPL
docker exec -it yoraa-api-dev node
```

### Multiple Environments
```bash
# Run both dev and prod simultaneously
docker-compose up -d

# Dev: http://localhost:8001
# Prod: http://localhost:8080
```

### Backup Container
```bash
# Create backup image
docker commit yoraa-api-prod yoraa-backup:$(date +%Y%m%d)

# Save to file
docker save yoraa-backup:20251011 | gzip > backup.tar.gz
```

---

## What Gets Dockerized?

### ✅ Included in Docker Image
- Backend source code (`src/`, `index.js`)
- Production dependencies
- Firebase config files
- Package.json

### ❌ Excluded from Docker Image
- `node_modules/` (installed fresh)
- `.env` files (injected at runtime)
- Admin panel (`final/`)
- Git files
- Documentation
- Test files
- Logs

*(See `.dockerignore` for full list)*

---

## Performance Tips

1. **Use Docker for Development**: Same as production
2. **Mount node_modules**: Faster installs
3. **Layer Caching**: Package.json copied before source code
4. **Multi-stage Builds**: Smaller production images
5. **Health Checks**: Automatic monitoring

---

## Need Help?

📚 **Documentation:**
- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Full documentation
- [DOCKER_TIPS.md](./DOCKER_TIPS.md) - Tips & tricks

🐛 **Issues:**
1. Check logs: `docker-compose logs`
2. Verify environment: `docker exec <container> env`
3. Access shell: `docker exec -it <container> sh`
4. Clean restart: `npm run docker:clean && npm run docker:dev:build`

🔗 **Resources:**
- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

## Comparison: Before vs After Docker

### Before Docker
```bash
# Install Node.js
# Install MongoDB
# Install dependencies
npm install
# Configure environment
cp .env.example .env
# Start server
npm start
# Different on every machine 😢
```

### After Docker
```bash
# Just run
npm run docker:dev
# Same everywhere! 🎉
```

---

**Status**: Production Ready ✅  
**Last Updated**: October 11, 2025  
**Docker Version**: 24.x  
**Node Version**: 18 Alpine
