const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { VehicleCreate, AdminLogin } = require('../schemas');
const { invalidate } = require('../cache');
const { centsToAud } = require('../utils/pricing');
const { sendRefundApproved, sendAdminCancelledEmail } = require('../utils/email');
const router = express.Router();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

function generatePromoCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excludes confusable 0/O 1/I
  const bytes = crypto.randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[bytes[i] % chars.length];
  return code;
}

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

// POST /admin/reservations/:id/cancel
// Admin-initiated cancellation. Per T&C 2.5(f): if WE cancel, customer gets a full
// refund immediately — no pending-review queue needed.
router.post('/reservations/:id/cancel', requireAdmin, async (req, res) => {
  const { reason, notes } = req.body;

  const r = db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  if (['completed', 'cancelled'].includes(r.status)) {
    return res.status(409).json({ error: `Reservation is already ${r.status}` });
  }

  let stripeRefundId = null;
  let refundCents = 0;

  if (r.payment_status === 'paid' && r.payment_token && r.payment_token.startsWith('pi_')) {
    const stripe = getStripe();
    if (!stripe) return res.status(503).json({ error: 'Stripe is not configured on this server' });
    try {
      const refund = await stripe.refunds.create({
        payment_intent: r.payment_token,
        reason: 'requested_by_customer',
        metadata: { reservation_id: String(r.id), cancelled_by: 'admin' },
      });
      stripeRefundId = refund.id;
      refundCents = r.price_cents;
    } catch (err) {
      return res.status(502).json({ error: `Stripe refund failed: ${err.message}` });
    }
  }

  db.prepare(`
    UPDATE reservations
    SET status = 'cancelled',
        payment_status = CASE WHEN payment_status = 'paid' THEN 'refunded' ELSE payment_status END,
        cancellation_reason = ?,
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(reason || 'Cancelled by administration', notes || null, r.id);

  if (refundCents > 0) {
    db.prepare(`
      INSERT INTO refund_requests
        (reservation_id, refund_cents, refund_pct, status, stripe_refund_id, notes, reviewed_at, reviewed_by)
      VALUES (?, ?, 100, 'approved', ?, 'Admin-initiated cancellation — full refund per T&C 2.5(f)', datetime('now'), ?)
    `).run(r.id, refundCents, stripeRefundId, req.session.adminId || 'admin');
  }

  db.prepare(`
    INSERT INTO audit_log (entity, entity_id, action, actor, detail_json)
    VALUES ('reservation', ?, 'admin_cancel', 'admin', ?)
  `).run(r.id, JSON.stringify({ reason, refund_cents: refundCents, stripe_refund_id: stripeRefundId }));

  invalidate();

  const updated = db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(r.id);
  sendAdminCancelledEmail(updated, refundCents).catch(() => {});

  res.json({
    data: { ...updated, price_aud: centsToAud(updated.price_cents) },
    refund: refundCents > 0 ? { refund_cents: refundCents } : null,
  });
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

// ---------- Settings ----------

router.get('/settings', requireAdmin, (req, res) => {
  const rows = db.prepare(`SELECT key, value FROM settings`).all();
  const settings = {};
  for (const row of rows) settings[row.key] = row.value;
  res.json({ data: settings });
});

const SETTING_RULES = {
  special_rate_discount_percent: { min: 0,  max: 100  },
  cancel_full_refund_hours:      { min: 0,  max: 8760 },
  cancel_partial_hours:          { min: 0,  max: 8760 },
  cancel_partial_pct:            { min: 0,  max: 100  },
};

router.patch('/settings', requireAdmin, (req, res) => {
  for (const [key, rules] of Object.entries(SETTING_RULES)) {
    if (req.body[key] === undefined) continue;
    const val = parseInt(req.body[key], 10);
    if (isNaN(val) || val < rules.min || val > rules.max) {
      return res.status(422).json({ error: `${key} must be between ${rules.min} and ${rules.max}` });
    }
    db.prepare(
      `UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?`
    ).run(String(val), key);
  }
  const rows = db.prepare(`SELECT key, value FROM settings`).all();
  const settings = {};
  for (const row of rows) settings[row.key] = row.value;
  res.json({ data: settings });
});

// ---------- Promo Codes ----------

router.get('/promo-codes', requireAdmin, (req, res) => {
  db.prepare(
    `UPDATE promo_codes SET status = 'expired' WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < datetime('now')`
  ).run();
  const rows = db.prepare(`SELECT * FROM promo_codes ORDER BY created_at DESC`).all();
  res.json({ data: rows });
});

router.post('/promo-codes', requireAdmin, (req, res) => {
  const count = Math.min(Math.max(parseInt(req.body.count || 1, 10), 1), 50);
  const expiresAt = req.body.expires_at || null;
  const discountPercent = Math.min(Math.max(parseInt(req.body.discount_percent || 0, 10), 0), 100);

  if (discountPercent <= 0) return res.status(422).json({ error: 'Discount must be between 1 and 100' });

  const generated = [];
  for (let i = 0; i < count; i++) {
    let code;
    let attempts = 0;
    do {
      code = generatePromoCode();
      attempts++;
    } while (db.prepare(`SELECT id FROM promo_codes WHERE code = ?`).get(code) && attempts < 10);

    db.prepare(
      `INSERT INTO promo_codes (code, generated_by, expires_at, discount_percent) VALUES (?, ?, ?, ?)`
    ).run(code, req.session.adminId, expiresAt, discountPercent);
    generated.push(code);
  }
  res.status(201).json({ data: generated });
});

router.patch('/promo-codes/:id/disable', requireAdmin, (req, res) => {
  const row = db.prepare(`SELECT * FROM promo_codes WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.status !== 'active') return res.status(409).json({ error: `Code is already ${row.status}` });
  db.prepare(`UPDATE promo_codes SET status = 'disabled' WHERE id = ?`).run(req.params.id);
  res.json({ data: db.prepare(`SELECT * FROM promo_codes WHERE id = ?`).get(req.params.id) });
});

