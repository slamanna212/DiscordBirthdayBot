# Discord Birthday Bot 🎂

A Discord bot that tracks and announces member birthdays automatically!

## Birthday Announcements

- Runs daily at the **configured hour** in the configured timezone (defaults to 10:00 AM Eastern Time)
- Automatically handles Daylight Saving Time transitions
- Pings `@everyone` in the configured channel
- Shows age if birth year was provided during setup
- Beautiful embed messages with emojis


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

### 2. Get Your Discord Credentials

You'll need these values from the Discord Developer Portal:
- `DISCORD_TOKEN` - Your bot token
- `DISCORD_CLIENT_ID` - Your application client ID  
- `BIRTHDAY_CHANNEL_ID` - The channel ID where announcements will be sent
- `TZ` - Timezone for birthday notifications (optional, defaults to America/New_York)
- `BIRTHDAY_NOTIFICATION_HOUR` - Hour for notifications in 24-hour format (optional, defaults to 10)


### 3. Deploy Slash Commands Using Docker (One Time)
   ```bash
   # Deploy commands to Discord (one-time setup)
   docker run --rm \
     -e DISCORD_TOKEN="your_bot_token" \
     -e DISCORD_CLIENT_ID="your_client_id" \
     ghcr.io/slamanna212/discord-birthday-bot:latest \
     node scripts/deploy-commands.js
   ```

### 4. Run the Bot Using Docker
 ```docker
 docker run -d \
   --name birthday_bot \
   --restart unless-stopped \
   -e TZ=America/New_York \
   -e BIRTHDAY_NOTIFICATION_HOUR=10 \
   -e NODE_ENV=production \
   -e DISCORD_TOKEN="your_bot_token" \
   -e DISCORD_CLIENT_ID="your_client_id" \
   -e BIRTHDAY_CHANNEL_ID="your_channel_id" \
   -v ./data:/app/data \
   ghcr.io/slamanna212/discord-birthday-bot:latest
   ```

## Environment Variables

The bot uses several environment variables for configuration. Here's a complete reference:

### Required Variables

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `DISCORD_TOKEN` | Your bot's token from Discord Developer Portal | `MTEx...` | **Required** - Keep this secret! |
| `DISCORD_CLIENT_ID` | Your application's client ID | `123456789012345678` | **Required** - Found in Discord Developer Portal |
| `BIRTHDAY_CHANNEL_ID` | Channel ID where birthday announcements are sent | `123456789012345678` | **Required** - Right-click channel → Copy ID |
| `NODE_ENV` | Node.js environment | `development` | `development`, `production` | `production` |

### Optional Variables

| Variable | Description | Default | Valid Values | Example |
|----------|-------------|---------|--------------|---------|
| `TZ` | Timezone for birthday notifications | `America/New_York` | Any valid IANA timezone | `America/Los_Angeles`, `UTC`, `Europe/London` |
| `BIRTHDAY_NOTIFICATION_HOUR` | Hour to send birthday notifications (24-hour format) | `10` | `0-23` | `6` (6:00 AM), `18` (6:00 PM) |


### Getting Environment Variable Values

#### Discord Token & Client ID
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. **Bot Token**: Go to "Bot" section → Copy token
4. **Client ID**: Go to "General Information" → Copy Application ID

#### Channel ID
1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click the channel where you want birthday announcements
3. Select "Copy ID"

#### Timezone Values
Use standard IANA timezone names:
- **US Timezones**: `America/New_York`, `America/Chicago`, `America/Denver`, `America/Los_Angeles`
- **Other Common**: `UTC`, `Europe/London`, `Asia/Tokyo`, `Australia/Sydney`
- **Full List**: [Wikipedia IANA Timezone List](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

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

## License

MIT License - Feel free to modify and distribute! 