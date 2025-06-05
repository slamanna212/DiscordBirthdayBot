const { REST, Routes } = require('discord.js');

// Note: Environment variables should be passed directly to the process
// For local development, you can set them in your shell or IDE

// Load configuration from environment variables
const config = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID
};

// Validate required environment variables
if (!config.token || !config.clientId) {
    console.error('❌ Missing required environment variables:');
    if (!config.token) console.error('  - DISCORD_TOKEN');
    if (!config.clientId) console.error('  - DISCORD_CLIENT_ID');
    process.exit(1);
}

const commands = [
    {
        name: 'setbirthday',
        description: 'Set your birthday for announcements',
        options: [
            {
                name: 'day',
                description: 'Day of the month (1-31)',
                type: 4, // INTEGER
                required: true,
                min_value: 1,
                max_value: 31
            },
            {
                name: 'month',
                description: 'Month (1-12)',
                type: 4, // INTEGER
                required: true,
                min_value: 1,
                max_value: 12
            },
            {
                name: 'year',
                description: 'Birth year (optional, for age calculation)',
                type: 4, // INTEGER
                required: false,
                min_value: 1900,
                max_value: new Date().getFullYear()
            }
        ]
    },
    {
        name: 'mybirthday',
        description: 'View your current birthday setting'
    },
    {
        name: 'listbirthdays',
        description: 'List all birthdays in the server (admin only)',
        default_member_permissions: '0' // Requires administrator permission
    }
];

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log('🔄 Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands },
        );

        console.log('✅ Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
    }
})(); 