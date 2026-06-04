import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AdminReports() {
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');

  function downloadCsv() {
    const params = new URLSearchParams();
    if (from) params.set('from', new Date(from).toISOString());
    if (to)   params.set('to',   new Date(to).toISOString());
    window.location.href = `/api/v1/admin/reports/csv${params.toString() ? '?' + params.toString() : ''}`;
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <Link to="/admin" className="btn-secondary text-sm py-2">← Dashboard</Link>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Export Reservations (CSV)</h2>
        <p className="text-sm text-gray-600 mb-4">Download a CSV of all reservations for accounting, BAS reporting, and KPI tracking.</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="rpt-from" className="label text-xs">From date</label>
            <input id="rpt-from" type="date" value={from} onChange={e => setFrom(e.target.value)} className="input text-sm" />
          </div>
          <div>
            <label htmlFor="rpt-to" className="label text-xs">To date</label>
            <input id="rpt-to" type="date" value={to} onChange={e => setTo(e.target.value)} className="input text-sm" />
          </div>
        </div>
        <button onClick={downloadCsv} className="btn-primary text-sm py-2">
          Download CSV
        </button>
        <p className="text-xs text-gray-400 mt-3">Leave dates blank to export all reservations. CSV includes: ID, customer, vehicle, dates, status, payment, price (AUD), GST. Suitable for BAS reporting.</p>
      </div>

      <div className="card p-6 mt-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Audit Log</h2>
        <p className="text-sm text-gray-600 mb-4">View a log of all create, update, and cancel actions on reservations and vehicles.</p>
        <a href="/api/v1/admin/audit" target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2 inline-flex">
          View Audit Log (JSON)
        </a>
      </div>
    </div>
  );
}
