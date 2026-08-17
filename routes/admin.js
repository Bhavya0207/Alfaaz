const express = require('express');
const db = require('../db/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Admin authentication middleware
function requireAdmin(req, res, next) {
  const token = req.cookies?.alfaaz_token;
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

router.use(requireAdmin);

// 1. GET /metrics
router.get('/metrics', (req, res) => {
  try {
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('personal', 'college')").get().count;
    const totalParticipants = db.prepare("SELECT COUNT(*) as count FROM participants").get().count;
    const personalCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'personal'").get().count;
    const collegeCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'college'").get().count;

    // Fees calculation
    let totalFees = 0;
    const personalUsers = db.prepare("SELECT competitions FROM users WHERE role = 'personal'").all();
    personalUsers.forEach(u => {
      totalFees += u.competitions === 'both' ? 200 : 100;
    });

    const participantUsers = db.prepare("SELECT competitions FROM participants").all();
    participantUsers.forEach(p => {
      totalFees += p.competitions === 'both' ? 200 : 100;
    });

    const totalSubmissions = db.prepare("SELECT COUNT(*) as count FROM submissions").get().count;

    res.json({
      totalUsers,
      totalParticipants,
      personalCount,
      collegeCount,
      totalFees,
      totalSubmissions
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// 2. GET /registrations
router.get('/registrations', (req, res) => {
  try {
    const users = db.prepare("SELECT id, role, name, email, phone, college_name, competitions, payment_receipt, created_at FROM users WHERE role != 'admin' ORDER BY created_at DESC").all();
    const participants = db.prepare("SELECT p.id, p.college_user_id, p.name, p.email, p.phone, p.branch, p.year, p.competitions, p.created_at, u.college_name FROM participants p JOIN users u ON p.college_user_id = u.id ORDER BY p.created_at DESC").all();
    
    res.json({ users, participants });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// 3. GET /submissions
router.get('/submissions', (req, res) => {
  try {
    const submissions = db.prepare(`
      SELECT s.id, s.submitter_type, s.submitter_id, s.competition_type, s.content, s.created_at, s.updated_at,
             CASE WHEN s.submitter_type = 'personal' THEN u.name ELSE p.name END as author_name,
             CASE WHEN s.submitter_type = 'personal' THEN u.email ELSE p.email END as author_email
      FROM submissions s
      LEFT JOIN users u ON s.submitter_type = 'personal' AND s.submitter_id = u.id
      LEFT JOIN participants p ON s.submitter_type = 'participant' AND s.submitter_id = p.id
      ORDER BY s.updated_at DESC
    `).all();
    
    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// 4. POST /set-password
router.post('/set-password', async (req, res) => {
  try {
    const { targetId, targetType, newPassword } = req.body;
    if (!targetId || !targetType || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    
    if (targetType === 'user') {
      const user = db.prepare("SELECT id FROM users WHERE id = ?").get(targetId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, targetId);
    } else if (targetType === 'participant') {
      const participant = db.prepare("SELECT id FROM participants WHERE id = ?").get(targetId);
      if (!participant) return res.status(404).json({ error: 'Participant not found' });
      db.prepare("UPDATE participants SET password_hash = ? WHERE id = ?").run(hash, targetId);
    } else {
      return res.status(400).json({ error: 'Invalid target type' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;
