const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'alfaaz.db'));

db.pragma('journal_mode = WAL');

// users table:
//  - role = 'personal' -> the user IS the participant
//  - role = 'college'  -> the user is the college admin/rep; actual participants
//                         live in the participants table linked by college_user_id
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK(role IN ('college','personal')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  college_name TEXT,
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
  email TEXT NOT NULL,
  phone TEXT,
  branch TEXT,
  year TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (college_user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

module.exports = db;
