const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'alfaaz.db'));

db.pragma('journal_mode = WAL');

// users table:
//  - role = 'personal' -> the user IS the participant
//  - role = 'college'  -> the user is the college admin/rep
//  - role = 'admin'    -> platform administrator
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK(role IN ('college','personal','admin')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  college_name TEXT,
  competitions TEXT, -- 'story', 'poetry', or 'both' (only for personal)
  payment_receipt TEXT, -- path to uploaded image
  password_hash TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  verify_token TEXT,
  verify_token_expires INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  college_user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  branch TEXT,
  year TEXT,
  competitions TEXT NOT NULL, -- 'story', 'poetry', or 'both'
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (college_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submitter_type TEXT NOT NULL CHECK(submitter_type IN ('personal', 'participant')),
  submitter_id INTEGER NOT NULL,
  competition_type TEXT NOT NULL CHECK(competition_type IN ('story', 'poetry')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(submitter_type, submitter_id, competition_type)
);
`);

// Seed Admin User
const adminEmail = process.env.ADMIN_EMAIL || 'admin@alfaaz.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

if (!existingAdmin) {
  const hash = bcrypt.hashSync(adminPassword, 10);
  db.prepare(`
    INSERT INTO users (role, name, email, password_hash, verified) 
    VALUES ('admin', 'System Admin', ?, ?, 1)
  `).run(adminEmail, hash);
  console.log(`Seeded default admin user: ${adminEmail}`);
}

module.exports = db;
