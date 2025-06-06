#!/bin/bash

# Discord Birthday Bot - Docker Deployment Script

echo "🐳 Discord Birthday Bot - Docker Setup"
echo "======================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi



# Create data directory for database persistence
echo "📁 Creating data directory with proper permissions..."
mkdir -p ./data

# Set permissions for the container user (UID 1001, GID 1001)
# This ensures the botuser in the container can write to the mounted volume
echo "🔧 Setting permissions for container user (UID 1001:1001)..."
if command -v chown &> /dev/null; then
    sudo chown -R 1001:1001 ./data 2>/dev/null || {
        echo "⚠️  Could not set ownership to 1001:1001, trying current user..."
        # Fallback: make directory writable by all users
        chmod 777 ./data
    }
else
    echo "⚠️  chown not available, making directory world-writable..."
    chmod 777 ./data
fi

# Check if required arguments are provided
if [ $# -lt 3 ]; then
    echo "❌ Usage: $0 <DISCORD_TOKEN> <DISCORD_CLIENT_ID> <BIRTHDAY_CHANNEL_ID>"
    echo ""
    echo "Example:"
    echo "$0 \"your_bot_token\" \"your_client_id\" \"your_channel_id\""
    exit 1
fi

DISCORD_TOKEN="$1"
DISCORD_CLIENT_ID="$2"
BIRTHDAY_CHANNEL_ID="$3"

# Deploy slash commands first
echo "🔧 Deploying slash commands..."
echo "Building Docker image for command deployment..."
docker build -f docker/Dockerfile -t birthday-bot .

echo "Deploying commands to Discord..."
docker run --rm \
    -e DISCORD_TOKEN="$DISCORD_TOKEN" \
    -e DISCORD_CLIENT_ID="$DISCORD_CLIENT_ID" \
    birthday-bot node scripts/deploy-commands.js

if [ $? -eq 0 ]; then
    echo "✅ Slash commands deployed successfully!"
else
    echo "❌ Failed to deploy slash commands. Check your credentials"
    exit 1
fi

# Start the bot with Docker
echo "🚀 Starting Discord Birthday Bot..."

# Stop any existing container
docker stop birthday_bot 2>/dev/null || true
docker rm birthday_bot 2>/dev/null || true

# Test permissions first
echo "🧪 Testing Docker permissions..."
docker run --rm \
    -e NODE_ENV=production \
    -v "$(pwd)/data:/app/data" \
    birthday-bot node scripts/test-docker-permissions.js

if [ $? -ne 0 ]; then
    echo "❌ Permission test failed. Please check the logs above."
    exit 1
fi

echo "✅ Permission test passed!"

# Run the bot container
docker run -d \
    --name birthday_bot \
    --restart unless-stopped \
    -e TZ=America/New_York \
    -e NODE_ENV=production \
    -e DISCORD_TOKEN="$DISCORD_TOKEN" \
    -e DISCORD_CLIENT_ID="$DISCORD_CLIENT_ID" \
    -e BIRTHDAY_CHANNEL_ID="$BIRTHDAY_CHANNEL_ID" \
    -v "$(pwd)/data:/app/data" \
    birthday-bot

if [ $? -eq 0 ]; then
    echo "✅ Bot started successfully!"
    echo ""
    echo "📊 To view logs: docker logs -f birthday_bot"
    echo "🛑 To stop the bot: docker stop birthday_bot"
    echo "🔄 To restart the bot: docker restart birthday_bot"
    echo "🗑️ To remove the bot: docker stop birthday_bot && docker rm birthday_bot"
    echo ""
    echo "Bot is now running and will check for birthdays daily at 10:00 AM Eastern Time!"
else
    echo "❌ Failed to start the bot"
    exit 1
fi 