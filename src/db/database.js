const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'verity.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency (Project Design Decision)
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema from schema.sql
function initSchema() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema);
        console.log('[db] Schema initialized successfully.');
    } else {
        console.error('[db] schema.sql not found at', schemaPath);
    }
}

initSchema();

module.exports = db;
