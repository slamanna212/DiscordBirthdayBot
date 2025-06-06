const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const Database = require('./database');
const { execSync } = require('child_process');

// Set timezone for the entire Node.js process (defaults to Eastern Time)
const TIMEZONE = process.env.TZ || 'America/New_York';
process.env.TZ = TIMEZONE;

// Get notification hour from environment variable (defaults to 10 AM, 24-hour format)
const NOTIFICATION_HOUR = parseInt(process.env.BIRTHDAY_NOTIFICATION_HOUR || '10', 10);

// Validate notification hour
if (NOTIFICATION_HOUR < 0 || NOTIFICATION_HOUR > 23 || isNaN(NOTIFICATION_HOUR)) {
    console.error('❌ Invalid BIRTHDAY_NOTIFICATION_HOUR. Must be 0-23 (24-hour format).');
    console.error(`   Provided: ${process.env.BIRTHDAY_NOTIFICATION_HOUR}`);
    console.error('   Example: BIRTHDAY_NOTIFICATION_HOUR=10 for 10:00 AM');
    process.exit(1);
}

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
console.log('🕐 Configuration:');
console.log(`   Timezone: ${TIMEZONE}`);
console.log(`   Notification Hour: ${NOTIFICATION_HOUR}:00 (${NOTIFICATION_HOUR === 0 ? '12:00 AM' : NOTIFICATION_HOUR <= 12 ? NOTIFICATION_HOUR + ':00 AM' : (NOTIFICATION_HOUR - 12) + ':00 PM'})`);
console.log(`   System TZ: ${process.env.TZ}`);
console.log(`   Current time: ${new Date().toString()}`);
console.log(`   Current time (Configured): ${new Date().toLocaleString("en-US", {timeZone: TIMEZONE})}`);

// Note: Environment variables should be passed directly to the process
// For local development, you can set them in your shell or IDE

// Load configuration from environment variables
const config = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    birthdayChannelId: process.env.BIRTHDAY_CHANNEL_ID,
    birthdayRoleId: process.env.BIRTHDAY_ROLE_ID // Optional: role to assign on birthdays
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
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers // Required for role management
    ]
});

// Write health status to file for Docker health check
function writeHealthStatus() {
    const fs = require('fs');
    const path = require('path');
    
    const health = {
        status: client.isReady() ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: getGitVersion(),
        configuration: {
            timezone: TIMEZONE,
            notificationHour: NOTIFICATION_HOUR
        },
        discord: {
            connected: client.isReady(),
            user: client.user ? client.user.tag : null,
            guilds: client.guilds.cache.size,
            ping: client.ws.ping
        }
    };
    
    try {
        const healthFile = path.join(__dirname, '..', 'data', 'health.json');
        fs.writeFileSync(healthFile, JSON.stringify(health, null, 2));
    } catch (error) {
        console.error('Failed to write health status:', error.message);
    }
}

