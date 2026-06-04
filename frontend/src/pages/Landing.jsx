import React from 'react';
import { useNavigate } from 'react-router-dom';

const PHONE = import.meta.env.VITE_FACILITY_PHONE || '(02) XXXX XXXX';

const FEATURES = [
  { icon: '✔', text: 'Trusted care-sector operator — the same fleet our residents rely on' },
  { icon: '♿', text: 'Accessibility-first fleet — ramps, anchor points, hand controls available' },
  { icon: '$', text: 'Community rates — from AUD $22/hr, GST inclusive' },
  { icon: '⏱', text: 'Easy online booking — 5 minutes, no account needed' },
];

const VEHICLE_TYPES = [
  { type: 'wheelchair', label: 'Wheelchair Accessible', emoji: '♿', desc: 'Ramps, anchor points, hand controls' },
  { type: 'van',        label: 'People Mover',          emoji: '🚐', desc: 'Up to 8 seats, easy entry' },
  { type: 'wagon',      label: 'Station Wagon',         emoji: '🚗', desc: '5 seats, large boot' },
  { type: 'sedan',      label: 'Sedan',                 emoji: '🚘', desc: '5 seats, comfortable' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-800 to-brand-600 text-white py-16 px-4" aria-labelledby="hero-heading">
        <div className="max-w-4xl mx-auto text-center">
          <h1 id="hero-heading" className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
            Special Need Vehicle Rental
          </h1>
          <p className="text-xl text-brand-100 mb-3 max-w-2xl mx-auto">
            Our vehicles, available to you — safe, accessible hire for our community.
          </p>
          <p className="text-brand-200 text-base mb-8 max-w-xl mx-auto">
            These are the same vehicles our elderly care residents rely on, available to hire when not in use.
            Trusted, insured, and ready for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/availability')}
              className="bg-white text-brand-700 font-bold py-3 px-8 rounded-lg text-lg hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700 transition-colors min-h-[44px]"
            >
              Check Availability
            </button>
            <a
              href={`tel:${PHONE.replace(/[\s()]/g, '')}`}
              className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg text-lg hover:bg-white hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-white transition-colors text-center min-h-[44px] flex items-center justify-center"
            >
              Or call us: {PHONE}
            </a>
          </div>
          <p className="mt-4 text-brand-200 text-sm">Mon – Sat, 8:00 AM – 6:00 PM AEST</p>
        </div>
      </section>

      {/* Vehicle types */}
      <section className="py-12 px-4 bg-white" aria-labelledby="fleet-heading">
        <div className="max-w-5xl mx-auto">
          <h2 id="fleet-heading" className="text-2xl font-bold text-gray-900 text-center mb-8">Our Fleet</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {VEHICLE_TYPES.map(vt => (
              <button
                key={vt.type}
                onClick={() => navigate(`/availability?type=${vt.type}`)}
                className="card p-4 text-center hover:shadow-md hover:border-brand-300 transition-all focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
                aria-label={`Browse ${vt.label} vehicles`}
              >
                <span className="text-3xl block mb-2" aria-hidden="true">{vt.emoji}</span>
                <span className="font-semibold text-gray-900 text-sm block">{vt.label}</span>
                <span className="text-xs text-gray-500 mt-1 block">{vt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trust features */}
      <section className="py-12 px-4 bg-gray-50" aria-labelledby="features-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="features-heading" className="text-2xl font-bold text-gray-900 text-center mb-8">
            Why Choose Us
          </h2>
          <ul className="grid sm:grid-cols-2 gap-4" role="list">
            {FEATURES.map(f => (
              <li key={f.text} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <span className="text-brand-600 font-bold text-lg flex-shrink-0 w-6" aria-hidden="true">{f.icon}</span>
                <span className="text-gray-700">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 px-4 bg-white" aria-labelledby="how-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="how-heading" className="text-2xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
          <ol className="grid sm:grid-cols-4 gap-6" role="list">
            {[
              { n: '1', t: 'Check Availability', d: 'Select your dates and vehicle type' },
              { n: '2', t: 'Choose a Vehicle',   d: 'Browse accessible options and pricing' },
              { n: '3', t: 'Complete Booking',   d: 'Enter your details and submit in 5 minutes' },
              { n: '4', t: 'Staff Will Call You', d: 'We confirm payment and your booking within 2 hours' },
            ].map(s => (
              <li key={s.n} className="text-center">
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-3" aria-hidden="true">
                  {s.n}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{s.t}</h3>
                <p className="text-sm text-gray-500">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-12 px-4 bg-brand-700 text-white" aria-labelledby="cta-heading">
        <div className="max-w-2xl mx-auto text-center">
          <h2 id="cta-heading" className="text-2xl font-bold mb-4">Ready to Book?</h2>
          <p className="text-brand-100 mb-6">
            Browse available vehicles now, or call us to book by phone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/availability')}
              className="bg-white text-brand-700 font-bold py-3 px-8 rounded-lg hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-white transition-colors min-h-[44px]"
            >
              Check Availability
            </button>
            <a
              href={`tel:${PHONE.replace(/[\s()]/g, '')}`}
              className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-white transition-colors text-center min-h-[44px] flex items-center justify-center"
            >
              {PHONE}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
