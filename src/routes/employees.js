const express = require('express');
const crypto  = require('crypto');
const db      = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { EmployeeCreate } = require('../schemas');
const { sendBookingCode } = require('../utils/email');

const router = express.Router();
router.use(requireAdmin);

// ── Code generation ──────────────────────────────────────────────────────────

function generateCode() {
  const alpha    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const specials = '!@#$%&*';
  let alphaPart  = '';
  for (let i = 0; i < 11; i++) {
    alphaPart += alpha[Math.floor(Math.random() * alpha.length)];
  }
  const special = specials[Math.floor(Math.random() * specials.length)];
  const pos     = Math.floor(Math.random() * 12);
  return alphaPart.slice(0, pos) + special + alphaPart.slice(pos);
}

function expiresAt24h() {
  const d = new Date();
  d.setHours(d.getHours() + 24);
  return d.toISOString();
}

// ── Employees ────────────────────────────────────────────────────────────────

// GET /api/v1/admin/employees
router.get('/', (req, res) => {
  const employees = db.prepare(
    "SELECT * FROM employees ORDER BY name"
  ).all();
  res.json({ data: employees });
});

// GET /api/v1/admin/employees/:id
router.get('/:id', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  const codes = db.prepare(
    'SELECT * FROM booking_codes WHERE employee_id = ? ORDER BY created_at DESC LIMIT 20'
  ).all(emp.id);
  res.json({ data: { ...emp, codes } });
});

// POST /api/v1/admin/employees
router.post('/', (req, res) => {
  const parsed = EmployeeCreate.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: 'Validation failed', issues: parsed.error.issues });
  }
  const d = parsed.data;

  const existing = db.prepare('SELECT id FROM employees WHERE emp_id = ? OR email = ?').get(d.emp_id, d.email);
  if (existing) return res.status(409).json({ error: 'Employee ID or email already exists' });

  const result = db.prepare(
    "INSERT INTO employees (emp_id, name, email, phone) VALUES (?, ?, ?, ?)"
  ).run(d.emp_id, d.name, d.email, d.phone || null);

  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ data: emp });
});

// PATCH /api/v1/admin/employees/:id
router.patch('/:id', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  const { name, email, phone, status } = req.body;
  db.prepare(`
    UPDATE employees SET
      name       = COALESCE(?, name),
      email      = COALESCE(?, email),
      phone      = COALESCE(?, phone),
      status     = COALESCE(?, status),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(name || null, email || null, phone || null, status || null, emp.id);

  res.json({ data: db.prepare('SELECT * FROM employees WHERE id = ?').get(emp.id) });
});

// DELETE /api/v1/admin/employees/:id  — soft deactivate
router.delete('/:id', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  db.prepare("UPDATE employees SET status = 'inactive', updated_at = datetime('now') WHERE id = ?").run(emp.id);
  res.json({ message: 'Employee deactivated' });
});

// ── Code generation ───────────────────────────────────────────────────────────

// POST /api/v1/admin/employees/:id/generate-code
router.post('/:id/generate-code', async (req, res) => {
  const emp = db.prepare("SELECT * FROM employees WHERE id = ? AND status = 'active'").get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Active employee not found' });

  // Ensure uniqueness
  let code;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
    if (attempts > 10) return res.status(500).json({ error: 'Could not generate unique code' });
  } while (db.prepare('SELECT id FROM booking_codes WHERE code = ?').get(code));

  const expires = expiresAt24h();
  const admin   = req.session.admin || 'admin';

  const result = db.prepare(`
    INSERT INTO booking_codes (code, employee_id, generated_by, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(code, emp.id, admin, expires);

  const codeRecord = db.prepare('SELECT * FROM booking_codes WHERE id = ?').get(result.lastInsertRowid);

  // Send email async — do not block response
  sendBookingCode(emp, code, expires).catch(() => {});

  res.status(201).json({ data: codeRecord, code, employee: emp.name });
});

// ── Code management ───────────────────────────────────────────────────────────

// GET /api/v1/admin/employees/codes/all
router.get('/codes/all', (req, res) => {
  const codes = db.prepare(`
    SELECT bc.*, e.name AS employee_name, e.emp_id AS employee_emp_id, e.email AS employee_email
    FROM booking_codes bc
    JOIN employees e ON e.id = bc.employee_id
    ORDER BY bc.created_at DESC
    LIMIT 200
  `).all();

  // Auto-expire any codes past their expiry time
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE booking_codes SET status = 'expired'
    WHERE status = 'active' AND expires_at < ?
  `).run(now);

  res.json({ data: codes });
});

// PATCH /api/v1/admin/employees/codes/:codeId/disable
router.patch('/codes/:codeId/disable', (req, res) => {
  const code = db.prepare('SELECT * FROM booking_codes WHERE id = ?').get(req.params.codeId);
  if (!code) return res.status(404).json({ error: 'Code not found' });
  if (code.status === 'used') return res.status(409).json({ error: 'Code has already been used' });

  db.prepare("UPDATE booking_codes SET status = 'disabled' WHERE id = ?").run(code.id);
  res.json({ message: 'Code disabled' });
});

module.exports = router;
