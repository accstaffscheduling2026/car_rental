function getCancellationPolicy(db) {
  const rows = db.prepare(
    `SELECT key, value FROM settings WHERE key IN
     ('cancel_full_refund_hours','cancel_partial_hours','cancel_partial_pct')`
  ).all();
  const s = {};
  for (const r of rows) s[r.key] = parseInt(r.value, 10);
  return {
    fullRefundHours: isNaN(s.cancel_full_refund_hours) ? 48 : s.cancel_full_refund_hours,
    partialHours:    isNaN(s.cancel_partial_hours)     ? 24 : s.cancel_partial_hours,
    partialPct:      isNaN(s.cancel_partial_pct)       ? 50 : s.cancel_partial_pct,
  };
}

function calcRefund(reservation, policy) {
  if (reservation.payment_status !== 'paid') {
    return { refundPct: 0, refundCents: 0 };
  }
  const hoursUntilPickup = (new Date(reservation.start_utc) - new Date()) / 3600000;
  let refundPct;
  if (hoursUntilPickup >= policy.fullRefundHours) {
    refundPct = 100;
  } else if (hoursUntilPickup >= policy.partialHours) {
    refundPct = policy.partialPct;
  } else {
    refundPct = 0;
  }
  const refundCents = Math.round(reservation.price_cents * refundPct / 100);
  return { refundPct, refundCents };
}

module.exports = { getCancellationPolicy, calcRefund };
