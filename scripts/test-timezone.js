// Test script to verify timezone configuration
console.log('🕐 Testing Timezone Configuration');
console.log('================================');

// Set timezone like we do in the main bot (use TZ env var or default to Eastern)
const TIMEZONE = process.env.TZ || 'America/New_York';
process.env.TZ = TIMEZONE;

console.log('\n📍 Environment:');
console.log(`   NODE_VERSION: ${process.version}`);
console.log(`   PLATFORM: ${process.platform}`);
console.log(`   TZ: ${process.env.TZ}`);

console.log('\n⏰ Time Comparisons:');
const now = new Date();
const localTime = new Date(now.toLocaleString("en-US", {timeZone: TIMEZONE}));

console.log(`   System Time: ${now.toString()}`);
console.log(`   Local Time (${TIMEZONE}): ${localTime.toString()}`);
console.log(`   Local Date: ${localTime.toDateString()}`);
console.log(`   Local Month/Day: ${localTime.getMonth() + 1}/${localTime.getDate()}`);

console.log('\n🌍 All Timezone Methods:');
console.log(`   toLocaleString(): ${now.toLocaleString()}`);
console.log(`   toLocaleString(US): ${now.toLocaleString("en-US")}`);
console.log(`   toLocaleString(US, ${TIMEZONE}): ${now.toLocaleString("en-US", {timeZone: TIMEZONE})}`);

console.log('\n✅ Timezone test complete!'); 