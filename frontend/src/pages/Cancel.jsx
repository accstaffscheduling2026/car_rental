import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getReservation, cancelReservation } from '../utils/api.js';
import { formatSydney, formatAUDFromString, refNum } from '../utils/formatters.js';
import { AlertError, AlertSuccess, AlertWarning } from '../components/Alert.jsx';

export default function CancelPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get('email') || '';

  const [email, setEmail]         = useState(prefillEmail);
  const [reservation, setRes]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [emailErr, setEmailErr]   = useState('');
  const [reason, setReason]       = useState('');
  const [cancelled, setCancelled] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleLookup(e) {
    e.preventDefault();
    if (!email) { setEmailErr('Please enter your email address'); return; }
    setLoading(true);
    setError('');
    setEmailErr('');
    try {
      const res = await getReservation(id, email);
      setRes(res.data);
    } catch (err) {
      if (err.status === 403) setEmailErr('Email address does not match this booking.');
      else setError(err.message || 'Booking not found.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    setError('');
    try {
      await cancelReservation(id, { customer_email: email, reason });
      setCancelled(true);
    } catch (err) {
      setError(err.message || 'Cancellation failed. Please call us.');
    } finally {
      setLoading(false);
    }
  }

  if (cancelled) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Booking Cancelled</h1>
      <AlertSuccess>Your booking has been cancelled. A confirmation email has been sent.</AlertSuccess>
      <Link to="/" className="btn-primary mt-6 inline-flex">Return Home</Link>
    </div>
  );

  const ref = reservation ? refNum(reservation.id, reservation.created_at) : '';
  const msUntilPickup = reservation ? new Date(reservation.start_utc) - Date.now() : 0;
  const hoursUntil = msUntilPickup / 3600000;

  let policyMsg = '';
  if (hoursUntil > 48)       policyMsg = 'Free cancellation — no charge applies.';
  else if (hoursUntil > 24)  policyMsg = '50% of the hire cost may apply. Staff will confirm.';
  else                       policyMsg = 'Less than 24 hours notice — full hire cost may apply.';

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cancel Booking</h1>

      {!reservation ? (
        <div className="card p-6">
          <p className="text-gray-600 text-sm mb-4">Enter your email address to verify your identity and view your booking.</p>
          <form onSubmit={handleLookup} noValidate>
            <label htmlFor="verify-email" className="label">Email address</label>
            <input
              id="verify-email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              className={`input mb-1 ${emailErr ? 'input-error' : ''}`}
              aria-required="true"
              aria-describedby={emailErr ? 'email-err' : undefined}
            />
            {emailErr && <p id="email-err" className="error-text" role="alert">⚠ {emailErr}</p>}
            {error && <div className="mt-3"><AlertError>{error}</AlertError></div>}
            <button type="submit" disabled={loading} className="btn-primary mt-4 w-full">
              {loading ? 'Checking…' : 'View My Booking'}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Booking: {ref}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Vehicle</dt>
                <dd className="font-medium">{reservation.vehicle_name || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Pick-up</dt>
                <dd className="font-medium">{formatSydney(reservation.start_utc)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Return</dt>
                <dd className="font-medium">{formatSydney(reservation.end_utc)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total</dt>
                <dd className="font-bold">{formatAUDFromString((reservation.price_cents / 100).toFixed(2))} AUD</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium capitalize">{reservation.status}</dd>
              </div>
            </dl>
          </div>

          {['completed', 'cancelled'].includes(reservation.status) ? (
            <AlertWarning>
              This booking is already <strong>{reservation.status}</strong> and cannot be cancelled.
            </AlertWarning>
          ) : !confirming ? (
            <>
              <AlertWarning>
                <strong>Cancellation Policy:</strong> {policyMsg}
              </AlertWarning>
              <button onClick={() => setConfirming(true)} className="btn-danger w-full">
                Cancel This Booking
              </button>
            </>
          ) : (
            <div className="card p-6 border-red-200">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Confirm Cancellation</h2>
              <AlertWarning>{policyMsg}</AlertWarning>
              <div className="mt-4">
                <label htmlFor="cancel-reason" className="label">Reason for cancellation <span className="text-gray-400">(optional)</span></label>
                <textarea id="cancel-reason" value={reason} onChange={e => setReason(e.target.value)}
                  rows={2} className="input resize-none" placeholder="Plans changed, etc." />
              </div>
              {error && <div className="mt-3"><AlertError>{error}</AlertError></div>}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setConfirming(false)} className="btn-secondary flex-1">Keep Booking</button>
                <button onClick={handleCancel} disabled={loading} className="btn-danger flex-1">
                  {loading ? 'Cancelling…' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
