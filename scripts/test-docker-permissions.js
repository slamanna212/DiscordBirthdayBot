#!/usr/bin/env node

// Test script to verify Docker permissions and database setup
const fs = require('fs');
const path = require('path');

console.log('🐳 Docker Container Permissions Test');
console.log('====================================');

console.log('\n📋 Environment Information:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   TZ: ${process.env.TZ}`);
console.log(`   Process UID: ${process.getuid()}`);
console.log(`   Process GID: ${process.getgid()}`);
console.log(`   Working Directory: ${process.cwd()}`);

console.log('\n📁 Directory Tests:');

// Test current directory
try {
    const stats = fs.statSync('.');
    console.log(`   Current dir (${process.cwd()}):`);
    console.log(`     Mode: ${stats.mode.toString(8)}`);
    console.log(`     UID: ${stats.uid}, GID: ${stats.gid}`);
} catch (error) {
    console.error(`   ❌ Cannot stat current directory: ${error.message}`);
}

// Test data directory
const dataDir = path.join(__dirname, '..', 'data');
console.log(`\n   Data dir (${dataDir}):`);
try {
    if (fs.existsSync(dataDir)) {
        const stats = fs.statSync(dataDir);
        console.log(`     Exists: true`);
        console.log(`     Mode: ${stats.mode.toString(8)}`);
        console.log(`     UID: ${stats.uid}, GID: ${stats.gid}`);
        
        // Test write permissions
        const testFile = path.join(dataDir, 'permission-test.tmp');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log(`     ✅ Write test: PASSED`);
    } else {
        console.log(`     Exists: false`);
        console.log(`     🔧 Attempting to create...`);
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`     ✅ Created successfully`);
    }
} catch (error) {
    console.error(`     ❌ Error: ${error.message}`);
}

console.log('\n🔍 SQLite Test:');
try {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(dataDir, 'test-db.db');
    
    console.log(`   Testing SQLite at: ${dbPath}`);
    
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error(`   ❌ SQLite connection failed: ${err.message}`);
        } else {
            console.log(`   ✅ SQLite connection successful`);
            
            // Test table creation
            db.run("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)", (err) => {
                if (err) {
                    console.error(`   ❌ Table creation failed: ${err.message}`);
                } else {
                    console.log(`   ✅ Table creation successful`);
                    
                    // Clean up
                    db.close((err) => {
                        if (err) {
                            console.error(`   ❌ Database close failed: ${err.message}`);
                        } else {
                            console.log(`   ✅ Database closed successfully`);
                            
                            // Remove test database
                            try {
                                fs.unlinkSync(dbPath);
                                console.log(`   ✅ Test database cleaned up`);
                            } catch (error) {
                                console.error(`   ⚠️  Could not clean up test database: ${error.message}`);
                            }
                        }
                        
                        console.log('\n🎉 Permission test completed!');
                    });
                }
            });
        }
    });
} catch (error) {
    console.error(`   ❌ SQLite test failed: ${error.message}`);
} 