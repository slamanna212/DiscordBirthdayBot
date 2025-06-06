# Discord Birthday Bot 🎂

A Discord bot that tracks and announces member birthdays automatically!

## Features

- **Slash Commands**: Modern Discord slash command interface
- **Birthday Tracking**: Store birthdays with day, month, and optional year
- **Automatic Announcements**: Daily birthday announcements at 10:00 AM Eastern Time
- **Age Calculation**: Shows age if birth year is provided
- **Data Persistence**: SQLite database for reliable data storage
- **Cross-Platform**: Developed on Windows, deployable on Linux

## Commands

- `/setbirthday <day> <month> [year]` - Set your birthday
  - `day`: Day of the month (1-31) - **Required**
  - `month`: Month (1-12) - **Required**
  - `year`: Birth year (optional, for age calculation)

- `/mybirthday` - View your current birthday setting

- `/listbirthdays` - List all server birthdays (Admin only)

## Setup Instructions

### 1. Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section and click "Add Bot"
4. Copy the bot token (you'll need this later)
5. Under "Privileged Gateway Intents", enable:
   - Server Members Intent (if you want to fetch member info)
6. Go to "OAuth2" → "URL Generator"
   - Select "bot" and "applications.commands" scopes
   - Select "Send Messages", "Use Slash Commands", and "Mention Everyone" permissions
   - Copy the generated URL to invite the bot to your server

### 2. Install Dependencies

```bash
npm install
```

### 3. Get Your Discord Credentials

You'll need these values from the Discord Developer Portal:
- `DISCORD_TOKEN` - Your bot token
- `DISCORD_CLIENT_ID` - Your application client ID  
- `BIRTHDAY_CHANNEL_ID` - The channel ID where announcements will be sent
- `TZ` - Timezone for birthday notifications (optional, defaults to America/New_York)
- `BIRTHDAY_NOTIFICATION_HOUR` - Hour for notifications in 24-hour format (optional, defaults to 10)

These will be passed directly to the bot when you run it.

### 4. Install Dependencies

```bash
npm install
```

### 5. Deploy Slash Commands (Local Development)

```bash
# Set environment variables and deploy commands
DISCORD_TOKEN="your_token" DISCORD_CLIENT_ID="your_client_id" npm run deploy-commands
```

### 6. Run the Bot (Local Development)

```bash
# Set environment variables and run the bot
DISCORD_TOKEN="your_token" DISCORD_CLIENT_ID="your_client_id" BIRTHDAY_CHANNEL_ID="your_channel_id" npm start
```

## Deployment Options

### Option 1: Docker Deployment (Recommended)

The easiest way to deploy the bot, especially on Linux servers:

1. **Install Docker** on your target machine

2. **Deploy with command line arguments:**
   ```bash
   # Build and deploy with your credentials
   chmod +x scripts/docker-run.sh
   ./scripts/docker-run.sh "your_bot_token" "your_client_id" "your_channel_id"
   ```

3. **Or manually with Docker commands:**
   ```bash
   # Build the image
   npm run docker:build
   
   # Run the container with environment variables
   docker run -d \
     --name birthday_bot \
     --restart unless-stopped \
     -e TZ=America/New_York \
     -e NODE_ENV=production \
     -e DISCORD_TOKEN="your_token" \
     -e DISCORD_CLIENT_ID="your_client_id" \
     -e BIRTHDAY_CHANNEL_ID="your_channel_id" \
     -v ./data:/app/data \
     birthday-bot
   ```

4. **Manage the bot:**
   ```bash
   # View logs
   npm run docker:logs
   
   # Stop the bot
   npm run docker:stop
   
   # Restart the bot
   docker restart birthday_bot
   
   # Build image only
   npm run docker:build
   ```

### Option 2: Traditional Linux Deployment

When moving from Windows to Linux without Docker:

1. Copy all files to your Linux server
2. Install Node.js 22+ and npm on Linux
3. Run `npm install` to install dependencies for Linux
4. Use a process manager like PM2 for production:

```bash
npm install -g pm2

# Start with environment variables
pm2 start src/bot.js --name "birthday-bot" \
  --env DISCORD_TOKEN="your_token" \
  --env DISCORD_CLIENT_ID="your_client_id" \
  --env BIRTHDAY_CHANNEL_ID="your_channel_id" \
  --env NODE_ENV="production"

pm2 startup
pm2 save
```

## Database

The bot uses SQLite to store birthday data in a file called `birthdays.db`. This file will be created automatically when you first run the bot.

### Database Schema

```sql
CREATE TABLE birthdays (
    userId TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    day INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Birthday Announcements

- Runs daily at the **configured hour** in the configured timezone (defaults to 10:00 AM Eastern Time)
- Automatically handles Daylight Saving Time transitions
- Pings `@everyone` in the configured channel
- Shows age if birth year was provided during setup
- Beautiful embed messages with emojis

## Timezone Configuration

The bot uses a single `TZ` environment variable to control both the container timezone and notification scheduling:

- **Default**: `America/New_York` (Eastern Time)
- **Examples**: 
  - Pacific Time: `TZ=America/Los_Angeles`
  - Central Time: `TZ=America/Chicago`
  - Mountain Time: `TZ=America/Denver`
  - UTC: `TZ=UTC`
  - London: `TZ=Europe/London`
  - Tokyo: `TZ=Asia/Tokyo`

**Docker Example with Different Timezone:**
```bash
docker run -d \
  --name birthday_bot \
  --restart unless-stopped \
  -e TZ=America/Los_Angeles \
  -e NODE_ENV=production \
  -e DISCORD_TOKEN="your_token" \
  -e DISCORD_CLIENT_ID="your_client_id" \
  -e BIRTHDAY_CHANNEL_ID="your_channel_id" \
  -v ./data:/app/data \
  birthday-bot
```

## Notification Time Configuration

The bot uses the `BIRTHDAY_NOTIFICATION_HOUR` environment variable to control when birthday notifications are sent:

- **Default**: `10` (10:00 AM)
- **Format**: 24-hour format (0-23)
- **Frequency**: Daily at the top of the hour
- **Examples**:
  - `BIRTHDAY_NOTIFICATION_HOUR=0` → 12:00 AM (Midnight)
  - `BIRTHDAY_NOTIFICATION_HOUR=6` → 6:00 AM
  - `BIRTHDAY_NOTIFICATION_HOUR=12` → 12:00 PM (Noon)
  - `BIRTHDAY_NOTIFICATION_HOUR=18` → 6:00 PM
  - `BIRTHDAY_NOTIFICATION_HOUR=23` → 11:00 PM

**Docker Example with Custom Time (6:00 AM):**
```bash
docker run -d \
  --name birthday_bot \
  --restart unless-stopped \
  -e TZ=America/New_York \
  -e BIRTHDAY_NOTIFICATION_HOUR=6 \
  -e NODE_ENV=production \
  -e DISCORD_TOKEN="your_token" \
  -e DISCORD_CLIENT_ID="your_client_id" \
  -e BIRTHDAY_CHANNEL_ID="your_channel_id" \
  -v ./data:/app/data \
  birthday-bot
```

## GitHub Actions Workflows

This project includes automated GitHub Actions workflows:

### **🔄 Continuous Integration**

#### **`test.yml` - Testing & Validation**
- **Triggers**: Push to main/master, Pull Requests
- **Purpose**: Validates project structure and tests Docker build
- **Jobs**:
  - Tests Docker image build
  - Validates file structure
  - Checks package.json dependencies
  - Verifies environment example file

#### **`docker-build.yml` - Build & Push Images**
- **Triggers**: Push to main/master, Pull Requests, Releases
- **Purpose**: Builds and pushes Docker images to GitHub Container Registry
- **Features**:
  - Multi-platform builds (AMD64, ARM64)
  - Automated tagging (latest, version tags)
  - Docker layer caching for faster builds
  - Only pushes on main branch (not PRs)

### **🚀 Deployment**

#### **`deploy.yml` - Manual Deployment**
- **Triggers**: Manual workflow dispatch
- **Purpose**: Deploy the bot to production/staging environments
- **Features**:
  - Manual trigger with environment selection
  - Deploys slash commands automatically
  - Pulls latest image from registry
  - Environment-specific container naming
  - Deployment verification

### **📋 Using the Workflows**

1. **Automatic Testing**: Push code or create PR - tests run automatically
2. **Automatic Building**: Push to main branch - Docker image builds and pushes to GHCR
3. **Manual Deployment**: Go to Actions tab → Deploy → Fill in credentials → Run

### **🐳 Using Built Images**

Images are automatically pushed to GitHub Container Registry:

```bash
# Pull the latest image
docker pull ghcr.io/yourusername/discord-birthday-bot:latest

# Run with your credentials
docker run -d \
  --name birthday_bot \
  --restart unless-stopped \
  -e TZ=America/New_York \
  -e NODE_ENV=production \
  -e DISCORD_TOKEN="your_token" \
  -e DISCORD_CLIENT_ID="your_client_id" \
  -e BIRTHDAY_CHANNEL_ID="your_channel_id" \
  -v ./data:/app/data \
  ghcr.io/yourusername/discord-birthday-bot:latest
```

## License

MIT License - Feel free to modify and distribute! 