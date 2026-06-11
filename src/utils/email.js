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

async function sendCancellationWithRefund(reservation, refundCents, refundPct) {
  if (!process.env.SMTP_HOST) return;

  const ref = refNum(reservation.id, reservation.created_at);
  const refundAmt = `AUD $${(refundCents / 100).toFixed(2)}`;

  const refundSection = refundCents > 0
    ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
        <h3 style="color:#166534;margin:0 0 8px;">Refund Information</h3>
        <p style="margin:0;">A refund of <strong>${refundAmt}</strong> (${refundPct}% of total hire cost) will be processed within <strong>7–10 business days</strong>, subject to our review.</p>
        <p style="margin:8px 0 0;font-size:13px;color:#15803d;">You will receive a separate email once the refund has been approved and processed.</p>
       </div>`
    : `<p>No refund applies to this cancellation based on our cancellation policy.</p>`;

  const html = `
<p>Dear ${reservation.customer_name},</p>
<p>Your booking <strong>${ref}</strong> has been cancelled.</p>
${refundSection}
<p>If you have any questions, please contact us:<br/>
Phone: ${PHONE}<br/>Email: ${EMAIL_ADR}</p>
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
    subject: `Your booking has been cancelled — ${ref}`,
    html,
  });
}

async function sendRefundApproved(reservation, refundCents) {
  if (!process.env.SMTP_HOST) return;

  const ref = refNum(reservation.id, reservation.created_at);
  const refundAmt = `AUD $${(refundCents / 100).toFixed(2)}`;

  const html = `
<p>Dear ${reservation.customer_name},</p>
<p>We are pleased to confirm that your refund for booking <strong>${ref}</strong> has been approved.</p>
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
  <h3 style="color:#166534;margin:0 0 8px;">Refund Approved</h3>
  <p style="margin:0;"><strong>Amount:</strong> ${refundAmt}</p>
  <p style="margin:8px 0 0;">Please allow <strong>7–10 business days</strong> for the funds to appear on your original payment method.</p>
</div>
<p>If you have any questions, please contact us:<br/>
Phone: ${PHONE}<br/>Email: ${EMAIL_ADR}</p>
<hr/>
<p style="font-size:12px;color:#666">${FACILITY} | ${ADDRESS}</p>
`;

  await getTransporter().sendMail({
    from:    process.env.EMAIL_FROM || `${FACILITY} <${EMAIL_ADR}>`,
    to:      reservation.customer_email,
    subject: `Refund approved — ${ref}`,
    html,
  });
}

async function sendStaffRefundTask(reservation, refundRequest) {
  if (!process.env.SMTP_HOST || !process.env.FACILITY_EMAIL) return;

  const ref = refNum(reservation.id, reservation.created_at);
  const refundAmt = `AUD $${(refundRequest.refund_cents / 100).toFixed(2)}`;

  const html = `
<p><strong>Refund review required: ${ref}</strong></p>
<table>
  <tr><td><strong>Customer:</strong></td><td>${reservation.customer_name}</td></tr>
  <tr><td><strong>Email:</strong></td><td>${reservation.customer_email}</td></tr>
  <tr><td><strong>Refund Amount:</strong></td><td>${refundAmt} (${refundRequest.refund_pct}%)</td></tr>
</table>
<p>Please log in to the admin portal to review and approve or reject this refund request.</p>
<p><a href="${BASE_URL}/admin/refund-requests">View Refund Requests</a></p>
`;

  await getTransporter().sendMail({
    from:    process.env.EMAIL_FROM || `${FACILITY} <${EMAIL_ADR}>`,
    to:      EMAIL_ADR,
    subject: `[Action Required] Refund review — ${ref}`,
    html,
  });
}

async function sendAdminCancelledEmail(reservation, refundCents) {
  if (!process.env.SMTP_HOST) return;

  const ref = refNum(reservation.id, reservation.created_at);
  const refundSection = refundCents > 0
    ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
        <h3 style="color:#166534;margin:0 0 8px;">Full Refund Processed</h3>
        <p style="margin:0;">A full refund of <strong>AUD $${(refundCents / 100).toFixed(2)}</strong> has been initiated to your original payment method.</p>
        <p style="margin:8px 0 0;font-size:13px;color:#15803d;">Please allow 7–10 business days for the funds to appear on your statement.</p>
       </div>`
    : '';

  const html = `
<p>Dear ${reservation.customer_name},</p>
<p>We regret to inform you that your booking <strong>${ref}</strong> has been cancelled by us.</p>
${refundSection}
<p>We sincerely apologise for any inconvenience caused. If you have any questions, please contact us:<br/>
Phone: ${PHONE}<br/>Email: ${EMAIL_ADR}</p>
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
    subject: `Important: Your booking has been cancelled — ${ref}`,
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

module.exports = {
  sendBookingConfirmation,
  sendCancellationConfirmation,
  sendCancellationWithRefund,
  sendAdminCancelledEmail,
  sendRefundApproved,
  sendStaffRefundTask,
  sendStaffNewBooking,
  sendBookingCode,
  refNum,
};
