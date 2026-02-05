const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure data directory exists
const dbDir = path.dirname(config.database.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database connection
const db = new Database(config.database.path);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Read and execute schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

// Execute entire schema at once (handles triggers correctly)
try {
  db.exec(schema);
} catch (error) {
  // Ignore errors for "already exists" cases
  if (!error.message.includes('already exists')) {
    console.error('Schema error:', error.message);
  }
}

console.log('✅ Database initialized successfully');

module.exports = db;
