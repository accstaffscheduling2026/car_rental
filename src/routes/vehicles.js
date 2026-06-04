const express = require('express');
const db = require('../db');
const { centsToAud } = require('../utils/pricing');
const router = express.Router();

function formatVehicle(v) {
  return {
    id:                  v.id,
    name:                v.name,
    type:                v.type,
    capacity:            v.capacity,
    plate:               v.plate,
    accessibility_notes: v.accessibility_notes,
    hourly_rate_aud:     centsToAud(v.hourly_rate_cents),
    daily_rate_aud:      centsToAud(v.daily_rate_cents),
    buffer_minutes:      v.buffer_minutes,
    status:              v.status,
    photos:              v.photos_json ? JSON.parse(v.photos_json) : [],
  };
}

// GET /api/v1/vehicles — all active vehicles
router.get('/', (req, res) => {
  const rows = db.prepare(
    `SELECT * FROM vehicles WHERE status = 'active' ORDER BY type, name`
  ).all();
  res.json({ data: rows.map(formatVehicle) });
});

// GET /api/v1/vehicles/:id
router.get('/:id', (req, res) => {
  const v = db.prepare(`SELECT * FROM vehicles WHERE id = ?`).get(req.params.id);
  if (!v) return res.status(404).json({ error: 'Vehicle not found' });
  res.json({ data: formatVehicle(v) });
});

module.exports = { router, formatVehicle };
