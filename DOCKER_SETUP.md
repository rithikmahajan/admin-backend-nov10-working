# 🐳 Docker Setup Guide - Yoraa Backend

## Overview

This project uses Docker to ensure **consistent environments** across development and production. The same container setup runs everywhere, eliminating "works on my machine" issues.

---

## 🚀 Quick Start

### Development Environment

```bash
# Start development server with hot reload
npm run docker:dev

# Or rebuild and start
npm run docker:dev:build
```

**Development runs on:** `http://localhost:8001`

### Production Environment

```bash
# Start production server
npm run docker:prod

# Or rebuild and start
npm run docker:prod:build
```

**Production runs on:** `http://localhost:8080`

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run docker:dev` | Start development container |
| `npm run docker:prod` | Start production container |
| `npm run docker:dev:build` | Rebuild and start dev container |
| `npm run docker:prod:build` | Rebuild and start prod container |
| `npm run docker:down` | Stop all containers |
| `npm run docker:clean` | Stop containers and clean volumes |

### Using Docker Compose Directly

```bash
# Start both dev and prod
docker-compose up

# Start specific service
docker-compose up yoraa-backend-dev
docker-compose up yoraa-backend-prod

# Run in background
docker-compose up -d yoraa-backend-dev

# View logs
docker-compose logs -f yoraa-backend-dev

# Stop containers
docker-compose down

# Rebuild containers
docker-compose build
```

---

## 🏗️ Architecture

### Multi-Stage Dockerfile

The `Dockerfile` uses multi-stage builds:

1. **Base Stage**: Common setup for both environments
2. **Development Stage**: 
   - All dependencies installed
   - Hot reload enabled with nodemon
   - Source code mounted as volume
3. **Production Stage**: 
   - Only production dependencies
   - Optimized for performance
   - No source code mounting

### Docker Compose Services

- **yoraa-backend-dev**: Development service (port 8001)
- **yoraa-backend-prod**: Production service (port 8080)

---

## 📁 Project Structure

```
.
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Service definitions
├── .dockerignore          # Files excluded from build
├── .env.development       # Dev environment variables
├── .env.production        # Prod environment variables
├── package.json           # Docker scripts added
└── src/                   # Source code
```

---

## 🔧 Configuration

### Environment Files

**Development** (`.env.development`):
- Connected to local/test databases
- Debug logging enabled
- Lower security requirements
- Port 8001

**Production** (`.env.production`):
- Connected to production databases
- Minimal logging
- Strict security
- Port 8080

### Port Mapping

| Environment | Container Port | Host Port | URL |
|-------------|----------------|-----------|-----|
| Development | 8080 | 8001 | http://localhost:8001 |
| Production | 8080 | 8080 | http://localhost:8080 |

---

## 💡 Development Workflow

### 1. Start Development Container

```bash
npm run docker:dev
```

### 2. Make Code Changes

Your code changes are automatically reflected (hot reload via nodemon).

### 3. View Logs

```bash
docker-compose logs -f yoraa-backend-dev
```

### 4. Access Container Shell

```bash
docker exec -it yoraa-api-dev sh
```

### 5. Stop Development

```bash
npm run docker:down
```

---

## 🚢 Production Deployment

### Local Production Testing

```bash
# Test production build locally
npm run docker:prod:build
```

### Deploy to Server

#### Option 1: Docker Compose (Recommended)

```bash
# On server
git pull
docker-compose build yoraa-backend-prod
docker-compose up -d yoraa-backend-prod
```

#### Option 2: Docker Build & Run

```bash
# Build image
docker build --target production -t yoraa-backend:latest .

# Run container
docker run -d \
  --name yoraa-api \
  -p 8080:8080 \
  --env-file .env.production \
  --restart unless-stopped \
  yoraa-backend:latest
```

#### Option 3: Docker Hub Registry

```bash
# Tag image
docker tag yoraa-backend:latest yourusername/yoraa-backend:latest

# Push to registry
docker push yourusername/yoraa-backend:latest

