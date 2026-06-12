const express = require('express');
const db = require('../db');
const router = express.Router();

// POST /api/v1/promo/validate
router.post('/validate', (req, res) => {
  const code = req.body.code ? String(req.body.code).trim().toUpperCase() : null;
  if (!code) return res.status(422).json({ error: 'Code is required' });

  const row = db.prepare(`SELECT * FROM promo_codes WHERE code = ?`).get(code);
  if (!row) return res.status(422).json({ error: 'Invalid promo code' });

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    db.prepare(`UPDATE promo_codes SET status = 'expired' WHERE id = ? AND status = 'active'`).run(row.id);
    return res.status(422).json({ error: 'This promo code has expired' });
  }

  if (row.status !== 'active') {
    const msg = row.status === 'used'     ? 'This promo code has already been used'
              : row.status === 'expired'  ? 'This promo code has expired'
              : 'This promo code is no longer valid';
    return res.status(422).json({ error: msg });
  }

  res.json({ valid: true, discount_percent: row.discount_percent || 0, code: row.code });
});

module.exports = router;
