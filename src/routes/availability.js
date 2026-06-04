const express = require('express');
const db = require('../db');
const { availabilityCache } = require('../cache');
const { calcPrice, centsToAud } = require('../utils/pricing');
const router = express.Router();

// GET /api/v1/availability?start=ISO&end=ISO&type=
router.get('/', (req, res) => {
  const { start, end, type } = req.query;

  if (!start || !end) {
    return res.status(422).json({ error: 'start and end query params are required (ISO 8601 UTC)' });
  }

  const startDate = new Date(start);
  const endDate   = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(422).json({ error: 'Invalid date format. Use ISO 8601 UTC (e.g. 2026-06-15T04:00:00Z)' });
  }
  if (endDate <= startDate) {
    return res.status(422).json({ error: 'end must be after start' });
  }
  if (endDate - startDate < 60 * 60 * 1000) {
    return res.status(422).json({ error: 'Minimum rental duration is 1 hour' });
  }

  const cacheKey = `${start}|${end}|${type || ''}`;
  const cached = availabilityCache.get(cacheKey);
  if (cached) return res.json(cached);

  const typeFilter = type ? ` AND type = ?` : '';
  const params = type ? ['active', type] : ['active'];

  const vehicles = db.prepare(
    `SELECT * FROM vehicles WHERE status = ? ${typeFilter} ORDER BY type, name`
  ).all(...params);

  const conflictQ = db.prepare(`
    SELECT id FROM reservations
    WHERE vehicle_id = ?
      AND status IN ('pending','confirmed','picked_up')
      AND NOT (end_utc <= ? OR start_utc >= ?)
  `);

  const available = [];
  const unavailable = [];

  const startStr = startDate.toISOString();
  const endStr   = endDate.toISOString();

  for (const v of vehicles) {
    const conflicts = conflictQ.all(v.id, startStr, endStr);
    const { totalCents } = calcPrice(v.hourly_rate_cents, v.daily_rate_cents, startDate, endDate);
    const entry = {
      id:                  v.id,
      name:                v.name,
      type:                v.type,
      capacity:            v.capacity,
      accessibility_notes: v.accessibility_notes,
      hourly_rate_aud:     centsToAud(v.hourly_rate_cents),
      daily_rate_aud:      centsToAud(v.daily_rate_cents),
      price_for_period_aud: centsToAud(totalCents),
      buffer_minutes:      v.buffer_minutes,
      photos:              v.photos_json ? JSON.parse(v.photos_json) : [],
    };
    if (conflicts.length === 0) {
      available.push(entry);
    } else {
      unavailable.push({ ...entry, reason: 'booked' });
    }
  }

  const result = {
    requested_start:  start,
    requested_end:    end,
    timezone_display: 'Australia/Sydney',
    available,
    unavailable,
  };

  availabilityCache.set(cacheKey, result);
  res.json(result);
});

module.exports = router;
