import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { formatSydney, formatAUDFromString, refNum } from '../utils/formatters.js';
import { AlertSuccess, AlertInfo } from '../components/Alert.jsx';

const PHONE = import.meta.env.VITE_FACILITY_PHONE || '(02) XXXX XXXX';
const EMAIL = import.meta.env.VITE_FACILITY_EMAIL || 'rentals@facility.com.au';

export default function Confirmation() {
  const { state } = useLocation();

  if (!state?.reservation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Submitted</h1>
        <p className="text-gray-600 mb-6">Our staff will be in touch to confirm your booking.</p>
        <Link to="/" className="btn-primary">Return Home</Link>
      </div>
    );
  }

  const { reservation: r, vehicle: v } = state;
  const ref = refNum(r.id, r.created_at);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Booking Submitted!</h1>
        <p className="text-gray-600 mt-2">Reference: <strong className="text-gray-900">{ref}</strong></p>
      </div>

      <AlertInfo>
        <strong>Your booking is held — not yet confirmed.</strong><br />
        Our staff will call you on <strong>{r.customer_phone}</strong> within 2 business hours to confirm payment and finalise your booking.
      </AlertInfo>

      {/* Booking summary */}
      <div className="card p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Vehicle</dt>
            <dd className="font-medium text-gray-900">{v?.name || '—'}</dd>
          </div>
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
            <dt className="font-semibold text-gray-900">Total (incl. GST)</dt>
            <dd className="font-bold text-gray-900">{formatAUDFromString((r.price_cents / 100).toFixed(2))} AUD</dd>
          </div>
        </dl>
      </div>

      {/* Pickup info */}
      <div className="card p-6 mt-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Pickup Information</h2>
        <p className="text-sm text-gray-700 mb-3">
          {import.meta.env.VITE_FACILITY_ADDRESS || 'Facility address — see confirmation email'}
        </p>
        <p className="text-sm text-gray-700">
          Please bring your current driver's licence and be ready to sign the hire agreement on arrival.
        </p>
      </div>

      {/* Next steps */}
      <div className="card p-6 mt-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h2>
        <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
          <li>Our staff will call <strong>{r.customer_phone}</strong> within 2 business hours.</li>
          <li>Payment will be confirmed by phone or bank transfer.</li>
          <li>You'll receive a confirmation email once payment is finalised.</li>
          <li>On pickup day: bring your driver's licence and sign the hire agreement.</li>
        </ol>
      </div>

      {/* Contact & cancel */}
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
