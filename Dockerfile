# Yoraa Backend Dockerfile (Production & Development)
# Multi-stage build for optimized production and flexible development

FROM node:18-alpine AS base

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Install ALL dependencies (including devDependencies)
RUN npm install && npm cache clean --force

# Copy all source files
COPY --chown=nodejs:nodejs . .

# Create logs directory
RUN mkdir -p /var/log/pm2 && chown -R nodejs:nodejs /var/log/pm2

# Switch to non-root user
USER nodejs

# Expose the port
EXPOSE 8080

# Start with nodemon for hot reload
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy backend source code (excluding admin panel via .dockerignore)
COPY --chown=nodejs:nodejs index.js ./
COPY --chown=nodejs:nodejs ecosystem.config.js ./
COPY --chown=nodejs:nodejs firebase.json ./
COPY --chown=nodejs:nodejs firestore.* ./
COPY --chown=nodejs:nodejs *AccountKey.json ./
COPY --chown=nodejs:nodejs firebase-service-account.json* ./
# .env files are injected at runtime via docker-compose env_file
COPY --chown=nodejs:nodejs src/ ./src/

# Create logs directory
RUN mkdir -p /var/log/pm2 && chown -R nodejs:nodejs /var/log/pm2

# Switch to non-root user
USER nodejs

# Expose the port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["npm", "run", "prod"]
