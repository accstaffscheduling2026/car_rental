const express = require('express');
const db = require('../db');
const { centsToAud } = require('../utils/pricing');
const { refNum } = require('../utils/email');
const router = express.Router();

function requireUser(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Please sign in to view your bookings' });
  next();
}

// GET /api/v1/my-bookings
router.get('/', requireUser, (req, res) => {
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.session.userId);
  if (!user) { req.session.userId = null; return res.status(401).json({ error: 'Session expired' }); }

  const bookings = db.prepare(`
    SELECT r.*, v.name AS vehicle_name, v.type AS vehicle_type,
           bf.id AS feedback_id, bf.rating, bf.comment AS feedback_comment
    FROM reservations r
    JOIN vehicles v ON v.id = r.vehicle_id
    LEFT JOIN booking_feedback bf ON bf.reservation_id = r.id
    WHERE r.customer_email = ? COLLATE NOCASE
    ORDER BY r.start_utc DESC
  `).all(user.email);

  res.json({ data: bookings.map(r => ({
    ...r,
    price_aud: centsToAud(r.price_cents),
    ref: refNum(r.id, r.created_at),
  })) });
});

// POST /api/v1/my-bookings/:id/feedback
router.post('/:id/feedback', requireUser, (req, res) => {
  const { rating, comment } = req.body;
  const ratingNum = parseInt(rating, 10);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    return res.status(422).json({ error: 'Rating must be between 1 and 5 stars' });
  }

  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.session.userId);
  if (!user) { req.session.userId = null; return res.status(401).json({ error: 'Session expired' }); }

  const r = db.prepare(
    'SELECT * FROM reservations WHERE id = ? AND customer_email = ? COLLATE NOCASE'
  ).get(req.params.id, user.email);
  if (!r) return res.status(404).json({ error: 'Booking not found' });
  if (r.status !== 'completed') {
    return res.status(422).json({ error: 'Feedback can only be left for completed bookings' });
  }

  const existing = db.prepare('SELECT id FROM booking_feedback WHERE reservation_id = ?').get(r.id);
  if (existing) return res.status(409).json({ error: 'You have already submitted feedback for this booking' });

  db.prepare('INSERT INTO booking_feedback (reservation_id, rating, comment) VALUES (?, ?, ?)')
    .run(r.id, ratingNum, comment?.trim() || null);

  res.status(201).json({ message: 'Thank you for your feedback!' });
});

module.exports = router;
