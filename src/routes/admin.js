const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { VehicleCreate, AdminLogin } = require('../schemas');
const { invalidate } = require('../cache');
const { centsToAud } = require('../utils/pricing');
const router = express.Router();

// POST /api/v1/admin/login
router.post('/login', async (req, res) => {
  const parsed = AdminLogin.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Username and password required' });

  const { username, password } = parsed.data;
  const storedUser = process.env.ADMIN_USERNAME || 'admin';
  const storedHash = process.env.ADMIN_PASSWORD_HASH || '';

  if (username !== storedUser) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // In dev/test if no hash is set, allow plaintext "admin" password
  let valid = false;
  if (storedHash.startsWith('$2')) {
    valid = await bcrypt.compare(password, storedHash);
  } else if (process.env.NODE_ENV !== 'production') {
    valid = password === 'admin';
  }

  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.adminId = username;
  req.session.save(() => res.json({ message: 'Logged in' }));
});

// POST /api/v1/admin/logout
router.post('/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
});

// GET /api/v1/admin/me
router.get('/me', requireAdmin, (req, res) => {
  res.json({ username: req.session.adminId });
});

// ---------- Reservations ----------

router.get('/reservations', requireAdmin, (req, res) => {
  const { status, vehicle_id, from, to, email } = req.query;
  let sql = `SELECT r.*, v.name as vehicle_name FROM reservations r
             JOIN vehicles v ON v.id = r.vehicle_id WHERE 1=1`;
  const params = [];
  if (status)     { sql += ` AND r.status = ?`;        params.push(status); }
  if (vehicle_id) { sql += ` AND r.vehicle_id = ?`;    params.push(vehicle_id); }
  if (from)       { sql += ` AND r.start_utc >= ?`;    params.push(from); }
  if (to)         { sql += ` AND r.end_utc <= ?`;      params.push(to); }
  if (email)      { sql += ` AND r.customer_email LIKE ?`; params.push(`%${email}%`); }
  sql += ` ORDER BY r.start_utc DESC`;
  const rows = db.prepare(sql).all(...params);
  res.json({ data: rows.map(r => ({ ...r, price_aud: centsToAud(r.price_cents), gst_aud: centsToAud(r.gst_cents) })) });
});

router.get('/reservations/:id', requireAdmin, (req, res) => {
  const r = db.prepare(
    `SELECT r.*, v.name as vehicle_name FROM reservations r
     JOIN vehicles v ON v.id = r.vehicle_id WHERE r.id = ?`
  ).get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json({ data: { ...r, price_aud: centsToAud(r.price_cents), gst_aud: centsToAud(r.gst_cents) } });
});

router.patch('/reservations/:id', requireAdmin, (req, res) => {
  const { status, notes, payment_status } = req.body;
  const allowed = ['pending','confirmed','picked_up','completed','cancelled'];
  if (status && !allowed.includes(status)) {
    return res.status(422).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }

  const r = db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });

  const updates = [];
  const params = [];
  if (status)         { updates.push('status = ?');         params.push(status); }
  if (notes !== undefined) { updates.push('notes = ?');     params.push(notes); }
  if (payment_status) { updates.push('payment_status = ?'); params.push(payment_status); }
  if (!updates.length) return res.status(422).json({ error: 'Nothing to update' });

  updates.push(`updated_at = datetime('now')`);
  params.push(req.params.id);
  db.prepare(`UPDATE reservations SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  db.prepare(`INSERT INTO audit_log (entity, entity_id, action, actor, detail_json) VALUES ('reservation',?,'update','admin',?)`)
    .run(req.params.id, JSON.stringify({ status, notes, payment_status }));

  invalidate();
  const updated = db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(req.params.id);
  res.json({ data: { ...updated, price_aud: centsToAud(updated.price_cents) } });
});

// ---------- Vehicles ----------

router.get('/vehicles', requireAdmin, (req, res) => {
  const rows = db.prepare(`SELECT * FROM vehicles ORDER BY type, name`).all();
  res.json({ data: rows });
});

router.post('/vehicles', requireAdmin, (req, res) => {
  const parsed = VehicleCreate.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', issues: parsed.error.issues });
  const d = parsed.data;
  const r = db.prepare(`
    INSERT INTO vehicles (name,type,capacity,plate,accessibility_notes,hourly_rate_cents,daily_rate_cents,buffer_minutes,status,maintenance_until)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(d.name, d.type, d.capacity, d.plate||null, d.accessibility_notes||null,
         d.hourly_rate_cents, d.daily_rate_cents, d.buffer_minutes, d.status, d.maintenance_until||null);
  const vehicle = db.prepare(`SELECT * FROM vehicles WHERE id = ?`).get(r.lastInsertRowid);
  res.status(201).json({ data: vehicle });
});

