const db = require('../db');

function processStripeEvent(event) {
  const pi = event.data.object;
  const reservationId = parseInt(pi.metadata?.reservation_id, 10);
  if (!reservationId) return;

  if (event.type === 'payment_intent.succeeded') {
    db.prepare(`
      UPDATE reservations
      SET payment_status = 'paid', status = 'confirmed', payment_token = ?, updated_at = datetime('now')
      WHERE id = ? AND payment_status != 'paid'
    `).run(pi.id, reservationId);

    db.prepare(`
      INSERT INTO audit_log (entity, entity_id, action, actor, detail_json)
      VALUES ('reservation', ?, 'payment_succeeded', 'stripe_webhook', ?)
    `).run(reservationId, JSON.stringify({ payment_intent_id: pi.id, amount_cents: pi.amount }));
  }

  if (event.type === 'payment_intent.payment_failed') {
    db.prepare(`
      UPDATE reservations SET payment_status = 'failed', updated_at = datetime('now') WHERE id = ?
    `).run(reservationId);

    db.prepare(`
      INSERT INTO audit_log (entity, entity_id, action, actor, detail_json)
      VALUES ('reservation', ?, 'payment_failed', 'stripe_webhook', ?)
    `).run(reservationId, JSON.stringify({
      payment_intent_id: pi.id,
      error: pi.last_payment_error?.message,
    }));
  }
}

module.exports = function stripeWebhookHandler(req, res) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (webhookSecret) {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }
    processStripeEvent(event);
  } else {
    // Development: no webhook secret — parse body directly (not signature-verified)
    try {
      const event = JSON.parse(req.body.toString());
      processStripeEvent(event);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }
  }

  res.json({ received: true });
};
