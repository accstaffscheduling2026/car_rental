import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminGetReservation, adminPatchReservation } from '../../utils/api.js';
import { formatSydney, formatAUDFromString, statusBadgeClass, paymentBadgeClass, refNum } from '../../utils/formatters.js';
import { AlertSuccess, AlertError } from '../../components/Alert.jsx';

const STATUSES  = ['pending', 'confirmed', 'picked_up', 'completed', 'cancelled'];
const PAYMENTS  = ['none', 'form_captured', 'paid', 'refunded'];

export default function AdminReservationDetail() {
  const { id } = useParams();
  const [r, setR]           = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const [status,  setStatus]  = useState('');
  const [payment, setPayment] = useState('');
  const [notes,   setNotes]   = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await adminGetReservation(id);
      setR(res.data);
      setStatus(res.data.status);
      setPayment(res.data.payment_status);
      setNotes(res.data.notes || '');
    } catch { setError('Reservation not found.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminPatchReservation(id, { status, payment_status: payment, notes });
      setSuccess('Saved successfully.');
      load();
    } catch (err) {
      setError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="py-10 text-center text-gray-400">Loading…</p>;
  if (!r) return <div className="py-10"><AlertError>{error}</AlertError></div>;

  const ref = refNum(r.id, r.created_at);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/reservations" className="btn-secondary text-sm py-2">← Back</Link>
        <h1 className="text-xl font-bold text-gray-900">Reservation {ref}</h1>
      </div>

      {success && <div className="mb-4"><AlertSuccess>{success}</AlertSuccess></div>}
      {error   && <div className="mb-4"><AlertError>{error}</AlertError></div>}

      {/* Customer info */}
      <div className="card p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Customer</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-gray-500">Name</dt><dd className="font-medium">{r.customer_name}</dd></div>
          <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{r.customer_email}</dd></div>
          <div><dt className="text-gray-500">Phone</dt><dd className="font-medium">{r.customer_phone}</dd></div>
          <div><dt className="text-gray-500">Intended use</dt><dd>{r.intended_use || '—'}</dd></div>
        </dl>
      </div>

      {/* Booking info */}
      <div className="card p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Booking Details</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-gray-500">Vehicle</dt><dd className="font-medium">{r.vehicle_name}</dd></div>
          <div><dt className="text-gray-500">Created</dt><dd>{formatSydney(r.created_at)}</dd></div>
          <div><dt className="text-gray-500">Pick-up</dt><dd className="font-medium">{formatSydney(r.start_utc)}</dd></div>
          <div><dt className="text-gray-500">Return</dt><dd className="font-medium">{formatSydney(r.end_utc)}</dd></div>
          <div><dt className="text-gray-500">Total (incl. GST)</dt><dd className="font-bold">AUD ${r.price_aud}</dd></div>
          <div><dt className="text-gray-500">GST</dt><dd>AUD ${r.gst_aud}</dd></div>
          {r.card_last4 && <>
            <div><dt className="text-gray-500">Card (last 4)</dt><dd>•••• {r.card_last4}</dd></div>
            <div><dt className="text-gray-500">Expiry</dt><dd>{r.expiry_month}/{r.expiry_year}</dd></div>
            <div><dt className="text-gray-500">Cardholder</dt><dd>{r.cardholder_name}</dd></div>
          </>}
          <div><dt className="text-gray-500">Terms accepted</dt><dd>{r.terms_accepted ? `Yes — ${formatSydney(r.terms_accepted_at)}` : 'No'}</dd></div>
        </dl>
      </div>

      {/* Update */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Update Reservation</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="upd-status" className="label text-xs">Booking Status</label>
            <select id="upd-status" value={status} onChange={e => setStatus(e.target.value)} className="input text-sm">
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="upd-payment" className="label text-xs">Payment Status</label>
            <select id="upd-payment" value={payment} onChange={e => setPayment(e.target.value)} className="input text-sm">
              {PAYMENTS.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="upd-notes" className="label text-xs">Staff Notes</label>
          <textarea id="upd-notes" value={notes} onChange={e => setNotes(e.target.value)}
            rows={3} className="input resize-none text-sm" />
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
