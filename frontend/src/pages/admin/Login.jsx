import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../utils/api.js';
import { AlertError } from '../../components/Alert.jsx';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminLogin({ username, password });
      navigate('/admin/dashboard');
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Admin Login</h1>
      <div className="card p-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="admin-user" className="label">Username</label>
            <input id="admin-user" type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="input" autoComplete="username" aria-required="true" />
          </div>
          <div>
            <label htmlFor="admin-pass" className="label">Password</label>
            <input id="admin-pass" type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input" autoComplete="current-password" aria-required="true" />
          </div>
          {error && <AlertError>{error}</AlertError>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
