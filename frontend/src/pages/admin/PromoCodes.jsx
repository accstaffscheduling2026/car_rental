import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  adminGetSettings, adminPatchSettings,
  adminGetPromoCodes, adminGeneratePromoCodes, adminDisablePromoCode,
} from '../../utils/api.js';
import { AlertError, AlertSuccess } from '../../components/Alert.jsx';
import { formatSydney } from '../../utils/formatters.js';

const STATUS_BADGE = {
  active:   'bg-green-100 text-green-800',
  used:     'bg-blue-100 text-blue-800',
  expired:  'bg-gray-100 text-gray-500',
  disabled: 'bg-red-100 text-red-700',
};

export default function PromoCodes() {
  const [settings, setSettings]         = useState({ special_rate_discount_percent: '0' });
  const [discountInput, setDiscountInput] = useState('');
  const [savingDiscount, setSavingDiscount] = useState(false);

  // Cancellation policy inputs
  const [fullHoursInput,   setFullHoursInput]   = useState('48');
  const [partialHoursInput, setPartialHoursInput] = useState('24');
  const [partialPctInput,  setPartialPctInput]  = useState('50');
  const [savingPolicy, setSavingPolicy]         = useState(false);

  const [codes, setCodes]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [filter, setFilter]     = useState('all');

  const [genCount, setGenCount]       = useState(1);
  const [genExpiry, setGenExpiry]     = useState('');
  const [generating, setGenerating]   = useState(false);
  const [showGenForm, setShowGenForm] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([adminGetSettings(), adminGetPromoCodes()]);
      setSettings(sRes.data);
      setDiscountInput(sRes.data.special_rate_discount_percent ?? '0');
      setFullHoursInput(sRes.data.cancel_full_refund_hours ?? '48');
      setPartialHoursInput(sRes.data.cancel_partial_hours ?? '24');
      setPartialPctInput(sRes.data.cancel_partial_pct ?? '50');
      setCodes(cRes.data);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePolicy(e) {
    e.preventDefault();
    const full    = parseInt(fullHoursInput, 10);
    const partial = parseInt(partialHoursInput, 10);
    const pct     = parseInt(partialPctInput, 10);
    if (isNaN(full) || full < 0)   { setError('Full-refund hours must be 0 or more'); return; }
    if (isNaN(partial) || partial < 0) { setError('Partial-refund hours must be 0 or more'); return; }
    if (partial >= full)           { setError('Partial-refund threshold must be less than full-refund threshold'); return; }
    if (isNaN(pct) || pct < 0 || pct > 100) { setError('Partial refund % must be between 0 and 100'); return; }
    setSavingPolicy(true);
    setError('');
    try {
      const res = await adminPatchSettings({
        cancel_full_refund_hours: full,
        cancel_partial_hours:     partial,
        cancel_partial_pct:       pct,
      });
      setSettings(res.data);
      setSuccess('Cancellation policy updated.');
    } catch (e) {
      setError(e.message || 'Failed to save policy');
    } finally {
      setSavingPolicy(false);
    }
  }

  async function handleSaveDiscount(e) {
    e.preventDefault();
    const val = parseInt(discountInput, 10);
    if (isNaN(val) || val < 0 || val > 100) {
      setError('Discount must be a number between 0 and 100');
      return;
    }
    setSavingDiscount(true);
    setError('');
    try {
      const res = await adminPatchSettings({ special_rate_discount_percent: val });
      setSettings(res.data);
      setSuccess('Special rate discount updated.');
    } catch (e) {
      setError(e.message || 'Failed to save setting');
    } finally {
      setSavingDiscount(false);
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    setError('');
    try {
      const body = { count: parseInt(genCount, 10) };
      if (genExpiry) body.expires_at = new Date(genExpiry).toISOString();
      await adminGeneratePromoCodes(body);
      setSuccess(`${genCount} promo code${genCount > 1 ? 's' : ''} generated.`);
      setShowGenForm(false);
      setGenCount(1);
      setGenExpiry('');
      loadAll();
    } catch (e) {
      setError(e.message || 'Failed to generate codes');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDisable(code) {
    if (!window.confirm(`Disable promo code ${code.code}?\nIt can no longer be used for bookings.`)) return;
    setError('');
    try {
      await adminDisablePromoCode(code.id);
      setSuccess(`Code ${code.code} disabled.`);
      loadAll();
    } catch (e) {
      setError(e.message || 'Failed to disable code');
    }
  }

  const filtered = filter === 'all' ? codes : codes.filter(c => c.status === filter);
  const counts   = codes.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});
  const discount = parseInt(settings.special_rate_discount_percent ?? '0', 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promo Codes &amp; Rates</h1>
          <p className="text-sm text-gray-500 mt-1">Configure the special rate discount and manage one-time promo codes for customers</p>
        </div>
      </div>

      {error   && <div className="mb-4"><AlertError>{error}</AlertError></div>}
      {success && <div className="mb-4 cursor-pointer" onClick={() => setSuccess('')}><AlertSuccess>{success}</AlertSuccess></div>}

      {/* ── Rate Configuration ── */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Daily Rate Configuration</h2>
        <p className="text-sm text-gray-500 mb-5">
          Two rate tiers apply to external customers. The <strong>General Rate</strong> is each vehicle's standard daily rate set in the Vehicles section.
          The <strong>Special Rate</strong> is a percentage discount off the general rate, unlocked by a one-time promo code.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">General Rate</p>
            <p className="text-base font-medium text-gray-900">Each vehicle's standard daily rate</p>
            <p className="text-xs text-gray-400 mt-1">Set per vehicle in the Vehicles section</p>
          </div>
          <div className="rounded-lg border border-brand-200 p-4 bg-brand-50">
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">Special Rate</p>
            <p className="text-2xl font-bold text-brand-700">
              {discount > 0 ? `${discount}% off` : 'No discount set'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Applied to daily rate when customer uses a promo code</p>
          </div>
        </div>

        <form onSubmit={handleSaveDiscount} className="flex items-end gap-3 max-w-sm">
          <div className="flex-1">
            <label htmlFor="discount-pct" className="label">Special rate discount (%)</label>
            <div className="relative">
              <input
                id="discount-pct"
                type="number"
                min="0"
                max="100"
                value={discountInput}
                onChange={e => setDiscountInput(e.target.value)}
                className="input pr-8"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
          </div>
          <button type="submit" disabled={savingDiscount} className="btn-primary whitespace-nowrap">
            {savingDiscount ? 'Saving…' : 'Save Rate'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">Set to 0 to disable the special rate entirely.</p>
      </div>

      {/* ── Cancellation Policy ── */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Cancellation Policy</h2>
        <p className="text-sm text-gray-500 mb-5">
          Controls how much is refunded based on how far in advance a paid booking is cancelled.
          Refunds are always subject to admin review before being processed.
        </p>

        {/* Visual summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-sm">
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="font-semibold text-green-800">Tier 1 — Full refund</p>
            <p className="text-green-700 mt-0.5">
              Cancelled more than <strong>{settings.cancel_full_refund_hours ?? 48}h</strong> before pick-up
            </p>
            <p className="text-green-600 text-xs mt-1">100% refunded</p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <p className="font-semibold text-yellow-800">Tier 2 — Partial refund</p>
            <p className="text-yellow-700 mt-0.5">
              Cancelled <strong>{settings.cancel_partial_hours ?? 24}h–{settings.cancel_full_refund_hours ?? 48}h</strong> before pick-up
            </p>
            <p className="text-yellow-600 text-xs mt-1">{settings.cancel_partial_pct ?? 50}% refunded</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="font-semibold text-red-800">Tier 3 — No refund</p>
            <p className="text-red-700 mt-0.5">
              Cancelled less than <strong>{settings.cancel_partial_hours ?? 24}h</strong> before pick-up
            </p>
            <p className="text-red-600 text-xs mt-1">0% refunded</p>
          </div>
        </div>

        <form onSubmit={handleSavePolicy}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="full-hours" className="label">Full-refund threshold (hours)</label>
              <input
                id="full-hours" type="number" min="1" max="8760"
                value={fullHoursInput}
                onChange={e => setFullHoursInput(e.target.value)}
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">Cancel before this → 100% refund</p>
            </div>
            <div>
              <label htmlFor="partial-hours" className="label">Partial-refund threshold (hours)</label>
              <input
                id="partial-hours" type="number" min="0" max="8760"
                value={partialHoursInput}
                onChange={e => setPartialHoursInput(e.target.value)}
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">Cancel between here and above → partial</p>
            </div>
            <div>
              <label htmlFor="partial-pct" className="label">Partial refund (%)</label>
              <div className="relative">
                <input
                  id="partial-pct" type="number" min="0" max="100"
                  value={partialPctInput}
                  onChange={e => setPartialPctInput(e.target.value)}
                  className="input pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">% of total hire cost refunded</p>
            </div>
          </div>
          <button type="submit" disabled={savingPolicy} className="btn-primary">
            {savingPolicy ? 'Saving…' : 'Save Policy'}
          </button>
        </form>
      </div>

      {/* ── Promo Codes ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Promo Codes</h2>
        <button
          onClick={() => setShowGenForm(v => !v)}
          className="btn-primary text-sm"
        >
          {showGenForm ? 'Cancel' : '+ Generate Codes'}
        </button>
      </div>

      {showGenForm && (
        <div className="card p-5 mb-6 border-brand-200 bg-brand-50">
          <h3 className="font-semibold text-gray-900 mb-4">Generate New Promo Codes</h3>
          <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="gen-count" className="label">Number of codes</label>
              <input
                id="gen-count"
                type="number"
                min="1"
                max="50"
                value={genCount}
                onChange={e => setGenCount(e.target.value)}
                className="input w-28"
              />
            </div>
            <div>
              <label htmlFor="gen-expiry" className="label">Expiry date <span className="font-normal text-gray-400">(optional)</span></label>
              <input
                id="gen-expiry"
                type="datetime-local"
                value={genExpiry}
                onChange={e => setGenExpiry(e.target.value)}
                className="input"
              />
            </div>
            <button type="submit" disabled={generating} className="btn-primary">
              {generating ? 'Generating…' : `Generate ${genCount} Code${genCount > 1 ? 's' : ''}`}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-3">
            Each code is one-time use. Generated codes grant the current special rate ({discount > 0 ? `${discount}% off` : 'no discount currently set'}).
            Leave expiry blank for codes that never expire.
          </p>
        </div>
      )}

      {/* Summary counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active',   key: 'active',   colour: 'green' },
          { label: 'Used',     key: 'used',     colour: 'blue'  },
          { label: 'Expired',  key: 'expired',  colour: 'gray'  },
          { label: 'Disabled', key: 'disabled', colour: 'red'   },
        ].map(({ label, key, colour }) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? 'all' : key)}
            className={`card p-4 text-left transition-colors ${filter === key ? 'ring-2 ring-brand-500' : 'hover:bg-gray-50'}`}
          >
            <p className="text-2xl font-bold text-gray-900">{counts[key] || 0}</p>
            <p className={`text-sm font-medium text-${colour}-700 mt-0.5`}>{label}</p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No {filter === 'all' ? '' : filter} promo codes found.
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="ml-2 text-brand-600 underline">Show all</button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Generated</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Expires</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Used</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900 tracking-wider">{c.code}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatSydney(c.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.expires_at ? formatSydney(c.expires_at) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[c.status] || 'bg-gray-100'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {c.status === 'used' && c.used_at ? (
                      <>
                        <p>{formatSydney(c.used_at)}</p>
                        {c.used_reservation_id && (
                          <Link to={`/admin/reservations/${c.used_reservation_id}`} className="text-brand-600 hover:underline">
                            Booking #{c.used_reservation_id}
                          </Link>
                        )}
                      </>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.status === 'active' && (
                      <button
                        onClick={() => handleDisable(c)}
                        className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50"
                      >
                        Disable
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
