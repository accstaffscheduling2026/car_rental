const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = process.env.DATABASE_PATH || './data/rental.sqlite';
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);

// Run all migration files in order
const migrationsDir = path.join(__dirname, '../migrations');
const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

for (const file of files) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  db.exec(sql);
  console.log(`Applied: ${file}`);
}

db.close();
console.log('Migration complete.');
