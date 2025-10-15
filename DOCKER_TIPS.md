# Docker Development Tips & Tricks

## Quick Reference

### Start Development
```bash
npm run docker:dev
# or
docker-compose up yoraa-backend-dev
```

### Start Production
```bash
npm run docker:prod
# or
docker-compose up yoraa-backend-prod
```

### View Logs
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

### Rebuild After Changes
```bash
# Development
npm run docker:dev:build

# Production
npm run docker:prod:build
```

### Stop Everything
```bash
npm run docker:down
# or
docker-compose down
```

### Clean Everything
```bash
npm run docker:clean
# or
docker-compose down -v && docker system prune -f
```

---

## Development Workflow

### 1. First Time Setup
```bash
# Install Docker Desktop for Mac
# Download from: https://www.docker.com/products/docker-desktop

# Verify installation
docker --version
docker-compose --version

# Start development
npm run docker:dev:build
```

### 2. Daily Development
```bash
# Start containers
npm run docker:dev

# Code changes are automatically detected (hot reload)
# No need to restart

# View logs in real-time
docker-compose logs -f yoraa-backend-dev
```

### 3. Testing Locally
```bash
# Test development
curl http://localhost:8001/health

# Test production build locally
npm run docker:prod:build
curl http://localhost:8080/health
```

---

## Common Issues & Solutions

### Issue: Port Already in Use
```bash
# Find process using port
lsof -i :8001

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Issue: Changes Not Reflecting
```bash
# Make sure you're running dev, not prod
npm run docker:down
npm run docker:dev

# For package.json changes, rebuild
npm run docker:dev:build
```

### Issue: Container Won't Start
```bash
# Check logs
docker-compose logs yoraa-backend-dev

# Check if .env file exists
ls -la .env.development

# Try clean restart
npm run docker:clean
npm run docker:dev:build
```

### Issue: Database Connection Failed
```bash
# If using local MongoDB, update .env.development
# Change:
MONGO_URI=mongodb://localhost:27017/yoraa1
# To:
MONGO_URI=mongodb://host.docker.internal:27017/yoraa1
```

### Issue: Permission Denied
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Or run with sudo (not recommended)
sudo docker-compose up
```

---

## Database Connection from Docker

### Local MongoDB
```bash
# In .env.development
MONGO_URI=mongodb://host.docker.internal:27017/yoraa1
```

### Remote MongoDB
```bash
# In .env.production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/yoraa1
```

### MongoDB in Docker
```yaml
# Add to docker-compose.yml
services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

# Then use:
MONGO_URI=mongodb://mongodb:27017/yoraa1
```

---

## VS Code Integration

### Recommended Extensions
- **Docker** (ms-azuretools.vscode-docker)
- **Remote - Containers** (ms-vscode-remote.remote-containers)

### Attach VS Code to Container
1. Install Docker extension
2. Right-click container in Docker view
3. Select "Attach Visual Studio Code"

### Debug Inside Container
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach to Node",
  "remoteRoot": "/app",
  "port": 9229,
  "restart": true
}
```

---

## Production Deployment

### Manual Deployment
```bash
# On server
git pull
./deploy-docker.sh
```

### Automated Deployment (CI/CD)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build and Deploy
        run: |
          docker-compose build yoraa-backend-prod
          docker-compose up -d yoraa-backend-prod
```

---

## Monitoring

### Check Container Status
```bash
# List all containers
docker ps

# Check specific container
docker ps --filter name=yoraa

# Check health
docker inspect yoraa-api-prod | grep -A 10 Health
```

### Monitor Resources
```bash
# Real-time stats
docker stats yoraa-api-dev

# Disk usage
docker system df
```

### Access Logs
```bash
# Live logs
docker-compose logs -f yoraa-backend-prod

# Save logs to file
docker-compose logs yoraa-backend-prod > logs.txt
```

---

## Performance Optimization

### Build Optimization
```dockerfile
# Use .dockerignore to exclude unnecessary files
# Order Dockerfile commands from least to most frequently changed
# Use multi-stage builds
# Minimize layers
```

### Runtime Optimization
```yaml
# docker-compose.yml
services:
  yoraa-backend-prod:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## Backup & Restore

### Backup Container
```bash
# Commit container as image
docker commit yoraa-api-prod yoraa-backup:$(date +%Y%m%d)

# Save image to file
docker save yoraa-backup:20251011 | gzip > yoraa-backup-20251011.tar.gz
```

### Restore Container
```bash
# Load image from file
gunzip -c yoraa-backup-20251011.tar.gz | docker load

# Run restored image
docker run -d -p 8080:8080 --env-file .env.production yoraa-backup:20251011
```

---

## Security Best Practices

### 1. Environment Variables
```bash
# Never commit .env files
# Use secrets management (Docker secrets, Vault)
# Rotate credentials regularly
```

### 2. User Permissions
```dockerfile
# Run as non-root user (already configured)
USER nodejs
```

### 3. Network Security
```yaml
# Use internal networks
networks:
  yoraa-network:
    internal: true  # No external access
```

### 4. Image Updates
```bash
# Regularly update base images
docker pull node:18-alpine
docker-compose build --no-cache
```

---

## Testing

### Run Tests in Container
```bash
# Add to package.json
"test:docker": "docker-compose run --rm yoraa-backend-dev npm test"

# Run
npm run test:docker
```

### Integration Testing
```bash
# Start test environment
docker-compose -f docker-compose.test.yml up

# Run tests
npm run test:integration

# Cleanup
docker-compose -f docker-compose.test.yml down
```

---

## Useful Docker Commands

### Images
```bash
# List images
docker images

# Remove unused images
docker image prune

# Remove specific image
docker rmi <image-id>
```

### Containers
```bash
# List all containers (including stopped)
docker ps -a

# Remove stopped containers
docker container prune

# Remove specific container
docker rm <container-id>
```

### Volumes
```bash
# List volumes
docker volume ls

# Remove unused volumes
docker volume prune

# Inspect volume
docker volume inspect yoraa-logs
```

### Networks
```bash
# List networks
docker network ls

# Inspect network
docker network inspect yoraa-network
```

### System
```bash
# Show disk usage
docker system df

# Clean everything
docker system prune -a --volumes
```

---

## Environment Variables Reference

### Development (.env.development)
- `NODE_ENV=development`
- `PORT=8080` (mapped to host 8001)
- `MONGO_URI=mongodb://host.docker.internal:27017/yoraa1`
- Debug logging enabled
- Lower security for testing

### Production (.env.production)
- `NODE_ENV=production`
- `PORT=8080`
- `MONGO_URI=<production-mongodb-url>`
- Minimal logging
- Strict security

---

## Support

### Check Documentation
- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

### Debugging Help
1. Check container logs: `docker-compose logs`
2. Check container status: `docker ps`
3. Access container: `docker exec -it <container> sh`
4. Check environment: `docker exec <container> env`
5. Check network: `docker network inspect yoraa-network`

---

**Last Updated**: October 11, 2025
