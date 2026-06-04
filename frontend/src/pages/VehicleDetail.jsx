import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { getVehicle } from '../utils/api.js';
import { formatAUDFromString, formatSydney, vehicleTypeLabel } from '../utils/formatters.js';
import { AlertError } from '../components/Alert.jsx';

const ADDONS = [
  { id: 'child_seat',   label: 'Child Booster Seat',     price: 5.50 },
  { id: 'gps',          label: 'GPS Navigation Unit',     price: 5.50 },
  { id: 'extended_hrs', label: 'Extended Hours Pickup',   price: 11.00 },
];

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);

  const start = searchParams.get('start');
  const end   = searchParams.get('end');

  useEffect(() => {
    getVehicle(id)
      .then(r => setVehicle(r.data))
      .catch(() => setError('Vehicle not found.'));
  }, [id]);

  function toggleAddon(addonId) {
    setSelectedAddons(prev =>
      prev.includes(addonId) ? prev.filter(a => a !== addonId) : [...prev, addonId]
    );
  }

  function handleProceed() {
    const qs = new URLSearchParams({
      vehicle_id: id,
      ...(start && { start }),
      ...(end   && { end   }),
      addons: selectedAddons.join(','),
    });
    navigate(`/booking?${qs.toString()}`);
  }

  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <AlertError>{error}</AlertError>
      <Link to="/availability" className="btn-secondary mt-4 inline-flex">← Back to Search</Link>
    </div>
  );

  if (!vehicle) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500" aria-live="polite" aria-label="Loading vehicle details">
      Loading…
    </div>
  );

  const hourlyRate = parseFloat(vehicle.hourly_rate_aud);
  const dailyRate  = parseFloat(vehicle.daily_rate_aud);

  // Rough price estimate if dates given
  let durationLabel = '';
  let estimatedTotal = null;
  if (start && end) {
    const ms = new Date(end) - new Date(start);
    const hours = ms / 3600000;
    const days = Math.floor(hours / 24);
    const remHours = Math.ceil(hours % 24);
    const total = days * dailyRate + remHours * hourlyRate;
    estimatedTotal = total;
    durationLabel = days > 0
      ? `${days} day${days !== 1 ? 's' : ''}${remHours > 0 ? ` ${remHours}hr` : ''}`
      : `${Math.ceil(hours)} hour${Math.ceil(hours) !== 1 ? 's' : ''}`;
  }

  const addonTotal = selectedAddons.reduce((sum, id) => {
    const a = ADDONS.find(a => a.id === id);
    return sum + (a ? a.price : 0);
  }, 0);

  const grandTotal = estimatedTotal !== null ? estimatedTotal + addonTotal : null;
  const gstAmount  = grandTotal !== null ? grandTotal * 10 / 110 : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to={start && end ? `/availability?start=${start}&end=${end}` : '/availability'}
        className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 font-medium text-sm mb-6 focus-visible:ring-2 focus-visible:ring-brand-500 rounded">
        ← Back to results
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo */}
          <div className="card overflow-hidden">
            <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
              {vehicle.photos && vehicle.photos[0]
                ? <img src={vehicle.photos[0]} alt={`${vehicle.name}`} className="w-full h-full object-cover" />
                : <span className="text-6xl" aria-hidden="true">{vehicle.type === 'wheelchair' ? '♿' : vehicle.type === 'van' ? '🚐' : '🚗'}</span>
              }
            </div>
          </div>

          {/* Details */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{vehicle.name}</h1>
              <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex-shrink-0">
                {vehicleTypeLabel(vehicle.type)}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500 font-medium">Seating</dt>
                <dd className="text-gray-900 font-semibold">{vehicle.capacity} seats</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Buffer time</dt>
                <dd className="text-gray-900 font-semibold">{vehicle.buffer_minutes} min between bookings</dd>
              </div>
            </dl>
            {vehicle.accessibility_notes && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <h2 className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-1">
                  <span aria-hidden="true">♿</span> Accessibility Features
                </h2>
                <p className="text-sm text-blue-800">{vehicle.accessibility_notes}</p>
              </div>
            )}
          </div>

          {/* Add-ons */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add-On Services</h2>
            <ul className="space-y-3" role="list">
              {ADDONS.map(a => (
                <li key={a.id}>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedAddons.includes(a.id)}
                      onChange={() => toggleAddon(a.id)}
                      className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                      aria-label={`Add ${a.label} — AUD $${a.price.toFixed(2)}/day`}
                    />
                    <span className="flex-1 text-sm text-gray-700 group-hover:text-gray-900">{a.label}</span>
                    <span className="text-sm font-medium text-gray-700">AUD ${a.price.toFixed(2)}/day</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Booking sidebar */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Price Summary</h2>

            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Hourly rate</dt>
                <dd className="font-medium">{formatAUDFromString(vehicle.hourly_rate_aud)}/hr</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Daily rate</dt>
                <dd className="font-medium">{formatAUDFromString(vehicle.daily_rate_aud)}/day</dd>
              </div>

              {start && end && (
                <>
                  <hr className="my-2 border-gray-100" />
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Duration</dt>
                    <dd className="font-medium">{durationLabel}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Rental total</dt>
                    <dd className="font-medium">{formatAUDFromString(estimatedTotal.toFixed(2))}</dd>
                  </div>
                  {addonTotal > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Add-ons</dt>
                      <dd className="font-medium">{formatAUDFromString(addonTotal.toFixed(2))}</dd>
                    </div>
                  )}
                  <hr className="my-2 border-gray-200" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <dt>GST (10%) included</dt>
                    <dd>{formatAUDFromString(gstAmount.toFixed(2))}</dd>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900">
                    <dt>Total (incl. GST)</dt>
                    <dd>{formatAUDFromString(grandTotal.toFixed(2))}</dd>
                  </div>
                </>
              )}
            </dl>

            {start && end ? (
              <>
                <p className="text-xs text-gray-500 mt-3 mb-4">
                  Pick-up: {formatSydney(start)}<br />
                  Return: {formatSydney(end)}
                </p>
                <button onClick={handleProceed} className="btn-primary w-full">
                  Proceed to Booking
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500 mt-3 mb-4">Select dates to see total price</p>
                <Link to={`/availability`} className="btn-secondary w-full text-center block">
                  Select Dates First
                </Link>
              </>
            )}

            <p className="text-xs text-gray-400 mt-3 text-center">
              Cancellation policy: free cancellation &gt;48 hrs before pickup
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
