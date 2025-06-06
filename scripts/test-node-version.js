#!/usr/bin/env node

// Test script to verify Node.js version
console.log('🔍 Node.js Version Check');
console.log('========================');

const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

console.log(`📦 Current Node.js version: ${nodeVersion}`);
console.log(`📊 Major version: ${majorVersion}`);

if (majorVersion >= 22) {
    console.log('✅ Node.js version is 22 or higher - Good!');
    process.exit(0);
} else {
    console.log('❌ Node.js version is less than 22');
    console.log('💡 Please upgrade to Node.js 22 or higher');
    process.exit(1);
} 