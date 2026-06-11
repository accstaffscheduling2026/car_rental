import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useUserAuth } from '../hooks/useUserAuth.js';
import { AlertError } from '../components/Alert.jsx';

export default function AuthPage() {
  const { login, register } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/my-bookings';

  const [tab, setTab]         = useState(location.state?.tab || 'login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');

  // Login fields
  const [loginEmail, setLoginEmail]     = useState('');
  const [loginPass,  setLoginPass]      = useState('');

  // Register fields
  const [regName,  setRegName]   = useState('');
  const [regEmail, setRegEmail]  = useState('');
  const [regPhone, setRegPhone]  = useState('');
  const [regPass,  setRegPass]   = useState('');
  const [regPass2, setRegPass2]  = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(loginEmail, loginPass);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed. Please check your email and password.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (regPass !== regPass2) { setError('Passwords do not match'); return; }
    setSubmitting(true);
    try {
      await register(regName, regEmail, regPhone, regPass);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {tab === 'login' ? 'Sign In to Your Account' : 'Create an Account'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {tab === 'login'
            ? 'Access your bookings and auto-fill your details when booking.'
            : 'Save your details for faster bookings and manage all reservations in one place.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-6">
        {[['login', 'Sign In'], ['register', 'Create Account']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4"><AlertError>{error}</AlertError></div>}

      {tab === 'login' ? (
        <form onSubmit={handleLogin} className="card p-6 space-y-4">
          <div>
            <label className="label">Email address</label>
            <input
              type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              className="input" placeholder="you@example.com" required autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)}
              className="input" placeholder="••••••••" required autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
          <p className="text-center text-sm text-gray-500">
            No account?{' '}
            <button type="button" onClick={() => { setTab('register'); setError(''); }}
              className="text-brand-600 hover:underline font-medium">
              Create one
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="card p-6 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input
              type="text" value={regName} onChange={e => setRegName(e.target.value)}
              className="input" placeholder="Jane Smith" required autoComplete="name"
            />
          </div>
          <div>
            <label className="label">Email address</label>
            <input
              type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
              className="input" placeholder="you@example.com" required autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Phone number <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)}
              className="input" placeholder="04XX XXX XXX" autoComplete="tel"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password" value={regPass} onChange={e => setRegPass(e.target.value)}
              className="input" placeholder="Min. 8 characters" required autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input
              type="password" value={regPass2} onChange={e => setRegPass2(e.target.value)}
              className="input" placeholder="Repeat password" required autoComplete="new-password"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating account…' : 'Create Account'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <button type="button" onClick={() => { setTab('login'); setError(''); }}
              className="text-brand-600 hover:underline font-medium">
              Sign in
            </button>
          </p>
        </form>
      )}

      <p className="text-center text-xs text-gray-400 mt-4">
        Prefer not to create an account?{' '}
        <Link to="/availability" className="text-brand-600 hover:underline">Continue as guest</Link>
      </p>
    </div>
  );
}
