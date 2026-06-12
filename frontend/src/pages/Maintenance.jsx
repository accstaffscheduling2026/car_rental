import React from 'react';
import { useSiteConfig } from '../hooks/useSiteConfig.jsx';

export default function Maintenance() {
  const config = useSiteConfig();

  return (
    <div className="min-h-screen bg-gradient-header flex flex-col items-center justify-center px-4 text-center">
      {/* Decorative orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-brand-600 opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-violet-600 opacity-10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-full px-4 py-1.5 text-sm font-medium text-amber-300 mb-5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Scheduled Maintenance
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
          {config.business_name}
        </h1>
        <p className="text-brand-200 text-lg leading-relaxed mb-8">
          {config.maintenance_message ||
            'The site is currently undergoing scheduled maintenance. We will be back shortly.'}
        </p>

        {config.maintenance_end && (
          <p className="text-brand-400 text-sm mb-8">
            Expected back online:{' '}
            <span className="text-brand-200 font-medium">
              {new Date(config.maintenance_end).toLocaleString('en-AU', {
                timeZone: 'Australia/Sydney',
                dateStyle: 'medium',
                timeStyle: 'short',
              })} AEST
            </span>
          </p>
        )}

        {config.business_phone && (
          <a
            href={`tel:${config.business_phone.replace(/\s/g, '')}`}
            className="inline-flex items-center gap-2 border border-white/25 text-white font-semibold py-2.5 px-6 rounded-lg text-sm hover:bg-white/10 hover:border-white/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call {config.business_phone}
          </a>
        )}
      </div>

      <p className="absolute bottom-6 text-brand-500 text-xs">
        © {new Date().getFullYear()} {config.business_name}
      </p>
    </div>
  );
}
