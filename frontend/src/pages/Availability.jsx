import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAvailability } from '../utils/api.js';
import VehicleCard from '../components/VehicleCard.jsx';
import { AlertError, AlertWarning } from '../components/Alert.jsx';

const TYPES = [
  { value: '',            label: 'All Types' },
  { value: 'wheelchair',  label: 'Wheelchair Accessible' },
  { value: 'van',         label: 'People Mover' },
  { value: 'wagon',       label: 'Station Wagon' },
  { value: 'sedan',       label: 'Sedan' },
];

function localNow(offsetHours = 2) {
  const d = new Date(Date.now() + offsetHours * 3600000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const min = String(Math.ceil(d.getUTCMinutes() / 30) * 30 % 60).padStart(2, '0');
  const hAdj = String(d.getUTCHours() + (d.getUTCMinutes() > 30 ? 1 : 0)).padStart(2, '0');
  return `${y}-${m}-${day}T${hAdj}:${min}`;
}

function toUtcIso(localStr) {
  if (!localStr) return '';
  return new Date(localStr).toISOString();
}

export default function Availability() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resultsRef = useRef(null);

  const defaultStart = localNow(2);
  const defaultEnd   = localNow(26);

  const [start, setStart] = useState(searchParams.get('start') || defaultStart);
  const [end,   setEnd]   = useState(searchParams.get('end')   || defaultEnd);
  const [type,  setType]  = useState(searchParams.get('type')  || '');

  const [results, setResults]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const [validErr, setValidErr] = useState({});

  useEffect(() => {
    if (searchParams.get('start') && searchParams.get('end')) {
      handleSearch(searchParams.get('start'), searchParams.get('end'), searchParams.get('type') || '');
    }
  }, []);

  function validate() {
    const errs = {};
    const s = new Date(start);
    const e = new Date(end);
    const now = new Date();
    if (!start) errs.start = 'Please select a pick-up date and time';
    else if (s < new Date(now.getTime() + 60 * 60 * 1000)) errs.start = 'Pick-up time must be at least 1 hour from now';
    if (!end) errs.end = 'Please select a return date and time';
    else if (e <= s) errs.end = 'Return time must be after pick-up time';
    else if (e - s < 3600000) errs.end = 'Minimum rental duration is 1 hour';
    return errs;
  }

  async function handleSearch(s = start, e = end, t = type) {
    const errs = validate();
    setValidErr(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setError('');
    setResults(null);
    try {
      const params = { start: toUtcIso(s), end: toUtcIso(e) };
      if (t) params.type = t;
      const data = await getAvailability(params);
      setResults(data);
      setTimeout(() => resultsRef.current?.focus(), 100);
    } catch (err) {
      setError(err.message || 'Failed to check availability. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const searchParams2 = { start: toUtcIso(start), end: toUtcIso(end) };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Find a Vehicle</h1>

      {/* Search panel */}
      <section className="card p-6 mb-8" aria-labelledby="search-heading">
        <h2 id="search-heading" className="text-lg font-semibold text-gray-800 mb-4">Select your dates</h2>

        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800 mb-4 flex items-center gap-2">
          <svg aria-hidden="true" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          All times shown in <strong className="ml-1">Sydney time (AEST/AEDT)</strong>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="start" className="label">Pick-up date &amp; time <span className="text-red-500" aria-label="required">*</span></label>
            <input
              id="start" type="datetime-local" value={start} onChange={e => setStart(e.target.value)}
              min={localNow(1)}
              className={`input ${validErr.start ? 'input-error' : ''}`}
              aria-required="true"
              aria-describedby={validErr.start ? 'start-err' : undefined}
            />
            {validErr.start && <p id="start-err" className="error-text" role="alert">⚠ {validErr.start}</p>}
          </div>
          <div>
            <label htmlFor="end" className="label">Return date &amp; time <span className="text-red-500" aria-label="required">*</span></label>
            <input
              id="end" type="datetime-local" value={end} onChange={e => setEnd(e.target.value)}
              min={start || localNow(2)}
              className={`input ${validErr.end ? 'input-error' : ''}`}
              aria-required="true"
              aria-describedby={validErr.end ? 'end-err' : undefined}
            />
            {validErr.end && <p id="end-err" className="error-text" role="alert">⚠ {validErr.end}</p>}
          </div>
          <div>
            <label htmlFor="type" className="label">Vehicle type</label>
            <select id="type" value={type} onChange={e => setType(e.target.value)} className="input">
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={() => handleSearch()}
          disabled={loading}
          className="btn-primary mt-4"
          aria-label="Search for available vehicles"
        >
          {loading ? 'Searching…' : 'Search Available Vehicles'}
        </button>
      </section>

      {/* Error */}
      {error && <div className="mb-6"><AlertError>{error}</AlertError></div>}

      {/* Results */}
      {results && (
        <section aria-labelledby="results-heading">
          <h2
            id="results-heading"
            ref={resultsRef}
            tabIndex={-1}
            className="text-xl font-bold text-gray-900 mb-4 outline-none"
          >
            {results.available.length > 0
              ? `${results.available.length} vehicle${results.available.length !== 1 ? 's' : ''} available`
              : 'No vehicles available'}
          </h2>

          {results.available.length === 0 && (
            <div className="mb-6">
              <AlertWarning>
                No vehicles are available for your selected time. Try a different date or vehicle type.
              </AlertWarning>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setStart(localNow(26)); setEnd(localNow(50)); handleSearch(localNow(26), localNow(50), type); }}
                  className="btn-secondary text-sm py-2">
                  Try tomorrow
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {results.available.map(v => (
              <VehicleCard key={v.id} vehicle={v} searchParams={searchParams2} showPrice />
            ))}
          </div>

          {results.unavailable.length > 0 && (
            <div className="mt-8">
              <h3 className="text-base font-semibold text-gray-500 mb-3">
                Unavailable for your selected time ({results.unavailable.length})
              </h3>
              <div className="flex flex-col gap-3 opacity-60">
                {results.unavailable.map(v => (
                  <div key={v.id} className="card p-4 flex items-center gap-4 cursor-not-allowed">
                    <div className="flex-1">
                      <p className="font-medium text-gray-700">{v.name}</p>
                      <p className="text-sm text-red-600">Already booked for this period</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
