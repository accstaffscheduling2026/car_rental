const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(422).json({ error: 'Name, email and password are required' });
  }
  if (password.length < 8) {
    return res.status(422).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)'
  ).run(name.trim(), email.trim().toLowerCase(), phone?.trim() || null, hash);

  const user = db.prepare('SELECT id, name, email, phone FROM users WHERE id = ?').get(result.lastInsertRowid);
  req.session.userId = user.id;
  res.status(201).json({ data: user });
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Invalid email or password' });

  req.session.userId = user.id;
  res.json({ data: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  req.session.userId = null;
  res.json({ message: 'Logged out' });
});

// GET /api/v1/auth/me
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = db.prepare('SELECT id, name, email, phone FROM users WHERE id = ?').get(req.session.userId);
  if (!user) { req.session.userId = null; return res.status(401).json({ error: 'Session expired' }); }
  res.json({ data: user });
});

// PATCH /api/v1/auth/profile — update saved name / phone
router.patch('/profile', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const { name, phone } = req.body;
  if (!name) return res.status(422).json({ error: 'Name is required' });
  db.prepare("UPDATE users SET name = ?, phone = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name.trim(), phone?.trim() || null, req.session.userId);
  const user = db.prepare('SELECT id, name, email, phone FROM users WHERE id = ?').get(req.session.userId);
  res.json({ data: user });
});

module.exports = router;
