#!/usr/bin/env node

// Docker health check script - reads health status from file written by main bot process
const fs = require('fs');
const path = require('path');

const healthFile = path.join(__dirname, '..', 'data', 'health.json');

try {
    // Check if health file exists
    if (!fs.existsSync(healthFile)) {
        console.error('❌ Health file not found - bot may not be running properly');
        process.exit(1);
    }
    
    // Read health status
    const healthData = fs.readFileSync(healthFile, 'utf8');
    const health = JSON.parse(healthData);
    
    // Check if health data is recent (within last 2 minutes)
    const now = new Date();
    const healthTime = new Date(health.timestamp);
    const ageMinutes = (now - healthTime) / (1000 * 60);
    
    if (ageMinutes > 2) {
        console.error(`❌ Health data is stale (${Math.round(ageMinutes)} minutes old)`);
        process.exit(1);
    }
    
    // Check Discord connection status
    if (health.status !== 'healthy' || !health.discord.connected) {
        console.error('❌ Bot is not healthy or not connected to Discord');
        console.error(JSON.stringify(health, null, 2));
        process.exit(1);
    }
    
    // Everything looks good
    console.log('✅ Bot is healthy and connected to Discord');
    console.log(`   User: ${health.discord.user}`);
    console.log(`   Guilds: ${health.discord.guilds}`);
    console.log(`   Ping: ${health.discord.ping}ms`);
    console.log(`   Uptime: ${Math.floor(health.uptime)}s`);
    
    process.exit(0);
    
} catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
} 