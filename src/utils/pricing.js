const GST_RATE = parseFloat(process.env.GST_RATE || '0.10');

/**
 * Calculate price for a rental period in cents (GST-inclusive).
 * @param {number} hourlyRateCents
 * @param {number} dailyRateCents
 * @param {Date} start
 * @param {Date} end
 * @param {number} [discountPercent=0] - special rate discount applied to daily rate only
 * @returns {{ totalCents, gstCents, subtotalCents, hours }}
 */
function calcPrice(hourlyRateCents, dailyRateCents, start, end, discountPercent = 0) {
  const ms = end.getTime() - start.getTime();
  const hours = ms / (1000 * 60 * 60);
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  const effectiveDailyRate = discountPercent > 0
    ? Math.round(dailyRateCents * (1 - discountPercent / 100))
    : dailyRateCents;

  let totalCents = days * effectiveDailyRate + Math.ceil(remainingHours) * hourlyRateCents;
  if (totalCents === 0 && hours > 0) totalCents = hourlyRateCents;

  // Prices are GST-inclusive per spec. Extract GST component.
  const gstCents = Math.round(totalCents * GST_RATE / (1 + GST_RATE));
  const subtotalCents = totalCents - gstCents;

  return { totalCents, gstCents, subtotalCents, hours };
}

function centsToAud(cents) {
  return (cents / 100).toFixed(2);
}

module.exports = { calcPrice, centsToAud, GST_RATE };
