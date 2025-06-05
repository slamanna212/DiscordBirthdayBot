// Test script to verify timezone configuration
console.log('🕐 Testing Timezone Configuration');
console.log('================================');

// Set timezone like we do in the main bot
process.env.TZ = 'America/New_York';

console.log('\n📍 Environment:');
console.log(`   NODE_VERSION: ${process.version}`);
console.log(`   PLATFORM: ${process.platform}`);
console.log(`   TZ: ${process.env.TZ}`);

console.log('\n⏰ Time Comparisons:');
const now = new Date();
const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));

console.log(`   System Time: ${now.toString()}`);
console.log(`   Eastern Time: ${easternTime.toString()}`);
console.log(`   Eastern Date: ${easternTime.toDateString()}`);
console.log(`   Eastern Month/Day: ${easternTime.getMonth() + 1}/${easternTime.getDate()}`);

console.log('\n🌍 All Timezone Methods:');
console.log(`   toLocaleString(): ${now.toLocaleString()}`);
console.log(`   toLocaleString(US): ${now.toLocaleString("en-US")}`);
console.log(`   toLocaleString(US, ET): ${now.toLocaleString("en-US", {timeZone: "America/New_York"})}`);

console.log('\n✅ Timezone test complete!'); 