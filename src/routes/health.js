const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', db: 'ok', uptime_seconds: Math.floor(process.uptime()) });
  } catch {
    res.status(503).json({ status: 'error', db: 'error' });
  }
});

module.exports = router;
