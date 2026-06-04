import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminGetVehicles, adminCreateVehicle, adminPatchVehicle, adminDeleteVehicle } from '../../utils/api.js';
import { AlertSuccess, AlertError } from '../../components/Alert.jsx';

const TYPES = ['sedan', 'wagon', 'van', 'wheelchair'];
const STATUSES = ['active', 'maintenance', 'retired'];

const EMPTY = { name: '', type: 'sedan', capacity: 5, plate: '', accessibility_notes: '',
                hourly_rate_cents: 2200, daily_rate_cents: 13200, buffer_minutes: 30,
                status: 'active', maintenance_until: '' };

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null); // vehicle id being edited
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  async function load() {
    setLoading(true);
    try { const r = await adminGetVehicles(); setVehicles(r.data); }
    catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
    setSuccess('');
    setError('');
  }

  function openEdit(v) {
    setEditing(v.id);
    setForm({
      name: v.name, type: v.type, capacity: v.capacity, plate: v.plate || '',
      accessibility_notes: v.accessibility_notes || '',
      hourly_rate_cents: v.hourly_rate_cents, daily_rate_cents: v.daily_rate_cents,
      buffer_minutes: v.buffer_minutes, status: v.status,
      maintenance_until: v.maintenance_until ? v.maintenance_until.slice(0, 16) : '',
    });
    setShowForm(true);
    setSuccess('');
    setError('');
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        hourly_rate_cents: Number(form.hourly_rate_cents),
        daily_rate_cents: Number(form.daily_rate_cents),
        buffer_minutes: Number(form.buffer_minutes),
        maintenance_until: form.maintenance_until
          ? new Date(form.maintenance_until).toISOString()
          : null,
        plate: form.plate || undefined,
        accessibility_notes: form.accessibility_notes || undefined,
      };
      if (editing) {
        await adminPatchVehicle(editing, payload);
        setSuccess('Vehicle updated.');
      } else {
        await adminCreateVehicle(payload);
        setSuccess('Vehicle created.');
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRetire(id) {
    if (!window.confirm('Retire this vehicle? It will no longer be bookable.')) return;
    try {
      await adminDeleteVehicle(id);
      setSuccess('Vehicle retired.');
      load();
    } catch (err) {
      setError(err.message || 'Failed to retire vehicle.');
    }
  }

  const fi = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
        <div className="flex gap-3">
          <Link to="/admin" className="btn-secondary text-sm py-2">← Dashboard</Link>
          <button onClick={openNew} className="btn-primary text-sm py-2">+ Add Vehicle</button>
        </div>
      </div>

      {success && <div className="mb-4"><AlertSuccess>{success}</AlertSuccess></div>}
      {error   && <div className="mb-4"><AlertError>{error}</AlertError></div>}

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label text-xs">Vehicle Name *</label>
              <input value={form.name} onChange={fi('name')} className="input text-sm" placeholder="e.g. Toyota HiAce Wheelchair Van 1" />
            </div>
            <div>
              <label className="label text-xs">Type *</label>
              <select value={form.type} onChange={fi('type')} className="input text-sm">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Status *</label>
              <select value={form.status} onChange={fi('status')} className="input text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Capacity (seats) *</label>
              <input type="number" min={1} max={20} value={form.capacity} onChange={fi('capacity')} className="input text-sm" />
            </div>
            <div>
              <label className="label text-xs">Plate</label>
              <input value={form.plate} onChange={fi('plate')} className="input text-sm" placeholder="e.g. WAC001" />
            </div>
            <div>
              <label className="label text-xs">Hourly rate (cents) *</label>
              <input type="number" min={0} value={form.hourly_rate_cents} onChange={fi('hourly_rate_cents')} className="input text-sm" />
              <p className="text-xs text-gray-400 mt-0.5">AUD ${(form.hourly_rate_cents / 100).toFixed(2)}/hr</p>
            </div>
            <div>
              <label className="label text-xs">Daily rate (cents) *</label>
              <input type="number" min={0} value={form.daily_rate_cents} onChange={fi('daily_rate_cents')} className="input text-sm" />
              <p className="text-xs text-gray-400 mt-0.5">AUD ${(form.daily_rate_cents / 100).toFixed(2)}/day</p>
            </div>
            <div>
              <label className="label text-xs">Buffer time (minutes)</label>
              <input type="number" min={0} value={form.buffer_minutes} onChange={fi('buffer_minutes')} className="input text-sm" />
            </div>
            {form.status === 'maintenance' && (
              <div>
                <label className="label text-xs">Maintenance until</label>
                <input type="datetime-local" value={form.maintenance_until} onChange={fi('maintenance_until')} className="input text-sm" />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="label text-xs">Accessibility notes</label>
              <textarea value={form.accessibility_notes} onChange={fi('accessibility_notes')} rows={2} className="input text-sm resize-none"
                placeholder="e.g. Rear ramp, 2 anchor points, hand controls" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2">
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Vehicle'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <p className="px-6 py-10 text-center text-gray-400">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['ID', 'Name', 'Type', 'Capacity', 'Hourly', 'Daily', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vehicles.map(v => (
                <tr key={v.id} className={`hover:bg-gray-50 ${v.status === 'retired' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-gray-500">#{v.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{v.type}</td>
                  <td className="px-4 py-3 text-gray-600">{v.capacity}</td>
                  <td className="px-4 py-3 text-gray-600">${(v.hourly_rate_cents/100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">${(v.daily_rate_cents/100).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize
                      ${v.status === 'active' ? 'bg-green-100 text-green-800'
                      : v.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-500'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(v)} className="text-brand-600 hover:text-brand-800 text-xs font-medium">Edit</button>
                    {v.status !== 'retired' && (
                      <button onClick={() => handleRetire(v.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Retire</button>
                    )}
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