// Bot ready event
client.once('ready', () => {
    console.log(`✅ ${client.user.tag} is online and ready!`);
    
    const timeDisplay = NOTIFICATION_HOUR === 0 ? '12:00 AM' : 
                       NOTIFICATION_HOUR <= 12 ? `${NOTIFICATION_HOUR}:00 AM` : 
                       `${NOTIFICATION_HOUR - 12}:00 PM`;
    console.log(`📅 Birthday checking scheduled for ${timeDisplay} ${TIMEZONE} time`);
    
    // Log birthday role configuration
    if (config.birthdayRoleId) {
        console.log(`🎭 Birthday role configured: ${config.birthdayRoleId}`);
    } else {
        console.log(`🎭 No birthday role configured (BIRTHDAY_ROLE_ID not set)`);
    }
    
    // Set bot status to "Listening to Happy Birthday"
    client.user.setPresence({
        activities: [{
            name: 'Happy Birthday',
            type: 2 // LISTENING type
        }],
        status: 'online'
    });
    console.log(`🎵 Bot status set to: Listening to Happy Birthday`);
    
    // Write initial health status
    writeHealthStatus();
    
    // Schedule birthday check for the configured hour in the configured timezone daily
    // Using cron: '0 H * * *' where H is the notification hour
    const cronPattern = `0 ${NOTIFICATION_HOUR} * * *`;
    console.log(`⏰ Cron pattern: ${cronPattern}`);
    
    cron.schedule(cronPattern, checkBirthdays, {
        scheduled: true,
        timezone: TIMEZONE
    });
    
    // Schedule health check logging and file updates every minute
    cron.schedule('* * * * *', () => {
        const health = healthCheck();
        console.log(`💚 Health Check - Status: ${health.status}, Uptime: ${Math.floor(health.uptime)}s, Ping: ${health.discord.ping}ms`);
        writeHealthStatus();
    }, {
        scheduled: true,
        timezone: TIMEZONE
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
    } else if (commandName === 'testbirthday') {
        await handleTestBirthday(interaction);
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

async function handleTestBirthday(interaction) {
    try {
        const channel = client.channels.cache.get(config.birthdayChannelId);
        
        if (!channel) {
            return await interaction.reply({
                content: '❌ Birthday channel not found! Please check your configuration.',
                ephemeral: true
            });
        }

        // Create test birthday message using Ben Franklin as the test user
        // Using 1706 as birth year (real historical birth year) to show age calculation
        const testUsername = 'Ben Franklin';
        const currentYear = new Date().getFullYear();
        const testAge = currentYear - 1706; // Ben Franklin was born in 1706
        
        let message = `🎉\n\n🎂 **Happy Birthday ${testUsername}!** 🎂\n\n`;
        message += `🎈 You're turning **${testAge}** today! 🎈\n\n`;
        message += `Hope you have a wonderful day! 🎊`;

        const embed = new EmbedBuilder()
            .setColor('#ac1cfe')
            .setTitle('🎂 Birthday Celebration! 🎂')
            .setDescription(message)
            .setImage('https://slamanna.com/rehero/hbd.png')
            .setTimestamp()
            .setFooter({ text: 'This is a test message' });

        await channel.send({ 
            embeds: [embed] 
        });

        // Confirm to the admin that the test was sent
        await interaction.reply({
            content: `✅ Test birthday message sent to <#${config.birthdayChannelId}> for ${testUsername}!`,
            ephemeral: true
        });

        console.log(`🧪 Test birthday message sent by ${interaction.user.tag} for ${testUsername}`);

    } catch (error) {
        console.error('Error sending test birthday:', error);
        await interaction.reply({
            content: '❌ An error occurred while sending the test birthday message.',
            ephemeral: true
        });
    }
}

async function checkBirthdays() {
    console.log('🔍 Checking for birthdays...');
    
    const now = new Date();
    const localTime = new Date(now.toLocaleString("en-US", {timeZone: TIMEZONE}));
    const month = localTime.getMonth() + 1;
    const day = localTime.getDate();
    
    // Debug timezone information
    console.log(`🕐 Time Debug - System: ${now.toString()}`);
    console.log(`🕐 Time Debug - Local (${TIMEZONE}): ${localTime.toString()}`);
    console.log(`📅 Checking for birthdays on: ${month}/${day}`);

    try {
        const todaysBirthdays = await database.getTodaysBirthdays(month, day);
        const channel = client.channels.cache.get(config.birthdayChannelId);
        
        if (!channel) {
            console.error('❌ Birthday channel not found!');
            return;
        }

        // Handle birthday role management if configured
        if (config.birthdayRoleId) {
            await manageBirthdayRoles(todaysBirthdays, channel.guild);
        }

        if (todaysBirthdays.length === 0) {
            console.log('📅 No birthdays today.');
            return;
        }

        console.log(`🎉 Found ${todaysBirthdays.length} birthday(s) today!`);

        for (const birthday of todaysBirthdays) {
            let message = `🎉 @everyone\n\n🎂 **Happy Birthday ${birthday.username}!** 🎂\n\n`;
            
            if (birthday.year) {
                const age = localTime.getFullYear() - birthday.year;
                message += `🎈 You're turning **${age}** today! 🎈\n\n`;
            }
            
            message += `Hope you have a wonderful day! 🎊`;

            const embed = new EmbedBuilder()
                .setColor('#ac1cfe')
                .setTitle('🎂 Birthday Celebration! 🎂')
                .setDescription(message)
                .setImage('https://slamanna.com/rehero/hbd.png')
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

// Function to manage birthday roles
async function manageBirthdayRoles(todaysBirthdays, guild) {
    if (!config.birthdayRoleId) {
        return; // No birthday role configured
    }

    try {
        console.log('🎭 Managing birthday roles...');
        
        // Get the birthday role
        const birthdayRole = await guild.roles.fetch(config.birthdayRoleId);
        if (!birthdayRole) {
            console.error(`❌ Birthday role with ID ${config.birthdayRoleId} not found!`);
            return;
        }

        console.log(`🎭 Found birthday role: ${birthdayRole.name}`);

        // Get all members who currently have the birthday role
        const membersWithRole = birthdayRole.members;
        console.log(`👥 Currently ${membersWithRole.size} members have the birthday role`);

        // Create a set of user IDs who should have the role today
        const todaysBirthdayUserIds = new Set(todaysBirthdays.map(b => b.userId));

        // Remove role from members who no longer have birthdays
        for (const [memberId, member] of membersWithRole) {
            if (!todaysBirthdayUserIds.has(memberId)) {
                try {
                    await member.roles.remove(birthdayRole);
                    console.log(`🎭 Removed birthday role from ${member.user.username}`);
                } catch (error) {
                    console.error(`❌ Failed to remove birthday role from ${member.user.username}:`, error.message);
                }
            }
        }

        // Add role to members who have birthdays today
        for (const birthday of todaysBirthdays) {
            try {
                const member = await guild.members.fetch(birthday.userId);
                if (member && !member.roles.cache.has(config.birthdayRoleId)) {
                    await member.roles.add(birthdayRole);
                    console.log(`🎭 Added birthday role to ${birthday.username}`);
                }
            } catch (error) {
                if (error.code === 10007) {
                    console.warn(`⚠️ Member ${birthday.username} (${birthday.userId}) no longer in server`);
                } else {
                    console.error(`❌ Failed to add birthday role to ${birthday.username}:`, error.message);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error managing birthday roles:', error);
    }
}

// Health check function
function healthCheck() {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: getGitVersion(),
        configuration: {
            timezone: TIMEZONE,
            notificationHour: NOTIFICATION_HOUR
        },
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
            configured: TIMEZONE,
            current: new Date().toString(),
            local: new Date().toLocaleString("en-US", {timeZone: TIMEZONE})
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
    // For Docker health check, we'll check simpler indicators since we're in a separate process
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: getGitVersion(),
        configuration: {
            timezone: TIMEZONE,
            notificationHour: NOTIFICATION_HOUR
        },
        database: {
            accessible: false
        },
        timezone: {
            configured: TIMEZONE,
            current: new Date().toString(),
            local: new Date().toLocaleString("en-US", {timeZone: TIMEZONE})
        }
    };
    
    // Test database connection independently
    try {
        const Database = require('./database');
        const testDb = new Database();
        health.database.accessible = true;
        console.log(JSON.stringify(health, null, 2));
        process.exit(0);
    } catch (error) {
        health.status = 'unhealthy';
        health.database.error = error.message;
        console.log(JSON.stringify(health, null, 2));
        process.exit(1);
    }
}

// Handle Discord disconnection
client.on('disconnect', () => {
    console.log('⚠️ Bot disconnected from Discord');
    writeHealthStatus();
});

client.on('error', (error) => {
    console.error('❌ Discord client error:', error);
    writeHealthStatus();
});

client.on('warn', (warning) => {
    console.warn('⚠️ Discord client warning:', warning);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🔄 Shutting down bot...');
    database.close();
    client.destroy();
    process.exit(0);
});

// Login to Discord
client.login(config.token); 