const express = require('express');
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const db      = require('../db');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../../uploads/legal');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => cb(null, `${req.params.type}.pdf`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Only PDF files are accepted'));
  },
});

function requireAdmin(req, res, next) {
  if (!req.session?.adminId) return res.status(401).json({ error: 'Unauthorised' });
  next();
}

// GET /api/v1/admin/site-content
router.get('/', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT key, label, value, updated_at FROM site_content ORDER BY key').all();
  const content = {};
  for (const r of rows) content[r.key] = { value: r.value ?? '', label: r.label, updated_at: r.updated_at };
  res.json({ data: content });
});

// POST /api/v1/admin/site-content  body: { key: value, ... }
router.post('/', requireAdmin, (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(422).json({ error: 'Body must be a key/value object' });
  }
  const stmt = db.prepare(
    `INSERT INTO site_content (key, label, value, updated_at)
     VALUES (?, COALESCE((SELECT label FROM site_content WHERE key=?), ?), ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')`
  );
  const run = db.transaction((entries) => {
    for (const [key, value] of entries) stmt.run(key, key, key, String(value ?? ''));
  });
  run(Object.entries(updates));
  res.json({ ok: true });
});

// POST /api/v1/admin/site-content/upload/:type  (type: terms | privacy)
router.post('/upload/:type', requireAdmin, (req, res) => {
  const { type } = req.params;
  if (!['terms', 'privacy'].includes(type)) {
    return res.status(400).json({ error: 'type must be terms or privacy' });
  }
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(422).json({ error: err.message });
    if (!req.file) return res.status(422).json({ error: 'No file uploaded' });

    const key   = type === 'terms' ? 'legal_terms_filename' : 'legal_privacy_filename';
    const label = type === 'terms' ? 'T&C Document Filename' : 'Privacy Policy Filename';
    db.prepare(
      `INSERT INTO site_content (key, label, value, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')`
    ).run(key, label, req.file.originalname);

    res.json({ ok: true, filename: req.file.originalname });
  });
});

module.exports = router;
