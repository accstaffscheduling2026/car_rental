const express = require('express');
const db = require('../db');
const { invalidate } = require('../cache');
const { ReservationCreate, CancelRequest } = require('../schemas');
const { calcPrice, centsToAud } = require('../utils/pricing');
const { sendBookingConfirmation, sendStaffNewBooking, sendCancellationWithRefund, sendStaffRefundTask, refNum } = require('../utils/email');
const { getCancellationPolicy, calcRefund } = require('../utils/cancellation');
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

  // Optional employee booking code (free hire) — validated and redeemed atomically
  const rawCode = req.body.booking_code ? String(req.body.booking_code).trim().toUpperCase() : null;

  // Optional promo code (special rate discount for paying customers)
  const rawPromoCode = req.body.promo_code ? String(req.body.promo_code).trim().toUpperCase() : null;

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

    // Validate employee booking code if provided
    let codeRecord = null;
    if (rawCode) {
      codeRecord = db.prepare(`
        SELECT bc.*, e.name AS employee_name
        FROM booking_codes bc JOIN employees e ON e.id = bc.employee_id
        WHERE bc.code = ? AND bc.status = 'active'
      `).get(rawCode);
      if (!codeRecord) return { status: 422, error: 'Invalid or expired booking code' };
      if (new Date(codeRecord.expires_at) < new Date()) {
        db.prepare("UPDATE booking_codes SET status = 'expired' WHERE id = ?").run(codeRecord.id);
        return { status: 422, error: 'Booking code has expired' };
      }
    }

    // Validate promo code if provided (only applies when not using a free employee code)
    let promoRecord = null;
    let promoDiscount = 0;
    if (rawPromoCode && !rawCode) {
      promoRecord = db.prepare(`SELECT * FROM promo_codes WHERE code = ?`).get(rawPromoCode);
      if (!promoRecord) return { status: 422, error: 'Invalid promo code' };
      if (promoRecord.expires_at && new Date(promoRecord.expires_at) < new Date()) {
        db.prepare(`UPDATE promo_codes SET status = 'expired' WHERE id = ? AND status = 'active'`).run(promoRecord.id);
        return { status: 422, error: 'Promo code has expired' };
      }
      if (promoRecord.status !== 'active') {
        return { status: 422, error: 'This promo code has already been used or is no longer valid' };
      }
      const setting = db.prepare(`SELECT value FROM settings WHERE key = 'special_rate_discount_percent'`).get();
      promoDiscount = setting ? parseInt(setting.value, 10) : 0;
    }

    const { totalCents, gstCents } = calcPrice(
      vehicle.hourly_rate_cents, vehicle.daily_rate_cents, startDate, endDate, promoDiscount
    );

    const initStatus  = rawCode ? 'confirmed' : 'pending';
    const initPayment = rawCode ? 'code_redeemed' : 'none';

    const result = db.prepare(`
      INSERT INTO reservations
        (vehicle_id, customer_name, customer_email, customer_phone, intended_use,
         addons_json, start_utc, end_utc, price_cents, gst_cents,
         terms_accepted, terms_accepted_at, status, payment_status,
         promo_code_id, promo_discount_percent)
      VALUES (?,?,?,?,?,?,?,?,?,?,1,datetime('now'),?,?,?,?)
    `).run(
      data.vehicle_id, data.customer_name, data.customer_email, data.customer_phone,
      data.intended_use || null,
      data.addons_json ? JSON.stringify(data.addons_json) : null,
      startStr, endStr, totalCents, gstCents,
      initStatus, initPayment,
      promoRecord ? promoRecord.id : null,
      promoDiscount
    );

    // Redeem the employee code — mark as used and link to this reservation
    if (codeRecord) {
      db.prepare(`
        UPDATE booking_codes
        SET status = 'used', used_at = datetime('now'), used_reservation_id = ?
        WHERE id = ?
      `).run(result.lastInsertRowid, codeRecord.id);
    }

    // Redeem the promo code — mark as used and link to this reservation
    if (promoRecord) {
      db.prepare(`
        UPDATE promo_codes
        SET status = 'used', used_at = datetime('now'), used_reservation_id = ?
        WHERE id = ?
      `).run(result.lastInsertRowid, promoRecord.id);
    }

    db.prepare(`
      INSERT INTO audit_log (entity, entity_id, action, actor, detail_json)
      VALUES ('reservation', ?, 'create', 'customer', ?)
    `).run(result.lastInsertRowid, JSON.stringify({
      vehicle_id: data.vehicle_id,
      payment_method: rawCode ? 'booking_code' : 'stripe',
      promo_discount_percent: promoDiscount || undefined,
    }));

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

  // Calculate refund based on current cancellation policy
  const policy = getCancellationPolicy(db);
  const { refundPct, refundCents } = calcRefund(r, policy);

  db.prepare(`
    UPDATE reservations SET status = 'cancelled', cancellation_reason = ?, updated_at = datetime('now') WHERE id = ?
  `).run(parsed.data.reason || null, r.id);

  // Release promo code if booking was never paid — allows customer to retry
  if (r.payment_status === 'none' && r.promo_code_id) {
    db.prepare(
      `UPDATE promo_codes SET status = 'active', used_at = NULL, used_reservation_id = NULL WHERE id = ? AND status = 'used'`
    ).run(r.promo_code_id);
  }

  // Create a refund request for paid bookings with a non-zero refund
  let refundRequest = null;
  if (refundCents > 0) {
    const rr = db.prepare(`
      INSERT INTO refund_requests (reservation_id, refund_cents, refund_pct)
      VALUES (?, ?, ?)
    `).run(r.id, refundCents, refundPct);
    refundRequest = db.prepare(`SELECT * FROM refund_requests WHERE id = ?`).get(rr.lastInsertRowid);
  }

  db.prepare(`
    INSERT INTO audit_log (entity, entity_id, action, actor, detail_json)
    VALUES ('reservation', ?, 'cancel', 'customer', ?)
  `).run(r.id, JSON.stringify({ reason: parsed.data.reason, refund_cents: refundCents, refund_pct: refundPct }));

  invalidate();

  const updated = db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(r.id);

  // Emails — fire and forget
  sendCancellationWithRefund(updated, refundCents, refundPct).catch(() => {});
  if (refundRequest) sendStaffRefundTask(updated, refundRequest).catch(() => {});

  res.json({
    data: formatReservation(updated),
    refund: refundCents > 0 ? { refund_cents: refundCents, refund_pct: refundPct } : null,
  });
});

module.exports = router;
