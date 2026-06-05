import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  adminGetEmployees, adminCreateEmployee,
  adminPatchEmployee, adminDeleteEmployee, adminGenerateCode,
} from '../../utils/api.js';
import { AlertSuccess, AlertError, AlertInfo } from '../../components/Alert.jsx';

const STATUS_BADGE = {
  active:   'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-500',
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  // New employee form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ emp_id: '', name: '', email: '', phone: '' });
  const [formErr, setFormErr]   = useState('');
  const [saving, setSaving]     = useState(false);

  // Generated code display
  const [generatedCode, setGeneratedCode]     = useState(null);
  const [generatingFor, setGeneratingFor]     = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await adminGetEmployees();
      setEmployees(res.data);
    } catch (e) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.emp_id || !form.name || !form.email) {
      setFormErr('Employee ID, name and email are required');
      return;
    }
    setSaving(true);
    setFormErr('');
    try {
      await adminCreateEmployee(form);
      setSuccess(`Employee ${form.name} added.`);
      setShowForm(false);
      setForm({ emp_id: '', name: '', email: '', phone: '' });
      load();
    } catch (e) {
      setFormErr(e.message || 'Failed to create employee');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(emp) {
    if (!window.confirm(`Deactivate ${emp.name}? Their active codes will still work until used or expired.`)) return;
    try {
      await adminDeleteEmployee(emp.id);
      setSuccess(`${emp.name} deactivated.`);
      load();
    } catch (e) {
      setError(e.message || 'Failed to deactivate');
    }
  }

  async function handleGenerateCode(emp) {
    if (!window.confirm(`Generate a booking code for ${emp.name} (${emp.emp_id})?\n\nThis will send the code to ${emp.email} immediately.`)) return;
    setGeneratingFor(emp.id);
    setGeneratedCode(null);
    try {
      const res = await adminGenerateCode(emp.id);
      setGeneratedCode({ code: res.code, employee: emp.name, email: emp.email });
      setSuccess(`Code generated and emailed to ${emp.email}`);
      load();
    } catch (e) {
      setError(e.message || 'Failed to generate code');
    } finally {
      setGeneratingFor(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff and generate booking codes for free hire</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/codes" className="btn-secondary text-sm">View All Codes</Link>
          <button onClick={() => { setShowForm(true); setFormErr(''); }} className="btn-primary text-sm">
            + Add Employee
          </button>
        </div>
      </div>

      {error   && <div className="mb-4"><AlertError>{error}</AlertError></div>}
      {success && <div className="mb-4"><AlertSuccess>{success}</AlertSuccess></div>}

      {/* Generated code banner */}
      {generatedCode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="font-semibold text-blue-900 mb-1">Code generated for {generatedCode.employee}</p>
          <p className="font-mono text-2xl font-bold tracking-widest text-blue-800 my-2">{generatedCode.code}</p>
          <p className="text-sm text-blue-700">Emailed to {generatedCode.email} — valid for 24 hours, single use only.</p>
          <button onClick={() => setGeneratedCode(null)} className="mt-2 text-xs text-blue-500 underline">Dismiss</button>
        </div>
      )}

      {/* Add employee form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Employee</h2>
          {formErr && <div className="mb-3"><AlertError>{formErr}</AlertError></div>}
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Employee ID <span className="text-red-500">*</span></label>
              <input className="input" value={form.emp_id} onChange={e => setForm({...form, emp_id: e.target.value})}
                placeholder="e.g. EMP001" />
            </div>
            <div>
              <label className="label">Full Name <span className="text-red-500">*</span></label>
              <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder="e.g. Jane Smith" />
            </div>
            <div>
              <label className="label">Email Address <span className="text-red-500">*</span></label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                placeholder="jane@example.com" />
            </div>
            <div>
              <label className="label">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
              <input className="input" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                placeholder="0412 345 678" />
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Add Employee'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employees table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : employees.length === 0 ? (
        <AlertInfo>No employees yet. Add an employee above to start generating booking codes.</AlertInfo>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Employee ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{emp.emp_id}</td>
                  <td className="px-4 py-3 text-gray-900">{emp.name}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.email}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[emp.status] || 'bg-gray-100 text-gray-600'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {emp.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleGenerateCode(emp)}
                          disabled={generatingFor === emp.id}
                          className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded hover:bg-brand-700 disabled:opacity-50"
                        >
                          {generatingFor === emp.id ? 'Generating…' : 'Generate Code'}
                        </button>
                        <button
                          onClick={() => handleDeactivate(emp)}
                          className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50"
                        >
                          Deactivate
                        </button>
                      </>
                    )}
                    {emp.status === 'inactive' && (
                      <span className="text-xs text-gray-400">Inactive</span>
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
