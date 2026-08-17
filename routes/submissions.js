const express = require('express');
const db = require('../db/database');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Middleware to authenticate
function authenticate(req, res, next) {
  const token = req.cookies?.alfaaz_token;
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, role, email }
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

router.use(authenticate);

// Get submission
router.get('/:type', (req, res) => {
  const { type } = req.params;
  if (!['story', 'poetry'].includes(type)) {
    return res.status(400).json({ error: 'Invalid competition type' });
  }

  const submitterType = req.user.role === 'participant' ? 'participant' : 'personal';
  if (req.user.role === 'college') {
      return res.status(403).json({ error: 'College admin cannot submit.' });
  }

  const submission = db.prepare('SELECT content FROM submissions WHERE submitter_type = ? AND submitter_id = ? AND competition_type = ?')
    .get(submitterType, req.user.id, type);
    
  return res.json({ content: submission ? submission.content : '' });
});

// Save or update submission
router.post('/:type', (req, res) => {
  const { type } = req.params;
  const { content } = req.body;

  if (!['story', 'poetry'].includes(type)) {
    return res.status(400).json({ error: 'Invalid competition type' });
  }
  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'Content must be a string' });
  }

  const submitterType = req.user.role === 'participant' ? 'participant' : 'personal';
  if (req.user.role === 'college') {
      return res.status(403).json({ error: 'College admin cannot submit.' });
  }

  const existing = db.prepare('SELECT id FROM submissions WHERE submitter_type = ? AND submitter_id = ? AND competition_type = ?')
    .get(submitterType, req.user.id, type);

  if (existing) {
    db.prepare('UPDATE submissions SET content = ?, updated_at = datetime("now") WHERE id = ?').run(content, existing.id);
  } else {
    db.prepare('INSERT INTO submissions (submitter_type, submitter_id, competition_type, content) VALUES (?, ?, ?, ?)')
      .run(submitterType, req.user.id, type, content);
  }

  return res.json({ message: 'Submission saved successfully' });
});

module.exports = router;
