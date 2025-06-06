const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const Database = require('./database');
const { execSync } = require('child_process');

// Set timezone to Eastern Time for the entire Node.js process
process.env.TZ = 'America/New_York';

// Get git version information
function getGitVersion() {
    try {
        const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 8);
        const commitMessage = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();
        const commitDate = execSync('git log -1 --pretty=%ci', { encoding: 'utf8' }).trim();
        const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        
        return {
            hash: commitHash,
            message: commitMessage,
            date: commitDate,
            branch: branch
        };
    } catch (error) {
        return {
            hash: 'unknown',
            message: 'Git not available',
            date: 'unknown',
            branch: 'unknown'
        };
    }
}

// Log startup information
const version = getGitVersion();
console.log('🚀 Discord Birthday Bot Starting...');
console.log('=====================================');
console.log(`📦 Version: ${version.hash} (${version.branch})`);
console.log(`💬 Commit: ${version.message}`);
console.log(`📅 Date: ${version.date}`);
console.log('');

// Log current timezone information for debugging
console.log('🕐 Timezone Configuration:');
console.log(`   System TZ: ${process.env.TZ}`);
console.log(`   Current time: ${new Date().toString()}`);
console.log(`   Current time (Eastern): ${new Date().toLocaleString("en-US", {timeZone: "America/New_York"})}`);

// Note: Environment variables should be passed directly to the process
// For local development, you can set them in your shell or IDE

// Load configuration from environment variables
const config = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    birthdayChannelId: process.env.BIRTHDAY_CHANNEL_ID
};

// Validate required environment variables
if (!config.token || !config.clientId || !config.birthdayChannelId) {
    console.error('❌ Missing required environment variables:');
    if (!config.token) console.error('  - DISCORD_TOKEN');
    if (!config.clientId) console.error('  - DISCORD_CLIENT_ID');
    if (!config.birthdayChannelId) console.error('  - BIRTHDAY_CHANNEL_ID');
    process.exit(1);
}

// Initialize database
let database;
try {
    database = new Database();
} catch (error) {
    console.error('❌ Fatal: Failed to initialize database:', error);
    console.error('🔍 This usually means:');
    console.error('   - Database directory does not exist and cannot be created');
    console.error('   - Permission issues with the data directory');
    console.error('   - SQLite is not properly installed');
    process.exit(1);
}

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// Bot ready event
client.once('ready', () => {
    console.log(`✅ ${client.user.tag} is online and ready!`);
    console.log(`📅 Birthday checking scheduled for 10:00 AM Eastern Time`);
    
    // Set bot status to "Listening to Happy Birthday"
    client.user.setPresence({
        activities: [{
            name: 'Happy Birthday',
            type: 2 // LISTENING type
        }],
        status: 'online'
    });
    console.log(`🎵 Bot status set to: Listening to Happy Birthday`);
    
    // Schedule birthday check for 10:00 AM Eastern Time daily
    // Using cron: '0 10 * * *' for 10:00 AM Eastern (considering daylight saving time)
    cron.schedule('0 10 * * *', checkBirthdays, {
        scheduled: true,
        timezone: "America/New_York"
    });
    
    // Schedule health check logging every 5 minutes
    cron.schedule('*/5 * * * *', () => {
        const health = healthCheck();
        console.log(`💚 Health Check - Status: ${health.status}, Uptime: ${Math.floor(health.uptime)}s, Ping: ${health.discord.ping}ms`);
    }, {
        scheduled: true,
        timezone: "America/New_York"
    });
});

// Slash command handling
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'setbirthday') {
        await handleSetBirthday(interaction);
    } else if (commandName === 'mybirthday') {
        await handleMyBirthday(interaction);
    } else if (commandName === 'listbirthdays') {
        await handleListBirthdays(interaction);
    }
});

