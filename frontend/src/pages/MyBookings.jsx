import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserAuth } from '../hooks/useUserAuth.js';
import { getMyBookings, submitFeedback } from '../utils/api.js';
import { formatAUDFromString, formatSydney } from '../utils/formatters.js';
import { AlertError } from '../components/Alert.jsx';

const STATUS_BADGE = {
  pending:    { label: 'Pending',     cls: 'bg-yellow-100 text-yellow-800' },
  confirmed:  { label: 'Confirmed',   cls: 'bg-blue-100 text-blue-800' },
  picked_up:  { label: 'Picked Up',   cls: 'bg-purple-100 text-purple-800' },
  completed:  { label: 'Completed',   cls: 'bg-green-100 text-green-800' },
  cancelled:  { label: 'Cancelled',   cls: 'bg-gray-100 text-gray-600' },
};

const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'picked_up']);

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className={`text-2xl leading-none transition-colors ${
            n <= (hovered || value) ? 'text-yellow-400' : 'text-gray-300'
          }`}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function FeedbackForm({ bookingId, onDone }) {
  const [rating,   setRating]   = useState(0);
  const [comment,  setComment]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) { setErr('Please select a star rating'); return; }
    setSaving(true);
    setErr('');
    try {
      await submitFeedback(bookingId, { rating, comment: comment.trim() || undefined });
      onDone();
    } catch (ex) {
      setErr(ex.message || 'Could not save feedback. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 border-t border-gray-100 pt-3 space-y-3">
      <p className="text-sm font-medium text-gray-700">How was your experience?</p>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Optional — tell us about your experience"
        rows={2}
        className="input text-sm"
      />
      {err && <p className="text-xs text-red-600">⚠ {err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary text-sm py-1.5 px-4">
          {saving ? 'Saving…' : 'Submit Feedback'}
        </button>
      </div>
    </form>
  );
}

function BookingCard({ booking, onFeedbackDone }) {
  const badge   = STATUS_BADGE[booking.status] || { label: booking.status, cls: 'bg-gray-100 text-gray-600' };
  const isActive    = ACTIVE_STATUSES.has(booking.status);
  const isCompleted = booking.status === 'completed';
  const hasFeedback = booking.has_feedback;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{booking.vehicle_name || 'Vehicle'}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Ref: {booking.ref}</p>
          {booking.start_utc && booking.end_utc && (
            <p className="text-sm text-gray-600 mt-1">
              {formatSydney(booking.start_utc)} → {formatSydney(booking.end_utc)}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          {booking.price_aud && (
            <p className="font-bold text-gray-900">{formatAUDFromString(booking.price_aud)}</p>
          )}
          {isActive && (
            <Link
              to={`/cancel/${booking.id}`}
              className="mt-2 inline-block text-xs text-red-600 hover:text-red-700 hover:underline"
            >
              Cancel booking
            </Link>
          )}
        </div>
      </div>

      {isCompleted && !hasFeedback && (
        <FeedbackForm bookingId={booking.id} onDone={onFeedbackDone} />
      )}

      {isCompleted && hasFeedback && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1.5 text-sm text-green-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Feedback submitted — thank you!
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyBookings() {
  const { user, loading: authLoading } = useUserAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login', { state: { from: '/my-bookings' } }); return; }
    load();
  }, [user, authLoading]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const r = await getMyBookings();
      setBookings(r.data || []);
    } catch (ex) {
      setError(ex.message || 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">Loading your bookings…</div>;
  }

  const active = bookings.filter(b => ACTIVE_STATUSES.has(b.status));
  const past   = bookings.filter(b => !ACTIVE_STATUSES.has(b.status));

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.name?.split(' ')[0]}</p>
        </div>
        <Link to="/availability" className="btn-primary text-sm">New Booking</Link>
      </div>

      {error && <div className="mb-6"><AlertError>{error}</AlertError></div>}

      {bookings.length === 0 && !error && (
        <div className="card p-10 text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="font-medium text-gray-700">No bookings yet</p>
          <p className="text-sm mt-1">Ready to get started?</p>
          <Link to="/availability" className="btn-primary inline-block mt-4">Browse Vehicles</Link>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
            Active Bookings
          </h2>
          <div className="space-y-3">
            {active.map(b => (
              <BookingCard key={b.id} booking={b} onFeedbackDone={load} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block"></span>
            Past Bookings
          </h2>
          <div className="space-y-3">
            {past.map(b => (
              <BookingCard key={b.id} booking={b} onFeedbackDone={load} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
