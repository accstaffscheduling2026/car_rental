import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminGetReservations } from '../../utils/api.js';
import { formatSydney, statusBadgeClass, paymentBadgeClass } from '../../utils/formatters.js';

const STATUSES = ['', 'pending', 'confirmed', 'picked_up', 'completed', 'cancelled'];

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEmail,  setFilterEmail]  = useState('');

  useEffect(() => {
    load();
  }, [filterStatus, filterEmail]);

  async function load() {
    setLoading(true);
    const params = {};
    if (filterStatus) params.status = filterStatus;
    if (filterEmail)  params.email  = filterEmail;
    try {
      const r = await adminGetReservations(params);
      setReservations(r.data);
    } catch {}
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
        <Link to="/admin" className="btn-secondary text-sm py-2">← Dashboard</Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label htmlFor="filter-status" className="label text-xs">Status</label>
          <select id="filter-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input text-sm py-2">
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filter-email" className="label text-xs">Customer email</label>
          <input id="filter-email" type="email" value={filterEmail}
            onChange={e => setFilterEmail(e.target.value)}
            placeholder="search@example.com" className="input text-sm py-2" />
        </div>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="px-6 py-10 text-center text-gray-400">Loading…</p>
        ) : reservations.length === 0 ? (
          <p className="px-6 py-10 text-center text-gray-400">No reservations found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left bg-gray-50">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Pick-up</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase sr-only">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reservations.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-500">#{r.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.customer_name}</p>
                    <p className="text-gray-500 text-xs">{r.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.vehicle_name}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{formatSydney(r.start_utc)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {r.price_aud ? `AUD $${r.price_aud}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusBadgeClass(r.status)}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${paymentBadgeClass(r.payment_status)}`}>
                      {r.payment_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/reservations/${r.id}`} className="text-brand-600 hover:text-brand-800 text-xs font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
