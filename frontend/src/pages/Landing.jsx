import React from 'react';
import { useNavigate } from 'react-router-dom';

const PHONE = import.meta.env.VITE_FACILITY_PHONE || '(02) XXXX XXXX';

const VEHICLE_TYPES = [
  {
    type:  'wheelchair',
    label: 'Wheelchair Accessible',
    desc:  'Ramps, anchor points, hand controls',
    color: 'from-teal-500 to-cyan-600',
    light: 'bg-teal-50 border-teal-200 hover:border-teal-400',
    text:  'text-teal-700',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="4" r="1.5" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 10l1.5 5H15l2 4M9 10h6M9 10L7.5 7" />
        <circle cx="8" cy="20" r="1.5" strokeWidth={2} />
        <circle cx="17" cy="20" r="1.5" strokeWidth={2} />
      </svg>
    ),
  },
  {
    type:  'van',
    label: 'People Mover',
    desc:  'Up to 8 seats, easy entry',
    color: 'from-violet-500 to-purple-600',
    light: 'bg-violet-50 border-violet-200 hover:border-violet-400',
    text:  'text-violet-700',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l1-4h12l2 4M3 12v5h2m14 0h2v-5M3 12h16M7 17a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2z" />
      </svg>
    ),
  },
  {
    type:  'wagon',
    label: 'Station Wagon',
    desc:  '5 seats, large boot',
    color: 'from-amber-500 to-orange-500',
    light: 'bg-amber-50 border-amber-200 hover:border-amber-400',
    text:  'text-amber-700',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M5 17H3a1 1 0 01-1-1v-4l2-5h14l2 5v4a1 1 0 01-1 1h-2M5 17a2 2 0 104 0M15 17a2 2 0 104 0" />
      </svg>
    ),
  },
  {
    type:  'sedan',
    label: 'Sedan',
    desc:  '5 seats, comfortable',
    color: 'from-rose-500 to-pink-600',
    light: 'bg-rose-50 border-rose-200 hover:border-rose-400',
    text:  'text-rose-700',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 17H5a1 1 0 01-1-1v-3l2-5h12l2 5v3a1 1 0 01-1 1h-2M7 17a2 2 0 104 0M15 17a2 2 0 104 0" />
      </svg>
    ),
  },
];

