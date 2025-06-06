const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        // Determine database path - prioritize data directory for Docker, fallback for local dev
        let dbPath;
        
        // Check if we're in Docker (data directory exists) or production mode
        const dataDir = path.join(__dirname, '..', 'data');
        
        if (fs.existsSync(dataDir) || process.env.NODE_ENV === 'production') {
            // Use data directory (Docker volume mount location)
            // Ensure the data directory exists
            if (!fs.existsSync(dataDir)) {
                console.log(`📁 Creating data directory: ${dataDir}`);
                fs.mkdirSync(dataDir, { recursive: true });
            }
            dbPath = path.join(__dirname, '..', 'data', 'birthdays.db');
        } else {
            // Fallback to root directory for local development
            dbPath = path.join(__dirname, '..', 'birthdays.db');
        }
        
        console.log(`📁 Database Configuration:`);
        console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
        console.log(`   Database path: ${dbPath}`);
        console.log(`   Data directory exists: ${fs.existsSync(dataDir)}`);
        console.log(`   Database file exists: ${fs.existsSync(dbPath)}`);
        
        // Ensure the directory containing the database file exists
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            console.log(`📁 Creating database directory: ${dbDir}`);
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        try {
            this.db = new sqlite3.Database(dbPath);
            console.log(`✅ Database connection established: ${dbPath}`);
            this.init();
        } catch (error) {
            console.error(`❌ Failed to create database connection:`, error);
            throw error;
        }
    }

    init() {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS birthdays (
                userId TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                day INTEGER NOT NULL,
                month INTEGER NOT NULL,
                year INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        this.db.run(createTableQuery, (err) => {
            if (err) {
                console.error('❌ Error creating birthdays table:', err);
                throw err;
            } else {
                console.log('✅ Database table initialized successfully');
                
                // Test the database connection by running a simple query
                this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='birthdays'", (err, row) => {
                    if (err) {
                        console.error('❌ Database connection test failed:', err);
                    } else if (row) {
                        console.log('✅ Database connection test passed');
                    } else {
                        console.error('❌ Birthday table was not created properly');
                    }
                });
            }
        });
    }

    setBirthday(userId, username, day, month, year = null) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO birthdays (userId, username, day, month, year)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            this.db.run(query, [userId, username, day, month, year], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    getBirthday(userId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM birthdays WHERE userId = ?';
            
            this.db.get(query, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    getTodaysBirthdays(month, day) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM birthdays WHERE month = ? AND day = ?';
            
            this.db.all(query, [month, day], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getAllBirthdays() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM birthdays ORDER BY month, day';
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        this.db.close();
    }
}

module.exports = Database; 