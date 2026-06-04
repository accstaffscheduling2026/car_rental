const express = require('express');
const db = require('../db');
const { PaymentForm } = require('../schemas');
const router = express.Router();

// POST /api/v1/payments/form  — Phase 1 only: capture billing metadata, no card processing
router.post('/form', (req, res) => {
  const parsed = PaymentForm.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: 'Validation failed', issues: parsed.error.issues });
  }
  const data = parsed.data;

  const r = db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(data.reservation_id);
  if (!r) return res.status(404).json({ error: 'Reservation not found' });
  if (r.customer_email.toLowerCase() !== data.billing_email.toLowerCase()) {
    return res.status(403).json({ error: 'Billing email does not match reservation email' });
  }
  if (r.payment_status === 'paid') {
    return res.status(409).json({ error: 'Payment already recorded for this reservation' });
  }

  db.prepare(`
    UPDATE reservations
    SET cardholder_name = ?, card_last4 = ?, expiry_month = ?, expiry_year = ?,
        payment_status = 'form_captured', updated_at = datetime('now')
    WHERE id = ?
  `).run(data.cardholder_name, data.card_last4, data.expiry_month, data.expiry_year, r.id);

  db.prepare(`
    INSERT INTO audit_log (entity, entity_id, action, actor, detail_json)
    VALUES ('reservation', ?, 'payment_form_captured', 'customer', ?)
  `).run(r.id, JSON.stringify({ card_last4: data.card_last4 }));

  res.json({ message: 'Payment details captured. Staff will contact you within 2 business hours to confirm payment.' });
});

module.exports = router;