const FEATURES = [
  {
    color: 'bg-indigo-500',
    bg:    'bg-indigo-50 border-indigo-100',
    title: 'Community Trusted',
    desc:  'The same fleet our elderly care residents rely on — trusted, insured, and safety-checked.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    color: 'bg-teal-500',
    bg:    'bg-teal-50 border-teal-100',
    title: 'Accessibility First',
    desc:  'Ramps, anchor points, hand controls — our fleet is built for every ability.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    color: 'bg-amber-500',
    bg:    'bg-amber-50 border-amber-100',
    title: 'Community Rates',
    desc:  'From AUD $22/hr GST inclusive. Special rates available with promo codes.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    color: 'bg-violet-500',
    bg:    'bg-violet-50 border-violet-100',
    title: 'Quick Online Booking',
    desc:  '5 minutes, no account needed. Book 24/7 with secure Stripe payment.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const STEPS = [
  { n: '1', title: 'Check Availability',  desc: 'Pick your dates and vehicle type',         color: 'from-indigo-500 to-brand-600' },
  { n: '2', title: 'Choose a Vehicle',    desc: 'Browse accessible options and pricing',     color: 'from-violet-500 to-purple-600' },
  { n: '3', title: 'Complete Booking',    desc: 'Enter details, pay securely in 5 minutes',  color: 'from-teal-500 to-cyan-600' },
  { n: '4', title: 'We Confirm',          desc: 'Our staff confirms within 2 hours',         color: 'from-amber-500 to-orange-500' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
      {/* ── Aurora Hero ── */}
      <section className="relative bg-gradient-hero text-white py-20 sm:py-28 px-4 overflow-hidden hero-glow" aria-labelledby="hero-heading">
        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-brand-600 opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-violet-600 opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-teal-600 opacity-5 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-brand-200 mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            NSW, Australia — Accessible Vehicle Hire
          </div>

          <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-5 tracking-tight">
            Special Need<br />
            <span className="text-transparent bg-clip-text" style={{backgroundImage:'linear-gradient(135deg,#a5b4fc,#e879f9,#67e8f9)'}}>
              Vehicle Rental
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-brand-200 mb-3 max-w-2xl mx-auto leading-relaxed">
            Our vehicles, available to you — safe, accessible hire for our community.
          </p>
          <p className="text-brand-300 text-base mb-10 max-w-xl mx-auto">
            The same fleet our elderly care residents rely on, available to hire when not in use.
            Trusted, insured, and ready.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/availability')}
              className="btn-primary text-base px-8 py-3.5 shadow-glow"
            >
              Check Availability
            </button>
            <a
              href={`tel:${PHONE.replace(/[\s()]/g, '')}`}
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold py-3.5 px-8 rounded-lg text-base hover:bg-white/10 hover:border-white/60 focus-visible:ring-2 focus-visible:ring-white transition-all duration-200 text-center min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call {PHONE}
            </a>
          </div>
          <p className="mt-5 text-brand-400 text-sm">Mon – Sat · 8:00 AM – 6:00 PM AEST</p>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none">
          <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="w-full h-10 fill-slate-50">
            <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" />
          </svg>
        </div>
      </section>

      {/* ── Fleet — rainbow cards ── */}
      <section className="py-16 px-4 bg-slate-50" aria-labelledby="fleet-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 id="fleet-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">Our Fleet</h2>
            <div className="section-divider" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {VEHICLE_TYPES.map(vt => (
              <button
                key={vt.type}
                onClick={() => navigate(`/availability?type=${vt.type}`)}
                className={`card-hover p-5 text-left border-2 ${vt.light} transition-all duration-200 group focus-visible:ring-2 focus-visible:ring-brand-500`}
                aria-label={`Browse ${vt.label} vehicles`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${vt.color} flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition-transform duration-200`}>
                  {vt.icon}
                </div>
                <span className="font-bold text-gray-900 text-sm block leading-tight">{vt.label}</span>
                <span className="text-xs text-gray-500 mt-1 block">{vt.desc}</span>
                <span className={`text-xs font-semibold ${vt.text} mt-2 block flex items-center gap-1`}>
                  Browse →
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us — coloured feature cards ── */}
      <section className="py-16 px-4 bg-white" aria-labelledby="features-heading">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 id="features-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">Why Choose Us</h2>
            <div className="section-divider" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className={`rounded-2xl border p-5 flex items-start gap-4 ${f.bg}`}>
                <div className={`w-9 h-9 rounded-xl ${f.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works — rainbow steps ── */}
      <section className="py-16 px-4 bg-slate-50" aria-labelledby="how-heading">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="how-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">How It Works</h2>
            <div className="section-divider" />
          </div>
          <ol className="grid sm:grid-cols-4 gap-6" role="list">
            {STEPS.map((s, i) => (
              <li key={s.n} className="text-center relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-5 left-3/4 w-1/2 h-px bg-gray-200 z-0" />
                )}
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${s.color} text-white font-bold text-lg flex items-center justify-center mx-auto mb-3 shadow-md relative z-10`}>
                  {s.n}
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative bg-gradient-cta text-white py-16 px-4 overflow-hidden" aria-labelledby="cta-heading">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 30% 50%, #818cf8 0%, transparent 50%), radial-gradient(circle at 70% 50%, #c084fc 0%, transparent 50%)'}} />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 id="cta-heading" className="text-2xl sm:text-3xl font-bold mb-3">Ready to Book?</h2>
          <p className="text-brand-200 mb-8 text-base">Browse available vehicles now, or call us to book by phone.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/availability')}
              className="bg-white text-brand-700 font-bold py-3 px-8 rounded-lg text-base hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-white transition-colors min-h-[44px] shadow-lg"
            >
              Check Availability
            </button>
            <a
              href={`tel:${PHONE.replace(/[\s()]/g, '')}`}
              className="border-2 border-white/40 text-white font-semibold py-3 px-8 rounded-lg text-base hover:bg-white/10 hover:border-white/70 focus-visible:ring-2 focus-visible:ring-white transition-all text-center min-h-[44px] flex items-center justify-center"
            >
              {PHONE}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
