const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/v1/public/cancellation-policy
// Returns the configured cancellation policy for display on the public cancel page.
router.get('/cancellation-policy', (req, res) => {
  const rows = db.prepare(
    `SELECT key, value FROM settings WHERE key IN
     ('cancel_full_refund_hours','cancel_partial_hours','cancel_partial_pct')`
  ).all();
  const policy = {};
  for (const r of rows) policy[r.key] = parseInt(r.value, 10);
  // Ensure defaults if settings row not yet seeded
  res.json({
    data: {
      cancel_full_refund_hours: policy.cancel_full_refund_hours ?? 48,
      cancel_partial_hours:     policy.cancel_partial_hours     ?? 24,
      cancel_partial_pct:       policy.cancel_partial_pct       ?? 50,
    },
  });
});

module.exports = router;
