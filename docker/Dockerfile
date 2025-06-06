# Build stage
FROM node:18-alpine AS builder

# Install build dependencies for native modules (like sqlite3)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    sqlite-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with fallback
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies and timezone data
RUN apk add --no-cache sqlite tzdata git

# Set working directory
WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy package.json for reference
COPY package*.json ./

# Copy application files
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY .git/ ./.git/

# Set timezone to Eastern Time for proper birthday scheduling
ENV TZ=America/New_York

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001

# Create directory for database with proper permissions
RUN mkdir -p /app/data && \
    chown -R botuser:nodejs /app/data

# Change ownership of app directory to botuser
RUN chown -R botuser:nodejs /app
USER botuser

# Expose port (not really needed for Discord bot, but good practice)
EXPOSE 3000

# Health check - verify bot is connected and ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node src/bot.js --health-check || exit 1

# Start the bot
CMD ["node", "src/bot.js"] 