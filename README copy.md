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

You'll need these three values from the Discord Developer Portal:
- `DISCORD_TOKEN` - Your bot token
- `DISCORD_CLIENT_ID` - Your application client ID  
- `BIRTHDAY_CHANNEL_ID` - The channel ID where announcements will be sent

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
2. Install Node.js and npm on Linux
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

- Runs daily at **10:00 AM Eastern Time**
- Automatically handles Daylight Saving Time transitions
- Pings `@everyone` in the configured channel
- Shows age if birth year was provided during setup
- Beautiful embed messages with emojis

## File Structure

```
discord-birthday-bot/
├── .github/                # GitHub Actions workflows
│   └── workflows/
│       ├── docker-build.yml    # Build & push Docker images
│       ├── test.yml            # Testing & validation
│       └── deploy.yml          # Manual deployment
├── src/                    # Source code
│   ├── bot.js              # Main bot application
│   └── database.js         # Database operations
├── scripts/                # Utility scripts
│   ├── deploy-commands.js  # Slash command deployment
│   └── docker-run.sh       # Docker deployment script
├── docker/                 # Docker configuration
│   ├── Dockerfile          # Docker container configuration
│   └── .dockerignore       # Docker build exclusions
├── data/                   # Database storage (created automatically)
│   └── birthdays.db        # SQLite database (in Docker)
├── env.example             # Environment variables reference
├── package.json            # Dependencies and scripts
├── .gitignore              # Git exclusions
├── birthdays.db            # SQLite database (local development)
└── README.md              # This file
```

## Docker Deployment Method

Docker deployment uses environment variables passed directly via `-e` flags:

### **Command Line Arguments**
- Uses `docker-run.sh` script  
- Pass credentials directly as command line arguments
- Secure - no credential files on disk
- Perfect for production deployment scripts and CI/CD
- Command: `./scripts/docker-run.sh "token" "client_id" "channel_id"`

### **Benefits of Docker Deployment:**

- 🎯 **No dependency issues** - Everything runs in an isolated container
- 📦 **Consistent environment** - Same container works on any Docker-capable system
- 🔧 **Easy management** - Simple start/stop/restart commands
- 🐳 **Standard Docker commands** - No Docker Compose required
- 📚 **Portable** - Easy to move between development and production
- 🚀 **Auto-restart** - Container automatically restarts if it crashes

## Troubleshooting

### Bot doesn't respond to commands
- Make sure you've deployed the slash commands first
- Check that the bot has the necessary permissions in your server
- Verify your environment variables are set correctly

### Birthday announcements not working
- Check that the `BIRTHDAY_CHANNEL_ID` environment variable is correct
- Ensure the bot has permission to send messages in that channel
- Check the bot's console logs for any errors

### Database errors
- Make sure the bot has write permissions in its directory
- Check disk space availability
- Restart the bot if database connection issues occur

## Support

If you encounter any issues, check the console output for error messages. Most problems are related to configuration or Discord permissions.

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