export function formatAUD(cents) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);
}

export function formatAUDFromString(str) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(parseFloat(str || '0'));
}

export function formatSydney(utcStr) {
  if (!utcStr) return '—';
  return new Date(utcStr).toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

export function formatSydneyDate(utcStr) {
  if (!utcStr) return '—';
  return new Date(utcStr).toLocaleDateString('en-AU', {
    timeZone: 'Australia/Sydney',
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function toLocalDatetimeValue(utcStr) {
  if (!utcStr) return '';
  const d = new Date(utcStr);
  // Convert to Sydney time for display in datetime-local inputs
  const sydneyStr = d.toLocaleString('sv-SE', { timeZone: 'Australia/Sydney' });
  return sydneyStr.replace(' ', 'T').slice(0, 16);
}

export function sydneyToUtc(localDatetimeStr) {
  // datetime-local input value treated as Sydney time → convert to UTC ISO string
  if (!localDatetimeStr) return '';
  // We interpret the local input as Sydney time
  const [date, time] = localDatetimeStr.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  // Use Intl.DateTimeFormat to determine offset (handles AEST/AEDT automatically)
  const approx = new Date(y, m - 1, d, h, min);
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    timeZoneName: 'short',
  });
  // Compute the UTC offset by comparing the local interpretation
  // Simple approach: assume the browser may not be in Sydney, so we use a UTC trick
  const utcGuess = new Date(localDatetimeStr + ':00.000Z');
  const sydneyOffset = getSydneyOffset(utcGuess);
  return new Date(utcGuess.getTime() - sydneyOffset * 60000).toISOString();
}

function getSydneyOffset(date) {
  const utcStr = date.toLocaleString('en-AU', { timeZone: 'Australia/Sydney', hour12: false });
  const localStr = new Date(date.toISOString().slice(0, 16)).toLocaleString('en-AU', { hour12: false });
  // Returns offset in minutes (Sydney relative to UTC)
  const parts = utcStr.replace(',', '').split(/[\s/]+/);
  // Simple: parse date in Sydney timezone
  const sydneyDate = new Date(date.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
  return Math.round((date.getTime() - sydneyDate.getTime()) / 60000 + date.getTimezoneOffset());
}

export function refNum(id, createdAt) {
  const d = new Date(createdAt);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `SNVR-${y}${m}${day}-${String(id).padStart(3, '0')}`;
}

export function vehicleTypeLabel(type) {
  const labels = { sedan: 'Sedan', wagon: 'Station Wagon', van: 'People Mover', wheelchair: 'Wheelchair Accessible' };
  return labels[type] || type;
}

export function statusBadgeClass(status) {
  const map = {
    pending:    'bg-yellow-100 text-yellow-800',
    confirmed:  'bg-blue-100 text-blue-800',
    picked_up:  'bg-purple-100 text-purple-800',
    completed:  'bg-green-100 text-green-800',
    cancelled:  'bg-gray-100 text-gray-600',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

export function paymentBadgeClass(status) {
  const map = {
    none:           'bg-gray-100 text-gray-600',
    form_captured:  'bg-yellow-100 text-yellow-800',
    paid:           'bg-green-100 text-green-800',
    refunded:       'bg-blue-100 text-blue-800',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}
