#!/usr/bin/env node

// Test script to validate notification hour configuration
console.log('⏰ Testing Notification Hour Configuration');
console.log('==========================================');

const NOTIFICATION_HOUR = parseInt(process.env.BIRTHDAY_NOTIFICATION_HOUR || '10', 10);

console.log('\n📋 Current Configuration:');
console.log(`   BIRTHDAY_NOTIFICATION_HOUR: ${process.env.BIRTHDAY_NOTIFICATION_HOUR || 'undefined (using default)'}`);
console.log(`   Parsed Hour: ${NOTIFICATION_HOUR}`);

// Validate notification hour
if (NOTIFICATION_HOUR < 0 || NOTIFICATION_HOUR > 23 || isNaN(NOTIFICATION_HOUR)) {
    console.log('\n❌ Invalid notification hour!');
    console.log(`   Must be 0-23 (24-hour format)`);
    console.log(`   Provided: ${process.env.BIRTHDAY_NOTIFICATION_HOUR}`);
    process.exit(1);
}

// Display time formats
const timeDisplay = NOTIFICATION_HOUR === 0 ? '12:00 AM' : 
                   NOTIFICATION_HOUR <= 12 ? `${NOTIFICATION_HOUR}:00 AM` : 
                   `${NOTIFICATION_HOUR - 12}:00 PM`;

console.log(`   Display Format: ${timeDisplay}`);
console.log(`   Cron Pattern: 0 ${NOTIFICATION_HOUR} * * *`);

console.log('\n⌚ Common Time Examples:');
const examples = [
    { hour: 0, display: '12:00 AM (Midnight)' },
    { hour: 6, display: '6:00 AM' },
    { hour: 8, display: '8:00 AM' },
    { hour: 10, display: '10:00 AM (Default)' },
    { hour: 12, display: '12:00 PM (Noon)' },
    { hour: 14, display: '2:00 PM' },
    { hour: 18, display: '6:00 PM' },
    { hour: 20, display: '8:00 PM' },
    { hour: 23, display: '11:00 PM' }
];

examples.forEach(example => {
    const current = example.hour === NOTIFICATION_HOUR ? ' ← CURRENT' : '';
    console.log(`   ${example.hour.toString().padStart(2, '0')}: ${example.display}${current}`);
});

console.log('\n💡 Usage Examples:');
console.log('   BIRTHDAY_NOTIFICATION_HOUR=6  # 6:00 AM');
console.log('   BIRTHDAY_NOTIFICATION_HOUR=14 # 2:00 PM');
console.log('   BIRTHDAY_NOTIFICATION_HOUR=20 # 8:00 PM');

console.log('\n✅ Notification hour configuration is valid!'); 