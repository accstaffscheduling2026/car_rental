import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminGetReservations, adminLogout } from '../../utils/api.js';
import { formatSydney, formatAUDFromString, statusBadgeClass, paymentBadgeClass } from '../../utils/formatters.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    adminGetReservations({ from: today + 'T00:00:00Z' })
      .then(r => setReservations(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await adminLogout().catch(() => {});
    navigate('/admin/login');
  }

  const pending    = reservations.filter(r => r.status === 'pending').length;
  const confirmed  = reservations.filter(r => r.status === 'confirmed').length;
  const pickedUp   = reservations.filter(r => r.status === 'picked_up').length;
  const needsCall  = reservations.filter(r => r.payment_status === 'form_captured' && r.status === 'pending').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <button onClick={handleLogout} className="btn-secondary text-sm py-2">Sign Out</button>
      </div>

      {/* Nav */}
      <nav aria-label="Admin navigation" className="flex flex-wrap gap-3 mb-8">
        {[
          { to: '/admin/reservations', label: 'Reservations' },
          { to: '/admin/vehicles',     label: 'Vehicles' },
          { to: '/admin/reports',      label: 'Reports' },
        ].map(n => (
          <Link key={n.to} to={n.to} className="btn-secondary text-sm py-2 px-4">{n.label}</Link>
        ))}
      </nav>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Today's bookings",  val: reservations.length, color: 'blue' },
          { label: 'Pending confirm',   val: pending,             color: 'yellow' },
          { label: 'Confirmed',         val: confirmed,           color: 'green' },
          { label: 'Needs payment call',val: needsCall,           color: 'red' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{s.val}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's reservations */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Today &amp; Upcoming Reservations</h2>
          <Link to="/admin/reservations" className="text-sm text-brand-600 hover:text-brand-800 font-medium">View all →</Link>
        </div>
        {loading ? (
          <p className="px-6 py-8 text-gray-400 text-center">Loading…</p>
        ) : reservations.length === 0 ? (
          <p className="px-6 py-8 text-gray-400 text-center">No upcoming reservations.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Pick-up</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase sr-only">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reservations.slice(0, 10).map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900">{r.customer_name}</p>
                      <p className="text-gray-500 text-xs">{r.customer_phone}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{r.vehicle_name}</td>
                    <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{formatSydney(r.start_utc)}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusBadgeClass(r.status)}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${paymentBadgeClass(r.payment_status)}`}>
                        {r.payment_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <Link to={`/admin/reservations/${r.id}`} className="text-brand-600 hover:text-brand-800 font-medium text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
