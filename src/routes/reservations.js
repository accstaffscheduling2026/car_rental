const express = require('express');
const db = require('../db');
const { invalidate } = require('../cache');
const { ReservationCreate, CancelRequest } = require('../schemas');
const { calcPrice, centsToAud } = require('../utils/pricing');
const { sendBookingConfirmation, sendStaffNewBooking, sendCancellationConfirmation, refNum } = require('../utils/email');
const router = express.Router();

function formatReservation(r) {
  return {
    ...r,
    price_aud:   centsToAud(r.price_cents),
    gst_aud:     centsToAud(r.gst_cents),
    ref:         refNum(r.id, r.created_at),
    addons:      r.addons_json ? JSON.parse(r.addons_json) : [],
  };
}

// POST /api/v1/reservations
router.post('/', (req, res) => {
  const parsed = ReservationCreate.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: 'Validation failed', issues: parsed.error.issues });
  }
  const data = parsed.data;

  const startDate = new Date(data.start_utc);
  const endDate   = new Date(data.end_utc);
  const now = new Date();

  if (startDate < new Date(now.getTime() + 60 * 60 * 1000)) {
    return res.status(422).json({ error: 'Start time must be at least 1 hour from now' });
  }
  if (endDate <= startDate) {
    return res.status(422).json({ error: 'end_utc must be after start_utc' });
  }

  const startStr = startDate.toISOString();
  const endStr   = endDate.toISOString();

  const createReservation = db.transaction(() => {
    const vehicle = db.prepare(`SELECT * FROM vehicles WHERE id = ? AND status = 'active'`).get(data.vehicle_id);
    if (!vehicle) {
      return { status: 404, error: 'Vehicle not found or not available' };
    }

    const conflicts = db.prepare(`
      SELECT id FROM reservations
      WHERE vehicle_id = ?
        AND status IN ('pending','confirmed','picked_up')
        AND NOT (end_utc <= ? OR start_utc >= ?)
    `).all(data.vehicle_id, startStr, endStr);

    if (conflicts.length > 0) {
      return { status: 409, error: 'Vehicle is no longer available for the requested time window' };
    }

    const { totalCents, gstCents } = calcPrice(
      vehicle.hourly_rate_cents, vehicle.daily_rate_cents, startDate, endDate
    );

    const result = db.prepare(`
      INSERT INTO reservations
        (vehicle_id, customer_name, customer_email, customer_phone, intended_use,
         addons_json, start_utc, end_utc, price_cents, gst_cents,
         terms_accepted, terms_accepted_at, status, payment_status)
      VALUES (?,?,?,?,?,?,?,?,?,?,1,datetime('now'),'pending','none')
    `).run(
      data.vehicle_id, data.customer_name, data.customer_email, data.customer_phone,
      data.intended_use || null,
      data.addons_json ? JSON.stringify(data.addons_json) : null,
      startStr, endStr, totalCents, gstCents
    );

    db.prepare(`
      INSERT INTO audit_log (entity, entity_id, action, actor, detail_json)
      VALUES ('reservation', ?, 'create', 'customer', ?)
    `).run(result.lastInsertRowid, JSON.stringify({ vehicle_id: data.vehicle_id }));

    const reservation = db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(result.lastInsertRowid);
    return { status: 201, reservation, vehicle };
  });

  const outcome = createReservation();
  if (outcome.error) {
    return res.status(outcome.status).json({ error: outcome.error });
  }

  invalidate();

  // Send emails async — do not block response
  sendBookingConfirmation(outcome.reservation, outcome.vehicle).catch(() => {});
  sendStaffNewBooking(outcome.reservation, outcome.vehicle).catch(() => {});

  res.status(201).json({ data: formatReservation(outcome.reservation) });
});

// GET /api/v1/reservations/:id?email=
router.get('/:id', (req, res) => {
  const r = db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Reservation not found' });
  if (r.customer_email.toLowerCase() !== (req.query.email || '').toLowerCase()) {
    return res.status(403).json({ error: 'Email does not match' });
  }
  res.json({ data: formatReservation(r) });
});

// PATCH /api/v1/reservations/:id/cancel
router.patch('/:id/cancel', (req, res) => {
  const parsed = CancelRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: 'Validation failed', issues: parsed.error.issues });
  }

  const r = db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Reservation not found' });
  if (r.customer_email.toLowerCase() !== parsed.data.customer_email.toLowerCase()) {
    return res.status(403).json({ error: 'Email does not match' });
  }
  if (['completed', 'cancelled'].includes(r.status)) {
    return res.status(409).json({ error: `Reservation is already ${r.status}` });
  }

  db.prepare(`
    UPDATE reservations SET status = 'cancelled', cancellation_reason = ?, updated_at = datetime('now') WHERE id = ?
  `).run(parsed.data.reason || null, r.id);

  db.prepare(`
    INSERT INTO audit_log (entity, entity_id, action, actor, detail_json)
    VALUES ('reservation', ?, 'cancel', 'customer', ?)
  `).run(r.id, JSON.stringify({ reason: parsed.data.reason }));

  invalidate();

  const updated = db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(r.id);
  sendCancellationConfirmation(updated).catch(() => {});

  res.json({ data: formatReservation(updated) });
});

module.exports = router;
