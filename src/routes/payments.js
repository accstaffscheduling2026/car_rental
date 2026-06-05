const express = require('express');
const db = require('../db');
const router = express.Router();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// POST /api/v1/payments/intent
// Creates a Stripe PaymentIntent for an existing reservation and returns the clientSecret.
// The frontend passes this to the Stripe Payment Element to render the card form.
router.post('/intent', async (req, res) => {
  const { reservation_id } = req.body;
  if (!reservation_id) return res.status(422).json({ error: 'reservation_id is required' });

  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Payment processing is not configured on this server' });

  const r = db.prepare('SELECT * FROM reservations WHERE id = ?').get(parseInt(reservation_id, 10));
  if (!r) return res.status(404).json({ error: 'Reservation not found' });
  if (r.payment_status === 'paid') return res.status(409).json({ error: 'Payment already completed for this reservation' });

  // Re-use existing PaymentIntent if one was already created (e.g. user refreshed the page)
  if (r.payment_token && r.payment_token.startsWith('pi_')) {
    try {
      const existing = await stripe.paymentIntents.retrieve(r.payment_token);
      if (existing.status !== 'canceled') {
        return res.json({ client_secret: existing.client_secret });
      }
    } catch (_) {
      // Existing PI not valid — create a new one below
    }
  }

  try {
    const pi = await stripe.paymentIntents.create({
      amount: r.price_cents,
      currency: 'aud',
      metadata: {
        reservation_id: String(r.id),
        customer_email: r.customer_email,
        customer_name:  r.customer_name,
      },
      description: `Special Need Vehicle Rental — Booking #${r.id}`,
      receipt_email: r.customer_email,
    });

    db.prepare(`UPDATE reservations SET payment_token = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(pi.id, r.id);

    res.json({ client_secret: pi.client_secret });
  } catch (err) {
    res.status(502).json({ error: 'Failed to create payment session', detail: err.message });
  }
});

// GET /api/v1/payments/verify?payment_intent=pi_xxx&reservation_id=42
// Called by the confirmation page after Stripe redirects back.
// Retrieves the PaymentIntent status from Stripe, updates the reservation, and returns both.
router.get('/verify', async (req, res) => {
  const { payment_intent, reservation_id } = req.query;
  if (!payment_intent || !reservation_id) {
    return res.status(422).json({ error: 'payment_intent and reservation_id are required' });
  }

  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Payment processing is not configured' });

  const r = db.prepare('SELECT * FROM reservations WHERE id = ?').get(parseInt(reservation_id, 10));
  if (!r) return res.status(404).json({ error: 'Reservation not found' });
  if (r.payment_token !== payment_intent) {
    return res.status(403).json({ error: 'Payment intent does not match this reservation' });
  }

  try {
    const pi = await stripe.paymentIntents.retrieve(payment_intent);

    if (pi.status === 'succeeded' && r.payment_status !== 'paid') {
      db.prepare(`
        UPDATE reservations
        SET payment_status = 'paid', status = 'confirmed', updated_at = datetime('now')
        WHERE id = ?
      `).run(r.id);

      db.prepare(`
        INSERT INTO audit_log (entity, entity_id, action, actor, detail_json)
        VALUES ('reservation', ?, 'payment_succeeded', 'stripe', ?)
      `).run(r.id, JSON.stringify({ payment_intent_id: payment_intent }));
    }

    const updated  = db.prepare('SELECT * FROM reservations WHERE id = ?').get(r.id);
    const vehicle  = db.prepare('SELECT name, type FROM vehicles WHERE id = ?').get(updated.vehicle_id);

    res.json({ stripe_status: pi.status, reservation: updated, vehicle });
  } catch (err) {
    res.status(502).json({ error: 'Failed to verify payment with Stripe', detail: err.message });
  }
});

module.exports = router;