router.patch('/vehicles/:id', requireAdmin, (req, res) => {
  const v = db.prepare(`SELECT * FROM vehicles WHERE id = ?`).get(req.params.id);
  if (!v) return res.status(404).json({ error: 'Vehicle not found' });

  const fields = ['name','type','capacity','plate','accessibility_notes',
                  'hourly_rate_cents','daily_rate_cents','buffer_minutes','status','maintenance_until'];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  }
  if (!updates.length) return res.status(422).json({ error: 'Nothing to update' });
  updates.push(`updated_at = datetime('now')`);
  params.push(req.params.id);
  db.prepare(`UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  db.prepare(`INSERT INTO audit_log (entity, entity_id, action, actor, detail_json) VALUES ('vehicle',?,'update','admin',?)`)
    .run(req.params.id, JSON.stringify(req.body));

  invalidate();
  res.json({ data: db.prepare(`SELECT * FROM vehicles WHERE id = ?`).get(req.params.id) });
});

router.delete('/vehicles/:id', requireAdmin, (req, res) => {
  const v = db.prepare(`SELECT * FROM vehicles WHERE id = ?`).get(req.params.id);
  if (!v) return res.status(404).json({ error: 'Vehicle not found' });
  db.prepare(`UPDATE vehicles SET status = 'retired', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
  db.prepare(`INSERT INTO audit_log (entity, entity_id, action, actor) VALUES ('vehicle',?,'retire','admin')`).run(req.params.id);
  invalidate();
  res.json({ message: 'Vehicle retired' });
});

// ---------- Reports ----------

router.get('/reports/csv', requireAdmin, (req, res) => {
  const { from, to } = req.query;
  let sql = `SELECT r.id, r.customer_name, r.customer_email, r.customer_phone,
               r.start_utc, r.end_utc, r.status, r.payment_status,
               r.price_cents, r.gst_cents, v.name as vehicle_name
             FROM reservations r JOIN vehicles v ON v.id = r.vehicle_id WHERE 1=1`;
  const params = [];
  if (from) { sql += ` AND r.start_utc >= ?`; params.push(from); }
  if (to)   { sql += ` AND r.end_utc <= ?`;   params.push(to); }
  sql += ` ORDER BY r.start_utc`;

  const rows = db.prepare(sql).all(...params);
  const headers = 'ID,Customer,Email,Phone,Vehicle,Start,End,Status,Payment,Price AUD,GST AUD\n';
  const lines = rows.map(r =>
    [r.id, r.customer_name, r.customer_email, r.customer_phone, r.vehicle_name,
     r.start_utc, r.end_utc, r.status, r.payment_status,
     centsToAud(r.price_cents), centsToAud(r.gst_cents)
    ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="reservations.csv"');
  res.send(headers + lines);
});

// ---------- Audit ----------

router.get('/audit', requireAdmin, (req, res) => {
  const rows = db.prepare(
    `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 500`
  ).all();
  res.json({ data: rows });
});

module.exports = router;
