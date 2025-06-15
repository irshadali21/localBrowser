const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../logs/errors.db');
const db = new Database(dbPath);

// Create error_logs table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    message TEXT,
    stack TEXT,
    route TEXT,
    input TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

module.exports = db;
