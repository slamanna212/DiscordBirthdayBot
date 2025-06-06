#!/usr/bin/env node

// Standalone health check script
const { execSync } = require('child_process');

console.log('🔍 Running Discord Bot Health Check');
console.log('===================================');

try {
    // Run the health check
    const result = execSync('node src/bot.js --health-check', { 
        encoding: 'utf8',
        timeout: 10000 
    });
    
    const health = JSON.parse(result);
    
    console.log('📊 Health Status:');
    console.log(`   Overall Status: ${health.status}`);
    console.log(`   Uptime: ${Math.floor(health.uptime)} seconds`);
    console.log(`   Timestamp: ${health.timestamp}`);
    
    console.log('\n📦 Version Information:');
    console.log(`   Commit: ${health.version.hash} (${health.version.branch})`);
    console.log(`   Message: ${health.version.message}`);
    console.log(`   Date: ${health.version.date}`);
    
    console.log('\n🤖 Discord Connection:');
    console.log(`   Connected: ${health.discord.connected}`);
    console.log(`   Bot User: ${health.discord.user || 'Not connected'}`);
    console.log(`   Guilds: ${health.discord.guilds}`);
    console.log(`   Ping: ${health.discord.ping}ms`);
    
    console.log('\n💾 Database:');
    console.log(`   Connected: ${health.database.connected}`);
    
    console.log('\n🌍 Timezone:');
    console.log(`   Configured: ${health.timezone.configured}`);
    console.log(`   Current: ${health.timezone.current}`);
    console.log(`   Eastern: ${health.timezone.eastern}`);
    
    if (health.status === 'healthy') {
        console.log('\n✅ Bot is healthy!');
        process.exit(0);
    } else {
        console.log('\n❌ Bot is unhealthy!');
        process.exit(1);
    }
    
} catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
} 