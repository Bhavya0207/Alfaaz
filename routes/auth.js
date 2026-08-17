const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/database');
const { sendVerificationEmail } = require('../utils/mailer');
const upload = require('../utils/upload');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generatePassword() {
  return crypto.randomBytes(4).toString('hex'); // 8 char password
}

// ---------- REGISTER ----------
router.post('/register', upload.single('paymentReceipt'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['college', 'personal'].includes(role)) {
      return res.status(400).json({ error: 'role must be "college" or "personal"' });
    }

    const paymentReceipt = req.file ? req.file.filename : null;
    if (!paymentReceipt) {
      return res.status(400).json({ error: 'Payment receipt image is required' });
    }

    if (role === 'personal') {
      const { name, email, phone, password, competitions } = req.body;
      if (!name || !isValidEmail(email) || !password || !competitions) {
        return res.status(400).json({ error: 'name, valid email, password, and competitions are required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'password must be at least 6 characters' });
      }

      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      const existingPart = db.prepare('SELECT id FROM participants WHERE email = ?').get(email);
      if (existingUser || existingPart) return res.status(409).json({ error: 'An account with this email already exists' });

      const passwordHash = await bcrypt.hash(password, 10);
      const verifyToken = crypto.randomBytes(32).toString('hex');
      const expires = Date.now() + TOKEN_TTL_MS;

      const info = db.prepare(`
        INSERT INTO users (role, name, email, phone, competitions, payment_receipt, password_hash, verify_token, verify_token_expires)
        VALUES ('personal', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, email, phone || null, competitions, paymentReceipt, passwordHash, verifyToken, expires);

      const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify/${verifyToken}`;
      const mailResult = await sendVerificationEmail(email, name, verifyUrl);

      return res.status(201).json({
        message: 'Registered. Please check your email to verify your account.',
        userId: info.lastInsertRowid,
        ...(mailResult.devMode ? { devVerifyUrl: verifyUrl } : {}),
      });
    }

    // role === 'college'
    const { collegeName, adminName, email, phone, password } = req.body;
    let participants = [];
    try {
      participants = JSON.parse(req.body.participants || '[]');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid participants data' });
    }

    if (!collegeName || !adminName || !isValidEmail(email) || !password) {
      return res.status(400).json({ error: 'collegeName, adminName, valid email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ error: 'At least one participant is required' });
    }
    for (const [i, p] of participants.entries()) {
      if (!p.name || !isValidEmail(p.email) || !p.competitions) {
        return res.status(400).json({ error: `participant ${i + 1} needs a valid name, email, and competitions` });
      }
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) return res.status(409).json({ error: 'An account with this admin email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + TOKEN_TTL_MS;

    const insertUser = db.prepare(`
      INSERT INTO users (role, name, email, phone, college_name, payment_receipt, password_hash, verify_token, verify_token_expires)
      VALUES ('college', ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertParticipant = db.prepare(`
      INSERT INTO participants (college_user_id, name, email, phone, branch, year, competitions, password_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Generate passwords for participants
    const participantsWithPasswords = [];
    for (let p of participants) {
      const pPassword = generatePassword();
      const pHash = await bcrypt.hash(pPassword, 10);
      participantsWithPasswords.push({ ...p, password: pPassword, hash: pHash });
    }

    const runAll = db.transaction(() => {
      const info = insertUser.run(adminName, email, phone || null, collegeName, paymentReceipt, passwordHash, verifyToken, expires);
      const collegeUserId = info.lastInsertRowid;
      for (const p of participantsWithPasswords) {
        insertParticipant.run(collegeUserId, p.name, p.email, p.phone || null, p.branch || null, p.year || null, p.competitions, p.hash);
      }
      return collegeUserId;
    });

    const userId = runAll();

    // In a real app we'd send emails to all participants with their passwords here.
    // We'll log them in devMode or simulate it.
    for (const p of participantsWithPasswords) {
        console.log(`[Email Mock] To: ${p.email} | Subject: Login Credentials | Content: Password is ${p.password}`);
    }

    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify/${verifyToken}`;
    const mailResult = await sendVerificationEmail(email, adminName, verifyUrl);

    return res.status(201).json({
      message: `College registered with ${participants.length} participant(s). Please check your email to verify your account.`,
      userId,
      ...(mailResult.devMode ? { devVerifyUrl: verifyUrl, generatedParticipantPasswords: participantsWithPasswords.map(p => ({email: p.email, password: p.password})) } : {}),
    });
  } catch (err) {
    console.error(err);
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
         return res.status(409).json({ error: 'A participant with this email already exists' });
    }
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ---------- VERIFY ----------
router.get('/verify/:token', (req, res) => {
  const { token } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE verify_token = ?').get(token);

  if (!user) {
    return res.status(400).send(renderMessagePage('Invalid or expired verification link.', false));
  }
  if (user.verified) {
    return res.send(renderMessagePage('Your email is already verified. You can log in now.', true));
  }
  if (user.verify_token_expires && Date.now() > user.verify_token_expires) {
    return res.status(400).send(renderMessagePage('This verification link has expired. Please register again or request a new link.', false));
  }

  db.prepare('UPDATE users SET verified = 1, verify_token = NULL, verify_token_expires = NULL WHERE id = ?').run(user.id);
  return res.send(renderMessagePage('Email verified successfully! You can now log in.', true));
});

function renderMessagePage(message, success) {
  return `<!DOCTYPE html>
  <html><head><title>Alfaaz - Verification</title>
  <style>body{font-family:system-ui,sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#222}
  .box{padding:24px;border-radius:8px;background:${success ? '#eafaf0' : '#fdecea'};border:1px solid ${success ? '#b7e4c7' : '#f5c2c0'}}
  a{color:#2b6cb0}</style></head>
  <body><div class="box"><p>${message}</p>${success ? '<p><a href="/">Go to login</a></p>' : ''}</div></body></html>`;
}

// ---------- LOGIN ----------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ error: 'Valid email and password are required' });
    }

    // Check users table
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    let isParticipant = false;

    // Check participants table if not in users
    if (!user) {
       user = db.prepare('SELECT * FROM participants WHERE email = ?').get(email);
       if (user) {
           isParticipant = true;
       }
    }

    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    if (!isParticipant && !user.verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }

    const role = isParticipant ? 'participant' : user.role;
    const token = jwt.sign(
      { id: user.id, role: role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('alfaaz_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role,
        competitions: user.competitions,
        collegeName: user.college_name || null, // Only for role college
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ---------- LOGOUT ----------
router.post('/logout', (req, res) => {
  res.clearCookie('alfaaz_token');
  return res.json({ message: 'Logged out' });
});

// ---------- ME (current session) ----------
router.get('/me', (req, res) => {
  const token = req.cookies?.alfaaz_token;
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role === 'participant') {
       const user = db.prepare('SELECT id, name, email, competitions FROM participants WHERE id = ?').get(payload.id);
       if (!user) return res.status(401).json({ error: 'Not logged in' });
       return res.json({ user: { ...user, role: 'participant' }, participants: [] });
    } else {
       const user = db.prepare('SELECT id, role, name, email, college_name, competitions FROM users WHERE id = ?').get(payload.id);
       if (!user) return res.status(401).json({ error: 'Not logged in' });

       let participants = [];
       if (user.role === 'college') {
         participants = db.prepare('SELECT name, email, phone, branch, year, competitions FROM participants WHERE college_user_id = ?').all(user.id);
       }
       return res.json({ user, participants });
    }
  } catch {
    return res.status(401).json({ error: 'Session expired, please log in again' });
  }
});

module.exports = router;
