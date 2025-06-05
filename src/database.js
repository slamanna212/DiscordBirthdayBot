const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        // Use data directory for Docker volume mounting, fallback to root directory for local dev
        const dbPath = process.env.NODE_ENV === 'production' 
            ? path.join(__dirname, '..', 'data', 'birthdays.db')
            : path.join(__dirname, '..', 'birthdays.db');
        
        this.db = new sqlite3.Database(dbPath);
        this.init();
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
                console.error('Error creating birthdays table:', err);
            } else {
                console.log('Database initialized successfully');
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