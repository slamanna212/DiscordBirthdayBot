# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY src/ ./src/
COPY scripts/ ./scripts/

# Create directory for database
RUN mkdir -p /app/data

# Set timezone to Eastern Time for proper birthday scheduling
ENV TZ=America/New_York

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001

# Change ownership of app directory to botuser
RUN chown -R botuser:nodejs /app
USER botuser

# Expose port (not really needed for Discord bot, but good practice)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('Bot is running')" || exit 1

# Start the bot
CMD ["node", "src/bot.js"] 