# Pull and run on server
docker pull yourusername/yoraa-backend:latest
docker run -d -p 8080:8080 --env-file .env.production yourusername/yoraa-backend:latest
```

---

## 🔍 Debugging

### View Container Logs

```bash
# Development
docker-compose logs -f yoraa-backend-dev

# Production
docker-compose logs -f yoraa-backend-prod

# Last 100 lines
docker-compose logs --tail=100 yoraa-backend-dev
```

### Access Container Shell

```bash
# Development
docker exec -it yoraa-api-dev sh

# Production
docker exec -it yoraa-api-prod sh
```

### Check Container Status

```bash
# List running containers
docker ps

# Check health status
docker inspect yoraa-api-dev | grep Health
```

### View Resource Usage

```bash
docker stats yoraa-api-dev
```

---

## 🧹 Maintenance

### Clean Up Development

```bash
# Stop and remove containers
npm run docker:down

# Clean volumes and cache
npm run docker:clean
```

### Rebuild After Package Changes

```bash
# When you update package.json
npm run docker:dev:build
```

### Update Dependencies

```bash
# Inside container
docker exec -it yoraa-api-dev npm install <package>

# Or rebuild
npm run docker:dev:build
```

---

## ✅ Health Checks

Both containers include health checks:

- **Endpoint**: `http://localhost:8080/health`
- **Interval**: Every 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3 times
- **Start Period**: 5 seconds (production), 40 seconds (dev)

Check health status:

```bash
docker inspect yoraa-api-dev | grep -A 10 Health
```

---

## 🔒 Security

### Non-Root User

Containers run as non-root user `nodejs` (UID 1001) for security.

### Environment Variables

Never commit `.env.*` files. They are excluded in `.dockerignore`.

### Production Best Practices

- Only production dependencies installed
- No development tools
- Minimal Alpine Linux base
- Regular security updates

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs yoraa-backend-dev

# Check if port is already in use
lsof -i :8001
```

### Hot Reload Not Working

Make sure volume mounts are correct in `docker-compose.yml`:

```yaml
volumes:
  - .:/app
  - /app/node_modules
```

### Database Connection Issues

1. Check `.env.development` or `.env.production`
2. Ensure database is accessible from container
3. For local MongoDB, use `host.docker.internal` instead of `localhost`

### Permission Errors

```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

### Clean Start

```bash
# Remove everything and start fresh
npm run docker:clean
npm run docker:dev:build
```

---

## 📊 Monitoring

### View Live Logs

```bash
# Development
docker-compose logs -f yoraa-backend-dev

# Production
docker-compose logs -f yoraa-backend-prod
```

### Monitor Resource Usage

```bash
docker stats
```

### Check Container Health

```bash
curl http://localhost:8001/health  # Development
curl http://localhost:8080/health  # Production
```

---

## 🚀 Performance Tips

1. **Use .dockerignore**: Exclude unnecessary files from build context
2. **Layer Caching**: Order Dockerfile commands from least to most frequently changed
3. **Multi-Stage Builds**: Keep production images small
4. **Volume Mounts**: Use for development hot reload only
5. **Health Checks**: Monitor container health automatically

---

## 📝 Environment Parity

| Aspect | Development | Production |
|--------|-------------|------------|
| Base Image | node:18-alpine | node:18-alpine |
| Dependencies | All (dev + prod) | Production only |
| Hot Reload | ✅ Yes (nodemon) | ❌ No |
| Volume Mounts | ✅ Source code | ❌ None |
| Optimizations | Minimal | Maximum |
| Port | 8001 | 8080 |

**Result**: Same runtime, different optimizations!

---

## 🎯 Next Steps

1. ✅ **Test Development**: `npm run docker:dev`
2. ✅ **Test Production**: `npm run docker:prod`
3. ✅ **Update CI/CD**: Use Docker for deployments
4. ✅ **Monitor**: Set up container monitoring
5. ✅ **Scale**: Use orchestration (Kubernetes, Docker Swarm) if needed

---

**Last Updated**: October 11, 2025  
**Status**: Production Ready ✅
