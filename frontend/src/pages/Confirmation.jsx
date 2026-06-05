import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { formatSydney, formatAUDFromString, refNum } from '../utils/formatters.js';
import { verifyPayment } from '../utils/api.js';
import { AlertSuccess, AlertInfo, AlertError } from '../components/Alert.jsx';

const PHONE   = import.meta.env.VITE_FACILITY_PHONE   || '(02) XXXX XXXX';
const ADDRESS = import.meta.env.VITE_FACILITY_ADDRESS || 'See confirmation email for address';

export default function Confirmation() {
  const { state }        = useLocation();
  const [searchParams]   = useSearchParams();

  // Stripe redirects back with these query params:
  const paymentIntentId = searchParams.get('payment_intent');
  const reservationId   = searchParams.get('reservation_id');
  const redirectStatus  = searchParams.get('redirect_status'); // 'succeeded' | 'failed' | 'canceled'

  const [verifying, setVerifying]       = useState(!!paymentIntentId);
  const [stripeStatus, setStripeStatus] = useState(null);   // 'succeeded' | 'failed' | other
  const [reservation, setReservation]   = useState(state?.reservation || null);
  const [vehicle, setVehicle]           = useState(state?.vehicle || null);
  const [verifyError, setVerifyError]   = useState(false);

  // When the page loads with Stripe query params, verify the payment with the backend
  useEffect(() => {
    if (!paymentIntentId || !reservationId) return;

    verifyPayment(paymentIntentId, reservationId)
      .then(data => {
        setStripeStatus(data.stripe_status);
        setReservation(data.reservation);
        setVehicle(data.vehicle);
      })
      .catch(() => {
        // Fall back to the redirect_status param from Stripe URL if backend call fails
        setStripeStatus(redirectStatus || 'failed');
        setVerifyError(true);
      })
      .finally(() => setVerifying(false));
  }, [paymentIntentId, reservationId]);

  // ── Loading state while verifying ──
  if (verifying) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center" aria-live="polite">
        <div className="animate-spin w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-4" aria-hidden="true" />
        <p className="text-gray-600">Confirming your payment…</p>
      </div>
    );
  }

  // ── Payment failed ──
  if (stripeStatus && stripeStatus !== 'succeeded') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Not Completed</h1>
          <p className="text-gray-600 mt-2">Your booking has not been confirmed.</p>
        </div>

        <AlertError>
          Your payment was not successful. Your booking has been cancelled and no charge has been made.
          Please try again with a different card, or contact us for assistance.
        </AlertError>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link to="/availability" className="btn-primary flex-1 text-center">Try Again</Link>
          <a href={`tel:${PHONE.replace(/[\s()]/g, '')}`} className="btn-secondary flex-1 text-center">
            Call Us: {PHONE}
          </a>
        </div>
      </div>
    );
  }

  // ── No reservation data and no Stripe params — direct nav to /booking/confirmation ──
  if (!reservation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Submitted</h1>
        <p className="text-gray-600 mb-6">Our staff will be in touch to confirm your booking.</p>
        <Link to="/" className="btn-primary">Return Home</Link>
      </div>
    );
  }

  // ── Success ──
  const r   = reservation;
  const v   = vehicle;
  const ref = refNum(r.id, r.created_at);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Booking Confirmed!</h1>
        <p className="text-gray-600 mt-2">Reference: <strong className="text-gray-900">{ref}</strong></p>
      </div>

      {/* Payment status banner */}
      {r.payment_status === 'paid' ? (
        <AlertSuccess>
          <strong>Payment received.</strong> Your booking is confirmed and your vehicle is reserved.
          A receipt has been sent to <strong>{r.customer_email}</strong>.
        </AlertSuccess>
      ) : (
        <AlertInfo>
          <strong>Booking held — payment pending.</strong><br />
          Our staff will contact you on <strong>{r.customer_phone}</strong> to finalise payment.
        </AlertInfo>
      )}

      {/* Booking summary */}
      <div className="card p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h2>
        <dl className="space-y-3 text-sm">
          {v && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Vehicle</dt>
              <dd className="font-medium text-gray-900">{v.name}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-500">Pick-up</dt>
            <dd className="font-medium text-gray-900">{formatSydney(r.start_utc)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Return</dt>
            <dd className="font-medium text-gray-900">{formatSydney(r.end_utc)}</dd>
          </div>
          <hr className="border-gray-100" />
          <div className="flex justify-between">
            <dt className="text-gray-500">GST (10%)</dt>
            <dd className="text-gray-700">{formatAUDFromString((r.gst_cents / 100).toFixed(2))}</dd>
          </div>
          <div className="flex justify-between text-base">
            <dt className="font-semibold text-gray-900">Total paid (incl. GST)</dt>
            <dd className="font-bold text-gray-900">{formatAUDFromString((r.price_cents / 100).toFixed(2))} AUD</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Payment status</dt>
            <dd className={`font-medium ${r.payment_status === 'paid' ? 'text-green-700' : 'text-amber-700'}`}>
              {r.payment_status === 'paid' ? 'Paid' : 'Pending'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Pickup info */}
      <div className="card p-6 mt-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Pickup Information</h2>
        <p className="text-sm text-gray-700 mb-3">{ADDRESS}</p>
        <p className="text-sm text-gray-700">
          Please bring your current driver's licence. Be ready to sign the hire agreement on arrival.
        </p>
      </div>

      {/* Next steps */}
      <div className="card p-6 mt-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h2>
        {r.payment_status === 'paid' ? (
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>You will receive a confirmation email with your booking details.</li>
            <li>On pickup day, bring your driver's licence and sign the hire agreement.</li>
            <li>Return the vehicle on time with the same fuel level.</li>
          </ol>
        ) : (
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>Our staff will call <strong>{r.customer_phone}</strong> to finalise payment.</li>
            <li>You will receive a confirmation email once payment is finalised.</li>
            <li>On pickup day, bring your driver's licence and sign the hire agreement.</li>
          </ol>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <a href={`tel:${PHONE.replace(/[\s()]/g, '')}`} className="btn-secondary flex-1 text-center">
          Call Us: {PHONE}
        </a>
        <Link
          to={`/cancel/${r.id}?email=${encodeURIComponent(r.customer_email)}`}
          className="btn-secondary flex-1 text-center text-red-600 border-red-200 hover:bg-red-50"
        >
          Cancel Booking
        </Link>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        A confirmation email has been sent to {r.customer_email}
      </p>

      <div className="mt-8 text-center">
        <Link to="/" className="btn-primary">Return to Home</Link>
      </div>
    </div>
  );
}
