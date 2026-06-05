const nodemailer = require('nodemailer');

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

const FACILITY  = process.env.FACILITY_NAME  || 'Special Need Vehicle Rental';
const PHONE     = process.env.FACILITY_PHONE || '(02) XXXX XXXX';
const EMAIL_ADR = process.env.FACILITY_EMAIL || 'rentals@facility.com.au';
const ADDRESS   = process.env.FACILITY_ADDRESS || 'Sydney, NSW';
const BASE_URL  = process.env.BASE_URL || 'http://localhost:8080';

function refNum(id, date) {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `SNVR-${y}${m}${day}-${String(id).padStart(3, '0')}`;
}

function sydneyDate(utcStr) {
  return new Date(utcStr).toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

async function sendBookingConfirmation(reservation, vehicle) {
  if (!process.env.SMTP_HOST) return; // skip if SMTP not configured

  const ref = refNum(reservation.id, reservation.created_at);
  const pickupStr = sydneyDate(reservation.start_utc);
  const returnStr = sydneyDate(reservation.end_utc);
  const total = `AUD $${(reservation.price_cents / 100).toFixed(2)} (incl. GST)`;

  const html = `
<p>Dear ${reservation.customer_name},</p>
<p>Thank you for choosing <strong>${FACILITY}</strong>.</p>
<hr/>
<h3>Booking Details</h3>
<table>
  <tr><td><strong>Booking Reference:</strong></td><td>${ref}</td></tr>
  <tr><td><strong>Vehicle:</strong></td><td>${vehicle.name}</td></tr>
  <tr><td><strong>Pick-up:</strong></td><td>${pickupStr}</td></tr>
  <tr><td><strong>Return:</strong></td><td>${returnStr}</td></tr>
  <tr><td><strong>Total:</strong></td><td>${total}</td></tr>
</table>
<hr/>
<h3>Next Steps</h3>
<p>Our staff will call you on <strong>${reservation.customer_phone}</strong> within 2 business hours
to confirm your booking and process payment.</p>
<p><strong>Your booking is HELD (not confirmed) until payment is finalised.</strong></p>
<h3>Pickup Location</h3>
<p>${ADDRESS}</p>
<p>To cancel your booking: <a href="${BASE_URL}/cancel/${reservation.id}?email=${encodeURIComponent(reservation.customer_email)}">Cancel Booking</a></p>
<p>Questions? Call us: ${PHONE} | Email: ${EMAIL_ADR}</p>
<hr/>
<p style="font-size:12px;color:#666">
  <a href="${BASE_URL}/privacy">Privacy Policy</a> |
  <a href="${BASE_URL}/terms">Terms &amp; Conditions</a><br/>
  ${FACILITY} | ${ADDRESS}
</p>
`;

  await getTransporter().sendMail({
    from:    process.env.EMAIL_FROM || `${FACILITY} <${EMAIL_ADR}>`,
    to:      reservation.customer_email,
    subject: `Your booking request — ${ref}`,
    html,
  });
}

async function sendCancellationConfirmation(reservation) {
  if (!process.env.SMTP_HOST) return;

  const ref = refNum(reservation.id, reservation.created_at);
  const html = `
<p>Dear ${reservation.customer_name},</p>
<p>Your booking <strong>${ref}</strong> has been cancelled.</p>
<p>If you believe this is an error, please contact us:<br/>
Phone: ${PHONE}<br/>Email: ${EMAIL_ADR}</p>
<p style="font-size:12px;color:#666">${FACILITY} | ${ADDRESS}</p>
`;

  await getTransporter().sendMail({
    from:    process.env.EMAIL_FROM || `${FACILITY} <${EMAIL_ADR}>`,
    to:      reservation.customer_email,
    subject: `Your booking has been cancelled — ${ref}`,
    html,
  });
}

async function sendStaffNewBooking(reservation, vehicle) {
  if (!process.env.SMTP_HOST || !process.env.FACILITY_EMAIL) return;

  const ref = refNum(reservation.id, reservation.created_at);
  const pickupStr = sydneyDate(reservation.start_utc);
  const html = `
<p><strong>New booking received: ${ref}</strong></p>
<p>Customer: ${reservation.customer_name} | ${reservation.customer_email} | ${reservation.customer_phone}</p>
<p>Vehicle: ${vehicle.name}</p>
<p>Pick-up: ${pickupStr}</p>
<p>Action required: Call customer to confirm payment.</p>
<p><a href="${BASE_URL}/admin/reservations/${reservation.id}">View in Admin Dashboard</a></p>
`;

  await getTransporter().sendMail({
    from:    process.env.EMAIL_FROM || `${FACILITY} <${EMAIL_ADR}>`,
    to:      EMAIL_ADR,
    subject: `[Action Required] New booking — ${ref}`,
    html,
  });
}

async function sendBookingCode(employee, code, expiresAt) {
  if (!process.env.SMTP_HOST) return;

  const expiry = sydneyDate(expiresAt);
  const html = `
<p>Dear ${employee.name},</p>
<p>A booking code has been generated for you by <strong>${FACILITY}</strong> administration.</p>
<hr/>
<h2 style="font-size:28px;letter-spacing:4px;font-family:monospace;background:#f4f4f4;padding:16px;text-align:center;border-radius:8px;">${code}</h2>
<hr/>
<h3>How to use your code</h3>
<ol>
  <li>Go to <a href="${BASE_URL}">${BASE_URL}</a></li>
  <li>Search for an available vehicle and select your dates</li>
  <li>Complete your personal details (Steps 1 &amp; 2)</li>
  <li>On the Payment step, select <strong>"I have an employee code"</strong></li>
  <li>Enter the code above and complete your booking — no card required</li>
</ol>
<h3>Code Details</h3>
<table>
  <tr><td><strong>Employee ID:</strong></td><td>${employee.emp_id}</td></tr>
  <tr><td><strong>Name:</strong></td><td>${employee.name}</td></tr>
  <tr><td><strong>Expires:</strong></td><td>${expiry}</td></tr>
  <tr><td><strong>Single use:</strong></td><td>This code can only be used once</td></tr>
</table>
<p style="color:#d32f2f;"><strong>Do not share this code.</strong> If you did not request this code, please contact administration immediately.</p>
<hr/>
<p style="font-size:12px;color:#666">
  Questions? Call us: ${PHONE} | Email: ${EMAIL_ADR}<br/>
  ${FACILITY} | ${ADDRESS}
</p>
`;

  await getTransporter().sendMail({
    from:    process.env.EMAIL_FROM || `${FACILITY} <${EMAIL_ADR}>`,
    to:      employee.email,
    subject: `Your booking code — ${FACILITY}`,
    html,
  });
}

module.exports = { sendBookingConfirmation, sendCancellationConfirmation, sendStaffNewBooking, sendBookingCode, refNum };