// ---------- Refund Requests ----------

router.get('/refund-requests', requireAdmin, (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT rr.*, r.customer_name, r.customer_email, r.customer_phone,
           r.start_utc, r.end_utc, r.price_cents, r.payment_token,
           v.name AS vehicle_name
    FROM refund_requests rr
    JOIN reservations r ON r.id = rr.reservation_id
    JOIN vehicles     v ON v.id = r.vehicle_id
    WHERE 1=1`;
  const params = [];
  if (status) { sql += ` AND rr.status = ?`; params.push(status); }
  sql += ` ORDER BY rr.requested_at DESC`;
  const rows = db.prepare(sql).all(...params);
  res.json({ data: rows.map(r => ({
    ...r,
    refund_aud: centsToAud(r.refund_cents),
    price_aud:  centsToAud(r.price_cents),
  })) });
});

router.get('/refund-requests/:id', requireAdmin, (req, res) => {
  const row = db.prepare(`
    SELECT rr.*, r.customer_name, r.customer_email, r.customer_phone,
           r.start_utc, r.end_utc, r.price_cents, r.payment_token,
           v.name AS vehicle_name
    FROM refund_requests rr
    JOIN reservations r ON r.id = rr.reservation_id
    JOIN vehicles     v ON v.id = r.vehicle_id
    WHERE rr.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ data: { ...row, refund_aud: centsToAud(row.refund_cents) } });
});

router.post('/refund-requests/:id/approve', requireAdmin, async (req, res) => {
  const rr = db.prepare(`
    SELECT rr.*, r.payment_token, r.customer_name, r.customer_email, r.price_cents
    FROM refund_requests rr JOIN reservations r ON r.id = rr.reservation_id
    WHERE rr.id = ?`).get(req.params.id);
  if (!rr) return res.status(404).json({ error: 'Not found' });
  if (rr.status !== 'pending') return res.status(409).json({ error: `Refund is already ${rr.status}` });

  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured on this server' });
  if (!rr.payment_token || !rr.payment_token.startsWith('pi_')) {
    return res.status(422).json({ error: 'No valid Stripe payment found for this reservation' });
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: rr.payment_token,
      amount:         rr.refund_cents,
      reason:         'requested_by_customer',
      metadata: {
        reservation_id:    String(rr.reservation_id),
        refund_request_id: String(rr.id),
      },
    });

    db.prepare(`
      UPDATE refund_requests
      SET status = 'approved', stripe_refund_id = ?, reviewed_at = datetime('now'), reviewed_by = ?, notes = ?
      WHERE id = ?
    `).run(refund.id, req.session.adminId, req.body.notes || null, rr.id);

    db.prepare(
      `UPDATE reservations SET payment_status = 'refunded', updated_at = datetime('now') WHERE id = ?`
    ).run(rr.reservation_id);

    db.prepare(`INSERT INTO audit_log (entity, entity_id, action, actor, detail_json) VALUES ('reservation',?,'refund_processed','admin',?)`)
      .run(rr.reservation_id, JSON.stringify({ refund_cents: rr.refund_cents, stripe_refund_id: refund.id, reviewed_by: req.session.adminId }));

    const reservation = db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(rr.reservation_id);
    sendRefundApproved(reservation, rr.refund_cents).catch(() => {});

    res.json({ data: db.prepare(`SELECT * FROM refund_requests WHERE id = ?`).get(rr.id) });
  } catch (err) {
    res.status(502).json({ error: 'Stripe refund failed', detail: err.message });
  }
});

router.post('/refund-requests/:id/reject', requireAdmin, (req, res) => {
  const rr = db.prepare(`SELECT * FROM refund_requests WHERE id = ?`).get(req.params.id);
  if (!rr) return res.status(404).json({ error: 'Not found' });
  if (rr.status !== 'pending') return res.status(409).json({ error: `Refund is already ${rr.status}` });

  db.prepare(`
    UPDATE refund_requests
    SET status = 'rejected', reviewed_at = datetime('now'), reviewed_by = ?, notes = ?
    WHERE id = ?
  `).run(req.session.adminId, req.body.notes || null, rr.id);

  db.prepare(`INSERT INTO audit_log (entity, entity_id, action, actor, detail_json) VALUES ('reservation',?,'refund_rejected','admin',?)`)
    .run(rr.reservation_id, JSON.stringify({ reviewed_by: req.session.adminId, notes: req.body.notes }));

  res.json({ data: db.prepare(`SELECT * FROM refund_requests WHERE id = ?`).get(rr.id) });
});

module.exports = router;