async function handleSetBirthday(interaction) {
    const day = interaction.options.getInteger('day');
    const month = interaction.options.getInteger('month');
    const year = interaction.options.getInteger('year');

    // Validate day and month
    if (day < 1 || day > 31) {
        return await interaction.reply({
            content: '❌ Day must be between 1 and 31.',
            ephemeral: true
        });
    }

    if (month < 1 || month > 12) {
        return await interaction.reply({
            content: '❌ Month must be between 1 and 12.',
            ephemeral: true
        });
    }

    // Validate day for specific months
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day > daysInMonth[month - 1]) {
        return await interaction.reply({
            content: `❌ Invalid day for month ${month}. This month has a maximum of ${daysInMonth[month - 1]} days.`,
            ephemeral: true
        });
    }

    // Validate year if provided
    if (year && (year < 1900 || year > new Date().getFullYear())) {
        return await interaction.reply({
            content: '❌ Year must be between 1900 and the current year.',
            ephemeral: true
        });
    }

    try {
        await database.setBirthday(
            interaction.user.id,
            interaction.user.username,
            day,
            month,
            year
        );

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const birthdayString = year ? 
            `${monthNames[month - 1]} ${day}, ${year}` : 
            `${monthNames[month - 1]} ${day}`;

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎂 Birthday Set Successfully!')
            .setDescription(`Your birthday has been set to **${birthdayString}**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error setting birthday:', error);
        await interaction.reply({
            content: '❌ An error occurred while setting your birthday. Please try again.',
            ephemeral: true
        });
    }
}

async function handleMyBirthday(interaction) {
    try {
        const birthday = await database.getBirthday(interaction.user.id);

        if (!birthday) {
            return await interaction.reply({
                content: '❌ You haven\'t set your birthday yet! Use `/setbirthday` to set it.',
                ephemeral: true
            });
        }

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const birthdayString = birthday.year ? 
            `${monthNames[birthday.month - 1]} ${birthday.day}, ${birthday.year}` : 
            `${monthNames[birthday.month - 1]} ${birthday.day}`;

        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('🎂 Your Birthday')
            .setDescription(`Your birthday is set to **${birthdayString}**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error getting birthday:', error);
        await interaction.reply({
            content: '❌ An error occurred while retrieving your birthday.',
            ephemeral: true
        });
    }
}

async function handleListBirthdays(interaction) {
    try {
        const birthdays = await database.getAllBirthdays();

        if (birthdays.length === 0) {
            return await interaction.reply({
                content: '📅 No birthdays have been set yet!',
                ephemeral: true
            });
        }

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        let birthdayList = '';
        birthdays.forEach(birthday => {
            const dateString = `${monthNames[birthday.month - 1]} ${birthday.day}`;
            birthdayList += `• **${birthday.username}** - ${dateString}\n`;
        });

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎂 Server Birthdays')
            .setDescription(birthdayList || 'No birthdays found.')
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error listing birthdays:', error);
        await interaction.reply({
            content: '❌ An error occurred while retrieving birthdays.',
            ephemeral: true
        });
    }
}

async function checkBirthdays() {
    console.log('🔍 Checking for birthdays...');
    
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const month = easternTime.getMonth() + 1;
    const day = easternTime.getDate();
    
    // Debug timezone information
    console.log(`🕐 Time Debug - System: ${now.toString()}`);
    console.log(`🕐 Time Debug - Eastern: ${easternTime.toString()}`);
    console.log(`📅 Checking for birthdays on: ${month}/${day}`);

    try {
        const todaysBirthdays = await database.getTodaysBirthdays(month, day);

        if (todaysBirthdays.length === 0) {
            console.log('📅 No birthdays today.');
            return;
        }

        console.log(`🎉 Found ${todaysBirthdays.length} birthday(s) today!`);

        const channel = client.channels.cache.get(config.birthdayChannelId);
        if (!channel) {
            console.error('❌ Birthday channel not found!');
            return;
        }

        for (const birthday of todaysBirthdays) {
            let message = `🎉 @everyone\n\n🎂 **Happy Birthday ${birthday.username}!** 🎂\n\n`;
            
            if (birthday.year) {
                const age = easternTime.getFullYear() - birthday.year;
                message += `🎈 You're turning **${age}** today! 🎈\n\n`;
            }
            
            message += `Hope you have a wonderful day! 🎊`;

            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('🎂 Birthday Celebration! 🎂')
                .setDescription(message)
                .setThumbnail('https://cdn.discordapp.com/emojis/587053858308227077.gif')
                .setTimestamp();

            await channel.send({ 
                content: '@everyone',
                embeds: [embed] 
            });
        }

    } catch (error) {
        console.error('Error checking birthdays:', error);
    }
}

// Health check function
function healthCheck() {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: getGitVersion(),
        discord: {
            connected: client.isReady(),
            user: client.user ? client.user.tag : null,
            guilds: client.guilds.cache.size,
            ping: client.ws.ping
        },
        database: {
            connected: database.db ? true : false
        },
        timezone: {
            configured: process.env.TZ,
            current: new Date().toString(),
            eastern: new Date().toLocaleString("en-US", {timeZone: "America/New_York"})
        }
    };
    
    // Check if bot is actually ready
    if (!client.isReady()) {
        health.status = 'unhealthy';
    }
    
    return health;
}

// Health check endpoint for Docker
if (process.argv.includes('--health-check')) {
    const health = healthCheck();
    console.log(JSON.stringify(health, null, 2));
    process.exit(health.status === 'healthy' ? 0 : 1);
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🔄 Shutting down bot...');
    database.close();
    client.destroy();
    process.exit(0);
});

// Login to Discord
client.login(config.token); 