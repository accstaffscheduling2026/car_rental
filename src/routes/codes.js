const express = require('express');
const db      = require('../db');
const router  = express.Router();

// POST /api/v1/codes/validate
// Public endpoint — checks if a booking code is valid without redeeming it.
// Returns employee name so the booking form can confirm the code belongs to the right person.
router.post('/validate', (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(422).json({ error: 'code is required' });
  }

  const record = db.prepare(`
    SELECT bc.*, e.name AS employee_name, e.emp_id AS employee_emp_id
    FROM booking_codes bc
    JOIN employees e ON e.id = bc.employee_id
    WHERE bc.code = ?
  `).get(code.trim().toUpperCase());

  if (!record) {
    return res.status(404).json({ valid: false, error: 'Code not found. Check the code and try again.' });
  }

  // Auto-expire check
  const now = new Date();
  if (record.status === 'active' && new Date(record.expires_at) < now) {
    db.prepare("UPDATE booking_codes SET status = 'expired' WHERE id = ?").run(record.id);
    return res.status(410).json({ valid: false, error: 'This code has expired.' });
  }

  if (record.status === 'used') {
    return res.status(409).json({ valid: false, error: 'This code has already been used.' });
  }
  if (record.status === 'disabled') {
    return res.status(403).json({ valid: false, error: 'This code has been disabled.' });
  }
  if (record.status === 'expired') {
    return res.status(410).json({ valid: false, error: 'This code has expired.' });
  }

  res.json({
    valid: true,
    employee_name: record.employee_name,
    employee_emp_id: record.employee_emp_id,
    expires_at: record.expires_at,
  });
});

module.exports = router;
